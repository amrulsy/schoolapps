const pool = require('./db');

async function check() {
    try {
        console.log('--- DESCRIBE ppdb_registrations ---');
        const [rows] = await pool.query('DESCRIBE ppdb_registrations');
        console.log(JSON.stringify(rows, null, 2));

        console.log('\n--- DESCRIBE ppdb_gelombang ---');
        try {
            const [gelRows] = await pool.query('DESCRIBE ppdb_gelombang');
            console.log(JSON.stringify(gelRows, null, 2));
        } catch (e) {
            console.log('ppdb_gelombang table might not exist');
        }

        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
}

check();
