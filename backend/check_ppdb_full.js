const pool = require('./db');
async function test() {
    const [rows] = await pool.query("DESCRIBE ppdb_registrations");
    console.log("COLUMNS:", rows.map(r => r.Field).join(', '));
    process.exit();
}
test();
