const express = require('express');
const router = express.Router();
const pool = require('../../db');

// --- SETTINGS MANAGEMENT ---

async function getInfaqSettings() {
    const [rows] = await pool.query('SELECT * FROM infaq_settings');
    const settings = {};
    rows.forEach(r => { settings[r.key_name] = r.value_text; });
    if (settings.active_days) {
        try { settings.active_days = JSON.parse(settings.active_days); }
        catch (e) { settings.active_days = [1, 2, 3, 4, 5, 6]; }
    }
    return settings;
}

router.get('/settings', async (req, res) => {
    try {
        const settings = await getInfaqSettings();
        res.json(settings);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/settings', async (req, res) => {
    try {
        const settings = req.body;
        for (const key in settings) {
            let value = settings[key];
            if (typeof value === 'object') value = JSON.stringify(value);
            await pool.query(
                'INSERT INTO infaq_settings (key_name, value_text) VALUES (?, ?) ON DUPLICATE KEY UPDATE value_text = VALUES(value_text)',
                [key, String(value)]
            );
        }
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- HOLIDAY MANAGEMENT ---

router.get('/holidays', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM harilibur ORDER BY tanggal DESC');
        res.json(rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/holidays', async (req, res) => {
    try {
        const { tanggal, keterangan } = req.body;
        const [result] = await pool.query('INSERT INTO harilibur (tanggal, keterangan) VALUES (?, ?)', [tanggal, keterangan]);
        res.status(201).json({ id: result.insertId, tanggal, keterangan });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/holidays/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM harilibur WHERE id = ?', [req.params.id]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- HELPER: Find tahun_ajaran_id for a given date ---
async function findTahunAjaranForDate(dateStr, connection = pool) {
    const [rows] = await connection.query(
        'SELECT id FROM tahun_ajaran WHERE ? BETWEEN tanggal_mulai AND tanggal_selesai LIMIT 1',
        [dateStr]
    );
    return rows.length > 0 ? rows[0].id : null;
}

// --- INFAQ LOGIC ---

const DAY_NAMES = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

async function isCollectionDay(dateStr, activeDays = [1, 2, 3, 4, 5, 6]) {
    const date = new Date(dateStr);
    const day = date.getDay();
    if (!activeDays.includes(day)) {
        return { isCollection: false, reason: `Hari ${DAY_NAMES[day]} (Non-Koleksi)` };
    }
    const [rows] = await pool.query('SELECT keterangan FROM harilibur WHERE tanggal = ?', [dateStr]);
    if (rows.length > 0) return { isCollection: false, reason: `Libur: ${rows[0].keterangan}` };
    return { isCollection: true };
}

// Get Infaq Status for a class and date
router.get('/status', async (req, res) => {
    try {
        const { date, kelas_id } = req.query;
        if (!date || !kelas_id) return res.status(400).json({ error: 'date and kelas_id are required' });

        const settings = await getInfaqSettings();
        const collectionCheck = await isCollectionDay(date, settings.active_days);

        // Fetch students with enrollment info
        const [students] = await pool.query(
            'SELECT id, nama, nis, angkatan, tanggal_masuk FROM siswa WHERE kelas_id = ? AND status = "aktif" ORDER BY nama ASC',
            [kelas_id]
        );

        if (students.length === 0) {
            return res.json({ isCollection: collectionCheck.isCollection, reason: collectionCheck.reason, students: [], settings });
        }

        const studentIds = students.map(s => s.id);

        // Payments for this specific date
        const [payments] = await pool.query(
            'SELECT siswa_id, nominal FROM infaq_harian WHERE tanggal = ? AND siswa_id IN (?)',
            [date, studentIds]
        );
        const paymentMap = {};
        payments.forEach(p => { paymentMap[p.siswa_id] = p.nominal; });

        // TA lookup
        const [taRows] = await pool.query('SELECT id, tahun, tanggal_mulai, tanggal_selesai FROM tahun_ajaran ORDER BY tanggal_mulai');
        const taMap = {};
        taRows.forEach(row => {
            const yearStr = row.tahun.split('/')[0];
            taMap[yearStr] = row;
        });

        // Holidays
        const [holidaysRows] = await pool.query('SELECT tanggal FROM harilibur WHERE tanggal <= ?', [date]);
        const holidays = new Set(holidaysRows.map(h => new Date(h.tanggal).toISOString().split('T')[0]));
        const activeDays = settings.active_days || [1, 2, 3, 4, 5, 6];

        // Total lifetime payments per student
        const [totalPayments] = await pool.query(
            'SELECT siswa_id, COUNT(*) as count FROM infaq_harian WHERE siswa_id IN (?) GROUP BY siswa_id',
            [studentIds]
        );
        const paidCountMap = {};
        totalPayments.forEach(p => { paidCountMap[p.siswa_id] = p.count; });

        // Calculate per student
        const result = students.map(s => {
            const taInfo = taMap[s.angkatan];
            const taStartDate = taInfo ? new Date(taInfo.tanggal_mulai).toISOString().split('T')[0] : null;
            const studentStartStr = s.tanggal_masuk
                ? new Date(s.tanggal_masuk).toISOString().split('T')[0]
                : taStartDate;

            if (!studentStartStr) return { ...s, has_paid: !!paymentMap[s.id], missed_days: 0 };

            const startDate = new Date(studentStartStr);
            const endDate = new Date(date);
            let expected = 0;
            let tempDate = new Date(startDate);
            while (tempDate <= endDate) {
                const dStr = tempDate.toISOString().split('T')[0];
                if (activeDays.includes(tempDate.getDay()) && !holidays.has(dStr)) {
                    expected++;
                }
                tempDate.setDate(tempDate.getDate() + 1);
            }

            const paidCount = paidCountMap[s.id] || 0;
            const missedDays = Math.max(0, expected - paidCount);

            return {
                ...s,
                has_paid: !!paymentMap[s.id],
                nominal: Number(paymentMap[s.id] || 0),
                missed_days: missedDays
            };
        });

        res.json({ isCollection: collectionCheck.isCollection, reason: collectionCheck.reason, students: result, settings });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- PAY INFAQ (supports: single, batch dates, prepaid, quick-pay historical) ---
router.post('/pay', async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        const { payments, user_id } = req.body;
        const settings = await getInfaqSettings();
        const activeDays = settings.active_days || [1, 2, 3, 4, 5, 6];
        const nominalDefault = Number(settings.nominal_default) || 2000;

        // Cache snapshot siswa (nama + nis) agar tidak query berulang kali per siswa
        const siswaSnapshotCache = {};
        const getSiswaSnapshot = async (siswa_id) => {
            if (!siswaSnapshotCache[siswa_id]) {
                try {
                    const [[s]] = await connection.query('SELECT nama, nis FROM siswa WHERE id = ?', [siswa_id]);
                    siswaSnapshotCache[siswa_id] = s ? { nama: s.nama, nis: s.nis } : { nama: null, nis: null };
                } catch (e) {
                    siswaSnapshotCache[siswa_id] = { nama: null, nis: null };
                }
            }
            return siswaSnapshotCache[siswa_id];
        };

        const insertInfaq = async (siswa_id, dateStr, nominalVal, userId, taId) => {
            const snap = await getSiswaSnapshot(siswa_id);
            try {
                await connection.query(
                    'INSERT INTO infaq_harian (siswa_id, tanggal, nominal, user_id, tahun_ajaran_id, nama_siswa, nis) VALUES (?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE nominal = VALUES(nominal)',
                    [siswa_id, dateStr, nominalVal, userId, taId, snap.nama, snap.nis]
                );
            } catch (e) {
                // Fallback jika kolom snapshot belum ada (sebelum migration 013)
                await connection.query(
                    'INSERT INTO infaq_harian (siswa_id, tanggal, nominal, user_id, tahun_ajaran_id) VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE nominal = VALUES(nominal)',
                    [siswa_id, dateStr, nominalVal, userId, taId]
                );
            }
        };

        for (const p of payments) {
            const { siswa_id, date, nominal, days = 1, dates, ta_id, missed_dates } = p;

            // MODE 1: Batch dates (from calendar multi-select)
            if (dates && Array.isArray(dates) && dates.length > 0) {
                for (const d of dates) {
                    const taId = ta_id || await findTahunAjaranForDate(d, connection);
                    await insertInfaq(siswa_id, d, nominal || nominalDefault, user_id, taId);
                }
            }
            // MODE 2: Quick Pay historical (missed_dates from a specific TA)
            else if (missed_dates && Array.isArray(missed_dates) && missed_dates.length > 0) {
                for (const d of missed_dates) {
                    const taId = ta_id || await findTahunAjaranForDate(d, connection);
                    await insertInfaq(siswa_id, d, nominal || nominalDefault, user_id, taId);
                }
            }
            // MODE 3: Single day payment
            else if (days === 1) {
                const taId = await findTahunAjaranForDate(date, connection);
                await insertInfaq(siswa_id, date, nominal || nominalDefault, user_id, taId);
            }
            // MODE 4: Prepaid (future days)
            else if (days > 1) {
                const [holidaysRows] = await connection.query('SELECT tanggal FROM harilibur WHERE tanggal >= ?', [date]);
                const holidays = new Set(holidaysRows.map(h => new Date(h.tanggal).toISOString().split('T')[0]));
                let found = 0;
                let curr = new Date(date);
                while (found < days) {
                    const dStr = curr.toISOString().split('T')[0];
                    if (activeDays.includes(curr.getDay()) && !holidays.has(dStr)) {
                        const taId = await findTahunAjaranForDate(dStr, connection);
                        await insertInfaq(siswa_id, dStr, nominal || nominalDefault, user_id, taId);
                        found++;
                    }
                    curr.setDate(curr.getDate() + 1);
                    if (found > 365) break;
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


// Summary for chart
router.get('/summary', async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const [rows] = await pool.query(
            `SELECT tanggal, SUM(nominal) as total, COUNT(DISTINCT siswa_id) as student_count 
             FROM infaq_harian WHERE tanggal BETWEEN ? AND ? GROUP BY tanggal ORDER BY tanggal ASC`,
            [startDate, endDate]
        );
        const [classRows] = await pool.query(
            `SELECT i.tanggal, k.nama as kelas_nama, SUM(i.nominal) as total
             FROM infaq_harian i JOIN siswa s ON i.siswa_id = s.id JOIN kelas k ON s.kelas_id = k.id
             WHERE i.tanggal BETWEEN ? AND ? GROUP BY i.tanggal, k.id ORDER BY i.tanggal ASC, k.nama ASC`,
            [startDate, endDate]
        );
        res.json({ daily: rows, classes: classRows });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- GLOBAL SUMMARY (school-wide) ---
router.get('/summary/global', async (req, res) => {
    try {
        const { tahun_ajaran_id } = req.query;

        // Monthly aggregation
        let monthlyQuery = `
            SELECT 
                YEAR(tanggal) as tahun, MONTH(tanggal) as bulan,
                SUM(nominal) as total_collected,
                COUNT(*) as total_payments,
                COUNT(DISTINCT siswa_id) as unique_students
            FROM infaq_harian
        `;
        const params = [];
        if (tahun_ajaran_id) {
            monthlyQuery += ' WHERE tahun_ajaran_id = ?';
            params.push(tahun_ajaran_id);
        }
        monthlyQuery += ' GROUP BY YEAR(tanggal), MONTH(tanggal) ORDER BY tahun ASC, bulan ASC';
        const [monthly] = await pool.query(monthlyQuery, params);

        // Per-class summary
        let classQuery = `
            SELECT k.nama as kelas_nama, k.id as kelas_id,
                SUM(i.nominal) as total, COUNT(*) as payments,
                COUNT(DISTINCT i.siswa_id) as students
            FROM infaq_harian i
            JOIN siswa s ON i.siswa_id = s.id
            JOIN kelas k ON s.kelas_id = k.id
        `;
        const classParams = [];
        if (tahun_ajaran_id) {
            classQuery += ' WHERE i.tahun_ajaran_id = ?';
            classParams.push(tahun_ajaran_id);
        }
        classQuery += ' GROUP BY k.id ORDER BY total DESC';
        const [classes] = await pool.query(classQuery, classParams);

        // Totals
        let totalQuery = 'SELECT COALESCE(SUM(nominal), 0) as grand_total, COUNT(*) as total_records FROM infaq_harian';
        const totalParams = [];
        if (tahun_ajaran_id) {
            totalQuery += ' WHERE tahun_ajaran_id = ?';
            totalParams.push(tahun_ajaran_id);
        }
        const [totals] = await pool.query(totalQuery, totalParams);

        // Available tahun ajaran for filter
        const [taList] = await pool.query('SELECT id, tahun FROM tahun_ajaran ORDER BY tanggal_mulai DESC');

        res.json({
            monthly,
            classes,
            grand_total: totals[0].grand_total,
            total_records: totals[0].total_records,
            tahun_ajaran_list: taList
        });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- TRANSACTION LOG (paginated) ---
router.get('/transactions', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const offset = (page - 1) * limit;
        const { kelas_id, tahun_ajaran_id } = req.query;

        let where = [];
        let params = [];
        if (kelas_id) { where.push('s.kelas_id = ?'); params.push(kelas_id); }
        if (tahun_ajaran_id) { where.push('i.tahun_ajaran_id = ?'); params.push(tahun_ajaran_id); }

        const whereClause = where.length > 0 ? 'WHERE ' + where.join(' AND ') : '';

        const [rows] = await pool.query(
            `SELECT i.id, i.tanggal, i.nominal, i.created_at, i.tahun_ajaran_id,
                    s.nama as siswa_nama, s.nis, k.nama as kelas_nama,
                    ta.tahun as tahun_ajaran
             FROM infaq_harian i
             JOIN siswa s ON i.siswa_id = s.id
             LEFT JOIN kelas k ON s.kelas_id = k.id
             LEFT JOIN tahun_ajaran ta ON i.tahun_ajaran_id = ta.id
             ${whereClause}
             ORDER BY i.created_at DESC
             LIMIT ? OFFSET ?`,
            [...params, limit, offset]
        );

        const [countResult] = await pool.query(
            `SELECT COUNT(*) as total FROM infaq_harian i JOIN siswa s ON i.siswa_id = s.id ${whereClause}`,
            params
        );

        res.json({
            transactions: rows,
            pagination: {
                page,
                limit,
                total: countResult[0].total,
                total_pages: Math.ceil(countResult[0].total / limit)
            }
        });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// Detailed History for a Student
router.get('/history/:siswaId', async (req, res) => {
    try {
        const { siswaId } = req.params;
        const settings = await getInfaqSettings();

        const [student] = await pool.query(
            'SELECT s.id, s.nama, s.nis, s.angkatan, s.tanggal_masuk, k.nama as kelas_nama FROM siswa s LEFT JOIN kelas k ON s.kelas_id = k.id WHERE s.id = ?',
            [siswaId]
        );
        if (student.length === 0) return res.status(404).json({ error: 'Siswa tidak ditemukan' });

        // Include created_at for payment date tooltip
        const [history] = await pool.query(
            'SELECT tanggal, nominal, created_at, tahun_ajaran_id FROM infaq_harian WHERE siswa_id = ? ORDER BY tanggal DESC',
            [siswaId]
        );

        const [holidays] = await pool.query('SELECT tanggal, keterangan FROM harilibur ORDER BY tanggal ASC');

        // Academic years with missed_dates calculation
        const [academicYearsRows] = await pool.query('SELECT id, tahun, tanggal_mulai, tanggal_selesai FROM tahun_ajaran ORDER BY tanggal_mulai DESC');

        const todayStr = new Date().toISOString().split('T')[0];
        const activeDays = settings.active_days || [1, 2, 3, 4, 5, 6];
        const holidaysSet = new Set(holidays.map(h => new Date(h.tanggal).toISOString().split('T')[0]));

        // Student start date
        const taMap = {};
        academicYearsRows.forEach(row => {
            const yearStr = row.tahun.split('/')[0];
            taMap[yearStr] = row;
        });
        const taInfo = taMap[student[0].angkatan];
        const taStartDate = taInfo ? new Date(taInfo.tanggal_mulai).toISOString().split('T')[0] : null;
        const studentStartStr = student[0].tanggal_masuk
            ? new Date(student[0].tanggal_masuk).toISOString().split('T')[0]
            : taStartDate;
        const systemStart = studentStartStr ? new Date(studentStartStr) : null;

        // Paid dates set for quick lookup
        const paidDatesSet = new Set(history.map(h => new Date(h.tanggal).toISOString().split('T')[0]));

        const academicYears = academicYearsRows.map(ta => {
            if (!ta.tanggal_mulai || !ta.tanggal_selesai) return { ...ta, isLunas: false, missed_days: 0, missed_dates: [] };

            const taMulai = new Date(ta.tanggal_mulai);
            const taSelesai = new Date(ta.tanggal_selesai);

            const effectiveStart = systemStart && taMulai < systemStart ? systemStart : taMulai;
            const calcEnd = taSelesai < new Date(todayStr) ? taSelesai : new Date(todayStr);

            if (effectiveStart > calcEnd) return { ...ta, isLunas: true, status: 'Sebelum Masuk', missed_days: 0, missed_dates: [] };

            let expected = 0;
            const missedDates = [];
            let curr = new Date(effectiveStart);
            while (curr <= calcEnd) {
                const dStr = curr.toISOString().split('T')[0];
                if (activeDays.includes(curr.getDay()) && !holidaysSet.has(dStr)) {
                    expected++;
                    if (!paidDatesSet.has(dStr)) {
                        missedDates.push(dStr);
                    }
                }
                curr.setDate(curr.getDate() + 1);
            }

            const paid = history.filter(h => {
                const hDate = new Date(h.tanggal).toISOString().split('T')[0];
                return hDate >= taMulai.toISOString().split('T')[0] && hDate <= taSelesai.toISOString().split('T')[0];
            }).length;

            return {
                ...ta,
                isLunas: paid >= expected,
                expected,
                paid,
                missed_days: missedDates.length,
                missed_dates: missedDates,
                isCurrent: new Date(todayStr) >= taMulai && new Date(todayStr) <= taSelesai
            };
        });

        res.json({
            student: student[0],
            history: history.map(h => ({
                ...h,
                tanggal: new Date(h.tanggal).toISOString().split('T')[0],
                created_at: h.created_at
            })),
            holidays: holidays.map(h => ({
                tanggal: new Date(h.tanggal).toISOString().split('T')[0],
                keterangan: h.keterangan
            })),
            settings,
            academicYears
        });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// Update student enrollment date
router.put('/siswa/:siswaId/enrollment', async (req, res) => {
    try {
        const { siswaId } = req.params;
        const { tanggal_masuk } = req.body;
        await pool.query('UPDATE siswa SET tanggal_masuk = ? WHERE id = ?', [tanggal_masuk || null, siswaId]);
        res.json({ message: 'Tanggal masuk diperbarui' });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
