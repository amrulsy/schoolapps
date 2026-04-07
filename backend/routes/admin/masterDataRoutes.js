const express = require('express');
const router = express.Router();
const pool = require('../../db');

// --- MASTER DATA ROUTES ---

// Units
router.get('/api/units', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM units');
        res.json(rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/api/units', async (req, res) => {
    try {
        const [result] = await pool.query('INSERT INTO units (nama) VALUES (?)', [req.body.nama]);
        res.status(201).json({ id: result.insertId, nama: req.body.nama });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/api/units/:id', async (req, res) => {
    try {
        await pool.query('UPDATE units SET nama = ? WHERE id = ?', [req.body.nama, req.params.id]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/api/units/:id', async (req, res) => {
    try {
        // Cek apakah ada kelas di unit ini
        const [kelas] = await pool.query('SELECT id FROM kelas WHERE unit_id = ?', [req.params.id]);
        if (kelas.length > 0) {
            return res.status(400).json({ error: 'Tidak dapat menghapus Unit yang masih memiliki Kelas.' });
        }
        await pool.query('DELETE FROM units WHERE id = ?', [req.params.id]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// Kelas
router.get('/api/kelas', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM kelas');
        res.json(rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/api/kelas', async (req, res) => {
    try {
        const { unit_id, nama } = req.body;
        const [result] = await pool.query('INSERT INTO kelas (unit_id, nama) VALUES (?, ?)', [unit_id, nama]);
        res.status(201).json({ id: result.insertId, unit_id, nama });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/api/kelas/:id', async (req, res) => {
    try {
        await pool.query('UPDATE kelas SET nama = ? WHERE id = ?', [req.body.nama, req.params.id]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/api/kelas/:id', async (req, res) => {
    try {
        // Cek apakah ada siswa di kelas ini
        const [siswa] = await pool.query('SELECT id FROM siswa WHERE kelas_id = ?', [req.params.id]);
        if (siswa.length > 0) {
            return res.status(400).json({ error: 'Tidak dapat menghapus Kelas yang masih memiliki Siswa terdaftar.' });
        }
        await pool.query('DELETE FROM kelas WHERE id = ?', [req.params.id]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// Tahun Ajaran
router.get('/api/tahun-ajaran', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM tahun_ajaran ORDER BY tahun DESC');
        res.json(rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/api/tahun-ajaran', async (req, res) => {
    try {
        const { tahun, tanggal_mulai, tanggal_selesai } = req.body;
        const [result] = await pool.query(
            'INSERT INTO tahun_ajaran (tahun, status, tanggal_mulai, tanggal_selesai) VALUES (?, "nonaktif", ?, ?)', 
            [tahun, tanggal_mulai || null, tanggal_selesai || null]
        );
        res.status(201).json({ id: result.insertId, tahun, status: 'nonaktif' });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// Update tahun ajaran (dates)
router.put('/api/tahun-ajaran/:id', async (req, res) => {
    try {
        const { tahun, tanggal_mulai, tanggal_selesai } = req.body;
        await pool.query(
            'UPDATE tahun_ajaran SET tahun = ?, tanggal_mulai = ?, tanggal_selesai = ? WHERE id = ?',
            [tahun, tanggal_mulai || null, tanggal_selesai || null, req.params.id]
        );
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/api/tahun-ajaran/:id/status', async (req, res) => {
    try {
        await pool.query('UPDATE tahun_ajaran SET status = "nonaktif"');
        await pool.query('UPDATE tahun_ajaran SET status = "aktif" WHERE id = ?', [req.params.id]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// Set semester aktif for a tahun ajaran
router.put('/api/tahun-ajaran/:id/semester', async (req, res) => {
    try {
        const { semester_aktif } = req.body;
        if (!['Ganjil', 'Genap'].includes(semester_aktif)) {
            return res.status(400).json({ error: 'Semester harus Ganjil atau Genap' });
        }
        await pool.query('UPDATE tahun_ajaran SET semester_aktif = ? WHERE id = ?', [semester_aktif, req.params.id]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/api/tahun-ajaran/:id', async (req, res) => {
    try {
        const id = req.params.id;

        // ── GUARD: Cegah hapus tahun ajaran yang masih punya data historis ──
        const checks = [
            { table: 'nilai_semester',       label: 'nilai semester/rapor' },
            { table: 'tujuan_pembelajaran',  label: 'tujuan pembelajaran (TP)' },
            { table: 'wali_kelas',           label: 'penugasan wali kelas' },
            { table: 'siswa_kelas_history',  label: 'history kelas siswa' },
        ];
        for (const c of checks) {
            try {
                const [[{ cnt }]] = await pool.query(
                    `SELECT COUNT(*) as cnt FROM \`${c.table}\` WHERE tahun_ajaran_id = ?`, [id]
                );
                if (cnt > 0) {
                    return res.status(400).json({
                        error: `Tidak dapat menghapus Tahun Ajaran ini. Masih ada ${cnt} data ${c.label} yang terkait. Arsipkan tahun ajaran sebagai 'nonaktif' daripada menghapusnya.`
                    });
                }
            } catch (e) { /* tabel mungkin belum ada, skip */ }
        }
        // Cek tagihan (SET NULL sudah aman, tapi beri peringatan)
        const [[{ tagihanCnt }]] = await pool.query(
            'SELECT COUNT(*) as tagihanCnt FROM tagihan WHERE tahun_ajaran_id = ?', [id]
        );
        if (tagihanCnt > 0) {
            return res.status(400).json({
                error: `Tidak dapat menghapus Tahun Ajaran ini. Masih ada ${tagihanCnt} tagihan keuangan yang terkait. Arsipkan tahun ajaran sebagai 'nonaktif' daripada menghapusnya.`
            });
        }

        await pool.query('DELETE FROM tahun_ajaran WHERE id = ?', [id]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- Kategori Tagihan ---


// Kategori Tagihan
router.get('/api/categories', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM kategori_tagihan');
        res.json(rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/api/categories', async (req, res) => {
    try {
        const { kode, nama, nominal, tipe, keterangan } = req.body;
        const [result] = await pool.query(
            'INSERT INTO kategori_tagihan (kode, nama, nominal, tipe, keterangan) VALUES (?, ?, ?, ?, ?)',
            [kode, nama, nominal, tipe, keterangan]
        );
        res.status(201).json({ id: result.insertId, ...req.body });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/api/categories/:id', async (req, res) => {
    try {
        const { kode, nama, nominal, tipe, keterangan } = req.body;
        await pool.query(
            'UPDATE kategori_tagihan SET kode = ?, nama = ?, nominal = ?, tipe = ?, keterangan = ? WHERE id = ?',
            [kode, nama, nominal, tipe, keterangan, req.params.id]
        );
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/api/categories/:id', async (req, res) => {
    try {
        const id = req.params.id;

        // ── GUARD: Cegah hapus kategori yang masih punya tagihan lunas ──
        const [[{ lunasCnt }]] = await pool.query(
            'SELECT COUNT(*) as lunasCnt FROM tagihan WHERE kategori_id = ? AND status = ?',
            [id, 'lunas']
        );
        if (lunasCnt > 0) {
            return res.status(400).json({
                error: `Tidak dapat menghapus kategori ini. Ada ${lunasCnt} tagihan yang sudah LUNAS menggunakan kategori ini. Menghapus kategori akan menghilangkan riwayat pembayaran tersebut.`
            });
        }

        // Cek tagihan belum lunas (boleh dihapus tapi beri peringatan)
        const [[{ belumCnt }]] = await pool.query(
            'SELECT COUNT(*) as belumCnt FROM tagihan WHERE kategori_id = ? AND status = ?',
            [id, 'belum']
        );
        if (belumCnt > 0) {
            return res.status(400).json({
                error: `Tidak dapat menghapus kategori ini. Masih ada ${belumCnt} tagihan BELUM LUNAS yang menggunakan kategori ini. Selesaikan atau hapus tagihan tersebut terlebih dahulu.`
            });
        }

        await pool.query('DELETE FROM kategori_tagihan WHERE id = ?', [id]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});



module.exports = router;