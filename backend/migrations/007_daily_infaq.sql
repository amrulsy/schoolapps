-- Migration: 007_daily_infaq.sql
-- Description: Create tables for Daily Infaq system

CREATE TABLE IF NOT EXISTS harilibur (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tanggal DATE UNIQUE NOT NULL,
    keterangan VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS infaq_harian (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    siswa_id INT NOT NULL,
    tanggal DATE NOT NULL,
    nominal DECIMAL(12,2) NOT NULL,
    user_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (siswa_id) REFERENCES siswa(id) ON DELETE CASCADE,
    UNIQUE KEY (siswa_id, tanggal)
);
