const pool = require('./db');
async function run() {
    const [rows] = await pool.query('DESCRIBE attendance_settings');
    rows.forEach(r => {
        console.log(`Field: ${r.Field}, Type: ${r.Type}, Key: ${r.Key}`);
    });
}
run().finally(() => process.exit(0));
