const express = require('express');
const router = express.Router();
const pool = require('../../db');
const waService = require('../../services/whatsappService');
const { upload } = require('../../middleware/upload');
const fs = require('fs');
const path = require('path');
let sharp;
try {
    sharp = require('sharp');
} catch (e) {
    console.warn('[Settings] Sharp module not found or incompatible.');
}

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
        
        const uploadDir = path.join(__dirname, '../../uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        let logoUrl;
        if (sharp) {
            try {
                const ext = '.webp'; 
                const filename = `school_logo_${Date.now()}${ext}`;
                const filepath = path.join(uploadDir, filename);
                
                await sharp(req.file.buffer)
                    .resize({ width: 512, withoutEnlargement: true }) // resize maks 512px
                    .webp({ quality: 80 }) // kompresi 80%
                    .toFile(filepath);
                
                logoUrl = `/uploads/${filename}`;
            } catch (sharpError) {
                console.error('[Settings] Sharp Error:', sharpError.message);
                const extOrig = path.extname(req.file.originalname) || '.png';
                const fileFallback = `school_logo_${Date.now()}${extOrig}`;
                fs.writeFileSync(path.join(uploadDir, fileFallback), req.file.buffer);
                logoUrl = `/uploads/${fileFallback}`;
            }
        } else {
            const extOrig = path.extname(req.file.originalname) || '.png';
            const fileFallback = `school_logo_${Date.now()}${extOrig}`;
            fs.writeFileSync(path.join(uploadDir, fileFallback), req.file.buffer);
            logoUrl = `/uploads/${fileFallback}`;
        }

        
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
