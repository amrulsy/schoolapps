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
