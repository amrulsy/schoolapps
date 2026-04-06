-- ============================================================
-- SIAS SYNC V6 (SISWA & TAHUN AJARAN FIX)
-- Jalankan script ini di phpMyAdmin Hosting jika muncul error:
-- "Struktur database tidak sesuai (hubungan/alamat/semester_aktif)"
-- ============================================================

-- 1. Tambahkan kolom semester_aktif di tabel tahun_ajaran (Jika belum ada)
SET @dbname = DATABASE();
SET @tablename = 'tahun_ajaran';
SET @columnname = 'semester_aktif';
SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
   WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = @columnname) > 0,
  'SELECT 1',
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @columnname, " ENUM('Ganjil','Genap') DEFAULT 'Ganjil' AFTER status")
));
PREPARE stmt FROM @preparedStatement;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 2. Tambahkan kolom hubungan dan alamat di tabel siswa_orangtua (Jika belum ada)
SET @tablename = 'siswa_orangtua';

-- Kolom hubungan
SET @columnname = 'hubungan';
SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
   WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = @columnname) > 0,
  'SELECT 1',
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @columnname, " VARCHAR(50) NULL AFTER status_hidup")
));
PREPARE stmt FROM @preparedStatement;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Kolom alamat
SET @columnname = 'alamat';
SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
   WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = @columnname) > 0,
  'SELECT 1',
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @columnname, " TEXT NULL AFTER hubungan")
));
PREPARE stmt FROM @preparedStatement;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 3. Membuat tabel siswa_kelas_history jika belum ada
CREATE TABLE IF NOT EXISTS `siswa_kelas_history` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `siswa_id` int NOT NULL,
  `kelas_id` int NOT NULL,
  `nama_kelas` varchar(50) NOT NULL,
  `tahun_ajaran_id` int NOT NULL,
  `nama_tahun_ajaran` varchar(20) NOT NULL,
  `semester` enum('Ganjil','Genap') NOT NULL,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_siswa_kelas_ta` (`siswa_id`,`tahun_ajaran_id`,`semester`),
  KEY `fk_skh_kelas` (`kelas_id`),
  KEY `fk_skh_ta` (`tahun_ajaran_id`),
  CONSTRAINT `fk_skh_siswa` FOREIGN KEY (`siswa_id`) REFERENCES `siswa` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_skh_kelas` FOREIGN KEY (`kelas_id`) REFERENCES `kelas` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_skh_ta` FOREIGN KEY (`tahun_ajaran_id`) REFERENCES `tahun_ajaran` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Tambahkan kolom jenis_pendaftaran dan tanggal_mulai_sekolah di tabel siswa (Jika belum ada)
SET @tablename = 'siswa';

-- jenis_pendaftaran
SET @columnname = 'jenis_pendaftaran';
SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
   WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = @columnname) > 0,
  'SELECT 1',
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @columnname, " ENUM('Baru','Pindahan') DEFAULT 'Baru'")
));
PREPARE stmt FROM @preparedStatement;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- tanggal_mulai_sekolah
SET @columnname = 'tanggal_mulai_sekolah';
SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
   WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = @columnname) > 0,
  'SELECT 1',
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @columnname, " DATE NULL")
));
PREPARE stmt FROM @preparedStatement;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
