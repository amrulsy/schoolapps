const pool = require('./db.js');
const bcrypt = require('bcryptjs');

async function ensureAdmin() {
    const [rows] = await pool.query("SELECT * FROM users WHERE role = 'admin'");
    if (rows.length === 0) {
        console.log("No admin found. Creating admin/admin...");
        const hash = await bcrypt.hash('admin', 10);
        await pool.query("INSERT INTO users (nama, username, password_hash, role) VALUES ('Admin', 'admin', ?, 'admin')", [hash]);
        console.log("Admin created.");
    } else {
        console.log("Admin exists. Setting password to admin to be sure...");
        const hash = await bcrypt.hash('admin', 10);
        await pool.query("UPDATE users SET password_hash = ? WHERE role = 'admin' LIMIT 1", [hash]);
        console.log("Admin password updated to 'admin'.");
    }
    process.exit(0);
}

ensureAdmin();
