const fs = require('fs');
const path = require('path');
const pool = require('./db');

async function migrate() {
    try {
        console.log('--- STARTING MIGRATION ---');

        const sqlPath = path.join(__dirname, 'schema.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        // Split SQL by semicolon but ignore semicolons inside parentheses/strings (basic split)
        // For a more robust solution we'd use a parser, but for this schema simple split works
        const queries = sql
            .split(';')
            .map(q => q.trim())
            .filter(q => q.length > 0);

        console.log(`Found ${queries.length} queries to execute.`);

        for (let i = 0; i < queries.length; i++) {
            console.log(`Executing query ${i + 1}/${queries.length}...`);
            await pool.query(queries[i]);
        }

        console.log('✅ MIGRATION SUCCESS: All tables created/verified!');
        process.exit(0);
    } catch (err) {
        console.error('❌ MIGRATION FAILED:', err.message);
        process.exit(1);
    }
}

migrate();
