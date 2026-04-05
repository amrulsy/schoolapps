const pool = require('./backend/db');

(async () => {
    try {
        const [ta] = await pool.query("SELECT * FROM tahun_ajaran WHERE status = 'aktif' LIMIT 1");
        console.log('=== Active Tahun Ajaran ===');
        console.log(JSON.stringify(ta, null, 2));

        const [wk] = await pool.query(`
            SELECT wk.*, g.nama as guru_nama, g.user_id, k.nama as kelas_nama
            FROM wali_kelas wk 
            JOIN guru g ON wk.guru_id = g.id 
            JOIN kelas k ON wk.kelas_id = k.id
        `);
        console.log('\n=== All Wali Kelas Assignments ===');
        console.log(JSON.stringify(wk, null, 2));

        const [guru] = await pool.query("SELECT g.id as guru_id, g.nama, g.user_id, u.username FROM guru g LEFT JOIN users u ON g.user_id = u.id LIMIT 10");
        console.log('\n=== Guru List (first 10) ===');
        console.log(JSON.stringify(guru, null, 2));

        process.exit(0);
    } catch(e) {
        console.error('Error:', e.message);
        process.exit(1);
    }
})();
