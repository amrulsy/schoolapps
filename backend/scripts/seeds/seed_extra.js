const pool = require('./db');

async function seedExtra() {
    console.log('🚀 Seeding Extra Student Data (Orang Tua & Dokumen)...');
    try {
        // Fetch all student IDs
        const [rows] = await pool.query('SELECT id FROM siswa');
        const studentIds = rows.map(r => r.id);

        if (studentIds.length === 0) {
            console.log('⚠️ No students found. Please run seed.js first.');
            process.exit(0);
        }

        // 1. Seed Orang Tua (Ayah & Ibu for each student)
        console.log('Inserting Orang Tua data...');
        const otValues = [];
        const pekerjaanAyah = ['Karyawan Swasta', 'Wiraswasta', 'PNS', 'Buruh', 'Petugas Keamanan'];
        const pekerjaanIbu = ['Ibu Rumah Tangga', 'Guru', 'Pedagang', 'Karyawan Swasta', 'Perawat'];
        const pendidikan = ['SD', 'SMP', 'SMA', 'D3', 'S1', 'S2'];

        for (const sid of studentIds) {
            // Ayah
            otValues.push([
                sid, 'ayah', 'Ayah Siswa ' + sid, '320101' + (1000000000 + sid),
                pendidikan[Math.floor(Math.random() * pendidikan.length)],
                pekerjaanAyah[Math.floor(Math.random() * pekerjaanAyah.length)],
                (Math.floor(Math.random() * 5) + 1) * 1000000,
                '0812' + (10000000 + sid), 'Hidup'
            ]);
            // Ibu
            otValues.push([
                sid, 'ibu', 'Ibu Siswa ' + sid, '320101' + (2000000000 + sid),
                pendidikan[Math.floor(Math.random() * pendidikan.length)],
                pekerjaanIbu[Math.floor(Math.random() * pekerjaanIbu.length)],
                (Math.floor(Math.random() * 3) + 1) * 1000000,
                '0856' + (20000000 + sid), 'Hidup'
            ]);
        }

        await pool.query('DELETE FROM siswa_orangtua');
        await pool.query(`
            INSERT INTO siswa_orangtua (siswa_id, jenis, nama, nik, pendidikan, pekerjaan, penghasilan, hp, status_hidup)
            VALUES ?
        `, [otValues]);

        // 2. Seed Dokumen (KK, Akte for each student)
        console.log('Inserting Dokumen data...');
        const docValues = [];
        const docTypes = [
            { kode: 'KK', nama: 'Kartu Keluarga' },
            { kode: 'AKTE', nama: 'Akte Kelahiran' },
            { kode: 'IJZ', nama: 'Ijazah Terakhir' }
        ];

        for (const sid of studentIds) {
            for (const doc of docTypes) {
                const hasFile = Math.random() > 0.2;
                docValues.push([
                    sid, doc.kode, doc.nama,
                    hasFile ? (Math.random() > 0.4 ? 'Terverifikasi' : 'Belum Verifikasi') : 'Tidak Ada',
                    hasFile ? '1.2MB' : null,
                    hasFile ? `uploads/docs/${doc.kode.toLowerCase()}_${sid}.pdf` : null
                ]);
            }
        }

        await pool.query('DELETE FROM siswa_dokumen');
        await pool.query(`
            INSERT INTO siswa_dokumen (siswa_id, kode_dokumen, nama_dokumen, status, file_size, file_path)
            VALUES ?
        `, [docValues]);

        console.log('✅ EXTRA DATA SEEDING SUCCESS!');
        process.exit(0);
    } catch (err) {
        console.error('❌ EXTRA SEEDING FAILED:', err.message);
        process.exit(1);
    }
}

seedExtra();
