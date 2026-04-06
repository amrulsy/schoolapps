-- ========================================================
-- SIAS SMK PPRQ - DATABASE SCHEMA FIX V4 (STUDENT MANAGEMENT)
-- ========================================================
-- Jalankan script ini di phpMyAdmin pada database hosting Anda
-- untuk memperbaiki error "Gagal Menambah/Edit Siswa".

-- 1. UPDATE TABEL SISWA_ORANGTUA (Penting untuk Edit Profil)
-- Menambahkan kolom yang dibutuhkan oleh backend tapi belum ada di DB
ALTER TABLE siswa_orangtua MODIFY COLUMN jenis ENUM('ayah', 'ibu', 'wali') NOT NULL;
ALTER TABLE siswa_orangtua ADD COLUMN IF NOT EXISTS hubungan VARCHAR(50) AFTER hp;
ALTER TABLE siswa_orangtua ADD COLUMN IF NOT EXISTS alamat TEXT AFTER hubungan;

-- 2. UPDATE TABEL TAHUN_AJARAN (Penting untuk Fitur History)
ALTER TABLE tahun_ajaran ADD COLUMN IF NOT EXISTS semester_aktif ENUM('Ganjil','Genap') DEFAULT 'Ganjil';

-- 3. BUAT TABEL SISWA_KELAS_HISTORY (Penting untuk Tracking Naik Kelas)
CREATE TABLE IF NOT EXISTS siswa_kelas_history (
    id               BIGINT AUTO_INCREMENT PRIMARY KEY,
    siswa_id         INT NOT NULL,
    kelas_id         INT NOT NULL,
    nama_kelas       VARCHAR(50) NOT NULL,
    tahun_ajaran_id  INT NOT NULL,
    nama_tahun_ajaran VARCHAR(20) NOT NULL,
    semester         ENUM('Ganjil','Genap') NOT NULL,
    created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (siswa_id)        REFERENCES siswa(id)        ON DELETE RESTRICT,
    FOREIGN KEY (kelas_id)        REFERENCES kelas(id)        ON DELETE RESTRICT,
    FOREIGN KEY (tahun_ajaran_id) REFERENCES tahun_ajaran(id) ON DELETE RESTRICT,
    UNIQUE KEY uq_siswa_kelas_ta (siswa_id, tahun_ajaran_id, semester)
);

-- 4. PASTIKAN TABEL SISWA MEMILIKI RFID_UID
ALTER TABLE siswa ADD COLUMN IF NOT EXISTS rfid_uid VARCHAR(50) UNIQUE AFTER nis;

-- 5. TAMBAHKAN KOLOM SNAPSHOT NAMA (Agar Laporan Lama Tetap Akurat)
-- Ini memastikan data tahun lalu tidak berubah jika nama siswa diubah saat ini
ALTER TABLE jurnal_mengajar ADD COLUMN IF NOT EXISTS nama_kelas VARCHAR(50) NULL;
ALTER TABLE jurnal_mengajar ADD COLUMN IF NOT EXISTS nama_mapel VARCHAR(150) NULL;
ALTER TABLE jurnal_mengajar ADD COLUMN IF NOT EXISTS nama_guru VARCHAR(150) NULL;

-- 6. TAMBAHKAN KONFIGURASI DEFAULT (Jika belum ada)
INSERT IGNORE INTO attendance_settings (`key`, `value`) VALUES 
('late_threshold_time', '07:30'),
('entry_start_time', '06:00'),
('exit_min_gap_minutes', '60'),
('exit_start_time', '14:00'),
('exit_rule_type', 'either'),
('wa_notification_enabled', 'false');
