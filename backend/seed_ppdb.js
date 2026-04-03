const pool = require('./db');
pool.query("INSERT INTO cms_settings (setting_key, setting_value) VALUES ('ppdb_is_open', '1'), ('ppdb_year', '2025/2026'), ('ppdb_quota', '100') ON DUPLICATE KEY UPDATE setting_value = setting_value").then(() => {
    console.log('PPDB Settings seeded.');
    process.exit();
}).catch(err => {
    console.error(err);
    process.exit();
});
