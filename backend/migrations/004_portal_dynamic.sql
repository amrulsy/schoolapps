-- ==========================================
-- 003_portal_dynamic.sql
-- Tables: cms_ppdb_steps, cms_ppdb_requirements
-- Settings: school/contact/footer keys
-- ==========================================

-- PPDB Steps (Langkah-langkah Pendaftaran)
CREATE TABLE IF NOT EXISTS cms_ppdb_steps (
    id INT AUTO_INCREMENT PRIMARY KEY,
    step_number VARCHAR(10) NOT NULL DEFAULT '01',
    icon VARCHAR(50) DEFAULT '📋',
    title VARCHAR(255) NOT NULL,
    description TEXT,
    sort_order INT DEFAULT 0,
    is_active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- PPDB Requirements (Syarat Dokumen)
CREATE TABLE IF NOT EXISTS cms_ppdb_requirements (
    id INT AUTO_INCREMENT PRIMARY KEY,
    text VARCHAR(500) NOT NULL,
    sort_order INT DEFAULT 0,
    is_active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Seed default PPDB steps
INSERT INTO cms_ppdb_steps (step_number, icon, title, description, sort_order) VALUES
('01', '📋', 'Daftar Online', 'Isi formulir pendaftaran secara lengkap.', 0),
('02', '✅', 'Verifikasi Data', 'Validasi dokumen oleh panitia.', 1),
('03', '🎓', 'Tes & Wawancara', 'Seleksi akademik dan minat bakat.', 2),
('04', '➡️', 'Pendaftaran Ulang', 'Penyelesaian administrasi akhir.', 3);

-- Seed default PPDB requirements
INSERT INTO cms_ppdb_requirements (text, sort_order) VALUES
('Fotokopi Ijazah / SKL', 0),
('Fotokopi Kartu Keluarga (KK)', 1),
('Pas Foto 3x4 (4 lembar)', 2),
('Fotokopi Akta Kelahiran', 3);

-- Insert school/contact/footer settings (ignore if already exists)
INSERT IGNORE INTO cms_settings (setting_key, setting_value, setting_type, description) VALUES
('school_name', 'SMK PPRQ', 'string', 'Nama sekolah'),
('school_tagline', 'Mencetak generasi unggul yang berakhlak mulia, berkompetensi tinggi, dan siap menghadapi tantangan dunia kerja global.', 'string', 'Tagline/deskripsi sekolah'),
('footer_description', 'Mencetak generasi unggul yang berakhlak mulia, berkompetensi tinggi, dan siap menghadapi tantangan dunia kerja global.', 'string', 'Deskripsi di footer portal'),
('contact_address', 'Jl. Pendidikan No. 1, Jakarta', 'string', 'Alamat sekolah'),
('contact_phone', '021-XXXXXXX', 'string', 'Nomor telepon sekolah'),
('contact_email', 'info@smkpprq.sch.id', 'string', 'Email sekolah'),
('contact_hours', 'Senin - Jumat: 07:00 - 15:00 WIB', 'string', 'Jam operasional'),
('contact_maps_embed', '', 'string', 'Google Maps embed URL');
