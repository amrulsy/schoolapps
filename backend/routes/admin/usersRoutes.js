const express = require('express');
const router = express.Router();
const pool = require('../../db');
const bcrypt = require('bcryptjs');
const { authMiddleware } = require('../../middleware/auth');

// --- USERS ROUTES ---
router.get('/api/users', authMiddleware, async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT id, nama, username, role FROM users');
        res.json(rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/api/users', authMiddleware, async (req, res) => {
    try {
        // Only admin should be able to create users
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Hanya Admin yang dapat mengelola user.' });
        }

        const { nama, username, password, role } = req.body;
        if (!nama || !username || !password || !role) {
            return res.status(400).json({ error: 'Semua field wajib diisi.' });
        }

        const password_hash = await bcrypt.hash(password, 10);
        const [result] = await pool.query(
            'INSERT INTO users (nama, username, password_hash, role) VALUES (?, ?, ?, ?)',
            [nama, username, password_hash, role]
        );
        res.status(201).json({ id: result.insertId, nama, username, role });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') return res.status(400).json({ error: 'Username sudah digunakan.' });
        res.status(500).json({ error: err.message });
    }
});

router.put('/api/users/:id', authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Hanya Admin yang dapat mengelola user.' });
        }

        const { nama, username, password, role } = req.body;
        const userId = req.params.id;

        if (password) {
            const password_hash = await bcrypt.hash(password, 10);
            await pool.query(
                'UPDATE users SET nama = ?, username = ?, password_hash = ?, role = ? WHERE id = ?',
                [nama, username, password_hash, role, userId]
            );
        } else {
            await pool.query(
                'UPDATE users SET nama = ?, username = ?, role = ? WHERE id = ?',
                [nama, username, role, userId]
            );
        }
        res.json({ success: true });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') return res.status(400).json({ error: 'Username sudah digunakan.' });
        res.status(500).json({ error: err.message });
    }
});

router.delete('/api/users/:id', authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Hanya Admin yang dapat mengelola user.' });
        }
        const userId = req.params.id;
        
        // Prevent deleting self
        if (Number(userId) === req.user.id) {
            return res.status(400).json({ error: 'Anda tidak dapat menghapus akun Anda sendiri.' });
        }

        await pool.query('DELETE FROM users WHERE id = ?', [userId]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});


module.exports = router;