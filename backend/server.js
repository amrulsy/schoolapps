// SIAS — Main Server
const express = require('express');
const cors = require('cors');
const path = require('path');
const http = require('http');
const pool = require('./db');
require('dotenv').config();

const waService = require('./services/whatsappService');
const socketService = require('./services/socket');

// Middleware
const { authMiddleware } = require('./middleware/auth');
const { rateLimiter } = require('./middleware/rateLimiter');
const { requestLogger } = require('./middleware/logger');
const { uploadDokumen } = require('./middleware/upload');

// Controllers
const AttendanceController = require('./controllers/AttendanceController');
const InventoryController = require('./controllers/InventoryController');
const AttendanceCronService = require('./services/attendanceCron');

// ─── Route Imports ────────────────────────────────────────────────────────────
// Public
const publicPortalRoutes     = require('./routes/public/portal');

// Admin
const authRoutes             = require('./routes/admin/auth');
const adminCmsRoutes         = require('./routes/admin/cms');
const adminBackupRoutes      = require('./routes/admin/backup');
const studentMenusRoutes     = require('./routes/admin/studentMenus');
const adminPresensiRoutes    = require('./routes/admin/presensi');
const adminTabunganRoutes    = require('./routes/admin/tabungan');
const adminBKRoutes          = require('./routes/admin/bk');
const adminGuruRoutes        = require('./routes/admin/guru');
const adminJadwalRoutes      = require('./routes/admin/jadwal');
const adminJamPelajaranRoutes= require('./routes/admin/jamPelajaran');
const adminAkademikRoutes    = require('./routes/admin/akademik');
const adminPesanRoutes       = require('./routes/admin/pesan');
const adminInfaqRoutes       = require('./routes/admin/infaq');
const adminSchoolSettingsRoutes = require('./routes/admin/schoolSettings');
const adminLabRoutes         = require('./routes/admin/lab');
const adminWhatsappRoutes    = require('./routes/admin/whatsappRoutes');

// Master data & keuangan (extracted modules)
const masterDataRoutes       = require('./routes/admin/masterDataRoutes');
const masterDokumenRoutes    = require('./routes/admin/masterDokumenRoutes');
const keuanganRoutes         = require('./routes/admin/keuanganRoutes');
const usersRoutes            = require('./routes/admin/usersRoutes');
const waliKelasAdminRoutes   = require('./routes/admin/waliKelasAdminRoutes');
const siswaRoutes            = require('./routes/admin/siswaRoutes');

// Guru
const guruSessionRoutes      = require('./routes/guru/session');
const guruRaporRoutes        = require('./routes/guru/rapor');
const guruWaliKelasRoutes    = require('./routes/guru/waliKelas');

// Student portal
const portalSiswaRoutes      = require('./routes/student/portalSiswaRoutes');
const portalSiswaRoutes2     = require('./routes/student/portalSiswaRoutes2');

// Note: uploadDokumen tersedia via require('./middleware/upload') — attach ke route siswa dokumen saat dibutuhkan

// ─── App Bootstrap ─────────────────────────────────────────────────────────────
const app    = express();
const server = http.createServer(app);
socketService.init(server);

app.use(express.json());
app.use(cors({ origin: true, credentials: true }));

// Request Logger
app.use(requestLogger);

// ─── Static Files ─────────────────────────────────────────────────────────────
app.use('/uploads',     express.static(path.join(__dirname, 'uploads')));
app.use('/api/uploads', express.static(path.join(__dirname, 'uploads')));

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/test-ping', (_req, res) => res.send('pong'));
app.get('/api/ping', async (_req, res) => {
    try {
        await pool.query('SELECT 1');
        res.json({ status: 'Connected to TiDB successfully!' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ─── Auth ─────────────────────────────────────────────────────────────────────
const loginRateLimit = rateLimiter(10, 60000);
app.use('/api/auth/me',       authMiddleware);
app.use('/api/auth/login',    loginRateLimit);
app.use('/api/student/login', loginRateLimit);
app.use('/api/auth',          authRoutes);

// ─── Public Portal ─────────────────────────────────────────────────────────────
app.use('/api/public', publicPortalRoutes);

// ─── Student Portal ────────────────────────────────────────────────────────────
app.use('/api/student', portalSiswaRoutes);
app.use('/api/student', portalSiswaRoutes2);

// ─── Master Data & Keuangan (no extra prefix — routes define their own paths) ──
app.use('/', waliKelasAdminRoutes);
app.use('/', masterDataRoutes);
app.use('/', masterDokumenRoutes);
app.use('/', keuanganRoutes);
app.use('/', usersRoutes);
app.use('/api/siswa', siswaRoutes);

// ─── Admin Routes (auth required) ──────────────────────────────────────────────
app.use('/api/admin/cms',            authMiddleware, adminCmsRoutes);
app.use('/api/admin/backup',         authMiddleware, adminBackupRoutes);
app.use('/api/admin/student-menus',  authMiddleware, studentMenusRoutes);
app.use('/api/admin/presensi',       authMiddleware, adminPresensiRoutes);
app.use('/api/admin/tabungan',       authMiddleware, adminTabunganRoutes);
app.use('/api/admin/guru',           authMiddleware, adminGuruRoutes);
app.use('/api/admin/jadwal',         authMiddleware, adminJadwalRoutes);
app.use('/api/admin/jam-pelajaran',  authMiddleware, adminJamPelajaranRoutes);
app.use('/api/admin/bk',             authMiddleware, adminBKRoutes);
app.use('/api/admin/infaq',          authMiddleware, adminInfaqRoutes);
app.use('/api/admin/lab',            authMiddleware, adminLabRoutes);
app.use('/api/admin/akademik',       authMiddleware, adminAkademikRoutes);
app.use('/api/admin/pesan',          authMiddleware, adminPesanRoutes);
app.use('/api/admin/school-settings',authMiddleware, adminSchoolSettingsRoutes);
app.use('/api/admin/whatsapp',       adminWhatsappRoutes);

// ─── Guru Routes (auth required) ───────────────────────────────────────────────
app.use('/api/guru/session',         authMiddleware, guruSessionRoutes);
app.use('/api/guru/rapor',           authMiddleware, guruRaporRoutes);
app.use('/api/guru/wali-kelas',      authMiddleware, guruWaliKelasRoutes);

// ─── RFID Attendance ──────────────────────────────────────────────────────────
app.put( '/api/students/:id/rfid',          authMiddleware, AttendanceController.registerRfid);
app.post('/api/attendance/scan',            AttendanceController.scanRfid);  // Public/Gate
app.get( '/api/admin/attendance/settings',  authMiddleware, AttendanceController.getSettings);
app.post('/api/admin/attendance/settings',  authMiddleware, AttendanceController.updateSettings);

// ─── Lab Inventory Scan (Public/Kiosk) ────────────────────────────────────────
app.post('/api/lab/scan',                   InventoryController.scanBorrow);
app.get( '/api/lab/student-loans/:rfid',    InventoryController.getStudentActiveLoansByRfid);

// ─── Global Error Handler ─────────────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
    console.error('[Global Error]', err.stack || err.message);
    res.status(err.status || 500).json({
        success: false,
        error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message
    });
});

// ─── Start Server ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3005;
server.listen(PORT, () => {
    console.log(`✅ Server SIAS berjalan di port: ${PORT}`);
    waService.initialize().catch(err => {
        console.error('[WA Service] Gagal inisialisasi:', err.message);
    });
    AttendanceCronService.init();
});

module.exports = { app, uploadDokumen };
