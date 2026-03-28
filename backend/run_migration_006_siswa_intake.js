const db = require('./db');

async function run() {
    console.log('Menjalankan migrasi: Menambahkan jenis_pendaftaran dan tanggal_mulai_sekolah di tabel siswa...');
    
    try {
        await db.query(`ALTER TABLE siswa ADD COLUMN jenis_pendaftaran ENUM('Baru', 'Pindahan') DEFAULT 'Baru'`);
        console.log('1. Kolom jenis_pendaftaran berhasil ditambahkan.');
    } catch (err) {
        if (err.message.includes('Duplicate column name')) {
            console.log('1. Kolom jenis_pendaftaran sudah ada. Skip.');
        } else {
            console.error('Error menambah kolom jenis_pendaftaran:', err);
        }
    }

    try {
        await db.query(`ALTER TABLE siswa ADD COLUMN tanggal_mulai_sekolah DATE`);
        console.log('2. Kolom tanggal_mulai_sekolah berhasil ditambahkan.');
    } catch (err) {
        if (err.message.includes('Duplicate column name')) {
            console.log('2. Kolom tanggal_mulai_sekolah sudah ada. Skip.');
        } else {
            console.error('Error menambah kolom tanggal_mulai_sekolah:', err);
        }
    }

    console.log('Migrasi selesai.');
    process.exit(0);
}

run();
