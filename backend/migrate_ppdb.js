/**
 * PPDB Enhancement Migration Script
 */
const pool = require('./db');

async function migrate() {
    const conn = await pool.getConnection();
    try {
        // 1. Add columns to ppdb_registrations
        const cols = ['gelombang_id', 'foto_path', 'completeness_pct'];
        for (const col of cols) {
            try {
                if (col === 'gelombang_id') await conn.query('ALTER TABLE ppdb_registrations ADD COLUMN gelombang_id INT DEFAULT NULL');
                if (col === 'foto_path') await conn.query('ALTER TABLE ppdb_registrations ADD COLUMN foto_path VARCHAR(255) DEFAULT NULL');
                if (col === 'completeness_pct') await conn.query('ALTER TABLE ppdb_registrations ADD COLUMN completeness_pct INT DEFAULT 0');
                console.log(`  + Column ${col} added`);
            } catch (e) {
                if (e.code === 'ER_DUP_FIELDNAME') console.log(`  ~ Column ${col} already exists`);
                else throw e;
            }
        }

        // 2. Create ppdb_gelombang
        await conn.query(`CREATE TABLE IF NOT EXISTS ppdb_gelombang (
            id INT AUTO_INCREMENT PRIMARY KEY,
            nama VARCHAR(100) NOT NULL,
            kuota INT NOT NULL DEFAULT 50,
            biaya_daftar_ulang DECIMAL(12,2) DEFAULT 1500000,
            tanggal_buka DATE,
            tanggal_tutup DATE,
            is_active TINYINT(1) DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`);
        console.log('  + Table ppdb_gelombang OK');

        // 3. Create ppdb_announcements
        await conn.query(`CREATE TABLE IF NOT EXISTS ppdb_announcements (
            id INT AUTO_INCREMENT PRIMARY KEY,
            judul VARCHAR(255) NOT NULL,
            isi TEXT,
            tipe ENUM('info','warning','success') DEFAULT 'info',
            is_active TINYINT(1) DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`);
        console.log('  + Table ppdb_announcements OK');

        console.log('\n✅ Migration complete!');
    } finally {
        conn.release();
        process.exit(0);
    }
}

migrate().catch(err => { console.error('Migration failed:', err.message); process.exit(1); });
