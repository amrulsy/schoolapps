const pool = require('./db');

async function check() {
    try {
        console.log('--- COLUMNS IN ppdb_registrations ---');
        const [rows] = await pool.query('SHOW COLUMNS FROM ppdb_registrations');
        rows.forEach(row => {
            console.log(`- ${row.Field} (${row.Type})`);
        });

        console.log('\n--- TABLES ---');
        const [tables] = await pool.query('SHOW TABLES');
        console.log(JSON.stringify(tables, null, 2));

        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
}

check();
