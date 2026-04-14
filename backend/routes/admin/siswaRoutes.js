const express = require('express');
const router = express.Router();
const pool = require('../../db');
const multer = require('multer');
const xlsx = require('xlsx');
const fs = require('fs');

const uploadTemp = multer({ dest: 'temp_uploads/' });

router.get('/', async (req, res) => {
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

router.get('/:id', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM siswa WHERE id = ?', [req.params.id]);
        if (rows.length === 0) return res.status(404).json({ error: 'Siswa tidak ditemukan' });

        const siswa = rows[0];

        // Ambil Orang Tua
        const [ortu] = await pool.query('SELECT * FROM siswa_orangtua WHERE siswa_id = ?', [siswa.id]);
        siswa.ayah = ortu.find(o => o.jenis === 'ayah') || {};
        siswa.ibu = ortu.find(o => o.jenis === 'ibu') || {};
        siswa.wali_detail = ortu.find(o => o.jenis === 'wali') || {};

        // Ambil Dokumen (merge dengan master_dokumen)
        const [dok] = await pool.query(`
            SELECT m.kode as kode_dokumen, m.nama as nama_dokumen, m.is_required, 
                   COALESCE(sd.status, 'Tidak Ada') as status, sd.file_size, sd.file_path, sd.id as siswa_dok_id
            FROM master_dokumen m
            LEFT JOIN siswa_dokumen sd ON m.kode = sd.kode_dokumen AND sd.siswa_id = ?
        `, [siswa.id]);
        siswa.dokumen = dok;
        const fotoDoc = dok.find(d => d.kode_dokumen === 'FOTO' && d.file_path);
        if (fotoDoc) siswa.foto_path = fotoDoc.file_path;

        res.json(siswa);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', async (req, res) => {
    try {
        const {
            nisn, nis, nama, jk, status, tempatLahir, tglLahir, telp, alamat, wali, kelasId,
            angkatan, jenis_pendaftaran, tanggal_mulai_sekolah
        } = req.body;

        const nisnVal = nisn || null;
        const nisVal = nis || null;

        const [result] = await pool.query(`
            INSERT INTO siswa 
            (nisn, nis, nama, jk, status, tempat_lahir, tgl_lahir, telp, alamat, wali, kelas_id, angkatan, jenis_pendaftaran, tanggal_mulai_sekolah) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [nisnVal, nisVal, nama, jk, status || 'aktif', tempatLahir, tglLahir || null, telp, alamat, wali, kelasId, angkatan || null, jenis_pendaftaran || 'Baru', tanggal_mulai_sekolah || null]);

        res.status(201).json({ id: result.insertId });
    } catch (err) {
        console.error('[POST /api/siswa] Error:', err);
        let errorMsg = 'Gagal menambah siswa: ' + err.message;
        if (err.code === 'ER_DUP_ENTRY') errorMsg = 'Gagal: NIS atau NISN sudah terdaftar di siswa lain.';
        if (err.code === 'ER_BAD_FIELD_ERROR') errorMsg = 'Gagal: Struktur database tidak sesuai. Silakan jalankan script migrasi terbaru.';
        res.status(500).json({ error: errorMsg });
    }
});


router.put('/:id', async (req, res) => {
    try {
        const {
            nisn, nis, nama, jk, status, tempatLahir, tglLahir, telp, alamat, wali, kelasId,
            angkatan, jenis_pendaftaran, tanggal_mulai_sekolah,
            ayah, ibu, wali_detail
        } = req.body;

        const nisnVal = nisn || null;
        const nisVal = nis || null;
        const siswaId = req.params.id;

        // 0. Ambil data siswa sebelum update (untuk deteksi perubahan kelas)
        const [[siswaLama]] = await pool.query('SELECT kelas_id FROM siswa WHERE id = ?', [siswaId]);
        const kelasLamaId = siswaLama ? siswaLama.kelas_id : null;

        // 1. Update Siswa Dasar
        await pool.query(`
            UPDATE siswa SET 
                nisn = ?, nis = ?, nama = ?, jk = ?, status = ?, 
                tempat_lahir = ?, tgl_lahir = ?, telp = ?, 
                alamat = ?, wali = ?, kelas_id = ?,
                angkatan = ?, jenis_pendaftaran = ?, tanggal_mulai_sekolah = ?
            WHERE id = ?
        `, [nisnVal, nisVal, nama, jk, status, tempatLahir, tglLahir || null, telp, alamat, wali, kelasId, angkatan || null, jenis_pendaftaran || 'Baru', tanggal_mulai_sekolah || null, siswaId]);

        // 1b. Jika kelas_id berubah → catat snapshot ke siswa_kelas_history
        if (kelasId && String(kelasId) !== String(kelasLamaId)) {
            try {
                const [[ta]] = await pool.query(
                    `SELECT id, tahun, semester_aktif FROM tahun_ajaran WHERE status = 'aktif' LIMIT 1`
                );
                const [[kelas]] = await pool.query('SELECT nama FROM kelas WHERE id = ?', [kelasId]);
                if (ta && kelas) {
                    await pool.query(`
                        INSERT INTO siswa_kelas_history 
                            (siswa_id, kelas_id, nama_kelas, tahun_ajaran_id, nama_tahun_ajaran, semester)
                        VALUES (?, ?, ?, ?, ?, ?)
                        ON DUPLICATE KEY UPDATE
                            kelas_id = VALUES(kelas_id), nama_kelas = VALUES(nama_kelas)
                    `, [siswaId, kelasId, kelas.nama, ta.id, ta.tahun, ta.semester_aktif || 'Ganjil']);
                }
            } catch (e) {
                // Graceful fail: migration 012 mungkin belum dijalankan
                console.warn('[siswa_kelas_history] Snapshot gagal:', e.message);
            }
        }

        // 2. Update/Insert Orang Tua (Ayah, Ibu, Wali)
        const updateParent = async (jenis, p) => {
            if (!p || !p.nama) return;
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
            `, [siswaId, jenis, ...vals]);
        };

        if (ayah) await updateParent('ayah', ayah);
        if (ibu) await updateParent('ibu', ibu);
        if (wali_detail) await updateParent('wali', wali_detail);

        res.json({ success: true });
    } catch (err) {
        console.error('[PUT /api/siswa/:id] Error:', err);
        let errorMsg = 'Gagal memperbarui siswa: ' + err.message;
        if (err.code === 'ER_DUP_ENTRY') errorMsg = 'Gagal: NIS atau NISN sudah digunakan siswa lain.';
        if (err.code === 'ER_BAD_FIELD_ERROR') errorMsg = 'Gagal: Struktur database tidak sesuai (mungkin kolom hubungan/alamat/semester_aktif belum ada).';
        res.status(500).json({ error: errorMsg });
    }
});

