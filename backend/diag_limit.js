const pool = require('./db');
async function run() {
    try {
        const [p] = await pool.query(`
            SELECT p.siswa_id, s.nama as siswa, i.nama as item, i.kode, p.status 
            FROM lab_peminjaman p 
            JOIN siswa s ON p.siswa_id = s.id 
            JOIN lab_inventaris i ON p.inventaris_id = i.id 
            WHERE p.status = "dipinjam"
        `);
        console.log('Active Loans:', p);
        
        const [settings] = await pool.query('SELECT * FROM lab_settings');
        console.log('Settings:', settings);

        const [items] = await pool.query('SELECT nama, kode, max_pinjam_per_siswa FROM lab_inventaris');
        console.log('Items:', items);
        
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
run();
