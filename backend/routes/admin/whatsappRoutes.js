const express = require('express');
const router = express.Router();
const waService = require('../../services/whatsappService');
const { authMiddleware } = require('../../middleware/auth');

// --- WHATSAPP API ROUTES ---
router.get('/status', authMiddleware, (req, res) => {
    res.json(waService.getStatus());
});

router.post('/logout', authMiddleware, async (req, res) => {
    const result = await waService.logout();
    res.json(result);
});

router.post('/restart', authMiddleware, async (req, res) => {
    const result = await waService.restart();
    res.json(result);
});

router.post('/clear-history', authMiddleware, (req, res) => {
    const result = waService.clearHistory();
    res.json(result);
});

router.post('/update-config', authMiddleware, (req, res) => {
    const { hourlyLimit } = req.body;
    const result = waService.updateConfig({ hourlyLimit });
    res.json(result);
});

router.post('/test', authMiddleware, async (req, res) => {
    const { phone, message } = req.body;
    if (!phone || !message) return res.status(400).json({ error: 'Phone dan message wajib diisi' });
    const result = await waService.sendMessage(phone, message);
    res.json(result);
});



module.exports = router;