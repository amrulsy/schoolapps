const pool = require('./db');

async function check() {
    try {
        const [taRows] = await pool.query('SELECT * FROM tahun_ajaran');
        console.log('--- TAHUN AJARAN DATA ---');
        console.log(JSON.stringify(taRows, null, 2));
        
        // Check for any other settings table
        const [tables] = await pool.query('SHOW TABLES');
        console.log('--- TABLES ---');
        console.log(JSON.stringify(tables, null, 2));
        
        // Try to find if there is a 'current' year in some settings
        try {
            const [settings] = await pool.query("SELECT * FROM infaq_settings WHERE key_name = 'current_tahun_ajaran_id'");
            console.log('--- CURRENT TA IN SETTINGS ---');
            console.log(JSON.stringify(settings, null, 2));
        } catch(e) {}

        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
}

check();
