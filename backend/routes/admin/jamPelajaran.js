const express = require('express');
const router = express.Router();
const pool = require('../../db');

// GET /api/admin/jam-pelajaran
router.get('/', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM jam_pelajaran ORDER BY jam_ke ASC');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/admin/jam-pelajaran
router.post('/', async (req, res) => {
    try {
        const { jam_ke, jam_mulai, jam_selesai, tipe } = req.body;
        const [result] = await pool.query(
            'INSERT INTO jam_pelajaran (jam_ke, jam_mulai, jam_selesai, tipe) VALUES (?, ?, ?, ?)',
            [jam_ke, jam_mulai, jam_selesai, tipe || 'Pelajaran']
        );
        res.status(201).json({ id: result.insertId, success: true });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ error: 'Jam ke- tersebut sudah ada. Silakan gunakan urutan jam yang lain.' });
        }
        res.status(500).json({ error: err.message });
    }
});

// PUT /api/admin/jam-pelajaran/:id
router.put('/:id', async (req, res) => {
    try {
        const { jam_ke, jam_mulai, jam_selesai, tipe } = req.body;
        await pool.query(
            'UPDATE jam_pelajaran SET jam_ke = ?, jam_mulai = ?, jam_selesai = ?, tipe = ? WHERE id = ?',
            [jam_ke, jam_mulai, jam_selesai, tipe, req.params.id]
        );
        res.json({ success: true });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ error: 'Jam ke- tersebut sudah ada. Silakan gunakan urutan jam yang lain.' });
        }
        res.status(500).json({ error: err.message });
    }
});

// DELETE /api/admin/jam-pelajaran/:id
router.delete('/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM jam_pelajaran WHERE id = ?', [req.params.id]);
        res.json({ success: true });
    } catch (err) {
        if (err.code === 'ER_ROW_IS_REFERENCED_2') {
            return res.status(400).json({ error: 'Tidak dapat menghapus jam pelajaran karena sedang digunakan di Jadwal Pelajaran.' });
        }
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
