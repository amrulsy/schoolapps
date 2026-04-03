-- ============================================
-- PPDB MODULE — NEW TABLES (MySQL/TiDB)
-- ============================================

DROP TABLE IF EXISTS ppdb_registrations;

CREATE TABLE IF NOT EXISTS ppdb_registrations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    registration_number VARCHAR(50) UNIQUE NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    pin_rahasia VARCHAR(255) NOT NULL,
    nama_lengkap VARCHAR(255) NOT NULL,
    tempat_lahir VARCHAR(100),
    tgl_lahir DATE,
    jenis_kelamin ENUM('L', 'P') NOT NULL,
    agama VARCHAR(50),
    asal_sekolah VARCHAR(255) NOT NULL,
    no_whatsapp VARCHAR(20) NOT NULL,
    alamat_lengkap TEXT NOT NULL,
    nisn VARCHAR(20) NULL,
    biodata_tambahan JSON NULL,
    status ENUM('draft', 'pending_verification', 'wawancara', 'accepted', 'rejected') DEFAULT 'draft',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
