const pool = require('./db');

async function reset() {
    try {
        console.log('Clearing old session data for Guru 1...');
        await pool.query('DELETE FROM presensi_sesi');
        await pool.query('DELETE FROM jurnal_mengajar');
        await pool.query("DELETE FROM jadwal_pelajaran WHERE guru_id = 1 AND hari = 'Selasa'");

        console.log('Fetching master data...');
        const [jams] = await pool.query('SELECT id FROM jam_pelajaran ORDER BY jam_ke ASC LIMIT 3');
        const [kelas] = await pool.query('SELECT id FROM kelas LIMIT 1');
        const [mapel] = await pool.query('SELECT id FROM mata_pelajaran ORDER BY id DESC LIMIT 1');

        if (jams.length < 3) throw new Error('Not enough jam_pelajaran master data');

        console.log('Inserting 3 consecutive schedules (Jam 1, 2, 3) for Guru 1 today (Selasa)...');
        for (let i = 0; i < jams.length; i++) {
            await pool.query(
                `INSERT INTO jadwal_pelajaran (guru_id, kelas_id, mapel_id, hari, jam_pelajaran_id) VALUES (?, ?, ?, 'Selasa', ?)`,
                [1, kelas[0].id, mapel[0].id, jams[i].id]
            );
        }

        console.log('Dummy schedules inserted successfully! You can refresh the Guru Dashboard now.');
    } catch (e) {
        console.error('ERROR:', e.message);
        process.exit(1);
    }
    process.exit(0);
}

reset();
