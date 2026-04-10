-- ==========================================
-- SIAS SMK PPRQ DATABASE SCHEMA (FULL SYNC)
-- ==========================================
-- Digenerate secara otomatis untuk deploy mudah tanpa migrasi terpisah.
-- Disable foreign key checks selama import
SET FOREIGN_KEY_CHECKS=0;

-- Table structure for table `attendance_settings`
DROP TABLE IF EXISTS `attendance_settings`;
CREATE TABLE IF NOT EXISTS `attendance_settings` (
  `key` varchar(100) NOT NULL,
  `value` text DEFAULT NULL,
  `description` text DEFAULT NULL,
  `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`key`) /*T![clustered_index] CLUSTERED */
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

-- Table structure for table `attendances`
DROP TABLE IF EXISTS `attendances`;
CREATE TABLE IF NOT EXISTS `attendances` (
  `id` int NOT NULL AUTO_INCREMENT,
  `student_id` int NOT NULL,
  `tanggal` date NOT NULL,
  `jam_masuk` datetime NOT NULL,
  `jam_pulang` datetime DEFAULT NULL,
  `status` enum('Hadir','Terlambat') DEFAULT 'Hadir',
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) /*T![clustered_index] CLUSTERED */,
  UNIQUE KEY `uq_student_date` (`student_id`, `tanggal`),
  KEY `tanggal` (`tanggal`),
  KEY `student_id` (`student_id`),
  CONSTRAINT `fk_1` FOREIGN KEY (`student_id`) REFERENCES `siswa` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin ;

-- Table structure for table `bk_catatan`
DROP TABLE IF EXISTS `bk_catatan`;
CREATE TABLE IF NOT EXISTS `bk_catatan` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `siswa_id` int NOT NULL,
  `bk_kategori_id` int NOT NULL,
  `tanggal` date NOT NULL,
  `keterangan` text DEFAULT NULL,
  `poin` int NOT NULL,
  `user_id` int DEFAULT NULL,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) /*T![clustered_index] CLUSTERED */,
  KEY `fk_1` (`siswa_id`),
  KEY `fk_2` (`bk_kategori_id`),
  CONSTRAINT `fk_1` FOREIGN KEY (`siswa_id`) REFERENCES `siswa` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `fk_2` FOREIGN KEY (`bk_kategori_id`) REFERENCES `bk_kategori` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin ;

-- Table structure for table `bk_kategori`
DROP TABLE IF EXISTS `bk_kategori`;
CREATE TABLE IF NOT EXISTS `bk_kategori` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nama` varchar(150) NOT NULL,
  `tipe` enum('pelanggaran','prestasi') NOT NULL,
  `poin` int NOT NULL,
  PRIMARY KEY (`id`) /*T![clustered_index] CLUSTERED */
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin ;

-- Table structure for table `cashflow`
DROP TABLE IF EXISTS `cashflow`;
CREATE TABLE IF NOT EXISTS `cashflow` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `tanggal` datetime NOT NULL,
  `keterangan` text NOT NULL,
  `nominal` decimal(12,2) NOT NULL,
  `tipe` enum('masuk','keluar') NOT NULL,
  `ref` varchar(100) DEFAULT NULL,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  `siswa_id` int DEFAULT NULL COMMENT 'Referensi siswa jika cashflow terkait pembayaran siswa',
  `tahun_ajaran_id` int DEFAULT NULL COMMENT 'Referensi tahun ajaran untuk filter laporan',
  PRIMARY KEY (`id`) /*T![clustered_index] CLUSTERED */,
  KEY `idx_cashflow_siswa` (`siswa_id`),
  KEY `idx_cashflow_ta` (`tahun_ajaran_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin ;

-- Table structure for table `cms_agenda`
DROP TABLE IF EXISTS `cms_agenda`;
CREATE TABLE IF NOT EXISTS `cms_agenda` (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `event_date` date NOT NULL,
  `time` varchar(50) DEFAULT NULL,
  `location` varchar(255) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) /*T![clustered_index] CLUSTERED */
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin ;

-- Table structure for table `cms_banners`
DROP TABLE IF EXISTS `cms_banners`;
CREATE TABLE IF NOT EXISTS `cms_banners` (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `subtitle` varchar(500) DEFAULT NULL,
  `image_url` varchar(500) NOT NULL,
  `link_url` varchar(500) DEFAULT NULL,
  `sort_order` int DEFAULT '0',
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) /*T![clustered_index] CLUSTERED */
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

-- Table structure for table `cms_contacts`
DROP TABLE IF EXISTS `cms_contacts`;
CREATE TABLE IF NOT EXISTS `cms_contacts` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(150) NOT NULL,
  `email` varchar(150) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `subject` varchar(255) DEFAULT NULL,
  `message` text NOT NULL,
  `is_read` tinyint(1) DEFAULT '0',
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) /*T![clustered_index] CLUSTERED */
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

-- Table structure for table `cms_faq`
DROP TABLE IF EXISTS `cms_faq`;
CREATE TABLE IF NOT EXISTS `cms_faq` (
  `id` int NOT NULL AUTO_INCREMENT,
  `question` text NOT NULL,
  `answer` text NOT NULL,
  `category` varchar(100) DEFAULT NULL,
  `sort_order` int DEFAULT '0',
  `is_active` tinyint DEFAULT '1',
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) /*T![clustered_index] CLUSTERED */
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin ;

-- Table structure for table `cms_gallery`
DROP TABLE IF EXISTS `cms_gallery`;
CREATE TABLE IF NOT EXISTS `cms_gallery` (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `image_url` text NOT NULL,
  `category` varchar(100) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `sort_order` int DEFAULT '0',
  `is_active` tinyint DEFAULT '1',
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) /*T![clustered_index] CLUSTERED */
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin ;

-- Table structure for table `cms_identity_logos`
DROP TABLE IF EXISTS `cms_identity_logos`;
CREATE TABLE IF NOT EXISTS `cms_identity_logos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `label` varchar(100) NOT NULL DEFAULT 'Identitas',
  `name` varchar(255) NOT NULL,
  `logo_url` varchar(500) DEFAULT NULL,
  `color_class` varchar(50) DEFAULT 'yayasan',
  `sort_order` int DEFAULT '0',
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) /*T![clustered_index] CLUSTERED */
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin ;

-- Table structure for table `cms_media`
DROP TABLE IF EXISTS `cms_media`;
CREATE TABLE IF NOT EXISTS `cms_media` (
  `id` int NOT NULL AUTO_INCREMENT,
  `filename` varchar(255) NOT NULL,
  `original_name` varchar(255) NOT NULL,
  `mimetype` varchar(100) DEFAULT NULL,
  `size` int DEFAULT NULL,
  `path` varchar(500) NOT NULL,
  `uploaded_by` int DEFAULT NULL,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) /*T![clustered_index] CLUSTERED */,
  KEY `fk_1` (`uploaded_by`),
  CONSTRAINT `fk_1` FOREIGN KEY (`uploaded_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

-- Table structure for table `cms_pages`
DROP TABLE IF EXISTS `cms_pages`;
CREATE TABLE IF NOT EXISTS `cms_pages` (
  `id` int NOT NULL AUTO_INCREMENT,
  `slug` varchar(100) NOT NULL,
  `title` varchar(255) NOT NULL,
  `content` longtext NOT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `meta_description` varchar(300) DEFAULT NULL,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) /*T![clustered_index] CLUSTERED */,
  UNIQUE KEY `slug` (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

-- Table structure for table `cms_partners`
DROP TABLE IF EXISTS `cms_partners`;
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

-- Table structure for table `cms_posts`
DROP TABLE IF EXISTS `cms_posts`;
CREATE TABLE IF NOT EXISTS `cms_posts` (
  `id` int NOT NULL AUTO_INCREMENT,
  `slug` varchar(255) NOT NULL,
  `title` varchar(255) NOT NULL,
  `excerpt` text DEFAULT NULL,
  `content` longtext NOT NULL,
  `cover_image` varchar(500) DEFAULT NULL,
  `category` enum('pengumuman','artikel','berita') DEFAULT 'pengumuman',
  `status` enum('draft','published','archived') DEFAULT 'draft',
  `is_pinned` tinyint(1) DEFAULT '0',
  `author_id` int DEFAULT NULL,
  `views` int DEFAULT '0',
  `published_at` datetime DEFAULT NULL,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) /*T![clustered_index] CLUSTERED */,
  UNIQUE KEY `slug` (`slug`),
  KEY `fk_1` (`author_id`),
  CONSTRAINT `fk_1` FOREIGN KEY (`author_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

-- Table structure for table `cms_ppdb_requirements`
DROP TABLE IF EXISTS `cms_ppdb_requirements`;
CREATE TABLE IF NOT EXISTS `cms_ppdb_requirements` (
  `id` int NOT NULL AUTO_INCREMENT,
  `text` varchar(500) NOT NULL,
  `sort_order` int DEFAULT '0',
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) /*T![clustered_index] CLUSTERED */
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin ;

-- Table structure for table `cms_ppdb_steps`
DROP TABLE IF EXISTS `cms_ppdb_steps`;
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

-- Table structure for table `cms_programs`
DROP TABLE IF EXISTS `cms_programs`;
CREATE TABLE IF NOT EXISTS `cms_programs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `icon` varchar(10) NOT NULL DEFAULT '📚',
  `title` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `sort_order` int DEFAULT '0',
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  `slug` varchar(100) DEFAULT NULL,
  `tagline` varchar(255) DEFAULT NULL,
  `banner_image` varchar(255) DEFAULT NULL,
  `color_theme` varchar(50) DEFAULT NULL,
  `features_json` json DEFAULT NULL,
  `full_content` text DEFAULT NULL,
  `milestones_json` json DEFAULT NULL,
  `showcase_json` json DEFAULT NULL,
  `alumni_json` json DEFAULT NULL,
  `stats_json` json DEFAULT NULL,
  `careers_json` json DEFAULT NULL,
  PRIMARY KEY (`id`) /*T![clustered_index] CLUSTERED */,
  UNIQUE KEY `idx_cms_programs_slug` (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin ;

-- Table structure for table `cms_settings`
DROP TABLE IF EXISTS `cms_settings`;
CREATE TABLE IF NOT EXISTS `cms_settings` (
  `setting_key` varchar(100) NOT NULL,
  `setting_value` text NOT NULL,
  `setting_type` varchar(50) DEFAULT 'string',
  `description` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`setting_key`) /*T![clustered_index] CLUSTERED */
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

-- Table structure for table `cms_testimonials`
DROP TABLE IF EXISTS `cms_testimonials`;
CREATE TABLE IF NOT EXISTS `cms_testimonials` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `role` varchar(255) DEFAULT NULL,
  `company` varchar(255) DEFAULT NULL,
  `photo_url` text DEFAULT NULL,
  `quote` text NOT NULL,
  `rating` int DEFAULT '5',
  `sort_order` int DEFAULT '0',
  `is_active` tinyint DEFAULT '1',
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) /*T![clustered_index] CLUSTERED */
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin ;

-- Table structure for table `cms_visitor_stats`
DROP TABLE IF EXISTS `cms_visitor_stats`;
CREATE TABLE IF NOT EXISTS `cms_visitor_stats` (
  `visit_date` date NOT NULL,
  `visits` int DEFAULT '0',
  PRIMARY KEY (`visit_date`) /*T![clustered_index] CLUSTERED */
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

-- Table structure for table `guru`
DROP TABLE IF EXISTS `guru`;
CREATE TABLE IF NOT EXISTS `guru` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nip` varchar(50) DEFAULT NULL,
  `nama` varchar(150) NOT NULL,
  `user_id` int DEFAULT NULL,
  PRIMARY KEY (`id`) /*T![clustered_index] CLUSTERED */,
  UNIQUE KEY `nip` (`nip`),
  KEY `fk_1` (`user_id`),
  CONSTRAINT `fk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin ;

-- Table structure for table `harilibur`
DROP TABLE IF EXISTS `harilibur`;
CREATE TABLE IF NOT EXISTS `harilibur` (
  `id` int NOT NULL AUTO_INCREMENT,
  `tanggal` date NOT NULL,
  `keterangan` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`) /*T![clustered_index] CLUSTERED */,
  UNIQUE KEY `tanggal` (`tanggal`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin ;

-- Table structure for table `infaq_harian`
DROP TABLE IF EXISTS `infaq_harian`;
CREATE TABLE IF NOT EXISTS `infaq_harian` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `siswa_id` int NOT NULL,
  `tanggal` date NOT NULL,
  `nominal` decimal(12,2) NOT NULL,
  `user_id` int DEFAULT NULL,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  `tahun_ajaran_id` int DEFAULT NULL,
  `nama_siswa` varchar(150) DEFAULT NULL COMMENT 'Snapshot nama siswa saat infaq dicatat',
  `nis` varchar(20) DEFAULT NULL COMMENT 'Snapshot NIS siswa saat infaq dicatat',
  PRIMARY KEY (`id`) /*T![clustered_index] CLUSTERED */,
  UNIQUE KEY `siswa_id` (`siswa_id`,`tanggal`),
  KEY `idx_infaq_ta` (`tahun_ajaran_id`),
  KEY `idx_infaq_tanggal` (`tanggal`),
  KEY `idx_infaq_nis` (`nis`),
  CONSTRAINT `fk_infaq_ta` FOREIGN KEY (`tahun_ajaran_id`) REFERENCES `tahun_ajaran` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_1` FOREIGN KEY (`siswa_id`) REFERENCES `siswa` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin ;

-- Table structure for table `infaq_settings`
DROP TABLE IF EXISTS `infaq_settings`;
CREATE TABLE IF NOT EXISTS `infaq_settings` (
  `key` varchar(50) NOT NULL,
  `value` text NOT NULL,
  PRIMARY KEY (`key`) /*T![clustered_index] CLUSTERED */
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

-- Table structure for table `jadwal_pelajaran`
DROP TABLE IF EXISTS `jadwal_pelajaran`;
CREATE TABLE IF NOT EXISTS `jadwal_pelajaran` (
  `id` int NOT NULL AUTO_INCREMENT,
  `guru_id` int DEFAULT NULL,
  `kelas_id` int NOT NULL,
  `mapel_id` int NOT NULL,
  `hari` enum('Senin','Selasa','Rabu','Kamis','Jumat','Sabtu','Minggu') NOT NULL,
  `jam_pelajaran_id` int NOT NULL,
  PRIMARY KEY (`id`) /*T![clustered_index] CLUSTERED */,
  KEY `fk_1` (`guru_id`),
  KEY `fk_2` (`kelas_id`),
  KEY `fk_3` (`mapel_id`),
  KEY `fk_4` (`jam_pelajaran_id`),
  CONSTRAINT `fk_1` FOREIGN KEY (`guru_id`) REFERENCES `guru` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_2` FOREIGN KEY (`kelas_id`) REFERENCES `kelas` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_3` FOREIGN KEY (`mapel_id`) REFERENCES `mata_pelajaran` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_4` FOREIGN KEY (`jam_pelajaran_id`) REFERENCES `jam_pelajaran` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin ;

-- Table structure for table `jam_pelajaran`
DROP TABLE IF EXISTS `jam_pelajaran`;
CREATE TABLE IF NOT EXISTS `jam_pelajaran` (
  `id` int NOT NULL AUTO_INCREMENT,
  `jam_ke` int NOT NULL,
  `jam_mulai` time NOT NULL,
  `jam_selesai` time NOT NULL,
  `tipe` enum('Pelajaran','Istirahat') DEFAULT 'Pelajaran',
  PRIMARY KEY (`id`) /*T![clustered_index] CLUSTERED */,
  UNIQUE KEY `jam_ke` (`jam_ke`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin ;

-- Table structure for table `jurnal_mengajar`
DROP TABLE IF EXISTS `jurnal_mengajar`;
CREATE TABLE IF NOT EXISTS `jurnal_mengajar` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `guru_id` int NOT NULL,
  `jadwal_id` int DEFAULT NULL,
  `jadwal_id_end` int DEFAULT NULL,
  `kelas_id` int NOT NULL,
  `mapel_id` int NOT NULL,
  `tanggal` date NOT NULL,
  `waktu_masuk_aktual` time DEFAULT NULL,
  `waktu_keluar_aktual` time DEFAULT NULL,
  `materi` text DEFAULT NULL,
  `status_jurnal` enum('Running','Selesai') DEFAULT 'Running',
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  `nama_kelas_snapshot` varchar(100) DEFAULT NULL,
  `nama_mapel_snapshot` varchar(100) DEFAULT NULL,
  `nama_guru_snapshot` varchar(100) DEFAULT NULL,
  `jam_ke_snapshot` int DEFAULT NULL,
  `jam_ke_end_snapshot` int DEFAULT NULL,
  `jam_mulai_snapshot` time DEFAULT NULL,
  `jam_selesai_snapshot` time DEFAULT NULL,
  `nama_kelas` varchar(50) DEFAULT NULL COMMENT 'Snapshot nama kelas saat jurnal dibuat',
  `nama_mapel` varchar(150) DEFAULT NULL COMMENT 'Snapshot nama mata pelajaran saat jurnal dibuat',
  `nama_guru` varchar(150) DEFAULT NULL COMMENT 'Snapshot nama guru saat jurnal dibuat',
  PRIMARY KEY (`id`) /*T![clustered_index] CLUSTERED */,
  KEY `fk_1` (`guru_id`),
  KEY `fk_2` (`jadwal_id`),
  KEY `fk_3` (`kelas_id`),
  KEY `fk_4` (`mapel_id`),
  CONSTRAINT `fk_2` FOREIGN KEY (`jadwal_id`) REFERENCES `jadwal_pelajaran` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_1` FOREIGN KEY (`guru_id`) REFERENCES `guru` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `fk_3` FOREIGN KEY (`kelas_id`) REFERENCES `kelas` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `fk_4` FOREIGN KEY (`mapel_id`) REFERENCES `mata_pelajaran` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin ;

-- Table structure for table `kategori_tagihan`
DROP TABLE IF EXISTS `kategori_tagihan`;
CREATE TABLE IF NOT EXISTS `kategori_tagihan` (
  `id` int NOT NULL AUTO_INCREMENT,
  `kode` varchar(50) NOT NULL,
  `nama` varchar(150) NOT NULL,
  `nominal` decimal(12,2) NOT NULL,
  `tipe` enum('bulanan','3bulanan','semesteran','tahunan','insidentil') NOT NULL,
  `keterangan` text DEFAULT NULL,
  PRIMARY KEY (`id`) /*T![clustered_index] CLUSTERED */,
  UNIQUE KEY `kode` (`kode`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin ;

-- Table structure for table `kelas`
DROP TABLE IF EXISTS `kelas`;
CREATE TABLE IF NOT EXISTS `kelas` (
  `id` int NOT NULL AUTO_INCREMENT,
  `unit_id` int NOT NULL,
  `nama` varchar(50) NOT NULL,
  PRIMARY KEY (`id`) /*T![clustered_index] CLUSTERED */,
  KEY `fk_1` (`unit_id`),
  CONSTRAINT `fk_1` FOREIGN KEY (`unit_id`) REFERENCES `units` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin ;

-- Table structure for table `lab_inventaris`
DROP TABLE IF EXISTS `lab_inventaris`;
CREATE TABLE IF NOT EXISTS `lab_inventaris` (
  `id` int NOT NULL AUTO_INCREMENT,
  `kategori_id` int NOT NULL,
  `kode` varchar(50) NOT NULL,
  `nama` varchar(200) NOT NULL,
  `merk` varchar(100) DEFAULT NULL,
  `spesifikasi` text DEFAULT NULL,
  `kondisi` enum('baik','rusak_ringan','rusak_berat') DEFAULT 'baik',
  `status` enum('tersedia','dipinjam','maintenance') DEFAULT 'tersedia',
  `lokasi` varchar(100) DEFAULT NULL,
  `foto` varchar(255) DEFAULT NULL,
  `nilai_aset` decimal(12,2) DEFAULT NULL,
  `tanggal_perolehan` date DEFAULT NULL,
  `catatan` text DEFAULT NULL,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  `max_pinjam_per_siswa` int DEFAULT '1',
  `durasi_pinjam` int DEFAULT '1',
  `durasi_tipe` enum('hari','jam_pelajaran','akhir_hari') DEFAULT 'hari',
  PRIMARY KEY (`id`) /*T![clustered_index] CLUSTERED */,
  UNIQUE KEY `kode` (`kode`),
  KEY `fk_1` (`kategori_id`),
  CONSTRAINT `fk_1` FOREIGN KEY (`kategori_id`) REFERENCES `lab_kategori` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin ;

-- Table structure for table `lab_kategori`
DROP TABLE IF EXISTS `lab_kategori`;
CREATE TABLE IF NOT EXISTS `lab_kategori` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nama` varchar(150) NOT NULL,
  `icon` varchar(50) DEFAULT '📦',
  `deskripsi` text DEFAULT NULL,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) /*T![clustered_index] CLUSTERED */
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin ;

-- Table structure for table `lab_peminjaman`
DROP TABLE IF EXISTS `lab_peminjaman`;
CREATE TABLE IF NOT EXISTS `lab_peminjaman` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `inventaris_id` int NOT NULL,
  `siswa_id` int NOT NULL,
  `user_id` int DEFAULT NULL,
  `tanggal_pinjam` datetime NOT NULL,
  `tanggal_kembali` datetime DEFAULT NULL,
  `batas_kembali` datetime NOT NULL,
  `kondisi_pinjam` enum('baik','rusak_ringan','rusak_berat') DEFAULT 'baik',
  `kondisi_kembali` enum('baik','rusak_ringan','rusak_berat') DEFAULT NULL,
  `status` enum('dipinjam','dikembalikan','terlambat') DEFAULT 'dipinjam',
  `catatan` text DEFAULT NULL,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) /*T![clustered_index] CLUSTERED */,
  KEY `fk_1` (`inventaris_id`),
  KEY `fk_2` (`siswa_id`),
  CONSTRAINT `fk_1` FOREIGN KEY (`inventaris_id`) REFERENCES `lab_inventaris` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_2` FOREIGN KEY (`siswa_id`) REFERENCES `siswa` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin ;

-- Table structure for table `lab_settings`
DROP TABLE IF EXISTS `lab_settings`;
CREATE TABLE IF NOT EXISTS `lab_settings` (
  `key` varchar(100) NOT NULL,
  `value` text DEFAULT NULL,
  PRIMARY KEY (`key`) /*T![clustered_index] CLUSTERED */
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

-- Table structure for table `log_generate`
DROP TABLE IF EXISTS `log_generate`;
CREATE TABLE IF NOT EXISTS `log_generate` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `tipe` enum('bulk','single') NOT NULL,
  `keterangan` text DEFAULT NULL,
  `jumlah_tagihan` int DEFAULT NULL,
  `operator` varchar(100) DEFAULT NULL,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) /*T![clustered_index] CLUSTERED */
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin ;

-- Table structure for table `master_dokumen`
DROP TABLE IF EXISTS `master_dokumen`;
CREATE TABLE IF NOT EXISTS `master_dokumen` (
  `id` int NOT NULL AUTO_INCREMENT,
  `kode` varchar(50) NOT NULL,
  `nama` varchar(150) NOT NULL,
  `is_required` tinyint(1) DEFAULT '1',
  `keterangan` text DEFAULT NULL,
  PRIMARY KEY (`id`) /*T![clustered_index] CLUSTERED */,
  UNIQUE KEY `kode` (`kode`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin ;

-- Table structure for table `mata_pelajaran`
DROP TABLE IF EXISTS `mata_pelajaran`;
CREATE TABLE IF NOT EXISTS `mata_pelajaran` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nama` varchar(150) NOT NULL,
  `tingkat` varchar(20) DEFAULT NULL,
  `guru_id` int DEFAULT NULL,
  `kelas_id` int DEFAULT NULL,
  PRIMARY KEY (`id`) /*T![clustered_index] CLUSTERED */
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin ;

-- Table structure for table `nilai_semester`
DROP TABLE IF EXISTS `nilai_semester`;
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

-- Table structure for table `nilai_siswa`
DROP TABLE IF EXISTS `nilai_siswa`;
CREATE TABLE IF NOT EXISTS `nilai_siswa` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `siswa_id` int NOT NULL,
  `mapel_id` int NOT NULL,
  `tahun_ajaran_id` int NOT NULL,
  `semester` enum('Ganjil','Genap') NOT NULL,
  `tugas` decimal(5,2) DEFAULT '0',
  `uts` decimal(5,2) DEFAULT '0',
  `uas` decimal(5,2) DEFAULT '0',
  `akhir` decimal(5,2) DEFAULT '0',
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) /*T![clustered_index] CLUSTERED */,
  UNIQUE KEY `siswa_id` (`siswa_id`,`mapel_id`,`tahun_ajaran_id`,`semester`),
  KEY `fk_2` (`mapel_id`),
  KEY `fk_3` (`tahun_ajaran_id`),
  CONSTRAINT `fk_1` FOREIGN KEY (`siswa_id`) REFERENCES `siswa` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_2` FOREIGN KEY (`mapel_id`) REFERENCES `mata_pelajaran` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_3` FOREIGN KEY (`tahun_ajaran_id`) REFERENCES `tahun_ajaran` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin ;

-- Table structure for table `nilai_tp`
DROP TABLE IF EXISTS `nilai_tp`;
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

-- Table structure for table `pesan`
DROP TABLE IF EXISTS `pesan`;
CREATE TABLE IF NOT EXISTS `pesan` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `pengirim_id` int NOT NULL,
  `pengirim_type` enum('admin','student') NOT NULL,
  `penerima_id` int NOT NULL,
  `penerima_type` enum('admin','student') NOT NULL,
  `pesan` text NOT NULL,
  `waktu` datetime NOT NULL,
  `is_read` tinyint(1) DEFAULT '0',
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) /*T![clustered_index] CLUSTERED */
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin ;

