-- ==========================================
-- 006: RAPOR KURIKULUM MERDEKA
-- ==========================================

-- 1. Add semester aktif to tahun_ajaran
ALTER TABLE tahun_ajaran
  ADD COLUMN IF NOT EXISTS semester_aktif ENUM('Ganjil','Genap') DEFAULT 'Ganjil';

-- 2. Wali Kelas assignment (guru → kelas per tahun ajaran)
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
);

-- 3. Tujuan Pembelajaran (TP) per mapel/kelas/semester
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
);

-- 4. Nilai per TP per siswa (Sumatif Lingkup Materi)
CREATE TABLE IF NOT EXISTS nilai_tp (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  tp_id INT NOT NULL,
  siswa_id INT NOT NULL,
  nilai DECIMAL(5,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tp_id) REFERENCES tujuan_pembelajaran(id) ON DELETE CASCADE,
  FOREIGN KEY (siswa_id) REFERENCES siswa(id) ON DELETE CASCADE,
  UNIQUE KEY uq_nilai_tp (tp_id, siswa_id)
);

-- 5. Nilai Semester (STS, SAS, Akhir, Deskripsi)
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
);

-- 6. Catatan Wali Kelas per siswa per semester
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
);
