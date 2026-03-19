const pool = require('./db');

async function seedPpdb() {
    console.log('🚀 Seeding PPDB Registrations...');
    try {
        // Clear existing registrations first to avoid duplicate number errors
        await pool.query('DELETE FROM ppdb_registrations');

        const firstNames = ['Rizky', 'Aditya', 'Siti', 'Ayu', 'Dimas', 'Eri', 'Faisal', 'Gita', 'Hana', 'Irfan', 'Jaka', 'Kiki', 'Lutfi', 'Maya', 'Nanda'];
        const lastNames = ['Pratama', 'Hidayat', 'Nuraini', 'Lestari', 'Wicaksono', 'Handayani', 'Saputra', 'Kusuma', 'Maulana', 'Putri'];
        const schools = ['SMP Negeri 1 Kota', 'SMP Negeri 5 Pusat', 'SMP Al-Hikmah', 'MTS Muhammadiyah 2', 'SMP Kristen Harapan', 'SMP Nusantara'];
        const statuses = ['pending', 'approved', 'rejected'];

        const regValues = [];
        const now = new Date();

        for (let i = 1; i <= 25; i++) {
            const fName = firstNames[Math.floor(Math.random() * firstNames.length)];
            const lName = lastNames[Math.floor(Math.random() * lastNames.length)];
            const nama = `${fName} ${lName}`;
            const regNumber = `2025-PPDB-${String(i).padStart(4, '0')}`;
            const nisn = `00${90000000 + i}`;
            const gender = Math.random() > 0.5 ? 'L' : 'P';
            const school = schools[Math.floor(Math.random() * schools.length)];

            // Weighted status: more approved and pending than rejected
            let status = 'pending';
            const rand = Math.random();
            if (rand > 0.6) status = 'approved';
            else if (rand < 0.1) status = 'rejected';

            // Random creation date in the last 30 days
            const createdAt = new Date(now.getTime() - Math.floor(Math.random() * 30 * 86400000));

            regValues.push([
                regNumber,
                nisn,
                nama,
                'Bogor',
                '2010-05-15',
                gender,
                'Islam',
                school,
                '08' + Math.floor(100000000 + Math.random() * 900000000),
                '08' + Math.floor(100000000 + Math.random() * 900000000),
                'Jl. Mawar No. ' + i + ', Kel. Bunga, Kec. Mekar',
                status,
                createdAt
            ]);
        }

        await pool.query(`
            INSERT INTO ppdb_registrations 
            (registration_number, nisn, nama_lengkap, tempat_lahir, tgl_lahir, jenis_kelamin, agama, asal_sekolah, telepon_siswa, telepon_ortu, alamat_lengkap, status, created_at)
            VALUES ?
        `, [regValues]);

        console.log(`✅ SUCCESS: Seeded 25 PPDB Registrations!`);
        process.exit(0);
    } catch (err) {
        console.error('❌ ERROR seeding PPDB:', err.message);
        process.exit(1);
    }
}

seedPpdb();
