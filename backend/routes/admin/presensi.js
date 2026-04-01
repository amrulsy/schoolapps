const express = require('express');
const router = express.Router();
const pool = require('../../db');
const waService = require('../../services/whatsappService');
const AttendanceController = require('../../controllers/AttendanceController');

// Settings Routes
router.get('/settings', AttendanceController.getSettings);
router.post('/settings', AttendanceController.updateSettings);

// GET /api/admin/presensi?date=YYYY-MM-DD&kelasId=ID
// Fetch attendance records for a specific date and class
router.get('/', async (req, res) => {
    try {
        const { date, kelasId } = req.query;
        if (!date || !kelasId) {
            return res.status(400).json({ error: 'Tanggal dan KelasId wajib diisi' });
        }

        // 1. Get all students in the class
        const [students] = await pool.query(
            'SELECT id, nisn, nama FROM siswa WHERE kelas_id = ? AND status = "aktif" ORDER BY nama ASC',
            [kelasId]
        );

        // 2. Get existing attendance for these students on the specific date
        const [attendance] = await pool.query(
            'SELECT siswa_id, status, keterangan FROM siswa_presensi WHERE tanggal = ? AND siswa_id IN (SELECT id FROM siswa WHERE kelas_id = ?)',
            [date, kelasId]
        );

        // 3. Map attendance to students
        const attendanceMap = {};
        attendance.forEach(a => {
            attendanceMap[a.siswa_id] = { status: a.status, keterangan: a.keterangan };
        });

        const result = students.map(s => ({
            ...s,
            status: attendanceMap[s.id]?.status || null,
            keterangan: attendanceMap[s.id]?.keterangan || ''
        }));

        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/admin/presensi/rekap?kelasId=ID&startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
// Fetch aggregated attendance records for a specific date range and class
router.get('/rekap', async (req, res) => {
    try {
        const { kelasId, startDate, endDate } = req.query;
        if (!kelasId || !startDate || !endDate) {
            return res.status(400).json({ error: 'Kelas, Start Date, dan End Date wajib diisi' });
        }

        // 1. Get all students in the class
        const [students] = await pool.query(
            'SELECT id, nisn, nama FROM siswa WHERE kelas_id = ? AND status = "aktif" ORDER BY nama ASC',
            [kelasId]
        );

        if (students.length === 0) return res.json([]);

        // 2. Get attendance aggregation for these students
        const [attendance] = await pool.query(
            `SELECT siswa_id, 
                    SUM(CASE WHEN status = 'hadir' THEN 1 ELSE 0 END) as hadir,
                    SUM(CASE WHEN status = 'sakit' THEN 1 ELSE 0 END) as sakit,
                    SUM(CASE WHEN status = 'izin' THEN 1 ELSE 0 END) as izin,
                    SUM(CASE WHEN status = 'alpha' THEN 1 ELSE 0 END) as alpha
             FROM siswa_presensi 
             WHERE DATE(tanggal) BETWEEN ? AND ? 
               AND siswa_id IN (SELECT id FROM siswa WHERE kelas_id = ?)
             GROUP BY siswa_id`,
            [startDate, endDate, kelasId]
        );

        // 3. Get raw attendance records for export details
        const [rawLogs] = await pool.query(
            `SELECT siswa_id, 
                    DATE_FORMAT(tanggal, '%Y-%m-%d') as tgl, 
                    UNIX_TIMESTAMP(created_at) * 1000 as created_at_ms,
                    status
             FROM siswa_presensi 
             WHERE DATE(tanggal) BETWEEN ? AND ? 
               AND siswa_id IN (SELECT id FROM siswa WHERE kelas_id = ?)`,
            [startDate, endDate, kelasId]
        );

        const detailsMap = {};
        rawLogs.forEach(row => {
            if (!detailsMap[row.siswa_id]) detailsMap[row.siswa_id] = {};
            
            let jamStr = '-';
            if (row.created_at_ms) {
                // Parse UNIX timestamp to get Local Time explicitly in WIB (+07:00)
                try {
                    jamStr = new Date(row.created_at_ms).toLocaleTimeString('id-ID', { timeZone: 'Asia/Jakarta', hour: '2-digit', minute: '2-digit', hour12: false });
                } catch(e) {
                    jamStr = new Date(row.created_at_ms).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false });
                }
            }

            detailsMap[row.siswa_id][row.tgl] = {
                status: row.status,
                jam: jamStr
            };
        });

        // 4. Map attendance to students
        const attendanceMap = {};
        attendance.forEach(a => {
            attendanceMap[a.siswa_id] = { 
                hadir: parseInt(a.hadir) || 0, 
                sakit: parseInt(a.sakit) || 0, 
                izin: parseInt(a.izin) || 0, 
                alpha: parseInt(a.alpha) || 0 
            };
        });

        const result = students.map(s => {
            const stats = attendanceMap[s.id] || { hadir: 0, sakit: 0, izin: 0, alpha: 0 };
            const total = stats.hadir + stats.sakit + stats.izin + stats.alpha;
            return {
                ...s,
                ...stats,
                total,
                persentase: total > 0 ? parseFloat(((stats.hadir / total) * 100).toFixed(1)) : 0,
                details: detailsMap[s.id] || {}
            };
        });

        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/admin/presensi/bulk
// Batch insert/update attendance
router.post('/bulk', async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        const { date, attendanceData, sendWA } = req.body;

        if (!date || !attendanceData || !Array.isArray(attendanceData)) {
            return res.status(400).json({ error: 'Data tidak valid' });
        }

        for (const item of attendanceData) {
            if (!item.status) continue;

            await connection.query(`
                INSERT INTO siswa_presensi (siswa_id, tanggal, status, keterangan)
                VALUES (?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE status = VALUES(status), keterangan = VALUES(keterangan)
            `, [item.siswa_id, date, item.status, item.keterangan || null]);
        }

        await connection.commit();

        // Kirim WA untuk siswa yang tidak hadir (alpha, sakit, izin)
        if (sendWA) {
            (async () => {
                try {
                    const absentStudents = attendanceData.filter(s => 
                        s.status && s.status !== 'hadir'
                    );

                    // Ambil nama kelas
                    let kelasNama = '';
                    if (absentStudents.length > 0) {
                        const [kelasRows] = await pool.query(
                            'SELECT k.nama FROM kelas k JOIN siswa s ON s.kelas_id = k.id WHERE s.id = ? LIMIT 1',
                            [absentStudents[0].siswa_id]
                        );
                        kelasNama = kelasRows[0]?.nama || '';
                    }

                    const statusLabel = { sakit: 'Sakit 🤒', izin: 'Izin 📋', alpha: 'Alpha (Tanpa Keterangan) ⚠️' };
                    const formattedDate = new Date(date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

                    for (const item of absentStudents) {
                        // Ambil data siswa + nomor HP orang tua
                        const [siswaRows] = await pool.query('SELECT nama, telp FROM siswa WHERE id = ?', [item.siswa_id]);
                        const [ortuRows] = await pool.query('SELECT hp, jenis FROM siswa_orangtua WHERE siswa_id = ?', [item.siswa_id]);

                        const siswa = siswaRows[0];
                        const phoneTargets = [];
                        if (siswa?.telp) phoneTargets.push(siswa.telp);
                        ortuRows.forEach(o => { if (o.hp) phoneTargets.push(o.hp); });

                        if (phoneTargets.length > 0) {
                            const message = `*📢 INFORMASI KEHADIRAN*\n*SMK PPRQ - SIAS*\n\nYth. Bapak/Ibu Orang Tua/Wali,\n\nDengan ini kami informasikan bahwa:\n\nNama: *${siswa?.nama || '-'}*\nKelas: *${kelasNama}*\nTanggal: *${formattedDate}*\nStatus: *${statusLabel[item.status] || item.status}*${item.keterangan ? `\nKeterangan: ${item.keterangan}` : ''}\n\nMohon perhatian dan konfirmasi dari Bapak/Ibu.\nTerima kasih. 🙏`;

                            const uniquePhones = [...new Set(phoneTargets)];
                            for (const phone of uniquePhones) {
                                await waService.sendMessage(phone, message);
                            }
                        }
                    }
                } catch (waErr) {
                    console.error('[Presensi WA] Gagal kirim notifikasi:', waErr.message);
                }
            })();
        }

        res.json({ success: true, message: `Berhasil menyimpan ${attendanceData.length} data presensi.` });
    } catch (err) {
        await connection.rollback();
        res.status(500).json({ error: err.message });
    } finally {
        connection.release();
    }
});

module.exports = router;
