/**
 * SIAS — Backfill Snapshot Columns
 * ==================================
 * Script satu kali untuk mengisi kolom snapshot dari data yang sudah ada.
 * Jalankan SETELAH migration 013_snapshot_columns.sql sudah dieksekusi.
 *
 * Jalankan: node scripts/backfill_snapshots.js
 */
const pool = require('../db');

async function run() {
  const connection = await pool.getConnection();
  console.log('\n🔄 SIAS — Backfill Snapshot Columns\n');

  try {
    await connection.beginTransaction();

    // ─────────────────────────────────────────────────────────
    // 1. jurnal_mengajar: isi nama_kelas, nama_mapel, nama_guru
    // ─────────────────────────────────────────────────────────
    console.log('📋 1/5 Backfill jurnal_mengajar (nama_kelas, nama_mapel, nama_guru)...');
    const [jumlahJurnal] = await connection.query(`
      UPDATE jurnal_mengajar jm
        JOIN kelas k          ON jm.kelas_id  = k.id
        JOIN mata_pelajaran m ON jm.mapel_id  = m.id
        JOIN guru g           ON jm.guru_id   = g.id
      SET jm.nama_kelas = k.nama,
          jm.nama_mapel = m.nama,
          jm.nama_guru  = g.nama
      WHERE jm.nama_kelas IS NULL OR jm.nama_mapel IS NULL OR jm.nama_guru IS NULL
    `);
    console.log(`   ✅ Updated ${jumlahJurnal.affectedRows} jurnal records.`);

    // ─────────────────────────────────────────────────────────
    // 2. presensi_sesi: isi nama_siswa dan nis
    // ─────────────────────────────────────────────────────────
    console.log('\n📋 2/5 Backfill presensi_sesi (nama_siswa, nis)...');
    const [jumlahPresensi] = await connection.query(`
      UPDATE presensi_sesi ps
        JOIN siswa s ON ps.siswa_id = s.id
      SET ps.nama_siswa = s.nama,
          ps.nis        = s.nis
      WHERE ps.nama_siswa IS NULL OR ps.nis IS NULL
    `);
    console.log(`   ✅ Updated ${jumlahPresensi.affectedRows} presensi_sesi records.`);

    // ─────────────────────────────────────────────────────────
    // 3. infaq_harian: isi nama_siswa dan nis
    // ─────────────────────────────────────────────────────────
    console.log('\n📋 3/5 Backfill infaq_harian (nama_siswa, nis)...');
    const [jumlahInfaq] = await connection.query(`
      UPDATE infaq_harian ih
        JOIN siswa s ON ih.siswa_id = s.id
      SET ih.nama_siswa = s.nama,
          ih.nis        = s.nis
      WHERE ih.nama_siswa IS NULL OR ih.nis IS NULL
    `);
    console.log(`   ✅ Updated ${jumlahInfaq.affectedRows} infaq_harian records.`);

    // ─────────────────────────────────────────────────────────
    // 4. tabungan: isi nama_siswa
    // ─────────────────────────────────────────────────────────
    console.log('\n📋 4/5 Backfill tabungan (nama_siswa)...');
    const [jumlahTabungan] = await connection.query(`
      UPDATE tabungan t
        JOIN siswa s ON t.siswa_id = s.id
      SET t.nama_siswa = s.nama
      WHERE t.nama_siswa IS NULL
    `);
    console.log(`   ✅ Updated ${jumlahTabungan.affectedRows} tabungan records.`);

    // ─────────────────────────────────────────────────────────
    // 5. tagihan: isi nama_kategori
    // ─────────────────────────────────────────────────────────
    console.log('\n📋 5/5 Backfill tagihan (nama_kategori)...');
    const [jumlahTagihan] = await connection.query(`
      UPDATE tagihan t
        JOIN kategori_tagihan kt ON t.kategori_id = kt.id
      SET t.nama_kategori = kt.nama
      WHERE t.nama_kategori IS NULL
    `);
    console.log(`   ✅ Updated ${jumlahTagihan.affectedRows} tagihan records.`);

    // ─────────────────────────────────────────────────────────
    // 6. siswa_kelas_history: snapshot dari data siswa aktif saat ini
    //    (hanya mengisi untuk tahun ajaran aktif agar tidak duplikat)
    // ─────────────────────────────────────────────────────────
    console.log('\n📋 Bonus: Snapshot siswa_kelas_history dari tahun ajaran aktif...');
    const [[activeTa]] = await connection.query(
      `SELECT id, tahun, semester_aktif FROM tahun_ajaran WHERE status = 'aktif' LIMIT 1`
    );
    if (activeTa) {
      const [jumlahSkh] = await connection.query(`
        INSERT IGNORE INTO siswa_kelas_history (siswa_id, kelas_id, nama_kelas, tahun_ajaran_id, nama_tahun_ajaran, semester)
        SELECT s.id, k.id, k.nama, ?, ?, ?
        FROM siswa s
        JOIN kelas k ON s.kelas_id = k.id
        WHERE s.status = 'aktif'
      `, [activeTa.id, activeTa.tahun, activeTa.semester_aktif || 'Ganjil']);
      console.log(`   ✅ Inserted ${jumlahSkh.affectedRows} rows ke siswa_kelas_history untuk TA ${activeTa.tahun}.`);
    } else {
      console.log('   ⏭️  Tidak ada tahun ajaran aktif ditemukan, skip snapshot kelas.');
    }

    await connection.commit();
    console.log('\n🎉 Backfill selesai! Semua kolom snapshot sudah terisi.\n');
  } catch (err) {
    await connection.rollback();
    console.error('\n❌ Backfill GAGAL (rollback dilakukan):', err.message);
    console.error(err);
  } finally {
    connection.release();
    process.exit(0);
  }
}

run();
