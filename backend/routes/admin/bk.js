const express = require('express');
const router = express.Router();
const pool = require('../../db');

// Katagori
router.get('/kategori', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM bk_kategori');
        res.json(rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/kategori', async (req, res) => {
    try {
        const { nama, tipe, poin } = req.body;
        const [result] = await pool.query('INSERT INTO bk_kategori (nama, tipe, poin) VALUES (?, ?, ?)', [nama, tipe, poin]);
        res.status(201).json({ id: result.insertId, success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/kategori/:id', async (req, res) => {
    try {
        const [check] = await pool.query('SELECT id FROM bk_catatan WHERE bk_kategori_id = ? LIMIT 1', [req.params.id]);
        if (check.length > 0) return res.status(400).json({ error: 'Kategori sedang digunakan, tidak bisa dihapus.' });

        await pool.query('DELETE FROM bk_kategori WHERE id = ?', [req.params.id]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// Catatan BK
router.get('/', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT c.*, s.nama as siswa_nama, s.nisn, k.nama as kelas_nama, kat.nama as kategori_nama, kat.tipe
            FROM bk_catatan c
            JOIN siswa s ON c.siswa_id = s.id
            LEFT JOIN kelas k ON s.kelas_id = k.id
            JOIN bk_kategori kat ON c.bk_kategori_id = kat.id
            ORDER BY c.tanggal DESC
        `);
        res.json(rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', async (req, res) => {
    try {
        const { siswa_id, bk_kategori_id, tanggal, keterangan, user_id } = req.body;
        const [kat] = await pool.query('SELECT poin FROM bk_kategori WHERE id = ?', [bk_kategori_id]);
        if (kat.length === 0) return res.status(404).json({ error: 'Kategori tidak ditemukan' });

        const [result] = await pool.query(
            'INSERT INTO bk_catatan (siswa_id, bk_kategori_id, tanggal, keterangan, poin, user_id) VALUES (?, ?, ?, ?, ?, ?)',
            [siswa_id, bk_kategori_id, tanggal, keterangan, kat[0].poin, user_id || null]
        );
        res.status(201).json({ id: result.insertId, success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM bk_catatan WHERE id = ?', [req.params.id]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
