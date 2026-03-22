const pool = require('./db');

async function migrateGuru() {
    try {
        console.log("Altering 'users' table to add 'guru' role...");
        await pool.query("ALTER TABLE users MODIFY COLUMN role ENUM('admin', 'kasir', 'guru') DEFAULT 'kasir'");
        console.log("Successfully altered 'users'.");

        console.log("Running run_schema.js to create new tables...");
        require('./run_schema.js');
    } catch (err) {
        console.error("Migration error:", err.message);
        process.exit(1);
    }
}

migrateGuru();
