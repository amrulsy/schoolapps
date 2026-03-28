const mysql = require('mysql2/promise');
require('dotenv').config();

async function migrate() {
    const connection = await mysql.createConnection({
        host: process.env.TIDB_HOST,
        port: process.env.TIDB_PORT,
        user: process.env.TIDB_USER,
        password: process.env.TIDB_PASSWORD,
        database: process.env.TIDB_DATABASE,
        ssl: { minVersion: 'TLSv1.2', rejectUnauthorized: false }
    });

    try {
        console.log('🚀 Migrating user roles...');
        
        // 1. Update Enum in database
        await connection.query(`
            ALTER TABLE users 
            MODIFY COLUMN role ENUM('admin', 'kasir', 'staf_tu', 'staf_keuangan', 'staf_perbankan', 'staf_infaq', 'guru') 
            DEFAULT 'kasir'
        `);
        
        console.log('✅ Role enum updated successfully.');

        // 2. Optionally migrate existing 'kasir' to 'staf_keuangan' if desired
        // For now we just keep 'kasir' for compatibility but the UI will show 'Staf Keuangan'
        
    } catch (err) {
        console.error('❌ Migration failed:', err);
    } finally {
        await connection.end();
    }
}

migrate();
