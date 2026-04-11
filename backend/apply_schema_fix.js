const pool = require('./db');

async function applyFix() {
    try {
        console.log('Applying schema fix to siswa_presensi...');
        
        // 1. Add 'terlambat' to ENUM
        // We need to re-define the column with the new ENUM values
        await pool.query("ALTER TABLE siswa_presensi MODIFY COLUMN status ENUM('hadir', 'sakit', 'izin', 'alpha', 'terlambat')");
        
        console.log('Schema fix applied successfully!');
        process.exit(0);
    } catch (err) {
        console.error('Error applying schema fix:', err);
        process.exit(1);
    }
}

applyFix();
