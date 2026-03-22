const express = require('express');
const router = express.Router();
const pool = require('../../db');

// GET /api/admin/jadwal
router.get('/', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT j.*, g.nama as guru_nama, k.nama as kelas_nama, m.nama as mapel_nama,
                   jp.jam_ke, jp.jam_mulai, jp.jam_selesai, jp.tipe as jam_tipe
            FROM jadwal_pelajaran j
            JOIN guru g ON j.guru_id = g.id
            JOIN kelas k ON j.kelas_id = k.id
            JOIN mata_pelajaran m ON j.mapel_id = m.id
            JOIN jam_pelajaran jp ON j.jam_pelajaran_id = jp.id
            ORDER BY 
                CASE j.hari 
                    WHEN 'Senin' THEN 1 
                    WHEN 'Selasa' THEN 2 
                    WHEN 'Rabu' THEN 3 
                    WHEN 'Kamis' THEN 4 
                    WHEN 'Jumat' THEN 5 
                    WHEN 'Sabtu' THEN 6 
                    WHEN 'Minggu' THEN 7 
                END, 
                jp.jam_mulai ASC
        `);
        res.json(rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/admin/jadwal
router.post('/', async (req, res) => {
    try {
        const { guru_id, kelas_id, mapel_id, hari, jam_pelajaran_id } = req.body;
        const [result] = await pool.query(`
            INSERT INTO jadwal_pelajaran (guru_id, kelas_id, mapel_id, hari, jam_pelajaran_id)
            VALUES (?, ?, ?, ?, ?)
        `, [guru_id, kelas_id, mapel_id, hari, jam_pelajaran_id]);
        res.status(201).json({ id: result.insertId, success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// PUT /api/admin/jadwal/:id
router.put('/:id', async (req, res) => {
    try {
        const { guru_id, kelas_id, mapel_id, hari, jam_pelajaran_id } = req.body;
        await pool.query(`
            UPDATE jadwal_pelajaran 
            SET guru_id = ?, kelas_id = ?, mapel_id = ?, hari = ?, jam_pelajaran_id = ?
            WHERE id = ?
        `, [guru_id, kelas_id, mapel_id, hari, jam_pelajaran_id, req.params.id]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// DELETE /api/admin/jadwal/:id
router.delete('/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM jadwal_pelajaran WHERE id = ?', [req.params.id]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
