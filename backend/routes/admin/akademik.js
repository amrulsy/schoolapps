const express = require('express');
const router = express.Router();
const pool = require('../../db');

// Mata Pelajaran
router.get('/mapel', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM mata_pelajaran ORDER BY nama');
        res.json(rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/mapel', async (req, res) => {
    try {
        const { nama, tingkat } = req.body;
        const [result] = await pool.query('INSERT INTO mata_pelajaran (nama, tingkat) VALUES (?, ?)', [nama, tingkat || null]);
        res.status(201).json({ id: result.insertId, success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/mapel/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM mata_pelajaran WHERE id = ?', [req.params.id]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// Nilai Akademik
router.get('/nilai', async (req, res) => {
    try {
        const { tahun_ajaran_id, semester, kelas_id } = req.query;
        let query = `
            SELECT n.*, s.nama as siswa_nama, s.nisn, k.nama as kelas_nama, m.nama as mapel_nama
            FROM nilai_siswa n
            JOIN siswa s ON n.siswa_id = s.id
            LEFT JOIN kelas k ON s.kelas_id = k.id
            JOIN mata_pelajaran m ON n.mapel_id = m.id
            WHERE 1=1
        `;
        const params = [];
        if (tahun_ajaran_id) { query += ' AND n.tahun_ajaran_id = ?'; params.push(tahun_ajaran_id); }
        if (semester) { query += ' AND n.semester = ?'; params.push(semester); }
        if (kelas_id) { query += ' AND s.kelas_id = ?'; params.push(kelas_id); }
        query += ' ORDER BY s.nama, m.nama';

        const [rows] = await pool.query(query, params);
        res.json(rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/nilai', async (req, res) => {
    try {
        const { siswa_id, mapel_id, tahun_ajaran_id, semester, tugas, uts, uas } = req.body;
        // Hitung nilai akhir otomatis: 30% tugas + 30% UTS + 40% UAS
        const akhir = (Number(tugas) * 0.3) + (Number(uts) * 0.3) + (Number(uas) * 0.4);

        const [result] = await pool.query(
            `INSERT INTO nilai_siswa (siswa_id, mapel_id, tahun_ajaran_id, semester, tugas, uts, uas, akhir) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?) 
             ON DUPLICATE KEY UPDATE tugas=?, uts=?, uas=?, akhir=?`,
            [siswa_id, mapel_id, tahun_ajaran_id, semester, tugas, uts, uas, akhir, tugas, uts, uas, akhir]
        );
        res.status(201).json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
