/**
 * SIAS — Public Portal API Routes
 * Endpoints for the public-facing website (no auth required).
 */
const express = require('express');
const router = express.Router();
const pool = require('../../db');
const { cacheMiddleware } = require('../../middleware/cache');
const bcrypt = require('bcryptjs');
const waService = require('../../services/whatsappService');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const JWT_SECRET = process.env.JWT_SECRET || 'secret_fallback';

// Upload config for PPDB photos
const ppdbPhotoDir = path.join(__dirname, '../../uploads/ppdb_photos');
if (!fs.existsSync(ppdbPhotoDir)) fs.mkdirSync(ppdbPhotoDir, { recursive: true });
const ppdbStorage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, ppdbPhotoDir),
    filename: (req, file, cb) => cb(null, `ppdb_${req.ppdbUser.id}_${Date.now()}${path.extname(file.originalname)}`)
});
const uploadPPDBPhoto = multer({ storage: ppdbStorage, limits: { fileSize: 2 * 1024 * 1024 }, fileFilter: (req, file, cb) => {
    if (['image/jpeg','image/png','image/webp'].includes(file.mimetype)) cb(null, true);
    else cb(new Error('Hanya JPEG, PNG, WEBP yang diizinkan'), false);
}});

// Upload config for PPDB Berkas (Documents)
const ppdbBerkasDir = path.join(__dirname, '../../uploads/ppdb_berkas');
if (!fs.existsSync(ppdbBerkasDir)) fs.mkdirSync(ppdbBerkasDir, { recursive: true });
const berkasStorage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, ppdbBerkasDir),
    filename: (req, file, cb) => {
        const type = req.body.type || 'dokumen';
        cb(null, `${type}_${req.ppdbUser.id}_${Date.now()}${path.extname(file.originalname)}`);
    }
});
const uploadPPDBBerkas = multer({ storage: berkasStorage, limits: { fileSize: 5 * 1024 * 1024 } });

// Helper: Calculate completeness percentage
function calcCompleteness(row) {
    let score = 0, total = 100;
    // Basic Info (35%)
    if (row.nama_lengkap) score += 5;
    if (row.nisn) score += 5;
    if (row.tempat_lahir) score += 5;
    if (row.tgl_lahir) score += 5;
    if (row.jenis_kelamin) score += 5;
    if (row.agama) score += 5;
    if (row.no_whatsapp) score += 5;

    // Address & Identity (25%)
    if (row.alamat_lengkap) score += 10;
    if (row.foto_path) score += 10;
    
    let bio = {};
    try { bio = typeof row.biodata_tambahan === 'string' ? JSON.parse(row.biodata_tambahan) : (row.biodata_tambahan || {}); } catch(e){}
    if (bio.nik) score += 5;

    // Parent/Guardian Info (20%)
    if (bio.nama_ayah || bio.nama_ibu || bio.nama_wali) score += 10;
    if (bio.pekerjaan_ayah || bio.pekerjaan_ibu || bio.pekerjaan_wali) score += 10;

    // Documents (20%)
    let berkas = {};
    try { berkas = typeof row.berkas_json === 'string' ? JSON.parse(row.berkas_json) : (row.berkas_json || {}); } catch(e){}
    const docs = ['kk', 'akte', 'ijazah', 'ktp_ortu'];
    docs.forEach(d => { if (berkas[d]) score += 5; });

    return Math.min(Math.round(score), total);
}

// Middleware for PPDB Student Auth
function ppdbAuthMiddleware(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) return res.status(401).json({ error: 'Akses ditolak.' });
    try {
        const decoded = jwt.verify(authHeader.split(' ')[1], JWT_SECRET);
        if (decoded.role !== 'ppdb_student') throw new Error('Role invalid');
        req.ppdbUser = decoded;
        next();
    } catch (err) { return res.status(401).json({ error: 'Token tidak valid' }); }
}

// ==================== PUBLIC PORTAL ROUTES ====================

