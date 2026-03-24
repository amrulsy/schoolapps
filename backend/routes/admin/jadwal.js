const express = require('express');
const router = express.Router();
const pool = require('../../db');

// GET /api/admin/jadwal
router.get('/', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT j.*, 
                   COALESCE(g.nama, 'Belum diatur') as guru_nama, 
                   COALESCE(k.nama, 'Kelas Dihapus') as kelas_nama, 
                   COALESCE(m.nama, 'Mapel Dihapus') as mapel_nama,
                   jp.jam_ke, jp.jam_mulai, jp.jam_selesai, jp.tipe as jam_tipe
            FROM jadwal_pelajaran j
            LEFT JOIN guru g ON j.guru_id = g.id
            LEFT JOIN kelas k ON j.kelas_id = k.id
            LEFT JOIN mata_pelajaran m ON j.mapel_id = m.id
            LEFT JOIN jam_pelajaran jp ON j.jam_pelajaran_id = jp.id
            ORDER BY 
                CASE j.hari 
                    WHEN 'Senin' THEN 1 
                    WHEN 'Selasa' THEN 2 
                    WHEN 'Rabu' THEN 3 
                    WHEN 'Kamis' THEN 4 
                    WHEN 'Jumat' THEN 5 
                    WHEN 'Sabtu' THEN 6 
                    WHEN 'Minggu' THEN 7 
                END, 
                jp.jam_mulai ASC
        `);
        res.json(rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/admin/jadwal
router.post('/', async (req, res) => {
    try {
        const { guru_id, kelas_id, mapel_id, hari } = req.body;
        const jam_pelajaran_ids = req.body.jam_pelajaran_ids || [req.body.jam_pelajaran_id];

        if (!jam_pelajaran_ids.length || !jam_pelajaran_ids[0]) {
            return res.status(400).json({ error: 'Tidak ada jam pelajaran yang dipilih' });
        }

        // --- VALIDATION: Check for duplicates ---
        const kIdConfirm = Number(kelas_id);
        const jIdsConfirm = jam_pelajaran_ids.map(Number);

        console.log(`[CONFLICT CHECK] Class ${kIdConfirm}, Day ${hari}, Slots:`, jIdsConfirm);

        const [existing] = await pool.query(
            'SELECT jam_pelajaran_id FROM jadwal_pelajaran WHERE kelas_id = ? AND hari = ? AND jam_pelajaran_id IN (?)',
            [kIdConfirm, hari, jIdsConfirm]
        );

        if (existing.length > 0) {
            const taken = existing.map(e => e.jam_pelajaran_id).join(', ');
            console.log(`[CONFLICT FOUND] Slots: ${taken}`);
            return res.status(400).json({
                error: `Gagal! Jam ke-${taken} sudah terisi di hari ${hari}. Silakan hapus atau pindahkan jadwal yang ada terlebih dahulu.`
            });
        }

        console.log(`[JADWAL V2] Inserting ${jam_pelajaran_ids.length} sessions for class ${kelas_id}`);
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();
            for (const jamId of jam_pelajaran_ids) {
                const gId = Number(guru_id) || null;
                const kId = Number(kelas_id) || null;
                const mId = Number(mapel_id) || null;
                const jId = Number(jamId) || null;

                await connection.query(
                    'INSERT INTO jadwal_pelajaran (guru_id, kelas_id, mapel_id, hari, jam_pelajaran_id) VALUES (?, ?, ?, ?, ?)',
                    [gId, kId, mId, hari, jId]
                );
            }
            await connection.commit();
            res.status(201).json({ success: true, count: jam_pelajaran_ids.length });
        } catch (err) {
            await connection.rollback();
            res.status(500).json({ error: err.message });
        } finally {
            connection.release();
        }
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// PUT /api/admin/jadwal/:id
router.put('/:id', async (req, res) => {
    try {
        const { guru_id, kelas_id, mapel_id, hari, jam_pelajaran_id } = req.body;

        // --- VALIDATION: Check for duplicates (excluding current ID) ---
        const [existing] = await pool.query(
            'SELECT id FROM jadwal_pelajaran WHERE kelas_id = ? AND hari = ? AND jam_pelajaran_id = ? AND id != ?',
            [kelas_id, hari, jam_pelajaran_id, req.params.id]
        );

        if (existing.length > 0) {
            return res.status(400).json({
                error: `Gagal! Jam ke-${jam_pelajaran_id} sudah terisi untuk kelas ini di hari ${hari}.`
            });
        }

        await pool.query(`
            UPDATE jadwal_pelajaran 
            SET guru_id = ?, kelas_id = ?, mapel_id = ?, hari = ?, jam_pelajaran_id = ?
            WHERE id = ?
        `, [guru_id, kelas_id, mapel_id, hari, jam_pelajaran_id, req.params.id]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// DELETE /api/admin/jadwal/bulk
router.delete('/bulk/delete', async (req, res) => {
    try {
        const { kelas_id, hari } = req.body;
        if (!kelas_id) return res.status(400).json({ error: 'Kelas ID diperlukan' });

        let query = 'DELETE FROM jadwal_pelajaran WHERE kelas_id = ?';
        let params = [kelas_id];

        if (hari) {
            query += ' AND hari = ?';
            params.push(hari);
        }

        const [result] = await pool.query(query, params);
        res.json({ success: true, count: result.affectedRows });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// DELETE /api/admin/jadwal/:id
router.delete('/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM jadwal_pelajaran WHERE id = ?', [req.params.id]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
