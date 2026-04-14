const pool = require('../db');

async function setupSettings() {
    try {
        console.log('Creating school_settings table...');
        await pool.query(`
            CREATE TABLE IF NOT EXISTS school_settings (
                \`key\` VARCHAR(100) PRIMARY KEY,
                \`value\` TEXT
            )
        `);

        console.log('Seeding initial school_settings...');
        const initialSettings = [
            ['school_name', 'SMK PPRQ'],
            ['school_address', 'Jl. Pesantren No.1, Kota'],
            ['school_phone', '(021) 123-4567'],
            ['school_email', 'admin@smkpprq.sch.id'],
            ['school_principal', 'H. Ahmad Syukron, S.Pd.I'],
            ['school_principal_nip', '19750812 200501 1 002'],
            ['school_logo', '']
        ];

        for (const [key, value] of initialSettings) {
            await pool.query(
                'INSERT IGNORE INTO school_settings (`key`, `value`) VALUES (?, ?)',
                [key, value]
            );
        }

        console.log('Backend settings setup complete.');
        process.exit(0);
    } catch (err) {
        console.error('Error setting up settings:', err);
        process.exit(1);
    }
}

setupSettings();
