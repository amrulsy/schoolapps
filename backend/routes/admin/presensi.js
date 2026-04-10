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

        // 1. Get all active students in the class
        const [students] = await pool.query(
            'SELECT id, nisn, nama FROM siswa WHERE kelas_id = ? AND status = "aktif" ORDER BY nama ASC',
            [kelasId]
        );

        // 2. Get existing attendance for these students on the specific date (R-10: JOIN instead of subquery)
        const [attendance] = await pool.query(
            `SELECT sp.siswa_id, sp.status, sp.keterangan 
             FROM siswa_presensi sp
             JOIN siswa s ON sp.siswa_id = s.id
             WHERE sp.tanggal = ? AND s.kelas_id = ?`,
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

        // R-7: Get students — include those who were active during the date range
        //       (e.g. already graduated/transferred but had attendance records)
        const [students] = await pool.query(
            `SELECT DISTINCT s.id, s.nisn, s.nama FROM siswa s
             LEFT JOIN siswa_presensi sp ON sp.siswa_id = s.id AND sp.tanggal BETWEEN ? AND ?
             WHERE s.kelas_id = ? AND (s.status = 'aktif' OR sp.id IS NOT NULL)
             ORDER BY s.nama ASC`,
            [startDate, endDate, kelasId]
        );

        if (students.length === 0) return res.json([]);

        const studentIds = students.map(s => s.id);

        // 2. Get attendance aggregation (R-10: use parameterized IN list)
        const [attendance] = await pool.query(
            `SELECT siswa_id, 
                    SUM(CASE WHEN status = 'hadir' THEN 1 ELSE 0 END) as hadir,
                    SUM(CASE WHEN status = 'sakit' THEN 1 ELSE 0 END) as sakit,
                    SUM(CASE WHEN status = 'izin' THEN 1 ELSE 0 END) as izin,
                    SUM(CASE WHEN status = 'alpha' THEN 1 ELSE 0 END) as alpha
             FROM siswa_presensi 
             WHERE tanggal BETWEEN ? AND ? 
               AND siswa_id IN (?)
             GROUP BY siswa_id`,
            [startDate, endDate, studentIds]
        );

        // 3. Get raw attendance records for export details (R-10: optimized query)
        const [rawLogs] = await pool.query(
            `SELECT siswa_id, 
                    DATE_FORMAT(tanggal, '%Y-%m-%d') as tgl, 
                    jam_masuk,
                    jam_pulang,
                    status
             FROM siswa_presensi 
             WHERE tanggal BETWEEN ? AND ? 
               AND siswa_id IN (?)`,
            [startDate, endDate, studentIds]
        );

        const detailsMap = {};
        rawLogs.forEach(row => {
            if (!detailsMap[row.siswa_id]) detailsMap[row.siswa_id] = {};
            
            let jamStr = '-';
            if (row.jam_masuk) {
                try {
                    jamStr = new Date(row.jam_masuk).toLocaleTimeString('id-ID', { timeZone: 'Asia/Jakarta', hour: '2-digit', minute: '2-digit', hour12: false });
                } catch(e) {
                    jamStr = '-';
                }
            }

            let jamPulangStr = '-';
            if (row.jam_pulang) {
                try {
                    jamPulangStr = new Date(row.jam_pulang).toLocaleTimeString('id-ID', { timeZone: 'Asia/Jakarta', hour: '2-digit', minute: '2-digit', hour12: false });
                } catch(e) {
                    jamPulangStr = '-';
                }
            }

            // R-17: Include jam_masuk and jam_pulang in details
            detailsMap[row.siswa_id][row.tgl] = {
                status: row.status,
                jam: jamStr,
                jam_pulang: jamPulangStr
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

        // Kirim WA HANYA untuk siswa yang TIDAK hadir (sakit, izin, alpha)
        // Siswa hadir TIDAK dikirim WA dari sini karena sudah otomatis terkirim via RFID Gate.
        if (sendWA) {
            (async () => {
                try {
                    const absentStudents = attendanceData.filter(s => 
                        s.status && s.status !== 'hadir'
                    );

                    if (absentStudents.length === 0) return; // Semua hadir, tidak perlu kirim WA

                    // Ambil nama kelas
                    const [kelasRows] = await pool.query(
                        'SELECT k.nama FROM kelas k JOIN siswa s ON s.kelas_id = k.id WHERE s.id = ? LIMIT 1',
                        [absentStudents[0].siswa_id]
                    );
                    const kelasNama = kelasRows[0]?.nama || '';

                    const statusLabel = { sakit: 'Sakit 🤒', izin: 'Izin 📋', alpha: 'Alpha (Tanpa Keterangan) ⚠️' };
                    const formattedDate = new Date(date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

                    for (const item of absentStudents) {
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
                                try {
                                    await waService.sendMessage(phone, message);
                                    // Log WA success
                                    await pool.query(
                                        'INSERT INTO wa_notification_log (siswa_id, phone, message_type, status) VALUES (?, ?, ?, ?)',
                                        [item.siswa_id, phone, item.status, 'sent']
                                    ).catch(() => {});
                                } catch (waErr) {
                                    console.error('[Presensi WA] Gagal kirim:', waErr.message);
                                    // Log WA failure
                                    await pool.query(
                                        'INSERT INTO wa_notification_log (siswa_id, phone, message_type, status, error_message) VALUES (?, ?, ?, ?, ?)',
                                        [item.siswa_id, phone, item.status, 'failed', waErr.message]
                                    ).catch(() => {});
                                }
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

// R-16: GET /api/admin/presensi/stats
// Quick attendance summary for today (dashboard widget)
router.get('/stats', async (req, res) => {
    try {
        // Get today in WIB
        const rawNow = new Date();
        const formatter = new Intl.DateTimeFormat('en-US', {
            timeZone: 'Asia/Jakarta',
            year: 'numeric', month: '2-digit', day: '2-digit', hour12: false
        });
        const parts = formatter.formatToParts(rawNow);
        const p = {};
        parts.forEach(part => p[part.type] = part.value);
        const today = `${p.year}-${p.month}-${p.day}`;

        // Count from siswa_presensi
        const [presensiStats] = await pool.query(`
            SELECT 
                SUM(CASE WHEN status = 'hadir' THEN 1 ELSE 0 END) as hadir,
                SUM(CASE WHEN status = 'sakit' THEN 1 ELSE 0 END) as sakit,
                SUM(CASE WHEN status = 'izin' THEN 1 ELSE 0 END) as izin,
                SUM(CASE WHEN status = 'alpha' THEN 1 ELSE 0 END) as alpha
            FROM siswa_presensi WHERE tanggal = ?
        `, [today]);

        // Count terlambat from attendances
        const [terlambatStats] = await pool.query(`
            SELECT COUNT(*) as terlambat 
            FROM attendances WHERE tanggal = ? AND status = 'Terlambat'
        `, [today]);

        // Total active students
        const [totalRows] = await pool.query(`SELECT COUNT(*) as total FROM siswa WHERE status = 'aktif'`);

        const stats = presensiStats[0] || {};
        res.json({
            tanggal: today,
            total_siswa_aktif: totalRows[0]?.total || 0,
            hadir: parseInt(stats.hadir) || 0,
            terlambat: parseInt(terlambatStats[0]?.terlambat) || 0,
            sakit: parseInt(stats.sakit) || 0,
            izin: parseInt(stats.izin) || 0,
            alpha: parseInt(stats.alpha) || 0,
            belum_absen: (totalRows[0]?.total || 0) - (parseInt(stats.hadir) || 0) - (parseInt(stats.sakit) || 0) - (parseInt(stats.izin) || 0) - (parseInt(stats.alpha) || 0)
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
