const cron = require('node-cron');
const pool = require('../db');
const waService = require('./whatsappService');
const socketService = require('./socket');
const { getWIBDate, formatDateID } = require('../utils/timezone');

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
            const today = getWIBDate();

            // Bug #7 Fix: Skip weekends (Sunday = 0)
            const dayOfWeek = new Date(today + 'T12:00:00+07:00').getDay();
            if (dayOfWeek === 0) {
                console.log('[Cron] Auto-Alpha: Skipped — today is Sunday.');
                return;
            }

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

            // Get Settings for WA
            const [settingsRows] = await pool.query('SELECT * FROM attendance_settings');
            const settings = {};
            settingsRows.forEach(r => { settings[r.key] = r.value });

            if (unmarked.length === 0) return;

            const formattedDate = formatDateID(today);

            for (const student of unmarked) {
                // Insert as Alpha
                await pool.query(`
                    INSERT INTO siswa_presensi (siswa_id, tanggal, status, keterangan)
                    VALUES (?, ?, 'alpha', 'Otomatis oleh sistem (Auto-Alpha)')
                `, [student.id, today]);

                // R-18: Send WA if enabled
                if (settings.wa_notification_enabled === 'true' && settings.wa_template_alfa) {
                    const waMessage = settings.wa_template_alfa
                        .replace(/\[nama\]/g, student.nama)
                        .replace(/\[tanggal\]/g, formattedDate)
                        .replace(/\[status\]/g, 'Alpha')
                        .replace(/\[keterangan\]/g, 'Auto-Alpha');

                    // Ambil kontak orang tua
                    const [ortuRows] = await pool.query('SELECT hp FROM siswa_orangtua WHERE siswa_id = ? AND hp IS NOT NULL AND hp != ""', [student.id]);
                    const phoneTargets = [];
                    if (student.telp) phoneTargets.push(student.telp);
                    ortuRows.forEach(o => phoneTargets.push(o.hp));
                    const uniquePhones = [...new Set(phoneTargets)];

                    for (const phone of uniquePhones) {
                        try {
                            await waService.sendMessage(phone, waMessage);
                            await pool.query(
                                'INSERT INTO wa_notification_log (siswa_id, phone, message_type, status) VALUES (?, ?, ?, ?)',
                                [student.id, phone, 'alpha', 'sent']
                            ).catch(() => { });
                        } catch (waErr) {
                            await pool.query(
                                'INSERT INTO wa_notification_log (siswa_id, phone, message_type, status, error_message) VALUES (?, ?, ?, ?, ?)',
                                [student.id, phone, 'alpha', 'failed', waErr.message]
                            ).catch(() => { });
                        }
                    }
                }
            }

            console.log(`[Cron] Auto-Alpha: Marked ${unmarked.length} students as Alpha.`);
        } catch (err) {
            console.error('[Cron] Auto-Alpha Error:', err.message);
        }
    }

    static async analyzeLatePatterns() {
        try {
            // Bug #6 Fix: Query only siswa_presensi (source of truth) to avoid double-counting
            // from both attendances and siswa_presensi tables via UNION
            const [patterns] = await pool.query(`
                SELECT s.id, s.nama, k.nama as kelas_nama, COUNT(*) as late_count
                FROM siswa s
                JOIN kelas k ON s.kelas_id = k.id
                JOIN siswa_presensi sp ON sp.siswa_id = s.id
                    AND sp.status = 'terlambat'
                    AND sp.tanggal >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
                WHERE s.status = 'aktif'
                GROUP BY s.id, s.nama, k.nama
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
        // Bug #4 Fixed: Fully implemented weekly digest to parents
        try {
            console.log('[Cron] Starting Weekly Digest...');

            // Get WIB dates for the last 7 days
            const today = getWIBDate();
            const sevenDaysAgo = new Date(new Date().getTime() - 7 * 86400000);
            const sevenFmt = new Intl.DateTimeFormat('en-US', {
                timeZone: 'Asia/Jakarta',
                year: 'numeric', month: '2-digit', day: '2-digit', hour12: false
            });
            const sp = {};
            sevenFmt.formatToParts(sevenDaysAgo).forEach(part => sp[part.type] = part.value);
            const startDate = `${sp.year}-${sp.month}-${sp.day}`;

            // Get WA settings
            const [settingsRows] = await pool.query('SELECT * FROM attendance_settings');
            const settings = {};
            settingsRows.forEach(r => { settings[r.key] = r.value; });

            if (settings.wa_notification_enabled !== 'true') {
                console.log('[Cron] Weekly Digest: WA notifications disabled, skipping.');
                return;
            }

            // Get all active students with their attendance summary for the last 7 days
            const [summaries] = await pool.query(`
                SELECT 
                    s.id, s.nama, s.telp,
                    SUM(CASE WHEN sp.status = 'hadir' THEN 1 ELSE 0 END) as hadir,
                    SUM(CASE WHEN sp.status = 'terlambat' THEN 1 ELSE 0 END) as terlambat,
                    SUM(CASE WHEN sp.status = 'sakit' THEN 1 ELSE 0 END) as sakit,
                    SUM(CASE WHEN sp.status = 'izin' THEN 1 ELSE 0 END) as izin,
                    SUM(CASE WHEN sp.status = 'alpha' THEN 1 ELSE 0 END) as alpha,
                    COUNT(sp.id) as total
                FROM siswa s
                LEFT JOIN siswa_presensi sp ON sp.siswa_id = s.id
                    AND sp.tanggal BETWEEN ? AND ?
                WHERE s.status = 'aktif'
                GROUP BY s.id
                HAVING total > 0
            `, [startDate, today]);

            let sentCount = 0;
            for (const student of summaries) {
                const [ortuRows] = await pool.query(
                    'SELECT hp FROM siswa_orangtua WHERE siswa_id = ? AND hp IS NOT NULL AND hp != ""',
                    [student.id]
                );

                const phoneTargets = [];
                if (student.telp) phoneTargets.push(student.telp);
                ortuRows.forEach(o => phoneTargets.push(o.hp));
                const uniquePhones = [...new Set(phoneTargets)];

                if (uniquePhones.length === 0) continue;

                const message =
                    `📊 *Rekap Kehadiran Mingguan*\n` +
                    `Nama: *${student.nama}*\n` +
                    `Periode: ${startDate} s/d ${today}\n\n` +
                    `✅ Hadir      : ${student.hadir} hari\n` +
                    `⏰ Terlambat  : ${student.terlambat} hari\n` +
                    `🤒 Sakit      : ${student.sakit} hari\n` +
                    `📝 Izin       : ${student.izin} hari\n` +
                    `❌ Alpha      : ${student.alpha} hari\n\n` +
                    `Total hari sekolah: ${student.total}`;

                for (const phone of uniquePhones) {
                    try {
                        await waService.sendMessage(phone, message);
                        await pool.query(
                            'INSERT INTO wa_notification_log (siswa_id, phone, message_type, status) VALUES (?, ?, ?, ?)',
                            [student.id, phone, 'weekly_digest', 'sent']
                        ).catch(() => { });
                        sentCount++;
                    } catch (waErr) {
                        await pool.query(
                            'INSERT INTO wa_notification_log (siswa_id, phone, message_type, status, error_message) VALUES (?, ?, ?, ?, ?)',
                            [student.id, phone, 'weekly_digest', 'failed', waErr.message]
                        ).catch(() => { });
                    }
                }
            }

            console.log(`[Cron] Weekly Digest: Sent to ${sentCount} contacts for ${summaries.length} students.`);
        } catch (err) {
            console.error('[Cron] Weekly Digest Error:', err.message);
        }
    }
}

module.exports = AttendanceCronService;
