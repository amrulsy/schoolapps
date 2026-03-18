const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'backend/.env') });

const pool = mysql.createPool({
    host: process.env.TIDB_HOST,
    port: process.env.TIDB_PORT,
    user: process.env.TIDB_USER,
    password: process.env.TIDB_PASSWORD,
    database: process.env.TIDB_DATABASE,
    ssl: {
        minVersion: 'TLSv1.2',
        rejectUnauthorized: false
    },
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 10000
});

async function testBackup() {
    try {
        console.log('Testing Database Connection with HOST:', process.env.TIDB_HOST);
        const [ping] = await pool.query('SELECT 1 + 1 AS result');
        console.log('Connection OK, result:', ping[0].result);

        console.log('Fetching tables...');
        const [rows] = await pool.query('SHOW TABLES');
        console.log('Raw rows from SHOW TABLES:', JSON.stringify(rows, null, 2));

        const tables = rows.map(row => Object.values(row)[0]);
        console.log('Parsed tables:', tables);

        for (const table of tables) {
            try {
                console.log(`Checking table: ${table}...`);
                const [rows] = await pool.query(`SELECT * FROM ${table} LIMIT 1`);
                console.log(`Table ${table} is accessible, has ${rows.length} rows (limit 1).`);
            } catch (err) {
                console.error(`Error querying table ${table}:`, err.message);
            }
        }

        process.exit(0);
    } catch (err) {
        console.error('Test failed:', err);
        process.exit(1);
    }
}

testBackup();
