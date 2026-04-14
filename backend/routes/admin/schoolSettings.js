const express = require('express');
const router = express.Router();
const pool = require('../../db');
const waService = require('../../services/whatsappService');
const { upload } = require('../../middleware/upload');
const fs = require('fs');
const path = require('path');

// GET /api/admin/school-settings
router.get('/', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM school_settings');
        const settings = {};
        rows.forEach(r => { settings[r.key] = r.value; });
        res.json(settings);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/admin/school-settings
router.post('/', async (req, res) => {
    try {
        const settings = req.body;
        for (const key in settings) {
            await pool.query(
                'INSERT INTO school_settings (`key`, `value`) VALUES (?, ?) ON DUPLICATE KEY UPDATE `value` = VALUES(`value`)',
                [key, String(settings[key])]
            );
        }
        res.json({ success: true, message: 'Pengaturan sekolah berhasil diperbarui' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/admin/school-settings/logo
router.post('/logo', upload.single('logo'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Tidak ada file logo yang diunggah' });
        }
        
        const ext = path.extname(req.file.originalname) || '.png';
        const filename = `school_logo_${Date.now()}${ext}`;
        const uploadDir = path.join(__dirname, '../../uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        const filepath = path.join(uploadDir, filename);
        
        fs.writeFileSync(filepath, req.file.buffer);
        
        const logoUrl = `/uploads/${filename}`;
        
        await pool.query(
            'INSERT INTO school_settings (`key`, `value`) VALUES (?, ?) ON DUPLICATE KEY UPDATE `value` = VALUES(`value`)',
            ['school_logo', logoUrl]
        );
        
        res.json({ success: true, message: 'Logo sekolah berhasil diperbarui', logo_url: logoUrl });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/admin/whatsapp/status
router.get('/whatsapp/status', (req, res) => {
    try {
        res.json(waService.getStatus());
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/admin/whatsapp/restart
router.post('/whatsapp/restart', async (req, res) => {
    try {
        const result = await waService.restart();
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
