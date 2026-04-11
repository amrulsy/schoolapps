const pool = require('../db');
const socketService = require('../services/socket');
const waService = require('../services/whatsappService');
const { getWIBDate, getWIBDateTime, getWIBNow } = require('../utils/timezone');

// R-3: In-memory cooldown map for RFID rate limiting (10 seconds per UID)
const rfidCooldown = new Map();
const COOLDOWN_MS = 10000;

// R-14: Periodic cleanup of expired cooldown entries (every 5 minutes)
setInterval(() => {
    const now = Date.now();
    for (const [uid, timestamp] of rfidCooldown) {
        if (now - timestamp > COOLDOWN_MS) rfidCooldown.delete(uid);
    }
}, 5 * 60 * 1000);

// R-6: Whitelist of allowed setting keys
const ALLOWED_SETTING_KEYS = [
    'entry_start_time', 'late_threshold_time', 'exit_min_gap_minutes',
    'exit_start_time', 'exit_rule_type', 'wa_notification_enabled',
    'wa_template_masuk', 'wa_template_terlambat', 'wa_template_pulang',
    'wa_template_alfa', 'wa_template_sakit', 'wa_template_izin'
];

class AttendanceController {
    /**
     * Mendaftarkan RFID UID ke siswa
     * PUT /api/students/:id/rfid
     */
    static async registerRfid(req, res) {
        const { id } = req.params;
        const { rfid_uid } = req.body;

        try {
            await pool.query(
                'UPDATE siswa SET rfid_uid = ? WHERE id = ?',
                [rfid_uid || null, id]
            );
            res.json({
                success: true,
                message: rfid_uid ? 'RFID berhasil didaftarkan' : 'RFID berhasil dikosongkan'
            });
        } catch (err) {
            if (err.code === 'ER_DUP_ENTRY') {
                return res.status(400).json({ error: 'RFID UID sudah terdaftar di siswa lain' });
            }
            res.status(500).json({ error: err.message });
        }
    }

