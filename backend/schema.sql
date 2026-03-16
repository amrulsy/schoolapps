-- ==========================================
-- SIAS SMK PPRQ DATABASE SCHEMA
-- ==========================================

CREATE TABLE IF NOT EXISTS units (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nama VARCHAR(50) NOT NULL
);

CREATE TABLE IF NOT EXISTS kelas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    unit_id INT NOT NULL,
    nama VARCHAR(50) NOT NULL,
    FOREIGN KEY (unit_id) REFERENCES units(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS tahun_ajaran (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tahun VARCHAR(20) NOT NULL,
    status ENUM('aktif', 'nonaktif') DEFAULT 'nonaktif'
);

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nama VARCHAR(150),
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('admin', 'kasir') DEFAULT 'kasir'
);

CREATE TABLE IF NOT EXISTS kategori_tagihan (
    id INT AUTO_INCREMENT PRIMARY KEY,
    kode VARCHAR(50) UNIQUE NOT NULL,
    nama VARCHAR(150) NOT NULL,
    nominal DECIMAL(12,2) NOT NULL,
    tipe ENUM('bulanan', '3bulanan', 'semesteran', 'tahunan', 'insidentil') NOT NULL,
    keterangan TEXT
);

CREATE TABLE IF NOT EXISTS siswa (
    id INT AUTO_INCREMENT PRIMARY KEY,
    kelas_id INT,
    nisn VARCHAR(20) UNIQUE,
    nis VARCHAR(20) UNIQUE,
    nama VARCHAR(150) NOT NULL,
    jk ENUM('L', 'P') NOT NULL,
    status ENUM('aktif', 'lulus', 'pindah', 'keluar') DEFAULT 'aktif',
    tempat_lahir VARCHAR(100),
    tgl_lahir DATE,
    kewarganegaraan VARCHAR(10),
    agama VARCHAR(20),
    jurusan VARCHAR(50),
    angkatan VARCHAR(10),
    email VARCHAR(150),
    telp VARCHAR(20),
    asal_sekolah VARCHAR(150),
    nik VARCHAR(20),
    no_kk VARCHAR(20),
    anak_ke INT,
    jml_saudara INT,
    hobby VARCHAR(100),
    cita_cita VARCHAR(100),
    no_reg VARCHAR(50) UNIQUE,
    bb FLOAT,
    tb FLOAT,
    gol_darah VARCHAR(5),
    riwayat_penyakit TEXT,
    kebutuhan_khusus VARCHAR(50),
    alamat TEXT,
    rt VARCHAR(5),
    rw VARCHAR(5),
    kodepos VARCHAR(10),
    kelurahan VARCHAR(100),
    kecamatan VARCHAR(100),
    kabupaten VARCHAR(100),
    provinsi VARCHAR(100),
    jenis_tinggal VARCHAR(50),
    FOREIGN KEY (kelas_id) REFERENCES kelas(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS siswa_orangtua (
    id INT AUTO_INCREMENT PRIMARY KEY,
    siswa_id INT NOT NULL,
    jenis ENUM('ayah', 'ibu') NOT NULL,
    nama VARCHAR(150),
    nik VARCHAR(20),
    pendidikan VARCHAR(50),
    pekerjaan VARCHAR(100),
    penghasilan DECIMAL(12,2),
    hp VARCHAR(20),
    status_hidup ENUM('Hidup', 'Meninggal') DEFAULT 'Hidup',
    FOREIGN KEY (siswa_id) REFERENCES siswa(id) ON DELETE CASCADE,
    UNIQUE KEY (siswa_id, jenis)
);

CREATE TABLE IF NOT EXISTS siswa_dokumen (
    id INT AUTO_INCREMENT PRIMARY KEY,
    siswa_id INT NOT NULL,
    kode_dokumen VARCHAR(20) NOT NULL,
    nama_dokumen VARCHAR(100),
    status ENUM('Terverifikasi', 'Belum Verifikasi', 'Tidak Ada') DEFAULT 'Tidak Ada',
    file_size VARCHAR(20),
    file_path VARCHAR(255),
    FOREIGN KEY (siswa_id) REFERENCES siswa(id) ON DELETE CASCADE,
    UNIQUE KEY (siswa_id, kode_dokumen)
);

CREATE TABLE IF NOT EXISTS tagihan (
    id INT AUTO_INCREMENT PRIMARY KEY,
    siswa_id INT NOT NULL,
    kategori_id INT NOT NULL,
    tahun_ajaran_id INT,
    bulan VARCHAR(20),
    tahun INT,
    nominal_asli DECIMAL(12,2) NOT NULL,
    nominal DECIMAL(12,2) NOT NULL,
    is_diskon BOOLEAN DEFAULT FALSE,
    diskon_notes TEXT,
    status ENUM('belum', 'lunas') DEFAULT 'belum',
    paid_at DATE NULL,
    FOREIGN KEY (siswa_id) REFERENCES siswa(id) ON DELETE CASCADE,
    FOREIGN KEY (kategori_id) REFERENCES kategori_tagihan(id) ON DELETE CASCADE,
    FOREIGN KEY (tahun_ajaran_id) REFERENCES tahun_ajaran(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS transaksi (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    invoice_no VARCHAR(100) UNIQUE NOT NULL,
    tanggal DATETIME NOT NULL,
    siswa_id INT NOT NULL,
    user_id INT,
    total DECIMAL(12,2) NOT NULL,
    amount_paid DECIMAL(12,2) NOT NULL,
    change_amount DECIMAL(12,2) DEFAULT 0,
    status ENUM('success', 'void', 'pending') DEFAULT 'success',
    FOREIGN KEY (siswa_id) REFERENCES siswa(id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS cashflow (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tanggal DATETIME NOT NULL,
    keterangan TEXT NOT NULL,
    nominal DECIMAL(12,2) NOT NULL,
    tipe ENUM('masuk', 'keluar') NOT NULL,
    ref VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
