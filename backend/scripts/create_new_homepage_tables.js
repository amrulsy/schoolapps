const pool = require('../db');

async function run() {
    try {
        console.log("Creating cms_visitor_stats table...");
        await pool.query(`
            CREATE TABLE IF NOT EXISTS cms_visitor_stats (
                visit_date DATE PRIMARY KEY,
                visits INT DEFAULT 0
            )
        `);
        console.log("Successfully created cms_visitor_stats.");

        console.log("Creating cms_agenda table...");
        await pool.query(`
            CREATE TABLE IF NOT EXISTS cms_agenda (
                id INT AUTO_INCREMENT PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                description TEXT,
                event_date DATE NOT NULL,
                time VARCHAR(50),
                location VARCHAR(255),
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);
        console.log("Successfully created cms_agenda.");

    } catch(e) {
        console.error("Migration failed:", e.message);
    }
    process.exit(0);
}

run();