-- Table structure for table `ppdb_announcements`
DROP TABLE IF EXISTS `ppdb_announcements`;
CREATE TABLE IF NOT EXISTS `ppdb_announcements` (
  `id` int NOT NULL AUTO_INCREMENT,
  `judul` varchar(255) NOT NULL,
  `isi` text DEFAULT NULL,
  `tipe` enum('info','warning','success') DEFAULT 'info',
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) /*T![clustered_index] CLUSTERED */
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin ;

-- Table structure for table `ppdb_gelombang`
DROP TABLE IF EXISTS `ppdb_gelombang`;
CREATE TABLE IF NOT EXISTS `ppdb_gelombang` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nama` varchar(100) NOT NULL,
  `kuota` int NOT NULL DEFAULT '50',
  `biaya_daftar_ulang` decimal(12,2) DEFAULT '1500000',
  `tanggal_buka` date DEFAULT NULL,
  `tanggal_tutup` date DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) /*T![clustered_index] CLUSTERED */
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin ;

-- Table structure for table `ppdb_registrations`
DROP TABLE IF EXISTS `ppdb_registrations`;
CREATE TABLE IF NOT EXISTS `ppdb_registrations` (
  `id` int NOT NULL AUTO_INCREMENT,
  `registration_number` varchar(50) NOT NULL,
  `username` varchar(50) NOT NULL,
  `pin_rahasia` varchar(255) NOT NULL,
  `nama_lengkap` varchar(255) NOT NULL,
  `tempat_lahir` varchar(100) DEFAULT NULL,
  `tgl_lahir` date DEFAULT NULL,
  `jenis_kelamin` enum('L','P') NOT NULL,
  `agama` varchar(50) DEFAULT NULL,
  `asal_sekolah` varchar(255) NOT NULL,
  `no_whatsapp` varchar(20) NOT NULL,
  `alamat_lengkap` text NOT NULL,
  `nisn` varchar(20) DEFAULT NULL,
  `biodata_tambahan` json DEFAULT NULL,
  `status` enum('draft','pending_verification','wawancara','accepted','rejected') DEFAULT 'draft',
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) /*T![clustered_index] CLUSTERED */,
  UNIQUE KEY `registration_number` (`registration_number`),
  UNIQUE KEY `username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