router.delete('/:id', async (req, res) => {
    // ─────────────────────────────────────────────────────────────────────
    // PERUBAHAN PENTING: Siswa TIDAK PERNAH dihapus secara fisik.
    // Menghapus siswa akan merusak integritas data historis (tabungan,
    // infaq, absensi, nilai, jurnal). Sebagai gantinya, status siswa
    // diubah menjadi 'keluar' atau 'lulus'.
    // Gunakan query param ?status=lulus|pindah|keluar (default: keluar)
    // ─────────────────────────────────────────────────────────────────────
    const { id } = req.params;
    const newStatus = ['lulus', 'pindah', 'keluar'].includes(req.query.status)
        ? req.query.status
        : 'keluar';

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        // Pastikan siswa ada
        const [[siswa]] = await connection.query(
            'SELECT id, nama, status FROM siswa WHERE id = ?', [id]
        );
        if (!siswa) {
            await connection.rollback();
            return res.status(404).json({ error: 'Siswa tidak ditemukan' });
        }

        // Hitung riwayat untuk response info
        const [[{ tagihanCnt }]] = await connection.query(
            'SELECT COUNT(*) as tagihanCnt FROM tagihan WHERE siswa_id = ?', [id]
        );
        const [[{ tabunganCnt }]] = await connection.query(
            'SELECT COUNT(*) as tabunganCnt FROM tabungan WHERE siswa_id = ?', [id]
        );
        const [[{ infaqCnt }]] = await connection.query(
            'SELECT COUNT(*) as infaqCnt FROM infaq_harian WHERE siswa_id = ?', [id]
        );

        // Soft-delete: ubah status & lepas dari kelas
        await connection.query(
            'UPDATE siswa SET status = ?, kelas_id = NULL WHERE id = ?',
            [newStatus, id]
        );

        await connection.commit();
        res.json({
            success: true,
            action: 'soft_delete',
            message: `Siswa "${siswa.nama}" telah dinonaktifkan (status: ${newStatus}). Semua riwayat historis tetap tersimpan.`,
            preserved: {
                tagihan: tagihanCnt,
                tabungan: tabunganCnt,
                infaq: infaqCnt
            }
        });
    } catch (err) {
        await connection.rollback();
        console.error('Soft-Delete Siswa Error:', err);
        res.status(500).json({ error: err.message });
    } finally {
        connection.release();
    }
});

