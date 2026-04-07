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
        const dir = path.join(__dirname, 'uploads/dokumen_siswa');
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

app.use('/api', require('./routes/admin/waliKelasAdminRoutes'));

// Serve uploaded media files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/api/uploads', express.static(path.join(__dirname, 'uploads')));

// --- PUBLIC PORTAL ROUTES (no auth required, but rate limited) ---

// --- PHASE 2 EXTRACTED ROUTES ---
app.use('/', require('./routes/admin/masterDataRoutes')); // kelas, units, etc
app.use('/', require('./routes/admin/masterDokumenRoutes')); // /admin/master-dokumen & /siswa/:id/dokumen
app.use('/', require('./routes/admin/keuanganRoutes')); // tagihan, transaksi, pembayaran, cashflow
app.use('/', require('./routes/admin/usersRoutes')); // /users
app.use('/api/student', require('./routes/student/portalSiswaRoutes')); // student portal

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



/* // --- STUDENT PORTAL API ROUTES --- EXTRACTED */

app.use('/api', require('./routes/admin/masterDataRoutes'));

// --- SISWA ROUTES ---
app.use('/api/siswa', require('./routes/admin/siswaRoutes'));


/* // --- MASTER DOKUMEN & SISWA DOKUMEN ROUTES --- EXTRACTED */


/* // --- TAGIHAN ROUTES --- EXTRACTED */


/* // --- TRANSAKSI & PEMBAYARAN ROUTES --- EXTRACTED */


/* // --- CASHFLOW ROUTES --- EXTRACTED */


/* // --- USERS ROUTES --- EXTRACTED */

// --- (AUTH ROUTES DIPINDAHKAN KE routes/admin/auth.js) ---

// --- STUDENT PORTAL API ROUTES ---
// (Moved to top area)

app.use('/api/student', require('./routes/student/portalSiswaRoutes2'));

// --- PING ---
app.get('/api/ping', async (req, res) => {
    try {
        await pool.query('SELECT 1');
        res.json({ status: 'Connected to TiDB successfully!' });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

/* discountRoute extracted */



app.use('/api/admin/whatsapp', require('./routes/admin/whatsappRoutes'));

// --- GLOBAL ERROR HANDLER ---
app.use((err, req, res, next) => {
    console.error('[Global Error]', err.stack || err.message);
    const statusCode = err.status || 500;
    res.status(statusCode).json({
        success: false,
        error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message
    });
});

const PORT = process.env.PORT || 3005;
server.listen(PORT, () => {
    console.log(`✅ Server SIAS berjalan di port: ${PORT}`);
    // Inisialisasi WhatsApp Service secara background agar tidak memblokir startup server
    waService.initialize().catch(err => {
        console.error('[WA Service] Gagal inisialisasi:', err.message);
    });
});
