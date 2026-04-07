const express = require('express');
const router = express.Router();
const pool = require('../../db');

// --- WALI KELAS ROUTES (ADMIN) ---
router.get('/api/wali-kelas', async (req, res) => {
    try {
        const { tahun_ajaran_id } = req.query;
        let query = `
            SELECT wk.*, g.nama as guru_nama, g.nip, k.nama as kelas_nama
            FROM wali_kelas wk
            JOIN guru g ON wk.guru_id = g.id
            JOIN kelas k ON wk.kelas_id = k.id
        `;
        const params = [];
        if (tahun_ajaran_id) { query += ' WHERE wk.tahun_ajaran_id = ?'; params.push(tahun_ajaran_id); }
        query += ' ORDER BY k.nama ASC';
        const [rows] = await pool.query(query, params);
        res.json(rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/api/wali-kelas', async (req, res) => {
    try {
        const { guru_id, kelas_id, tahun_ajaran_id } = req.body;
        if (!guru_id || !kelas_id) return res.status(400).json({ error: 'guru_id and kelas_id are required' });
        const [result] = await pool.query(
            `INSERT INTO wali_kelas (guru_id, kelas_id, tahun_ajaran_id) VALUES (?, ?, ?)
             ON DUPLICATE KEY UPDATE guru_id = VALUES(guru_id)`,
            [guru_id, kelas_id, tahun_ajaran_id]
        );
        res.status(201).json({ success: true, id: result.insertId });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/api/wali-kelas/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM wali_kelas WHERE id = ?', [req.params.id]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});




module.exports = router;