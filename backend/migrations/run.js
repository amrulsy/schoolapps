/**
 * SIAS — CMS Migration Runner
 * Reads and executes SQL migration files against the database.
 */
const pool = require('../db');
const fs = require('fs');
const path = require('path');

async function runMigrations() {
    console.log('🔄 Running migrations...');
    try {
        const migrationsDir = __dirname;
        const files = fs.readdirSync(migrationsDir)
            .filter(f => f.endsWith('.sql'))
            .sort();

        for (const file of files) {
            console.log(`\n📄 Executing migration: ${file}`);
            const sqlPath = path.join(migrationsDir, file);
            const sql = fs.readFileSync(sqlPath, 'utf-8');

            const cleanSql = sql.replace(/--.*$/gm, '');
            const statements = cleanSql
                .split(';')
                .map(s => s.trim())
                .filter(s => s.length > 0);

            for (const stmt of statements) {
                try {
                    await pool.query(stmt);
                    console.log('  ✅', stmt.substring(0, 60).replace(/\n/g, ' ') + '...');
                } catch (err) {
                    if (err.code === 'ER_TABLE_EXISTS_ERROR' || err.code === 'ER_DUP_ENTRY') {
                        console.log('  ⏭️  Skipped (already exists):', stmt.substring(0, 50).replace(/\n/g, ' '));
                    } else {
                        console.error('  ❌ Error:', err.message);
                        console.error('     Statement:', stmt.substring(0, 80));
                    }
                }
            }
        }

        console.log('\n✅ All migrations complete!');
    } catch (err) {
        console.error('❌ Migration failed:', err.message);
    }
    process.exit(0);
}

runMigrations();
