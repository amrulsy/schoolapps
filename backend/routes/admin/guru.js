const express = require('express');
const router = express.Router();
const pool = require('../../db');
const bcrypt = require('bcryptjs');

// GET /api/admin/guru
router.get('/', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT g.id, g.nip, g.nama, g.user_id, u.username
            FROM guru g
            LEFT JOIN users u ON g.user_id = u.id
            ORDER BY g.nama ASC
        `);
        res.json(rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/admin/guru
router.post('/', async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        const { nip, nama, username, password } = req.body;

        let userId = null;
        if (username && password) {
            // Check if username exists
            const [users] = await connection.query('SELECT id FROM users WHERE username = ?', [username]);
            if (users.length > 0) throw new Error('Username sudah digunakan');

            const hash = await bcrypt.hash(password, 10);
            const [userRes] = await connection.query(
                `INSERT INTO users (nama, username, password_hash, role) VALUES (?, ?, ?, 'guru')`,
                [nama, username, hash]
            );
            userId = userRes.insertId;
        } else if (username && !password) {
            throw new Error('Password wajib diisi untuk username baru');
        }

        const [guruRes] = await connection.query(
            `INSERT INTO guru (nip, nama, user_id) VALUES (?, ?, ?)`,
            [nip || null, nama, userId]
        );

        await connection.commit();
        res.status(201).json({ id: guruRes.insertId, success: true });
    } catch (err) {
        await connection.rollback();
        res.status(500).json({ error: err.message });
    } finally {
        connection.release();
    }
});

// PUT /api/admin/guru/:id
router.put('/:id', async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        const { nip, nama, username, password } = req.body;

        // Update guru
        await connection.query('UPDATE guru SET nip = ?, nama = ? WHERE id = ?', [nip || null, nama, req.params.id]);

        // Find user_id
        const [guruRows] = await connection.query('SELECT user_id FROM guru WHERE id = ?', [req.params.id]);
        if (guruRows.length > 0 && guruRows[0].user_id) {
            const userId = guruRows[0].user_id;
            // Jika ada username yg mau diupdate, cek duplikat
            if (username) {
                const [checkUsers] = await connection.query('SELECT id FROM users WHERE username = ? AND id != ?', [username, userId]);
                if (checkUsers.length > 0) throw new Error('Username sudah digunakan oleh akun lain');
                await connection.query('UPDATE users SET nama = ?, username = ? WHERE id = ?', [nama, username, userId]);
            }
            if (password) {
                const hash = await bcrypt.hash(password, 10);
                await connection.query('UPDATE users SET password_hash = ? WHERE id = ?', [hash, userId]);
            }
        } else if (guruRows.length > 0 && username && password) {
            // Guru didn't have a user_id, create one
            const [checkUsers] = await connection.query('SELECT id FROM users WHERE username = ?', [username]);
            if (checkUsers.length > 0) throw new Error('Username sudah digunakan');

            const hash = await bcrypt.hash(password, 10);
            const [userRes] = await connection.query(
                `INSERT INTO users (nama, username, password_hash, role) VALUES (?, ?, ?, 'guru')`,
                [nama, username, hash]
            );
            await connection.query('UPDATE guru SET user_id = ? WHERE id = ?', [userRes.insertId, req.params.id]);
        }

        await connection.commit();
        res.json({ success: true });
    } catch (err) {
        await connection.rollback();
        res.status(500).json({ error: err.message });
    } finally {
        connection.release();
    }
});

// DELETE /api/admin/guru/:id
router.delete('/:id', async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        const [guru] = await connection.query('SELECT user_id FROM guru WHERE id = ?', [req.params.id]);

        await connection.query('DELETE FROM guru WHERE id = ?', [req.params.id]);

        if (guru.length > 0 && guru[0].user_id) {
            await connection.query('DELETE FROM users WHERE id = ?', [guru[0].user_id]);
        }

        await connection.commit();
        res.json({ success: true });
    } catch (err) {
        await connection.rollback();
        res.status(500).json({ error: err.message });
    } finally {
        connection.release();
    }
});

module.exports = router;
