const express = require('express');
const router = express.Router();
const pool = require('../../db');
const AdmZip = require('adm-zip');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const upload = multer({ dest: 'temp_uploads/', limits: { fileSize: 500 * 1024 * 1024 } }); // Limit diubah menjadi 500MB

// Helper to get all tables
async function getAllTables() {
    try {
        const [rows] = await pool.query('SHOW TABLES');
        return rows.map(row => Object.values(row)[0]);
    } catch (err) {
        console.error('[DATABASE ERROR] Failed to fetch tables:', err);
        throw new Error(`Koneksi database gagal: ${err.message}`);
    }
}

// GET /export - Export database and uploads
router.get('/export', async (req, res) => {
    console.log('[BACKUP] Starting export process...');

    try {
        const allTables = await getAllTables();
        const tables = allTables.filter(t =>
            !t.startsWith('mysql') &&
            !t.startsWith('information_schema') &&
            !t.startsWith('performance_schema')
        );
        console.log(`[BACKUP] Exporting ${tables.length} tables...`);

        const results = await Promise.all(tables.map(async (table) => {
            try {
                console.log(`[BACKUP] Querying table: ${table}...`);
                const [rows] = await pool.query(`SELECT * FROM \`${table}\``);
                return { table, rows };
            } catch (tableErr) {
                throw new Error(`Gagal mengekspor tabel ${table}: ${tableErr.message}`);
            }
        }));

        const backupData = {};
        for (const { table, rows } of results) {
            backupData[table] = rows;
        }

        console.log('[BACKUP] Data collected. Creating ZIP archive...');
        const zip = new AdmZip();

        // Add database JSON
        try {
            const jsonText = JSON.stringify(backupData, (key, value) => {
                // Handle BigInt serialization if any
                return typeof value === 'bigint' ? value.toString() : value;
            }, 2);
            zip.addFile('database.json', Buffer.from(jsonText, 'utf8'));
        } catch (jsonErr) {
            console.error('[BACKUP] JSON stringify failed:', jsonErr);
            throw new Error(`Gagal memproses data JSON: ${jsonErr.message}`);
        }

        // Add uploads directory
        const uploadsPath = path.join(__dirname, '../../uploads');
        try {
            console.log('[BACKUP] Adding uploads folder...');
            const files = fs.readdirSync(uploadsPath);
            if (files.length > 0) {
                zip.addLocalFolder(uploadsPath, 'uploads');
            }
        } catch (uploadErr) {
            if (uploadErr.code !== 'ENOENT') {
                console.warn('[BACKUP] Warning: Failed to add uploads folder to ZIP:', uploadErr);
            }
        }

        console.log('[BACKUP] Generating ZIP buffer...');
        const zipBuffer = zip.toBuffer();

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
        const filename = `backup-sias-${timestamp}.zip`;

        console.log(`[BACKUP] Sending ZIP: ${filename} (${zipBuffer.length} bytes)`);

        res.set({
            'Content-Type': 'application/zip',
            'Content-Disposition': `attachment; filename="${filename}"`,
            'Content-Length': zipBuffer.length
        });

        res.send(zipBuffer);
        console.log('[BACKUP] Export successful.');

    } catch (err) {
        console.error('[BACKUP EXPORT ERROR]', err);
        // Ensure we send a JSON error response if possible
        if (!res.headersSent) {
            res.status(500).json({
                error: `Gagal memproses permintaan backup: ${err.message}`
            });
        }
    }
});

