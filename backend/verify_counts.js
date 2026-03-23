require('dotenv').config();
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
    host: process.env.TIDB_HOST,
    port: process.env.TIDB_PORT,
    user: process.env.TIDB_USER,
    password: process.env.TIDB_PASSWORD,
    database: process.env.TIDB_DATABASE,
    ssl: { minVersion: 'TLSv1.2', rejectUnauthorized: false }
});

async function verify() {
    const tables = [
        'units', 'kelas', 'tahun_ajaran', 'users', 'guru', 'mata_pelajaran', 'jam_pelajaran',
        'jadwal_pelajaran', 'jurnal_mengajar', 'siswa', 'siswa_orangtua', 'siswa_dokumen',
        'tagihan', 'transaksi', 'cashflow', 'tabungan', 'bk_kategori', 'bk_catatan',
        'nilai_siswa', 'siswa_presensi', 'presensi_sesi', 'pesan',
        'cms_posts', 'cms_banners', 'cms_pages', 'cms_settings', 'cms_media', 'cms_contacts',
        'cms_programs', 'cms_partners', 'cms_ppdb_steps', 'cms_ppdb_requirements', 'student_menus'
    ];

    console.log('📊 TABLE COUNTS:');
    for (const table of tables) {
        try {
            const [rows] = await pool.query(`SELECT COUNT(*) as count FROM ${table}`);
            console.log(`${table.padEnd(25)}: ${rows[0].count} rows`);
        } catch (e) {
            console.log(`${table.padEnd(25)}: ❌ ERROR - ${e.message}`);
        }
    }
    process.exit();
}
verify();
