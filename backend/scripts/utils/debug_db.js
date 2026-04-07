const pool = require('./db');

async function check() {
    try {
        console.log('--- siswa_presensi ---');
        const [sp] = await pool.query('SELECT * FROM siswa_presensi LIMIT 5');
        console.log(JSON.stringify(sp, null, 2));

        console.log('\n--- attendances ---');
        const [att] = await pool.query('SELECT * FROM attendances LIMIT 5');
        console.log(JSON.stringify(att, null, 2));

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

check();
