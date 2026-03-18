const pool = require('./db');
const AdmZip = require('adm-zip');
const path = require('path');
const fs = require('fs');

async function testExport() {
    try {
        console.log('Fetching tables...');
        const [rows] = await pool.query('SHOW TABLES');
        const tables = rows.map(row => Object.values(row)[0]);
        console.log('Tables:', tables);

        const backupData = {};
        for (const table of tables) {
            console.log(`Exporting table: ${table}...`);
            const [rows] = await pool.query(`SELECT * FROM ${table}`);
            backupData[table] = rows;
        }

        console.log('Creating ZIP archive...');
        const zip = new AdmZip();

        console.log('Adding database.json...');
        const dbJson = JSON.stringify(backupData, null, 2);
        console.log(`Database JSON size: ${dbJson.length} bytes`);
        zip.addFile('database.json', Buffer.from(dbJson, 'utf8'));

        const uploadsPath = path.join(__dirname, 'uploads');
        if (fs.existsSync(uploadsPath)) {
            console.log('Adding uploads folder:', uploadsPath);
            zip.addLocalFolder(uploadsPath, 'uploads');
        } else {
            console.log('Uploads folder not found:', uploadsPath);
        }

        console.log('Converting ZIP to buffer...');
        const zipBuffer = zip.toBuffer();
        console.log(`ZIP buffer size: ${zipBuffer.length} bytes`);

        fs.writeFileSync('test-backup-output.zip', zipBuffer);
        console.log('Backup saved to test-backup-output.zip');

        process.exit(0);
    } catch (err) {
        console.error('Export test failed:', err);
        process.exit(1);
    }
}

testExport();
