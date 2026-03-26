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
// GET /api/guru/rapor/my-classes
// Returns distinct kelas + mapel assigned to this guru via jadwal_pelajaran
// =============================================
router.get('/my-classes', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT DISTINCT j.kelas_id, j.mapel_id,
                   k.nama as kelas_nama,
                   m.nama as mapel_nama
            FROM jadwal_pelajaran j
            JOIN kelas k ON j.kelas_id = k.id
            JOIN mata_pelajaran m ON j.mapel_id = m.id
            WHERE j.guru_id = ?
            ORDER BY k.nama, m.nama
        `, [req.guru_id]);

        // Get active tahun ajaran
        const [ta] = await pool.query("SELECT * FROM tahun_ajaran WHERE status = 'aktif' LIMIT 1");

        res.json({
            classes: rows,
            tahunAjaran: ta[0] || null
        });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// =============================================
// TUJUAN PEMBELAJARAN (TP) CRUD
// =============================================

// GET TPs for a specific mapel/kelas/semester
router.get('/tp', async (req, res) => {
    try {
        const { mapel_id, kelas_id, tahun_ajaran_id, semester } = req.query;
        const [rows] = await pool.query(`
            SELECT * FROM tujuan_pembelajaran
            WHERE mapel_id = ? AND kelas_id = ? AND tahun_ajaran_id = ? AND semester = ? AND guru_id = ?
            ORDER BY sort_order ASC, id ASC
        `, [mapel_id, kelas_id, tahun_ajaran_id, semester, req.guru_id]);
        res.json(rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// Create TP
router.post('/tp', async (req, res) => {
    try {
        const { mapel_id, kelas_id, tahun_ajaran_id, semester, kode, deskripsi, sort_order } = req.body;
        const [result] = await pool.query(
            `INSERT INTO tujuan_pembelajaran (mapel_id, kelas_id, tahun_ajaran_id, semester, kode, deskripsi, guru_id, sort_order)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [mapel_id, kelas_id, tahun_ajaran_id, semester, kode, deskripsi, req.guru_id, sort_order || 0]
        );
        res.status(201).json({ id: result.insertId, success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// Update TP
router.put('/tp/:id', async (req, res) => {
    try {
        const { kode, deskripsi, sort_order } = req.body;
        await pool.query(
            'UPDATE tujuan_pembelajaran SET kode = ?, deskripsi = ?, sort_order = ? WHERE id = ? AND guru_id = ?',
            [kode, deskripsi, sort_order || 0, req.params.id, req.guru_id]
        );
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// Delete TP (cascade deletes nilai_tp)
router.delete('/tp/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM tujuan_pembelajaran WHERE id = ? AND guru_id = ?', [req.params.id, req.guru_id]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// =============================================
// INPUT NILAI (Spreadsheet Data)
// =============================================

// GET: All students + their scores for a kelas/mapel/semester
router.get('/input/:kelas_id/:mapel_id', async (req, res) => {
    try {
        const { kelas_id, mapel_id } = req.params;
        const { tahun_ajaran_id, semester } = req.query;

        // 1. Get students in this kelas
        const [students] = await pool.query(
            "SELECT id, nisn, nama FROM siswa WHERE kelas_id = ? AND status = 'aktif' ORDER BY nama ASC",
            [kelas_id]
        );

        // 2. Get TPs for this mapel/kelas/semester
        const [tps] = await pool.query(
            `SELECT id, kode, deskripsi FROM tujuan_pembelajaran
             WHERE mapel_id = ? AND kelas_id = ? AND tahun_ajaran_id = ? AND semester = ? AND guru_id = ?
             ORDER BY sort_order ASC, id ASC`,
            [mapel_id, kelas_id, tahun_ajaran_id, semester, req.guru_id]
        );

        // 3. Get all nilai_tp for these TPs
        const tpIds = tps.map(tp => tp.id);
        let nilaiTpMap = {};
        if (tpIds.length > 0) {
            const [nilaiTp] = await pool.query(
                'SELECT * FROM nilai_tp WHERE tp_id IN (?)',
                [tpIds]
            );
            nilaiTp.forEach(n => {
                const key = `${n.siswa_id}_${n.tp_id}`;
                nilaiTpMap[key] = Number(n.nilai);
            });
        }

        // 4. Get nilai_semester (STS, SAS, etc.)
        let nilaiSemMap = {};
        const [nilaiSem] = await pool.query(
            `SELECT * FROM nilai_semester
             WHERE mapel_id = ? AND kelas_id = ? AND tahun_ajaran_id = ? AND semester = ?`,
            [mapel_id, kelas_id, tahun_ajaran_id, semester]
        );
        nilaiSem.forEach(n => {
            nilaiSemMap[n.siswa_id] = n;
        });

        // 5. Compose response
        const data = students.map(s => {
            const tpScores = {};
            tps.forEach(tp => {
                tpScores[tp.id] = nilaiTpMap[`${s.id}_${tp.id}`] || 0;
            });
            const sem = nilaiSemMap[s.id] || {};
            return {
                siswa_id: s.id,
                nisn: s.nisn,
                nama: s.nama,
                tp_scores: tpScores,
                sts: Number(sem.sts || 0),
                sas: Number(sem.sas || 0),
                nilai_tp_rata: Number(sem.nilai_tp_rata || 0),
                nilai_akhir: Number(sem.nilai_akhir || 0),
                deskripsi: sem.deskripsi || '',
                is_locked: sem.is_locked || false
            };
        });

        // 6. Get bobot from settings or use default
        const bobot = { tp: 50, sts: 25, sas: 25 };

        res.json({ students: data, tps, bobot });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST: Bulk save all grades
router.post('/input/save', async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        const { kelas_id, mapel_id, tahun_ajaran_id, semester, grades, bobot } = req.body;
        // bobot = { tp: 50, sts: 25, sas: 25 }

        for (const g of grades) {
            // 1. Save each TP score
            if (g.tp_scores) {
                for (const [tp_id, nilai] of Object.entries(g.tp_scores)) {
                    await connection.query(
                        `INSERT INTO nilai_tp (tp_id, siswa_id, nilai) VALUES (?, ?, ?)
                         ON DUPLICATE KEY UPDATE nilai = VALUES(nilai)`,
                        [tp_id, g.siswa_id, nilai || 0]
                    );
                }
            }

            // 2. Calculate TP average
            const tpValues = g.tp_scores ? Object.values(g.tp_scores).map(Number) : [];
            const tpAvg = tpValues.length > 0
                ? tpValues.reduce((a, b) => a + b, 0) / tpValues.length
                : 0;

            // 3. Calculate final score with bobot
            const bTp = (bobot?.tp || 50) / 100;
            const bSts = (bobot?.sts || 25) / 100;
            const bSas = (bobot?.sas || 25) / 100;
            const nilaiAkhir = (tpAvg * bTp) + (Number(g.sts || 0) * bSts) + (Number(g.sas || 0) * bSas);

            // 4. Save nilai_semester
            await connection.query(
                `INSERT INTO nilai_semester (siswa_id, mapel_id, kelas_id, tahun_ajaran_id, semester, nilai_tp_rata, sts, sas, nilai_akhir, deskripsi)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                 ON DUPLICATE KEY UPDATE nilai_tp_rata = VALUES(nilai_tp_rata), sts = VALUES(sts), sas = VALUES(sas), nilai_akhir = VALUES(nilai_akhir), deskripsi = VALUES(deskripsi)`,
                [g.siswa_id, mapel_id, kelas_id, tahun_ajaran_id, semester,
                tpAvg.toFixed(2), g.sts || 0, g.sas || 0, nilaiAkhir.toFixed(2), g.deskripsi || null]
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

// POST: Auto-generate descriptions
router.post('/generate-desc', async (req, res) => {
    try {
        const { kelas_id, mapel_id, tahun_ajaran_id, semester } = req.body;

        // Get TPs
        const [tps] = await pool.query(
            `SELECT id, kode, deskripsi FROM tujuan_pembelajaran
             WHERE mapel_id = ? AND kelas_id = ? AND tahun_ajaran_id = ? AND semester = ? AND guru_id = ?
             ORDER BY sort_order ASC`,
            [mapel_id, kelas_id, tahun_ajaran_id, semester, req.guru_id]
        );

        if (tps.length === 0) {
            return res.json({ descriptions: [] });
        }

        // Get mapel name
        const [mapelRows] = await pool.query('SELECT nama FROM mata_pelajaran WHERE id = ?', [mapel_id]);
        const mapelNama = mapelRows[0]?.nama || 'mata pelajaran';

        // Get students
        const [students] = await pool.query(
            "SELECT id, nama FROM siswa WHERE kelas_id = ? AND status = 'aktif' ORDER BY nama",
            [kelas_id]
        );

        // Get all TP scores
        const tpIds = tps.map(tp => tp.id);
        const [nilaiList] = await pool.query(
            'SELECT * FROM nilai_tp WHERE tp_id IN (?)',
            [tpIds]
        );

        const nilaiMap = {};
        nilaiList.forEach(n => {
            if (!nilaiMap[n.siswa_id]) nilaiMap[n.siswa_id] = {};
            nilaiMap[n.siswa_id][n.tp_id] = Number(n.nilai);
        });

        // Generate descriptions per student
        const descriptions = students.map(s => {
            const scores = nilaiMap[s.id] || {};
            const tpWithScores = tps.map(tp => ({
                ...tp,
                nilai: scores[tp.id] || 0
            }));

            // Find highest and lowest
            const sorted = [...tpWithScores].sort((a, b) => b.nilai - a.nilai);
            const highest = sorted[0];
            const lowest = sorted[sorted.length - 1];

            let desc = `Ananda ${s.nama} `;
            if (highest && highest.nilai >= 70) {
                desc += `menunjukkan penguasaan yang baik pada ${highest.deskripsi} (${highest.kode})`;
            } else {
                desc += `perlu meningkatkan penguasaan dalam ${mapelNama}`;
            }

            if (lowest && lowest.nilai < 70 && lowest.id !== highest?.id) {
                desc += `, namun masih perlu meningkatkan pemahaman pada ${lowest.deskripsi} (${lowest.kode})`;
            }
            desc += '.';

            return {
                siswa_id: s.id,
                nama: s.nama,
                deskripsi: desc
            };
        });

        res.json({ descriptions });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
