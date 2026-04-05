-- ==========================================
-- 007: RAPOR EKSTRAKURIKULER
-- ==========================================

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
);
