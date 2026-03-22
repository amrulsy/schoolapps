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
    role ENUM('admin', 'kasir', 'guru') DEFAULT 'kasir'
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
    transaksi_id BIGINT,
    FOREIGN KEY (siswa_id) REFERENCES siswa(id) ON DELETE CASCADE,
    FOREIGN KEY (kategori_id) REFERENCES kategori_tagihan(id) ON DELETE CASCADE,
    FOREIGN KEY (tahun_ajaran_id) REFERENCES tahun_ajaran(id) ON DELETE SET NULL,
    FOREIGN KEY (transaksi_id) REFERENCES transaksi(id) ON DELETE SET NULL
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

CREATE TABLE IF NOT EXISTS student_menus (
    id INT AUTO_INCREMENT PRIMARY KEY,
    label VARCHAR(100) NOT NULL,
    icon VARCHAR(50) NOT NULL,
    path VARCHAR(255) NOT NULL,
    color VARCHAR(20) DEFAULT '#3B82F6',
    bg VARCHAR(30) DEFAULT 'rgba(59, 130, 246, 0.15)',
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS siswa_presensi (
    id INT AUTO_INCREMENT PRIMARY KEY,
    siswa_id INT NOT NULL,
    tanggal DATE NOT NULL,
    status ENUM('hadir', 'sakit', 'izin', 'alpha') NOT NULL,
    keterangan TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (siswa_id) REFERENCES siswa(id) ON DELETE CASCADE,
    UNIQUE KEY (siswa_id, tanggal)
);

CREATE TABLE IF NOT EXISTS tabungan (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    siswa_id INT NOT NULL,
    tanggal DATETIME NOT NULL,
    tipe ENUM('setor', 'tarik') NOT NULL,
    nominal DECIMAL(12,2) NOT NULL,
    note TEXT,
    user_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (siswa_id) REFERENCES siswa(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS bk_kategori (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nama VARCHAR(150) NOT NULL,
    tipe ENUM('pelanggaran', 'prestasi') NOT NULL,
    poin INT NOT NULL
);

CREATE TABLE IF NOT EXISTS bk_catatan (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    siswa_id INT NOT NULL,
    bk_kategori_id INT NOT NULL,
    tanggal DATE NOT NULL,
    keterangan TEXT,
    poin INT NOT NULL,
    user_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (siswa_id) REFERENCES siswa(id) ON DELETE CASCADE,
    FOREIGN KEY (bk_kategori_id) REFERENCES bk_kategori(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS mata_pelajaran (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nama VARCHAR(150) NOT NULL,
    tingkat VARCHAR(20)
);

CREATE TABLE IF NOT EXISTS nilai_siswa (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    siswa_id INT NOT NULL,
    mapel_id INT NOT NULL,
    tahun_ajaran_id INT NOT NULL,
    semester ENUM('Ganjil', 'Genap') NOT NULL,
    tugas DECIMAL(5,2) DEFAULT 0,
    uts DECIMAL(5,2) DEFAULT 0,
    uas DECIMAL(5,2) DEFAULT 0,
    akhir DECIMAL(5,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (siswa_id) REFERENCES siswa(id) ON DELETE CASCADE,
    FOREIGN KEY (mapel_id) REFERENCES mata_pelajaran(id) ON DELETE CASCADE,
    FOREIGN KEY (tahun_ajaran_id) REFERENCES tahun_ajaran(id) ON DELETE CASCADE,
    UNIQUE KEY (siswa_id, mapel_id, tahun_ajaran_id, semester)
);

CREATE TABLE IF NOT EXISTS pesan (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    pengirim_id INT NOT NULL,
    pengirim_type ENUM('admin', 'student') NOT NULL,
    penerima_id INT NOT NULL,
    penerima_type ENUM('admin', 'student') NOT NULL,
    pesan TEXT NOT NULL,
    waktu DATETIME NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS guru (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nip VARCHAR(50) UNIQUE,
    nama VARCHAR(150) NOT NULL,
    user_id INT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS jam_pelajaran (
    id INT AUTO_INCREMENT PRIMARY KEY,
    jam_ke INT UNIQUE NOT NULL,
    jam_mulai TIME NOT NULL,
    jam_selesai TIME NOT NULL,
    tipe ENUM('Pelajaran', 'Istirahat') DEFAULT 'Pelajaran'
);

CREATE TABLE IF NOT EXISTS jadwal_pelajaran (
    id INT AUTO_INCREMENT PRIMARY KEY,
    guru_id INT NOT NULL,
    kelas_id INT NOT NULL,
    mapel_id INT NOT NULL,
    hari ENUM('Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu') NOT NULL,
    jam_pelajaran_id INT NOT NULL,
    FOREIGN KEY (guru_id) REFERENCES guru(id) ON DELETE CASCADE,
    FOREIGN KEY (kelas_id) REFERENCES kelas(id) ON DELETE CASCADE,
    FOREIGN KEY (mapel_id) REFERENCES mata_pelajaran(id) ON DELETE CASCADE,
    FOREIGN KEY (jam_pelajaran_id) REFERENCES jam_pelajaran(id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS jurnal_mengajar (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    guru_id INT NOT NULL,
    jadwal_id INT,
    kelas_id INT NOT NULL,
    mapel_id INT NOT NULL,
    tanggal DATE NOT NULL,
    waktu_masuk_aktual TIME,
    waktu_keluar_aktual TIME,
    materi TEXT,
    status_jurnal ENUM('Running', 'Selesai') DEFAULT 'Running',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (guru_id) REFERENCES guru(id) ON DELETE CASCADE,
    FOREIGN KEY (jadwal_id) REFERENCES jadwal_pelajaran(id) ON DELETE SET NULL,
    FOREIGN KEY (kelas_id) REFERENCES kelas(id) ON DELETE CASCADE,
    FOREIGN KEY (mapel_id) REFERENCES mata_pelajaran(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS presensi_sesi (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    jurnal_id BIGINT NOT NULL,
    siswa_id INT NOT NULL,
    status ENUM('hadir', 'sakit', 'izin', 'alpha', 'bolos') NOT NULL,
    keterangan TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (jurnal_id) REFERENCES jurnal_mengajar(id) ON DELETE CASCADE,
    FOREIGN KEY (siswa_id) REFERENCES siswa(id) ON DELETE CASCADE,
    UNIQUE KEY (jurnal_id, siswa_id)
);
