const express = require('express');
const router = express.Router();
const pool = require('../../db');
const AdmZip = require('adm-zip');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const upload = multer({ dest: 'temp_uploads/' });

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
    let tempZipPath = null;

    try {
        const tables = await getAllTables();
        console.log(`[BACKUP] Exporting ${tables.length} tables...`);

        const backupData = {};

        for (const table of tables) {
            try {
                // Ignore system tables if any show up
                if (table.startsWith('mysql') || table.startsWith('information_schema') || table.startsWith('performance_schema')) {
                    continue;
                }

                console.log(`[BACKUP] Querying table: ${table}...`);
                const [rows] = await pool.query(`SELECT * FROM ${table}`);
                backupData[table] = rows;
            } catch (tableErr) {
                console.error(`[BACKUP] Failed to export table ${table}:`, tableErr);
                // We might want to continue or fail. For now, let's fail to be safe
                throw new Error(`Gagal mengekspor tabel ${table}: ${tableErr.message}`);
            }
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
        if (fs.existsSync(uploadsPath)) {
            try {
                console.log('[BACKUP] Adding uploads folder...');
                // Check if folder is not empty to avoid some zip library issues
                const files = fs.readdirSync(uploadsPath);
                if (files.length > 0) {
                    zip.addLocalFolder(uploadsPath, 'uploads');
                }
            } catch (uploadErr) {
                console.warn('[BACKUP] Warning: Failed to add uploads folder to ZIP:', uploadErr);
                // Don't fail the whole backup just for uploads unless critical
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

        await connection.beginTransaction();
        console.log('[BACKUP] Disabling foreign key checks...');
        await connection.query('SET FOREIGN_KEY_CHECKS = 0');

        for (const table of tables) {
            console.log(`[BACKUP] Restoring table: ${table}...`);
            // Clear table
            await connection.query(`TRUNCATE TABLE ${table}`);

            const rows = backupData[table];
            if (!rows || rows.length === 0) continue;

            const columns = Object.keys(rows[0]);
            const placeholders = columns.map(() => '?').join(', ');
            const query = `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})`;

            for (const row of rows) {
                const values = columns.map(col => row[col]);
                await connection.query(query, values);
            }
        }

        await connection.query('SET FOREIGN_KEY_CHECKS = 1');
        await connection.commit();
        console.log('[BACKUP] Database restore complete.');

        // 2. Process Uploads
        const uploadsPath = path.join(__dirname, '../../uploads');
        if (!fs.existsSync(uploadsPath)) {
            fs.mkdirSync(uploadsPath, { recursive: true });
        }

        // Extract uploads entry if it exists
        const uploadsEntry = zipEntries.find(e => e.entryName.startsWith('uploads/'));
        if (uploadsEntry) {
            console.log('[BACKUP] Extracting uploads...');
            zip.extractEntryTo('uploads/', path.join(__dirname, '../../'), true, true);
        }

        // Cleanup temp file
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }

        console.log('[BACKUP] Import successful.');
        res.json({ success: true, message: 'Data berhasil direstore' });
    } catch (err) {
        if (connection) await connection.rollback();
        console.error('[BACKUP IMPORT ERROR]', err);
        if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
        res.status(500).json({ error: 'Gagal restore data: ' + err.message });
    } finally {
        if (connection) connection.release();
    }
});

module.exports = router;
