-- ============================================
-- CMS MODULE — NEW TABLES (MySQL/TiDB)
-- ============================================

DROP TABLE IF EXISTS cms_banners;
DROP TABLE IF EXISTS cms_pages;
DROP TABLE IF EXISTS cms_settings;
DROP TABLE IF EXISTS cms_contacts;
DROP TABLE IF EXISTS cms_posts;
DROP TABLE IF EXISTS cms_media;

-- 1. PENGUMUMAN / ARTIKEL
CREATE TABLE IF NOT EXISTS cms_posts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    slug VARCHAR(255) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    excerpt TEXT,
    content LONGTEXT NOT NULL,
    cover_image VARCHAR(500),
    category ENUM('pengumuman', 'artikel', 'berita') DEFAULT 'pengumuman',
    status ENUM('draft', 'published', 'archived') DEFAULT 'draft',
    is_pinned BOOLEAN DEFAULT FALSE,
    author_id INT,
    published_at DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE SET NULL
);

-- 2. BANNER / HERO SLIDE
CREATE TABLE IF NOT EXISTS cms_banners (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    subtitle VARCHAR(500),
    image_url VARCHAR(500) NOT NULL,
    link_url VARCHAR(500),
    sort_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. HALAMAN STATIS
CREATE TABLE IF NOT EXISTS cms_pages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    slug VARCHAR(100) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    content LONGTEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    meta_description VARCHAR(300),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 4. KONFIGURASI WEBSITE
CREATE TABLE IF NOT EXISTS cms_settings (
    setting_key VARCHAR(100) PRIMARY KEY,
    setting_value TEXT NOT NULL,
    setting_type VARCHAR(50) DEFAULT 'string',
    description VARCHAR(255)
);

-- 5. MEDIA LIBRARY
CREATE TABLE IF NOT EXISTS cms_media (
    id INT AUTO_INCREMENT PRIMARY KEY,
    filename VARCHAR(255) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    mimetype VARCHAR(100),
    size INT,
    path VARCHAR(500) NOT NULL,
    uploaded_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL
);

-- 6. PESAN KONTAK
CREATE TABLE IF NOT EXISTS cms_contacts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    email VARCHAR(150),
    phone VARCHAR(20),
    subject VARCHAR(255),
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

