const express = require('express');
const router = express.Router();
const pool = require('../../db');

// Helper to get current time in WIB (UTC+7) regardless of server timezone
const getWIB = () => {
    const now = new Date();
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
    return new Date(utc + (3600000 * 7));
};

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
        const now = getWIB();
        const currentDay = days[now.getDay()];
        const currentDate = now.toLocaleDateString('en-CA'); // YYYY-MM-DD local WIB

        console.log(`[DEBUG Dashboard] Guru ID: ${req.guru_id}, Day: ${currentDay}, Date: ${currentDate}`);

        // Fetch jadwal for today
        const [jadwal] = await pool.query(`
            SELECT j.*, 
                   COALESCE(k.nama, 'Kelas Dihapus') as kelas_nama, 
                   COALESCE(m.nama, 'Mapel Dihapus') as mapel_nama, 
                   jp.jam_ke, jp.jam_mulai, jp.jam_selesai, jp.tipe as jam_tipe
            FROM jadwal_pelajaran j
            LEFT JOIN kelas k ON j.kelas_id = k.id
            LEFT JOIN mata_pelajaran m ON j.mapel_id = m.id
            JOIN jam_pelajaran jp ON j.jam_pelajaran_id = jp.id
            WHERE j.guru_id = ? AND j.hari = ?
            ORDER BY jp.jam_mulai ASC
        `, [req.guru_id, currentDay]);

        // Fetch existing journals for today (to see status: Running or Selesai)
        const [jurnal] = await pool.query(`
            SELECT jm.*, 
                   COALESCE(jm.nama_kelas_snapshot, k.nama, 'Kelas Dihapus') as kelas_nama, 
                   COALESCE(jm.nama_mapel_snapshot, m.nama, 'Mapel Dihapus') as mapel_nama
            FROM jurnal_mengajar jm
            LEFT JOIN kelas k ON jm.kelas_id = k.id
            LEFT JOIN mata_pelajaran m ON jm.mapel_id = m.id
            WHERE jm.guru_id = ? AND jm.tanggal = ?
        `, [req.guru_id, currentDate]);

        // Group consecutive schedules
        const groupedJadwal = [];
        jadwal.forEach(j => {
            const last = groupedJadwal[groupedJadwal.length - 1];
            if (last && last.kelas_id === j.kelas_id && last.mapel_id === j.mapel_id && last.jam_ke_end + 1 === j.jam_ke) {
                last.jadwal_ids.push(j.id);
                last.jam_selesai = j.jam_selesai; // update end time
                last.jam_ke_end = j.jam_ke;       // update end jam_ke
            } else {
                groupedJadwal.push({
                    ...j,
                    jadwal_ids: [j.id],
                    jam_ke_end: j.jam_ke
                });
            }
        });

        const dashboardData = groupedJadwal.map(group => {
            const activeJurnal = jurnal.find(jur => group.jadwal_ids.includes(jur.jadwal_id));
            return {
                ...group,
                jurnal: activeJurnal || null,
                status: activeJurnal ? activeJurnal.status_jurnal : 'Belum Mulai'
            };
        });

        res.json({ day: currentDay, date: currentDate, schedules: dashboardData, activeJournals: jurnal.filter(j => !j.jadwal_id) });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/guru/session/history
router.get('/history', async (req, res) => {
    try {
        const [history] = await pool.query(`
            SELECT jm.*, 
                   COALESCE(jm.nama_kelas_snapshot, k.nama, 'Kelas Dihapus') as kelas_nama, 
                   COALESCE(jm.nama_mapel_snapshot, m.nama, 'Mapel Dihapus') as mapel_nama,
                   COALESCE(jm.jam_mulai_snapshot, jp.jam_mulai) as jadwal_mulai,
                   COALESCE(jm.jam_selesai_snapshot, jp_end.jam_selesai, jp.jam_selesai) as jadwal_selesai,
                   COALESCE(jm.jam_ke_snapshot, jp.jam_ke) as jam_ke,
                   COALESCE(jm.jam_ke_end_snapshot, jp_end.jam_ke, jp.jam_ke) as jam_ke_end,
                   (SELECT COUNT(*) FROM presensi_sesi WHERE jurnal_id = jm.id) as total_presensi
            FROM jurnal_mengajar jm
            LEFT JOIN kelas k ON jm.kelas_id = k.id
            LEFT JOIN mata_pelajaran m ON jm.mapel_id = m.id
            LEFT JOIN jadwal_pelajaran jad ON jm.jadwal_id = jad.id
            LEFT JOIN jam_pelajaran jp ON jad.jam_pelajaran_id = jp.id
            LEFT JOIN jadwal_pelajaran jad_end ON jm.jadwal_id_end = jad_end.id
            LEFT JOIN jam_pelajaran jp_end ON jad_end.jam_pelajaran_id = jp_end.id
            WHERE jm.guru_id = ?
            ORDER BY jm.tanggal DESC, jm.waktu_masuk_aktual DESC
            LIMIT 50
        `, [req.guru_id]);

        console.log(`[DEBUG History] Guru ID: ${req.guru_id}, Found: ${history.length} entries`);
        res.json(history);
    } catch (err) {
        console.error("[DEBUG History Error]", err);
        res.status(500).json({ error: err.message });
    }
});

