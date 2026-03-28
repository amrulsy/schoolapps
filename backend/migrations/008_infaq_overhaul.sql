-- Migration: 008_infaq_overhaul.sql
-- Description: Add tahun_ajaran_id to infaq_harian for proper academic year tracking

-- 1. Add tahun_ajaran_id column
ALTER TABLE infaq_harian ADD COLUMN tahun_ajaran_id INT NULL;

-- 2. Add foreign key
ALTER TABLE infaq_harian ADD CONSTRAINT fk_infaq_ta 
    FOREIGN KEY (tahun_ajaran_id) REFERENCES tahun_ajaran(id) ON DELETE SET NULL;

-- 3. Backfill existing records: assign tahun_ajaran_id based on tanggal
UPDATE infaq_harian ih
JOIN tahun_ajaran ta ON ih.tanggal BETWEEN ta.tanggal_mulai AND ta.tanggal_selesai
SET ih.tahun_ajaran_id = ta.id
WHERE ih.tahun_ajaran_id IS NULL;

-- 4. Add index for performance
CREATE INDEX idx_infaq_ta ON infaq_harian(tahun_ajaran_id);
CREATE INDEX idx_infaq_tanggal ON infaq_harian(tanggal);
