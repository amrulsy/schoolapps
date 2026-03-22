const express = require('express');
const router = express.Router();
const pool = require('../../db');

// Daftar kontak siswa untuk percakapan
router.get('/contacts', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT s.id, s.nama, s.nisn, k.nama as kelas_nama,
                   (SELECT COUNT(*) FROM pesan p WHERE p.pengirim_id = s.id AND p.pengirim_type = 'student' AND p.is_read = FALSE) as unread_count,
                   (SELECT pesan FROM pesan p WHERE (p.pengirim_id = s.id AND p.pengirim_type = 'student') OR (p.penerima_id = s.id AND p.penerima_type = 'student') ORDER BY waktu DESC LIMIT 1) as last_message,
                   (SELECT waktu FROM pesan p WHERE (p.pengirim_id = s.id AND p.pengirim_type = 'student') OR (p.penerima_id = s.id AND p.penerima_type = 'student') ORDER BY waktu DESC LIMIT 1) as last_activity
            FROM siswa s
            LEFT JOIN kelas k ON s.kelas_id = k.id
            ORDER BY unread_count DESC, last_activity DESC
        `);
        res.json(rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// Mengambil pesan dengan siswa tertentu
router.get('/:siswa_id', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT * FROM pesan 
            WHERE (pengirim_id = ? AND pengirim_type = 'student')
               OR (penerima_id = ? AND penerima_type = 'student')
            ORDER BY waktu ASC
        `, [req.params.siswa_id, req.params.siswa_id]);

        // Tandai terbaca oleh admin
        await pool.query(`
            UPDATE pesan SET is_read = TRUE 
            WHERE pengirim_id = ? AND pengirim_type = 'student' AND is_read = FALSE
        `, [req.params.siswa_id]);

        res.json(rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// Admin kirim pesan ke siswa
router.post('/', async (req, res) => {
    try {
        const { penerima_id, text, admin_id } = req.body;
        const [result] = await pool.query(`
            INSERT INTO pesan (pengirim_id, pengirim_type, penerima_id, penerima_type, pesan, waktu, is_read) 
            VALUES (?, 'admin', ?, 'student', ?, UTC_TIMESTAMP(), FALSE)
        `, [admin_id || 1, penerima_id, text]);
        res.status(201).json({ id: result.insertId, success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
