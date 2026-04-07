const express = require('express');
const router = express.Router();
const pool = require('../../db');
const jwt = require('jsonwebtoken');
const { studentAuthMiddleware } = require('../../middleware/studentAuth');

// Student Login: NISN + Tanggal Lahir
router.post('/login', async (req, res) => {
    try {
        const { nisn, tglLahir } = req.body;
        if (!nisn || !tglLahir) return res.status(400).json({ error: 'NISN dan Tanggal Lahir wajib diisi' });

        const [rows] = await pool.query(`
            SELECT s.*, k.nama as kelas_nama 
            FROM siswa s 
            LEFT JOIN kelas k ON s.kelas_id = k.id 
            WHERE s.nisn = ?
        `, [nisn]);

        if (rows.length === 0) return res.status(401).json({ error: 'NISN tidak ditemukan' });

        const siswa = rows[0];
        // Compare date of birth
        const dbDate = siswa.tgl_lahir ? new Date(siswa.tgl_lahir).toISOString().split('T')[0] : null;
        const inputDate = new Date(tglLahir).toISOString().split('T')[0];

        if (dbDate !== inputDate) {
            return res.status(401).json({ error: 'Tanggal lahir tidak cocok' });
        }

        // Buat JWT token siswa (berlaku 12 jam)
        const token = jwt.sign(
            { studentId: siswa.id, nisn: siswa.nisn },
            process.env.JWT_SECRET,
            { expiresIn: '12h' }
        );

        res.json({
            token,
            student: {
                id: siswa.id,
                nisn: siswa.nisn,
                nis: siswa.nis,
                nama: siswa.nama,
                jk: siswa.jk,
                kelas: siswa.kelas_nama,
                kelasId: siswa.kelas_id,
                status: siswa.status,
                email: siswa.email,
                telp: siswa.telp,
                foto: siswa.foto || null
            }
        });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// Student Profile (full detail)
router.get('/profile', studentAuthMiddleware, async (req, res) => {
    try {
        const studentId = req.studentId;

        const [rows] = await pool.query(`
            SELECT s.*, k.nama as kelas_nama, u.nama as unit_nama
            FROM siswa s 
            LEFT JOIN kelas k ON s.kelas_id = k.id
            LEFT JOIN units u ON k.unit_id = u.id
            WHERE s.id = ?
        `, [studentId]);
        if (rows.length === 0) return res.status(404).json({ error: 'Siswa tidak ditemukan' });

        const siswa = rows[0];
        const [ortu] = await pool.query('SELECT * FROM siswa_orangtua WHERE siswa_id = ?', [siswa.id]);
        siswa.ayah = ortu.find(o => o.jenis === 'ayah') || {};
        siswa.ibu = ortu.find(o => o.jenis === 'ibu') || {};

        const [dok] = await pool.query('SELECT * FROM siswa_dokumen WHERE siswa_id = ?', [siswa.id]);
        siswa.dokumen = dok;

        res.json(siswa);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// Student Bills
router.get('/bills', studentAuthMiddleware, async (req, res) => {
    try {
        const studentId = req.studentId;

        const [rows] = await pool.query(`
            SELECT t.*, kt.nama as kategori_nama, ta.tahun as tahun_ajaran
            FROM tagihan t
            JOIN kategori_tagihan kt ON t.kategori_id = kt.id
            LEFT JOIN tahun_ajaran ta ON t.tahun_ajaran_id = ta.id
            WHERE t.siswa_id = ?
            ORDER BY t.tahun DESC, t.bulan DESC
        `, [studentId]);
        res.json(rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// Student Transactions
router.get('/transactions', studentAuthMiddleware, async (req, res) => {
    try {
        const studentId = req.studentId;

        const [rows] = await pool.query(`
            SELECT tr.*, s.nama as siswa_nama
            FROM transaksi tr
            JOIN siswa s ON tr.siswa_id = s.id
            WHERE tr.siswa_id = ?
            ORDER BY tr.tanggal DESC
        `, [studentId]);
        res.json(rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// Student Announcements (from CMS posts)
router.get('/announcements', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT * FROM posts 
            WHERE status = 'published' 
            ORDER BY created_at DESC 
            LIMIT 20
        `);
        res.json(rows);
    } catch (err) {
        // If posts table doesn't exist, return empty
        res.json([]);
    }
});



module.exports = router;