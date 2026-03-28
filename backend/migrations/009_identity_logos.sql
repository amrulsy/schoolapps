-- ============================================
-- IDENTITY LOGOS TABLE — Dynamic Cards on Homepage
-- ============================================

CREATE TABLE IF NOT EXISTS cms_identity_logos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    label VARCHAR(100) NOT NULL DEFAULT 'Identitas',
    name VARCHAR(255) NOT NULL,
    logo_url VARCHAR(500),
    color_class VARCHAR(50) DEFAULT 'yayasan',
    sort_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Seed default entries
INSERT INTO cms_identity_logos (label, name, logo_url, color_class, sort_order) VALUES
('Yayasan', 'Yayasan Pendidikan PPRQ', NULL, 'yayasan', 0),
('Sekolah', 'SMK PPRQ', NULL, 'jurusan', 1),
('Pramuka', 'Gudep PPRQ', NULL, 'pramuka', 2);
