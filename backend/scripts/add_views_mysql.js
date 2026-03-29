const pool = require('../db');

async function run() {
    try {
        console.log("Adding views column to cms_posts...");
        await pool.query("ALTER TABLE cms_posts ADD COLUMN views INT DEFAULT 0");
        console.log("Successfully added views column.");
    } catch(e) {
        if(e.code === 'ER_DUP_FIELDNAME') {
            console.log("Column views already exists.");
        } else {
            console.error("Failed to add views column:", e.message);
        }
    }
    process.exit(0);
}

run();
