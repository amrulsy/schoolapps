const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../../db');
require('dotenv').config();

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'R4h4s!a_SIAS_T0k3n_2026';

// LOGIN API
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: 'Username dan password wajib diisi' });
        }

        const [rows] = await pool.query('SELECT * FROM users WHERE username = ?', [username]);
        if (rows.length === 0) {
            return res.status(401).json({ error: 'Username tidak ditemukan' });
        }

        const user = rows[0];

        // Validasi password dengan bcrypt
        const isValid = await bcrypt.compare(password, user.password_hash);
        if (!isValid) {
            return res.status(401).json({ error: 'Password salah' });
        }

        // Jika user diblokir dll bisa divalidasi disini

        // Generate JWT Token (1 hari)
        const token = jwt.sign(
            { id: user.id, username: user.username, role: user.role, nama: user.nama },
            JWT_SECRET,
            { expiresIn: '1d' }
        );

        res.json({
            success: true,
            token,
            user: {
                id: user.id,
                nama: user.nama,
                username: user.username,
                role: user.role
            }
        });

    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: 'Terjadi kesalahan pada server' });
    }
});

// GET CURRENT USER API (Gunakan authMiddleware di router mount untuk memproteksi ini)
router.get('/me', async (req, res) => {
    try {
        // req.user diset oleh authMiddleware
        const [rows] = await pool.query('SELECT id, nama, username, role FROM users WHERE id = ?', [req.user.id]);

        if (rows.length === 0) {
            return res.status(404).json({ error: 'User tidak ditemukan' });
        }

        res.json(rows[0]);
    } catch (err) {
        res.status(500).json({ error: 'Terjadi kesalahan pada server' });
    }
});

module.exports = router;
