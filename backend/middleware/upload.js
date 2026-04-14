const multer = require('multer');
const path = require('path');
const fs = require('fs');

// ─── Memory Storage (CMS / media uploads) ────────────────────────────────────
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const fileFilter = (req, file, cb) => {
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf'];
    if (allowedMimeTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only JPEG, PNG, WEBP, GIF, and PDF are allowed.'));
    }
};

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter,
});

// ─── Disk Storage: Dokumen Siswa ─────────────────────────────────────────────
const storageDokumen = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = path.join(__dirname, '../uploads/dokumen_siswa');
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        cb(null, `${req.params.id}_${Date.now()}_${file.originalname}`);
    },
});

const uploadDokumen = multer({
    storage: storageDokumen,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

module.exports = { upload, uploadDokumen };
