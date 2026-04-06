-- Patch script to fix schemas on Hosting
-- -- Menambahkan kolom yang kurang di tabel `siswa`
-- ALTER TABLE `siswa` ADD COLUMN `wali` varchar(150) DEFAULT NULL AFTER `jml_saudara`;

-- -- Menambahkan kolom yang kurang di tabel `tahun_ajaran`
-- ALTER TABLE `tahun_ajaran` ADD COLUMN `tanggal_mulai` date DEFAULT NULL AFTER `semester_aktif`;
-- ALTER TABLE `tahun_ajaran` ADD COLUMN `tanggal_selesai` date DEFAULT NULL AFTER `tanggal_mulai`;

-- -- Menambahkan kolom yang kurang di tabel `mata_pelajaran`
-- ALTER TABLE `mata_pelajaran` ADD COLUMN `guru_id` int(11) DEFAULT NULL;
-- ALTER TABLE `mata_pelajaran` ADD COLUMN `kelas_id` int(11) DEFAULT NULL;

-- -- Menambahkan kolom yang kurang di tabel `tagihan`
-- ALTER TABLE `tagihan` ADD COLUMN `kelas_id` bigint(20) DEFAULT NULL AFTER `siswa_id`;
-- ALTER TABLE `tagihan` ADD COLUMN `log_generate_id` bigint(20) DEFAULT NULL;
-- -- ALTER TABLE `tagihan` ADD COLUMN `nama_kategori` varchar(150) DEFAULT NULL COMMENT 'Snapshot nama kategori tagihan saat tagihan dibuat' AFTER `kategori_id`;

-- -- UPDATE tabel `cashflow`
-- ALTER TABLE `cashflow` ADD COLUMN `siswa_id` int(11) DEFAULT NULL COMMENT 'Referensi siswa jika cashflow terkait pembayaran siswa';
-- ALTER TABLE `cashflow` ADD COLUMN `tahun_ajaran_id` int(11) DEFAULT NULL COMMENT 'Referensi tahun ajaran untuk filter laporan';

-- -- UPDATE tabel `jurnal_mengajar`
-- ALTER TABLE `jurnal_mengajar` ADD COLUMN `jadwal_id_end` int(11) DEFAULT NULL;
-- ALTER TABLE `jurnal_mengajar` ADD COLUMN `nama_kelas_snapshot` varchar(100) DEFAULT NULL;
-- ALTER TABLE `jurnal_mengajar` ADD COLUMN `nama_mapel_snapshot` varchar(100) DEFAULT NULL;
-- ALTER TABLE `jurnal_mengajar` ADD COLUMN `nama_guru_snapshot` varchar(100) DEFAULT NULL;
-- ALTER TABLE `jurnal_mengajar` ADD COLUMN `jam_ke_snapshot` int(11) DEFAULT NULL;
-- ALTER TABLE `jurnal_mengajar` ADD COLUMN `jam_ke_end_snapshot` int(11) DEFAULT NULL;
-- ALTER TABLE `jurnal_mengajar` ADD COLUMN `jam_mulai_snapshot` time DEFAULT NULL;
-- ALTER TABLE `jurnal_mengajar` ADD COLUMN `jam_selesai_snapshot` time DEFAULT NULL;

-- -- UPDATE tabel `presensi_sesi`
-- ALTER TABLE `presensi_sesi` ADD COLUMN `nama_siswa` varchar(150) DEFAULT NULL COMMENT 'Snapshot nama siswa saat presensi dicatat';
-- ALTER TABLE `presensi_sesi` ADD COLUMN `nis` varchar(20) DEFAULT NULL COMMENT 'Snapshot NIS siswa saat presensi dicatat';

-- -- Update tabel `lab_kategori`
-- -- ALTER TABLE `lab_kategori` ADD COLUMN `created_at` timestamp DEFAULT CURRENT_TIMESTAMP;