-- Table structure for table `presensi_sesi`
DROP TABLE IF EXISTS `presensi_sesi`;
CREATE TABLE IF NOT EXISTS `presensi_sesi` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `jurnal_id` bigint NOT NULL,
  `siswa_id` int NOT NULL,
  `status` enum('hadir','sakit','izin','alpha','bolos') NOT NULL,
  `keterangan` text DEFAULT NULL,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  `nama_siswa` varchar(150) DEFAULT NULL COMMENT 'Snapshot nama siswa saat presensi dicatat',
  `nis` varchar(20) DEFAULT NULL COMMENT 'Snapshot NIS siswa saat presensi dicatat',
  PRIMARY KEY (`id`) /*T![clustered_index] CLUSTERED */,
  UNIQUE KEY `jurnal_id` (`jurnal_id`,`siswa_id`),
  KEY `fk_2` (`siswa_id`),
  KEY `idx_presensi_sesi_nis` (`nis`),
  CONSTRAINT `fk_1` FOREIGN KEY (`jurnal_id`) REFERENCES `jurnal_mengajar` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_2` FOREIGN KEY (`siswa_id`) REFERENCES `siswa` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin ;

-- Table structure for table `rapor_catatan`
DROP TABLE IF EXISTS `rapor_catatan`;
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

-- Table structure for table `rapor_ekskul`
DROP TABLE IF EXISTS `rapor_ekskul`;
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

-- Table structure for table `school_settings`
DROP TABLE IF EXISTS `school_settings`;
CREATE TABLE IF NOT EXISTS `school_settings` (
  `key` varchar(100) NOT NULL,
  `value` text DEFAULT NULL,
  PRIMARY KEY (`key`) /*T![clustered_index] CLUSTERED */
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

-- Table structure for table `siswa`
DROP TABLE IF EXISTS `siswa`;
CREATE TABLE IF NOT EXISTS `siswa` (
  `id` int NOT NULL AUTO_INCREMENT,
  `kelas_id` int DEFAULT NULL,
  `nisn` varchar(20) DEFAULT NULL,
  `nis` varchar(20) DEFAULT NULL,
  `nama` varchar(150) NOT NULL,
  `jk` enum('L','P') NOT NULL,
  `status` enum('aktif','lulus','pindah','keluar') DEFAULT 'aktif',
  `tanggal_masuk` date DEFAULT NULL,
  `tempat_lahir` varchar(100) DEFAULT NULL,
  `tgl_lahir` date DEFAULT NULL,
  `kewarganegaraan` varchar(10) DEFAULT NULL,
  `agama` varchar(20) DEFAULT NULL,
  `jurusan` varchar(50) DEFAULT NULL,
  `angkatan` varchar(10) DEFAULT NULL,
  `email` varchar(150) DEFAULT NULL,
  `telp` varchar(20) DEFAULT NULL,
  `asal_sekolah` varchar(150) DEFAULT NULL,
  `nik` varchar(20) DEFAULT NULL,
  `no_kk` varchar(20) DEFAULT NULL,
  `anak_ke` int DEFAULT NULL,
  `jml_saudara` int DEFAULT NULL,
  `hobby` varchar(100) DEFAULT NULL,
  `cita_cita` varchar(100) DEFAULT NULL,
  `no_reg` varchar(50) DEFAULT NULL,
  `bb` float DEFAULT NULL,
  `tb` float DEFAULT NULL,
  `gol_darah` varchar(5) DEFAULT NULL,
  `riwayat_penyakit` text DEFAULT NULL,
  `kebutuhan_khusus` varchar(50) DEFAULT NULL,
  `alamat` text DEFAULT NULL,
  `wali` varchar(150) DEFAULT NULL,
  `rt` varchar(5) DEFAULT NULL,
  `rw` varchar(5) DEFAULT NULL,
  `dusun` varchar(100) DEFAULT NULL,
  `kodepos` varchar(10) DEFAULT NULL,
  `kelurahan` varchar(100) DEFAULT NULL,
  `kecamatan` varchar(100) DEFAULT NULL,
  `kabupaten` varchar(100) DEFAULT NULL,
  `provinsi` varchar(100) DEFAULT NULL,
  `jenis_tinggal` varchar(50) DEFAULT NULL,
  `rfid_uid` varchar(100) DEFAULT NULL,
  `jenis_pendaftaran` enum('Baru','Pindahan') DEFAULT 'Baru',
  `tanggal_mulai_sekolah` date DEFAULT NULL,
  PRIMARY KEY (`id`) /*T![clustered_index] CLUSTERED */,
  UNIQUE KEY `nisn` (`nisn`),
  UNIQUE KEY `nis` (`nis`),
  UNIQUE KEY `no_reg` (`no_reg`),
  KEY `fk_1` (`kelas_id`),
  UNIQUE KEY `idx_rfid_uid` (`rfid_uid`),
  CONSTRAINT `fk_1` FOREIGN KEY (`kelas_id`) REFERENCES `kelas` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin ;

-- Table structure for table `siswa_dokumen`
DROP TABLE IF EXISTS `siswa_dokumen`;
CREATE TABLE IF NOT EXISTS `siswa_dokumen` (
  `id` int NOT NULL AUTO_INCREMENT,
  `siswa_id` int NOT NULL,
  `kode_dokumen` varchar(20) NOT NULL,
  `nama_dokumen` varchar(100) DEFAULT NULL,
  `status` enum('Terverifikasi','Belum Verifikasi','Tidak Ada') DEFAULT 'Tidak Ada',
  `file_size` varchar(20) DEFAULT NULL,
  `file_path` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`) /*T![clustered_index] CLUSTERED */,
  UNIQUE KEY `siswa_id` (`siswa_id`,`kode_dokumen`),
  CONSTRAINT `fk_1` FOREIGN KEY (`siswa_id`) REFERENCES `siswa` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin ;

