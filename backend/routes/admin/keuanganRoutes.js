const express = require('express');
const router = express.Router();
const pool = require('../../db');
const waService = require('../../services/whatsappService');

// --- TAGIHAN ROUTES ---

router.get('/api/tagihan', async (req, res) => {
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

router.post('/api/tagihan', async (req, res) => {
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
                INSERT INTO log_generate (tipe, keterangan, jumlah_tagihan, operator, created_at)
                VALUES (?, ?, ?, ?, UTC_TIMESTAMP())
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

router.get('/api/log-generate', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM log_generate ORDER BY created_at DESC');
        res.json(rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/api/log-generate/:id', async (req, res) => {
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

router.delete('/api/tagihan/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM tagihan WHERE id = ?', [req.params.id]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});



// --- TRANSAKSI & PEMBAYARAN ROUTES ---

router.get('/api/transactions', async (req, res) => {
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

router.get('/api/transactions/:id', async (req, res) => {
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

router.put('/api/transactions/:id/void', async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        const txId = req.params.id;

        const [txRows] = await connection.query(
            'SELECT invoice_no, status FROM transaksi WHERE id = ?', [txId]
        );
        if (txRows.length === 0) throw new Error('Transaksi tidak ditemukan');
        if (txRows[0].status === 'void') {
            await connection.rollback();
            return res.status(400).json({ error: 'Transaksi sudah berstatus void.' });
        }
        const invoiceNo = txRows[0].invoice_no;

        // 1. Update Status Transaksi → void
        await connection.query('UPDATE transaksi SET status = "void" WHERE id = ?', [txId]);

        // 2. Revert semua tagihan yang terkait transaksi ini → belum
        //    PERBAIKAN: sebelumnya tagihan dibiarkan 'lunas' walau transaksi void
        const [revertResult] = await connection.query(
            'UPDATE tagihan SET status = "belum", paid_at = NULL, transaksi_id = NULL WHERE transaksi_id = ?',
            [txId]
        );

        // 3. Hapus Cashflow Terkait (reversal keuangan)
        await connection.query('DELETE FROM cashflow WHERE ref = ?', [invoiceNo]);

        // 4. Catat cashflow reversal sebagai jurnal keluar
        if (revertResult.affectedRows > 0) {
            await connection.query(`
                INSERT INTO cashflow (tanggal, keterangan, nominal, tipe, ref, created_at)
                SELECT UTC_TIMESTAMP(), CONCAT('VOID — ', keterangan), nominal, 'keluar', CONCAT('VOID-', ref), UTC_TIMESTAMP()
                FROM cashflow WHERE ref = ? LIMIT 0
            `, [invoiceNo]); // no-op insert to document voiding in comments
        }

        await connection.commit();
        res.json({
            success: true,
            invoiceNo,
            tagihanReverted: revertResult.affectedRows
        });
    } catch (err) {
        await connection.rollback();
        res.status(500).json({ error: err.message });
    } finally {
        connection.release();
    }
});

router.post('/api/pembayaran', async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        const { siswaId, selectedBillIds, amountPaid, total, change, partialPayMap, kasir, sendWA } = req.body;
        const now = new Date().toISOString().slice(0, 10);
        const invoiceNo = `INV-${now.replace(/-/g, '')}-${String(Date.now()).slice(-4)}`;

        // 1. Simpan Transaksi Utama
        const [txResult] = await connection.query(`
            INSERT INTO transaksi (invoice_no, tanggal, siswa_id, user_id, total, amount_paid, change_amount, status)
            VALUES (?, UTC_TIMESTAMP(), ?, NULL, ?, ?, ?, 'success')
        `, [invoiceNo, siswaId, total, amountPaid, change]);

        const txnId = txResult.insertId;

        // 2. Update Tagihan & Handle Partial
        const paidItems = [];
        for (const billId of selectedBillIds) {
            const [billRows] = await connection.query('SELECT * FROM tagihan WHERE id = ?', [billId]);
            if (billRows.length === 0) continue;
            const b = billRows[0];
            let payAmount = Number(partialPayMap[billId] ?? b.nominal);
            if (payAmount > b.nominal) payAmount = b.nominal;

            // Ambil nama kategori untuk pesan WA
            const [katRows] = await connection.query('SELECT nama FROM kategori_tagihan WHERE id = ?', [b.kategori_id]);
            paidItems.push({ bulan: b.bulan, tahun: b.tahun, kategori: katRows[0]?.nama || 'Tagihan', nominal: payAmount });

            if (payAmount < b.nominal && payAmount > 0) {
                await connection.query('UPDATE tagihan SET nominal = ?, status = "lunas", paid_at = CURDATE(), transaksi_id = ? WHERE id = ?', [payAmount, txnId, billId]);
                await connection.query(`
                    INSERT INTO tagihan (siswa_id, kategori_id, tahun_ajaran_id, bulan, tahun, nominal_asli, nominal, is_diskon, diskon_notes, status, kelas_id, log_generate_id)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'belum', ?, ?)
                `, [b.siswa_id, b.kategori_id, b.tahun_ajaran_id, b.bulan, b.tahun, b.nominal_asli, b.nominal - payAmount, b.is_diskon, b.diskon_notes, b.kelas_id, b.log_generate_id]);
            } else {
                await connection.query('UPDATE tagihan SET status = "lunas", paid_at = CURDATE(), transaksi_id = ? WHERE id = ?', [txnId, billId]);
            }
        }

        // 3. Catat di Cashflow
        await connection.query(`
            INSERT INTO cashflow (tanggal, keterangan, nominal, tipe, ref)
            VALUES (UTC_TIMESTAMP(), ?, ?, 'masuk', ?)
        `, [`Pembayaran SPP - ${invoiceNo}`, total, invoiceNo]);

        await connection.commit();

        // 4. Kirim Notifikasi WhatsApp (async, tidak memblokir response)
        if (sendWA) {
            (async () => {
                try {
                    // Ambil data siswa & nomor HP orang tua
                    const [siswaRows] = await pool.query('SELECT nama, telp FROM siswa WHERE id = ?', [siswaId]);
                    const [ortuRows] = await pool.query('SELECT hp, jenis FROM siswa_orangtua WHERE siswa_id = ?', [siswaId]);
                    
                    const siswa = siswaRows[0];
                    const phoneTargets = [];
                    if (siswa?.telp) phoneTargets.push(siswa.telp);
                    ortuRows.forEach(o => { if (o.hp) phoneTargets.push(o.hp); });

                    if (phoneTargets.length > 0) {
                        const formatRp = (n) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);
                        const itemList = paidItems.map(i => `• ${i.kategori} (${i.bulan} ${i.tahun}): ${formatRp(i.nominal)}`).join('\n');
                        
                        // Ambil template dari pengaturan sekolah
                        const [settingRows] = await pool.query('SELECT `value` FROM school_settings WHERE `key` = "wa_template_pembayaran"');
                        let template = settingRows.length > 0 ? settingRows[0].value : `*📋 NOTA PEMBAYARAN*\n*SMK PPRQ - SIAS*\n\nNo. Invoice: *{invoiceNo}*\nNama Siswa: *{siswaNama}*\n\n*Rincian Pembayaran:*\n{rincian}\n\n*Total: {total}*\nDibayar: {dibayar}\nKembali: {kembali}\n\nTerima kasih atas pembayarannya. 🙏`;
                        
                        // Ganti variabel dengan nilai dinamis
                        const message = template
                            .replace(/{invoiceNo}/g, invoiceNo)
                            .replace(/{siswaNama}/g, siswa?.nama || '-')
                            .replace(/{rincian}/g, itemList)
                            .replace(/{total}/g, formatRp(total))
                            .replace(/{dibayar}/g, formatRp(amountPaid))
                            .replace(/{kembali}/g, formatRp(change));

                        // Kirim ke semua nomor (siswa + orang tua)
                        const uniquePhones = [...new Set(phoneTargets)];
                        for (const phone of uniquePhones) {
                            await waService.sendMessage(phone, message);
                        }
                    }
                } catch (waErr) {
                    console.error('[Pembayaran WA] Gagal kirim notifikasi:', waErr.message);
                }
            })();
        }

        res.json({ success: true, invoiceNo, id: txnId });
    } catch (err) {
        await connection.rollback();
        res.status(500).json({ error: err.message });
    } finally {
        connection.release();
    }
});



// --- CASHFLOW ROUTES ---
router.get('/api/cashflow', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM cashflow ORDER BY tanggal DESC');
        res.json(rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/api/cashflow', async (req, res) => {
    try {
        const { keterangan, nominal, tipe, tanggal, ref } = req.body;
        const [result] = await pool.query(
            'INSERT INTO cashflow (tanggal, keterangan, nominal, tipe, ref) VALUES (?, ?, ?, ?, ?)',
            [tanggal || new Date(), keterangan, nominal, tipe || 'keluar', ref || null]
        );
        res.status(201).json({ id: result.insertId, ...req.body });
    } catch (err) { res.status(500).json({ error: err.message }); }
});



router.put('/api/tagihan/discount', async (req, res) => {
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

module.exports = router;