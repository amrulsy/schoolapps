const pool = require('../db');

async function patch() {
    try {
        console.log('Applying patch to add face_descriptor...');
        await pool.query('ALTER TABLE siswa ADD COLUMN face_descriptor TEXT DEFAULT NULL;');
        console.log('Success adding face_descriptor to siswa table.');
    } catch (e) {
        if (e.code === 'ER_DUP_FIELDNAME') {
            console.log('Column face_descriptor already exists.');
        } else {
            console.error('Error applying patch:', e);
        }
    } finally {
        pool.end();
    }
}

patch();
