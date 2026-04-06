-- ============================================================
-- SQL PATCH FOR HOSTING (MISSING TABLES & COLUMNS)
-- Digunakan untuk sinkronisasi Database Hosting agar 100% 
-- sesuai dengan struktur Development (Local)
-- ============================================================

-- ============================================================
-- 1. TABEL YANG HILANG DARI HOSTING (MODUL RAPOR MERDEKA & WALI KELAS)
-- ============================================================

CREATE TABLE IF NOT EXISTS wali_kelas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  guru_id INT NOT NULL,
  kelas_id INT NOT NULL,
  tahun_ajaran_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (guru_id) REFERENCES guru(id) ON DELETE CASCADE,
  FOREIGN KEY (kelas_id) REFERENCES kelas(id) ON DELETE CASCADE,
  FOREIGN KEY (tahun_ajaran_id) REFERENCES tahun_ajaran(id) ON DELETE CASCADE,
  UNIQUE KEY uq_wali_kelas (kelas_id, tahun_ajaran_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS tujuan_pembelajaran (
  id INT AUTO_INCREMENT PRIMARY KEY,
  mapel_id INT NOT NULL,
  kelas_id INT NOT NULL,
  tahun_ajaran_id INT NOT NULL,
  semester ENUM('Ganjil','Genap') NOT NULL,
  kode VARCHAR(20) NOT NULL,
  deskripsi TEXT NOT NULL,
  guru_id INT NOT NULL,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (mapel_id) REFERENCES mata_pelajaran(id) ON DELETE CASCADE,
  FOREIGN KEY (kelas_id) REFERENCES kelas(id) ON DELETE CASCADE,
  FOREIGN KEY (tahun_ajaran_id) REFERENCES tahun_ajaran(id) ON DELETE CASCADE,
  FOREIGN KEY (guru_id) REFERENCES guru(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS nilai_tp (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  tp_id INT NOT NULL,
  siswa_id INT NOT NULL,
  nilai DECIMAL(5,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tp_id) REFERENCES tujuan_pembelajaran(id) ON DELETE CASCADE,
  FOREIGN KEY (siswa_id) REFERENCES siswa(id) ON DELETE CASCADE,
  UNIQUE KEY uq_nilai_tp (tp_id, siswa_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS nilai_semester (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  siswa_id INT NOT NULL,
  mapel_id INT NOT NULL,
  kelas_id INT NOT NULL,
  tahun_ajaran_id INT NOT NULL,
  semester ENUM('Ganjil','Genap') NOT NULL,
  nilai_tp_rata DECIMAL(5,2) DEFAULT 0,
  sts DECIMAL(5,2) DEFAULT 0,
  sas DECIMAL(5,2) DEFAULT 0,
  nilai_akhir DECIMAL(5,2) DEFAULT 0,
  deskripsi TEXT,
  is_locked BOOLEAN DEFAULT FALSE,
  locked_at DATETIME,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (siswa_id) REFERENCES siswa(id) ON DELETE CASCADE,
  FOREIGN KEY (mapel_id) REFERENCES mata_pelajaran(id) ON DELETE CASCADE,
  FOREIGN KEY (tahun_ajaran_id) REFERENCES tahun_ajaran(id) ON DELETE CASCADE,
  UNIQUE KEY uq_nilai_semester (siswa_id, mapel_id, kelas_id, tahun_ajaran_id, semester)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS rapor_catatan (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  siswa_id INT NOT NULL,
  kelas_id INT NOT NULL,
  tahun_ajaran_id INT NOT NULL,
  semester ENUM('Ganjil','Genap') NOT NULL,
  catatan TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (siswa_id) REFERENCES siswa(id) ON DELETE CASCADE,
  UNIQUE KEY uq_rapor_catatan (siswa_id, kelas_id, tahun_ajaran_id, semester)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS rapor_ekskul (
  id INT AUTO_INCREMENT PRIMARY KEY,
  siswa_id INT NOT NULL,
  kelas_id INT NOT NULL,
  tahun_ajaran_id INT NOT NULL,
  semester ENUM('Ganjil','Genap') NOT NULL,
  nama_ekskul VARCHAR(150) NOT NULL,
  keterangan TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (siswa_id) REFERENCES siswa(id) ON DELETE CASCADE,
  FOREIGN KEY (kelas_id) REFERENCES kelas(id) ON DELETE CASCADE,
  FOREIGN KEY (tahun_ajaran_id) REFERENCES tahun_ajaran(id) ON DELETE CASCADE,
  UNIQUE KEY uq_rapor_ekskul (siswa_id, kelas_id, tahun_ajaran_id, semester, nama_ekskul)
) ENGINE=InnoDB;


-- ============================================================
-- 2. SNAPSHOT COLUMNS YANG HILANG DARI HOSTING (UNTUK LAPORAN)
-- ============================================================

-- Tambahkan snapshot nama siswa dan NIS di presensi_sesi
ALTER TABLE presensi_sesi
    ADD COLUMN IF NOT EXISTS nama_siswa VARCHAR(150) NULL COMMENT 'Snapshot nama siswa saat presensi dicatat',
    ADD COLUMN IF NOT EXISTS nis VARCHAR(20) NULL COMMENT 'Snapshot NIS siswa saat presensi dicatat';

-- Tambahkan snapshot nama kategori di tagihan
ALTER TABLE tagihan
    ADD COLUMN IF NOT EXISTS nama_kategori VARCHAR(150) NULL COMMENT 'Snapshot nama kategori tagihan saat tagihan dibuat';


-- ============================================================
-- 3. INDEX & CONSTRAINTS YANG HILANG
-- ============================================================

-- Index untuk performa pencarian presensi & infaq (Jika belum ada)
CREATE INDEX idx_presensi_sesi_nis ON presensi_sesi(nis);
CREATE INDEX idx_infaq_nis ON infaq_harian(nis);

-- Menambahkan Foreign Key untuk infaq harian ke tahun ajaran
-- Catatan: Pastikan tabel infaq_harian sudah bersih dari tahun_ajaran_id yang salah sebelum foreign key aktif
ALTER TABLE infaq_harian 
    ADD CONSTRAINT fk_infaq_ta FOREIGN KEY (tahun_ajaran_id) REFERENCES tahun_ajaran(id) ON DELETE SET NULL;

CREATE INDEX idx_infaq_ta ON infaq_harian(tahun_ajaran_id);
CREATE INDEX idx_infaq_tanggal ON infaq_harian(tanggal);
