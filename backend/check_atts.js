const pool = require('./db');
async function run() {
    try {
        const [rows] = await pool.query('DESCRIBE attendance_settings');
        console.log(JSON.stringify(rows, null, 2));
    } catch (err) {
        console.error(err);
    }
}
run().finally(() => process.exit(0));
