const express = require('express');
const router = express.Router();
const pool = require('../../db');

const { studentAuthMiddleware } = require('../../middleware/studentAuth');
const InventoryController = require('../../controllers/InventoryController');
const AttendanceStreakService = require('../../services/attendanceStreakService');

// --- STUDENT PORTAL API ROUTES ---
router.get('/menus', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM student_menus WHERE is_active = TRUE ORDER BY sort_order ASC, id ASC');
        res.json(rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// Semua endpoint student berikut memerlukan JWT student
router.get('/attendance/summary', studentAuthMiddleware, async (req, res) => {
    try {
        const studentId = req.studentId;
        const now = new Date();
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
        const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
        const [rows] = await pool.query(`SELECT COUNT(*) as presentCount FROM siswa_presensi WHERE siswa_id = ? AND status = 'hadir' AND tanggal BETWEEN ? AND ?`, [studentId, firstDayOfMonth, lastDayOfMonth]);
        
        // R-19: Calculate current streak
        const currentStreak = await AttendanceStreakService.calculateStreak(studentId);

        res.json({ 
            presentCount: rows[0].presentCount,
            streak: currentStreak
        });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/tabungan', studentAuthMiddleware, async (req, res) => {
    try {
        const studentId = req.studentId;
        const [rows] = await pool.query(`SELECT id, tanggal as date, tipe as type, nominal as amount, note FROM tabungan WHERE siswa_id = ? ORDER BY tanggal DESC`, [studentId]);
        const totalSetor = rows.filter(r => r.type === 'setor').reduce((acc, r) => acc + Number(r.amount), 0);
        const totalTarik = rows.filter(r => r.type === 'tarik').reduce((acc, r) => acc + Number(r.amount), 0);
        const saldo = totalSetor - totalTarik;
        res.json({ saldo, history: rows });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// R-11: Simplified — read jam_masuk/jam_pulang directly from siswa_presensi (unified table)
router.get('/attendance', studentAuthMiddleware, async (req, res) => {
    try {
        const studentId = req.studentId;
        const [rows] = await pool.query(`
            SELECT id, tanggal as date, status, keterangan, jam_masuk, jam_pulang
            FROM siswa_presensi
            WHERE siswa_id = ? 
            ORDER BY tanggal DESC LIMIT 50
        `, [studentId]);
        res.json(rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/bk', studentAuthMiddleware, async (req, res) => {
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

router.get('/nilai', studentAuthMiddleware, async (req, res) => {
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

router.get('/pesan', studentAuthMiddleware, async (req, res) => {
    try {
        const studentId = req.studentId;
        const [rows] = await pool.query(`SELECT p.*, a.nama as admin_nama FROM pesan p LEFT JOIN users a ON p.pengirim_id = a.id AND p.pengirim_type = 'admin' WHERE (p.pengirim_id = ? AND p.pengirim_type = 'student') OR (p.penerima_id = ? AND p.penerima_type = 'student') ORDER BY p.waktu ASC`, [studentId, studentId]);
        await pool.query(`UPDATE pesan SET is_read = TRUE WHERE penerima_id = ? AND penerima_type = 'student' AND is_read = FALSE`, [studentId]);
        res.json(rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/pesan', studentAuthMiddleware, async (req, res) => {
    try {
        const studentId = req.studentId;
        const { text } = req.body;
        const [result] = await pool.query(`INSERT INTO pesan (pengirim_id, pengirim_type, penerima_id, penerima_type, pesan, waktu, is_read) VALUES (?, 'student', 1, 'admin', ?, UTC_TIMESTAMP(), FALSE)`, [studentId, text]);
        res.status(201).json({ id: result.insertId, success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// Lab Peminjaman History (Student Portal)
router.get('/lab-peminjaman', studentAuthMiddleware, InventoryController.getStudentPeminjaman);

function getGrade(score) {
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'E';
}

module.exports = router;