const express = require('express');
const router = express.Router();
const pool = require('../../db');

// --- HOLIDAY MANAGEMENT ---

// Get all holidays
router.get('/holidays', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM harilibur ORDER BY tanggal DESC');
        res.json(rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// Add holiday
router.post('/holidays', async (req, res) => {
    try {
        const { tanggal, keterangan } = req.body;
        const [result] = await pool.query('INSERT INTO harilibur (tanggal, keterangan) VALUES (?, ?)', [tanggal, keterangan]);
        res.status(201).json({ id: result.insertId, tanggal, keterangan });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// Delete holiday
router.delete('/holidays/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM harilibur WHERE id = ?', [req.params.id]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- INFAQ LOGIC ---

// Helper function to check if a date is a collection day (Mon-Sat and not holiday)
async function isCollectionDay(dateStr) {
    const date = new Date(dateStr);
    const day = date.getDay(); // 0: Sunday, 1: Monday, ..., 6: Saturday
    if (day === 0) return { isCollection: false, reason: 'Hari Minggu' };

    const [rows] = await pool.query('SELECT keterangan FROM harilibur WHERE tanggal = ?', [dateStr]);
    if (rows.length > 0) return { isCollection: false, reason: `Libur: ${rows[0].keterangan}` };

    return { isCollection: true };
}

// Get Infaq Status for a class and date
router.get('/status', async (req, res) => {
    try {
        const { date, kelas_id } = req.query;
        if (!date || !kelas_id) return res.status(400).json({ error: 'date and kelas_id are required' });

        const collectionCheck = await isCollectionDay(date);

        // Fetch all active students in class
        const [students] = await pool.query('SELECT id, nama, nis FROM siswa WHERE kelas_id = ? AND status = "aktif" ORDER BY nama ASC', [kelas_id]);

        // Fetch payments for this class on this date
        const [payments] = await pool.query(
            'SELECT siswa_id, nominal FROM infaq_harian WHERE tanggal = ? AND siswa_id IN (?)',
            [date, students.map(s => s.id).length > 0 ? students.map(s => s.id) : [0]]
        );

        const paymentMap = {};
        payments.forEach(p => { paymentMap[p.siswa_id] = p.nominal; });

        // Calculate "Missed Days" (Advanced)
        // Optimization: We check last 30 collection days
        const [holidaysRows] = await pool.query('SELECT tanggal FROM harilibur WHERE tanggal <= ? ORDER BY tanggal DESC LIMIT 60', [date]);
        const holidays = new Set(holidaysRows.map(h => new Date(h.tanggal).toISOString().split('T')[0]));

        const collectionDates = [];
        let curr = new Date(date);
        // Go back in time to find last 30 collection days
        let count = 0;
        while (collectionDates.length < 30 && count < 60) {
            const dStr = curr.toISOString().split('T')[0];
            const dDay = curr.getDay();
            if (dDay !== 0 && !holidays.has(dStr)) {
                collectionDates.push(dStr);
            }
            curr.setDate(curr.getDate() - 1);
            count++;
        }

        // Fetch ALL payments for these students in these dates
        const [allRecentPayments] = await pool.query(
            'SELECT siswa_id, tanggal FROM infaq_harian WHERE siswa_id IN (?) AND tanggal IN (?)',
            [students.map(s => s.id).length > 0 ? students.map(s => s.id) : [0], collectionDates]
        );

        const studentPayments = {};
        allRecentPayments.forEach(p => {
            const dStr = new Date(p.tanggal).toISOString().split('T')[0];
            if (!studentPayments[p.siswa_id]) studentPayments[p.siswa_id] = new Set();
            studentPayments[p.siswa_id].add(dStr);
        });

        const result = students.map(s => {
            let missedDays = 0;
            // Count missed days starting from the MOST RECENT day BEFORE 'date'
            // or including 'date' if we want to show it as missed today.
            // Let's count days BEFORE 'date' that were missed.
            for (let i = 1; i < collectionDates.length; i++) {
                const d = collectionDates[i];
                if (!studentPayments[s.id]?.has(d)) {
                    missedDays++;
                } else {
                    // Stop counting if they paid once? 
                    // No, "Missed Days" usually means total unpaid days in a period.
                    // But if they paid recently, we might just want "Consecutive Missed Days".
                    // Let's do total missed in last 30 collection days.
                }
            }

            return {
                ...s,
                has_paid: !!paymentMap[s.id],
                nominal: Number(paymentMap[s.id] || 0),
                missed_days: missedDays
            };
        });

        res.json({
            isCollection: collectionCheck.isCollection,
            reason: collectionCheck.reason,
            students: result
        });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// Pay Infaq (supports bulk and prepaid)
router.post('/pay', async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        const { payments, user_id } = req.body; 
        // payments: [{ siswa_id, date, nominal, days: 1 }]

        for (const p of payments) {
            const { siswa_id, date, nominal, days = 1 } = p;
            
            if (days === 1) {
                await connection.query(
                    'INSERT INTO infaq_harian (siswa_id, tanggal, nominal, user_id) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE nominal = VALUES(nominal)',
                    [siswa_id, date, nominal, user_id]
                );
            } else {
                // Prepaid logic: Find next X collection days starting from 'date'
                const [holidaysRows] = await connection.query('SELECT tanggal FROM harilibur WHERE tanggal >= ?', [date]);
                const holidays = new Set(holidaysRows.map(h => new Date(h.tanggal).toISOString().split('T')[0]));
                
                let found = 0;
                let curr = new Date(date);
                while (found < days) {
                    const dStr = curr.toISOString().split('T')[0];
                    const dDay = curr.getDay();
                    if (dDay !== 0 && !holidays.has(dStr)) {
                        await connection.query(
                            'INSERT INTO infaq_harian (siswa_id, tanggal, nominal, user_id) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE nominal = VALUES(nominal)',
                            [siswa_id, dStr, nominal / days, user_id]
                        );
                        found++;
                    }
                    curr.setDate(curr.getDate() + 1);
                    if (found > 365) break; // Safety break
                }
            }
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

// Summary for Heatmap
router.get('/summary', async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const [rows] = await pool.query(
            `SELECT tanggal, SUM(nominal) as total, COUNT(DISTINCT siswa_id) as student_count 
             FROM infaq_harian 
             WHERE tanggal BETWEEN ? AND ? 
             GROUP BY tanggal 
             ORDER BY tanggal ASC`,
            [startDate, endDate]
        );

        // Also get per-class breakdown for heatmap
        const [classRows] = await pool.query(
            `SELECT i.tanggal, k.nama as kelas_nama, SUM(i.nominal) as total
             FROM infaq_harian i
             JOIN siswa s ON i.siswa_id = s.id
             JOIN kelas k ON s.kelas_id = k.id
             WHERE i.tanggal BETWEEN ? AND ?
             GROUP BY i.tanggal, k.id
             ORDER BY i.tanggal ASC, k.nama ASC`,
            [startDate, endDate]
        );

        res.json({ daily: rows, classes: classRows });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// Detailed History for a Student
router.get('/history/:siswaId', async (req, res) => {
    try {
        const { siswaId } = req.params;
        
        // 1. Get student info
        const [student] = await pool.query(
            'SELECT s.id, s.nama, s.nis, k.nama as kelas_nama FROM siswa s LEFT JOIN kelas k ON s.kelas_id = k.id WHERE s.id = ?',
            [siswaId]
        );
        
        if (student.length === 0) return res.status(404).json({ error: 'Siswa tidak ditemukan' });

        // 2. Get all infaq records for this student
        const [history] = await pool.query(
            'SELECT tanggal, nominal, created_at FROM infaq_harian WHERE siswa_id = ? ORDER BY tanggal DESC',
            [siswaId]
        );

        // 3. Get all holidays
        const [holidays] = await pool.query('SELECT tanggal, keterangan FROM harilibur ORDER BY tanggal ASC');

        res.json({
            student: student[0],
            history: history.map(h => ({
                ...h,
                tanggal: new Date(h.tanggal).toISOString().split('T')[0]
            })),
            holidays: holidays.map(h => ({
                tanggal: new Date(h.tanggal).toISOString().split('T')[0],
                keterangan: h.keterangan
            }))
        });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
