const pool = require('./db');

async function checkSiswaTable() {
    try {
        const [rows] = await pool.query('DESCRIBE siswa');
        console.log('--- TABLE STRUCTURE: siswa ---');
        console.table(rows);
        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
}

checkSiswaTable();
