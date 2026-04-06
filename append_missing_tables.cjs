const fs = require('fs');

const localFile = 'c:\\dev\\schoolapps\\backend\\schema.sql';
const patchFile = 'c:\\dev\\schoolapps\\backend\\hosting_schema_patch_v7.sql';

const localSql = fs.readFileSync(localFile, 'utf8');

const missingTables = [
  'cms_partners',
  'cms_ppdb_requirements',
  'cms_ppdb_steps',
  'log_generate',
  'nilai_semester',
  'nilai_tp',
  'rapor_catatan',
  'rapor_ekskul',
  'tujuan_pembelajaran',
  'wali_kelas'
];

let appendData = '\n\n-- ==========================================\n-- ADDING MISSING TABLES\n-- ==========================================\n\n';

for (const tableName of missingTables) {
  // Try to find the exact CREATE TABLE statement
  // We look for CREATE TABLE `tableName` ( ... ) ENGINE=...;
  // This match can be delicate. Let's use a non-greedy .*? across lines
  // The table could exist with or without backticks
  
  // Create RegExp for `CREATE TABLE \`tableName\` ( ... );`
  // that matches until the first line that looks like `) ENGINE=` or just `);`
  const regex = new RegExp(`CREATE\\s+TABLE\\s+(?:IF\\s+NOT\\s+EXISTS\\s+)?(?:\\\`?${tableName}\\\`?)\\s*\\([\\s\\S]*?\\)\\s*(?:ENGINE\\s*=\\s*\\w+.*?)?;`, 'i');
  
  const match = localSql.match(regex);
  if (match) {
    appendData += `-- Tabel: ${tableName}\n`;
    appendData += match[0] + '\n\n';
  } else {
    appendData += `-- WARNING: CREATE TABLE untuk ${tableName} tidak ditemukan di schema.sql lokal\n\n`;
  }
}

fs.appendFileSync(patchFile, appendData);
console.log('Successfully appended missing tables to the patch file.');
