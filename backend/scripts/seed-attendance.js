const pool = require('../db');
require('dotenv').config();

async function seedAttendance() {
    try {
        console.log('⏳ Seeding mock attendance data...');

        // 1. Get all active students
        const [students] = await pool.query("SELECT id FROM siswa WHERE status = 'aktif'");

        if (students.length === 0) {
            console.log('❌ No active students found to seed attendance.');
            process.exit(0);
        }

        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth(); // 0-indexed

        // 2. Generate attendance for the last 20 weekdays of the current month
        const attendanceRecords = [];
        for (const student of students) {
            let daysAdded = 0;
            for (let day = 1; day <= now.getDate(); day++) {
                const date = new Date(year, month, day);
                const dayOfWeek = date.getDay();

                // Skip weekends (0 = Sunday, 6 = Saturday)
                if (dayOfWeek === 0 || dayOfWeek === 6) continue;

                // Randomly decide status (90% hadir, 10% other)
                const rand = Math.random();
                let status = 'hadir';
                if (rand > 0.95) status = 'alpha';
                else if (rand > 0.92) status = 'izin';
                else if (rand > 0.90) status = 'sakit';

                attendanceRecords.push([
                    student.id,
                    date.toISOString().split('T')[0],
                    status,
                    status === 'hadir' ? 'Hadir tepat waktu' : 'Keterangan ' + status
                ]);

                daysAdded++;
                if (daysAdded >= 22) break; // Limit to typical working month
            }
        }

        // 3. Insert in batches
        if (attendanceRecords.length > 0) {
            await pool.query(
                'INSERT IGNORE INTO siswa_presensi (siswa_id, tanggal, status, keterangan) VALUES ?',
                [attendanceRecords]
            );
            console.log(`✅ Seeded ${attendanceRecords.length} attendance records.`);
        }

    } catch (err) {
        console.error('❌ Seeding error:', err.message);
    } finally {
        process.exit(0);
    }
}

seedAttendance();
