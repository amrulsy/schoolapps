/**
 * SIAS — Admin CMS API Routes
 * CRUD endpoints for managing CMS content (auth required).
 */
const express = require('express');
const router = express.Router();
const pool = require('../../db');
const { invalidateCache } = require('../../middleware/cache');
const { upload } = require('../../middleware/upload');
const fs = require('fs');
const path = require('path');

// ==================== POSTS ====================

// GET /api/admin/cms/posts — List all posts (including drafts)
router.get('/posts', async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT p.*, u.nama as author_name 
             FROM cms_posts p 
             LEFT JOIN users u ON p.author_id = u.id 
             ORDER BY p.created_at DESC`
        );
        res.json(rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/admin/cms/posts — Create new post
router.post('/posts', async (req, res) => {
    try {
        const { title, slug, excerpt, content, cover_image, category, status } = req.body;

        // Auto-generate slug from title if not provided
        const finalSlug = slug || title.toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '') + '-' + Date.now();

        const publishedAt = status === 'published' ? new Date() : null;

        const [result] = await pool.query(
            `INSERT INTO cms_posts (title, slug, excerpt, content, cover_image, category, status, author_id, published_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [title, finalSlug, excerpt || null, content, cover_image || null,
                category || 'pengumuman', status || 'draft', req.user?.id || null, publishedAt]
        );

        invalidateCache('/api/public/posts');
        res.status(201).json({ id: result.insertId, slug: finalSlug });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// PUT /api/admin/cms/posts/:id — Update post
router.put('/posts/:id', async (req, res) => {
    try {
        const { title, slug, excerpt, content, cover_image, category, status } = req.body;

        const [existing] = await pool.query('SELECT status FROM cms_posts WHERE id = ?', [req.params.id]);
        if (existing.length === 0) return res.status(404).json({ error: 'Post tidak ditemukan' });

        // Set published_at if publishing for the first time
        let publishedAt = null;
        if (status === 'published' && existing[0].status !== 'published') {
            publishedAt = new Date();
        }

        let query = `UPDATE cms_posts SET title = ?, excerpt = ?, content = ?, cover_image = ?,
                      category = ?, status = ? WHERE id = ?`;
        let params = [title, excerpt, content, cover_image, category, status, req.params.id];

        if (slug) {
            query = `UPDATE cms_posts SET title = ?, slug = ?, excerpt = ?, content = ?, cover_image = ?,
                      category = ?, status = ? WHERE id = ?`;
            params = [title, slug, excerpt, content, cover_image, category, status, req.params.id];
        }

        if (publishedAt) {
            query = `UPDATE cms_posts SET title = ?, excerpt = ?, content = ?, cover_image = ?,
                      category = ?, status = ?, published_at = ? WHERE id = ?`;
            params = [title, excerpt, content, cover_image, category, status, publishedAt, req.params.id];
        }

        await pool.query(query, params);
        invalidateCache('/api/public/posts');
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// DELETE /api/admin/cms/posts/:id — Delete post
router.delete('/posts/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM cms_posts WHERE id = ?', [req.params.id]);
        invalidateCache('/api/public/posts');
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// PATCH /api/admin/cms/posts/:id/publish — Toggle publish
router.patch('/posts/:id/publish', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT status FROM cms_posts WHERE id = ?', [req.params.id]);
        if (rows.length === 0) return res.status(404).json({ error: 'Post tidak ditemukan' });

        const newStatus = rows[0].status === 'published' ? 'draft' : 'published';
        const publishedAt = newStatus === 'published' ? new Date() : null;

        await pool.query(
            'UPDATE cms_posts SET status = ?, published_at = COALESCE(?, published_at) WHERE id = ?',
            [newStatus, publishedAt, req.params.id]
        );

        invalidateCache('/api/public/posts');
        res.json({ success: true, status: newStatus });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// ==================== BANNERS ====================

router.get('/banners', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM cms_banners ORDER BY sort_order ASC');
        res.json(rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/banners', async (req, res) => {
    try {
        const { title, subtitle, image_url, cta_text, cta_link, sort_order } = req.body;
        const [result] = await pool.query(
            'INSERT INTO cms_banners (title, subtitle, image_url, cta_text, cta_link, sort_order) VALUES (?, ?, ?, ?, ?, ?)',
            [title, subtitle || null, image_url, cta_text || null, cta_link || null, sort_order || 0]
        );
        invalidateCache('/api/public/banners');
        res.status(201).json({ id: result.insertId });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/banners/:id', async (req, res) => {
    try {
        const { title, subtitle, image_url, cta_text, cta_link, sort_order, is_active } = req.body;
        await pool.query(
            `UPDATE cms_banners SET title = ?, subtitle = ?, image_url = ?, cta_text = ?, 
             cta_link = ?, sort_order = ?, is_active = ? WHERE id = ?`,
            [title, subtitle, image_url, cta_text, cta_link, sort_order || 0, is_active ?? true, req.params.id]
        );
        invalidateCache('/api/public/banners');
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/banners/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM cms_banners WHERE id = ?', [req.params.id]);
        invalidateCache('/api/public/banners');
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// ==================== PAGES ====================

router.get('/pages', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM cms_pages ORDER BY slug ASC');
        res.json(rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/pages/:slug', async (req, res) => {
    try {
        const { title, content, meta_description } = req.body;
        await pool.query(
            'UPDATE cms_pages SET title = ?, content = ?, meta_description = ? WHERE slug = ?',
            [title, content, meta_description || null, req.params.slug]
        );
        invalidateCache('/api/public/pages');
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// ==================== SETTINGS ====================

router.get('/settings', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM cms_settings');
        res.json(rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/settings', async (req, res) => {
    try {
        const { updates } = req.body; // Array of { setting_key, setting_value }
        if (!updates || !Array.isArray(updates)) {
            return res.status(400).json({ error: 'Data updates tidak valid' });
        }

        for (const item of updates) {
            await pool.query(
                'UPDATE cms_settings SET setting_value = ? WHERE setting_key = ?',
                [item.setting_value, item.setting_key]
            );
        }
        invalidateCache('/api/public/settings');
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// ==================== PPDB REGISTRATIONS ====================

router.get('/ppdb', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM ppdb_registrations ORDER BY created_at DESC');
        res.json(rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.patch('/ppdb/:id/status', async (req, res) => {
    try {
        const { status } = req.body;
        if (!['pending', 'approved', 'rejected'].includes(status)) {
            return res.status(400).json({ error: 'Status tidak valid' });
        }

        await pool.query('UPDATE ppdb_registrations SET status = ? WHERE id = ?', [status, req.params.id]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/ppdb/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM ppdb_registrations WHERE id = ?', [req.params.id]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// ==================== CONTACTS ====================

router.get('/contacts', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM cms_contacts ORDER BY created_at DESC');
        res.json(rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.patch('/contacts/:id/read', async (req, res) => {
    try {
        await pool.query('UPDATE cms_contacts SET is_read = 1 WHERE id = ?', [req.params.id]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/contacts/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM cms_contacts WHERE id = ?', [req.params.id]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// ==================== MEDIA UPLOAD ====================

// POST /api/admin/cms/media/upload
router.post('/media/upload', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Tidak ada file yang diupload.' });
        }

        const fileUrl = `/uploads/${req.file.filename}`;

        const [result] = await pool.query(
            'INSERT INTO cms_media (filename, original_name, mimetype, size, path, uploaded_by) VALUES (?, ?, ?, ?, ?, ?)',
            [req.file.filename, req.file.originalname, req.file.mimetype, req.file.size, fileUrl, req.user?.id || null]
        );

        res.status(201).json({
            id: result.insertId,
            url: fileUrl,
            filename: req.file.filename,
            original_name: req.file.originalname
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/admin/cms/media
router.get('/media', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM cms_media ORDER BY created_at DESC');
        res.json(rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// DELETE /api/admin/cms/media/:id
router.delete('/media/:id', async (req, res) => {
    try {
        const [files] = await pool.query('SELECT filename FROM cms_media WHERE id = ?', [req.params.id]);

        if (files.length > 0) {
            const filename = files[0].filename;
            const filePath = path.join(__dirname, '../../uploads', filename);

            // Delete physical file
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }

            // Delete db record
            await pool.query('DELETE FROM cms_media WHERE id = ?', [req.params.id]);
        }

        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// ==================== PROGRAMS (Program Keahlian) ====================

router.get('/programs', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM cms_programs ORDER BY sort_order ASC');
        res.json(rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/programs', async (req, res) => {
    try {
        const { icon, title, slug, tagline, description, banner_image, color_theme, features_json, full_content, sort_order } = req.body;

        // Auto-generate slug if not provided
        const finalSlug = slug || title.toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');

        const [result] = await pool.query(
            `INSERT INTO cms_programs 
            (icon, title, slug, tagline, description, banner_image, color_theme, features_json, full_content, sort_order) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [icon || '📚', title, finalSlug, tagline || null, description || null,
            banner_image || null, color_theme || '#4f46e5',
            JSON.stringify(features_json || []), full_content || null, sort_order || 0]
        );
        invalidateCache('/api/public/programs');
        res.status(201).json({ id: result.insertId });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/programs/:id', async (req, res) => {
    try {
        const { icon, title, slug, tagline, description, banner_image, color_theme, features_json, full_content, sort_order, is_active } = req.body;

        await pool.query(
            `UPDATE cms_programs SET 
                icon = ?, title = ?, slug = ?, tagline = ?, description = ?, 
                banner_image = ?, color_theme = ?, features_json = ?, 
                full_content = ?, sort_order = ?, is_active = ? 
            WHERE id = ?`,
            [icon, title, slug, tagline, description, banner_image, color_theme,
                JSON.stringify(features_json || []), full_content, sort_order || 0, is_active ?? true, req.params.id]
        );
        invalidateCache('/api/public/programs');
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/programs/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM cms_programs WHERE id = ?', [req.params.id]);
        invalidateCache('/api/public/programs');
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// ==================== PARTNERS (Mitra/Partner Logos) ====================

router.get('/partners', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM cms_partners ORDER BY sort_order ASC');
        res.json(rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/partners', async (req, res) => {
    try {
        const { name, logo_url, website_url, sort_order } = req.body;
        const [result] = await pool.query(
            'INSERT INTO cms_partners (name, logo_url, website_url, sort_order) VALUES (?, ?, ?, ?)',
            [name, logo_url, website_url || null, sort_order || 0]
        );
        invalidateCache('/api/public/partners');
        res.status(201).json({ id: result.insertId });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/partners/:id', async (req, res) => {
    try {
        const { name, logo_url, website_url, sort_order, is_active } = req.body;
        await pool.query(
            'UPDATE cms_partners SET name = ?, logo_url = ?, website_url = ?, sort_order = ?, is_active = ? WHERE id = ?',
            [name, logo_url, website_url, sort_order || 0, is_active ?? true, req.params.id]
        );
        invalidateCache('/api/public/partners');
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/partners/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM cms_partners WHERE id = ?', [req.params.id]);
        invalidateCache('/api/public/partners');
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// ==================== PPDB STEPS ====================

router.get('/ppdb-steps', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM cms_ppdb_steps ORDER BY sort_order ASC');
        res.json(rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/ppdb-steps', async (req, res) => {
    try {
        const { step_number, icon, title, description, sort_order } = req.body;
        const [result] = await pool.query(
            'INSERT INTO cms_ppdb_steps (step_number, icon, title, description, sort_order) VALUES (?, ?, ?, ?, ?)',
            [step_number || '01', icon || '📋', title, description || null, sort_order || 0]
        );
        invalidateCache('/api/public/ppdb-steps');
        res.status(201).json({ id: result.insertId });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/ppdb-steps/:id', async (req, res) => {
    try {
        const { step_number, icon, title, description, sort_order, is_active } = req.body;
        await pool.query(
            'UPDATE cms_ppdb_steps SET step_number = ?, icon = ?, title = ?, description = ?, sort_order = ?, is_active = ? WHERE id = ?',
            [step_number, icon, title, description, sort_order || 0, is_active ?? true, req.params.id]
        );
        invalidateCache('/api/public/ppdb-steps');
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/ppdb-steps/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM cms_ppdb_steps WHERE id = ?', [req.params.id]);
        invalidateCache('/api/public/ppdb-steps');
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// ==================== PPDB REQUIREMENTS ====================

router.get('/ppdb-requirements', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM cms_ppdb_requirements ORDER BY sort_order ASC');
        res.json(rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/ppdb-requirements', async (req, res) => {
    try {
        const { text, sort_order } = req.body;
        const [result] = await pool.query(
            'INSERT INTO cms_ppdb_requirements (text, sort_order) VALUES (?, ?)',
            [text, sort_order || 0]
        );
        invalidateCache('/api/public/ppdb-requirements');
        res.status(201).json({ id: result.insertId });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/ppdb-requirements/:id', async (req, res) => {
    try {
        const { text, sort_order, is_active } = req.body;
        await pool.query(
            'UPDATE cms_ppdb_requirements SET text = ?, sort_order = ?, is_active = ? WHERE id = ?',
            [text, sort_order || 0, is_active ?? true, req.params.id]
        );
        invalidateCache('/api/public/ppdb-requirements');
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/ppdb-requirements/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM cms_ppdb_requirements WHERE id = ?', [req.params.id]);
        invalidateCache('/api/public/ppdb-requirements');
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
