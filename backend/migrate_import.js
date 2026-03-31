const pool = require('./db');

async function migrate() {
    console.log('Starting migration for import feature...');
    try {
        // 1. Add dusun to siswa
        try {
            await pool.query("ALTER TABLE siswa ADD COLUMN dusun VARCHAR(100) AFTER rw;");
            console.log('Added dusun column to siswa table.');
        } catch (e) {
            console.log('Skipping dusun column: might already exist. ' + e.message);
        }

        // 2. Add tahun_lahir to siswa_orangtua
        try {
            await pool.query("ALTER TABLE siswa_orangtua ADD COLUMN tahun_lahir VARCHAR(4) AFTER penghasilan;");
            console.log('Added tahun_lahir column to siswa_orangtua table.');
        } catch (e) {
            console.log('Skipping tahun_lahir column: might already exist. ' + e.message);
        }

        // 3. Modify penghasilan to VARCHAR in siswa_orangtua
        try {
            await pool.query("ALTER TABLE siswa_orangtua MODIFY COLUMN penghasilan VARCHAR(100);");
            console.log('Modified penghasilan column to VARCHAR in siswa_orangtua table.');
        } catch (e) {
            console.log('Skipping modify penghasilan: error or already correct. ' + e.message);
        }

        console.log('Migration completed.');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
}

migrate();
