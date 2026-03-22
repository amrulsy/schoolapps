const pool = require('../db');

async function initMenus() {
    console.log('⏳ Initializing student_menus table...');
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS student_menus (
                id INT AUTO_INCREMENT PRIMARY KEY,
                label VARCHAR(100) NOT NULL,
                icon VARCHAR(50) NOT NULL,
                path VARCHAR(255) NOT NULL,
                color VARCHAR(20) DEFAULT '#3B82F6',
                bg VARCHAR(30) DEFAULT 'rgba(59, 130, 246, 0.15)',
                is_active BOOLEAN DEFAULT TRUE,
                sort_order INT DEFAULT 0
            )
        `);
        console.log('✅ Table student_menus created or already exists.');

        const [rows] = await pool.query('SELECT COUNT(*) as count FROM student_menus');
        if (rows[0].count === 0) {
            console.log('⏳ Seeding initial student menus data...');
            const seedData = [
                ['Presensi', 'ClipboardCheck', '/siswa-portal/presensi', '#10B981', 'rgba(16, 185, 129, 0.15)', 1],
                ['e-Rapor', 'Award', '/siswa-portal/nilai', '#8B5CF6', 'rgba(139, 92, 246, 0.15)', 2],
                ['Tagihan', 'Wallet', '/siswa-portal/keuangan', '#F59E0B', 'rgba(245, 158, 11, 0.15)', 3],
                ['Tabungan', 'PiggyBank', '/siswa-portal/tabungan', '#06B6D4', 'rgba(6, 182, 212, 0.15)', 4],
                ['Mading', 'Megaphone', '/siswa-portal/pengumuman', '#EC4899', 'rgba(236, 72, 153, 0.15)', 5],
                ['BK / Poin', 'Shield', '/siswa-portal/bk', '#EF4444', 'rgba(239, 68, 68, 0.15)', 6],
                ['Pesan', 'MessageCircle', '/siswa-portal/pesan', '#3B82F6', 'rgba(59, 130, 246, 0.15)', 7],
                ['Profil Saya', 'User', '/siswa-portal/profil', '#6366F1', 'rgba(99, 102, 241, 0.15)', 8]
            ];

            for (const menu of seedData) {
                await pool.query(
                    'INSERT INTO student_menus (label, icon, path, color, bg, sort_order) VALUES (?, ?, ?, ?, ?, ?)',
                    menu
                );
            }
            console.log('✅ Data seeded successfully.');
        } else {
            console.log('ℹ️ Table student_menus already contains data. Skipped seeding.');
        }

    } catch (err) {
        console.error('❌ Error initializing student_menus:', err.message);
    } finally {
        process.exit();
    }
}

initMenus();
