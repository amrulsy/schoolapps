const pool = require('./db');

async function seed() {
    try {
        console.log('--- STARTING DATA SEEDING ---');

        // 1. Seed Units
        console.log('Seeding Units...');
        await pool.query('INSERT IGNORE INTO units (id, nama) VALUES (1, "SMA"), (2, "SMK")');

        // 2. Seed Kelas
        console.log('Seeding Kelas...');
        const kelas = [
            [1, 1, 'X IPA 1'], [2, 1, 'X IPA 2'], [3, 1, 'X IPS 1'],
            [4, 1, 'XI IPA 1'], [5, 1, 'XI IPS 1'], [6, 1, 'XII IPA 1'],
            [7, 2, 'X TKJ 1'], [8, 2, 'X TKJ 2'], [9, 2, 'XI TKJ 1']
        ];
        for (const k of kelas) {
            await pool.query('INSERT IGNORE INTO kelas (id, unit_id, nama) VALUES (?, ?, ?)', k);
        }

        // 3. Seed Categories
        console.log('Seeding Categories...');
        const cats = [
            [1, 'CAT-SPP', 'SPP', 150000, 'bulanan', 'Sumbangan Pembinaan Pendidikan bulanan'],
            [2, 'CAT-UAS', 'Ujian Semester', 100000, 'semesteran', 'Biaya ujian akhir semester'],
            [3, 'CAT-DU', 'Daftar Ulang', 500000, 'tahunan', 'Biaya daftar ulang tahun ajaran baru'],
            [4, 'CAT-SRG', 'Seragam', 350000, 'tahunan', 'Seragam sekolah baru'],
            [5, 'CAT-BKP', 'Buku Paket', 200000, 'semesteran', 'Peminjaman buku paket per semester']
        ];
        for (const c of cats) {
            await pool.query('INSERT IGNORE INTO kategori_tagihan (id, kode, nama, nominal, tipe, keterangan) VALUES (?, ?, ?, ?, ?, ?)', c);
        }

        // 4. Seed Tahun Ajaran
        console.log('Seeding Tahun Ajaran...');
        await pool.query('INSERT IGNORE INTO tahun_ajaran (id, tahun, status) VALUES (1, "2025/2026", "aktif"), (2, "2024/2025", "nonaktif")');

        // 5. Seed Siswa (Top 5 only for initial test)
        console.log('Seeding initial Students...');
        const students = [
            [1, 1, '0012345601', '25001', 'Ahmad Fauzi', 'L', 'aktif', 'Bogor', '2010-03-15'],
            [2, 1, '0012345602', '25002', 'Budi Santoso', 'L', 'aktif', 'Jakarta', '2010-06-22'],
            [3, 3, '0012345603', '25003', 'Citra Dewi', 'P', 'aktif', 'Bandung', '2010-01-08'],
            [4, 4, '0012345604', '24004', 'Dewi Lestari', 'P', 'aktif', 'Surabaya', '2009-11-30'],
            [5, 6, '0012345605', '23005', 'Eko Prasetyo', 'L', 'lulus', 'Yogyakarta', '2008-07-12']
        ];
        for (const s of students) {
            await pool.query(`
                INSERT IGNORE INTO siswa (id, kelas_id, nisn, nis, nama, jk, status, tempat_lahir, tgl_lahir) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, s);
        }

        console.log('✅ SEEDING SUCCESS: Master data initialized!');
        process.exit(0);
    } catch (err) {
        console.error('❌ SEEDING FAILED:', err.message);
        process.exit(1);
    }
}

seed();
