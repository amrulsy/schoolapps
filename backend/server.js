const express = require('express');
const cors = require('cors');
const path = require('path');
const pool = require('./db');
require('dotenv').config();

// Routes
const publicPortalRoutes = require('./routes/public/portal');
const adminCmsRoutes = require('./routes/admin/cms');
const adminBackupRoutes = require('./routes/admin/backup');

// Middleware
const { authMiddleware } = require('./middleware/auth');
const { rateLimiter } = require('./middleware/rateLimiter');

const app = express();
app.use(cors());
app.use(express.json());

// Serve uploaded media files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// --- PUBLIC PORTAL ROUTES (no auth, rate-limited) ---
app.use('/api/public', rateLimiter(60, 60000), publicPortalRoutes);

// --- ADMIN CMS ROUTES (auth required) ---
app.use('/api/admin/cms', authMiddleware, adminCmsRoutes);
app.use('/api/admin/backup', authMiddleware, adminBackupRoutes);

// --- MASTER DATA ROUTES ---

// Units
app.get('/api/units', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM units');
        res.json(rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/units', async (req, res) => {
    try {
        const [result] = await pool.query('INSERT INTO units (nama) VALUES (?)', [req.body.nama]);
        res.status(201).json({ id: result.insertId, nama: req.body.nama });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/units/:id', async (req, res) => {
    try {
        await pool.query('UPDATE units SET nama = ? WHERE id = ?', [req.body.nama, req.params.id]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/units/:id', async (req, res) => {
    try {
        // Cek apakah ada kelas di unit ini
        const [kelas] = await pool.query('SELECT id FROM kelas WHERE unit_id = ?', [req.params.id]);
        if (kelas.length > 0) {
            return res.status(400).json({ error: 'Tidak dapat menghapus Unit yang masih memiliki Kelas.' });
        }
        await pool.query('DELETE FROM units WHERE id = ?', [req.params.id]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// Kelas
app.get('/api/kelas', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM kelas');
        res.json(rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/kelas', async (req, res) => {
    try {
        const { unit_id, nama } = req.body;
        const [result] = await pool.query('INSERT INTO kelas (unit_id, nama) VALUES (?, ?)', [unit_id, nama]);
        res.status(201).json({ id: result.insertId, unit_id, nama });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/kelas/:id', async (req, res) => {
    try {
        await pool.query('UPDATE kelas SET nama = ? WHERE id = ?', [req.body.nama, req.params.id]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/kelas/:id', async (req, res) => {
    try {
        // Cek apakah ada siswa di kelas ini
        const [siswa] = await pool.query('SELECT id FROM siswa WHERE kelas_id = ?', [req.params.id]);
        if (siswa.length > 0) {
            return res.status(400).json({ error: 'Tidak dapat menghapus Kelas yang masih memiliki Siswa terdaftar.' });
        }
        await pool.query('DELETE FROM kelas WHERE id = ?', [req.params.id]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// Tahun Ajaran
app.get('/api/tahun-ajaran', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM tahun_ajaran ORDER BY tahun DESC');
        res.json(rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/tahun-ajaran', async (req, res) => {
    try {
        const { tahun } = req.body;
        const [result] = await pool.query('INSERT INTO tahun_ajaran (tahun, status) VALUES (?, "nonaktif")', [tahun]);
        res.status(201).json({ id: result.insertId, tahun, status: 'nonaktif' });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/tahun-ajaran/:id/status', async (req, res) => {
    try {
        await pool.query('UPDATE tahun_ajaran SET status = "nonaktif"');
        await pool.query('UPDATE tahun_ajaran SET status = "aktif" WHERE id = ?', [req.params.id]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/tahun-ajaran/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM tahun_ajaran WHERE id = ?', [req.params.id]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// Kategori Tagihan
app.get('/api/categories', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM kategori_tagihan');
        res.json(rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/categories', async (req, res) => {
    try {
        const { kode, nama, nominal, tipe, keterangan } = req.body;
        const [result] = await pool.query(
            'INSERT INTO kategori_tagihan (kode, nama, nominal, tipe, keterangan) VALUES (?, ?, ?, ?, ?)',
            [kode, nama, nominal, tipe, keterangan]
        );
        res.status(201).json({ id: result.insertId, ...req.body });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/categories/:id', async (req, res) => {
    try {
        const { kode, nama, nominal, tipe, keterangan } = req.body;
        await pool.query(
            'UPDATE kategori_tagihan SET kode = ?, nama = ?, nominal = ?, tipe = ?, keterangan = ? WHERE id = ?',
            [kode, nama, nominal, tipe, keterangan, req.params.id]
        );
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/categories/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM kategori_tagihan WHERE id = ?', [req.params.id]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- SISWA ROUTES ---

app.get('/api/siswa', async (req, res) => {
    try {
        // Gabungkan dengan nama kelas
        const [rows] = await pool.query(`
            SELECT s.*, k.nama as kelas_nama 
            FROM siswa s 
            LEFT JOIN kelas k ON s.kelas_id = k.id
        `);
        res.json(rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/siswa/:id', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM siswa WHERE id = ?', [req.params.id]);
        if (rows.length === 0) return res.status(404).json({ error: 'Siswa tidak ditemukan' });

        const siswa = rows[0];

        // Ambil Orang Tua
        const [ortu] = await pool.query('SELECT * FROM siswa_orangtua WHERE siswa_id = ?', [siswa.id]);
        siswa.ayah = ortu.find(o => o.jenis === 'ayah') || {};
        siswa.ibu = ortu.find(o => o.jenis === 'ibu') || {};
        siswa.wali_detail = ortu.find(o => o.jenis === 'wali') || {};

        // Ambil Dokumen
        const [dok] = await pool.query('SELECT * FROM siswa_dokumen WHERE siswa_id = ?', [siswa.id]);
        siswa.dokumen = dok;

        res.json(siswa);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/siswa', async (req, res) => {
    try {
        const {
            nisn, nama, jk, status, tempatLahir, tglLahir, telp, alamat, wali, kelasId
        } = req.body;

        const [result] = await pool.query(`
            INSERT INTO siswa 
            (nisn, nama, jk, status, tempat_lahir, tgl_lahir, telp, alamat, wali, kelas_id) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [nisn, nama, jk, status || 'aktif', tempatLahir, tglLahir || null, telp, alamat, wali, kelasId]);

        res.status(201).json({ id: result.insertId });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/siswa/:id', async (req, res) => {
    console.log(`[BACKEND] PUT /api/siswa/${req.params.id} payload:`, JSON.stringify(req.body, null, 2));
    try {
        const {
            nisn, nama, jk, status, tempatLahir, tglLahir, telp, alamat, wali, kelasId,
            ayah, ibu, wali_detail
        } = req.body;

        // 1. Update Siswa Dasar
        await pool.query(`
            UPDATE siswa SET 
                nisn = ?, nama = ?, jk = ?, status = ?, 
                tempat_lahir = ?, tgl_lahir = ?, telp = ?, 
                alamat = ?, wali = ?, kelas_id = ?
            WHERE id = ?
        `, [nisn, nama, jk, status, tempatLahir, tglLahir || null, telp, alamat, wali, kelasId, req.params.id]);

        // 2. Update/Insert Orang Tua (Ayah, Ibu, Wali)
        const updateParent = async (jenis, p) => {
            if (!p || !p.nama) return;
            console.log(`[BACKEND] Updating Parent: ${jenis}`, p);
            const fields = ['nama', 'nik', 'pendidikan', 'pekerjaan', 'penghasilan', 'hp', 'status_hidup', 'hubungan', 'alamat'];
            const vals = fields.map(f => p[f] || null);
            await pool.query(`
                INSERT INTO siswa_orangtua (siswa_id, jenis, nama, nik, pendidikan, pekerjaan, penghasilan, hp, status_hidup, hubungan, alamat)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE 
                nama=VALUES(nama), nik=VALUES(nik), pendidikan=VALUES(pendidikan),
                pekerjaan=VALUES(pekerjaan), penghasilan=VALUES(penghasilan),
                hp=VALUES(hp), status_hidup=VALUES(status_hidup),
                hubungan=VALUES(hubungan), alamat=VALUES(alamat)
            `, [req.params.id, jenis, ...vals]);
        };

        if (ayah) await updateParent('ayah', ayah);
        if (ibu) await updateParent('ibu', ibu);
        if (wali_detail) await updateParent('wali', wali_detail);

        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/siswa/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM siswa WHERE id = ?', [req.params.id]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- TAGIHAN ROUTES ---

app.get('/api/tagihan', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT t.*, s.nama as siswa_nama, 
                   COALESCE(k_hist.nama, k_curr.nama) as kelas_nama, 
                   kt.nama as kategori_nama, ta.tahun as tahun_ajaran
            FROM tagihan t
            JOIN siswa s ON t.siswa_id = s.id
            LEFT JOIN kelas k_hist ON t.kelas_id = k_hist.id
            LEFT JOIN kelas k_curr ON s.kelas_id = k_curr.id
            JOIN kategori_tagihan kt ON t.kategori_id = kt.id
            LEFT JOIN tahun_ajaran ta ON t.tahun_ajaran_id = ta.id
        `);
        res.json(rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/tagihan', async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        const { tagihanList, logData } = req.body;
        if (!tagihanList || !Array.isArray(tagihanList)) {
            return res.status(400).json({ error: 'Data tagihan tidak valid' });
        }

        // 1. Create Log Entry
        let logId = null;
        if (logData) {
            const [logResult] = await connection.query(`
                INSERT INTO log_generate (tipe, keterangan, jumlah_tagihan, operator)
                VALUES (?, ?, ?, ?)
            `, [logData.tipe, logData.keterangan, tagihanList.length, logData.operator]);
            logId = logResult.insertId;
        }

        // 2. Insert Bills
        const values = tagihanList.map(t => [
            t.siswa_id, t.kategori_id, t.tahun_ajaran_id, t.bulan, t.tahun,
            t.nominal_asli, t.nominal, t.status || 'belum', t.kelas_id || null, logId
        ]);

        const [result] = await connection.query(`
            INSERT INTO tagihan 
            (siswa_id, kategori_id, tahun_ajaran_id, bulan, tahun, nominal_asli, nominal, status, kelas_id, log_generate_id) 
            VALUES ?
        `, [values]);

        await connection.commit();
        res.status(201).json({ success: true, count: result.affectedRows, logId });
    } catch (err) {
        await connection.rollback();
        res.status(500).json({ error: err.message });
    } finally {
        connection.release();
    }
});

app.get('/api/log-generate', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM log_generate ORDER BY created_at DESC');
        res.json(rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/log-generate/:id', async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        // Cek apakah ada yang sudah dibayar
        const [paidCount] = await connection.query('SELECT COUNT(*) as count FROM tagihan WHERE log_generate_id = ? AND status = "lunas"', [req.params.id]);
        if (paidCount[0].count > 0) {
            return res.status(400).json({ error: 'Tidak bisa roolback, beberapa tagihan sudah dibayar.' });
        }

        // Hapus tagihan
        await connection.query('DELETE FROM tagihan WHERE log_generate_id = ?', [req.params.id]);
        // Hapus log
        await connection.query('DELETE FROM log_generate WHERE id = ?', [req.params.id]);

        await connection.commit();
        res.json({ success: true });
    } catch (err) {
        await connection.rollback();
        res.status(500).json({ error: err.message });
    } finally {
        connection.release();
    }
});

app.delete('/api/tagihan/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM tagihan WHERE id = ?', [req.params.id]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- TRANSAKSI & PEMBAYARAN ROUTES ---

app.get('/api/transactions', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT t.*, s.nama as siswa_nama
            FROM transaksi t
            JOIN siswa s ON t.siswa_id = s.id
            ORDER BY t.tanggal DESC
        `);
        res.json(rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/transactions/:id', async (req, res) => {
    try {
        const [txRows] = await pool.query(`
            SELECT t.*, s.nama as siswa_nama, s.nisn as siswa_nisn, k.nama as kelas_nama
            FROM transaksi t
            JOIN siswa s ON t.siswa_id = s.id
            LEFT JOIN kelas k ON s.kelas_id = k.id
            WHERE t.id = ?
        `, [req.params.id]);

        if (txRows.length === 0) return res.status(404).json({ error: 'Transaksi tidak ditemukan' });

        const tx = txRows[0];

        // Ambil Item Tagihan
        const [billRows] = await pool.query(`
            SELECT t.*, kt.nama as kategori, ta.tahun as tahunAjaran
            FROM tagihan t
            JOIN kategori_tagihan kt ON t.kategori_id = kt.id
            LEFT JOIN tahun_ajaran ta ON t.tahun_ajaran_id = ta.id
            WHERE t.transaksi_id = ?
        `, [req.params.id]);

        tx.items = billRows;

        // Map field names to match frontend expectations if necessary
        tx.invoiceNo = tx.invoice_no;
        tx.amountPaid = tx.amount_paid;
        tx.change = tx.change_amount;
        tx.student = {
            nama: tx.siswa_nama,
            nisn: tx.siswa_nisn,
            kelas: tx.kelas_nama
        };

        res.json(tx);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/transactions/:id/void', async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        const [txRows] = await connection.query('SELECT invoice_no FROM transaksi WHERE id = ?', [req.params.id]);
        if (txRows.length === 0) throw new Error('Transaksi tidak ditemukan');
        const invoiceNo = txRows[0].invoice_no;

        // 1. Update Status Transaksi
        await connection.query('UPDATE transaksi SET status = "void" WHERE id = ?', [req.params.id]);

        // 2. Hapus Cashflow Terkait
        await connection.query('DELETE FROM cashflow WHERE ref = ?', [invoiceNo]);

        // Note: Reverting tagihan is complex without a strong link. 
        // In a real system, you'd have a link or a reversal record.

        await connection.commit();
        res.json({ success: true });
    } catch (err) {
        await connection.rollback();
        res.status(500).json({ error: err.message });
    } finally {
        connection.release();
    }
});

app.post('/api/pembayaran', async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        const { siswaId, selectedBillIds, amountPaid, total, change, partialPayMap, kasir } = req.body;
        const now = new Date().toISOString().slice(0, 10);
        const invoiceNo = `INV-${now.replace(/-/g, '')}-${String(Date.now()).slice(-4)}`;

        // 1. Simpan Transaksi Utama
        const [txResult] = await connection.query(`
            INSERT INTO transaksi (invoice_no, tanggal, siswa_id, user_id, total, amount_paid, change_amount, status)
            VALUES (?, NOW(), ?, NULL, ?, ?, ?, 'success')
        `, [invoiceNo, siswaId, total, amountPaid, change]);

        const txnId = txResult.insertId;

        // 2. Update Tagihan & Handle Partial
        for (const billId of selectedBillIds) {
            const [billRows] = await connection.query('SELECT * FROM tagihan WHERE id = ?', [billId]);
            if (billRows.length === 0) continue;
            const b = billRows[0];
            let payAmount = Number(partialPayMap[billId] ?? b.nominal);
            if (payAmount > b.nominal) payAmount = b.nominal;

            if (payAmount < b.nominal && payAmount > 0) {
                // Partial: Lunas untuk bagian ini, buat tagihan baru untuk sisanya
                await connection.query('UPDATE tagihan SET nominal = ?, status = "lunas", paid_at = CURDATE(), transaksi_id = ? WHERE id = ?', [payAmount, txnId, billId]);
                await connection.query(`
                    INSERT INTO tagihan (siswa_id, kategori_id, tahun_ajaran_id, bulan, tahun, nominal_asli, nominal, is_diskon, diskon_notes, status, kelas_id, log_generate_id)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'belum', ?, ?)
                `, [b.siswa_id, b.kategori_id, b.tahun_ajaran_id, b.bulan, b.tahun, b.nominal_asli, b.nominal - payAmount, b.is_diskon, b.diskon_notes, b.kelas_id, b.log_generate_id]);
            } else {
                // Full pay
                await connection.query('UPDATE tagihan SET status = "lunas", paid_at = CURDATE(), transaksi_id = ? WHERE id = ?', [txnId, billId]);
            }
        }

        // 3. Catat di Cashflow
        await connection.query(`
            INSERT INTO cashflow (tanggal, keterangan, nominal, tipe, ref)
            VALUES (NOW(), ?, ?, 'masuk', ?)
        `, [`Pembayaran SPP - ${invoiceNo}`, total, invoiceNo]);

        await connection.commit();
        res.json({ success: true, invoiceNo, id: txnId });
    } catch (err) {
        await connection.rollback();
        res.status(500).json({ error: err.message });
    } finally {
        connection.release();
    }
});

// --- CASHFLOW ROUTES ---
app.get('/api/cashflow', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM cashflow ORDER BY tanggal DESC');
        res.json(rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/cashflow', async (req, res) => {
    try {
        const { keterangan, nominal, tipe, tanggal, ref } = req.body;
        const [result] = await pool.query(
            'INSERT INTO cashflow (tanggal, keterangan, nominal, tipe, ref) VALUES (?, ?, ?, ?, ?)',
            [tanggal || new Date(), keterangan, nominal, tipe || 'keluar', ref || null]
        );
        res.status(201).json({ id: result.insertId, ...req.body });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- USERS ROUTES ---
app.get('/api/users', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT id, nama, username, role FROM users');
        res.json(rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- AUTH ROUTES ---

app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    // Dummy authentication for demo
    if (username === 'admin' && password === 'admin') {
        res.json({ id: 1, nama: 'Pak Ahmad', role: 'admin', token: 'dummy-token' });
    } else {
        res.status(401).json({ error: 'Kredensial salah' });
    }
});

// --- PING ---
app.get('/api/ping', async (req, res) => {
    try {
        await pool.query('SELECT 1');
        res.json({ status: 'Connected to TiDB successfully!' });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/tagihan/discount', async (req, res) => {
    try {
        const { billIds, type, value } = req.body;
        if (!billIds || !Array.isArray(billIds)) return res.status(400).json({ error: 'Invalid bill IDs' });

        for (const id of billIds) {
            // Get current bill to calculate discount
            const [rows] = await pool.query('SELECT nominal, nominal_asli FROM tagihan WHERE id = ?', [id]);
            if (rows.length > 0) {
                const b = rows[0];
                const base = Number(b.nominal_asli || b.nominal);
                let finalNominal = type === 'Persentase' ? base - (base * (value / 100)) : Math.max(0, base - value);

                await pool.query(
                    'UPDATE tagihan SET nominal = ?, is_diskon = ? WHERE id = ? AND status != "lunas"',
                    [finalNominal, finalNominal < base, id]
                );
            }
        }
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`✅ Server SIAS berjalan di http://localhost:${PORT}`);
});
