/**
 * Fix Missing Columns in ppdb_registrations
 */
const pool = require('./db');

async function migrate() {
    const conn = await pool.getConnection();
    try {
        console.log('--- Starting Migration: Adding missing columns to ppdb_registrations ---');
        
        const columnSpecs = [
            { name: 'gelombang_id', type: 'INT DEFAULT NULL' },
            { name: 'foto_path', type: 'VARCHAR(255) DEFAULT NULL' },
            { name: 'completeness_pct', type: 'INT DEFAULT 0' },
            { name: 'berkas_json', type: 'LONGTEXT DEFAULT NULL' }
        ];

        for (const spec of columnSpecs) {
            try {
                process.stdout.write(`  + Adding column ${spec.name}... `);
                await conn.query(`ALTER TABLE ppdb_registrations ADD COLUMN ${spec.name} ${spec.type}`);
                console.log('OK');
            } catch (e) {
                if (e.code === 'ER_DUP_FIELDNAME' || (e.message && e.message.includes('Duplicate column name'))) {
                    console.log('ALREADY EXISTS');
                } else {
                    console.log('FAILED');
                    throw e;
                }
            }
        }

        console.log('\n✅ Migration complete!');
    } catch (err) {
        console.error('\n❌ Migration failed:', err.message);
        process.exit(1);
    } finally {
        conn.release();
        process.exit(0);
    }
}

migrate();
