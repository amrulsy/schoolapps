const express = require('express');
const router = express.Router();
const pool = require('../../db');

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
        const { date, attendanceData } = req.body; // attendanceData: [{siswa_id, status, keterangan}, ...]

        if (!date || !attendanceData || !Array.isArray(attendanceData)) {
            return res.status(400).json({ error: 'Data tidak valid' });
        }

        for (const item of attendanceData) {
            if (!item.status) continue; // Skip if no status selected

            await connection.query(`
                INSERT INTO siswa_presensi (siswa_id, tanggal, status, keterangan)
                VALUES (?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE status = VALUES(status), keterangan = VALUES(keterangan)
            `, [item.siswa_id, date, item.status, item.keterangan || null]);
        }

        await connection.commit();
        res.json({ success: true, message: `Berhasil menyimpan ${attendanceData.length} data presensi.` });
    } catch (err) {
        await connection.rollback();
        res.status(500).json({ error: err.message });
    } finally {
        connection.release();
    }
});

module.exports = router;