// --- BULK IMPORT SISWA ---
router.post('/import', uploadTemp.single('file'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'Tidak ada file yang diunggah' });

        const workbook = xlsx.readFile(req.file.path);
        let sheetName = workbook.SheetNames[0];

        if (workbook.SheetNames.includes('Data Siswa')) {
            sheetName = 'Data Siswa';
        }

        const worksheet = workbook.Sheets[sheetName];
        let headerRowIndex = 0;
        const a1Val = worksheet['A1'] ? worksheet['A1'].v : '';
        if (typeof a1Val === 'string' && a1Val.includes('APLIKASI SISTEM INFORMASI')) {
            headerRowIndex = 2; // Row 3
        }

        const data = xlsx.utils.sheet_to_json(worksheet, { range: headerRowIndex });
        if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);

        if (!data || data.length === 0) return res.status(400).json({ error: 'Data kosong / Sheet pertama kosong' });

        // Ambil data kelas untuk mapping
        const [kelasRows] = await pool.query('SELECT id, nama FROM kelas');
        const kelasMap = {};
        kelasRows.forEach(k => kelasMap[k.nama.toLowerCase().trim()] = k.id);

        const connection = await pool.getConnection();
        await connection.beginTransaction();

        try {
            let successCount = 0;

            for (const row of data) {
                const nama = row['Nama'] || 'Nama Tidak Diketahui';
                const nisn = row['NISN'] || null;
                const nis = row['NIS'] || null;
                const tempatLahir = row['Tempat Lahir'] || null;

                let tglLahir = null;
                if (row['Tanggal Lahir']) {
                    const rawDate = row['Tanggal Lahir'];
                    if (typeof rawDate === 'number') {
                        const jsDate = new Date(Math.round((rawDate - 25569) * 86400 * 1000));
                        tglLahir = jsDate.toISOString().split('T')[0];
                    } else if (typeof rawDate === 'string') {
                        try {
                            tglLahir = new Date(rawDate).toISOString().split('T')[0];
                        } catch (e) { /* ignore invalid date */ }
                    }
                }

                const jkStr = row['Jenis Kelamin'] || '';
                const jk = jkStr.toLowerCase().startsWith('p') ? 'P' : 'L';

                const agama = row['Agama'] || null;
                const alamat = row['Alamat'] || null;
                const rt = row['RT']?.toString() || null;
                const rw = row['RW']?.toString() || null;
                const dusun = row['Dusun'] || null;
                const kelurahan = row['Kelurahan'] || null;
                const kecamatan = row['Kecamatan'] || null;
                const kodepos = row['Kode Pos']?.toString() || null;
                const jenisTinggal = row['Jenis Tinggal'] || null;
                const nik = row['NIK']?.toString() || null;
                const rombelStr = row['Rombel Saat Ini']?.toString().toLowerCase().trim() || '';
                const kelas_id = kelasMap[rombelStr] || null;

                const [siswaRes] = await connection.query(`
                    INSERT INTO siswa 
                    (nama, nisn, nis, tempat_lahir, tgl_lahir, jk, agama, alamat, rt, rw, dusun, kelurahan, kecamatan, kodepos, jenis_tinggal, nik, kelas_id)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `, [nama, nisn, nis, tempatLahir, tglLahir, jk, agama, alamat, rt, rw, dusun, kelurahan, kecamatan, kodepos, jenisTinggal, nik, kelas_id]);

                const siswa_id = siswaRes.insertId;

                const insertParent = async (jenis, namaOrtu, tahunLahir, pendidikan, pekerjaan, penghasilan, nikOrtu) => {
                    if (!namaOrtu) return;
                    await connection.query(`
                        INSERT INTO siswa_orangtua (siswa_id, jenis, nama, tahun_lahir, pendidikan, pekerjaan, penghasilan, nik)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                    `, [siswa_id, jenis, namaOrtu, tahunLahir?.toString() || null, pendidikan || null, pekerjaan || null, penghasilan?.toString() || null, nikOrtu?.toString() || null]);
                };

                await insertParent('ayah', row['Nama Ayah'], row['Tahun Lahir Ayah'], row['Jenjang Pendidikan Ayah'], row['Pekerjaan Ayah'], row['Penghasilan Ayah'], row['NIK Ayah']);
                await insertParent('ibu', row['Nama Ibu'], row['Tahun Lahir Ibu'], row['Jenjang Pendidikan Ibu'], row['Pekerjaan Ibu'], row['Penghasilan Ibu'], row['NIK Ibu']);

                successCount++;
            }

            await connection.commit();
            res.json({ success: true, count: successCount });
        } catch (txnErr) {
            await connection.rollback();
            res.status(500).json({ error: 'Gagal import (Rollback): ' + txnErr.message });
        } finally {
            connection.release();
        }

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
