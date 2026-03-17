const pool = require('./db');

async function seed() {
    const connection = await pool.getConnection();
    try {
        console.log('--- STARTING COMPREHENSIVE DATA SEEDING ---');
        await connection.beginTransaction();

        // 0. Clean old data (reversed order of dependencies)
        console.log('Cleaning existing data...');
        await connection.query('DELETE FROM cashflow');
        await connection.query('DELETE FROM transaksi');
        await connection.query('DELETE FROM tagihan');
        await connection.query('DELETE FROM siswa_orangtua');
        await connection.query('DELETE FROM siswa_dokumen');
        await connection.query('DELETE FROM siswa');
        await connection.query('DELETE FROM tahun_ajaran');
        await connection.query('DELETE FROM kategori_tagihan');
        await connection.query('DELETE FROM kelas');
        await connection.query('DELETE FROM units');
        await connection.query('DELETE FROM users');

        // 1. Seed Units
        console.log('Seeding Units...');
        await connection.query(`
            INSERT INTO units (id, nama) VALUES 
            (1, "Desain Komunikasi Visual"), 
            (2, "Desain Produksi Busana"), 
            (3, "Layanan Perbankan Syariah")
        `);

        // 2. Seed Kelas (User's specific data)
        console.log('Seeding Kelas...');
        const kelas = [
            [1, 1, 'X DKV'], [2, 1, 'XI DKV'], [3, 1, 'XII DKV'],
            [4, 1, 'ALUMNI DKV'], [5, 2, 'X BUSANA'], [6, 2, 'XI DPB'],
            [7, 2, 'XII DPB'], [8, 2, 'ALUMNI DPB'], [9, 3, 'X AKL'],
            [10, 3, 'XI LPBS'], [11, 3, 'XII LPBS'], [12, 3, 'ALUMNI LPBS']
        ];
        await connection.query('INSERT INTO kelas (id, unit_id, nama) VALUES ?', [kelas]);

        // 3. Seed Categories
        console.log('Seeding Categories...');
        const cats = [
            [1, 'SPP', 'SPP', 150000, 'bulanan', 'Iuran bulanan sekolah'],
            [2, 'UAS', 'Ujian Semester', 100000, 'semesteran', 'Biaya ujian semester'],
            [3, 'DU', 'Daftar Ulang', 500000, 'tahunan', 'Biaya daftar ulang'],
            [4, 'SRG', 'Seragam', 450000, 'tahunan', 'Seragam sekolah lengkap'],
            [5, 'BK', 'Buku Paket', 200000, 'semesteran', 'Biaya paket buku pelajaran'],
            [6, 'ESK', 'Eskul/Pramuka', 50000, '3bulanan', 'Iuran kegiatan per triwulan']
        ];
        await connection.query('INSERT INTO kategori_tagihan (id, kode, nama, nominal, tipe, keterangan) VALUES ?', [cats]);

        // 4. Seed Tahun Ajaran
        console.log('Seeding Tahun Ajaran...');
        await connection.query(`
            INSERT INTO tahun_ajaran (id, tahun, status) VALUES 
            (1, "2025/2026", "aktif"), 
            (2, "2024/2025", "nonaktif")
        `);

        // 5. Seed Users
        console.log('Seeding Users...');
        await connection.query(`
            INSERT INTO users (id, nama, username, password_hash, role) VALUES 
            (1, "Pak Ahmad", "admin", "admin123", "admin"),
            (2, "Ibu Siti", "bendahara", "kasir123", "kasir")
        `);

        // 6. Seed Students (Generate 48 students, 4 per class)
        console.log('Seeding 48 Students...');
        const firstNames = ['Ahmad', 'Budi', 'Citra', 'Dewi', 'Eko', 'Fajar', 'Gita', 'Hadi', 'Indah', 'Joko', 'Kartika', 'Lutfi'];
        const lastNames = ['Santoso', 'Prasetyo', 'Wahyuni', 'Lestari', 'Saputra', 'Kusuma', 'Handayani', 'Purnomo', 'Wijaya', 'Utami'];
        const studentValues = [];
        let studentId = 1;

        for (const [kId, uId, kName] of kelas) {
            for (let i = 0; i < 4; i++) {
                const fName = firstNames[Math.floor(Math.random() * firstNames.length)];
                const lName = lastNames[Math.floor(Math.random() * lastNames.length)];
                const nama = `${fName} ${lName} ${studentId}`;
                const nisn = `00${String(studentId).padStart(8, '0')}`;
                const nis = `25${String(studentId).padStart(3, '0')}`;
                const status = kName.includes('ALUMNI') ? 'lulus' : (Math.random() > 0.9 ? 'pindah' : 'aktif');
                const jk = Math.random() > 0.5 ? 'L' : 'P';

                studentValues.push([
                    studentId, kId, nisn, nis, nama, jk, status,
                    'Bogor', '2010-01-01', '08123456789', 'Jl. Pendidikan No. ' + studentId, 'Wali ' + fName
                ]);
                studentId++;
            }
        }
        await connection.query(`
            INSERT INTO siswa (id, kelas_id, nisn, nis, nama, jk, status, tempat_lahir, tgl_lahir, telp, alamat, wali) 
            VALUES ?
        `, [studentValues]);

        // 7. Seed Tagihan (SPP for active students)
        console.log('Seeding Tagihan (SPP for July - December)...');
        const months = ['Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember', 'Januari', 'Februari'];
        const tagihanValues = [];

        // Filter only active students for billing
        const activeStudents = studentValues.filter(s => s[6] === 'aktif');

        activeStudents.forEach(s => {
            const sid = s[0];
            const currentKid = s[1];
            months.forEach((bulan, idx) => {
                const isPaid = idx < 2; // July & August paid
                const billYear = ['Januari', 'Februari'].includes(bulan) ? 2026 : 2025;
                tagihanValues.push([
                    sid, 1, 1, bulan, billYear, 150000, 150000,
                    isPaid ? 'lunas' : 'belum',
                    isPaid ? '2025-08-01' : null,
                    currentKid // Historical class
                ]);
            });
        });

        // Simulating "Naik Kelas" / Historical debt
        // Let's pick student ID 1 and give them a debt from a PREVIOUS class/year
        const studentOne = activeStudents.find(s => s[0] === 1);
        if (studentOne) {
            // Add a bill from June 2025 with class_id 12 (assuming they were in a different class)
            tagihanValues.push([
                1, 1, 1, 'Juni', 2025, 150000, 150000, 'belum', null, 12
            ]);
        }

        if (tagihanValues.length > 0) {
            await connection.query(`
                INSERT INTO tagihan (siswa_id, kategori_id, tahun_ajaran_id, bulan, tahun, nominal_asli, nominal, status, paid_at, kelas_id)
                VALUES ?
            `, [tagihanValues]);
        }

        // 8. Seed Transactions & Cashflow
        console.log('Seeding Transactions & Cashflow...');
        const txValues = [];
        const cfValues = [];
        const now = new Date();

        for (let i = 1; i <= 10; i++) {
            const s = activeStudents[i % activeStudents.length];
            const inv = `INV-202509${String(i).padStart(3, '0')}`;
            const total = 150000;

            // Transaksi
            txValues.push([
                i, inv, new Date(now.getTime() - i * 86400000), s[0], 1, total, total, 0, 'success'
            ]);

            // Cashflow
            cfValues.push([
                i, new Date(now.getTime() - i * 86400000), `Pembayaran SPP - ${inv}`, total, 'masuk', inv
            ]);
        }

        await connection.query(`
            INSERT INTO transaksi (id, invoice_no, tanggal, siswa_id, user_id, total, amount_paid, change_amount, status)
            VALUES ?
        `, [txValues]);

        // Link tagihan lunas to these transactions (Simulate paid bills in seeded data)
        for (let i = 1; i <= 10; i++) {
            const s = activeStudents[i % activeStudents.length];
            // Set July bill for this student to this transaction
            await connection.query('UPDATE tagihan SET transaksi_id = ? WHERE siswa_id = ? AND bulan = "Juli" LIMIT 1', [i, s[0]]);
        }

        await connection.query(`
            INSERT INTO cashflow (id, tanggal, keterangan, nominal, tipe, ref)
            VALUES ?
        `, [cfValues]);

        await connection.commit();
        console.log('✅ SEEDING SUCCESS: Database filled with rich dummy data!');
    } catch (err) {
        await connection.rollback();
        console.error('❌ SEEDING FAILED:', err.message);
        process.exit(1);
    } finally {
        connection.release();
        process.exit(0);
    }
}

seed();
