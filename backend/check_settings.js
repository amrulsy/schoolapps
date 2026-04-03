const pool = require('./db');
async function test() {
    try {
        const [rows] = await pool.query("SELECT * FROM cms_settings");
        console.log("ALL SETTINGS: ", rows);
    } catch(e) {
        console.log("ERR: ", e);
    }
    process.exit();
}
test();
