require('dotenv').config();
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

const pool = mysql.createPool({
    host: process.env.TIDB_HOST,
    port: process.env.TIDB_PORT,
    user: process.env.TIDB_USER,
    password: process.env.TIDB_PASSWORD,
    database: process.env.TIDB_DATABASE,
    ssl: { minVersion: 'TLSv1.2', rejectUnauthorized: false },
    timezone: 'Z',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

async function runResetAndSeedAdmin() {
    console.log('🚀 INITIALIZING DATABASE WIPING AND RUNNING ADMIN SEEDER...');
    const conn = await pool.getConnection();

    try {
        await conn.beginTransaction();

        // 1. Get all tables
        console.log('🔍 Fetching all tables in the database...');
        const [rows] = await conn.query('SHOW TABLES');

        const tables = rows.map(row => Object.values(row)[0]);

        // 2. Clear all tables
        console.log(`🧹 Cleaning ${tables.length} tables...`);
        // Disable foreign key checks for clean wipe
        await conn.query('SET FOREIGN_KEY_CHECKS = 0');
        
        for (const table of tables) {
            console.log(`   Deleting all from ${table}...`);
            await conn.query(`DELETE FROM ${table}`);
            try { await conn.query(`ALTER TABLE ${table} AUTO_INCREMENT = 1`); } catch (e) { console.warn('Reset AI warning:', e.message); }
        }
        await conn.query('SET FOREIGN_KEY_CHECKS = 1');

        // 3. Seed only the admin user
        console.log('👥 Seeding Admin User (Bcrypt Hashing)...');
        const adminPass = await bcrypt.hash('admin123', 10);

        await conn.query(`INSERT INTO users (id, nama, username, password_hash, role) VALUES 
            (1, 'Super Admin', 'admin', '${adminPass}', 'admin')`);

        await conn.commit();
        console.log('✅ DATABASE WIPED SUCCESSFULLY AND ADMIN ACCOUNT SEEDED!');
        console.log('Username: admin');
        console.log('Password: admin123');

    } catch (err) {
        await conn.rollback();
        console.error('❌ FATAL SEEDING ERROR:', err);
    } finally {
        conn.release();
        process.exit();
    }
}

runResetAndSeedAdmin();