-- -- Update tabel `attendance_settings`
-- -- ALTER TABLE `attendance_settings` ADD COLUMN `description` text DEFAULT NULL;
-- -- ALTER TABLE `attendance_settings` ADD COLUMN `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

-- Optionally, you may need to recreate missing tables such as log_generate, cms_*, nilai_semester, dll.
-- Jika ingin di-generate, bisa di tambahkan.


-- ==========================================
-- ADDING MISSING TABLES
-- ==========================================

-- Tabel: cms_partners
CREATE TABLE IF NOT EXISTS `cms_partners` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `logo_url` varchar(500) NOT NULL,
  `category` varchar(50) DEFAULT 'mitra',
  `website_url` varchar(500) DEFAULT NULL,
  `sort_order` int DEFAULT '0',
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) /*T![clustered_index] CLUSTERED */
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin ;

-- Tabel: cms_ppdb_requirements
CREATE TABLE IF NOT EXISTS `cms_ppdb_requirements` (
  `id` int NOT NULL AUTO_INCREMENT,
  `text` varchar(500) NOT NULL,
  `sort_order` int DEFAULT '0',
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) /*T![clustered_index] CLUSTERED */
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin ;

-- Tabel: cms_ppdb_steps
CREATE TABLE IF NOT EXISTS `cms_ppdb_steps` (
  `id` int NOT NULL AUTO_INCREMENT,
  `step_number` varchar(10) NOT NULL DEFAULT '01',
  `icon` varchar(50) DEFAULT '📋',
  `title` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `sort_order` int DEFAULT '0',
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) /*T![clustered_index] CLUSTERED */
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin ;

-- Tabel: log_generate
CREATE TABLE IF NOT EXISTS `log_generate` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `tipe` enum('bulk','single') NOT NULL,
  `keterangan` text DEFAULT NULL,
  `jumlah_tagihan` int DEFAULT NULL,
  `operator` varchar(100) DEFAULT NULL,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) /*T![clustered_index] CLUSTERED */
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin ;

-- Tabel: nilai_semester
CREATE TABLE IF NOT EXISTS `nilai_semester` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `siswa_id` int NOT NULL,
  `mapel_id` int NOT NULL,
  `kelas_id` int NOT NULL,
  `tahun_ajaran_id` int NOT NULL,
  `semester` enum('Ganjil','Genap') NOT NULL,
  `nilai_tp_rata` decimal(5,2) DEFAULT '0',
  `sts` decimal(5,2) DEFAULT '0',
  `sas` decimal(5,2) DEFAULT '0',
  `nilai_akhir` decimal(5,2) DEFAULT '0',
  `deskripsi` text DEFAULT NULL,
  `is_locked` tinyint(1) DEFAULT '0',
  `locked_at` datetime DEFAULT NULL,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) /*T![clustered_index] CLUSTERED */,
  UNIQUE KEY `uq_nilai_semester` (`siswa_id`,`mapel_id`,`kelas_id`,`tahun_ajaran_id`,`semester`),
  KEY `fk_2` (`mapel_id`),
  KEY `fk_3` (`tahun_ajaran_id`),
  CONSTRAINT `fk_1` FOREIGN KEY (`siswa_id`) REFERENCES `siswa` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `fk_2` FOREIGN KEY (`mapel_id`) REFERENCES `mata_pelajaran` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `fk_3` FOREIGN KEY (`tahun_ajaran_id`) REFERENCES `tahun_ajaran` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin ;

-- Tabel: nilai_tp
CREATE TABLE IF NOT EXISTS `nilai_tp` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `tp_id` int NOT NULL,
  `siswa_id` int NOT NULL,
  `nilai` decimal(5,2) DEFAULT '0',
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) /*T![clustered_index] CLUSTERED */,
  UNIQUE KEY `uq_nilai_tp` (`tp_id`,`siswa_id`),
  KEY `fk_2` (`siswa_id`),
  CONSTRAINT `fk_1` FOREIGN KEY (`tp_id`) REFERENCES `tujuan_pembelajaran` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_2` FOREIGN KEY (`siswa_id`) REFERENCES `siswa` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin ;

