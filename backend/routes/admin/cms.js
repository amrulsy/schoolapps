/**
 * SIAS — Admin CMS API Routes
 * CRUD endpoints for managing CMS content (auth required).
 */
const express = require('express');
const router = express.Router();
const pool = require('../../db');
const { invalidateCache } = require('../../middleware/cache');
const { upload } = require('../../middleware/upload');
const sharp = require('sharp');
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
        const { title, subtitle, image_url, cta_text, cta_link, sort_order, is_active } = req.body;
        const [result] = await pool.query(
            'INSERT INTO cms_banners (title, subtitle, image_url, cta_text, cta_link, sort_order, is_active) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [title, subtitle || null, image_url, cta_text || null, cta_link || null, sort_order || 0, is_active ?? 1]
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
                `INSERT INTO cms_settings (setting_key, setting_value) 
                 VALUES (?, ?) 
                 ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)`,
                [item.setting_key, item.setting_value]
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

router.get('/ppdb/qr/:qr', async (req, res) => {
    try {
        const identifier = req.params.qr;
        const [rows] = await pool.query('SELECT * FROM ppdb_registrations WHERE registration_number = ? OR username = ? LIMIT 1', [identifier, identifier]);
        if (rows.length === 0) return res.status(404).json({ error: 'Siswa tidak ditemukan' });
        res.json(rows[0]);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.patch('/ppdb/:id/status', async (req, res) => {
    try {
        const { status } = req.body;
        if (!['draft', 'pending_verification', 'wawancara', 'rejected'].includes(status)) {
            return res.status(400).json({ error: 'Status tidak valid. Untuk menerima siswa, gunakan tombol "Terima Siswa".' });
        }
        await pool.query('UPDATE ppdb_registrations SET status = ? WHERE id = ?', [status, req.params.id]);

        // WA Notification on rejection
        if (status === 'rejected') {
            try {
                const [pRows] = await pool.query('SELECT nama_lengkap, no_whatsapp FROM ppdb_registrations WHERE id = ?', [req.params.id]);
                if (pRows.length > 0 && pRows[0].no_whatsapp) {
                    const waService = require('../../services/whatsappService');
                    await waService.sendMessage(pRows[0].no_whatsapp, `Mohon maaf, pendaftaran PPDB atas nama *${pRows[0].nama_lengkap}* belum dapat kami terima saat ini.\n\nSilakan hubungi panitia PPDB untuk informasi lebih lanjut. Terima kasih.`);
                }
            } catch(e) { console.error('WA reject notification error:', e); }
        }

        res.json({ success: true, status });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/ppdb/:id/accept', async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        
        // 1. Ambil data pendaftar & Tahun Ajaran Aktif
        const [pRows] = await connection.query('SELECT * FROM ppdb_registrations WHERE id = ?', [req.params.id]);
        if(pRows.length === 0) throw new Error('Data pendaftar tidak ditemukan');
        const p = pRows[0];
        if(p.status === 'accepted') throw new Error('Siswa ini sudah pernah diterima');

        const [taRows] = await connection.query("SELECT * FROM tahun_ajaran WHERE status = 'aktif' LIMIT 1");
        if(taRows.length === 0) throw new Error('Tahun ajaran aktif tidak ditemukan. Silakan atur Tahun Ajaran di Pengaturan.');
        const ta = taRows[0];
        
        // 2. Parse biodata_tambahan SEBELUM digunakan
        let bio = {};
        try { bio = typeof p.biodata_tambahan === 'string' ? JSON.parse(p.biodata_tambahan) : (p.biodata_tambahan || {}); } catch(e){}

        // 3. Insert ke tabel Siswa Aktif (FULL field migration)
        const { kelas_id } = req.body;
        const angkatan = ta.tahun.split('/')[0];

        // Normalize NISN: empty/whitespace → null, and check for duplicates
        let nisnValue = (p.nisn && p.nisn.trim()) ? p.nisn.trim() : null;
        if (nisnValue) {
            const [existingNisn] = await connection.query('SELECT id FROM siswa WHERE nisn = ?', [nisnValue]);
            if (existingNisn.length > 0) {
                // NISN already exists — skip it to avoid duplicate key error, admin can update later
                console.warn(`[PPDB Accept] NISN ${nisnValue} already exists in siswa (id: ${existingNisn[0].id}), setting to NULL`);
                nisnValue = null;
            }
        }
        // Also check no_reg for duplicates
        let noRegValue = (p.registration_number && p.registration_number.trim()) ? p.registration_number.trim() : null;
        if (noRegValue) {
            const [existingReg] = await connection.query('SELECT id FROM siswa WHERE no_reg = ?', [noRegValue]);
            if (existingReg.length > 0) {
                console.warn(`[PPDB Accept] no_reg ${noRegValue} already exists in siswa (id: ${existingReg[0].id}), appending suffix`);
                noRegValue = noRegValue + '-' + Date.now();
            }
        }

        const [siswaRes] = await connection.query(`
            INSERT INTO siswa 
            (nisn, nama, jk, tempat_lahir, tgl_lahir, agama, alamat, telp, status, kelas_id, 
             angkatan, jenis_pendaftaran, tanggal_mulai_sekolah, asal_sekolah, no_reg, wali,
             nik, no_kk, anak_ke, jml_saudara, bb, tb, gol_darah, riwayat_penyakit, hobby, cita_cita,
             rt, rw, dusun, kelurahan, kecamatan, kabupaten, provinsi, kodepos, jenis_tinggal)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'aktif', ?,
                    ?, ?, ?, ?, ?, ?,
                    ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
                    ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            nisnValue, 
            p.nama_lengkap, 
            p.jenis_kelamin, 
            p.tempat_lahir, 
            p.tgl_lahir, 
            p.agama, 
            p.alamat_lengkap, 
            p.no_whatsapp, 
            kelas_id || null, 
            angkatan, 
            'Baru', 
            ta.tanggal_mulai,
            p.asal_sekolah || null,
            noRegValue,
            bio.nama_ayah || bio.nama_ibu || bio.nama_wali || null,
            // Extended biodata fields
            bio.nik || null,
            bio.no_kk || null,
            bio.anak_ke ? parseInt(bio.anak_ke) : null,
            bio.jml_saudara ? parseInt(bio.jml_saudara) : null,
            bio.bb ? parseFloat(bio.bb) : null,
            bio.tb ? parseFloat(bio.tb) : null,
            bio.gol_darah || null,
            bio.riwayat_penyakit || null,
            bio.hobby || null,
            bio.cita_cita || null,
            // Extended address fields
            bio.rt || null,
            bio.rw || null,
            bio.dusun || null,
            bio.kelurahan || null,
            bio.kecamatan || null,
            bio.kabupaten || null,
            bio.provinsi || null,
            bio.kodepos || null,
            bio.jenis_tinggal || null
        ]);
        
        const siswaId = siswaRes.insertId;

        // 4. Masukkan biodata orang tua LENGKAP
        if(bio.nama_ayah) {
            await connection.query(
                `INSERT INTO siswa_orangtua (siswa_id, jenis, nama, nik, pekerjaan, pendidikan, penghasilan, hp, tahun_lahir)
                 VALUES (?, 'ayah', ?, ?, ?, ?, ?, ?, ?)`,
                [siswaId, bio.nama_ayah, bio.nik_ayah || null, bio.pekerjaan_ayah || null, bio.pendidikan_ayah || null, bio.penghasilan_ayah || null, bio.telp_ayah || null, bio.tgl_lahir_ayah ? String(bio.tgl_lahir_ayah).substring(0,4) : null]
            );
        }
        if(bio.nama_ibu) {
            await connection.query(
                `INSERT INTO siswa_orangtua (siswa_id, jenis, nama, nik, pekerjaan, pendidikan, penghasilan, hp, tahun_lahir)
                 VALUES (?, 'ibu', ?, ?, ?, ?, ?, ?, ?)`,
                [siswaId, bio.nama_ibu, bio.nik_ibu || null, bio.pekerjaan_ibu || null, bio.pendidikan_ibu || null, bio.penghasilan_ibu || null, bio.telp_ibu || null, bio.tgl_lahir_ibu ? String(bio.tgl_lahir_ibu).substring(0,4) : null]
            );
        }
        if(bio.nama_wali) {
            await connection.query(
                `INSERT INTO siswa_orangtua (siswa_id, jenis, nama, pekerjaan, hp, hubungan, alamat)
                 VALUES (?, 'wali', ?, ?, ?, ?, ?)`,
                [siswaId, bio.nama_wali, bio.pekerjaan_wali || null, bio.telp_wali || null, bio.hubungan_wali || null, bio.alamat_wali || null]
            );
        }
        
        // 4.5. Migrasi Dokumen & Foto (sinkronisasi file upload)
        // Ensure FOTO exists in master_dokumen (auto-create if missing)
        await connection.query(`INSERT IGNORE INTO master_dokumen (kode, nama, is_required) VALUES ('FOTO', 'Pas Foto', 1)`);

        if(p.foto_path) {
            await connection.query(
                `INSERT INTO siswa_dokumen (siswa_id, kode_dokumen, nama_dokumen, status, file_path)
                 VALUES (?, 'FOTO', 'Pas Foto', 'Belum Verifikasi', ?)
                 ON DUPLICATE KEY UPDATE file_path = VALUES(file_path), status = 'Belum Verifikasi'`,
                [siswaId, p.foto_path]
            );
        }
        let berkas = {};
        try { berkas = typeof p.berkas_json === 'string' ? JSON.parse(p.berkas_json) : (p.berkas_json || {}); } catch(e){}
        // Use codes matching master_dokumen exactly
        if(berkas.kk) await connection.query(`INSERT INTO siswa_dokumen (siswa_id, kode_dokumen, nama_dokumen, status, file_path) VALUES (?, 'KK', 'Kartu Keluarga', 'Belum Verifikasi', ?) ON DUPLICATE KEY UPDATE file_path = VALUES(file_path), status = 'Belum Verifikasi'`, [siswaId, berkas.kk]);
        if(berkas.akte) await connection.query(`INSERT INTO siswa_dokumen (siswa_id, kode_dokumen, nama_dokumen, status, file_path) VALUES (?, 'AKTA_KELAHIRAN', 'Akta Kelahiran', 'Belum Verifikasi', ?) ON DUPLICATE KEY UPDATE file_path = VALUES(file_path), status = 'Belum Verifikasi'`, [siswaId, berkas.akte]);
        if(berkas.ijazah) await connection.query(`INSERT INTO siswa_dokumen (siswa_id, kode_dokumen, nama_dokumen, status, file_path) VALUES (?, 'IJAZAH', 'Ijazah SMP', 'Belum Verifikasi', ?) ON DUPLICATE KEY UPDATE file_path = VALUES(file_path), status = 'Belum Verifikasi'`, [siswaId, berkas.ijazah]);
        if(berkas.ktp_ortu) {
            // KTP Orang Tua maps to both KTP_IBU and KTP_BAPAK — use KTP_IBU as primary
            await connection.query(`INSERT INTO siswa_dokumen (siswa_id, kode_dokumen, nama_dokumen, status, file_path) VALUES (?, 'KTP_IBU', 'KTP Ibu', 'Belum Verifikasi', ?) ON DUPLICATE KEY UPDATE file_path = VALUES(file_path), status = 'Belum Verifikasi'`, [siswaId, berkas.ktp_ortu]);
            await connection.query(`INSERT INTO siswa_dokumen (siswa_id, kode_dokumen, nama_dokumen, status, file_path) VALUES (?, 'KTP_BAPAK', 'KTP Bapak', 'Belum Verifikasi', ?) ON DUPLICATE KEY UPDATE file_path = VALUES(file_path), status = 'Belum Verifikasi'`, [siswaId, berkas.ktp_ortu]);
        }

        // 5. Update status PPDB + simpan siswa_id untuk dashboard join
        await connection.query('UPDATE ppdb_registrations SET status = "accepted", siswa_id = ? WHERE id = ?', [siswaId, req.params.id]);

        await connection.commit();

        // 6. Kirim Notifikasi WhatsApp Penerimaan
        try {
            if (p.no_whatsapp) {
                const waService = require('../../services/whatsappService');
                const [kelasRows] = await pool.query('SELECT nama FROM kelas WHERE id = ? LIMIT 1', [kelas_id]);
                const kelasNama = kelasRows.length > 0 ? kelasRows[0].nama : 'Belum ditentukan';
                const waMessage = `🎉 *SELAMAT! Pendaftaran PPDB Diterima*\n\nDengan hormat, kami informasikan bahwa:\n\nNama: *${p.nama_lengkap}*\nNo. Registrasi: *${p.registration_number}*\nKelas Penempatan: *${kelasNama}*\n\nAnda telah *resmi diterima* sebagai siswa baru.\n\n📋 *Langkah Selanjutnya:*\n1. Cetak Bukti Penerimaan di portal PPDB\n2. Lakukan daftar ulang di sekolah\n\nTerima kasih dan selamat bergabung! 🙏`;
                await waService.sendMessage(p.no_whatsapp, waMessage);
                console.log(`[PPDB Accept] WA notification queued for ${p.no_whatsapp}`);
            }
        } catch (waErr) {
            console.error('[PPDB Accept] WA notification error (non-critical):', waErr.message);
        }

        res.json({ success: true, message: 'Siswa berhasil diterima dan data telah disinkronkan ke sistem akademik.' });
    } catch(err) {
        await connection.rollback();
        console.error('[PPDB Accept] Transaction failed:', err.message);
        res.status(500).json({ error: err.message });
    } finally {
        connection.release();
    }
});

// ==================== ROLLBACK ACCEPTANCE ====================
router.post('/ppdb/:id/rollback', async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        // 1. Get PPDB registration and linked siswa_id
        const [pRows] = await connection.query('SELECT * FROM ppdb_registrations WHERE id = ?', [req.params.id]);
        if (pRows.length === 0) throw new Error('Data pendaftar tidak ditemukan');
        const p = pRows[0];
        if (p.status !== 'accepted') throw new Error('Hanya pendaftar dengan status "Diterima" yang bisa di-rollback');
        if (!p.siswa_id) throw new Error('Tidak ada data siswa terhubung untuk di-rollback');

        const siswaId = p.siswa_id;

        // 2. Delete related records in reverse order
        await connection.query('DELETE FROM siswa_dokumen WHERE siswa_id = ?', [siswaId]);
        await connection.query('DELETE FROM siswa_orangtua WHERE siswa_id = ?', [siswaId]);
        await connection.query('DELETE FROM siswa WHERE id = ?', [siswaId]);

        // 3. Revert PPDB status
        await connection.query('UPDATE ppdb_registrations SET status = ?, siswa_id = NULL WHERE id = ?', ['pending_verification', req.params.id]);

        await connection.commit();
        console.log(`[PPDB Rollback] Successfully rolled back acceptance for PPDB ID ${req.params.id}, deleted siswa ID ${siswaId}`);

        res.json({ success: true, message: 'Penerimaan berhasil dibatalkan. Data siswa telah dihapus dan status dikembalikan ke Menunggu Verifikasi.' });
    } catch (err) {
        await connection.rollback();
        console.error('[PPDB Rollback] Failed:', err.message);
        res.status(500).json({ error: err.message });
    } finally {
        connection.release();
    }
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

        const extOriginal = path.extname(req.file.originalname).toLowerCase();
        const isImage = (req.file.mimetype.startsWith('image/') || ['.jpg', '.jpeg', '.png', '.webp'].includes(extOriginal)) && req.file.mimetype !== 'image/gif';

        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        let filename = `media-${uniqueSuffix}`;
        const uploadDir = path.join(__dirname, '../../uploads');

        if (isImage) {
            filename += '.webp';
            const filePath = path.join(uploadDir, filename);
            try {
                await sharp(req.file.buffer)
                    .resize(1920, 1920, { fit: 'inside', withoutEnlargement: true })
                    .webp({ quality: 80 })
                    .toFile(filePath);
            } catch (sharpError) {
                console.error('Sharp Error:', sharpError);
                // Fallback to original if sharp fails
                const ext = path.extname(req.file.originalname) || '.jpg';
                filename = `media-${uniqueSuffix}${ext}`;
                fs.writeFileSync(path.join(uploadDir, filename), req.file.buffer);
            }
        } else {
            const ext = path.extname(req.file.originalname);
            filename += ext;
            fs.writeFileSync(path.join(uploadDir, filename), req.file.buffer);
        }

        const fileUrl = `/uploads/${filename}`;

        const [result] = await pool.query(
            'INSERT INTO cms_media (filename, original_name, mimetype, size, path, uploaded_by) VALUES (?, ?, ?, ?, ?, ?)',
            [filename, req.file.originalname, isImage ? 'image/webp' : req.file.mimetype, req.file.size, fileUrl, req.user?.id || null]
        );

        res.status(201).json({
            id: result.insertId,
            url: fileUrl,
            filename: filename,
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
        const {
            icon, title, slug, tagline, description, banner_image,
            color_theme, features_json, full_content, sort_order,
            milestones_json, showcase_json, alumni_json, stats_json, careers_json
        } = req.body;

        // Auto-generate slug if not provided
        const finalSlug = slug || title.toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');

        const [result] = await pool.query(
            `INSERT INTO cms_programs 
            (icon, title, slug, tagline, description, banner_image, color_theme, features_json, full_content, sort_order, milestones_json, showcase_json, alumni_json, stats_json, careers_json) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [icon || '📚', title, finalSlug, tagline || null, description || null,
            banner_image || null, color_theme || '#4f46e5',
            JSON.stringify(features_json || []), full_content || null, sort_order || 0,
            JSON.stringify(milestones_json || []), JSON.stringify(showcase_json || []),
            JSON.stringify(alumni_json || []), JSON.stringify(stats_json || {}),
            JSON.stringify(careers_json || [])]
        );
        invalidateCache('/api/public/programs');
        res.status(201).json({ id: result.insertId });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/programs/:id', async (req, res) => {
    try {
        const {
            icon, title, slug, tagline, description, banner_image,
            color_theme, features_json, full_content, sort_order, is_active,
            milestones_json, showcase_json, alumni_json, stats_json, careers_json
        } = req.body;

        await pool.query(
            `UPDATE cms_programs SET 
                icon = ?, title = ?, slug = ?, tagline = ?, description = ?, 
                banner_image = ?, color_theme = ?, features_json = ?, 
                full_content = ?, sort_order = ?, is_active = ?,
                milestones_json = ?, showcase_json = ?, alumni_json = ?, stats_json = ?, careers_json = ? 
            WHERE id = ?`,
            [icon, title, slug, tagline, description, banner_image, color_theme,
                JSON.stringify(features_json || []), full_content, sort_order || 0, is_active ?? true,
                JSON.stringify(milestones_json || []), JSON.stringify(showcase_json || []),
                JSON.stringify(alumni_json || []), JSON.stringify(stats_json || {}),
                JSON.stringify(careers_json || []), req.params.id]
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
        const { name, logo_url, category, website_url, sort_order } = req.body;
        const [result] = await pool.query(
            'INSERT INTO cms_partners (name, logo_url, category, website_url, sort_order) VALUES (?, ?, ?, ?, ?)',
            [name, logo_url, category || 'mitra', website_url || null, sort_order || 0]
        );
        invalidateCache('/api/public/partners');
        res.status(201).json({ id: result.insertId });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/partners/:id', async (req, res) => {
    try {
        const { name, logo_url, category, website_url, sort_order, is_active } = req.body;
        await pool.query(
            'UPDATE cms_partners SET name = ?, logo_url = ?, category = ?, website_url = ?, sort_order = ?, is_active = ? WHERE id = ?',
            [name, logo_url, category || 'mitra', website_url, sort_order || 0, is_active ?? true, req.params.id]
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

// ==================== TESTIMONIALS ====================

router.get('/testimonials', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM cms_testimonials ORDER BY sort_order ASC');
        res.json(rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/testimonials', async (req, res) => {
    try {
        const { name, role, company, photo_url, quote, rating, sort_order } = req.body;
        const [result] = await pool.query(
            'INSERT INTO cms_testimonials (name, role, company, photo_url, quote, rating, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [name, role || null, company || null, photo_url || null, quote, rating || 5, sort_order || 0]
        );
        invalidateCache('/api/public/testimonials');
        res.status(201).json({ id: result.insertId });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/testimonials/:id', async (req, res) => {
    try {
        const { name, role, company, photo_url, quote, rating, sort_order, is_active } = req.body;
        await pool.query(
            'UPDATE cms_testimonials SET name = ?, role = ?, company = ?, photo_url = ?, quote = ?, rating = ?, sort_order = ?, is_active = ? WHERE id = ?',
            [name, role, company, photo_url, quote, rating || 5, sort_order || 0, is_active ?? true, req.params.id]
        );
        invalidateCache('/api/public/testimonials');
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/testimonials/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM cms_testimonials WHERE id = ?', [req.params.id]);
        invalidateCache('/api/public/testimonials');
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// ==================== GALLERY ====================

router.get('/gallery', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM cms_gallery ORDER BY sort_order ASC');
        res.json(rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/gallery', async (req, res) => {
    try {
        const { title, image_url, category, description, sort_order } = req.body;
        const [result] = await pool.query(
            'INSERT INTO cms_gallery (title, image_url, category, description, sort_order) VALUES (?, ?, ?, ?, ?)',
            [title, image_url, category || null, description || null, sort_order || 0]
        );
        invalidateCache('/api/public/gallery');
        res.status(201).json({ id: result.insertId });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/gallery/:id', async (req, res) => {
    try {
        const { title, image_url, category, description, sort_order, is_active } = req.body;
        await pool.query(
            'UPDATE cms_gallery SET title = ?, image_url = ?, category = ?, description = ?, sort_order = ?, is_active = ? WHERE id = ?',
            [title, image_url, category, description, sort_order || 0, is_active ?? true, req.params.id]
        );
        invalidateCache('/api/public/gallery');
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/gallery/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM cms_gallery WHERE id = ?', [req.params.id]);
        invalidateCache('/api/public/gallery');
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// ==================== FAQ ====================

router.get('/faq', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM cms_faq ORDER BY sort_order ASC');
        res.json(rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/faq', async (req, res) => {
    try {
        const { question, answer, category, sort_order } = req.body;
        const [result] = await pool.query(
            'INSERT INTO cms_faq (question, answer, category, sort_order) VALUES (?, ?, ?, ?)',
            [question, answer, category || null, sort_order || 0]
        );
        invalidateCache('/api/public/faq');
        res.status(201).json({ id: result.insertId });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/faq/:id', async (req, res) => {
    try {
        const { question, answer, category, sort_order, is_active } = req.body;
        await pool.query(
            'UPDATE cms_faq SET question = ?, answer = ?, category = ?, sort_order = ?, is_active = ? WHERE id = ?',
            [question, answer, category, sort_order || 0, is_active ?? true, req.params.id]
        );
        invalidateCache('/api/public/faq');
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/faq/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM cms_faq WHERE id = ?', [req.params.id]);
        invalidateCache('/api/public/faq');
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// ==================== IDENTITY LOGOS ====================

router.get('/identity-logos', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM cms_identity_logos ORDER BY sort_order ASC');
        res.json(rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/identity-logos', async (req, res) => {
    try {
        const { label, name, logo_url, color_class, sort_order } = req.body;
        const [result] = await pool.query(
            'INSERT INTO cms_identity_logos (label, name, logo_url, color_class, sort_order) VALUES (?, ?, ?, ?, ?)',
            [label || 'Identitas', name, logo_url || null, color_class || 'yayasan', sort_order || 0]
        );
        invalidateCache('/api/public/identity-logos');
        res.status(201).json({ id: result.insertId });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/identity-logos/:id', async (req, res) => {
    try {
        const { label, name, logo_url, color_class, sort_order, is_active } = req.body;
        await pool.query(
            'UPDATE cms_identity_logos SET label = ?, name = ?, logo_url = ?, color_class = ?, sort_order = ?, is_active = ? WHERE id = ?',
            [label, name, logo_url, color_class, sort_order || 0, is_active ?? true, req.params.id]
        );
        invalidateCache('/api/public/identity-logos');
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/identity-logos/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM cms_identity_logos WHERE id = ?', [req.params.id]);
        invalidateCache('/api/public/identity-logos');
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// ==================== AGENDA ====================

router.get('/agenda', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM cms_agenda ORDER BY event_date ASC');
        res.json(rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/agenda', async (req, res) => {
    try {
        const { title, description, event_date, time, location, is_active } = req.body;
        const [result] = await pool.query(
            'INSERT INTO cms_agenda (title, description, event_date, time, location, is_active) VALUES (?, ?, ?, ?, ?, ?)',
            [title, description || null, event_date, time || null, location || null, is_active ?? 1]
        );
        invalidateCache('/api/public/agenda');
        res.status(201).json({ id: result.insertId });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/agenda/:id', async (req, res) => {
    try {
        const { title, description, event_date, time, location, is_active } = req.body;
        await pool.query(
            'UPDATE cms_agenda SET title = ?, description = ?, event_date = ?, time = ?, location = ?, is_active = ? WHERE id = ?',
            [title, description || null, event_date, time || null, location || null, is_active ?? 1, req.params.id]
        );
        invalidateCache('/api/public/agenda');
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/agenda/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM cms_agenda WHERE id = ?', [req.params.id]);
        invalidateCache('/api/public/agenda');
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// ==================== PPDB ANALYTICS ====================

router.get('/ppdb/analytics', async (req, res) => {
    try {
        // 1. Daily registrations (last 14 days)
        const [daily] = await pool.query(`
            SELECT DATE(created_at) as date, COUNT(*) as count
            FROM ppdb_registrations
            WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 14 DAY)
            GROUP BY DATE(created_at) ORDER BY date ASC
        `);

        // 2. Gender ratio
        const [gender] = await pool.query(`
            SELECT jenis_kelamin as jk, COUNT(*) as count
            FROM ppdb_registrations GROUP BY jenis_kelamin
        `);

        // 3. Top schools
        const [schools] = await pool.query(`
            SELECT asal_sekolah as sekolah, COUNT(*) as count
            FROM ppdb_registrations
            GROUP BY asal_sekolah ORDER BY count DESC LIMIT 10
        `);

        // 4. Funnel conversion
        const [totalRow] = await pool.query('SELECT COUNT(*) as c FROM ppdb_registrations');
        const [biodataRow] = await pool.query('SELECT COUNT(*) as c FROM ppdb_registrations WHERE completeness_pct >= 80');
        const [verifiedRow] = await pool.query("SELECT COUNT(*) as c FROM ppdb_registrations WHERE status IN ('pending_verification','wawancara','accepted','rejected')");
        const [acceptedRow] = await pool.query("SELECT COUNT(*) as c FROM ppdb_registrations WHERE status = 'accepted'");

        const funnel = [
            { stage: 'Pendaftaran', count: totalRow[0].c },
            { stage: 'Biodata Lengkap', count: biodataRow[0].c },
            { stage: 'Terverifikasi', count: verifiedRow[0].c },
            { stage: 'Diterima', count: acceptedRow[0].c }
        ];

        // 5. Per-gelombang stats
        const [gelombangStats] = await pool.query(`
            SELECT g.nama, g.kuota, COUNT(r.id) as terisi
            FROM ppdb_gelombang g
            LEFT JOIN ppdb_registrations r ON r.gelombang_id = g.id
            GROUP BY g.id ORDER BY g.id
        `);

        res.json({ daily, gender, schools, funnel, gelombangStats });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// ==================== PPDB GELOMBANG CRUD ====================

router.get('/ppdb/gelombang', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT g.*, (SELECT COUNT(*) FROM ppdb_registrations WHERE gelombang_id = g.id) as terisi FROM ppdb_gelombang g ORDER BY g.id ASC');
        res.json(rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/ppdb/gelombang', async (req, res) => {
    try {
        const { nama, kuota, biaya_daftar_ulang, tanggal_buka, tanggal_tutup, is_active } = req.body;
        const [result] = await pool.query(
            'INSERT INTO ppdb_gelombang (nama, kuota, biaya_daftar_ulang, tanggal_buka, tanggal_tutup, is_active) VALUES (?, ?, ?, ?, ?, ?)',
            [nama, kuota || 50, biaya_daftar_ulang || 1500000, tanggal_buka || null, tanggal_tutup || null, is_active ?? 1]
        );
        res.status(201).json({ success: true, id: result.insertId });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/ppdb/gelombang/:id', async (req, res) => {
    try {
        const { nama, kuota, biaya_daftar_ulang, tanggal_buka, tanggal_tutup, is_active } = req.body;
        await pool.query(
            'UPDATE ppdb_gelombang SET nama=?, kuota=?, biaya_daftar_ulang=?, tanggal_buka=?, tanggal_tutup=?, is_active=? WHERE id=?',
            [nama, kuota, biaya_daftar_ulang, tanggal_buka || null, tanggal_tutup || null, is_active ?? 1, req.params.id]
        );
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/ppdb/gelombang/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM ppdb_gelombang WHERE id = ?', [req.params.id]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// ==================== PPDB ANNOUNCEMENTS CRUD ====================

router.get('/ppdb/announcements', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM ppdb_announcements ORDER BY created_at DESC');
        res.json(rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/ppdb/announcements', async (req, res) => {
    try {
        const { judul, isi, tipe, is_active } = req.body;
        const [result] = await pool.query(
            'INSERT INTO ppdb_announcements (judul, isi, tipe, is_active) VALUES (?, ?, ?, ?)',
            [judul, isi || null, tipe || 'info', is_active ?? 1]
        );
        res.status(201).json({ success: true, id: result.insertId });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/ppdb/announcements/:id', async (req, res) => {
    try {
        const { judul, isi, tipe, is_active } = req.body;
        await pool.query(
            'UPDATE ppdb_announcements SET judul=?, isi=?, tipe=?, is_active=? WHERE id=?',
            [judul, isi || null, tipe || 'info', is_active ?? 1, req.params.id]
        );
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/ppdb/announcements/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM ppdb_announcements WHERE id = ?', [req.params.id]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
