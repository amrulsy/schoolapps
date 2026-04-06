const fs = require('fs');
const path = require('path');

const hostingSqlPath = path.join(__dirname, '../sya40748_smkpprq_sch_id.sql');
if (!fs.existsSync(hostingSqlPath)) {
    console.error('File not found:', hostingSqlPath);
    process.exit(1);
}

const content = fs.readFileSync(hostingSqlPath, 'utf8');

// Regex to find CREATE TABLE and their columns
const tableRegex = /CREATE TABLE [^`]*`([^`]+)` \(([\s\S]*?)\)(?:ENGINE|;)[\s\S]*?(?=CREATE TABLE|$)/gi;
const tables = {};

let match;
while ((match = tableRegex.exec(content)) !== null) {
    const tableName = match[1];
    const columnsText = match[2];
    
    const lines = columnsText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    const columns = [];
    
    for (const line of lines) {
        if (line.toUpperCase().startsWith('PRIMARY KEY') || 
            line.toUpperCase().startsWith('KEY ') || 
            line.toUpperCase().startsWith('CONSTRAINT ') ||
            line.toUpperCase().startsWith('UNIQUE KEY')) {
            continue;
        }
        
        const colMatch = line.match(/^`([^`]+)`/);
        if (colMatch) {
            columns.push(colMatch[1]);
        }
    }
    
    tables[tableName] = columns;
}

console.log('--- FOUND TABLES IN HOSTING DB ---');
console.log(Object.keys(tables).join(', '));
console.log('\n--- SPECIFIC COLUMN CHECKS ---');

const checkCol = (t, c) => {
    if (!tables[t]) return `(Table ${t} MISSING)`;
    return tables[t].includes(c) ? 'FOUND' : 'MISSING';
};

console.log('siswa.rfid_uid:', checkCol('siswa', 'rfid_uid'));
console.log('siswa.pin:', checkCol('siswa', 'pin'));
console.log('siswa_orangtua.hubungan:', checkCol('siswa_orangtua', 'hubungan'));
console.log('siswa_orangtua.alamat:', checkCol('siswa_orangtua', 'alamat'));
console.log('tahun_ajaran.semester_aktif:', checkCol('tahun_ajaran', 'semester_aktif'));
console.log('jurnal_mengajar.nama_kelas:', checkCol('jurnal_mengajar', 'nama_kelas'));

// Check for known recent tables
const expectedTables = [
    'lab_inventory', 'lab_borrowing', 
    'siswa_kelas_history', 'rapor_merdeka', 'ekstrakurikuler', 'rapor_ekstrakurikuler',
    'cms_setting', 'cms_hero', 'cms_feature', 'cms_program', 'cms_testimonial', 'cms_faq', 'ppdb_pendaftar', 'ppdb_dokumen'
];

console.log('\n--- KNOWN RECENT TABLES STATUS ---');
for (const t of expectedTables) {
    console.log(`${t}:`, tables[t] ? 'EXISTS' : 'MISSING');
}