-- Table structure for table `siswa_kelas_history`
DROP TABLE IF EXISTS `siswa_kelas_history`;
CREATE TABLE IF NOT EXISTS `siswa_kelas_history` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `siswa_id` int NOT NULL,
  `kelas_id` int NOT NULL,
  `nama_kelas` varchar(50) NOT NULL,
  `tahun_ajaran_id` int NOT NULL,
  `nama_tahun_ajaran` varchar(20) NOT NULL,
  `semester` enum('Ganjil','Genap') NOT NULL,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) /*T![clustered_index] CLUSTERED */,
  UNIQUE KEY `uq_siswa_kelas_ta` (`siswa_id`,`tahun_ajaran_id`,`semester`),
  KEY `fk_2` (`kelas_id`),
  KEY `fk_3` (`tahun_ajaran_id`),
  KEY `idx_skh_kelas` (`kelas_id`,`tahun_ajaran_id`),
  KEY `idx_skh_siswa` (`siswa_id`),
  CONSTRAINT `fk_1` FOREIGN KEY (`siswa_id`) REFERENCES `siswa` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_2` FOREIGN KEY (`kelas_id`) REFERENCES `kelas` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_3` FOREIGN KEY (`tahun_ajaran_id`) REFERENCES `tahun_ajaran` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin ;

