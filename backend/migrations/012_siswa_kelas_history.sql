-- ==========================================
-- 012: SISWA KELAS HISTORY + CASHFLOW AUDIT
-- ==========================================
-- Tujuan:
--   1. Menyimpan snapshot kelas siswa per tahun ajaran/semester
--      agar laporan historis tetap akurat setelah siswa naik kelas.
--   2. Menambah audit trail keuangan per siswa ke cashflow.

-- 1. Tabel snapshot kelas siswa per tahun ajaran
CREATE TABLE IF NOT EXISTS siswa_kelas_history (
    id               BIGINT AUTO_INCREMENT PRIMARY KEY,
    siswa_id         INT NOT NULL,
    kelas_id         INT NOT NULL,
    -- Snapshot nama kelas saat itu (agar tetap terbaca walau kelas dihapus/diganti)
    nama_kelas       VARCHAR(50) NOT NULL,
    tahun_ajaran_id  INT NOT NULL,
    -- Snapshot string tahun ajaran (e.g. "2024/2025") agar tetap terbaca selamanya
    nama_tahun_ajaran VARCHAR(20) NOT NULL,
    semester         ENUM('Ganjil','Genap') NOT NULL,
    created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (siswa_id)        REFERENCES siswa(id)        ON DELETE RESTRICT,
    FOREIGN KEY (kelas_id)        REFERENCES kelas(id)        ON DELETE RESTRICT,
    FOREIGN KEY (tahun_ajaran_id) REFERENCES tahun_ajaran(id) ON DELETE RESTRICT,
    -- Satu siswa hanya boleh ada di satu kelas per tahun ajaran per semester
    UNIQUE KEY uq_siswa_kelas_ta (siswa_id, tahun_ajaran_id, semester)
);

-- Index untuk performa lookup per kelas atau per tahun ajaran
CREATE INDEX IF NOT EXISTS idx_skh_kelas ON siswa_kelas_history(kelas_id, tahun_ajaran_id);
CREATE INDEX IF NOT EXISTS idx_skh_siswa ON siswa_kelas_history(siswa_id);

-- 2. Tambah kolom audit trail ke cashflow
--    Agar laporan keuangan bisa difilter per siswa atau per tahun ajaran
ALTER TABLE cashflow
    ADD COLUMN IF NOT EXISTS siswa_id INT NULL COMMENT 'Referensi siswa jika cashflow terkait pembayaran siswa',
    ADD COLUMN IF NOT EXISTS tahun_ajaran_id INT NULL COMMENT 'Referensi tahun ajaran untuk filter laporan';

-- Index untuk performa filter
CREATE INDEX IF NOT EXISTS idx_cashflow_siswa ON cashflow(siswa_id);
CREATE INDEX IF NOT EXISTS idx_cashflow_ta    ON cashflow(tahun_ajaran_id);
