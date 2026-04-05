const pool = require('../db');
const socketService = require('../services/socket');
const waService = require('../services/whatsappService');

class InventoryController {

    // ===================== SETTINGS =====================

    static async getSettings(req, res) {
        try {
            const [rows] = await pool.query('SELECT * FROM lab_settings');
            const settings = {};
            rows.forEach(r => { settings[r.key] = r.value });
            res.json(settings);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

    static async updateSettings(req, res) {
        const settings = req.body;
        try {
            for (const key in settings) {
                await pool.query(
                    'INSERT INTO lab_settings (`key`, value) VALUES (?, ?) ON DUPLICATE KEY UPDATE value = VALUES(value)',
                    [key, settings[key].toString()]
                );
            }
            res.json({ success: true, message: 'Pengaturan berhasil diperbarui' });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

    // ===================== KATEGORI =====================

    static async getKategori(req, res) {
        try {
            const [rows] = await pool.query(`
                SELECT lk.*, 
                    (SELECT COUNT(*) FROM lab_inventaris li WHERE li.kategori_id = lk.id) as item_count
                FROM lab_kategori lk 
                ORDER BY lk.nama ASC
            `);
            res.json(rows);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

    static async createKategori(req, res) {
        try {
            const { nama, icon, deskripsi } = req.body;
            if (!nama) return res.status(400).json({ error: 'Nama kategori wajib diisi' });
            const [result] = await pool.query(
                'INSERT INTO lab_kategori (nama, icon, deskripsi) VALUES (?, ?, ?)',
                [nama, icon || '📦', deskripsi || null]
            );
            res.status(201).json({ success: true, id: result.insertId });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

    static async updateKategori(req, res) {
        try {
            const { nama, icon, deskripsi } = req.body;
            await pool.query(
                'UPDATE lab_kategori SET nama = ?, icon = ?, deskripsi = ? WHERE id = ?',
                [nama, icon || '📦', deskripsi || null, req.params.id]
            );
            res.json({ success: true });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

    static async deleteKategori(req, res) {
        try {
            const [items] = await pool.query('SELECT id FROM lab_inventaris WHERE kategori_id = ?', [req.params.id]);
            if (items.length > 0) {
                return res.status(400).json({ error: 'Tidak dapat menghapus kategori yang masih memiliki item inventaris.' });
            }
            await pool.query('DELETE FROM lab_kategori WHERE id = ?', [req.params.id]);
            res.json({ success: true });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

    // ===================== INVENTARIS =====================

    static async getInventaris(req, res) {
        try {
            const [rows] = await pool.query(`
                SELECT li.*, lk.nama as kategori_nama, lk.icon as kategori_icon,
                    lp.siswa_nama as peminjam_nama, lp.siswa_kelas as peminjam_kelas,
                    lp.tanggal_pinjam, lp.batas_kembali
                FROM lab_inventaris li
                LEFT JOIN lab_kategori lk ON li.kategori_id = lk.id
                LEFT JOIN (
                    SELECT p.inventaris_id, s.nama as siswa_nama, k.nama as siswa_kelas,
                           p.tanggal_pinjam, p.batas_kembali
                    FROM lab_peminjaman p
                    JOIN siswa s ON p.siswa_id = s.id
                    LEFT JOIN kelas k ON s.kelas_id = k.id
                    WHERE p.status = 'dipinjam'
                ) lp ON lp.inventaris_id = li.id
                ORDER BY li.kode ASC
            `);
            res.json(rows);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

    static async createInventaris(req, res) {
        try {
            const { kategori_id, kode, nama, merk, spesifikasi, kondisi, lokasi, foto, nilai_aset, tanggal_perolehan, catatan, max_pinjam_per_siswa, durasi_pinjam, durasi_tipe } = req.body;
            if (!kode || !nama || !kategori_id) {
                return res.status(400).json({ error: 'Kode, nama, dan kategori wajib diisi' });
            }
            const [result] = await pool.query(
                `INSERT INTO lab_inventaris (kategori_id, kode, nama, merk, spesifikasi, kondisi, lokasi, foto, nilai_aset, tanggal_perolehan, catatan, max_pinjam_per_siswa, durasi_pinjam, durasi_tipe)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [kategori_id, kode, nama, merk || null, spesifikasi || null, kondisi || 'baik', lokasi || null, foto || null, nilai_aset || null, tanggal_perolehan || null, catatan || null, max_pinjam_per_siswa || 1, durasi_pinjam || 1, durasi_tipe || 'hari']
            );
            res.status(201).json({ success: true, id: result.insertId });
        } catch (err) {
            if (err.code === 'ER_DUP_ENTRY') {
                return res.status(400).json({ error: 'Kode inventaris sudah digunakan' });
            }
            res.status(500).json({ error: err.message });
        }
    }

    static async updateInventaris(req, res) {
        try {
            const { kategori_id, kode, nama, merk, spesifikasi, kondisi, status, lokasi, foto, nilai_aset, tanggal_perolehan, catatan, max_pinjam_per_siswa, durasi_pinjam, durasi_tipe } = req.body;
            await pool.query(
                `UPDATE lab_inventaris SET 
                    kategori_id = ?, kode = ?, nama = ?, merk = ?, spesifikasi = ?, 
                    kondisi = ?, status = ?, lokasi = ?, foto = ?, 
                    nilai_aset = ?, tanggal_perolehan = ?, catatan = ?, 
                    max_pinjam_per_siswa = ?, durasi_pinjam = ?, durasi_tipe = ?
                 WHERE id = ?`,
                [kategori_id, kode, nama, merk || null, spesifikasi || null, kondisi || 'baik', status || 'tersedia', lokasi || null, foto || null, nilai_aset || null, tanggal_perolehan || null, catatan || null, max_pinjam_per_siswa || 1, durasi_pinjam || 1, durasi_tipe || 'hari', req.params.id]
            );
            res.json({ success: true });
        } catch (err) {
            if (err.code === 'ER_DUP_ENTRY') {
                return res.status(400).json({ error: 'Kode inventaris sudah digunakan' });
            }
            res.status(500).json({ error: err.message });
        }
    }

    static async deleteInventaris(req, res) {
        try {
            const [active] = await pool.query(
                'SELECT id FROM lab_peminjaman WHERE inventaris_id = ? AND status = "dipinjam"',
                [req.params.id]
            );
            if (active.length > 0) {
                return res.status(400).json({ error: 'Tidak dapat menghapus item yang sedang dipinjam.' });
            }
            await pool.query('DELETE FROM lab_inventaris WHERE id = ?', [req.params.id]);
            res.json({ success: true });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

    // ===================== PEMINJAMAN =====================

    static async getPeminjaman(req, res) {
        try {
            const { status: filterStatus } = req.query;
            let query = `
                SELECT lp.*, 
                    li.kode as inventaris_kode, li.nama as inventaris_nama, li.merk as inventaris_merk,
                    lk.nama as kategori_nama, lk.icon as kategori_icon,
                    s.nama as siswa_nama, s.nisn as siswa_nisn,
                    k.nama as kelas_nama,
                    u.nama as petugas_nama
                FROM lab_peminjaman lp
                JOIN lab_inventaris li ON lp.inventaris_id = li.id
                LEFT JOIN lab_kategori lk ON li.kategori_id = lk.id
                JOIN siswa s ON lp.siswa_id = s.id
                LEFT JOIN kelas k ON s.kelas_id = k.id
                LEFT JOIN users u ON lp.user_id = u.id
            `;
            const params = [];
            if (filterStatus === 'aktif') {
                query += ' WHERE lp.status = "dipinjam"';
            } else if (filterStatus === 'riwayat') {
                query += ' WHERE lp.status IN ("dikembalikan", "terlambat")';
            }
            query += ' ORDER BY lp.created_at DESC';
            const [rows] = await pool.query(query, params);
            res.json(rows);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

    static async createPeminjaman(req, res) {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();
            const { inventaris_id, siswa_id, catatan } = req.body;
            const user_id = req.userId || null;

            // Validate item
            const [items] = await connection.query('SELECT * FROM lab_inventaris WHERE id = ?', [inventaris_id]);
            if (items.length === 0) return res.status(404).json({ error: 'Item inventaris tidak ditemukan' });
            if (items[0].status !== 'tersedia') return res.status(400).json({ error: 'Item sedang tidak tersedia' });

            // Get settings
            const [settingsRows] = await connection.query('SELECT * FROM lab_settings');
            const settings = {};
            settingsRows.forEach(r => { settings[r.key] = r.value });
            const batasHari = parseInt(settings['batas_pinjam_hari'] || '1');
            const maxPinjam = parseInt(settings['max_pinjam_per_siswa'] || '2');

            // Check max borrowing
            const [activeBorrows] = await connection.query(
                'SELECT COUNT(*) as count FROM lab_peminjaman WHERE siswa_id = ? AND status = "dipinjam"',
                [siswa_id]
            );
            if (activeBorrows[0].count >= maxPinjam) {
                await connection.rollback();
                return res.status(400).json({ error: `Siswa sudah meminjam ${maxPinjam} item (batas maksimum)` });
            }

            const now = new Date();
            const batasKembali = new Date(now.getTime() + batasHari * 24 * 60 * 60 * 1000);

            const formatDT = (d) => {
                const pad = (n) => String(n).padStart(2, '0');
                return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
            };

            await connection.query(
                `INSERT INTO lab_peminjaman (inventaris_id, siswa_id, user_id, tanggal_pinjam, batas_kembali, kondisi_pinjam, catatan)
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [inventaris_id, siswa_id, user_id, formatDT(now), formatDT(batasKembali), items[0].kondisi, catatan || null]
            );

            await connection.query('UPDATE lab_inventaris SET status = "dipinjam" WHERE id = ?', [inventaris_id]);

            await connection.commit();
            res.status(201).json({ success: true, message: 'Peminjaman berhasil dicatat' });
        } catch (err) {
            await connection.rollback();
            res.status(500).json({ error: err.message });
        } finally {
            connection.release();
        }
    }

    static async returnPeminjaman(req, res) {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();
            const { id } = req.params;
            const { kondisi_kembali, catatan } = req.body;

            const [loans] = await connection.query('SELECT * FROM lab_peminjaman WHERE id = ?', [id]);
            if (loans.length === 0) return res.status(404).json({ error: 'Data peminjaman tidak ditemukan' });
            if (loans[0].status !== 'dipinjam') return res.status(400).json({ error: 'Peminjaman sudah dikembalikan' });

            const now = new Date();
            const batas = new Date(loans[0].batas_kembali);
            const isLate = now > batas;

            const formatDT = (d) => {
                const pad = (n) => String(n).padStart(2, '0');
                return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
            };

            await connection.query(
                `UPDATE lab_peminjaman SET tanggal_kembali = ?, kondisi_kembali = ?, status = ?, catatan = CONCAT(IFNULL(catatan,''), ?) WHERE id = ?`,
                [formatDT(now), kondisi_kembali || loans[0].kondisi_pinjam, isLate ? 'terlambat' : 'dikembalikan', catatan ? '\n' + catatan : '', id]
            );

            // Update item status
            const newKondisi = kondisi_kembali || loans[0].kondisi_pinjam;
            const newStatus = (newKondisi === 'rusak_berat') ? 'maintenance' : 'tersedia';
            await connection.query(
                'UPDATE lab_inventaris SET status = ?, kondisi = ? WHERE id = ?',
                [newStatus, newKondisi, loans[0].inventaris_id]
            );

            await connection.commit();
            res.json({ success: true, message: isLate ? 'Dikembalikan (terlambat)' : 'Pengembalian berhasil', isLate });
        } catch (err) {
            await connection.rollback();
            res.status(500).json({ error: err.message });
        } finally {
            connection.release();
        }
    }

    // ===================== DASHBOARD =====================

    static async getDashboard(req, res) {
        try {
            const [totalItems] = await pool.query('SELECT COUNT(*) as count FROM lab_inventaris');
            const [tersedia] = await pool.query('SELECT COUNT(*) as count FROM lab_inventaris WHERE status = "tersedia"');
            const [dipinjam] = await pool.query('SELECT COUNT(*) as count FROM lab_inventaris WHERE status = "dipinjam"');
            const [maintenance] = await pool.query('SELECT COUNT(*) as count FROM lab_inventaris WHERE status = "maintenance"');

            const [overdue] = await pool.query(
                'SELECT COUNT(*) as count FROM lab_peminjaman WHERE status = "dipinjam" AND batas_kembali < NOW()'
            );

            const [totalPeminjaman] = await pool.query('SELECT COUNT(*) as count FROM lab_peminjaman');

            // Top items
            const [topItems] = await pool.query(`
                SELECT li.kode, li.nama, COUNT(lp.id) as total_pinjam
                FROM lab_peminjaman lp
                JOIN lab_inventaris li ON lp.inventaris_id = li.id
                GROUP BY lp.inventaris_id
                ORDER BY total_pinjam DESC
                LIMIT 5
            `);

            // Stock Analytics
            const [stockData] = await pool.query(`
                SELECT nama, 
                    COUNT(*) as total,
                    SUM(CASE WHEN status = 'tersedia' THEN 1 ELSE 0 END) as tersedia,
                    MAX(max_pinjam_per_siswa) as limit_pinjam
                FROM lab_inventaris
                GROUP BY nama
                ORDER BY tersedia ASC
            `);

            // Overdue list
            const [overdueList] = await pool.query(`
                SELECT lp.id, lp.tanggal_pinjam, lp.batas_kembali,
                    li.kode as inventaris_kode, li.nama as inventaris_nama,
                    s.nama as siswa_nama, k.nama as kelas_nama
                FROM lab_peminjaman lp
                JOIN lab_inventaris li ON lp.inventaris_id = li.id
                JOIN siswa s ON lp.siswa_id = s.id
                LEFT JOIN kelas k ON s.kelas_id = k.id
                WHERE lp.status = 'dipinjam' AND lp.batas_kembali < NOW()
                ORDER BY lp.batas_kembali ASC
                LIMIT 10
            `);

            // Monthly chart data (last 6 months)
            const [monthlyData] = await pool.query(`
                SELECT 
                    DATE_FORMAT(tanggal_pinjam, '%Y-%m') as bulan,
                    COUNT(*) as total_pinjam,
                    SUM(CASE WHEN status = 'dikembalikan' THEN 1 ELSE 0 END) as dikembalikan,
                    SUM(CASE WHEN status = 'terlambat' THEN 1 ELSE 0 END) as terlambat
                FROM lab_peminjaman
                WHERE tanggal_pinjam >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
                GROUP BY DATE_FORMAT(tanggal_pinjam, '%Y-%m')
                ORDER BY bulan ASC
            `);

            res.json({
                stats: {
                    total: totalItems[0].count,
                    tersedia: tersedia[0].count,
                    dipinjam: dipinjam[0].count,
                    maintenance: maintenance[0].count,
                    overdue: overdue[0].count,
                    totalPeminjaman: totalPeminjaman[0].count
                },
                topItems,
                stockData,
                overdueList,
                monthlyData
            });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

    // ===================== RFID SCAN (KIOSK) =====================

    static async scanBorrow(req, res) {
        const io = socketService.getIo();
        const connection = await pool.getConnection();

        try {
            await connection.beginTransaction();
            const { rfid_uid, inventaris_id } = req.body;

            if (!rfid_uid) return res.status(400).json({ error: 'RFID UID wajib diisi' });
            if (!inventaris_id) return res.status(400).json({ error: 'ID inventaris wajib dipilih' });

            // 1. Lookup siswa
            const [students] = await connection.query(
                `SELECT s.id, s.nama, s.nisn, s.jk, k.nama as kelas_nama 
                 FROM siswa s LEFT JOIN kelas k ON s.kelas_id = k.id 
                 WHERE s.rfid_uid = ? AND s.status = 'aktif'`,
                [rfid_uid]
            );

            if (students.length === 0) {
                io.emit('lab_scan_info', {
                    message: 'Kartu tidak terdaftar',
                    type: 'error'
                });
                await connection.rollback();
                return res.status(404).json({ error: 'Siswa tidak ditemukan atau kartu tidak terdaftar' });
            }

            const student = students[0];

            // Ambil foto siswa
            const [fotoRows] = await connection.query(
                'SELECT file_path FROM siswa_dokumen WHERE siswa_id = ? AND kode_dokumen LIKE "%FOTO%" LIMIT 1',
                [student.id]
            );
            const foto = fotoRows.length > 0 ? fotoRows[0].file_path : null;

            // 2. Get item info
            const [items] = await connection.query('SELECT * FROM lab_inventaris WHERE id = ?', [inventaris_id]);
            if (items.length === 0) {
                await connection.rollback();
                return res.status(404).json({ error: 'Item inventaris tidak ditemukan' });
            }
            const item = items[0];

            // 3. Get settings & specific limits
            const [settingsRows] = await connection.query('SELECT * FROM lab_settings');
            const settings = {};
            settingsRows.forEach(r => { settings[r.key] = r.value });
            const globalMaxTotal = parseInt(settings['max_pinjam_per_siswa'] || '10'); // Default high for total
            const itemSpecificMax = item.max_pinjam_per_siswa || 1;

            // WIB time
            const rawNow = new Date();
            const formatter = new Intl.DateTimeFormat('en-US', {
                timeZone: 'Asia/Jakarta',
                year: 'numeric', month: '2-digit', day: '2-digit',
                hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
            });
            const parts = formatter.formatToParts(rawNow);
            const p = {};
            parts.forEach(part => p[part.type] = part.value);
            const today = `${p.year}-${p.month}-${p.day}`;
            const h = p.hour === '24' ? '00' : p.hour;
            const nowTime = `${h}:${p.minute}:${p.second}`;
            const nowDateTime = `${today} ${nowTime}`;
            const now = new Date(`${today}T${nowTime}+07:00`);

            // 4. Check existing active borrow for this unique physical item by this student
            const [existingLoan] = await connection.query(
                'SELECT * FROM lab_peminjaman WHERE inventaris_id = ? AND siswa_id = ? AND status = "dipinjam"',
                [inventaris_id, student.id]
            );

            let responseData;

            if (existingLoan.length > 0) {
                // ===== PENGEMBALIAN =====
                const loan = existingLoan[0];
                const batas = new Date(loan.batas_kembali);
                const isLate = now > batas;

                await connection.query(
                    `UPDATE lab_peminjaman SET tanggal_kembali = ?, status = ? WHERE id = ?`,
                    [nowDateTime, isLate ? 'terlambat' : 'dikembalikan', loan.id]
                );

                await connection.query(
                    'UPDATE lab_inventaris SET status = "tersedia" WHERE id = ?',
                    [inventaris_id]
                );

                responseData = {
                    type: 'kembali',
                    student: { id: student.id, nama: student.nama, nisn: student.nisn, kelas: student.kelas_nama, jk: student.jk, foto },
                    item: { id: item.id, kode: item.kode, nama: item.nama, merk: item.merk },
                    isLate,
                    time: nowTime,
                    message: isLate ? 'Pengembalian Terlambat!' : 'Pengembalian Berhasil'
                };

                // WA notification
                if (settings.wa_notification_enabled === 'true' && settings.wa_template_kembali) {
                    InventoryController._sendWaNotification(student, item, settings.wa_template_kembali, nowTime, null);
                }

            } else {
                // ===== PEMINJAMAN =====
                if (item.status !== 'tersedia') {
                    io.emit('lab_scan_info', {
                        student: { nama: student.nama, kelas: student.kelas_nama },
                        message: 'Item sedang tidak tersedia',
                        type: 'warning'
                    });
                    await connection.rollback();
                    return res.status(400).json({ error: 'Item sedang tidak tersedia' });
                }

                // A. Check GLOBAL limit (total items borrowed)
                const [totalActive] = await connection.query(
                    'SELECT COUNT(*) as count FROM lab_peminjaman WHERE siswa_id = ? AND status = "dipinjam"',
                    [student.id]
                );

                if (totalActive[0].count >= globalMaxTotal) {
                    io.emit('lab_scan_info', {
                        student: { nama: student.nama, kelas: student.kelas_nama },
                        message: `Batas total peminjaman tercapai (maks ${globalMaxTotal} item)`,
                        type: 'warning'
                    });
                    await connection.rollback();
                    return res.status(400).json({ error: `Siswa sudah mencapai batas total peminjaman (${globalMaxTotal} item)` });
                }

                // B. Check ITEM SPECIFIC limit (items of same name/model)
                const [sameItemActive] = await connection.query(
                    `SELECT COUNT(*) as count FROM lab_peminjaman lp 
                     JOIN lab_inventaris li ON lp.inventaris_id = li.id 
                     WHERE lp.siswa_id = ? AND lp.status = "dipinjam" AND li.nama = ?`,
                    [student.id, item.nama]
                );

                if (sameItemActive[0].count >= itemSpecificMax) {
                    io.emit('lab_scan_info', {
                        student: { nama: student.nama, kelas: student.kelas_nama },
                        message: `Batas pinjam ${item.nama} tercapai (maks ${itemSpecificMax})`,
                        type: 'warning'
                    });
                    await connection.rollback();
                    return res.status(400).json({ error: `Siswa sudah mencapai batas untuk item ini (${itemSpecificMax} unit)` });
                }

                let batasKembali;
                if (item.durasi_tipe === 'jam_pelajaran') {
                    // 1. Get current schedule
                    const [schedule] = await connection.query(
                        'SELECT * FROM jam_pelajaran WHERE ? BETWEEN jam_mulai AND jam_selesai AND tipe = "Pelajaran" LIMIT 1',
                        [nowTime]
                    );

                    if (schedule.length > 0) {
                        const currentJamKe = schedule[0].jam_ke;
                        const targetJamKe = currentJamKe + (item.durasi_pinjam || 1) - 1; // -1 because current hour is included

                        // 2. Find target schedule
                        const [targetSchedule] = await connection.query(
                            'SELECT jam_selesai FROM jam_pelajaran WHERE jam_ke = ? LIMIT 1',
                            [targetJamKe]
                        );

                        if (targetSchedule.length > 0) {
                            batasKembali = new Date(`${today}T${targetSchedule[0].jam_selesai}+07:00`);
                        } else {
                            // If target hour exceeds schedule, use the end of the last session
                            const [lastSchedule] = await connection.query(
                                'SELECT jam_selesai FROM jam_pelajaran ORDER BY jam_ke DESC LIMIT 1'
                            );
                            batasKembali = new Date(`${today}T${lastSchedule[0].jam_selesai}+07:00`);
                        }
                    } else {
                        // Not in class hours, default to end of school day or 1 day
                        const [lastSchedule] = await connection.query(
                            'SELECT jam_selesai FROM jam_pelajaran ORDER BY jam_ke DESC LIMIT 1'
                        );
                        if (lastSchedule.length > 0 && nowTime < lastSchedule[0].jam_selesai) {
                            batasKembali = new Date(`${today}T${lastSchedule[0].jam_selesai}+07:00`);
                        } else {
                            const bHari = parseInt(settings['batas_pinjam_hari'] || '1');
                            batasKembali = new Date(now.getTime() + bHari * 24 * 60 * 60 * 1000);
                        }
                    }
                } else if (item.durasi_tipe === 'akhir_hari') {
                    // Return at the end of the last school hour today
                    const [lastSchedule] = await connection.query(
                        'SELECT jam_selesai FROM jam_pelajaran ORDER BY jam_ke DESC LIMIT 1'
                    );
                    if (lastSchedule.length > 0) {
                        batasKembali = new Date(`${today}T${lastSchedule[0].jam_selesai}+07:00`);
                        // If it's already past the last hour, default to next day or global setting
                        if (now > batasKembali) {
                            const bHari = parseInt(settings['batas_pinjam_hari'] || '1');
                            batasKembali = new Date(now.getTime() + bHari * 24 * 60 * 60 * 1000);
                        }
                    } else {
                        const bHari = parseInt(settings['batas_pinjam_hari'] || '1');
                        batasKembali = new Date(now.getTime() + bHari * 24 * 60 * 60 * 1000);
                    }
                } else {
                    const bHari = item.durasi_pinjam || parseInt(settings['batas_pinjam_hari'] || '1');
                    batasKembali = new Date(now.getTime() + bHari * 24 * 60 * 60 * 1000);
                }

                const formatDT = (d) => {
                    const pad = (n) => String(n).padStart(2, '0');
                    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
                };
                const batasStr = formatDT(batasKembali);

                await connection.query(
                    `INSERT INTO lab_peminjaman (inventaris_id, siswa_id, tanggal_pinjam, batas_kembali, kondisi_pinjam)
                     VALUES (?, ?, ?, ?, ?)`,
                    [inventaris_id, student.id, nowDateTime, batasStr, item.kondisi]
                );

                await connection.query(
                    'UPDATE lab_inventaris SET status = "dipinjam" WHERE id = ?',
                    [inventaris_id]
                );

                // Get updated availability for display
                const [availability] = await connection.query(
                    'SELECT COUNT(*) as total, SUM(CASE WHEN status = "tersedia" THEN 1 ELSE 0 END) as sisa FROM lab_inventaris WHERE nama = ?',
                    [item.nama]
                );

                responseData = {
                    type: 'pinjam',
                    student: { id: student.id, nama: student.nama, nisn: student.nisn, kelas: student.kelas_nama, jk: student.jk, foto },
                    item: { id: item.id, kode: item.kode, nama: item.nama, merk: item.merk },
                    batasKembali: batasStr,
                    time: nowTime,
                    stock: availability[0],
                    message: `Peminjaman Berhasil (Sisa ${availability[0].sisa}/${availability[0].total})`
                };

                // WA notification
                if (settings.wa_notification_enabled === 'true' && settings.wa_template_pinjam) {
                    InventoryController._sendWaNotification(student, item, settings.wa_template_pinjam, nowTime, batasStr);
                }
            }

            await connection.commit();
            io.emit('lab_scan_success', responseData);
            res.json({ success: true, ...responseData });

        } catch (err) {
            await connection.rollback();
            console.error('[Lab Scan Error]', err);
            io.emit('lab_scan_info', { message: 'Terjadi kesalahan sistem', type: 'error' });
            res.status(500).json({ error: 'Terjadi kesalahan pada server' });
        } finally {
            connection.release();
        }
    }

    // ===================== WA HELPER =====================

    static async _sendWaNotification(student, item, template, waktu, batas) {
        try {
            const message = template
                .replace(/\[nama\]/g, student.nama)
                .replace(/\[item\]/g, item.nama)
                .replace(/\[kode\]/g, item.kode)
                .replace(/\[waktu\]/g, waktu)
                .replace(/\[batas\]/g, batas || '-');

            const [ortuRows] = await pool.query(
                'SELECT hp FROM siswa_orangtua WHERE siswa_id = ? AND hp IS NOT NULL AND hp != ""',
                [student.id]
            );
            const phoneTargets = [];
            ortuRows.forEach(o => phoneTargets.push(o.hp));

            const uniquePhones = [...new Set(phoneTargets)];
            for (const phone of uniquePhones) {
                waService.sendMessage(phone, message).catch(err =>
                    console.error('[Lab WA] Gagal kirim notifikasi:', err.message)
                );
            }
        } catch (err) {
            console.error('[Lab WA Error]', err.message);
        }
    }

    // ===================== KIOSK HELPERS =====================
    
    static async getStudentActiveLoansByRfid(req, res) {
        try {
            const { rfid } = req.params;
            const rfidTrimmed = (rfid || '').trim();
            const [rows] = await pool.query(`
                SELECT lp.*, 
                    li.id as inventaris_id, li.kode as inventaris_kode, li.nama as inventaris_nama, li.merk as inventaris_merk,
                    lk.nama as kategori_nama, lk.icon as kategori_icon,
                    s.nama as student_nama
                FROM lab_peminjaman lp
                JOIN lab_inventaris li ON lp.inventaris_id = li.id
                LEFT JOIN lab_kategori lk ON li.kategori_id = lk.id
                JOIN siswa s ON lp.siswa_id = s.id
                WHERE s.rfid_uid = ? AND lp.status = 'dipinjam'
                ORDER BY lp.created_at DESC
            `, [rfidTrimmed]);

            if (rows.length === 0) {
                // Also check if student exists at all
                const [student] = await pool.query('SELECT nama FROM siswa WHERE rfid_uid = ?', [rfidTrimmed]);

                if (student.length === 0) return res.status(404).json({ error: 'Kartu tidak terdaftar' });
                return res.json({ student: student[0].nama, loans: [] });
            }

            res.json({ student: rows[0].student_nama, loans: rows });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

    // ===================== STUDENT PORTAL =====================

    static async getStudentPeminjaman(req, res) {
        try {
            const studentId = req.studentId;
            const [rows] = await pool.query(`
                SELECT lp.*, 
                    li.kode as inventaris_kode, li.nama as inventaris_nama, li.merk as inventaris_merk,
                    lk.nama as kategori_nama, lk.icon as kategori_icon
                FROM lab_peminjaman lp
                JOIN lab_inventaris li ON lp.inventaris_id = li.id
                LEFT JOIN lab_kategori lk ON li.kategori_id = lk.id
                WHERE lp.siswa_id = ?
                ORDER BY lp.created_at DESC
                LIMIT 50
            `, [studentId]);
            res.json(rows);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }
}

module.exports = InventoryController;
