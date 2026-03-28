const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function createTestUsers() {
    const connection = await mysql.createConnection({
        host: process.env.TIDB_HOST,
        port: process.env.TIDB_PORT,
        user: process.env.TIDB_USER,
        password: process.env.TIDB_PASSWORD,
        database: process.env.TIDB_DATABASE,
        ssl: { minVersion: 'TLSv1.2', rejectUnauthorized: false }
    });

    try {
        console.log('🧪 Creating test users for each role...');
        const pass = await bcrypt.hash('staf123', 10);
        
        const users = [
            ['Staf TU (Test)', 'tu_test', pass, 'staf_tu'],
            ['Staf Keuangan (Test)', 'keu_test', pass, 'staf_keuangan'],
            ['Staf Perbankan (Test)', 'bank_test', pass, 'staf_perbankan'],
            ['Staf Infaq (Test)', 'infaq_test', pass, 'staf_infaq']
        ];

        for (const [nama, username, hash, role] of users) {
             // Check if exists
             const [rows] = await connection.query('SELECT id FROM users WHERE username = ?', [username]);
             if (rows.length === 0) {
                 await connection.query(
                     'INSERT INTO users (nama, username, password_hash, role) VALUES (?, ?, ?, ?)',
                     [nama, username, hash, role]
                 );
                 console.log(`✅ Created user: ${username} (${role})`);
             } else {
                 console.log(`ℹ️ User ${username} already exists.`);
             }
        }
        
    } catch (err) {
        console.error('❌ Error creating test users:', err);
    } finally {
        await connection.end();
    }
}

createTestUsers();
