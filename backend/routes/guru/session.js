const express = require('express');
const router = express.Router();
const pool = require('../../db');

// Middleware to get guru_id from user_id
const getGuruId = async (req, res, next) => {
    try {
        if (req.user.role !== 'guru') {
            return res.status(403).json({ error: 'Akses ditolak. Role bukan guru.' });
        }
        const [rows] = await pool.query('SELECT id FROM guru WHERE user_id = ?', [req.user.id]);
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Profil guru tidak ditemukan' });
        }
        req.guru_id = rows[0].id;
        next();
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

router.use(getGuruId);

// GET /api/guru/session/today (Dashboard Data)
router.get('/today', async (req, res) => {
    try {
        const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
        const currentDay = days[new Date().getDay()];
        const currentDate = new Date().toISOString().split('T')[0];

        // Fetch jadwal for today
        const [jadwal] = await pool.query(`
            SELECT j.*, k.nama as kelas_nama, m.nama as mapel_nama, 
                   jp.jam_ke, jp.jam_mulai, jp.jam_selesai, jp.tipe as jam_tipe
            FROM jadwal_pelajaran j
            JOIN kelas k ON j.kelas_id = k.id
            JOIN mata_pelajaran m ON j.mapel_id = m.id
            JOIN jam_pelajaran jp ON j.jam_pelajaran_id = jp.id
            WHERE j.guru_id = ? AND j.hari = ?
            ORDER BY jp.jam_mulai ASC
        `, [req.guru_id, currentDay]);

        // Fetch existing journals for today (to see status: Running or Selesai)
        const [jurnal] = await pool.query(`
            SELECT jm.*, k.nama as kelas_nama, m.nama as mapel_nama
            FROM jurnal_mengajar jm
            JOIN kelas k ON jm.kelas_id = k.id
            JOIN mata_pelajaran m ON jm.mapel_id = m.id
            WHERE jm.guru_id = ? AND jm.tanggal = ?
        `, [req.guru_id, currentDate]);

        const dashboardData = jadwal.map(j => {
            const activeJurnal = jurnal.find(jur => jur.jadwal_id === j.id);
            return {
                ...j,
                jurnal: activeJurnal || null,
                status: activeJurnal ? activeJurnal.status_jurnal : 'Belum Mulai'
            };
        });

        res.json({ day: currentDay, date: currentDate, schedules: dashboardData, activeJournals: jurnal.filter(j => !j.jadwal_id) });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/guru/session/my-classes
// API To fetch all valid classes and mapel for the guru to select when creating Ad-Hoc session
router.get('/my-classes', async (req, res) => {
    try {
        const [kelas] = await pool.query('SELECT id, nama FROM kelas ORDER BY nama ASC');
        const [mapel] = await pool.query('SELECT id, nama FROM mata_pelajaran ORDER BY nama ASC');
        res.json({ kelas, mapel });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// POST /api/guru/session/start
router.post('/start', async (req, res) => {
    try {
        const { jadwal_id } = req.body;
        const currentDate = new Date().toISOString().split('T')[0];

        const [existing] = await pool.query('SELECT id FROM jurnal_mengajar WHERE jadwal_id = ? AND tanggal = ?', [jadwal_id, currentDate]);
        if (existing.length > 0) return res.status(400).json({ error: 'Sesi untuk jadwal ini sudah dimulai atau selesai hari ini' });

        const [jadwalInfo] = await pool.query('SELECT kelas_id, mapel_id FROM jadwal_pelajaran WHERE id = ?', [jadwal_id]);
        if (jadwalInfo.length === 0) return res.status(404).json({ error: 'Jadwal tidak ditemukan' });

        const [result] = await pool.query(`
            INSERT INTO jurnal_mengajar (guru_id, jadwal_id, kelas_id, mapel_id, tanggal, waktu_masuk_aktual, status_jurnal)
            VALUES (?, ?, ?, ?, ?, CURTIME(), 'Running')
        `, [req.guru_id, jadwal_id, jadwalInfo[0].kelas_id, jadwalInfo[0].mapel_id, currentDate]);

        res.status(201).json({ id: result.insertId, success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/guru/session/ad-hoc
router.post('/ad-hoc', async (req, res) => {
    try {
        const { kelas_id, mapel_id, materi } = req.body;
        const currentDate = new Date().toISOString().split('T')[0];

        const [result] = await pool.query(`
            INSERT INTO jurnal_mengajar (guru_id, kelas_id, mapel_id, tanggal, waktu_masuk_aktual, materi, status_jurnal)
            VALUES (?, ?, ?, ?, CURTIME(), ?, 'Running')
        `, [req.guru_id, kelas_id, mapel_id, currentDate, materi || null]);

        res.status(201).json({ id: result.insertId, success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/guru/session/:id
router.get('/:id', async (req, res) => {
    try {
        const [jurnal] = await pool.query(`
            SELECT j.*, k.nama as kelas_nama, m.nama as mapel_nama 
            FROM jurnal_mengajar j
            JOIN kelas k ON j.kelas_id = k.id
            JOIN mata_pelajaran m ON j.mapel_id = m.id
            WHERE j.id = ?
        `, [req.params.id]);
        if (jurnal.length === 0) return res.status(404).json({ error: 'Jurnal tidak ditemukan' });
        res.json(jurnal[0]);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/guru/session/:id/students (INTERLOCKING LOGIC)
router.get('/:id/students', async (req, res) => {
    try {
        const jurnalId = req.params.id;
        const [jurnal] = await pool.query('SELECT kelas_id, tanggal FROM jurnal_mengajar WHERE id = ?', [jurnalId]);
        if (jurnal.length === 0) return res.status(404).json({ error: 'Jurnal tidak ditemukan' });

        const { kelas_id, tanggal } = jurnal[0];
        const dateStr = new Date(tanggal).toISOString().split('T')[0];

        // 1. Get all students in class
        const [students] = await pool.query('SELECT id, nisn, nama FROM siswa WHERE kelas_id = ? AND status = "aktif" ORDER BY nama ASC', [kelas_id]);

        // 2. Get Daily Attendance (Master from Admin)
        const [dailyAtt] = await pool.query('SELECT siswa_id, status FROM siswa_presensi WHERE tanggal = ? AND siswa_id IN (SELECT id FROM siswa WHERE kelas_id = ?)', [dateStr, kelas_id]);
        const dailyMap = {};
        dailyAtt.forEach(d => dailyMap[d.siswa_id] = d.status);

        // 3. Get Existing Session Attendance (if any saved previously)
        const [sessionAtt] = await pool.query('SELECT siswa_id, status FROM presensi_sesi WHERE jurnal_id = ?', [jurnalId]);
        const sessionMap = {};
        sessionAtt.forEach(s => sessionMap[s.siswa_id] = s.status);

        // Map them together
        const result = students.map(s => {
            const isLocked = dailyMap[s.id] === 'sakit' || dailyMap[s.id] === 'izin' || dailyMap[s.id] === 'alpha';

            // Priority: Session Att -> Daily Att (locked status) -> Default 'hadir' if daily is present
            let currentStatus = sessionMap[s.id] || (isLocked ? dailyMap[s.id] : 'hadir');

            return {
                ...s,
                status: currentStatus,
                is_locked: isLocked,
                daily_status: dailyMap[s.id] || null
            };
        });

        res.json({ dates: dateStr, students: result });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// PUT /api/guru/session/attendance
router.put('/attendance', async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        const { jurnal_id, attendanceList } = req.body; // [{siswa_id, status, keterangan}]

        for (const item of attendanceList) {
            await connection.query(`
                INSERT INTO presensi_sesi (jurnal_id, siswa_id, status, keterangan) 
                VALUES (?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE status=VALUES(status), keterangan=VALUES(keterangan)
            `, [jurnal_id, item.siswa_id, item.status, item.keterangan || null]);
        }
        await connection.commit();
        res.json({ success: true });
    } catch (err) {
        await connection.rollback();
        res.status(500).json({ error: err.message });
    } finally {
        connection.release();
    }
});

// PUT /api/guru/session/:id/finish
router.put('/:id/finish', async (req, res) => {
    try {
        const { materi } = req.body;
        await pool.query(`
            UPDATE jurnal_mengajar 
            SET materi = ?, waktu_keluar_aktual = CURTIME(), status_jurnal = 'Selesai'
            WHERE id = ? AND status_jurnal = 'Running'
        `, [materi, req.params.id]);

        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
