const db = require('./db');

async function run() {
    console.log('Menjalankan migrasi: Membuat tabel master_dokumen...');
    
    try {
        await db.query(`
            CREATE TABLE IF NOT EXISTS master_dokumen (
                id INT AUTO_INCREMENT PRIMARY KEY,
                kode VARCHAR(50) UNIQUE NOT NULL,
                nama VARCHAR(150) NOT NULL,
                is_required BOOLEAN DEFAULT TRUE,
                keterangan TEXT
            )
        `);
        console.log('1. Tabel master_dokumen berhasil dibuat atau sudah ada.');
    } catch (err) {
        console.error('Error membuat tabel master_dokumen:', err);
    }

    console.log('Migrasi selesai.');
    process.exit(0);
}

run();
