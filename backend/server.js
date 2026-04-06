// SIAS — Main Server (Restarted to apply string-based visitor stats fix)
const express = require('express');
const cors = require('cors');
const path = require('path');
const http = require('http');
const pool = require('./db');
require('dotenv').config();
const waService = require('./services/whatsappService');
const socketService = require('./services/socket');

// Routes
const publicPortalRoutes = require('./routes/public/portal');
const adminCmsRoutes = require('./routes/admin/cms');
const adminBackupRoutes = require('./routes/admin/backup');
const authRoutes = require('./routes/admin/auth');
const studentMenusRoutes = require('./routes/admin/studentMenus');
const adminPresensiRoutes = require('./routes/admin/presensi');
const adminTabunganRoutes = require('./routes/admin/tabungan');
const adminBKRoutes = require('./routes/admin/bk');
const adminGuruRoutes = require('./routes/admin/guru');
const adminJadwalRoutes = require('./routes/admin/jadwal');
const adminJamPelajaranRoutes = require('./routes/admin/jamPelajaran');
const guruSessionRoutes = require('./routes/guru/session');
const guruRaporRoutes = require('./routes/guru/rapor');
const guruWaliKelasRoutes = require('./routes/guru/waliKelas');
const adminAkademikRoutes = require('./routes/admin/akademik');
const adminPesanRoutes = require('./routes/admin/pesan');
const adminInfaqRoutes = require('./routes/admin/infaq');
const adminSchoolSettingsRoutes = require('./routes/admin/schoolSettings');
const AttendanceController = require('./controllers/AttendanceController');
const adminLabRoutes = require('./routes/admin/lab');
const InventoryController = require('./controllers/InventoryController');

// Middleware
const { authMiddleware } = require('./middleware/auth');
const { studentAuthMiddleware } = require('./middleware/studentAuth');
const { rateLimiter } = require('./middleware/rateLimiter');
const { cacheMiddleware } = require('./middleware/cache');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const multer = require('multer');
const xlsx = require('xlsx');

const uploadTemp = multer({ dest: 'temp_uploads/' });

const storageDokumen = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = 'uploads/dokumen_siswa';
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        cb(null, `${req.params.id}_${Date.now()}_${file.originalname}`);
    }
});
const uploadDokumen = multer({ 
    storage: storageDokumen, 
    limits: { fileSize: 5 * 1024 * 1024 } 
});

const app = express();
const server = http.createServer(app);
const io = socketService.init(server);

app.use(express.json());
app.use(cors({ origin: true, credentials: true }));

// Request Logger
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    if (['POST', 'PUT'].includes(req.method)) {
        console.log('Body:', JSON.stringify(req.body));
    }
    next();
});

app.get('/test-ping', (req, res) => res.send('pong'));

