const pool = require('./db');

async function test() {
    try {
        const [rows] = await pool.query("DESCRIBE siswa");
        console.log("SISWA COLUMNS: ", rows.map(r => r.Field).join(', '));
        
        const [pRows] = await pool.query("DESCRIBE ppdb_registrations");
        console.log("PPDB COLUMNS: ", pRows.map(r => r.Field).join(', '));
    } catch(err) {
        console.error(err);
    }
    process.exit();
}
test();