-- Tabel: rapor_catatan
CREATE TABLE IF NOT EXISTS `rapor_catatan` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `siswa_id` int NOT NULL,
  `kelas_id` int NOT NULL,
  `tahun_ajaran_id` int NOT NULL,
  `semester` enum('Ganjil','Genap') NOT NULL,
  `catatan` text DEFAULT NULL,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) /*T![clustered_index] CLUSTERED */,
  UNIQUE KEY `uq_rapor_catatan` (`siswa_id`,`kelas_id`,`tahun_ajaran_id`,`semester`),
  CONSTRAINT `fk_1` FOREIGN KEY (`siswa_id`) REFERENCES `siswa` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin ;

-- Tabel: rapor_ekskul
CREATE TABLE IF NOT EXISTS `rapor_ekskul` (
  `id` int NOT NULL AUTO_INCREMENT,
  `siswa_id` int NOT NULL,
  `kelas_id` int NOT NULL,
  `tahun_ajaran_id` int NOT NULL,
  `semester` enum('Ganjil','Genap') NOT NULL,
  `nama_ekskul` varchar(150) NOT NULL,
  `keterangan` text DEFAULT NULL,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) /*T![clustered_index] CLUSTERED */,
  UNIQUE KEY `uq_rapor_ekskul` (`siswa_id`,`kelas_id`,`tahun_ajaran_id`,`semester`,`nama_ekskul`),
  KEY `fk_2` (`kelas_id`),
  KEY `fk_3` (`tahun_ajaran_id`),
  CONSTRAINT `fk_1` FOREIGN KEY (`siswa_id`) REFERENCES `siswa` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_2` FOREIGN KEY (`kelas_id`) REFERENCES `kelas` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_3` FOREIGN KEY (`tahun_ajaran_id`) REFERENCES `tahun_ajaran` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

-- Tabel: tujuan_pembelajaran
CREATE TABLE IF NOT EXISTS `tujuan_pembelajaran` (
  `id` int NOT NULL AUTO_INCREMENT,
  `mapel_id` int NOT NULL,
  `kelas_id` int NOT NULL,
  `tahun_ajaran_id` int NOT NULL,
  `semester` enum('Ganjil','Genap') NOT NULL,
  `kode` varchar(20) NOT NULL,
  `deskripsi` text NOT NULL,
  `guru_id` int NOT NULL,
  `sort_order` int DEFAULT '0',
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) /*T![clustered_index] CLUSTERED */,
  KEY `fk_1` (`mapel_id`),
  KEY `fk_2` (`kelas_id`),
  KEY `fk_3` (`tahun_ajaran_id`),
  KEY `fk_4` (`guru_id`),
  CONSTRAINT `fk_3` FOREIGN KEY (`tahun_ajaran_id`) REFERENCES `tahun_ajaran` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `fk_1` FOREIGN KEY (`mapel_id`) REFERENCES `mata_pelajaran` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `fk_2` FOREIGN KEY (`kelas_id`) REFERENCES `kelas` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `fk_4` FOREIGN KEY (`guru_id`) REFERENCES `guru` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin ;

-- Tabel: wali_kelas
CREATE TABLE IF NOT EXISTS `wali_kelas` (
  `id` int NOT NULL AUTO_INCREMENT,
  `guru_id` int NOT NULL,
  `kelas_id` int NOT NULL,
  `tahun_ajaran_id` int NOT NULL,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) /*T![clustered_index] CLUSTERED */,
  UNIQUE KEY `uq_wali_kelas` (`kelas_id`,`tahun_ajaran_id`),
  KEY `fk_1` (`guru_id`),
  KEY `fk_3` (`tahun_ajaran_id`),
  CONSTRAINT `fk_1` FOREIGN KEY (`guru_id`) REFERENCES `guru` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_2` FOREIGN KEY (`kelas_id`) REFERENCES `kelas` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_3` FOREIGN KEY (`tahun_ajaran_id`) REFERENCES `tahun_ajaran` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin ;

