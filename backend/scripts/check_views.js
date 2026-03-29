const pool = require('../db');

async function run() {
    try {
        const [rows] = await pool.query("SELECT slug, views FROM cms_posts");
        console.log("Current views:", rows);
        
        await pool.query("UPDATE cms_posts SET views = 0 WHERE views IS NULL");
        console.log("Updated null views to 0.");
    } catch(e) {
        console.error("Error:", e);
    }
    process.exit(0);
}
run();