// POST /import - Restore from ZIP
router.post('/import', upload.single('backup'), async (req, res) => {
    const connection = await pool.getConnection();
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'File backup tidak ditemukan' });
        }

        console.log('[BACKUP] Starting import from:', req.file.path);
        const zip = new AdmZip(req.file.path);
        const zipEntries = zip.getEntries();

        // 1. Process Database
        const dbEntry = zipEntries.find(e => e.entryName === 'database.json');
        if (!dbEntry) throw new Error('Data database tidak ditemukan dalam file backup');

        const backupData = JSON.parse(dbEntry.getData().toString('utf8'));
        const tables = Object.keys(backupData);

        // Validate table names against actual DB schema to prevent injection
        const [dbTableRows] = await connection.query('SHOW TABLES');
        const validTablesArray = dbTableRows.map(row => Object.values(row)[0])
            .filter(t => !t.startsWith('mysql') && !t.startsWith('information_schema') && !t.startsWith('performance_schema'));
        const validTables = new Set(validTablesArray);
        
        for (const table of tables) {
            if (!validTables.has(table)) {
                throw new Error(`Tabel tidak valid dalam file backup: ${table}`);
            }
        }

        await connection.beginTransaction();
        console.log('[BACKUP] Disabling foreign key checks...');
        await connection.query('SET FOREIGN_KEY_CHECKS = 0');

        // Pertama, bersihkan (truncate) seluruh tabel valid di database saat ini
        // Ini memastikan tidak ada data lama yang tersisa jika tabel tersebut tidak ada di dalam file backup
        for (const validTable of validTables) {
            console.log(`[BACKUP] Mengosongkan tabel: ${validTable}...`);
            await connection.query(`TRUNCATE TABLE \`${validTable}\``);
        }

        for (const table of tables) {
            console.log(`[BACKUP] Restoring table: ${table}...`);
            
            const rows = backupData[table];
            if (!rows || rows.length === 0) continue;

            // Validate column names against actual schema
            const [colRows] = await connection.query(`SHOW COLUMNS FROM \`${table}\``);
            const validColumns = new Set(colRows.map(c => c.Field));
            const columns = Object.keys(rows[0]).filter(c => validColumns.has(c));
            if (columns.length === 0) continue;

            // Bulk INSERT dengan sistem "Chunking" (dicicil) untuk mencegah error "ER_PS_MANY_PARAM"
            const CHUNK_SIZE = 500; // maksimal baris per eksekusi insert
            for (let i = 0; i < rows.length; i += CHUNK_SIZE) {
                const chunk = rows.slice(i, i + CHUNK_SIZE);
                const rowPlaceholders = `(${columns.map(() => '?').join(', ')})`;
                const allPlaceholders = chunk.map(() => rowPlaceholders).join(', ');
                const allValues = chunk.flatMap(row => columns.map(col => row[col]));
                
                await connection.query(
                    `INSERT INTO \`${table}\` (${columns.map(c => `\`${c}\``).join(', ')}) VALUES ${allPlaceholders}`,
                    allValues
                );
            }
        }

        await connection.query('SET FOREIGN_KEY_CHECKS = 1');
        await connection.commit();
        console.log('[BACKUP] Database restore complete.');

        // 2. Process Uploads
        const uploadsPath = path.join(__dirname, '../../uploads');
        
        // Hapus folder uploads saat ini beserta isinya untuk mencegah adanya orphaned files (file usang)
        if (fs.existsSync(uploadsPath)) {
            console.log('[BACKUP] Membersihkan folder uploads saat ini...');
            fs.rmSync(uploadsPath, { recursive: true, force: true });
        }
        fs.mkdirSync(uploadsPath, { recursive: true });

        // Extract uploads entry if it exists
        const uploadsEntry = zipEntries.find(e => e.entryName.startsWith('uploads/'));
        if (uploadsEntry) {
            console.log('[BACKUP] Extracting uploads...');
            zip.extractEntryTo('uploads/', path.join(__dirname, '../../'), true, true);
        }

        // Cleanup temp file
        try { fs.unlinkSync(req.file.path); } catch (_) { /* already gone */ }

        console.log('[BACKUP] Import successful.');
        res.json({ success: true, message: 'Data berhasil direstore' });
    } catch (err) {
        if (connection) await connection.rollback();
        console.error('[BACKUP IMPORT ERROR]', err);
        try { if (req.file) fs.unlinkSync(req.file.path); } catch (_) { /* already gone */ }
        res.status(500).json({ error: 'Gagal restore data: ' + err.message });
    } finally {
        if (connection) connection.release();
    }
});

module.exports = router;