-- Table structure for table `siswa_orangtua`
DROP TABLE IF EXISTS `siswa_orangtua`;
CREATE TABLE IF NOT EXISTS `siswa_orangtua` (
  `id` int NOT NULL AUTO_INCREMENT,
  `siswa_id` int NOT NULL,
  `jenis` enum('ayah','ibu','wali') NOT NULL,
  `nama` varchar(150) DEFAULT NULL,
  `nik` varchar(20) DEFAULT NULL,
  `pendidikan` varchar(50) DEFAULT NULL,
  `pekerjaan` varchar(100) DEFAULT NULL,
  `penghasilan` varchar(100) DEFAULT NULL,
  `tahun_lahir` varchar(4) DEFAULT NULL,
  `hp` varchar(20) DEFAULT NULL,
  `status_hidup` enum('Hidup','Meninggal') DEFAULT 'Hidup',
  `hubungan` varchar(50) DEFAULT NULL,
  `alamat` text DEFAULT NULL,
  PRIMARY KEY (`id`) /*T![clustered_index] CLUSTERED */,
  UNIQUE KEY `siswa_id` (`siswa_id`,`jenis`),
  CONSTRAINT `fk_1` FOREIGN KEY (`siswa_id`) REFERENCES `siswa` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin ;

-- Table structure for table `siswa_presensi`
DROP TABLE IF EXISTS `siswa_presensi`;
CREATE TABLE IF NOT EXISTS `siswa_presensi` (
  `id` int NOT NULL AUTO_INCREMENT,
  `siswa_id` int NOT NULL,
  `tanggal` date NOT NULL,
  `status` enum('hadir','sakit','izin','alpha') NOT NULL,
  `jam_masuk` datetime DEFAULT NULL,
  `jam_pulang` datetime DEFAULT NULL,
  `keterangan` text DEFAULT NULL,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) /*T![clustered_index] CLUSTERED */,
  UNIQUE KEY `siswa_id` (`siswa_id`,`tanggal`),
  CONSTRAINT `fk_1` FOREIGN KEY (`siswa_id`) REFERENCES `siswa` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin ;

-- Table structure for table `wa_notification_log`
DROP TABLE IF EXISTS `wa_notification_log`;
CREATE TABLE IF NOT EXISTS `wa_notification_log` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `siswa_id` int NOT NULL,
  `phone` varchar(20) NOT NULL,
  `message_type` varchar(50) DEFAULT NULL COMMENT 'masuk, terlambat, pulang, alpha, sakit, izin',
  `status` enum('sent','failed','pending') DEFAULT 'pending',
  `error_message` text DEFAULT NULL,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) /*T![clustered_index] CLUSTERED */,
  KEY `idx_wa_log_siswa` (`siswa_id`),
  KEY `idx_wa_log_date` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

