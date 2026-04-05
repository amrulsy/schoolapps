/**
 * SIAS — Fix Cascade Integrity Script
 * =====================================
 * Mengubah ON DELETE CASCADE yang berbahaya pada tabel historis
 * menjadi ON DELETE RESTRICT untuk mencegah kehilangan data.
 *
 * Jalankan: node scripts/fix_cascade_integrity.js
 */
const pool = require('../db');

// Daftar FK yang perlu diubah dari CASCADE → RESTRICT
// Format: { table, column, referencedTable, referencedColumn, currentAction, newAction }
const FK_FIXES = [
  // jurnal_mengajar: guru, kelas, mapel CASCADE → RESTRICT
  { table: 'jurnal_mengajar', column: 'guru_id',   refTable: 'guru',            refCol: 'id', newRule: 'RESTRICT' },
  { table: 'jurnal_mengajar', column: 'kelas_id',  refTable: 'kelas',           refCol: 'id', newRule: 'RESTRICT' },
  { table: 'jurnal_mengajar', column: 'mapel_id',  refTable: 'mata_pelajaran',  refCol: 'id', newRule: 'RESTRICT' },

  // presensi_sesi: siswa CASCADE → RESTRICT
  { table: 'presensi_sesi', column: 'siswa_id', refTable: 'siswa', refCol: 'id', newRule: 'RESTRICT' },

  // siswa_presensi: siswa CASCADE → RESTRICT
  { table: 'siswa_presensi', column: 'siswa_id', refTable: 'siswa', refCol: 'id', newRule: 'RESTRICT' },

  // infaq_harian: siswa CASCADE → RESTRICT
  { table: 'infaq_harian', column: 'siswa_id', refTable: 'siswa', refCol: 'id', newRule: 'RESTRICT' },

  // tabungan: siswa CASCADE → RESTRICT
  { table: 'tabungan', column: 'siswa_id', refTable: 'siswa', refCol: 'id', newRule: 'RESTRICT' },

  // tagihan: kategori_tagihan CASCADE → RESTRICT (jangan hapus riwayat tagihan)
  { table: 'tagihan', column: 'kategori_id', refTable: 'kategori_tagihan', refCol: 'id', newRule: 'RESTRICT' },

  // bk_catatan: bk_kategori CASCADE (siswa) dan bk_kategori CASCADE → RESTRICT
  { table: 'bk_catatan', column: 'siswa_id',       refTable: 'siswa',       refCol: 'id', newRule: 'RESTRICT' },
  { table: 'bk_catatan', column: 'bk_kategori_id', refTable: 'bk_kategori', refCol: 'id', newRule: 'RESTRICT' },

  // nilai_semester: tahun_ajaran & mapel CASCADE → RESTRICT
  { table: 'nilai_semester', column: 'siswa_id',        refTable: 'siswa',           refCol: 'id', newRule: 'RESTRICT' },
  { table: 'nilai_semester', column: 'mapel_id',        refTable: 'mata_pelajaran',  refCol: 'id', newRule: 'RESTRICT' },
  { table: 'nilai_semester', column: 'tahun_ajaran_id', refTable: 'tahun_ajaran',    refCol: 'id', newRule: 'RESTRICT' },

  // tujuan_pembelajaran: tahun_ajaran CASCADE → RESTRICT
  { table: 'tujuan_pembelajaran', column: 'tahun_ajaran_id', refTable: 'tahun_ajaran',   refCol: 'id', newRule: 'RESTRICT' },
  { table: 'tujuan_pembelajaran', column: 'mapel_id',        refTable: 'mata_pelajaran', refCol: 'id', newRule: 'RESTRICT' },
  { table: 'tujuan_pembelajaran', column: 'kelas_id',        refTable: 'kelas',          refCol: 'id', newRule: 'RESTRICT' },
  { table: 'tujuan_pembelajaran', column: 'guru_id',         refTable: 'guru',           refCol: 'id', newRule: 'RESTRICT' },

  // nilai_tp: siswa CASCADE → RESTRICT
  { table: 'nilai_tp', column: 'siswa_id', refTable: 'siswa', refCol: 'id', newRule: 'RESTRICT' },

  // rapor_catatan: siswa CASCADE → RESTRICT
  { table: 'rapor_catatan', column: 'siswa_id', refTable: 'siswa', refCol: 'id', newRule: 'RESTRICT' },

  // lab_peminjaman: siswa CASCADE → RESTRICT
  { table: 'lab_peminjaman', column: 'siswa_id', refTable: 'siswa', refCol: 'id', newRule: 'RESTRICT' },
];