// POST /api/guru/session/start
router.post('/start', async (req, res) => {
    try {
        const { jadwal_id, jadwal_id_end } = req.body;
        const nowWib = getWIB();
        const currentDate = nowWib.toLocaleDateString('en-CA');
        const currentTime = nowWib.toLocaleTimeString('en-GB', { hour12: false });

        console.log(`[DEBUG Start] Guru ID: ${req.guru_id}, Jadwal: ${jadwal_id}, WIB Time: ${currentTime}`);

        const [existing] = await pool.query('SELECT id FROM jurnal_mengajar WHERE jadwal_id = ? AND tanggal = ?', [jadwal_id, currentDate]);
        if (existing.length > 0) return res.status(400).json({ error: 'Sesi untuk jadwal ini sudah dimulai atau selesai hari ini' });

        const [jadwalInfo] = await pool.query(`
            SELECT j.kelas_id, j.mapel_id, k.nama as kelas_nama, m.nama as mapel_nama, g.nama as guru_nama,
                   jp.jam_ke, jp.jam_mulai, jp.jam_selesai,
                   jp_end.jam_ke as jam_ke_end, jp_end.jam_selesai as jam_selesai_end
            FROM jadwal_pelajaran j
            JOIN kelas k ON j.kelas_id = k.id
            JOIN mata_pelajaran m ON j.mapel_id = m.id
            LEFT JOIN guru g ON j.guru_id = g.id
            JOIN jam_pelajaran jp ON j.jam_pelajaran_id = jp.id
            LEFT JOIN jadwal_pelajaran j_end ON ? = j_end.id
            LEFT JOIN jam_pelajaran jp_end ON j_end.jam_pelajaran_id = jp_end.id
            WHERE j.id = ?
        `, [jadwal_id_end, jadwal_id]);
        if (jadwalInfo.length === 0) return res.status(404).json({ error: 'Jadwal tidak ditemukan' });

        const [result] = await pool.query(`
            INSERT INTO jurnal_mengajar (
                guru_id, jadwal_id, jadwal_id_end, kelas_id, mapel_id, tanggal, 
                waktu_masuk_aktual, status_jurnal,
                nama_kelas_snapshot, nama_mapel_snapshot, nama_guru_snapshot,
                jam_ke_snapshot, jam_ke_end_snapshot, jam_mulai_snapshot, jam_selesai_snapshot
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, 'Running', ?, ?, ?, ?, ?, ?, ?)
        `, [
            req.guru_id, jadwal_id, jadwal_id_end || null,
            jadwalInfo[0].kelas_id, jadwalInfo[0].mapel_id,
            currentDate, currentTime,
            jadwalInfo[0].kelas_nama, jadwalInfo[0].mapel_nama, jadwalInfo[0].guru_nama,
            jadwalInfo[0].jam_ke, jadwalInfo[0].jam_ke_end || jadwalInfo[0].jam_ke,
            jadwalInfo[0].jam_mulai, jadwalInfo[0].jam_selesai_end || jadwalInfo[0].jam_selesai
        ]);

        console.log(`[DEBUG Start] Inserted Jurnal ID: ${result.insertId}`);
        res.status(201).json({ id: result.insertId, success: true });
    } catch (err) {
        console.error("[DEBUG Start Error]", err);
        res.status(500).json({ error: err.message });
    }
});
router.get('/:id', async (req, res) => {
    try {
        const [jurnal] = await pool.query(`
            SELECT j.*, 
                   COALESCE(j.nama_kelas_snapshot, k.nama, 'Kelas Dihapus') as kelas_nama, 
                   COALESCE(j.nama_mapel_snapshot, m.nama, 'Mapel Dihapus') as mapel_nama,
                   COALESCE(j.nama_guru_snapshot, g.nama, 'Guru Dihapus') as guru_nama,
                   COALESCE(j.jam_mulai_snapshot, jp.jam_mulai) as jadwal_mulai,
                   COALESCE(j.jam_selesai_snapshot, jp_end.jam_selesai, jp.jam_selesai) as jadwal_selesai,
                   COALESCE(j.jam_ke_snapshot, jp.jam_ke) as jam_ke,
                   COALESCE(j.jam_ke_end_snapshot, jp_end.jam_ke, jp.jam_ke) as jam_ke_end
            FROM jurnal_mengajar j
            LEFT JOIN kelas k ON j.kelas_id = k.id
            LEFT JOIN mata_pelajaran m ON j.mapel_id = m.id
            LEFT JOIN guru g ON j.guru_id = g.id
            LEFT JOIN jadwal_pelajaran jad ON j.jadwal_id = jad.id
            LEFT JOIN jam_pelajaran jp ON jad.jam_pelajaran_id = jp.id
            LEFT JOIN jadwal_pelajaran jad_end ON j.jadwal_id_end = jad_end.id
            LEFT JOIN jam_pelajaran jp_end ON jad_end.jam_pelajaran_id = jp_end.id
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
        // Ensure we handle the date string from DB correctly without UTC skew
        const dateStr = new Date(tanggal).toLocaleDateString('en-CA');

        console.log(`[DEBUG Students] Jurnal: ${jurnalId}, Date: ${dateStr}, Kelas: ${kelas_id}`);

        // 1. Get ALL students currently in presensi_sesi for this journal (Resilient list)
        // This ensures even if a student is deleted from master table, they still show up if they have attendance data.
        const [attStudents] = await pool.query(`
            SELECT ps.siswa_id as id, COALESCE(s.nisn, '---') as nisn, COALESCE(s.nama, 'Siswa Dihapus') as nama, ps.status as session_status
            FROM presensi_sesi ps
            LEFT JOIN siswa s ON ps.siswa_id = s.id
            WHERE ps.jurnal_id = ?
        `, [jurnalId]);
        const sessionMap = {};
        const resilientStudents = [];
        attStudents.forEach(s => {
            sessionMap[s.id] = s.session_status;
            resilientStudents.push({ id: s.id, nisn: s.nisn, nama: s.nama });
        });

        // 2. Get active students from master (for selection/adding new ones)
        const [masterStudents] = await pool.query('SELECT id, nisn, nama FROM siswa WHERE kelas_id = ? AND status = "aktif" ORDER BY nama ASC', [kelas_id]);

        // Combine lists (Master + Resilient) and deduplicate by ID
        const combinedMap = new Map();
        resilientStudents.forEach(s => combinedMap.set(s.id, s));
        masterStudents.forEach(s => combinedMap.set(s.id, s));
        const students = Array.from(combinedMap.values()).sort((a, b) => a.nama.localeCompare(b.nama));

        // 3. Get Daily Attendance (Master from Admin) for all students in our list
        const studentIds = students.map(s => s.id);
        const dailyMap = {};
        if (studentIds.length > 0) {
            const [dailyAtt] = await pool.query('SELECT siswa_id, status FROM siswa_presensi WHERE tanggal = ? AND siswa_id IN (?)', [dateStr, studentIds]);
            dailyAtt.forEach(d => dailyMap[d.siswa_id] = d.status);
        }

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

        res.json({ date: dateStr, students: result });
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
        const currentTime = getWIB().toLocaleTimeString('en-GB', { hour12: false });

        await pool.query(`
            UPDATE jurnal_mengajar 
            SET materi = ?, waktu_keluar_aktual = ?, status_jurnal = 'Selesai'
            WHERE id = ? AND status_jurnal = 'Running'
        `, [materi, currentTime, req.params.id]);

        console.log(`[DEBUG Finish] Jurnal ID: ${req.params.id}, Materi: ${materi?.substring(0, 20)}...`);
        res.json({ success: true });
    } catch (err) {
        console.error("[DEBUG Finish Error]", err);
        res.status(500).json({ error: err.message });
    }
});

// PUT /api/guru/session/:id/edit
router.put('/:id/edit', async (req, res) => {
    try {
        const { materi } = req.body;
        const currentTime = getWIB().toLocaleTimeString('en-GB', { hour12: false });

        await pool.query(`
            UPDATE jurnal_mengajar 
            SET materi = ?, waktu_keluar_aktual = ?
            WHERE id = ? AND status_jurnal = 'Selesai'
        `, [materi, currentTime, req.params.id]);

        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// PUT /api/guru/session/:id/materi (Save draft without finishing)
router.put('/:id/materi', async (req, res) => {
    try {
        const { materi } = req.body;
        await pool.query(`
            UPDATE jurnal_mengajar 
            SET materi = ?
            WHERE id = ? AND status_jurnal = 'Running'
        `, [materi, req.params.id]);

        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
