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

// =============================================
// CHECK: Is this guru a wali kelas?
// =============================================
router.get('/check', async (req, res) => {
    try {
        const [ta] = await pool.query("SELECT * FROM tahun_ajaran WHERE status = 'aktif' LIMIT 1");
        if (!ta[0]) return res.json({ isWaliKelas: false });

        const [wk] = await pool.query(
            `SELECT wk.*, k.nama as kelas_nama
             FROM wali_kelas wk
             JOIN kelas k ON wk.kelas_id = k.id
             WHERE wk.guru_id = ? AND wk.tahun_ajaran_id = ?`,
            [req.guru_id, ta[0].id]
        );

        if (wk.length === 0) return res.json({ isWaliKelas: false });

        res.json({
            isWaliKelas: true,
            kelas_id: wk[0].kelas_id,
            kelas_nama: wk[0].kelas_nama,
            tahun_ajaran_id: ta[0].id,
            tahun_ajaran: ta[0].tahun,
            semester: ta[0].semester_aktif
        });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// =============================================
// LEGER: Full grade recap for all mapel in the kelas
// =============================================
router.get('/leger', async (req, res) => {
    try {
        const { kelas_id, tahun_ajaran_id, semester } = req.query;

        // Verify access
        const [wk] = await pool.query(
            'SELECT id FROM wali_kelas WHERE guru_id = ? AND kelas_id = ? AND tahun_ajaran_id = ?',
            [req.guru_id, kelas_id, tahun_ajaran_id]
        );
        if (wk.length === 0) return res.status(403).json({ error: 'Anda bukan wali kelas ini' });

        // Get students
        const [students] = await pool.query(
            "SELECT id, nisn, nama FROM siswa WHERE kelas_id = ? AND status = 'aktif' ORDER BY nama ASC",
            [kelas_id]
        );

        // Get all mapel taught in this kelas (from jadwal)
        const [mapelList] = await pool.query(`
            SELECT DISTINCT m.id, m.nama
            FROM jadwal_pelajaran j
            JOIN mata_pelajaran m ON j.mapel_id = m.id
            WHERE j.kelas_id = ?
            ORDER BY m.nama
        `, [kelas_id]);

        // Get all nilai_semester
        const [nilaiAll] = await pool.query(
            `SELECT * FROM nilai_semester
             WHERE kelas_id = ? AND tahun_ajaran_id = ? AND semester = ?`,
            [kelas_id, tahun_ajaran_id, semester]
        );

        const nilaiMap = {};
        nilaiAll.forEach(n => {
            if (!nilaiMap[n.siswa_id]) nilaiMap[n.siswa_id] = {};
            nilaiMap[n.siswa_id][n.mapel_id] = {
                nilai_akhir: Number(n.nilai_akhir),
                deskripsi: n.deskripsi,
                is_locked: n.is_locked
            };
        });

        // Get catatan
        const [catatanAll] = await pool.query(
            `SELECT * FROM rapor_catatan WHERE kelas_id = ? AND tahun_ajaran_id = ? AND semester = ?`,
            [kelas_id, tahun_ajaran_id, semester]
        );
        const catatanMap = {};
        catatanAll.forEach(c => { catatanMap[c.siswa_id] = c.catatan; });

        const leger = students.map(s => ({
            ...s,
            mapel_scores: nilaiMap[s.id] || {},
            catatan: catatanMap[s.id] || ''
        }));

        res.json({ students: leger, mapelList });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// =============================================
// ATTENDANCE REKAP: S/I/A from siswa_presensi
// =============================================
router.get('/attendance', async (req, res) => {
    try {
        const { kelas_id, tahun_ajaran_id, semester } = req.query;

        // Get date range for the semester
        const [ta] = await pool.query('SELECT * FROM tahun_ajaran WHERE id = ?', [tahun_ajaran_id]);
        if (!ta[0]) return res.json([]);

        // Derive date range from tahun ajaran (e.g., "2025/2026")
        const [yearStart] = ta[0].tahun.split('/');
        let startDate, endDate;
        if (semester === 'Ganjil') {
            startDate = `${yearStart}-07-01`;
            endDate = `${yearStart}-12-31`;
        } else {
            endDate = `${Number(yearStart) + 1}-06-30`;
            startDate = `${Number(yearStart) + 1}-01-01`;
        }

        // Get students
        const [students] = await pool.query(
            "SELECT id, nama FROM siswa WHERE kelas_id = ? AND status = 'aktif' ORDER BY nama",
            [kelas_id]
        );

        const studentIds = students.map(s => s.id);
        if (studentIds.length === 0) return res.json([]);

        // Get attendance data
        const [attendance] = await pool.query(
            `SELECT siswa_id, status, COUNT(*) as cnt
             FROM siswa_presensi
             WHERE siswa_id IN (?) AND tanggal BETWEEN ? AND ?
             GROUP BY siswa_id, status`,
            [studentIds, startDate, endDate]
        );

        const attMap = {};
        attendance.forEach(a => {
            if (!attMap[a.siswa_id]) attMap[a.siswa_id] = { sakit: 0, izin: 0, alpha: 0 };
            if (a.status === 'sakit') attMap[a.siswa_id].sakit = a.cnt;
            if (a.status === 'izin') attMap[a.siswa_id].izin = a.cnt;
            if (a.status === 'alpha') attMap[a.siswa_id].alpha = a.cnt;
        });

        const result = students.map(s => ({
            siswa_id: s.id,
            nama: s.nama,
            sakit: attMap[s.id]?.sakit || 0,
            izin: attMap[s.id]?.izin || 0,
            alpha: attMap[s.id]?.alpha || 0
        }));

        res.json(result);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// =============================================
// CATATAN WALI KELAS: Save per-student notes
// =============================================
router.post('/catatan', async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        const { kelas_id, tahun_ajaran_id, semester, catatanList } = req.body;
        // catatanList = [{ siswa_id, catatan }]

        for (const c of catatanList) {
            await connection.query(
                `INSERT INTO rapor_catatan (siswa_id, kelas_id, tahun_ajaran_id, semester, catatan)
                 VALUES (?, ?, ?, ?, ?)
                 ON DUPLICATE KEY UPDATE catatan = VALUES(catatan)`,
                [c.siswa_id, kelas_id, tahun_ajaran_id, semester, c.catatan]
            );
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

// =============================================
// EKSTRAKURIKULER: GET/POST
// =============================================
router.get('/ekskul', async (req, res) => {
    try {
        const { kelas_id, tahun_ajaran_id, semester } = req.query;
        const [rows] = await pool.query(
            'SELECT * FROM rapor_ekskul WHERE kelas_id = ? AND tahun_ajaran_id = ? AND semester = ?',
            [kelas_id, tahun_ajaran_id, semester]
        );
        res.json(rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/ekskul', async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        const { kelas_id, tahun_ajaran_id, semester, ekskulList } = req.body;
        // ekskulList = [{ siswa_id, nama_ekskul, keterangan }]

        // Delete existing for this set to avoid duplicates and allow "removal" by not sending
        await connection.query(
            'DELETE FROM rapor_ekskul WHERE kelas_id = ? AND tahun_ajaran_id = ? AND semester = ?',
            [kelas_id, tahun_ajaran_id, semester]
        );

        for (const e of ekskulList) {
            if (!e.nama_ekskul) continue;
            await connection.query(
                `INSERT INTO rapor_ekskul (siswa_id, kelas_id, tahun_ajaran_id, semester, nama_ekskul, keterangan)
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [e.siswa_id, kelas_id, tahun_ajaran_id, semester, e.nama_ekskul, e.keterangan]
            );
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

// =============================================
// LOCK GRADES: Prevent further editing
// =============================================
router.post('/lock', async (req, res) => {
    try {
        const { kelas_id, tahun_ajaran_id, semester, lock } = req.body;

        // Verify wali kelas
        const [wk] = await pool.query(
            'SELECT id FROM wali_kelas WHERE guru_id = ? AND kelas_id = ? AND tahun_ajaran_id = ?',
            [req.guru_id, kelas_id, tahun_ajaran_id]
        );
        if (wk.length === 0) return res.status(403).json({ error: 'Anda bukan wali kelas ini' });

        await pool.query(
            `UPDATE nilai_semester SET is_locked = ?, locked_at = ${lock ? 'NOW()' : 'NULL'}
             WHERE kelas_id = ? AND tahun_ajaran_id = ? AND semester = ?`,
            [lock, kelas_id, tahun_ajaran_id, semester]
        );

        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// =============================================
// RAPOR: Full data for a single student (for PDF)
// =============================================
router.get('/rapor/:siswa_id', async (req, res) => {
    try {
        const { siswa_id } = req.params;
        const { kelas_id, tahun_ajaran_id, semester } = req.query;

        // Get student data
        const [studentRows] = await pool.query(`
            SELECT s.*, k.nama as kelas_nama, u.nama as unit_nama
            FROM siswa s
            LEFT JOIN kelas k ON s.kelas_id = k.id
            LEFT JOIN units u ON k.unit_id = u.id
            WHERE s.id = ?
        `, [siswa_id]);
        if (studentRows.length === 0) return res.status(404).json({ error: 'Siswa tidak ditemukan' });
        const student = studentRows[0];

        // Get tahun ajaran
        const [ta] = await pool.query('SELECT * FROM tahun_ajaran WHERE id = ?', [tahun_ajaran_id]);

        // Get all mapel with scores
        const [nilaiAll] = await pool.query(
            `SELECT ns.*, m.nama as mapel_nama, m.tingkat as mapel_tingkat
             FROM nilai_semester ns
             JOIN mata_pelajaran m ON ns.mapel_id = m.id
             WHERE ns.siswa_id = ? AND ns.kelas_id = ? AND ns.tahun_ajaran_id = ? AND ns.semester = ?
             ORDER BY m.nama`,
            [siswa_id, kelas_id, tahun_ajaran_id, semester]
        );

        // Get attendance recap
        const [yearStart] = (ta[0]?.tahun || '2025/2026').split('/');
        let startDate, endDate;
        if (semester === 'Ganjil') {
            startDate = `${yearStart}-07-01`;
            endDate = `${yearStart}-12-31`;
        } else {
            endDate = `${Number(yearStart) + 1}-06-30`;
            startDate = `${Number(yearStart) + 1}-01-01`;
        }

        const [attRows] = await pool.query(
            `SELECT status, COUNT(*) as cnt
             FROM siswa_presensi
             WHERE siswa_id = ? AND tanggal BETWEEN ? AND ?
             GROUP BY status`,
            [siswa_id, startDate, endDate]
        );
        const attendance = { sakit: 0, izin: 0, alpha: 0 };
        attRows.forEach(a => {
            if (a.status === 'sakit') attendance.sakit = a.cnt;
            if (a.status === 'izin') attendance.izin = a.cnt;
            if (a.status === 'alpha') attendance.alpha = a.cnt;
        });

        // Get catatan
        const [catRows] = await pool.query(
            'SELECT catatan FROM rapor_catatan WHERE siswa_id = ? AND kelas_id = ? AND tahun_ajaran_id = ? AND semester = ?',
            [siswa_id, kelas_id, tahun_ajaran_id, semester]
        );

        // Get ekskul
        const [ekskulRows] = await pool.query(
            'SELECT nama_ekskul, keterangan FROM rapor_ekskul WHERE siswa_id = ? AND kelas_id = ? AND tahun_ajaran_id = ? AND semester = ?',
            [siswa_id, kelas_id, tahun_ajaran_id, semester]
        );

        // Get wali kelas info
        const [wkRows] = await pool.query(`
            SELECT g.nama, g.nip FROM wali_kelas wk
            JOIN guru g ON wk.guru_id = g.id
            WHERE wk.kelas_id = ? AND wk.tahun_ajaran_id = ?
        `, [kelas_id, tahun_ajaran_id]);

        res.json({
            student,
            tahunAjaran: ta[0] || {},
            semester,
            nilaiMapel: nilaiAll,
            attendance,
            catatan: catRows[0]?.catatan || '',
            ekskul: ekskulRows,
            waliKelas: wkRows[0] || {}
        });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// =============================================
// RAPOR BATCH: Full data for all students in a class
// =============================================
router.get('/rapor-batch', async (req, res) => {
    try {
        const { kelas_id, tahun_ajaran_id, semester } = req.query;

        // 1. Get all students
        const [students] = await pool.query(`
            SELECT s.*, k.nama as kelas_nama, u.nama as unit_nama
            FROM siswa s
            LEFT JOIN kelas k ON s.kelas_id = k.id
            LEFT JOIN units u ON k.unit_id = u.id
            WHERE s.kelas_id = ? AND s.status = 'aktif'
            ORDER BY s.nama ASC
        `, [kelas_id]);

        if (students.length === 0) return res.json([]);

        // 2. Get year/semester info
        const [taRows] = await pool.query('SELECT * FROM tahun_ajaran WHERE id = ?', [tahun_ajaran_id]);
        const ta = taRows[0] || {};
        const [yearStart] = (ta.tahun || '2025/2026').split('/');
        let startDate, endDate;
        if (semester === 'Ganjil') {
            startDate = `${yearStart}-07-01`; endDate = `${yearStart}-12-31`;
        } else {
            endDate = `${Number(yearStart) + 1}-06-30`; startDate = `${Number(yearStart) + 1}-01-01`;
        }

        // 3. Batch fetch all related data
        const studentIds = students.map(s => s.id);

        const [nilaiAll] = await pool.query(`
            SELECT ns.*, m.nama as mapel_nama, m.tingkat as mapel_tingkat
            FROM nilai_semester ns
            JOIN mata_pelajaran m ON ns.mapel_id = m.id
            WHERE ns.siswa_id IN (?) AND ns.kelas_id = ? AND ns.tahun_ajaran_id = ? AND ns.semester = ?
            ORDER BY ns.siswa_id, m.nama
        `, [studentIds, kelas_id, tahun_ajaran_id, semester]);

        const [attAll] = await pool.query(`
            SELECT siswa_id, status, COUNT(*) as cnt
            FROM siswa_presensi
            WHERE siswa_id IN (?) AND tanggal BETWEEN ? AND ?
            GROUP BY siswa_id, status
        `, [studentIds, startDate, endDate]);

        const [catAll] = await pool.query(
            'SELECT siswa_id, catatan FROM rapor_catatan WHERE siswa_id IN (?) AND kelas_id = ? AND tahun_ajaran_id = ? AND semester = ?',
            [studentIds, kelas_id, tahun_ajaran_id, semester]
        );

        const [ekskulAll] = await pool.query(
            'SELECT siswa_id, nama_ekskul, keterangan FROM rapor_ekskul WHERE siswa_id IN (?) AND kelas_id = ? AND tahun_ajaran_id = ? AND semester = ?',
            [studentIds, kelas_id, tahun_ajaran_id, semester]
        );

        const [wkRows] = await pool.query(`
            SELECT g.nama, g.nip FROM wali_kelas wk
            JOIN guru g ON wk.guru_id = g.id
            WHERE wk.kelas_id = ? AND wk.tahun_ajaran_id = ?
        `, [kelas_id, tahun_ajaran_id]);
        const waliKelas = wkRows[0] || {};

        // 4. Organize into maps
        const nilaiMap = {};
        nilaiAll.forEach(n => {
            if (!nilaiMap[n.siswa_id]) nilaiMap[n.siswa_id] = [];
            nilaiMap[n.siswa_id].push(n);
        });

        const attMap = {};
        attAll.forEach(a => {
            if (!attMap[a.siswa_id]) attMap[a.siswa_id] = { sakit: 0, izin: 0, alpha: 0 };
            attMap[a.siswa_id][a.status === 'sakit' ? 'sakit' : a.status === 'izin' ? 'izin' : 'alpha'] = a.cnt;
        });

        const catMap = {};
        catAll.forEach(c => { catMap[c.siswa_id] = c.catatan; });

        const eksMap = {};
        ekskulAll.forEach(e => {
            if (!eksMap[e.siswa_id]) eksMap[e.siswa_id] = [];
            eksMap[e.siswa_id].push({ nama_ekskul: e.nama_ekskul, keterangan: e.keterangan });
        });

        // 5. Compose results
        const results = students.map(s => ({
            student: s,
            tahunAjaran: ta,
            semester,
            nilaiMapel: nilaiMap[s.id] || [],
            attendance: attMap[s.id] || { sakit: 0, izin: 0, alpha: 0 },
            catatan: catMap[s.id] || '',
            ekskul: eksMap[s.id] || [],
            waliKelas
        }));

        res.json(results);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
