const pool = require('./db');

async function migrate() {
    console.log('Migrating jam_pelajaran...');
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS jam_pelajaran (
                id INT AUTO_INCREMENT PRIMARY KEY,
                jam_ke INT UNIQUE NOT NULL,
                jam_mulai TIME NOT NULL,
                jam_selesai TIME NOT NULL,
                tipe ENUM('Pelajaran', 'Istirahat') DEFAULT 'Pelajaran'
            );
        `);
        console.log('Created jam_pelajaran table');

        // Check if jam_mulai exists in jadwal_pelajaran before dropping
        const [columns] = await pool.query("SHOW COLUMNS FROM jadwal_pelajaran LIKE 'jam_mulai'");
        if (columns.length > 0) {
            await pool.query('DELETE FROM jadwal_pelajaran'); // Clean up existing to avoid null constraint since we are dropping time
            await pool.query('ALTER TABLE jadwal_pelajaran ADD COLUMN jam_pelajaran_id INT NOT NULL');
            await pool.query('ALTER TABLE jadwal_pelajaran ADD FOREIGN KEY (jam_pelajaran_id) REFERENCES jam_pelajaran(id) ON DELETE RESTRICT');
            await pool.query('ALTER TABLE jadwal_pelajaran DROP COLUMN jam_mulai, DROP COLUMN jam_selesai');
            console.log('Altered jadwal_pelajaran');
        }

        console.log('✅ Migration success!');
        process.exit(0);
    } catch (err) {
        console.error('❌ Migration failed:', err);
        process.exit(1);
    }
}
migrate();