// --- WALI KELAS ROUTES (ADMIN) ---
app.get('/api/wali-kelas', async (req, res) => {
    try {
        const { tahun_ajaran_id } = req.query;
        let query = `
            SELECT wk.*, g.nama as guru_nama, g.nip, k.nama as kelas_nama
            FROM wali_kelas wk
            JOIN guru g ON wk.guru_id = g.id
            JOIN kelas k ON wk.kelas_id = k.id
        `;
        const params = [];
        if (tahun_ajaran_id) { query += ' WHERE wk.tahun_ajaran_id = ?'; params.push(tahun_ajaran_id); }
        query += ' ORDER BY k.nama ASC';
        const [rows] = await pool.query(query, params);
        res.json(rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/wali-kelas', async (req, res) => {
    try {
        const { guru_id, kelas_id, tahun_ajaran_id } = req.body;
        if (!guru_id || !kelas_id) return res.status(400).json({ error: 'guru_id and kelas_id are required' });
        const [result] = await pool.query(
            `INSERT INTO wali_kelas (guru_id, kelas_id, tahun_ajaran_id) VALUES (?, ?, ?)
             ON DUPLICATE KEY UPDATE guru_id = VALUES(guru_id)`,
            [guru_id, kelas_id, tahun_ajaran_id]
        );
        res.status(201).json({ success: true, id: result.insertId });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/wali-kelas/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM wali_kelas WHERE id = ?', [req.params.id]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});


// Serve uploaded media files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// --- PUBLIC PORTAL ROUTES (no auth required, but rate limited) ---
app.use('/api/public', /* rateLimiter(60, 60000), cacheMiddleware(300), */ publicPortalRoutes);

// --- AUTH ROUTES ---
// Rate limit ketat untuk endpoint login (10 request per menit)
const loginRateLimit = rateLimiter(10, 60000);
app.use('/api/auth/me', authMiddleware);
app.use('/api/auth/login', loginRateLimit);
app.use('/api/auth', authRoutes);
app.use('/api/student/login', loginRateLimit);

// --- ADMIN CMS ROUTES (auth required) ---
app.use('/api/admin/cms', authMiddleware, adminCmsRoutes);
app.use('/api/admin/backup', authMiddleware, adminBackupRoutes);
app.use('/api/admin/student-menus', authMiddleware, studentMenusRoutes);
app.use('/api/admin/presensi', authMiddleware, adminPresensiRoutes);
app.use('/api/admin/tabungan', authMiddleware, adminTabunganRoutes);
app.use('/api/admin/guru', authMiddleware, adminGuruRoutes);
app.use('/api/admin/jadwal', authMiddleware, adminJadwalRoutes);
app.use('/api/admin/jam-pelajaran', authMiddleware, adminJamPelajaranRoutes);
app.use('/api/admin/bk', authMiddleware, adminBKRoutes);
app.use('/api/admin/infaq', authMiddleware, adminInfaqRoutes);
app.use('/api/admin/lab', authMiddleware, adminLabRoutes);

// --- GURU ROUTES (auth required, guru role inner validation) ---
app.use('/api/guru/session', authMiddleware, guruSessionRoutes);
app.use('/api/guru/rapor', authMiddleware, guruRaporRoutes);
app.use('/api/guru/wali-kelas', authMiddleware, guruWaliKelasRoutes);
app.use('/api/admin/akademik', authMiddleware, adminAkademikRoutes);
app.use('/api/admin/pesan', authMiddleware, adminPesanRoutes);

// --- RFID ATTENDANCE & SETTINGS ---
app.put('/api/students/:id/rfid', authMiddleware, AttendanceController.registerRfid);
app.post('/api/attendance/scan', AttendanceController.scanRfid); // Public/Gate access
app.get('/api/admin/attendance/settings', authMiddleware, AttendanceController.getSettings);
app.post('/api/admin/attendance/settings', authMiddleware, AttendanceController.updateSettings);

// --- LAB INVENTORY SCAN (Public/Kiosk access) ---
app.post('/api/lab/scan', InventoryController.scanBorrow);
app.get('/api/lab/student-loans/:rfid', InventoryController.getStudentActiveLoansByRfid);


// --- SCHOOL SETTINGS & WA STATUS ---
app.use('/api/admin/school-settings', authMiddleware, adminSchoolSettingsRoutes);


// --- STUDENT PORTAL API ROUTES ---
app.get('/api/student/menus', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM student_menus WHERE is_active = TRUE ORDER BY sort_order ASC, id ASC');
        res.json(rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// Semua endpoint student berikut memerlukan JWT student
app.get('/api/student/attendance/summary', studentAuthMiddleware, async (req, res) => {
    try {
        const studentId = req.studentId;
        const now = new Date();
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
        const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
        const [rows] = await pool.query(`SELECT COUNT(*) as presentCount FROM siswa_presensi WHERE siswa_id = ? AND status = 'hadir' AND tanggal BETWEEN ? AND ?`, [studentId, firstDayOfMonth, lastDayOfMonth]);
        res.json({ presentCount: rows[0].presentCount });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/student/tabungan', studentAuthMiddleware, async (req, res) => {
    try {
        const studentId = req.studentId;
        const [rows] = await pool.query(`SELECT id, tanggal as date, tipe as type, nominal as amount, note FROM tabungan WHERE siswa_id = ? ORDER BY tanggal DESC`, [studentId]);
        const totalSetor = rows.filter(r => r.type === 'setor').reduce((acc, r) => acc + Number(r.amount), 0);
        const totalTarik = rows.filter(r => r.type === 'tarik').reduce((acc, r) => acc + Number(r.amount), 0);
        const saldo = totalSetor - totalTarik;
        res.json({ saldo, history: rows });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/student/attendance', studentAuthMiddleware, async (req, res) => {
    try {
        const studentId = req.studentId;
        const [rows] = await pool.query(`
            SELECT sp.id, sp.tanggal as date, sp.status, sp.keterangan, a.jam_masuk, a.jam_pulang 
            FROM siswa_presensi sp
            LEFT JOIN attendances a ON sp.siswa_id = a.student_id AND sp.tanggal = a.tanggal
            WHERE sp.siswa_id = ? 
            ORDER BY sp.tanggal DESC LIMIT 50
        `, [studentId]);
        res.json(rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/student/bk', studentAuthMiddleware, async (req, res) => {
    try {
        const studentId = req.studentId;
        const [catatan] = await pool.query(`SELECT c.id, c.tanggal as date, c.keterangan, c.poin, kat.nama as kategori, kat.tipe FROM bk_catatan c JOIN bk_kategori kat ON c.bk_kategori_id = kat.id WHERE c.siswa_id = ? ORDER BY c.tanggal DESC`, [studentId]);
        let poinPelanggaran = 0, poinPrestasi = 0;
        const pelanggaran = catatan.filter(c => { if (c.tipe === 'pelanggaran') { poinPelanggaran += c.poin; return true; } return false; });
        const prestasi = catatan.filter(c => { if (c.tipe === 'prestasi') { poinPrestasi += c.poin; return true; } return false; });
        const tatatertib = ['Hadir tepat waktu', 'Seragam rapi', 'Menjaga kebersihan', 'Dilarang gadget', 'Hormat guru', 'Upacara Senin'];
        res.json({ poin: { pelanggaran: poinPelanggaran, prestasi: poinPrestasi, netPoin: poinPrestasi - poinPelanggaran }, pelanggaran, prestasi, tatatertib });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/student/nilai', studentAuthMiddleware, async (req, res) => {
    try {
        const studentId = req.studentId;
        const { semester, tahun_ajaran_id } = req.query;
        let query = `SELECT n.id, m.nama as mapel, n.tugas, n.uts, n.uas, n.akhir, m.tingkat FROM nilai_siswa n JOIN mata_pelajaran m ON n.mapel_id = m.id WHERE n.siswa_id = ?`;
        const params = [studentId];
        if (tahun_ajaran_id) { query += ' AND n.tahun_ajaran_id = ?'; params.push(tahun_ajaran_id); }
        if (semester) { query += ' AND n.semester = ?'; params.push(semester); }
        const [nilai] = await pool.query(query, params);
        const currentSemester = { semester: semester || 'Ganjil', tahunAjaran: '2025/2026' };
        const subjects = { muatanNasional: [], muatanKewilayahan: [], muatanPeminatan: [] };
        nilai.forEach(n => {
            const item = { subject: n.mapel, tugas: Number(n.tugas), uts: Number(n.uts), uas: Number(n.uas), final: Number(n.akhir), grade: getGrade(Number(n.akhir)) };
            if (n.tingkat === 'Nasional') subjects.muatanNasional.push(item); else if (n.tingkat === 'Kewilayahan') subjects.muatanKewilayahan.push(item); else subjects.muatanPeminatan.push(item);
        });
        res.json({ currentSemester, subjects });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/student/pesan', studentAuthMiddleware, async (req, res) => {
    try {
        const studentId = req.studentId;
        const [rows] = await pool.query(`SELECT p.*, a.nama as admin_nama FROM pesan p LEFT JOIN users a ON p.pengirim_id = a.id AND p.pengirim_type = 'admin' WHERE (p.pengirim_id = ? AND p.pengirim_type = 'student') OR (p.penerima_id = ? AND p.penerima_type = 'student') ORDER BY p.waktu ASC`, [studentId, studentId]);
        await pool.query(`UPDATE pesan SET is_read = TRUE WHERE penerima_id = ? AND penerima_type = 'student' AND is_read = FALSE`, [studentId]);
        res.json(rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/student/pesan', studentAuthMiddleware, async (req, res) => {
    try {
        const studentId = req.studentId;
        const { text } = req.body;
        const [result] = await pool.query(`INSERT INTO pesan (pengirim_id, pengirim_type, penerima_id, penerima_type, pesan, waktu, is_read) VALUES (?, 'student', 1, 'admin', ?, UTC_TIMESTAMP(), FALSE)`, [studentId, text]);
        res.status(201).json({ id: result.insertId, success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// Lab Peminjaman History (Student Portal)
app.get('/api/student/lab-peminjaman', studentAuthMiddleware, InventoryController.getStudentPeminjaman);

function getGrade(score) {
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'E';
}

// --- MASTER DATA ROUTES ---

// Units
app.get('/api/units', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM units');
        res.json(rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/units', async (req, res) => {
    try {
        const [result] = await pool.query('INSERT INTO units (nama) VALUES (?)', [req.body.nama]);
        res.status(201).json({ id: result.insertId, nama: req.body.nama });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/units/:id', async (req, res) => {
    try {
        await pool.query('UPDATE units SET nama = ? WHERE id = ?', [req.body.nama, req.params.id]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/units/:id', async (req, res) => {
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
app.get('/api/kelas', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM kelas');
        res.json(rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/kelas', async (req, res) => {
    try {
        const { unit_id, nama } = req.body;
        const [result] = await pool.query('INSERT INTO kelas (unit_id, nama) VALUES (?, ?)', [unit_id, nama]);
        res.status(201).json({ id: result.insertId, unit_id, nama });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/kelas/:id', async (req, res) => {
    try {
        await pool.query('UPDATE kelas SET nama = ? WHERE id = ?', [req.body.nama, req.params.id]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/kelas/:id', async (req, res) => {
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
app.get('/api/tahun-ajaran', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM tahun_ajaran ORDER BY tahun DESC');
        res.json(rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/tahun-ajaran', async (req, res) => {
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
app.put('/api/tahun-ajaran/:id', async (req, res) => {
    try {
        const { tahun, tanggal_mulai, tanggal_selesai } = req.body;
        await pool.query(
            'UPDATE tahun_ajaran SET tahun = ?, tanggal_mulai = ?, tanggal_selesai = ? WHERE id = ?',
            [tahun, tanggal_mulai || null, tanggal_selesai || null, req.params.id]
        );
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/tahun-ajaran/:id/status', async (req, res) => {
    try {
        await pool.query('UPDATE tahun_ajaran SET status = "nonaktif"');
        await pool.query('UPDATE tahun_ajaran SET status = "aktif" WHERE id = ?', [req.params.id]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// Set semester aktif for a tahun ajaran
app.put('/api/tahun-ajaran/:id/semester', async (req, res) => {
    try {
        const { semester_aktif } = req.body;
        if (!['Ganjil', 'Genap'].includes(semester_aktif)) {
            return res.status(400).json({ error: 'Semester harus Ganjil atau Genap' });
        }
        await pool.query('UPDATE tahun_ajaran SET semester_aktif = ? WHERE id = ?', [semester_aktif, req.params.id]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/tahun-ajaran/:id', async (req, res) => {
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
app.get('/api/categories', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM kategori_tagihan');
        res.json(rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/categories', async (req, res) => {
    try {
        const { kode, nama, nominal, tipe, keterangan } = req.body;
        const [result] = await pool.query(
            'INSERT INTO kategori_tagihan (kode, nama, nominal, tipe, keterangan) VALUES (?, ?, ?, ?, ?)',
            [kode, nama, nominal, tipe, keterangan]
        );
        res.status(201).json({ id: result.insertId, ...req.body });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/categories/:id', async (req, res) => {
    try {
        const { kode, nama, nominal, tipe, keterangan } = req.body;
        await pool.query(
            'UPDATE kategori_tagihan SET kode = ?, nama = ?, nominal = ?, tipe = ?, keterangan = ? WHERE id = ?',
            [kode, nama, nominal, tipe, keterangan, req.params.id]
        );
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/categories/:id', async (req, res) => {
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

// --- SISWA ROUTES ---

app.get('/api/siswa', async (req, res) => {
    try {
        // Gabungkan dengan nama kelas
        const [rows] = await pool.query(`
            SELECT s.*, k.nama as kelas_nama 
            FROM siswa s 
            LEFT JOIN kelas k ON s.kelas_id = k.id
        `);
        res.json(rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/siswa/:id', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM siswa WHERE id = ?', [req.params.id]);
        if (rows.length === 0) return res.status(404).json({ error: 'Siswa tidak ditemukan' });

        const siswa = rows[0];

        // Ambil Orang Tua
        const [ortu] = await pool.query('SELECT * FROM siswa_orangtua WHERE siswa_id = ?', [siswa.id]);
        siswa.ayah = ortu.find(o => o.jenis === 'ayah') || {};
        siswa.ibu = ortu.find(o => o.jenis === 'ibu') || {};
        siswa.wali_detail = ortu.find(o => o.jenis === 'wali') || {};

        // Ambil Dokumen (merge dengan master_dokumen)
        const [dok] = await pool.query(`
            SELECT m.kode as kode_dokumen, m.nama as nama_dokumen, m.is_required, 
                   COALESCE(sd.status, 'Tidak Ada') as status, sd.file_size, sd.file_path, sd.id as siswa_dok_id
            FROM master_dokumen m
            LEFT JOIN siswa_dokumen sd ON m.kode = sd.kode_dokumen AND sd.siswa_id = ?
        `, [siswa.id]);
        siswa.dokumen = dok;
        const fotoDoc = dok.find(d => d.kode_dokumen === 'FOTO' && d.file_path);
        if (fotoDoc) siswa.foto_path = fotoDoc.file_path;

        res.json(siswa);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

    app.post('/api/siswa', async (req, res) => {
    try {
        const {
            nisn, nis, nama, jk, status, tempatLahir, tglLahir, telp, alamat, wali, kelasId,
            angkatan, jenis_pendaftaran, tanggal_mulai_sekolah
        } = req.body;

        const nisnVal = nisn || null;
        const nisVal = nis || null;

        const [result] = await pool.query(`
            INSERT INTO siswa 
            (nisn, nis, nama, jk, status, tempat_lahir, tgl_lahir, telp, alamat, wali, kelas_id, angkatan, jenis_pendaftaran, tanggal_mulai_sekolah) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [nisnVal, nisVal, nama, jk, status || 'aktif', tempatLahir, tglLahir || null, telp, alamat, wali, kelasId, angkatan || null, jenis_pendaftaran || 'Baru', tanggal_mulai_sekolah || null]);

        res.status(201).json({ id: result.insertId });
    } catch (err) { 
        console.error('[POST /api/siswa] Error:', err);
        let errorMsg = 'Gagal menambah siswa: ' + err.message;
        if (err.code === 'ER_DUP_ENTRY') errorMsg = 'Gagal: NIS atau NISN sudah terdaftar di siswa lain.';
        if (err.code === 'ER_BAD_FIELD_ERROR') errorMsg = 'Gagal: Struktur database tidak sesuai. Silakan jalankan script migrasi terbaru.';
        res.status(500).json({ error: errorMsg }); 
    }
});


app.put('/api/siswa/:id', async (req, res) => {
    try {
        const {
            nisn, nis, nama, jk, status, tempatLahir, tglLahir, telp, alamat, wali, kelasId,
            angkatan, jenis_pendaftaran, tanggal_mulai_sekolah,
            ayah, ibu, wali_detail
        } = req.body;

        const nisnVal = nisn || null;
        const nisVal = nis || null;
        const siswaId = req.params.id;

        // 0. Ambil data siswa sebelum update (untuk deteksi perubahan kelas)
        const [[siswaLama]] = await pool.query('SELECT kelas_id FROM siswa WHERE id = ?', [siswaId]);
        const kelasLamaId = siswaLama ? siswaLama.kelas_id : null;

        // 1. Update Siswa Dasar
        await pool.query(`
            UPDATE siswa SET 
                nisn = ?, nis = ?, nama = ?, jk = ?, status = ?, 
                tempat_lahir = ?, tgl_lahir = ?, telp = ?, 
                alamat = ?, wali = ?, kelas_id = ?,
                angkatan = ?, jenis_pendaftaran = ?, tanggal_mulai_sekolah = ?
            WHERE id = ?
        `, [nisnVal, nisVal, nama, jk, status, tempatLahir, tglLahir || null, telp, alamat, wali, kelasId, angkatan || null, jenis_pendaftaran || 'Baru', tanggal_mulai_sekolah || null, siswaId]);

        // 1b. Jika kelas_id berubah → catat snapshot ke siswa_kelas_history
        if (kelasId && String(kelasId) !== String(kelasLamaId)) {
            try {
                const [[ta]] = await pool.query(
                    `SELECT id, tahun, semester_aktif FROM tahun_ajaran WHERE status = 'aktif' LIMIT 1`
                );
                const [[kelas]] = await pool.query('SELECT nama FROM kelas WHERE id = ?', [kelasId]);
                if (ta && kelas) {
                    await pool.query(`
                        INSERT INTO siswa_kelas_history 
                            (siswa_id, kelas_id, nama_kelas, tahun_ajaran_id, nama_tahun_ajaran, semester)
                        VALUES (?, ?, ?, ?, ?, ?)
                        ON DUPLICATE KEY UPDATE
                            kelas_id = VALUES(kelas_id), nama_kelas = VALUES(nama_kelas)
                    `, [siswaId, kelasId, kelas.nama, ta.id, ta.tahun, ta.semester_aktif || 'Ganjil']);
                }
            } catch (e) {
                // Graceful fail: migration 012 mungkin belum dijalankan
                console.warn('[siswa_kelas_history] Snapshot gagal:', e.message);
            }
        }

        // 2. Update/Insert Orang Tua (Ayah, Ibu, Wali)
        const updateParent = async (jenis, p) => {
            if (!p || !p.nama) return;
            const fields = ['nama', 'nik', 'pendidikan', 'pekerjaan', 'penghasilan', 'hp', 'status_hidup', 'hubungan', 'alamat'];
            const vals = fields.map(f => p[f] || null);
            await pool.query(`
                INSERT INTO siswa_orangtua (siswa_id, jenis, nama, nik, pendidikan, pekerjaan, penghasilan, hp, status_hidup, hubungan, alamat)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE 
                nama=VALUES(nama), nik=VALUES(nik), pendidikan=VALUES(pendidikan),
                pekerjaan=VALUES(pekerjaan), penghasilan=VALUES(penghasilan),
                hp=VALUES(hp), status_hidup=VALUES(status_hidup),
                hubungan=VALUES(hubungan), alamat=VALUES(alamat)
            `, [siswaId, jenis, ...vals]);
        };

        if (ayah) await updateParent('ayah', ayah);
        if (ibu) await updateParent('ibu', ibu);
        if (wali_detail) await updateParent('wali', wali_detail);

        res.json({ success: true });
    } catch (err) { 
        console.error('[PUT /api/siswa/:id] Error:', err);
        let errorMsg = 'Gagal memperbarui siswa: ' + err.message;
        if (err.code === 'ER_DUP_ENTRY') errorMsg = 'Gagal: NIS atau NISN sudah digunakan siswa lain.';
        if (err.code === 'ER_BAD_FIELD_ERROR') errorMsg = 'Gagal: Struktur database tidak sesuai (mungkin kolom hubungan/alamat/semester_aktif belum ada).';
        res.status(500).json({ error: errorMsg }); 
    }
});


app.delete('/api/siswa/:id', async (req, res) => {
    // ─────────────────────────────────────────────────────────────────────
    // PERUBAHAN PENTING: Siswa TIDAK PERNAH dihapus secara fisik.
    // Menghapus siswa akan merusak integritas data historis (tabungan,
    // infaq, absensi, nilai, jurnal). Sebagai gantinya, status siswa
    // diubah menjadi 'keluar' atau 'lulus'.
    // Gunakan query param ?status=lulus|pindah|keluar (default: keluar)
    // ─────────────────────────────────────────────────────────────────────
    const { id } = req.params;
    const newStatus = ['lulus', 'pindah', 'keluar'].includes(req.query.status)
        ? req.query.status
        : 'keluar';

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        // Pastikan siswa ada
        const [[siswa]] = await connection.query(
            'SELECT id, nama, status FROM siswa WHERE id = ?', [id]
        );
        if (!siswa) {
            await connection.rollback();
            return res.status(404).json({ error: 'Siswa tidak ditemukan' });
        }

        // Hitung riwayat untuk response info
        const [[{ tagihanCnt }]] = await connection.query(
            'SELECT COUNT(*) as tagihanCnt FROM tagihan WHERE siswa_id = ?', [id]
        );
        const [[{ tabunganCnt }]] = await connection.query(
            'SELECT COUNT(*) as tabunganCnt FROM tabungan WHERE siswa_id = ?', [id]
        );
        const [[{ infaqCnt }]] = await connection.query(
            'SELECT COUNT(*) as infaqCnt FROM infaq_harian WHERE siswa_id = ?', [id]
        );

        // Soft-delete: ubah status & lepas dari kelas
        await connection.query(
            'UPDATE siswa SET status = ?, kelas_id = NULL WHERE id = ?',
            [newStatus, id]
        );

        await connection.commit();
        res.json({
            success: true,
            action: 'soft_delete',
            message: `Siswa "${siswa.nama}" telah dinonaktifkan (status: ${newStatus}). Semua riwayat historis tetap tersimpan.`,
            preserved: {
                tagihan: tagihanCnt,
                tabungan: tabunganCnt,
                infaq: infaqCnt
            }
        });
    } catch (err) {
        await connection.rollback();
        console.error('Soft-Delete Siswa Error:', err);
        res.status(500).json({ error: err.message });
    } finally {
        connection.release();
    }
});

// --- BULK IMPORT SISWA ---
app.post('/api/siswa/import', uploadTemp.single('file'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'Tidak ada file yang diunggah' });

        const workbook = xlsx.readFile(req.file.path);
        let sheetName = workbook.SheetNames[0];
        
        // Cek dulu apakah sheet "Data Siswa" ada (dari format baru), jika tidak ambil sheet pertama
        if (workbook.SheetNames.includes('Data Siswa')) {
            sheetName = 'Data Siswa';
        }

        const worksheet = workbook.Sheets[sheetName];
        
        // Autodetect header row
        // If cell A1 contains 'Aplikasi', headers are at row 3 (range: 2)
        // Otherwise, assume headers are at top (range: 0)
        let headerRowIndex = 0;
        const a1Val = worksheet['A1'] ? worksheet['A1'].v : '';
        if (typeof a1Val === 'string' && a1Val.includes('APLIKASI SISTEM INFORMASI')) {
            headerRowIndex = 2; // Row 3
        }

        // Terapkan parsing berdasarkan range header
        const data = xlsx.utils.sheet_to_json(worksheet, { range: headerRowIndex });
        
        const fs = require('fs');
        if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);

        if (!data || data.length === 0) return res.status(400).json({ error: 'Data kosong / Sheet pertama kosong' });

        // Ambil data kelas untuk mapping
        const [kelasRows] = await pool.query('SELECT id, nama FROM kelas');
        const kelasMap = {};
        kelasRows.forEach(k => kelasMap[k.nama.toLowerCase().trim()] = k.id);

        const connection = await pool.getConnection();
        await connection.beginTransaction();

        try {
            let successCount = 0;

            for (const row of data) {
                const nama = row['Nama'] || 'Nama Tidak Diketahui';
                const nisn = row['NISN'] || null;
                const nis = row['NIS'] || null;
                const tempatLahir = row['Tempat Lahir'] || null;
                
                let tglLahir = null;
                if (row['Tanggal Lahir']) {
                    const rawDate = row['Tanggal Lahir'];
                    if (typeof rawDate === 'number') {
                        // Excel serial date to JS Date (epoch start 1900)
                        const jsDate = new Date(Math.round((rawDate - 25569) * 86400 * 1000));
                        tglLahir = jsDate.toISOString().split('T')[0];
                    } else if (typeof rawDate === 'string') {
                        try {
                            tglLahir = new Date(rawDate).toISOString().split('T')[0];
                        } catch(e) { /* ignore invalid dates */ }
                    }
                }

                const jkStr = row['Jenis Kelamin'] || '';
                const jk = jkStr.toLowerCase().startsWith('p') ? 'P' : 'L';

                const agama = row['Agama'] || null;
                const alamat = row['Alamat'] || null;
                const rt = row['RT']?.toString() || null;
                const rw = row['RW']?.toString() || null;
                const dusun = row['Dusun'] || null;
                const kelurahan = row['Kelurahan'] || null;
                const kecamatan = row['Kecamatan'] || null;
                const kodepos = row['Kode Pos']?.toString() || null;
                const jenisTinggal = row['Jenis Tinggal'] || null;
                const nik = row['NIK']?.toString() || null;
                const rombelStr = row['Rombel Saat Ini']?.toString().toLowerCase().trim() || '';
                const kelas_id = kelasMap[rombelStr] || null;

                const [siswaRes] = await connection.query(`
                    INSERT INTO siswa 
                    (nama, nisn, nis, tempat_lahir, tgl_lahir, jk, agama, alamat, rt, rw, dusun, kelurahan, kecamatan, kodepos, jenis_tinggal, nik, kelas_id)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `, [nama, nisn, nis, tempatLahir, tglLahir, jk, agama, alamat, rt, rw, dusun, kelurahan, kecamatan, kodepos, jenisTinggal, nik, kelas_id]);

                const siswa_id = siswaRes.insertId;

                const insertParent = async (jenis, namaOrtu, tahunLahir, pendidikan, pekerjaan, penghasilan, nikOrtu) => {
                    if (!namaOrtu) return;
                    await connection.query(`
                        INSERT INTO siswa_orangtua (siswa_id, jenis, nama, tahun_lahir, pendidikan, pekerjaan, penghasilan, nik)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                    `, [siswa_id, jenis, namaOrtu, tahunLahir?.toString() || null, pendidikan || null, pekerjaan || null, penghasilan?.toString() || null, nikOrtu?.toString() || null]);
                };

                await insertParent('ayah', row['Nama Ayah'], row['Tahun Lahir Ayah'], row['Jenjang Pendidikan Ayah'], row['Pekerjaan Ayah'], row['Penghasilan Ayah'], row['NIK Ayah']);
                await insertParent('ibu', row['Nama Ibu'], row['Tahun Lahir Ibu'], row['Jenjang Pendidikan Ibu'], row['Pekerjaan Ibu'], row['Penghasilan Ibu'], row['NIK Ibu']);

                successCount++;
            }

            await connection.commit();
            res.json({ success: true, count: successCount });
        } catch (txnErr) {
            await connection.rollback();
            res.status(500).json({ error: 'Gagal import (Rollback): ' + txnErr.message });
        } finally {
            connection.release();
        }

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- MASTER DOKUMEN & SISWA DOKUMEN ROUTES ---

app.get('/api/admin/master-dokumen', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM master_dokumen ORDER BY id ASC');
        res.json(rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/admin/master-dokumen', async (req, res) => {
    try {
        const { kode, nama, is_required, keterangan } = req.body;
        await pool.query(
            'INSERT INTO master_dokumen (kode, nama, is_required, keterangan) VALUES (?, ?, ?, ?)',
            [kode, nama, is_required !== undefined ? is_required : true, keterangan || null]
        );
        res.status(201).json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/admin/master-dokumen/:id', async (req, res) => {
    try {
        const { kode, nama, is_required, keterangan } = req.body;
        await pool.query(
            'UPDATE master_dokumen SET kode = ?, nama = ?, is_required = ?, keterangan = ? WHERE id = ?',
            [kode, nama, is_required !== undefined ? is_required : true, keterangan || null, req.params.id]
        );
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/admin/master-dokumen/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM master_dokumen WHERE id = ?', [req.params.id]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// Upload Dokumen Siswa
app.post('/api/siswa/:id/dokumen', uploadDokumen.single('file'), async (req, res) => {
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

// --- TAGIHAN ROUTES ---

app.get('/api/tagihan', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT t.*, s.nama as siswa_nama, 
                   COALESCE(k_hist.nama, k_curr.nama) as kelas_nama, 
                   kt.nama as kategori_nama, ta.tahun as tahun_ajaran
            FROM tagihan t
            JOIN siswa s ON t.siswa_id = s.id
            LEFT JOIN kelas k_hist ON t.kelas_id = k_hist.id
            LEFT JOIN kelas k_curr ON s.kelas_id = k_curr.id
            JOIN kategori_tagihan kt ON t.kategori_id = kt.id
            LEFT JOIN tahun_ajaran ta ON t.tahun_ajaran_id = ta.id
        `);
        res.json(rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/tagihan', async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        const { tagihanList, logData } = req.body;
        if (!tagihanList || !Array.isArray(tagihanList)) {
            return res.status(400).json({ error: 'Data tagihan tidak valid' });
        }

        // 1. Create Log Entry
        let logId = null;
        if (logData) {
            const [logResult] = await connection.query(`
                INSERT INTO log_generate (tipe, keterangan, jumlah_tagihan, operator, created_at)
                VALUES (?, ?, ?, ?, UTC_TIMESTAMP())
            `, [logData.tipe, logData.keterangan, tagihanList.length, logData.operator]);
            logId = logResult.insertId;
        }

        // 2. Insert Bills
        const values = tagihanList.map(t => [
            t.siswa_id, t.kategori_id, t.tahun_ajaran_id, t.bulan, t.tahun,
            t.nominal_asli, t.nominal, t.status || 'belum', t.kelas_id || null, logId
        ]);

        const [result] = await connection.query(`
            INSERT INTO tagihan 
            (siswa_id, kategori_id, tahun_ajaran_id, bulan, tahun, nominal_asli, nominal, status, kelas_id, log_generate_id) 
            VALUES ?
        `, [values]);

        await connection.commit();
        res.status(201).json({ success: true, count: result.affectedRows, logId });
    } catch (err) {
        await connection.rollback();
        res.status(500).json({ error: err.message });
    } finally {
        connection.release();
    }
});

app.get('/api/log-generate', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM log_generate ORDER BY created_at DESC');
        res.json(rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/log-generate/:id', async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        // Cek apakah ada yang sudah dibayar
        const [paidCount] = await connection.query('SELECT COUNT(*) as count FROM tagihan WHERE log_generate_id = ? AND status = "lunas"', [req.params.id]);
        if (paidCount[0].count > 0) {
            return res.status(400).json({ error: 'Tidak bisa roolback, beberapa tagihan sudah dibayar.' });
        }

        // Hapus tagihan
        await connection.query('DELETE FROM tagihan WHERE log_generate_id = ?', [req.params.id]);
        // Hapus log
        await connection.query('DELETE FROM log_generate WHERE id = ?', [req.params.id]);

        await connection.commit();
        res.json({ success: true });
    } catch (err) {
        await connection.rollback();
        res.status(500).json({ error: err.message });
    } finally {
        connection.release();
    }
});

app.delete('/api/tagihan/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM tagihan WHERE id = ?', [req.params.id]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- TRANSAKSI & PEMBAYARAN ROUTES ---

app.get('/api/transactions', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT t.*, s.nama as siswa_nama
            FROM transaksi t
            JOIN siswa s ON t.siswa_id = s.id
            ORDER BY t.tanggal DESC
        `);
        res.json(rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/transactions/:id', async (req, res) => {
    try {
        const [txRows] = await pool.query(`
            SELECT t.*, s.nama as siswa_nama, s.nisn as siswa_nisn, k.nama as kelas_nama
            FROM transaksi t
            JOIN siswa s ON t.siswa_id = s.id
            LEFT JOIN kelas k ON s.kelas_id = k.id
            WHERE t.id = ?
        `, [req.params.id]);

        if (txRows.length === 0) return res.status(404).json({ error: 'Transaksi tidak ditemukan' });

        const tx = txRows[0];

        // Ambil Item Tagihan
        const [billRows] = await pool.query(`
            SELECT t.*, kt.nama as kategori, ta.tahun as tahunAjaran
            FROM tagihan t
            JOIN kategori_tagihan kt ON t.kategori_id = kt.id
            LEFT JOIN tahun_ajaran ta ON t.tahun_ajaran_id = ta.id
            WHERE t.transaksi_id = ?
        `, [req.params.id]);

        tx.items = billRows;

        // Map field names to match frontend expectations if necessary
        tx.invoiceNo = tx.invoice_no;
        tx.amountPaid = tx.amount_paid;
        tx.change = tx.change_amount;
        tx.student = {
            nama: tx.siswa_nama,
            nisn: tx.siswa_nisn,
            kelas: tx.kelas_nama
        };

        res.json(tx);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/transactions/:id/void', async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        const txId = req.params.id;

        const [txRows] = await connection.query(
            'SELECT invoice_no, status FROM transaksi WHERE id = ?', [txId]
        );
        if (txRows.length === 0) throw new Error('Transaksi tidak ditemukan');
        if (txRows[0].status === 'void') {
            await connection.rollback();
            return res.status(400).json({ error: 'Transaksi sudah berstatus void.' });
        }
        const invoiceNo = txRows[0].invoice_no;

        // 1. Update Status Transaksi → void
        await connection.query('UPDATE transaksi SET status = "void" WHERE id = ?', [txId]);

        // 2. Revert semua tagihan yang terkait transaksi ini → belum
        //    PERBAIKAN: sebelumnya tagihan dibiarkan 'lunas' walau transaksi void
        const [revertResult] = await connection.query(
            'UPDATE tagihan SET status = "belum", paid_at = NULL, transaksi_id = NULL WHERE transaksi_id = ?',
            [txId]
        );

        // 3. Hapus Cashflow Terkait (reversal keuangan)
        await connection.query('DELETE FROM cashflow WHERE ref = ?', [invoiceNo]);

        // 4. Catat cashflow reversal sebagai jurnal keluar
        if (revertResult.affectedRows > 0) {
            await connection.query(`
                INSERT INTO cashflow (tanggal, keterangan, nominal, tipe, ref, created_at)
                SELECT UTC_TIMESTAMP(), CONCAT('VOID — ', keterangan), nominal, 'keluar', CONCAT('VOID-', ref), UTC_TIMESTAMP()
                FROM cashflow WHERE ref = ? LIMIT 0
            `, [invoiceNo]); // no-op insert to document voiding in comments
        }

        await connection.commit();
        res.json({
            success: true,
            invoiceNo,
            tagihanReverted: revertResult.affectedRows
        });
    } catch (err) {
        await connection.rollback();
        res.status(500).json({ error: err.message });
    } finally {
        connection.release();
    }
});

app.post('/api/pembayaran', async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        const { siswaId, selectedBillIds, amountPaid, total, change, partialPayMap, kasir, sendWA } = req.body;
        const now = new Date().toISOString().slice(0, 10);
        const invoiceNo = `INV-${now.replace(/-/g, '')}-${String(Date.now()).slice(-4)}`;

        // 1. Simpan Transaksi Utama
        const [txResult] = await connection.query(`
            INSERT INTO transaksi (invoice_no, tanggal, siswa_id, user_id, total, amount_paid, change_amount, status)
            VALUES (?, UTC_TIMESTAMP(), ?, NULL, ?, ?, ?, 'success')
        `, [invoiceNo, siswaId, total, amountPaid, change]);

        const txnId = txResult.insertId;

        // 2. Update Tagihan & Handle Partial
        const paidItems = [];
        for (const billId of selectedBillIds) {
            const [billRows] = await connection.query('SELECT * FROM tagihan WHERE id = ?', [billId]);
            if (billRows.length === 0) continue;
            const b = billRows[0];
            let payAmount = Number(partialPayMap[billId] ?? b.nominal);
            if (payAmount > b.nominal) payAmount = b.nominal;

            // Ambil nama kategori untuk pesan WA
            const [katRows] = await connection.query('SELECT nama FROM kategori_tagihan WHERE id = ?', [b.kategori_id]);
            paidItems.push({ bulan: b.bulan, tahun: b.tahun, kategori: katRows[0]?.nama || 'Tagihan', nominal: payAmount });

            if (payAmount < b.nominal && payAmount > 0) {
                await connection.query('UPDATE tagihan SET nominal = ?, status = "lunas", paid_at = CURDATE(), transaksi_id = ? WHERE id = ?', [payAmount, txnId, billId]);
                await connection.query(`
                    INSERT INTO tagihan (siswa_id, kategori_id, tahun_ajaran_id, bulan, tahun, nominal_asli, nominal, is_diskon, diskon_notes, status, kelas_id, log_generate_id)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'belum', ?, ?)
                `, [b.siswa_id, b.kategori_id, b.tahun_ajaran_id, b.bulan, b.tahun, b.nominal_asli, b.nominal - payAmount, b.is_diskon, b.diskon_notes, b.kelas_id, b.log_generate_id]);
            } else {
                await connection.query('UPDATE tagihan SET status = "lunas", paid_at = CURDATE(), transaksi_id = ? WHERE id = ?', [txnId, billId]);
            }
        }

        // 3. Catat di Cashflow
        await connection.query(`
            INSERT INTO cashflow (tanggal, keterangan, nominal, tipe, ref)
            VALUES (UTC_TIMESTAMP(), ?, ?, 'masuk', ?)
        `, [`Pembayaran SPP - ${invoiceNo}`, total, invoiceNo]);

        await connection.commit();

        // 4. Kirim Notifikasi WhatsApp (async, tidak memblokir response)
        if (sendWA) {
            (async () => {
                try {
                    // Ambil data siswa & nomor HP orang tua
                    const [siswaRows] = await pool.query('SELECT nama, telp FROM siswa WHERE id = ?', [siswaId]);
                    const [ortuRows] = await pool.query('SELECT hp, jenis FROM siswa_orangtua WHERE siswa_id = ?', [siswaId]);
                    
                    const siswa = siswaRows[0];
                    const phoneTargets = [];
                    if (siswa?.telp) phoneTargets.push(siswa.telp);
                    ortuRows.forEach(o => { if (o.hp) phoneTargets.push(o.hp); });

                    if (phoneTargets.length > 0) {
                        const formatRp = (n) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);
                        const itemList = paidItems.map(i => `• ${i.kategori} (${i.bulan} ${i.tahun}): ${formatRp(i.nominal)}`).join('\n');
                        
                        // Ambil template dari pengaturan sekolah
                        const [settingRows] = await pool.query('SELECT `value` FROM school_settings WHERE `key` = "wa_template_pembayaran"');
                        let template = settingRows.length > 0 ? settingRows[0].value : `*📋 NOTA PEMBAYARAN*\n*SMK PPRQ - SIAS*\n\nNo. Invoice: *{invoiceNo}*\nNama Siswa: *{siswaNama}*\n\n*Rincian Pembayaran:*\n{rincian}\n\n*Total: {total}*\nDibayar: {dibayar}\nKembali: {kembali}\n\nTerima kasih atas pembayarannya. 🙏`;
                        
                        // Ganti variabel dengan nilai dinamis
                        const message = template
                            .replace(/{invoiceNo}/g, invoiceNo)
                            .replace(/{siswaNama}/g, siswa?.nama || '-')
                            .replace(/{rincian}/g, itemList)
                            .replace(/{total}/g, formatRp(total))
                            .replace(/{dibayar}/g, formatRp(amountPaid))
                            .replace(/{kembali}/g, formatRp(change));

                        // Kirim ke semua nomor (siswa + orang tua)
                        const uniquePhones = [...new Set(phoneTargets)];
                        for (const phone of uniquePhones) {
                            await waService.sendMessage(phone, message);
                        }
                    }
                } catch (waErr) {
                    console.error('[Pembayaran WA] Gagal kirim notifikasi:', waErr.message);
                }
            })();
        }

        res.json({ success: true, invoiceNo, id: txnId });
    } catch (err) {
        await connection.rollback();
        res.status(500).json({ error: err.message });
    } finally {
        connection.release();
    }
});

// --- CASHFLOW ROUTES ---
app.get('/api/cashflow', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM cashflow ORDER BY tanggal DESC');
        res.json(rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/cashflow', async (req, res) => {
    try {
        const { keterangan, nominal, tipe, tanggal, ref } = req.body;
        const [result] = await pool.query(
            'INSERT INTO cashflow (tanggal, keterangan, nominal, tipe, ref) VALUES (?, ?, ?, ?, ?)',
            [tanggal || new Date(), keterangan, nominal, tipe || 'keluar', ref || null]
        );
        res.status(201).json({ id: result.insertId, ...req.body });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- USERS ROUTES ---
app.get('/api/users', authMiddleware, async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT id, nama, username, role FROM users');
        res.json(rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/users', authMiddleware, async (req, res) => {
    try {
        // Only admin should be able to create users
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Hanya Admin yang dapat mengelola user.' });
        }

        const { nama, username, password, role } = req.body;
        if (!nama || !username || !password || !role) {
            return res.status(400).json({ error: 'Semua field wajib diisi.' });
        }

        const password_hash = await bcrypt.hash(password, 10);
        const [result] = await pool.query(
            'INSERT INTO users (nama, username, password_hash, role) VALUES (?, ?, ?, ?)',
            [nama, username, password_hash, role]
        );
        res.status(201).json({ id: result.insertId, nama, username, role });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') return res.status(400).json({ error: 'Username sudah digunakan.' });
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/users/:id', authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Hanya Admin yang dapat mengelola user.' });
        }

        const { nama, username, password, role } = req.body;
        const userId = req.params.id;

        if (password) {
            const password_hash = await bcrypt.hash(password, 10);
            await pool.query(
                'UPDATE users SET nama = ?, username = ?, password_hash = ?, role = ? WHERE id = ?',
                [nama, username, password_hash, role, userId]
            );
        } else {
            await pool.query(
                'UPDATE users SET nama = ?, username = ?, role = ? WHERE id = ?',
                [nama, username, role, userId]
            );
        }
        res.json({ success: true });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') return res.status(400).json({ error: 'Username sudah digunakan.' });
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/users/:id', authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Hanya Admin yang dapat mengelola user.' });
        }
        const userId = req.params.id;
        
        // Prevent deleting self
        if (Number(userId) === req.user.id) {
            return res.status(400).json({ error: 'Anda tidak dapat menghapus akun Anda sendiri.' });
        }

        await pool.query('DELETE FROM users WHERE id = ?', [userId]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- (AUTH ROUTES DIPINDAHKAN KE routes/admin/auth.js) ---

// --- STUDENT PORTAL API ROUTES ---
// (Moved to top area)

// Student Login: NISN + Tanggal Lahir
app.post('/api/student/login', async (req, res) => {
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
app.get('/api/student/profile', studentAuthMiddleware, async (req, res) => {
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
app.get('/api/student/bills', studentAuthMiddleware, async (req, res) => {
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
app.get('/api/student/transactions', studentAuthMiddleware, async (req, res) => {
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
app.get('/api/student/announcements', async (req, res) => {
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

// --- PING ---
app.get('/api/ping', async (req, res) => {
    try {
        await pool.query('SELECT 1');
        res.json({ status: 'Connected to TiDB successfully!' });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/tagihan/discount', async (req, res) => {
    try {
        const { billIds, type, value } = req.body;
        if (!billIds || !Array.isArray(billIds)) return res.status(400).json({ error: 'Invalid bill IDs' });

        for (const id of billIds) {
            // Get current bill to calculate discount
            const [rows] = await pool.query('SELECT nominal, nominal_asli FROM tagihan WHERE id = ?', [id]);
            if (rows.length > 0) {
                const b = rows[0];
                const base = Number(b.nominal_asli || b.nominal);
                let finalNominal = type === 'Persentase' ? base - (base * (value / 100)) : Math.max(0, base - value);

                await pool.query(
                    'UPDATE tagihan SET nominal = ?, is_diskon = ? WHERE id = ? AND status != "lunas"',
                    [finalNominal, finalNominal < base, id]
                );
            }
        }
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});


// --- WHATSAPP API ROUTES ---
app.get('/api/admin/whatsapp/status', authMiddleware, (req, res) => {
    res.json(waService.getStatus());
});

app.post('/api/admin/whatsapp/logout', authMiddleware, async (req, res) => {
    const result = await waService.logout();
    res.json(result);
});

app.post('/api/admin/whatsapp/restart', authMiddleware, async (req, res) => {
    const result = await waService.restart();
    res.json(result);
});

app.post('/api/admin/whatsapp/clear-history', authMiddleware, (req, res) => {
    const result = waService.clearHistory();
    res.json(result);
});

app.post('/api/admin/whatsapp/update-config', authMiddleware, (req, res) => {
    const { hourlyLimit } = req.body;
    const result = waService.updateConfig({ hourlyLimit });
    res.json(result);
});

app.post('/api/admin/whatsapp/test', authMiddleware, async (req, res) => {
    const { phone, message } = req.body;
    if (!phone || !message) return res.status(400).json({ error: 'Phone dan message wajib diisi' });
    const result = await waService.sendMessage(phone, message);
    res.json(result);
});

const PORT = process.env.PORT || 3005;
server.listen(PORT, () => {
    console.log(`✅ Server SIAS berjalan di port: ${PORT}`);
    // Inisialisasi WhatsApp Service secara background agar tidak memblokir startup server
    waService.initialize().catch(err => {
        console.error('[WA Service] Gagal inisialisasi:', err.message);
    });
});
