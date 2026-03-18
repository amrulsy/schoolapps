const fs = require('fs');
const path = require('path');
const pool = require('../db');

async function runMigration() {
    try {
        const filePath = path.join(__dirname, '002_home_content_tables.sql');
        console.log(`Reading migration file: ${filePath}`);
        const sql = fs.readFileSync(filePath, 'utf8');

        // Simple split by semicolon. Note: This doesn't handle semicolons in strings/comments perfectly
        // but for this specific migration file it will work.
        const queries = sql
            .split(';')
            .map(q => q.trim())
            .filter(q => q.length > 0);

        console.log(`Found ${queries.length} queries to execute.`);

        for (let i = 0; i < queries.length; i++) {
            console.log(`Executing query ${i + 1}/${queries.length}...`);
            await pool.query(queries[i]);
        }

        console.log('✅ Migration successful!');
        process.exit(0);
    } catch (err) {
        console.error('❌ Migration failed:', err);
        process.exit(1);
    }
}

runMigration();
