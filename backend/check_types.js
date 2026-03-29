const mysql = require('mysql2/promise');
require('dotenv').config();

(async () => {
    try {
        const pool = mysql.createPool({
            host: process.env.TIDB_HOST,
            port: process.env.TIDB_PORT,
            user: process.env.TIDB_USER,
            password: process.env.TIDB_PASSWORD,
            database: process.env.TIDB_DATABASE,
            ssl: { rejectUnauthorized: false }
        });

        // 1. Check for BLOB columns
        console.log('--- CHECKING FOR BLOB COLUMNS ---');
        const [blobRows] = await pool.query(`
            SELECT TABLE_NAME, COLUMN_NAME, DATA_TYPE 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = ? AND DATA_TYPE LIKE '%blob%'
        `, [process.env.TIDB_DATABASE]);
        console.log(JSON.stringify(blobRows, null, 2));

        // 2. Check for BINARY columns
        console.log('\n--- CHECKING FOR BINARY COLUMNS ---');
        const [binRows] = await pool.query(`
            SELECT TABLE_NAME, COLUMN_NAME, DATA_TYPE 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = ? AND DATA_TYPE IN ('binary', 'varbinary')
        `, [process.env.TIDB_DATABASE]);
        console.log(JSON.stringify(binRows, null, 2));

        await pool.end();
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
})();
