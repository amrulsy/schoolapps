-- ============================================
-- ATTENDANCE FEATURE PATCH v2
-- Adds: jam_masuk/jam_pulang to siswa_presensi,
--        unique index on attendances,
--        wa_notification_log table
-- ============================================

-- R-1: Add jam_masuk and jam_pulang columns to siswa_presensi for table unification
ALTER TABLE `siswa_presensi` 
  ADD COLUMN `jam_masuk` DATETIME DEFAULT NULL AFTER `status`,
  ADD COLUMN `jam_pulang` DATETIME DEFAULT NULL AFTER `jam_masuk`;

-- R-4: Unique index on attendances to prevent race-condition duplicates
-- (May fail if duplicates already exist — clean up first if needed)
ALTER TABLE `attendances` 
  ADD UNIQUE KEY `uq_student_date` (`student_id`, `tanggal`);

-- R-5: WA Notification Log table
CREATE TABLE IF NOT EXISTS `wa_notification_log` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `siswa_id` int NOT NULL,
  `phone` varchar(20) NOT NULL,
  `message_type` varchar(50) DEFAULT NULL COMMENT 'masuk, terlambat, pulang, alpha, sakit, izin',
  `status` enum('sent','failed','pending') DEFAULT 'pending',
  `error_message` text DEFAULT NULL,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_wa_log_siswa` (`siswa_id`),
  KEY `idx_wa_log_date` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
