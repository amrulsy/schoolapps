-- ============================================
-- HOME CONTENT TABLES — Programs & Partners
-- ============================================

-- Program Keahlian
CREATE TABLE IF NOT EXISTS cms_programs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    icon VARCHAR(10) NOT NULL DEFAULT '📚',
    title VARCHAR(255) NOT NULL,
    description TEXT,
    sort_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Partner / Mitra Logos
CREATE TABLE IF NOT EXISTS cms_partners (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    logo_url VARCHAR(500) NOT NULL,
    website_url VARCHAR(500),
    sort_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Seed default programs
INSERT INTO cms_programs (icon, title, description, sort_order) VALUES
('💻', 'Teknik Komputer & Jaringan', 'Kuasai jaringan, server, dan infrastruktur IT modern untuk dunia industri digital.', 0),
('🏢', 'Otomatisasi & Tata Kelola Perkantoran', 'Pelajari manajemen perkantoran digital, administrasi, dan komunikasi profesional.', 1),
('📊', 'Akuntansi & Keuangan', 'Dalami akuntansi, perpajakan, dan pengelolaan keuangan perusahaan secara digital.', 2);

-- Seed default partners
INSERT INTO cms_partners (name, logo_url, sort_order) VALUES
('Cisco', 'https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/cisco.svg', 0),
('Microsoft', 'https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/microsoft.svg', 1),
('Oracle', 'https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/oracle.svg', 2),
('Google', 'https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/google.svg', 3),
('Intel', 'https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/intel.svg', 4);

-- Seed home content settings
INSERT IGNORE INTO cms_settings (setting_key, setting_value, setting_type, description) VALUES
('hero_title', 'Raih Masa Depan\nCemerlang Bersama\nSMK PPRQ', 'textarea', 'Judul Hero (gunakan \\n untuk baris baru)'),
('hero_highlight', 'Cemerlang Bersama', 'string', 'Teks yang di-highlight gradient pada hero'),
('hero_subtitle', 'Sekolah Menengah Kejuruan yang mencetak lulusan siap kerja, berkompetensi tinggi, dan berakhlak mulia. Bergabunglah bersama kami!', 'textarea', 'Subtitle Hero'),
('hero_badge_text', 'Penerimaan Peserta Didik Baru', 'string', 'Teks Badge Hero'),
('hero_video_url', 'https://www.youtube.com/embed/8y1PekgEC6E', 'string', 'URL Video YouTube (embed URL)'),
('programs_section_label', 'Program Keahlian', 'string', 'Label section program'),
('programs_section_title', 'Jurusan Unggulan Kami', 'string', 'Judul section program'),
('programs_section_subtitle', 'Pilih jalur kariermu dan kuasai keahlian yang dibutuhkan industri masa kini.', 'textarea', 'Subtitle section program'),
('cta_title', 'Siap Bergabung Bersama Kami?', 'string', 'Judul CTA Section'),
('cta_subtitle', 'Jangan lewatkan kesempatan emas untuk meraih masa depan yang cemerlang. Daftarkan dirimu sekarang juga!', 'textarea', 'Subtitle CTA Section'),
('cta_button_text', '✨ Daftar PPDB Sekarang', 'string', 'Teks Tombol CTA');
