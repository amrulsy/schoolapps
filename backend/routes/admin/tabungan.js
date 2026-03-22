const express = require('express');
const router = express.Router();
const pool = require('../../db');

// Get all tabungan records with student details
router.get('/', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT t.*, s.nama as siswa_nama, s.nisn, k.nama as kelas_nama
            FROM tabungan t
            JOIN siswa s ON t.siswa_id = s.id
            LEFT JOIN kelas k ON s.kelas_id = k.id
            ORDER BY t.tanggal DESC
        `);
        res.json(rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// Add new tabungan transaction
router.post('/', async (req, res) => {
    try {
        const { siswa_id, tipe, nominal, note, user_id } = req.body;
        const [result] = await pool.query(
            'INSERT INTO tabungan (siswa_id, tanggal, tipe, nominal, note, user_id) VALUES (?, UTC_TIMESTAMP(), ?, ?, ?, ?)',
            [siswa_id, tipe, nominal, note, user_id || null]
        );
        res.status(201).json({ id: result.insertId, success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// Delete tabungan transaction
router.delete('/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM tabungan WHERE id = ?', [req.params.id]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// Get saving summary per student
router.get('/summary', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT 
                s.id as siswa_id, 
                s.nama as siswa_nama, 
                s.nisn, 
                k.nama as kelas_nama,
                stats.total_setor,
                stats.total_tarik,
                (stats.total_setor - stats.total_tarik) as saldo
            FROM siswa s
            LEFT JOIN kelas k ON s.kelas_id = k.id
            JOIN (
                SELECT 
                    siswa_id, 
                    SUM(CASE WHEN tipe = 'setor' THEN nominal ELSE 0 END) as total_setor, 
                    SUM(CASE WHEN tipe = 'tarik' THEN nominal ELSE 0 END) as total_tarik
                FROM tabungan 
                GROUP BY siswa_id
            ) stats ON s.id = stats.siswa_id
            ORDER BY saldo DESC
        `);
        res.json(rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
