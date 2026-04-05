-- ==========================================
-- 013: SNAPSHOT COLUMNS (DENORMALISASI)
-- ==========================================
-- Tujuan:
--   Menambah kolom snapshot nama agar laporan historis tidak bergantung
--   pada JOIN ke master data yang bisa berubah (nama kelas, nama guru,
--   nama mapel, nama siswa). Laporan tahun lalu tetap terbaca dengan benar
--   walaupun data master sudah diubah.

-- 1. jurnal_mengajar: snapshot nama kelas, mapel, guru
ALTER TABLE jurnal_mengajar
    ADD COLUMN IF NOT EXISTS nama_kelas VARCHAR(50)  NULL COMMENT 'Snapshot nama kelas saat jurnal dibuat',
    ADD COLUMN IF NOT EXISTS nama_mapel VARCHAR(150) NULL COMMENT 'Snapshot nama mata pelajaran saat jurnal dibuat',
    ADD COLUMN IF NOT EXISTS nama_guru  VARCHAR(150) NULL COMMENT 'Snapshot nama guru saat jurnal dibuat';

-- 2. presensi_sesi: snapshot nama siswa dan NIS
ALTER TABLE presensi_sesi
    ADD COLUMN IF NOT EXISTS nama_siswa VARCHAR(150) NULL COMMENT 'Snapshot nama siswa saat presensi dicatat',
    ADD COLUMN IF NOT EXISTS nis        VARCHAR(20)  NULL COMMENT 'Snapshot NIS siswa saat presensi dicatat';

-- 3. infaq_harian: snapshot nama siswa dan NIS
ALTER TABLE infaq_harian
    ADD COLUMN IF NOT EXISTS nama_siswa VARCHAR(150) NULL COMMENT 'Snapshot nama siswa saat infaq dicatat',
    ADD COLUMN IF NOT EXISTS nis        VARCHAR(20)  NULL COMMENT 'Snapshot NIS siswa saat infaq dicatat';

-- 4. tabungan: snapshot nama siswa
ALTER TABLE tabungan
    ADD COLUMN IF NOT EXISTS nama_siswa VARCHAR(150) NULL COMMENT 'Snapshot nama siswa saat transaksi tabungan';

-- 5. tagihan: snapshot nama kategori (karena kategori bisa dihapus/berganti nama)
ALTER TABLE tagihan
    ADD COLUMN IF NOT EXISTS nama_kategori VARCHAR(150) NULL COMMENT 'Snapshot nama kategori tagihan saat tagihan dibuat';

-- Index untuk presensi jika di-query by nama (untuk laporan tanpa JOIN)
CREATE INDEX IF NOT EXISTS idx_presensi_sesi_nis ON presensi_sesi(nis);
CREATE INDEX IF NOT EXISTS idx_infaq_nis         ON infaq_harian(nis);
