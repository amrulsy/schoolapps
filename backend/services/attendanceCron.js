const cron = require('node-cron');
const pool = require('../db');
const waService = require('./whatsappService');
const socketService = require('./socket');

/**
 * Attendance Cron Service
 * Handles R-18, R-20, R-22
 */
class AttendanceCronService {
    static init() {
        // 1. R-18: Auto-Alpha Cron (Every day at 11:00 AM)
        // Mark students who haven't scanned or been manually marked as 'alpha'
        cron.schedule('0 11 * * 1-6', async () => {
            console.log('[Cron] Running Auto-Alpha check...');
            await AttendanceCronService.processAutoAlpha();
        });

        // 2. R-22: Weekly Parent Digest (Every Sunday at 09:00 AM)
        cron.schedule('0 9 * * 0', async () => {
            console.log('[Cron] Sending Weekly Parent Digest...');
            await AttendanceCronService.sendWeeklyDigest();
        });

        // 3. R-20: Late Pattern Detection (Every day at 04:00 PM)
        cron.schedule('0 16 * * 1-5', async () => {
            console.log('[Cron] Analyzing late patterns...');
            await AttendanceCronService.analyzeLatePatterns();
        });
    }

    static async processAutoAlpha() {
        try {
            const today = new Date().toISOString().split('T')[0];

            // Skip if today is holiday
            const [holidays] = await pool.query('SELECT 1 FROM harilibur WHERE tanggal = ?', [today]);
            if (holidays.length > 0) return;

            // Get all active students without attendance today
            const [unmarked] = await pool.query(`
                SELECT id, nama, telp 
                FROM siswa 
                WHERE status = 'aktif' 
                AND id NOT IN (SELECT siswa_id FROM siswa_presensi WHERE tanggal = ?)
            `, [today]);

            if (unmarked.length === 0) return;

            for (const student of unmarked) {
                // Insert as Alpha
                await pool.query(`
                    INSERT INTO siswa_presensi (siswa_id, tanggal, status, keterangan)
                    VALUES (?, ?, 'alpha', 'Otomatis oleh sistem (Auto-Alpha)')
                `, [student.id, today]);

                // R-18: Option to notify? 
                // Let's log it or send WA if enabled
            }
            
            console.log(`[Cron] Auto-Alpha: Marked ${unmarked.length} students as Alpha.`);
        } catch (err) {
            console.error('[Cron] Auto-Alpha Error:', err.message);
        }
    }

    static async analyzeLatePatterns() {
        try {
            // Students late >= 3 times in the last 7 days
            const [patterns] = await pool.query(`
                SELECT s.id, s.nama, k.nama as kelas_nama, COUNT(*) as late_count
                FROM attendances a
                JOIN siswa s ON a.student_id = s.id
                JOIN kelas k ON s.kelas_id = k.id
                WHERE a.status = 'Terlambat' 
                AND a.tanggal >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
                GROUP BY s.id
                HAVING late_count >= 3
            `);

            for (const p of patterns) {
                // R-20: Notify admin or wall (via Socket)
                const message = `🚨 *Peringatan Kedisiplinan*: Siswa *${p.nama}* (${p.kelas_nama}) telah terlambat ${p.late_count}x dalam seminggu terakhir.`;
                
                // Broadcast to admin dashboard
                socketService.getIo().emit('late_pattern_alert', {
                    studentId: p.id,
                    studentName: p.nama,
                    lateCount: p.late_count,
                    message
                });
            }
        } catch (err) {
            console.error('[Cron] Late Pattern Error:', err.message);
        }
    }

    static async sendWeeklyDigest() {
        // Implement logic to summarize attendance for parents
        // This is a heavy task, would fetch counts for last 7 days and send WA
        console.log('[Cron] Weekly Digest execution placeholder');
    }
}

module.exports = AttendanceCronService;
