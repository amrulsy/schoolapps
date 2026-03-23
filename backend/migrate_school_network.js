const pool = require('./db');
require('dotenv').config();

async function migrate() {
    try {
        console.log('🚀 Running migration: Add school_network_json to cms_settings...');
        const [rows] = await pool.query("SELECT * FROM cms_settings WHERE setting_key = 'school_network_json'");
        if (rows.length === 0) {
            await pool.query("INSERT INTO cms_settings (setting_key, setting_value, setting_type, description) VALUES ('school_network_json', '[]', 'json', 'Daftar sekolah afiliasi')");
            console.log('✅ school_network_json key inserted successfully.');
        } else {
            console.log('ℹ️ school_network_json key already exists.');
        }
        process.exit(0);
    } catch (err) {
        console.error('❌ Migration failed:', err);
        process.exit(1);
    }
}

migrate();
