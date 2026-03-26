const pool = require('./backend/db');

async function check() {
    try {
        console.log('--- Database Diagnostic ---');
        const [tables] = await pool.query('SHOW TABLES');
        console.log('Tables in database:', tables.map(t => Object.values(t)[0]));
        
        const tablesToCheck = ['harilibur', 'infaq_harian', 'siswa', 'kelas'];
        for (const tableName of tablesToCheck) {
            try {
                const [desc] = await pool.query(`DESCRIBE ${tableName}`);
                console.log(`\nTable: ${tableName} schema:`);
                console.table(desc);
            } catch (e) {
                console.error(`\nError describing table ${tableName}:`, e.message);
            }
        }
        
    } catch (err) {
        console.error('FATAL ERROR:', err);
    } finally {
        // Close pool to allow process to exit
        await pool.end();
        process.exit(0);
    }
}

check();
