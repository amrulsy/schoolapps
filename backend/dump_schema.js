const pool = require('./db');
const fs = require('fs');

async function dumpSchema() {
    try {
        console.log("Fetching tables...");
        const [rows] = await pool.query('SHOW TABLES');
        const dbNameKey = Object.keys(rows[0])[0]; // e.g. "Tables_in_test"
        
        let schemaContent = `-- ==========================================
-- SIAS SMK PPRQ DATABASE SCHEMA (FULL SYNC)
-- ==========================================
-- Digenerate secara otomatis untuk deploy mudah tanpa migrasi terpisah.
-- Disable foreign key checks selama import
SET FOREIGN_KEY_CHECKS=0;

`;

        for (let row of rows) {
            const tableName = row[dbNameKey];
            const [createTableResult] = await pool.query(`SHOW CREATE TABLE \`${tableName}\``);
            const createStatement = createTableResult[0]['Create Table'];
            
            schemaContent += `-- Table structure for table \`${tableName}\`\n`;
            schemaContent += `DROP TABLE IF EXISTS \`${tableName}\`;\n`;
            // Add IF NOT EXISTS for safety
            let safeStatement = createStatement.replace(`CREATE TABLE \`${tableName}\``, `CREATE TABLE IF NOT EXISTS \`${tableName}\``);
            // Replace any AUTO_INCREMENT=xxxxx to avoid conflicts on import
            safeStatement = safeStatement.replace(/AUTO_INCREMENT=\d+\s*/, '');
            schemaContent += safeStatement + ';\n\n';
        }

        schemaContent += `SET FOREIGN_KEY_CHECKS=1;\n`;
        
        fs.writeFileSync('schema.sql', schemaContent, 'utf-8');
        console.log("schema.sql successfully fully updated!");
        process.exit(0);
    } catch(e) {
        console.error(e);
        process.exit(1);
    }
}

dumpSchema();
