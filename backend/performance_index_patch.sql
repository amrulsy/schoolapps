-- OPTIMASI DATABASE: Penambahan INDEX untuk mempercepat Query (Slow Query Prevention)

-- 1. Tabel Siswa: Pencarian berdasarkan NISN sering dilakukan di menu admin dan saat absensi/login
ALTER TABLE `siswa` ADD INDEX `idx_siswa_nisn` (`nisn`);
ALTER TABLE `siswa` ADD INDEX `idx_siswa_kelas_id` (`kelas_id`);

-- 2. Tabel Tagihan: Query tagihan banyak menggunakan WHERE siswa_id dan kategori_id
ALTER TABLE `tagihan` ADD INDEX `idx_tagihan_siswa_id` (`siswa_id`);
ALTER TABLE `tagihan` ADD INDEX `idx_tagihan_kategori_ta` (`kategori_id`, `tahun_ajaran_id`);
ALTER TABLE `tagihan` ADD INDEX `idx_tagihan_transaksi_id` (`transaksi_id`);

-- 3. Tabel Transaksi: Query history sering memanggil invoice_no dan siswa_id
ALTER TABLE `transaksi` ADD INDEX `idx_transaksi_invoice` (`invoice_no`);
ALTER TABLE `transaksi` ADD INDEX `idx_transaksi_siswa` (`siswa_id`);

-- 4. Tabel Cashflow: Fitur laporan arus kas bertumpu pada tanggal dan ref (invoice)
ALTER TABLE `cashflow` ADD INDEX `idx_cashflow_tanggal` (`tanggal`);
ALTER TABLE `cashflow` ADD INDEX `idx_cashflow_ref` (`ref`);

-- 5. Tabel Histori Kelas: Snapshot kelas masa lalu
ALTER TABLE `siswa_kelas_history` ADD INDEX `idx_sch_siswa` (`siswa_id`);
ALTER TABLE `siswa_kelas_history` ADD INDEX `idx_sch_tahun` (`tahun_ajaran_id`);
