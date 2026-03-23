const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function main() {
    const connection = await mysql.createConnection({
        host: process.env.TIDB_HOST,
        port: process.env.TIDB_PORT,
        user: process.env.TIDB_USER,
        password: process.env.TIDB_PASSWORD,
        database: process.env.TIDB_DATABASE,
        ssl: { minVersion: 'TLSv1.2', rejectUnauthorized: false }
    });

    console.log('Connected to TiDB');

    const sqlFile = path.join(__dirname, 'migrations', '005_program_details_json.sql');
    const sql = fs.readFileSync(sqlFile, 'utf8');

    // Split by semicolon but ignore inside strings/comments (simplified for this specific file)
    const statements = sql.split(';').filter(s => s.trim() !== '');

    for (let statement of statements) {
        console.log('Executing:', statement.trim().substring(0, 50) + '...');
        await connection.query(statement);
    }

    console.log('Migration 005 completed successfully!');
    await connection.end();
}

main().catch(err => {
    console.error('Migration failed:', err);
    process.exit(1);
});
