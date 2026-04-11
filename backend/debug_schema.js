const pool = require('./db');

async function debugSchema() {
    try {
        console.log('Checking schema for attendances...');
        const [rows] = await pool.query('DESCRIBE attendances');
        console.log(JSON.stringify(rows, null, 2));
        process.exit(0);
    } catch (err) {
        console.error('Error debugging schema:', err);
        process.exit(1);
    }
}

debugSchema();
