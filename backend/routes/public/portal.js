/**
 * SIAS — Public Portal API Routes
 * Endpoints for the public-facing website (no auth required).
 */
const express = require('express');
const router = express.Router();
const pool = require('../../db');
const { cacheMiddleware } = require('../../middleware/cache');

// GET /api/public/banners — Active banners sorted
router.get('/banners', cacheMiddleware(600), async (req, res) => {
    try {
        const [rows] = await pool.query(
            'SELECT * FROM cms_banners WHERE is_active = 1 ORDER BY sort_order ASC'
        );
        res.json(rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/public/posts — Published posts with pagination
router.get('/posts', cacheMiddleware(300), async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = Math.min(parseInt(req.query.limit) || 10, 50);
        const category = req.query.category || null;
        const offset = (page - 1) * limit;

        let where = "WHERE status = 'published'";
        const params = [];

        if (category) {
            where += ' AND category = ?';
            params.push(category);
        }

        const [countRows] = await pool.query(
            `SELECT COUNT(*) as total FROM cms_posts ${where}`, params
        );
        const total = countRows[0].total;

        const [rows] = await pool.query(
            `SELECT id, slug, title, excerpt, cover_image, category, is_pinned, published_at, created_at
             FROM cms_posts ${where}
             ORDER BY is_pinned DESC, published_at DESC
             LIMIT ? OFFSET ?`,
            [...params, limit, offset]
        );

        res.json({
            data: rows,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/public/posts/:slug — Single post by slug
router.get('/posts/:slug', cacheMiddleware(300), async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT p.*, u.nama as author_name 
             FROM cms_posts p 
             LEFT JOIN users u ON p.author_id = u.id 
             WHERE p.slug = ? AND p.status = 'published'`,
            [req.params.slug]
        );
        if (rows.length === 0) return res.status(404).json({ error: 'Artikel tidak ditemukan' });
        res.json(rows[0]);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/public/pages/:slug — Static page content
router.get('/pages/:slug', cacheMiddleware(600), async (req, res) => {
    try {
        const [rows] = await pool.query(
            'SELECT * FROM cms_pages WHERE slug = ?', [req.params.slug]
        );
        if (rows.length === 0) return res.status(404).json({ error: 'Halaman tidak ditemukan' });
        res.json(rows[0]);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/public/settings — Public site configuration
router.get('/settings', cacheMiddleware(60), async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT setting_key, setting_value FROM cms_settings');
        const settings = {};
        rows.forEach(r => { settings[r.setting_key] = r.setting_value; });
        res.json(settings);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/public/ppdb — Submit PPDB registration
router.post('/ppdb', async (req, res) => {
    try {
        const {
            nisn, nama_lengkap, tempat_lahir, tgl_lahir, jenis_kelamin,
            agama, asal_sekolah, telepon_siswa, telepon_ortu, alamat_lengkap
        } = req.body;

        // 1. Check if PPDB is open
        const [settingsRows] = await pool.query("SELECT setting_value FROM cms_settings WHERE setting_key = 'registration_open'");
        const isOpen = settingsRows.length > 0 && (settingsRows[0].setting_value === 'true' || settingsRows[0].setting_value === '1');

        if (!isOpen) {
            return res.status(403).json({ error: 'Pendaftaran PPDB saat ini sedang ditutup.' });
        }

        // 2. Validate required fields
        if (!nisn || !nama_lengkap || !asal_sekolah || !telepon_ortu || !alamat_lengkap) {
            return res.status(400).json({ error: 'Mohon lengkapi semua data wajib.' });
        }

        // 3. Generate Registration Number (format: REG-YYYYMMDD-XXXX)
        const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const randomStr = Math.random().toString(36).substring(2, 6).toUpperCase();
        const regNumber = `REG-${dateStr}-${randomStr}`;

        // 4. Insert into database
        const [result] = await pool.query(
            `INSERT INTO ppdb_registrations 
            (registration_number, nisn, nama_lengkap, tempat_lahir, tgl_lahir, jenis_kelamin, agama, asal_sekolah, telepon_siswa, telepon_ortu, alamat_lengkap, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
            [regNumber, nisn, nama_lengkap, tempat_lahir || null, tgl_lahir || null, jenis_kelamin, agama || null, asal_sekolah, telepon_siswa || null, telepon_ortu, alamat_lengkap]
        );

        res.status(201).json({
            success: true,
            message: 'Pendaftaran berhasil dikirim!',
            registration_number: regNumber
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/public/ppdb/check — Check PPDB status by registration number or NISN
router.post('/ppdb/check', async (req, res) => {
    try {
        const { identifier } = req.body;
        if (!identifier) return res.status(400).json({ error: 'Nomor Registrasi atau NISN harus diisi' });

        const [rows] = await pool.query(
            `SELECT registration_number, nisn, nama_lengkap, asal_sekolah, status, created_at 
             FROM ppdb_registrations 
             WHERE registration_number = ? OR nisn = ?`,
            [identifier, identifier]
        );

        if (rows.length === 0) {
            return res.status(404).json({ error: 'Data pendaftaran tidak ditemukan. Pastikan nomor registrasi atau NISN Anda benar.' });
        }

        res.json(rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/public/stats — Public statistics
router.get('/stats', cacheMiddleware(1800), async (req, res) => {
    try {
        const [siswaCount] = await pool.query("SELECT COUNT(*) as count FROM siswa WHERE status = 'aktif'");
        const [kelasCount] = await pool.query('SELECT COUNT(*) as count FROM kelas');
        const [jurusanCount] = await pool.query('SELECT COUNT(DISTINCT jurusan) as count FROM siswa WHERE jurusan IS NOT NULL');

        res.json({
            total_siswa: siswaCount[0].count,
            total_kelas: kelasCount[0].count,
            total_jurusan: jurusanCount[0].count
        });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/public/cek-tagihan — Check billing by NISN/NIS
router.post('/cek-tagihan', async (req, res) => {
    try {
        const { identifier } = req.body;
        if (!identifier) return res.status(400).json({ error: 'NISN atau NIS harus diisi' });

        // Find student by NISN or NIS
        const [siswaRows] = await pool.query(
            `SELECT s.id, s.nisn, s.nis, s.nama, s.jk, s.status, k.nama as kelas_nama
             FROM siswa s
             LEFT JOIN kelas k ON s.kelas_id = k.id
             WHERE s.nisn = ? OR s.nis = ?`,
            [identifier, identifier]
        );

        if (siswaRows.length === 0) {
            return res.status(404).json({ error: 'Siswa tidak ditemukan. Periksa NISN/NIS Anda.' });
        }

        const siswa = siswaRows[0];

        // Get unpaid bills
        const [tagihanRows] = await pool.query(
            `SELECT t.id, t.bulan, t.tahun, t.nominal, t.nominal_asli, t.is_diskon, t.status, t.paid_at,
                    kt.nama as kategori_nama, ta.tahun as tahun_ajaran
             FROM tagihan t
             JOIN kategori_tagihan kt ON t.kategori_id = kt.id
             LEFT JOIN tahun_ajaran ta ON t.tahun_ajaran_id = ta.id
             WHERE t.siswa_id = ?
             ORDER BY t.status ASC, t.tahun DESC, t.bulan DESC`,
            [siswa.id]
        );

        const totalBelum = tagihanRows
            .filter(t => t.status === 'belum')
            .reduce((sum, t) => sum + Number(t.nominal), 0);

        res.json({
            siswa: {
                nama: siswa.nama,
                nisn: siswa.nisn,
                nis: siswa.nis,
                kelas: siswa.kelas_nama,
                status: siswa.status
            },
            tagihan: tagihanRows,
            ringkasan: {
                total_tagihan: tagihanRows.length,
                belum_bayar: tagihanRows.filter(t => t.status === 'belum').length,
                sudah_bayar: tagihanRows.filter(t => t.status === 'lunas').length,
                total_belum_bayar: totalBelum
            }
        });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/public/contact — Submit contact form
router.post('/contact', async (req, res) => {
    try {
        const { nama, email, telepon, subjek, pesan } = req.body;
        if (!nama || !pesan) {
            return res.status(400).json({ error: 'Nama dan pesan harus diisi' });
        }

        const [result] = await pool.query(
            'INSERT INTO cms_contacts (name, email, phone, subject, message) VALUES (?, ?, ?, ?, ?)',
            [nama, email || null, telepon || null, subjek || null, pesan]
        );

        res.status(201).json({ success: true, message: 'Pesan berhasil dikirim!' });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
