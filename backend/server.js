const express = require('express');
const cors = require('cors');
const pool = require('./db');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// --- MASTER DATA ROUTES ---

// Units
app.get('/api/units', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM units');
        res.json(rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/units', async (req, res) => {
    try {
        const [result] = await pool.query('INSERT INTO units (nama) VALUES (?)', [req.body.nama]);
        res.status(201).json({ id: result.insertId, nama: req.body.nama });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/units/:id', async (req, res) => {
    try {
        await pool.query('UPDATE units SET nama = ? WHERE id = ?', [req.body.nama, req.params.id]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/units/:id', async (req, res) => {
    try {
        // Cek apakah ada kelas di unit ini
        const [kelas] = await pool.query('SELECT id FROM kelas WHERE unit_id = ?', [req.params.id]);
        if (kelas.length > 0) {
            return res.status(400).json({ error: 'Tidak dapat menghapus Unit yang masih memiliki Kelas.' });
        }
        await pool.query('DELETE FROM units WHERE id = ?', [req.params.id]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// Kelas
app.get('/api/kelas', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM kelas');
        res.json(rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/kelas', async (req, res) => {
    try {
        const { unit_id, nama } = req.body;
        const [result] = await pool.query('INSERT INTO kelas (unit_id, nama) VALUES (?, ?)', [unit_id, nama]);
        res.status(201).json({ id: result.insertId, unit_id, nama });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/kelas/:id', async (req, res) => {
    try {
        await pool.query('UPDATE kelas SET nama = ? WHERE id = ?', [req.body.nama, req.params.id]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/kelas/:id', async (req, res) => {
    try {
        // Cek apakah ada siswa di kelas ini
        const [siswa] = await pool.query('SELECT id FROM siswa WHERE kelas_id = ?', [req.params.id]);
        if (siswa.length > 0) {
            return res.status(400).json({ error: 'Tidak dapat menghapus Kelas yang masih memiliki Siswa terdaftar.' });
        }
        await pool.query('DELETE FROM kelas WHERE id = ?', [req.params.id]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// Kategori Tagihan
app.get('/api/categories', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM kategori_tagihan');
        res.json(rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// Tahun Ajaran
app.get('/api/tahun-ajaran', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM tahun_ajaran');
        res.json(rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- SISWA ROUTES ---

app.get('/api/siswa', async (req, res) => {
    try {
        // Gabungkan dengan nama kelas
        const [rows] = await pool.query(`
            SELECT s.*, k.nama as kelas_nama 
            FROM siswa s 
            LEFT JOIN kelas k ON s.kelas_id = k.id
        `);
        res.json(rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/siswa/:id', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM siswa WHERE id = ?', [req.params.id]);
        if (rows.length === 0) return res.status(404).json({ error: 'Siswa tidak ditemukan' });

        const siswa = rows[0];

        // Ambil Orang Tua
        const [ortu] = await pool.query('SELECT * FROM siswa_orangtua WHERE siswa_id = ?', [siswa.id]);
        siswa.ayah = ortu.find(o => o.jenis === 'ayah') || {};
        siswa.ibu = ortu.find(o => o.jenis === 'ibu') || {};

        // Ambil Dokumen
        const [dok] = await pool.query('SELECT * FROM siswa_dokumen WHERE siswa_id = ?', [siswa.id]);
        siswa.dokumen = dok;

        res.json(siswa);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- TAGIHAN ROUTES ---

app.get('/api/tagihan', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT t.*, s.nama as siswa_nama, k.nama as kategori_nama 
            FROM tagihan t
            JOIN siswa s ON t.siswa_id = s.id
            JOIN kategori_tagihan k ON t.kategori_id = k.id
        `);
        res.json(rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- AUTH ROUTES ---

app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    // Dummy authentication for demo
    if (username === 'admin' && password === 'admin') {
        res.json({ id: 1, nama: 'Pak Ahmad', role: 'admin', token: 'dummy-token' });
    } else {
        res.status(401).json({ error: 'Kredensial salah' });
    }
});

// --- PING ---
app.get('/api/ping', async (req, res) => {
    try {
        await pool.query('SELECT 1');
        res.json({ status: 'Connected to TiDB successfully!' });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`✅ Server SIAS berjalan di http://localhost:${PORT}`);
});
