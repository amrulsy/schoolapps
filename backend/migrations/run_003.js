/**
 * Run migration 003_portal_dynamic.sql
 */
const fs = require('fs');
const path = require('path');
const pool = require('../db');

async function run() {
    const sqlPath = path.join(__dirname, '003_portal_dynamic.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    const queries = sql.split(';').map(q => q.trim()).filter(q => q.length > 0);

    console.log(`Running migration 003_portal_dynamic.sql (${queries.length} queries)...`);

    for (const query of queries) {
        try {
            await pool.query(query);
            console.log('✅', query.substring(0, 60) + '...');
        } catch (err) {
            if (err.code === 'ER_TABLE_EXISTS_ERROR' || err.code === 'ER_DUP_ENTRY') {
                console.log('⏭️ Skipped (already exists):', query.substring(0, 60));
            } else {
                console.error('❌ Error:', err.message);
            }
        }
    }

    console.log('\n✅ Migration 003 complete.');
    process.exit(0);
}

run();