    /**
     * Scan RFID untuk Presensi (Masuk/Pulang)
     * POST /api/attendance/scan
     * 
     * R-1: Unified flow — writes to both `attendances` and `siswa_presensi` consistently
     * R-2: Holiday validation
     * R-3: Rate limiting per RFID UID
     * R-5: WA notification logging
     */
    static async scanRfid(req, res) {
        const { rfid_uid } = req.body;
        const io = socketService.getIo();

        if (!rfid_uid) {
            return res.status(400).json({ error: 'RFID UID wajib diisi' });
        }

        // R-3: Rate limiting — cooldown per RFID UID
        const lastScan = rfidCooldown.get(rfid_uid);
        if (lastScan && (Date.now() - lastScan) < COOLDOWN_MS) {
            return res.status(429).json({ error: 'Mohon tunggu beberapa detik sebelum scan ulang.' });
        }
        rfidCooldown.set(rfid_uid, Date.now());

        try {
            // 1. Cari siswa berdasarkan RFID UID
            const [students] = await pool.query(
                'SELECT s.id, s.nama, s.nisn, s.telp, s.jk, k.nama as kelas_nama FROM siswa s LEFT JOIN kelas k ON s.kelas_id = k.id WHERE s.rfid_uid = ? AND s.status = "aktif"',
                [rfid_uid]
            );

            if (students.length === 0) {
                io.emit('scan_info', {
                    student: { nama: 'Tidak Dikenali' },
                    message: 'Kartu RFID tidak terdaftar atau siswa tidak aktif',
                    type: 'warning'
                });
                return res.status(404).json({ error: 'Siswa tidak ditemukan atau kartu tidak terdaftar' });
            }

            const student = students[0];

            // Dapatkan waktu persis di Jakarta mengabaikan timezone OS Server
            const { date: today, time: nowTime, dateTime: nowDateTime } = getWIBDateTime();
            const now = getWIBNow();

            // R-2: Validasi Hari Libur
            const [holidays] = await pool.query(
                'SELECT id, keterangan FROM harilibur WHERE tanggal = ?', [today]
            );
            if (holidays.length > 0) {
                const infoData = {
                    student: { nama: student.nama, kelas: student.kelas_nama, nisn: student.nisn },
                    message: 'Hari ini libur.',
                    subMessage: holidays[0].keterangan || 'Tidak ada kegiatan belajar hari ini.',
                    type: 'warning'
                };
                io.emit('scan_info', infoData);
                return res.status(400).json({ error: infoData.message });
            }

            // 0. Ambil Pengaturan dari Database
            const [settingsRows] = await pool.query('SELECT * FROM attendance_settings');
            const settings = {};
            settingsRows.forEach(r => { settings[r.key] = r.value });

            const lateThreshold = settings['late_threshold_time'] || '07:30';

            // 2. Cek apakah sudah ada presensi detail hari ini (tabel attendances)
            const [existing] = await pool.query(
                'SELECT * FROM attendances WHERE student_id = ? AND tanggal = ?',
                [student.id, today]
            );

            let status_tap = '';
            let current_status = ''; // diangkat untuk keperluan Notifikasi WA
            let waMessageType = ''; // R-5: for WA logging

            if (existing.length === 0) {
                // --- VALIDASI JAM MULAI ABSEN ---
                const entryStartTimeStr = settings['entry_start_time'] || '06:00';
                const [entH, entM] = entryStartTimeStr.split(':');
                const limitBukaAbsen = new Date(`${today}T${entH}:${entM}:00+07:00`);

                if (now < limitBukaAbsen) {
                    const infoData = {
                        student: { nama: student.nama, kelas: student.kelas_nama, nisn: student.nisn },
                        message: 'Absen masuk belum dibuka.',
                        subMessage: `Jadwal absen masuk dimulai pukul ${entryStartTimeStr}.`,
                        type: 'warning'
                    };
                    io.emit('scan_info', infoData);
                    return res.status(400).json({ error: infoData.message });
                }

                // --- KONDISI MASUK ---
                // Tentukan status (Hadir/Terlambat) - Gunakan threshold dari settings
                const [ltH, ltM] = lateThreshold.split(':');
                const limitMasuk = new Date(`${today}T${ltH}:${ltM}:00+07:00`);
                current_status = now > limitMasuk ? 'Terlambat' : 'Hadir';

                await pool.query(
                    'INSERT INTO attendances (student_id, tanggal, jam_masuk, status) VALUES (?, ?, ?, ?)',
                    [student.id, today, nowDateTime, current_status]
                );

                // R-1: SYNC to siswa_presensi with correct status + jam_masuk
                // Bug #2 Fixed: was always 'hadir'. Now saves 'terlambat' correctly.
                const presensiStatus = current_status === 'Terlambat' ? 'terlambat' : 'hadir';
                await pool.query(
                    `INSERT INTO siswa_presensi (siswa_id, tanggal, status, jam_masuk) 
                     VALUES (?, ?, ?, ?) 
                     ON DUPLICATE KEY UPDATE status = VALUES(status), jam_masuk = VALUES(jam_masuk)`,
                    [student.id, today, presensiStatus, nowDateTime]
                );

                status_tap = 'masuk';
                waMessageType = current_status === 'Terlambat' ? 'terlambat' : 'masuk';
            } else {
                // --- KONDISI PULANG ---
                const record = existing[0];

                if (record.jam_pulang) {
                    const infoData = {
                        student: { nama: student.nama, kelas: student.kelas_nama, nisn: student.nisn },
                        message: 'Absensi hari ini sudah selesai.',
                        type: 'info'
                    };
                    io.emit('scan_info', infoData);
                    return res.status(400).json({ error: infoData.message });
                }

                // 2.1. Ambil Parameter Validasi Pulang
                const exitGap = parseInt(settings['exit_min_gap_minutes'] || '60');
                const exitStartTimeStr = settings['exit_start_time'] || '14:00';
                const exitRuleType = settings['exit_rule_type'] || 'either'; // gap_only, time_only, both, either

                const jamMasuk = new Date(record.jam_masuk);
                const diffMs = now - jamMasuk;
                const diffMin = Math.floor(diffMs / 60000);

                const [exH, exM] = exitStartTimeStr.split(':');
                const exitTimeRef = new Date(`${today}T${exH}:${exM}:00+07:00`);

                let isAllowed = false;
                let reason = '';

                switch (exitRuleType) {
                    case 'gap_only':
                        isAllowed = diffMin >= exitGap;
                        reason = `Minimal jeda tap adalah ${exitGap} menit.`;
                        break;
                    case 'time_only':
                        isAllowed = now >= exitTimeRef;
                        reason = `Absen pulang baru dimulai jam ${exitStartTimeStr}.`;
                        break;
                    case 'both':
                        isAllowed = diffMin >= exitGap && now >= exitTimeRef;
                        reason = `Syarat pulang: Minimal ${exitGap} menit sejak masuk DAN sudah lewat jam ${exitStartTimeStr}.`;
                        break;
                    case 'either':
                    default:
                        isAllowed = diffMin >= exitGap || now >= exitTimeRef;
                        reason = `Belum waktunya pulang (Jeda < ${exitGap} menit & Belum jam ${exitStartTimeStr}).`;
                        break;
                }

                if (!isAllowed) {
                    const infoData = {
                        student: { nama: student.nama, kelas: student.kelas_nama, nisn: student.nisn },
                        message: 'Belum bisa absen pulang.',
                        subMessage: reason,
                        type: 'warning'
                    };
                    io.emit('scan_info', infoData);
                    return res.status(400).json({ error: reason });
                }

                await pool.query(
                    'UPDATE attendances SET jam_pulang = ? WHERE id = ?',
                    [nowDateTime, record.id]
                );

                // R-1: SYNC jam_pulang to siswa_presensi
                await pool.query(
                    'UPDATE siswa_presensi SET jam_pulang = ? WHERE siswa_id = ? AND tanggal = ?',
                    [nowDateTime, student.id, today]
                );

                status_tap = 'pulang';
                waMessageType = 'pulang';
            }

            // Ambil Foto Siswa, jika ada
            const [fotoRows] = await pool.query(
                'SELECT file_path FROM siswa_dokumen WHERE siswa_id = ? AND kode_dokumen LIKE "%FOTO%" LIMIT 1',
                [student.id]
            );
            const foto = fotoRows.length > 0 ? fotoRows[0].file_path : null;

            // Emit real-time event ke Gate Monitor
            const responseData = {
                student: {
                    id: student.id,
                    nama: student.nama,
                    nisn: student.nisn,
                    kelas: student.kelas_nama,
                    jk: student.jk,
                    foto: foto
                },
                status: status_tap,
                keterangan: current_status,
                time: nowTime
            };

            io.emit('scan_success', responseData);

            // R-21: Broadcast real-time stats update
            AttendanceController.broadcastStatsUpdate(io);

            // --- KIRIM WA OTOMATIS (Jika diaktifkan) ---
            // R-5: With notification logging
            if (settings.wa_notification_enabled === 'true') {
                let template = '';
                if (status_tap === 'masuk') {
                    template = current_status === 'Terlambat' ? settings.wa_template_terlambat : settings.wa_template_masuk;
                } else if (status_tap === 'pulang') {
                    template = settings.wa_template_pulang;
                }

                if (template) {
                    const waMessage = template
                        .replace(/\[nama\]/g, student.nama)
                        .replace(/\[jam\]/g, nowTime)
                        .replace(/\[kelas\]/g, student.kelas_nama || '-')
                        .replace(/\[nisn\]/g, student.nisn || '-');

                    // Ambil kontak orang tua
                    const [ortuRows] = await pool.query('SELECT hp FROM siswa_orangtua WHERE siswa_id = ? AND hp IS NOT NULL AND hp != ""', [student.id]);
                    const phoneTargets = [];
                    if (student.telp) phoneTargets.push(student.telp);
                    ortuRows.forEach(o => phoneTargets.push(o.hp));

                    const uniquePhones = [...new Set(phoneTargets)];

                    for (const phone of uniquePhones) {
                        try {
                            await waService.sendMessage(phone, waMessage);
                            // R-5: Log success
                            await pool.query(
                                'INSERT INTO wa_notification_log (siswa_id, phone, message_type, status) VALUES (?, ?, ?, ?)',
                                [student.id, phone, waMessageType, 'sent']
                            ).catch(() => { }); // Don't fail main flow for logging
                        } catch (waErr) {
                            console.error('[Presensi WA] Gagal kirim notifikasi:', waErr.message);
                            // R-5: Log failure
                            await pool.query(
                                'INSERT INTO wa_notification_log (siswa_id, phone, message_type, status, error_message) VALUES (?, ?, ?, ?, ?)',
                                [student.id, phone, waMessageType, 'failed', waErr.message]
                            ).catch(() => { }); // Don't fail main flow for logging
                        }
                    }
                }
            }

            res.json({ success: true, ...responseData });

        } catch (err) {
            console.error('[RFID Scan Error]', err);
            try {
                const ioFallback = socketService.getIo();
                ioFallback.emit('scan_info', {
                    student: { nama: 'Sistem' },
                    message: 'Kesalahan Sistem',
                    subMessage: err.message,
                    type: 'warning'
                });
            } catch (ioErr) { /* ignore */ }
            res.status(500).json({ error: 'Terjadi kesalahan pada server' });
        }
    }

