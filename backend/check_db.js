const pool = require('./db');

async function check() {
    try {
        const [rows] = await pool.query('SELECT * FROM infaq_settings LIMIT 1');
        if (rows.length > 0) {
            console.log('Columns:', Object.keys(rows[0]));
            console.log('Data:', rows[0]);
        } else {
            console.log('No data in infaq_settings');
        }
        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
}

check();
