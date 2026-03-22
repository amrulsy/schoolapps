const express = require('express');
const router = express.Router();
const pool = require('../../db');

// GET all menus (for admin)
router.get('/', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM student_menus ORDER BY sort_order ASC, id ASC');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST to create a new menu
router.post('/', async (req, res) => {
    try {
        const { label, icon, path, color, bg, is_active, sort_order } = req.body;
        const [result] = await pool.query(
            'INSERT INTO student_menus (label, icon, path, color, bg, is_active, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [label, icon, path, color || '#3B82F6', bg || 'rgba(59, 130, 246, 0.15)', is_active !== false, sort_order || 0]
        );
        res.status(201).json({ id: result.insertId, ...req.body });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PUT to update an existing menu
router.put('/:id', async (req, res) => {
    try {
        const { label, icon, path, color, bg, is_active, sort_order } = req.body;
        await pool.query(
            'UPDATE student_menus SET label = ?, icon = ?, path = ?, color = ?, bg = ?, is_active = ?, sort_order = ? WHERE id = ?',
            [label, icon, path, color, bg, is_active, sort_order, req.params.id]
        );
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PATCH to update toggle status
router.patch('/:id/toggle', async (req, res) => {
    try {
        const { is_active } = req.body;
        await pool.query('UPDATE student_menus SET is_active = ? WHERE id = ?', [is_active, req.params.id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PATCH to reorder menus
router.patch('/reorder', async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        const { orderedIds } = req.body;

        if (!orderedIds || !Array.isArray(orderedIds)) {
            return res.status(400).json({ error: 'Invalid data format' });
        }

        for (let i = 0; i < orderedIds.length; i++) {
            await connection.query('UPDATE student_menus SET sort_order = ? WHERE id = ?', [i, orderedIds[i]]);
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

// DELETE a menu
router.delete('/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM student_menus WHERE id = ?', [req.params.id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
