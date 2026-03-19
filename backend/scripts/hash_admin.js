const bcrypt = require('bcryptjs');
const pool = require('../db');

async function hashAdminPassword() {
    try {
        console.log("Mencari user admin...");
        const [rows] = await pool.query("SELECT * FROM users WHERE username = 'admin'");

        if (rows.length === 0) {
            console.log("User admin tidak ditemukan. Membuat user admin baru...");
            const hash = await bcrypt.hash('admin', 10);
            await pool.query(
                "INSERT INTO users (nama_lengkap, email, username, password_hash, role) VALUES (?, ?, ?, ?, 'admin')",
                ['Administrator', 'admin@sekolah.com', 'admin', hash]
            );
            console.log("User admin berhasil dibuat dengan password 'admin'.");
        } else {
            console.log("User admin ditemukan. Mengenkripsi ulang password menjadi 'admin'...");
            const hash = await bcrypt.hash('admin', 10);
            await pool.query("UPDATE users SET password_hash = ? WHERE username = 'admin'", [hash]);
            console.log("Password admin berhasil dienkripsi dengan Bcrypt.");
        }
    } catch (err) {
        console.error("Gagal melakukan hashing password:", err);
    } finally {
        process.exit(0);
    }
}

hashAdminPassword();
