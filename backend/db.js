const mysql = require('mysql2/promise');
require('dotenv').config();

/**
 * TiDB Serverless requires TLS connection.
 * By default, mysql2 will use the system's CA certificates if rejectUnauthorized is true.
 */
const pool = mysql.createPool({
    host: process.env.DB_HOST || process.env.TIDB_HOST,
    port: process.env.DB_PORT || process.env.TIDB_PORT || 3306,
    user: process.env.DB_USER || process.env.TIDB_USER,
    password: process.env.DB_PASSWORD || process.env.TIDB_PASSWORD,
    database: process.env.DB_DATABASE || process.env.TIDB_DATABASE,
    charset: 'utf8mb4',
    ssl: (process.env.DB_SSL === 'true' || process.env.TIDB_HOST) ? {
        minVersion: 'TLSv1.2',
        rejectUnauthorized: false
    } : null,
    timezone: 'Z',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 10000
});

module.exports = pool;
