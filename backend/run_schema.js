const fs = require('fs');
const pool = require('./db');

async function run() {
    try {
        const sql = fs.readFileSync('schema.sql', 'utf8');
        const statements = sql.split(';').map(s => s.trim()).filter(s => s.length > 0);
        for (let s of statements) {
            console.log('Running:', s.substring(0, 50).replace(/\n/g, ' ') + '...');
            await pool.query(s);
        }
        console.log('Migration successful');
    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        process.exit();
    }
}
run();
