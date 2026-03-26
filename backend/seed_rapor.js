const pool = require('./db');
const bcrypt = require('bcryptjs');

async function seed() {
    console.log('🌱 Seeding DEFINITIVE test data with correct ID associations...');
    try {
        const passwordHash = await bcrypt.hash('password', 10);

        // 1. Get/Create User 'gururapor' and get its ID
        const [userRows] = await pool.query("SELECT id FROM users WHERE username = 'gururapor'");
        let userId;
        if (userRows.length > 0) {
            userId = userRows[0].id;
        } else {
            const [userInsert] = await pool.query("INSERT INTO users (username, password_hash, role) VALUES ('gururapor', ?, 'guru')", [passwordHash]);
            userId = userInsert.insertId;
        }
        console.log(`👤 User 'gururapor' has ID: ${userId}`);

        // 2. Ensure Guru Rapor exists with ID 270001 AND correct user_id
        await pool.query("REPLACE INTO guru (id, user_id, nip, nama) VALUES (270001, ?, '12345', 'Guru Rapor')", [userId]);

        // 3. Ensure Kelas X DKV exists with ID 7
        await pool.query("INSERT IGNORE INTO units (id, nama) VALUES (1, 'SMK')");
        await pool.query("REPLACE INTO kelas (id, unit_id, nama) VALUES (7, 1, 'X DKV')");

        // 4. Ensure Mapel Dasar-dasar DKV exists with ID 390001
        await pool.query("REPLACE INTO mata_pelajaran (id, nama, tingkat) VALUES (390001, 'Dasar-dasar DKV', 'Peminatan')");

        // 5. Get/Create Active Year
        const [taRows] = await pool.query("SELECT id FROM tahun_ajaran WHERE status = 'aktif' LIMIT 1");
        let taId = taRows[0]?.id;
        if (!taId) {
            const [taNew] = await pool.query("INSERT INTO tahun_ajaran (tahun, semester_aktif, status) VALUES ('2025/2026', 'Ganjil', 'aktif')");
            taId = taNew.insertId;
        }
        // Force status to 'aktif' (lowercase) for consistency, but frontend will be fixed too
        await pool.query("UPDATE tahun_ajaran SET status = 'aktif' WHERE id = ?", [taId]);

        // 6. Create Schedule
        await pool.query("INSERT IGNORE INTO jam_pelajaran (id, jam_ke, jam_mulai, jam_selesai, tipe) VALUES (1, 1, '07:00:00', '07:45:00', 'Pelajaran')");
        await pool.query(`REPLACE INTO jadwal_pelajaran (id, guru_id, kelas_id, mapel_id, hari, jam_pelajaran_id) 
                         VALUES (1, 270001, 7, 390001, 'Senin', 1)`);

        // 7. Ensure Wali Kelas assignment
        await pool.query(`REPLACE INTO wali_kelas (guru_id, kelas_id, tahun_ajaran_id) 
                         VALUES (270001, 7, ?)`, [taId]);

        // 8. Move Student to the right class
        await pool.query("UPDATE siswa SET kelas_id = 7 WHERE id = 1");

        console.log('✅ Definitive seeding complete!');
    } catch (err) {
        console.error('❌ Seeding failed:', err.message);
    }
    process.exit(0);
}

seed();
