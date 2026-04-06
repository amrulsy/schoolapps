const pool = require('./db');

async function check() {
    console.log("=== DIAGNOSIS STRUKTUR DATABASE HOSTING ===");
    try {
        // Check tahun_ajaran
        const [taCols] = await pool.query("DESCRIBE tahun_ajaran");
        const hasSemesterAktif = taCols.some(c => c.Field === 'semester_aktif');
        console.log(`[tahun_ajaran] semester_aktif: ${hasSemesterAktif ? 'ADA' : 'TIDAK ADA (ERROR!)'}`);

        // Check siswa_orangtua
        const [ortuCols] = await pool.query("DESCRIBE siswa_orangtua");
        const hasHubungan = ortuCols.some(c => c.Field === 'hubungan');
        const hasAlamat = ortuCols.some(c => c.Field === 'alamat');
        console.log(`[siswa_orangtua] hubungan: ${hasHubungan ? 'ADA' : 'TIDAK ADA (ERROR!)'}`);
        console.log(`[siswa_orangtua] alamat: ${hasAlamat ? 'ADA' : 'TIDAK ADA (ERROR!)'}`);

        // Check siswa_kelas_history
        try {
            await pool.query("SELECT 1 FROM siswa_kelas_history LIMIT 1");
            console.log(`[siswa_kelas_history] Tabel: ADA`);
        } catch (e) {
            console.log(`[siswa_kelas_history] Tabel: TIDAK ADA (WARNING)`);
        }

        // Check siswa
        const [siswaCols] = await pool.query("DESCRIBE siswa");
        const hasJenisPend = siswaCols.some(c => c.Field === 'jenis_pendaftaran');
        const hasTglMulai = siswaCols.some(c => c.Field === 'tanggal_mulai_sekolah');
        console.log(`[siswa] jenis_pendaftaran: ${hasJenisPend ? 'ADA' : 'TIDAK ADA'}`);
        console.log(`[siswa] tanggal_mulai_sekolah: ${hasTglMulai ? 'ADA' : 'TIDAK ADA'}`);

        if (!hasSemesterAktif || !hasHubungan || !hasAlamat) {
            console.log("\n>>> KESIMPULAN: Database TIDAK SESUAI. Silakan jalankan 'hosting_sync_v6_siswa_fix.sql' di phpMyAdmin.");
        } else {
            console.log("\n>>> KESIMPULAN: Struktur database sudah sesuai.");
        }

    } catch (err) {
        console.error("Gagal mengecek database:", err.message);
    }
    process.exit();
}

check();
