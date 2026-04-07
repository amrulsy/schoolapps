const express = require('express');
const router = express.Router();
const pool = require('../../db');
const multer = require('multer');
const fs = require('fs');

const storageDokumen = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = 'uploads/dokumen_siswa';
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        cb(null, `${req.params.id}_${Date.now()}_${file.originalname}`);
    }
});
const uploadDokumen = multer({ storage: storageDokumen, limits: { fileSize: 5 * 1024 * 1024 } });

// --- MASTER DOKUMEN & SISWA DOKUMEN ROUTES ---

router.get('/api/admin/master-dokumen', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM master_dokumen ORDER BY id ASC');
        res.json(rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/api/admin/master-dokumen', async (req, res) => {
    try {
        const { kode, nama, is_required, keterangan } = req.body;
        await pool.query(
            'INSERT INTO master_dokumen (kode, nama, is_required, keterangan) VALUES (?, ?, ?, ?)',
            [kode, nama, is_required !== undefined ? is_required : true, keterangan || null]
        );
        res.status(201).json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/api/admin/master-dokumen/:id', async (req, res) => {
    try {
        const { kode, nama, is_required, keterangan } = req.body;
        await pool.query(
            'UPDATE master_dokumen SET kode = ?, nama = ?, is_required = ?, keterangan = ? WHERE id = ?',
            [kode, nama, is_required !== undefined ? is_required : true, keterangan || null, req.params.id]
        );
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/api/admin/master-dokumen/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM master_dokumen WHERE id = ?', [req.params.id]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// Upload Dokumen Siswa
router.post('/api/siswa/:id/dokumen', uploadDokumen.single('file'), async (req, res) => {
    try {
        const { kode_dokumen, nama_dokumen } = req.body;
        const file = req.file;
        if (!file) return res.status(400).json({ error: 'File tidak ditemukan' });

        const filePath = `/uploads/dokumen_siswa/${file.filename}`;
        const fileSize = (file.size / 1024).toFixed(2) + ' KB';

        await pool.query(`
            INSERT INTO siswa_dokumen (siswa_id, kode_dokumen, nama_dokumen, status, file_size, file_path)
            VALUES (?, ?, ?, 'Belum Verifikasi', ?, ?)
            ON DUPLICATE KEY UPDATE 
                nama_dokumen = VALUES(nama_dokumen),
                status = 'Belum Verifikasi',
                file_size = VALUES(file_size),
                file_path = VALUES(file_path)
        `, [req.params.id, kode_dokumen, nama_dokumen || kode_dokumen, fileSize, filePath]);

        res.json({ success: true, filePath, status: 'Belum Verifikasi', file_size: fileSize });
    } catch (err) { res.status(500).json({ error: err.message }); }
});


module.exports = router;