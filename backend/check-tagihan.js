const pool = require('./db');

async function checkTagihan() {
    try {
        console.log('--- CHECKING TAGIHAN DATA ---');
        const [rows] = await pool.query('SELECT * FROM tagihan LIMIT 10');
        console.log('Row count:', rows.length);
        if (rows.length > 0) {
            console.log('Sample data (first row):');
            console.log(JSON.stringify(rows[0], null, 2));
        } else {
            console.log('No data found in tagihan table.');
        }
        process.exit(0);
    } catch (err) {
        console.error('Error:', err.message);
        process.exit(1);
    }
}

checkTagihan();
