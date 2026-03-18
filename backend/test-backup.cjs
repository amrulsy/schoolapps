const pool = require('./db');

async function testBackup() {
    try {
        console.log('Fetching tables...');
        const [rows] = await pool.query('SHOW TABLES');
        console.log('Raw rows from SHOW TABLES:', rows);

        const tables = rows.map(row => Object.values(row)[0]);
        console.log('Parsed tables:', tables);

        for (const table of tables) {
            try {
                console.log(`Checking table: ${table}...`);
                const [cols] = await pool.query(`SELECT * FROM ${table} LIMIT 1`);
                console.log(`Table ${table} is accessible. Row count limit 1: ${cols.length}`);
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
