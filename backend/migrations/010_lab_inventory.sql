-- ==========================================
-- LAB INVENTORY BORROWING SYSTEM
-- Migration 010
-- ==========================================

-- Kategori inventaris (Kamera, Lensa, Pen Tablet, dsb.)
CREATE TABLE IF NOT EXISTS lab_kategori (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nama VARCHAR(150) NOT NULL,
    icon VARCHAR(50) DEFAULT '📦',
    deskripsi TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Master inventaris
CREATE TABLE IF NOT EXISTS lab_inventaris (
    id INT AUTO_INCREMENT PRIMARY KEY,
    kategori_id INT NOT NULL,
    kode VARCHAR(50) UNIQUE NOT NULL,
    nama VARCHAR(200) NOT NULL,
    merk VARCHAR(100),
    spesifikasi TEXT,
    kondisi ENUM('baik','rusak_ringan','rusak_berat') DEFAULT 'baik',
    status ENUM('tersedia','dipinjam','maintenance') DEFAULT 'tersedia',
    lokasi VARCHAR(100),
    foto VARCHAR(255),
    nilai_aset DECIMAL(12,2),
    tanggal_perolehan DATE,
    catatan TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (kategori_id) REFERENCES lab_kategori(id) ON DELETE RESTRICT
);

-- Log peminjaman
CREATE TABLE IF NOT EXISTS lab_peminjaman (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    inventaris_id INT NOT NULL,
    siswa_id INT NOT NULL,
    user_id INT,
    tanggal_pinjam DATETIME NOT NULL,
    tanggal_kembali DATETIME,
    batas_kembali DATETIME NOT NULL,
    kondisi_pinjam ENUM('baik','rusak_ringan','rusak_berat') DEFAULT 'baik',
    kondisi_kembali ENUM('baik','rusak_ringan','rusak_berat'),
    status ENUM('dipinjam','dikembalikan','terlambat') DEFAULT 'dipinjam',
    catatan TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (inventaris_id) REFERENCES lab_inventaris(id) ON DELETE RESTRICT,
    FOREIGN KEY (siswa_id) REFERENCES siswa(id) ON DELETE CASCADE
);

-- Settings (key-value)
CREATE TABLE IF NOT EXISTS lab_settings (
    `key` VARCHAR(100) PRIMARY KEY,
    value TEXT
);

-- Default settings
INSERT IGNORE INTO lab_settings (`key`, value) VALUES
    ('batas_pinjam_hari', '1'),
    ('max_pinjam_per_siswa', '2'),
    ('wa_notification_enabled', 'false'),
    ('wa_template_pinjam', '*📦 PEMINJAMAN INVENTARIS LAB*\n\nNama: *[nama]*\nItem: *[item]*\nKode: *[kode]*\nWaktu Pinjam: *[waktu]*\nBatas Kembali: *[batas]*\n\nMohon dikembalikan tepat waktu. Terima kasih. 🙏'),
    ('wa_template_kembali', '*✅ PENGEMBALIAN INVENTARIS LAB*\n\nNama: *[nama]*\nItem: *[item]*\nKode: *[kode]*\nWaktu Kembali: *[waktu]*\n\nTerima kasih telah mengembalikan tepat waktu. 🙏');