    /**
     * Get Attendance Settings
     * GET /api/attendance/settings
     */
    static async getSettings(req, res) {
        try {
            const [rows] = await pool.query('SELECT * FROM attendance_settings');
            const settings = {};
            rows.forEach(r => { settings[r.key] = r.value });
            res.json(settings);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

    /**
     * Update Attendance Settings
     * POST /api/attendance/settings
     * R-6: Validates that only whitelisted keys are accepted
     */
    static async updateSettings(req, res) {
        const settings = req.body;
        try {
            for (const key in settings) {
                // R-6: Reject unknown keys
                if (!ALLOWED_SETTING_KEYS.includes(key)) {
                    continue; // silently skip unknown keys
                }
                await pool.query(
                    'INSERT INTO attendance_settings (`key`, value) VALUES (?, ?) ON DUPLICATE KEY UPDATE value = VALUES(value)',
                    [key, String(settings[key] ?? '')]
                );
            }
            res.json({ success: true, message: 'Pengaturan berhasil diperbarui' });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }
    /**
     * R-21: Helper to broadcast real-time attendance stats
     */
    static async broadcastStatsUpdate(io) {
        try {
            const today = getWIBDate();

            const [presensiStats] = await pool.query(`
                SELECT 
                    SUM(CASE WHEN status = 'hadir' THEN 1 ELSE 0 END) as hadir,
                    SUM(CASE WHEN status = 'terlambat' THEN 1 ELSE 0 END) as terlambat,
                    SUM(CASE WHEN status = 'sakit' THEN 1 ELSE 0 END) as sakit,
                    SUM(CASE WHEN status = 'izin' THEN 1 ELSE 0 END) as izin,
                    SUM(CASE WHEN status = 'alpha' THEN 1 ELSE 0 END) as alpha
                FROM siswa_presensi WHERE tanggal = ?
            `, [today]);

            const stats = presensiStats[0] || {};
            io.emit('attendance_stats_update', {
                hadir: parseInt(stats.hadir) || 0,
                terlambat: parseInt(stats.terlambat) || 0,
                sakit: parseInt(stats.sakit) || 0,
                izin: parseInt(stats.izin) || 0,
                alpha: parseInt(stats.alpha) || 0
            });
        } catch (err) {
            console.error('[BroadcastStats] Error:', err.message);
        }
    }
}

module.exports = AttendanceController;
