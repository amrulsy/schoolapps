require('dotenv').config();
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
    host: process.env.TIDB_HOST,
    port: process.env.TIDB_PORT,
    user: process.env.TIDB_USER,
    password: process.env.TIDB_PASSWORD,
    database: process.env.TIDB_DATABASE,
    ssl: { rejectUnauthorized: true },
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

async function runSeed() {
    console.log('🌱 Memulai proses seeding data untuk SEMUA siswa...');

    try {
        const [admins] = await pool.query("SELECT id FROM users WHERE role='admin' LIMIT 1");
        const adminId = admins.length > 0 ? admins[0].id : 1;

        const [students] = await pool.query("SELECT id, kelas_id FROM siswa LIMIT 15"); // Cukup 15 orang aja
        if (students.length === 0) {
            console.log('⚠️ Tidak ada data siswa ditemukan!');
            process.exit(1);
        }

        const [tahun] = await pool.query("SELECT id FROM tahun_ajaran WHERE status='aktif' LIMIT 1");
        const tahunAjaranId = tahun.length > 0 ? tahun[0].id : 1;

        // 1. Modul Tabungan
        console.log('💰 Seeding Tabungan...');
        await pool.query('DELETE FROM tabungan');
        await pool.query('ALTER TABLE tabungan AUTO_INCREMENT = 1');
        let tabunganData = [];
        for (let s of students) {
            tabunganData.push([s.id, new Date(Date.now() - 86400000 * 5).toISOString().split('T')[0], 'setor', 500000, 'Tabungan awal', adminId]);
            tabunganData.push([s.id, new Date(Date.now() - 86400000 * 4).toISOString().split('T')[0], 'setor', 100000, 'Tabungan mingguan', adminId]);
            tabunganData.push([s.id, new Date(Date.now() - 86400000 * 2).toISOString().split('T')[0], 'tarik', 50000, 'Beli buku tulis', adminId]);
            tabunganData.push([s.id, new Date().toISOString().split('T')[0], 'setor', 25000, 'Sisa uang jajan', adminId]);
        }
        await pool.query('INSERT INTO tabungan (siswa_id, tanggal, tipe, nominal, note, user_id) VALUES ?', [tabunganData]);

        // 2. Modul BK
        console.log('🛡️ Seeding Bimbingan Konseling (Kategori & Poin)...');
        await pool.query('DELETE FROM bk_catatan');
        await pool.query('DELETE FROM bk_kategori');
        await pool.query('ALTER TABLE bk_catatan AUTO_INCREMENT = 1');
        await pool.query('ALTER TABLE bk_kategori AUTO_INCREMENT = 1');

        const [kat1] = await pool.query("INSERT INTO bk_kategori (nama, tipe, poin) VALUES ('Terlambat Masuk Sekolah', 'pelanggaran', 5)");
        const [kat2] = await pool.query("INSERT INTO bk_kategori (nama, tipe, poin) VALUES ('Membolos Saat Jam Pelajaran', 'pelanggaran', 15)");
        const [kat3] = await pool.query("INSERT INTO bk_kategori (nama, tipe, poin) VALUES ('Juara Kelas', 'prestasi', 50)");

        let bkData = [];
        for (let s of students) {
            bkData.push([s.id, kat1.insertId, new Date(Date.now() - 86400000 * 10).toISOString().split('T')[0], 'Terlambat 15 menit karena angkot', 5]);
            bkData.push([s.id, kat3.insertId, new Date(Date.now() - 86400000 * 30).toISOString().split('T')[0], 'Peringkat besar kemarin', 50]);
            bkData.push([s.id, kat2.insertId, new Date(Date.now() - 86400000 * 5).toISOString().split('T')[0], 'Ketahuan membolos', 15]);
        }
        await pool.query('INSERT INTO bk_catatan (siswa_id, bk_kategori_id, tanggal, keterangan, poin) VALUES ?', [bkData]);

        // 3. Modul Akademik
        console.log('📖 Seeding Nilai & Mata Pelajaran...');
        await pool.query('DELETE FROM nilai_siswa');
        await pool.query('DELETE FROM mata_pelajaran');
        await pool.query('ALTER TABLE nilai_siswa AUTO_INCREMENT = 1');
        await pool.query('ALTER TABLE mata_pelajaran AUTO_INCREMENT = 1');

        const [mapel1] = await pool.query("INSERT INTO mata_pelajaran (nama, tingkat) VALUES ('Pendidikan Agama', 'Nasional')");
        const [mapel2] = await pool.query("INSERT INTO mata_pelajaran (nama, tingkat) VALUES ('Bahasa Indonesia', 'Nasional')");
        const [mapel3] = await pool.query("INSERT INTO mata_pelajaran (nama, tingkat) VALUES ('Pemrograman Web', 'Peminatan')");

        const hitungAkhir = (t, ut, ua) => (t * 0.3) + (ut * 0.3) + (ua * 0.4);
        let nilaiData = [];
        for (let s of students) {
            nilaiData.push([s.id, mapel1.insertId, tahunAjaranId, 'Ganjil', 85, 88, 90, hitungAkhir(85, 88, 90)]);
            nilaiData.push([s.id, mapel2.insertId, tahunAjaranId, 'Ganjil', 80, 85, 88, hitungAkhir(80, 85, 88)]);
            nilaiData.push([s.id, mapel3.insertId, tahunAjaranId, 'Ganjil', 90, 85, 90, hitungAkhir(90, 85, 90)]);
        }
        await pool.query('INSERT INTO nilai_siswa (siswa_id, mapel_id, tahun_ajaran_id, semester, tugas, uts, uas, akhir) VALUES ?', [nilaiData]);

        // 4. Modul Pesan
        console.log('💬 Seeding Pesan Masuk/Keluar...');
        await pool.query('DELETE FROM pesan');
        await pool.query('ALTER TABLE pesan AUTO_INCREMENT = 1');

        const waktu1 = new Date(Date.now() - 86400000 * 2).toISOString().slice(0, 19).replace('T', ' ');
        const waktu2 = new Date(Date.now() - 86400000 * 1).toISOString().slice(0, 19).replace('T', ' ');

        let pesanData = [];
        for (let s of students) {
            pesanData.push([adminId, 'admin', s.id, 'student', 'Halo, mengingatkan untuk mengumpulkan berkas.', waktu1, false]);
            pesanData.push([s.id, 'student', adminId, 'admin', 'Baik pak, besok saya kumpulkan ke TU ya.', waktu2, true]);
        }
        await pool.query('INSERT INTO pesan (pengirim_id, pengirim_type, penerima_id, penerima_type, pesan, waktu, is_read) VALUES ?', [pesanData]);

        console.log('✅ Semua sukses!');
    } catch (err) {
        console.error('❌ Error:', err);
    } finally {
        pool.end();
    }
}

runSeed();