async function getDatabase() {
  // TiDB / MySQL: get actual db name from connection
  const [[{ Database: dbName }]] = await pool.query('SELECT DATABASE() as `Database`');
  return dbName;
}

async function findConstraintName(dbName, tableName, columnName, connection) {
  const [rows] = await connection.query(`
    SELECT CONSTRAINT_NAME
    FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
    WHERE TABLE_SCHEMA = ?
      AND TABLE_NAME = ?
      AND COLUMN_NAME = ?
      AND REFERENCED_TABLE_NAME IS NOT NULL
    LIMIT 1
  `, [dbName, tableName, columnName]);
  return rows.length > 0 ? rows[0].CONSTRAINT_NAME : null;
}

async function getDeleteRule(dbName, tableName, constraintName, connection) {
  const [rows] = await connection.query(`
    SELECT DELETE_RULE
    FROM INFORMATION_SCHEMA.REFERENTIAL_CONSTRAINTS
    WHERE CONSTRAINT_SCHEMA = ?
      AND TABLE_NAME = ?
      AND CONSTRAINT_NAME = ?
    LIMIT 1
  `, [dbName, tableName, constraintName]);
  return rows.length > 0 ? rows[0].DELETE_RULE : null;
}

async function fixForeignKey(dbName, fix, connection) {
  const { table, column, refTable, refCol, newRule } = fix;

  const constraintName = await findConstraintName(dbName, table, column, connection);
  if (!constraintName) {
    console.log(`  ⏭️  Skipped: ${table}.${column} — FK constraint not found (maybe doesn't exist yet)`);
    return;
  }

  const currentRule = await getDeleteRule(dbName, table, constraintName, connection);
  if (!currentRule) {
    console.log(`  ⏭️  Skipped: ${table}.${column} — Could not determine current rule`);
    return;
  }

  if (currentRule.toUpperCase() === newRule.toUpperCase()) {
    console.log(`  ✅ Already OK: ${table}.${column} is already ${newRule}`);
    return;
  }

  console.log(`  🔧 Fixing: ${table}.${column} (${constraintName}) : ${currentRule} → ${newRule}`);

  // Drop old FK, re-add with new rule
  await connection.query(`ALTER TABLE \`${table}\` DROP FOREIGN KEY \`${constraintName}\``);
  await connection.query(`
    ALTER TABLE \`${table}\`
    ADD CONSTRAINT \`${constraintName}\`
    FOREIGN KEY (\`${column}\`) REFERENCES \`${refTable}\`(\`${refCol}\`)
    ON DELETE ${newRule}
    ON UPDATE RESTRICT
  `);

  console.log(`  ✅ Fixed: ${table}.${column} → ON DELETE ${newRule}`);
}

async function run() {
  const connection = await pool.getConnection();
  try {
    console.log('\n🔒 SIAS — Fix Cascade Integrity\n');
    const dbName = await getDatabase();
    console.log(`   Database: ${dbName}\n`);

    for (const fix of FK_FIXES) {
      process.stdout.write(`\n📋 ${fix.table}.${fix.column}:\n`);
      try {
        await fixForeignKey(dbName, fix, connection);
      } catch (err) {
        console.error(`  ❌ Error: ${err.message}`);
      }
    }

    console.log('\n\n✅ Fix Cascade Integrity selesai!');
    console.log('   Tabel historis kini dilindungi dari cascade delete.\n');
  } catch (err) {
    console.error('❌ Fatal error:', err.message);
  } finally {
    connection.release();
    process.exit(0);
  }
}

run();