-- Table structure for table `student_menus`
DROP TABLE IF EXISTS `student_menus`;
CREATE TABLE IF NOT EXISTS `student_menus` (
  `id` int NOT NULL AUTO_INCREMENT,
  `label` varchar(100) NOT NULL,
  `icon` varchar(50) NOT NULL,
  `path` varchar(255) NOT NULL,
  `color` varchar(20) DEFAULT '#3B82F6',
  `bg` varchar(30) DEFAULT 'rgba(59, 130, 246, 0.15)',
  `is_active` tinyint(1) DEFAULT '1',
  `sort_order` int DEFAULT '0',
  PRIMARY KEY (`id`) /*T![clustered_index] CLUSTERED */
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin ;

-- Table structure for table `tabungan`
DROP TABLE IF EXISTS `tabungan`;
CREATE TABLE IF NOT EXISTS `tabungan` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `siswa_id` int NOT NULL,
  `tanggal` datetime NOT NULL,
  `tipe` enum('setor','tarik') NOT NULL,
  `nominal` decimal(12,2) NOT NULL,
  `note` text DEFAULT NULL,
  `user_id` int DEFAULT NULL,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  `nama_siswa` varchar(150) DEFAULT NULL COMMENT 'Snapshot nama siswa saat transaksi tabungan',
  PRIMARY KEY (`id`) /*T![clustered_index] CLUSTERED */,
  KEY `fk_1` (`siswa_id`),
  CONSTRAINT `fk_1` FOREIGN KEY (`siswa_id`) REFERENCES `siswa` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin ;

-- Table structure for table `tagihan`
DROP TABLE IF EXISTS `tagihan`;
CREATE TABLE IF NOT EXISTS `tagihan` (
  `id` int NOT NULL AUTO_INCREMENT,
  `siswa_id` int NOT NULL,
  `kategori_id` int NOT NULL,
  `tahun_ajaran_id` int DEFAULT NULL,
  `bulan` varchar(20) DEFAULT NULL,
  `tahun` int DEFAULT NULL,
  `nominal_asli` decimal(12,2) NOT NULL,
  `nominal` decimal(12,2) NOT NULL,
  `is_diskon` tinyint(1) DEFAULT '0',
  `diskon_notes` text DEFAULT NULL,
  `status` enum('belum','lunas') DEFAULT 'belum',
  `paid_at` date DEFAULT NULL,
  `transaksi_id` bigint DEFAULT NULL,
  `kelas_id` bigint DEFAULT NULL,
  `log_generate_id` bigint DEFAULT NULL,
  `nama_kategori` varchar(150) DEFAULT NULL COMMENT 'Snapshot nama kategori tagihan saat tagihan dibuat',
  PRIMARY KEY (`id`) /*T![clustered_index] CLUSTERED */,
  KEY `fk_1` (`siswa_id`),
  KEY `fk_2` (`kategori_id`),
  KEY `fk_3` (`tahun_ajaran_id`),
  KEY `fk_tagihan_transaksi` (`transaksi_id`),
  KEY `fk_tagihan_log` (`log_generate_id`),
  CONSTRAINT `fk_1` FOREIGN KEY (`siswa_id`) REFERENCES `siswa` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_3` FOREIGN KEY (`tahun_ajaran_id`) REFERENCES `tahun_ajaran` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_tagihan_transaksi` FOREIGN KEY (`transaksi_id`) REFERENCES `transaksi` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_tagihan_log` FOREIGN KEY (`log_generate_id`) REFERENCES `log_generate` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_2` FOREIGN KEY (`kategori_id`) REFERENCES `kategori_tagihan` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin ;

-- Table structure for table `tahun_ajaran`
DROP TABLE IF EXISTS `tahun_ajaran`;
CREATE TABLE IF NOT EXISTS `tahun_ajaran` (
  `id` int NOT NULL AUTO_INCREMENT,
  `tahun` varchar(20) NOT NULL,
  `status` enum('aktif','nonaktif') DEFAULT 'nonaktif',
  `semester_aktif` enum('Ganjil','Genap') DEFAULT 'Ganjil',
  `tanggal_mulai` date DEFAULT NULL,
  `tanggal_selesai` date DEFAULT NULL,
  PRIMARY KEY (`id`) /*T![clustered_index] CLUSTERED */
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin ;

-- Table structure for table `transaksi`
DROP TABLE IF EXISTS `transaksi`;
CREATE TABLE IF NOT EXISTS `transaksi` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `invoice_no` varchar(100) NOT NULL,
  `tanggal` datetime NOT NULL,
  `siswa_id` int NOT NULL,
  `user_id` int DEFAULT NULL,
  `total` decimal(12,2) NOT NULL,
  `amount_paid` decimal(12,2) NOT NULL,
  `change_amount` decimal(12,2) DEFAULT '0',
  `status` enum('success','void','pending') DEFAULT 'success',
  PRIMARY KEY (`id`) /*T![clustered_index] CLUSTERED */,
  UNIQUE KEY `invoice_no` (`invoice_no`),
  KEY `fk_1` (`siswa_id`),
  CONSTRAINT `fk_1` FOREIGN KEY (`siswa_id`) REFERENCES `siswa` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin ;

-- Table structure for table `tujuan_pembelajaran`
DROP TABLE IF EXISTS `tujuan_pembelajaran`;
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

-- Table structure for table `units`
DROP TABLE IF EXISTS `units`;
CREATE TABLE IF NOT EXISTS `units` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nama` varchar(50) NOT NULL,
  PRIMARY KEY (`id`) /*T![clustered_index] CLUSTERED */
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin ;

-- Table structure for table `users`
DROP TABLE IF EXISTS `users`;
CREATE TABLE IF NOT EXISTS `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nama` varchar(150) DEFAULT NULL,
  `username` varchar(100) NOT NULL,
  `password_hash` varchar(255) DEFAULT NULL,
  `role` enum('admin','kasir','staf_tu','staf_keuangan','staf_perbankan','staf_infaq','guru') DEFAULT 'kasir',
  PRIMARY KEY (`id`) /*T![clustered_index] CLUSTERED */,
  UNIQUE KEY `username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin ;

-- Table structure for table `wali_kelas`
DROP TABLE IF EXISTS `wali_kelas`;
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

SET FOREIGN_KEY_CHECKS=1;
