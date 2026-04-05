const pool = require('./db');

async function check() {
    try {
        const [rows] = await pool.query('SHOW COLUMNS FROM ppdb_registrations');
        console.log('---PPDB_REGISTRATIONS_COLUMNS_START---');
        rows.forEach(row => {
            console.log(row.Field);
        });
        console.log('---PPDB_REGISTRATIONS_COLUMNS_END---');

        const [gelRows] = await pool.query('SHOW COLUMNS FROM ppdb_gelombang');
        console.log('---PPDB_GELOMBANG_COLUMNS_START---');
        gelRows.forEach(row => {
            console.log(row.Field);
        });
        console.log('---PPDB_GELOMBANG_COLUMNS_END---');

        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
}

check();