router.get('/banners', cacheMiddleware(600), async (req, res) => {
    try { const [rows] = await pool.query('SELECT * FROM cms_banners WHERE is_active = 1 ORDER BY sort_order ASC'); res.json(rows); }
    catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/posts', cacheMiddleware(5), async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = Math.min(parseInt(req.query.limit) || 10, 50);
        const category = req.query.category || null;
        const offset = (page - 1) * limit;
        let where = "WHERE status = 'published'"; const params = [];
        if (category) { where += ' AND category = ?'; params.push(category); }
        const [countRows] = await pool.query(`SELECT COUNT(*) as total FROM cms_posts ${where}`, params);
        const [rows] = await pool.query(`SELECT id, slug, title, excerpt, cover_image, category, is_pinned, published_at, created_at, views FROM cms_posts ${where} ORDER BY is_pinned DESC, published_at DESC LIMIT ? OFFSET ?`, [...params, limit, offset]);
        res.json({ data: rows, pagination: { page, limit, total: countRows[0].total, totalPages: Math.ceil(countRows[0].total / limit) } });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/posts/trending', cacheMiddleware(300), async (req, res) => {
    try { const [rows] = await pool.query("SELECT id, slug, title, excerpt, cover_image, category, is_pinned, published_at, created_at, views FROM cms_posts WHERE status = 'published' ORDER BY views DESC, published_at DESC LIMIT 4"); res.json(rows); }
    catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/posts/:slug', cacheMiddleware(5), async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT p.*, u.nama as author_name FROM cms_posts p LEFT JOIN users u ON p.author_id = u.id WHERE p.slug = ? AND p.status = 'published'", [req.params.slug]);
        if (rows.length === 0) return res.status(404).json({ error: 'Artikel tidak ditemukan' });
        const post = rows[0];
        const [prevRows] = await pool.query("SELECT slug, title FROM cms_posts WHERE status = 'published' AND published_at < ? ORDER BY published_at DESC LIMIT 1", [post.published_at]);
        const [nextRows] = await pool.query("SELECT slug, title FROM cms_posts WHERE status = 'published' AND published_at > ? ORDER BY published_at ASC LIMIT 1", [post.published_at]);
        post.prev_post = prevRows[0] || null; post.next_post = nextRows[0] || null;
        res.json(post);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/posts/:slug/view', async (req, res) => { try { await pool.query("UPDATE cms_posts SET views = views + 1 WHERE slug = ?", [req.params.slug]); res.json({ success: true }); } catch (err) { res.status(500).json({ error: err.message }); } });

router.get('/pages/:slug', cacheMiddleware(600), async (req, res) => {
    try { const [rows] = await pool.query('SELECT * FROM cms_pages WHERE slug = ?', [req.params.slug]); if (rows.length === 0) return res.status(404).json({ error: 'Halaman tidak ditemukan' }); res.json(rows[0]); }
    catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/settings', cacheMiddleware(60), async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT setting_key, setting_value FROM cms_settings');
        const settings = {}; rows.forEach(r => { settings[r.setting_key] = r.setting_value; });
        const [schoolRows] = await pool.query("SELECT `value` FROM school_settings WHERE `key` = 'maintenance_mode'");
        if(schoolRows.length > 0) settings.maintenance_mode = schoolRows[0].value;
        res.json(settings);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// ==================== PPDB REGISTRATION ====================

router.post('/ppdb', async (req, res) => {
    try {
        const { nama_lengkap, tempat_lahir, tgl_lahir, jenis_kelamin, agama, asal_sekolah, no_whatsapp, alamat_lengkap, gelombang_id } = req.body;
        const [settingsRows] = await pool.query("SELECT setting_value FROM cms_settings WHERE setting_key = 'ppdb_is_open'");
        let isOpen = false;
        if (settingsRows.length > 0) { const val = String(settingsRows[0].setting_value).trim().toLowerCase(); isOpen = (val === 'true' || val === '1'); }
        if (!isOpen) return res.status(403).json({ error: 'Pendaftaran PPDB saat ini sedang ditutup.' });
        if (!nama_lengkap || !asal_sekolah || !no_whatsapp || !alamat_lengkap) return res.status(400).json({ error: 'Mohon lengkapi semua data wajib.' });

        // Validate gelombang quota
        if (gelombang_id) {
            const [gel] = await pool.query('SELECT id, kuota FROM ppdb_gelombang WHERE id = ? AND is_active = 1', [gelombang_id]);
            if (gel.length === 0) return res.status(400).json({ error: 'Gelombang tidak valid atau tidak aktif.' });
            const [cnt] = await pool.query('SELECT COUNT(*) as total FROM ppdb_registrations WHERE gelombang_id = ?', [gelombang_id]);
            if (cnt[0].total >= gel[0].kuota) return res.status(403).json({ error: 'Kuota gelombang ini sudah penuh.' });
        }

        const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const randomStr = Math.random().toString(36).substring(2, 6).toUpperCase();
        const regNumber = `REG-${dateStr}-${randomStr}`;
        const year = new Date().getFullYear();
        const [countRow] = await pool.query(`SELECT COUNT(*) as total FROM ppdb_registrations WHERE YEAR(created_at) = ?`, [year]);
        const username = `PPDB-${year}-${String(countRow[0].total + 1).padStart(3, '0')}`;
        const rawPin = Math.floor(100000 + Math.random() * 900000).toString();
        const hashedPin = await bcrypt.hash(rawPin, 10);

        await pool.query(
            `INSERT INTO ppdb_registrations (registration_number, username, pin_rahasia, nama_lengkap, tempat_lahir, tgl_lahir, jenis_kelamin, agama, asal_sekolah, no_whatsapp, alamat_lengkap, gelombang_id, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'draft')`,
            [regNumber, username, hashedPin, nama_lengkap, tempat_lahir || null, tgl_lahir || null, jenis_kelamin || 'L', agama || null, asal_sekolah, no_whatsapp, alamat_lengkap, gelombang_id || null]
        );

        try { await waService.sendMessage(no_whatsapp, `*Pendaftaran PPDB Berhasil!*\n\nUsername: ${username}\nPIN: ${rawPin}\n\nLogin di Dasbor Pendaftar untuk melengkapi biodata.`); } catch (e) {}

        res.status(201).json({ success: true, data: { registration_number: regNumber, username, pin: rawPin, nama_lengkap } });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/ppdb/check', async (req, res) => {
    try {
        const { identifier } = req.body;
        const [rows] = await pool.query("SELECT registration_number, nisn, nama_lengkap, asal_sekolah, status, created_at FROM ppdb_registrations WHERE registration_number = ? OR nisn = ?", [identifier, identifier]);
        if (rows.length === 0) return res.status(404).json({ error: 'Data tidak ditemukan.' });
        res.json(rows[0]);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// ==================== PPDB TRACKER (Public) ====================

router.get('/ppdb/track/:regNumber', async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT r.registration_number, r.nama_lengkap, r.asal_sekolah, r.status, r.foto_path, r.completeness_pct, r.created_at, r.gelombang_id,
                    g.nama as gelombang_nama
             FROM ppdb_registrations r
             LEFT JOIN ppdb_gelombang g ON r.gelombang_id = g.id
             WHERE r.registration_number = ?`, [req.params.regNumber]
        );
        if (rows.length === 0) return res.status(404).json({ error: 'Nomor registrasi tidak ditemukan.' });

        const r = rows[0];
        const steps = [
            { key: 'registered', label: 'Pendaftaran', icon: '📋', done: true, date: r.created_at },
            { key: 'biodata_complete', label: 'Biodata Lengkap', icon: '📝', done: r.completeness_pct >= 80, date: r.completeness_pct >= 80 ? r.created_at : null },
            { key: 'pending_verification', label: 'Verifikasi Admin', icon: '🔍', done: ['pending_verification','accepted','rejected'].includes(r.status), date: null },
            { key: 'accepted', label: 'Diterima', icon: '✅', done: r.status === 'accepted', date: null },
            { key: 'enrolled', label: 'Daftar Ulang', icon: '🎓', done: false, date: null }
        ];

        res.json({ registration_number: r.registration_number, nama: r.nama_lengkap, asal_sekolah: r.asal_sekolah, status: r.status, gelombang: r.gelombang_nama, completeness: r.completeness_pct, foto_path: r.foto_path, steps });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// ==================== PPDB GELOMBANG (Public Read) ====================

router.get('/ppdb/gelombang', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT g.*, (SELECT COUNT(*) FROM ppdb_registrations WHERE gelombang_id = g.id) as terisi FROM ppdb_gelombang g WHERE g.is_active = 1 ORDER BY g.id ASC');
        res.json(rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// ==================== PPDB ANNOUNCEMENTS (Public Read) ====================

router.get('/ppdb/announcements', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM ppdb_announcements WHERE is_active = 1 ORDER BY created_at DESC');
        res.json(rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// ==================== OTHER PUBLIC DATA ====================

router.get('/programs', async (req, res) => { try { const [rows] = await pool.query('SELECT * FROM cms_programs WHERE is_active = 1 ORDER BY sort_order ASC'); res.json(rows.map(r => ({ ...r, features_json: JSON.parse(r.features_json || '[]'), stats_json: JSON.parse(r.stats_json || '{}') }))); } catch (err) { res.status(500).json({ error: err.message }); } });
router.get('/partners', async (req, res) => { try { const [rows] = await pool.query('SELECT * FROM cms_partners WHERE is_active = 1 ORDER BY sort_order ASC'); res.json(rows); } catch (err) { res.status(500).json({ error: err.message }); } });
router.get('/ppdb-steps', async (req, res) => { try { const [rows] = await pool.query('SELECT * FROM cms_ppdb_steps WHERE is_active = 1 ORDER BY sort_order ASC'); res.json(rows); } catch (err) { res.status(500).json({ error: err.message }); } });
router.get('/ppdb-requirements', async (req, res) => { try { const [rows] = await pool.query('SELECT * FROM cms_ppdb_requirements WHERE is_active = 1 ORDER BY sort_order ASC'); res.json(rows); } catch (err) { res.status(500).json({ error: err.message }); } });
router.get('/stats', async (req, res) => { try { const [s] = await pool.query("SELECT COUNT(*) as count FROM siswa WHERE status = 'aktif'"); const [k] = await pool.query('SELECT COUNT(*) as count FROM kelas'); const [g] = await pool.query('SELECT COUNT(*) as count FROM guru'); const [ppdbYear] = await pool.query("SELECT setting_value FROM cms_settings WHERE setting_key = 'ppdb_year'"); res.json({ total_siswa: s[0].count, total_kelas: k[0].count, total_guru: g[0].count, ppdb_year: ppdbYear[0]?.setting_value }); } catch (err) { res.status(500).json({ error: err.message }); } });
router.post('/cek-tagihan', async (req, res) => { try { const { identifier } = req.body; const [siswa] = await pool.query("SELECT s.*, k.nama as kelas_nama FROM siswa s LEFT JOIN kelas k ON s.kelas_id = k.id WHERE s.nisn = ? OR s.nis = ?", [identifier, identifier]); if (siswa.length === 0) return res.status(404).json({ error: 'Siswa tidak ditemukan.' }); const [tagihan] = await pool.query("SELECT t.*, kt.nama as kategori_nama FROM tagihan t JOIN kategori_tagihan kt ON t.kategori_id = kt.id WHERE t.siswa_id = ? ORDER BY t.status ASC, t.tahun DESC, t.bulan DESC", [siswa[0].id]); res.json({ siswa: siswa[0], tagihan }); } catch (err) { res.status(500).json({ error: err.message }); } });
router.post('/contact', async (req, res) => { try { const { nama, email, telepon, subjek, pesan } = req.body; await pool.query('INSERT INTO cms_contacts (name, email, phone, subject, message) VALUES (?, ?, ?, ?, ?)', [nama, email, telepon, subjek, pesan]); res.status(201).json({ success: true }); } catch (err) { res.status(500).json({ error: err.message }); } });
router.get('/testimonials', async (req, res) => { try { const [rows] = await pool.query('SELECT * FROM cms_testimonials WHERE is_active = 1 ORDER BY sort_order ASC'); res.json(rows); } catch (err) { res.status(500).json({ error: err.message }); } });
router.get('/gallery', async (req, res) => { try { const [rows] = await pool.query('SELECT * FROM cms_gallery WHERE is_active = 1 ORDER BY sort_order ASC'); res.json(rows); } catch (err) { res.status(500).json({ error: err.message }); } });
router.get('/faq', async (req, res) => { try { const [rows] = await pool.query('SELECT * FROM cms_faq WHERE is_active = 1 ORDER BY sort_order ASC'); res.json(rows); } catch (err) { res.status(500).json({ error: err.message }); } });
router.get('/identity-logos', async (req, res) => { try { const [rows] = await pool.query('SELECT * FROM cms_identity_logos WHERE is_active = 1 ORDER BY sort_order ASC'); res.json(rows); } catch (err) { res.status(500).json({ error: err.message }); } });
router.get('/agenda', async (req, res) => { try { const [rows] = await pool.query('SELECT * FROM cms_agenda WHERE is_active = 1 ORDER BY event_date ASC LIMIT 10'); res.json(rows); } catch (err) { res.status(500).json({ error: err.message }); } });
router.post('/visit', async (req, res) => { try { await pool.query("INSERT INTO cms_visitor_stats (visit_date, visits) VALUES (CURDATE(), 1) ON DUPLICATE KEY UPDATE visits = visits + 1"); res.json({ success: true }); } catch (err) { res.status(500).json({ error: err.message }); } });
router.get('/visitor-stats', async (req, res) => { try { const [t] = await pool.query("SELECT visits FROM cms_visitor_stats WHERE visit_date = CURDATE()"); const [m] = await pool.query("SELECT SUM(visits) as count FROM cms_visitor_stats WHERE MONTH(visit_date) = MONTH(CURDATE())"); const [all] = await pool.query("SELECT SUM(visits) as count FROM cms_visitor_stats"); res.json({ today: t[0]?.visits || 0, month: Number(m[0]?.count) || 0, total: Number(all[0]?.count) || 0 }); } catch (err) { res.status(500).json({ error: err.message }); } });

// ==================== PPDB DASHBOARD (Authenticated) ====================

router.post('/ppdb/login', async (req, res) => {
    try {
        const { username, pin } = req.body;
        const [rows] = await pool.query('SELECT * FROM ppdb_registrations WHERE username = ?', [username]);
        if(rows.length === 0) return res.status(401).json({ error: 'Username atau PIN salah' });
        const isMatch = await bcrypt.compare(pin, rows[0].pin_rahasia);
        if(!isMatch) return res.status(401).json({ error: 'Username atau PIN salah' });
        const token = jwt.sign({ id: rows[0].id, username: rows[0].username, role: 'ppdb_student' }, JWT_SECRET, { expiresIn: '7d' });
        res.json({ success: true, token, user: { nama: rows[0].nama_lengkap, status: rows[0].status } });
    } catch(err) { res.status(500).json({ error: err.message }); }
});

router.get('/ppdb/dashboard', ppdbAuthMiddleware, async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT r.id, r.registration_number, r.username, r.nisn, r.nama_lengkap, r.tempat_lahir, r.tgl_lahir,
                    r.jenis_kelamin, r.agama, r.asal_sekolah, r.no_whatsapp, r.alamat_lengkap, r.biodata_tambahan,
                    r.status, r.foto_path, r.completeness_pct, r.gelombang_id, r.berkas_json,
                    g.nama as gelombang_nama, k.nama as kelas_nama
             FROM ppdb_registrations r
             LEFT JOIN ppdb_gelombang g ON r.gelombang_id = g.id
             LEFT JOIN siswa s ON s.nisn = r.nisn AND r.status = 'accepted'
             LEFT JOIN kelas k ON s.kelas_id = k.id
             WHERE r.id = ?`, [req.ppdbUser.id]
        );
        if(rows.length === 0) return res.status(404).json({ error: 'User tidak ditemukan' });
        res.json(rows[0]);
    } catch(err) { res.status(500).json({ error: err.message }); }
});

router.put('/ppdb/dashboard/biodata', ppdbAuthMiddleware, async (req, res) => {
    try {
        const [cek] = await pool.query('SELECT * FROM ppdb_registrations WHERE id = ?', [req.ppdbUser.id]);
        if(cek[0].status !== 'draft') return res.status(403).json({ error: 'Data sudah dikunci. Mohon hubungi panitia untuk perbaikan data.' });
        
        const { nisn, nama_lengkap, tempat_lahir, tgl_lahir, jenis_kelamin, agama, no_whatsapp, alamat_lengkap, biodata_tambahan } = req.body;
        const bioJson = typeof biodata_tambahan === 'string' ? biodata_tambahan : JSON.stringify(biodata_tambahan || {});

        // Build updated row for completeness calculation
        const updatedRow = { ...cek[0], nisn, nama_lengkap, tempat_lahir, tgl_lahir, jenis_kelamin, agama, no_whatsapp, alamat_lengkap, biodata_tambahan: bioJson };
        const pct = calcCompleteness(updatedRow);

        await pool.query(
            `UPDATE ppdb_registrations SET nisn=?, nama_lengkap=?, tempat_lahir=?, tgl_lahir=?, jenis_kelamin=?, agama=?, no_whatsapp=?, alamat_lengkap=?, biodata_tambahan=?, completeness_pct=? WHERE id=?`,
            [nisn || null, nama_lengkap, tempat_lahir || null, tgl_lahir || null, jenis_kelamin || 'L', agama || null, no_whatsapp, alamat_lengkap, bioJson, pct, req.ppdbUser.id]
        );
        res.json({ success: true, completeness_pct: pct, timestamp: new Date() });
    } catch(err) { res.status(500).json({ error: err.message }); }
});

// Upload Document
router.post('/ppdb/dashboard/upload-berkas', ppdbAuthMiddleware, (req, res) => {
    uploadPPDBBerkas.single('file')(req, res, async (err) => {
        if (err) return res.status(400).json({ error: err.message });
        if (!req.file) return res.status(400).json({ error: 'Tidak ada file.' });
        const type = req.body.type; // kk, akte, ijazah, etc.
        if (!type) return res.status(400).json({ error: 'Type berkas tidak ditentukan.' });

        try {
            const filePath = `/uploads/ppdb_berkas/${req.file.filename}`;
            const [rows] = await pool.query('SELECT * FROM ppdb_registrations WHERE id = ?', [req.ppdbUser.id]);
            if (rows[0].status !== 'draft') return res.status(403).json({ error: 'Data sudah terkunci.' });

            let berkas = {};
            try { berkas = typeof rows[0].berkas_json === 'string' ? JSON.parse(rows[0].berkas_json) : (rows[0].berkas_json || {}); } catch(e){}
            
            // Delete old file if exists
            if (berkas[type]) {
                const oldPath = path.join(__dirname, '../../', berkas[type]);
                if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
            }

            berkas[type] = filePath;
            const berkasJson = JSON.stringify(berkas);
            
            // Recalculate completeness
            const updatedRow = { ...rows[0], berkas_json: berkasJson };
            const pct = calcCompleteness(updatedRow);

            await pool.query('UPDATE ppdb_registrations SET berkas_json = ?, completeness_pct = ? WHERE id = ?', [berkasJson, pct, req.ppdbUser.id]);
            res.json({ success: true, file_path: filePath, type, completeness_pct: pct });
        } catch(e) { res.status(500).json({ error: e.message }); }
    });
});

// Upload Photo
router.post('/ppdb/dashboard/upload-foto', ppdbAuthMiddleware, (req, res) => {
    uploadPPDBPhoto.single('foto')(req, res, async (err) => {
        if (err) return res.status(400).json({ error: err.message });
        if (!req.file) return res.status(400).json({ error: 'Tidak ada file.' });
        try {
            const fotoPath = `/uploads/ppdb_photos/${req.file.filename}`;
            await pool.query('UPDATE ppdb_registrations SET foto_path = ? WHERE id = ?', [fotoPath, req.ppdbUser.id]);
            // Recalculate completeness
            const [rows] = await pool.query('SELECT * FROM ppdb_registrations WHERE id = ?', [req.ppdbUser.id]);
            const pct = calcCompleteness(rows[0]);
            await pool.query('UPDATE ppdb_registrations SET completeness_pct = ? WHERE id = ?', [pct, req.ppdbUser.id]);
            res.json({ success: true, foto_path: fotoPath, completeness_pct: pct });
        } catch(e) { res.status(500).json({ error: e.message }); }
    });
});

// Submit Final — Lock Data + WA Notification
router.post('/ppdb/dashboard/submit', ppdbAuthMiddleware, async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM ppdb_registrations WHERE id = ?', [req.ppdbUser.id]);
        if (rows[0].status !== 'draft') return res.status(403).json({ error: 'Data sudah dikunci sebelumnya.' });
        await pool.query('UPDATE ppdb_registrations SET status = ? WHERE id = ?', ['pending_verification', req.ppdbUser.id]);

        // WA Notification
        try {
            await waService.sendMessage(rows[0].no_whatsapp, `✅ *Data PPDB Terkunci*\n\nHalo ${rows[0].nama_lengkap}, data pendaftaran Anda sudah kami terima dan sedang diverifikasi oleh tim panitia.\n\nNo. Registrasi: *${rows[0].registration_number}*\n\nMohon menunggu pengumuman selanjutnya. Terima kasih!`);
        } catch(e) {}

        res.json({ success: true });
    } catch(err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
