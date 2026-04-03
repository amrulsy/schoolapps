const pool = require('./db');
async function test() {
    try {
        const [rows] = await pool.query("DESCRIBE cms_settings");
        console.log("SCHEMA: ", rows);
    } catch(e) {
        console.log("ERR: ", e);
    }
    process.exit();
}
test();
