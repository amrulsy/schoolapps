const mysql = require('mysql2/promise');
require('dotenv').config();

console.log('--- DB CONNECTION DEBUG ---');
console.log('Host:', process.env.TIDB_HOST);
console.log('User:', process.env.TIDB_USER);
console.log('Password Length:', process.env.TIDB_PASSWORD?.length);
console.log('Database:', process.env.TIDB_DATABASE);
console.log('--- STARTING CONNECTION TEST ---');

async function test() {
    try {
        const connection = await mysql.createConnection({
            host: process.env.TIDB_HOST,
            port: process.env.TIDB_PORT,
            user: process.env.TIDB_USER,
            password: process.env.TIDB_PASSWORD,
            database: process.env.TIDB_DATABASE,
            ssl: {
                minVersion: 'TLSv1.2',
                rejectUnauthorized: false // Menghindari masalah CA certificate sementara
            }
        });

        console.log('✅ SUCCESS: Berhasil terhubung ke TiDB!');
        const [rows] = await connection.execute('SELECT 1 + 1 AS result');
        console.log('Query Test Result:', rows[0].result);

        await connection.end();
        process.exit(0);
    } catch (err) {
        console.error('❌ FAILED: Gagal menyambung ke TiDB.');
        console.error('Error Code:', err.code);
        console.error('Error Message:', err.message);
        process.exit(1);
    }
}

test();
