const pool = require('./db');

async function check() {
    try {
        const [taRows] = await pool.query('SELECT * FROM tahun_ajaran');
        const [siswaCols] = await pool.query('DESCRIBE siswa');
        
        console.log('--- TAHUN AJARAN DATA ---');
        console.log(JSON.stringify(taRows, null, 2));
        console.log('--- SISWA COLUMNS ---');
        console.log(JSON.stringify(siswaCols, null, 2));
        
        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
}

check();
