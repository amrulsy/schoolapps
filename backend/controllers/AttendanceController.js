const pool = require('../db');
const socketService = require('../services/socket');
const waService = require('../services/whatsappService');

class AttendanceController {
    /**
     * Mendaftarkan RFID UID ke siswa
     * PUT /api/students/:id/rfid
     */
    static async registerRfid(req, res) {
        const { id } = req.params;
        const { rfid_uid } = req.body;

        if (!rfid_uid) {
            return res.status(400).json({ error: 'RFID UID wajib diisi' });
        }

        try {
            await pool.query(
                'UPDATE siswa SET rfid_uid = ? WHERE id = ?',
                [rfid_uid, id]
            );
            res.json({ success: true, message: 'RFID berhasil didaftarkan' });
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
     */
    static async scanRfid(req, res) {
        const { rfid_uid } = req.body;
        const io = socketService.getIo();

        if (!rfid_uid) {
            return res.status(400).json({ error: 'RFID UID wajib diisi' });
        }

        try {
            // 1. Cari siswa berdasarkan RFID UID
            const [students] = await pool.query(
                'SELECT s.id, s.nama, s.nisn, s.telp, k.nama as kelas_nama FROM siswa s LEFT JOIN kelas k ON s.kelas_id = k.id WHERE s.rfid_uid = ? AND s.status = "aktif"',
                [rfid_uid]
            );

            if (students.length === 0) {
                return res.status(404).json({ error: 'Siswa tidak ditemukan atau kartu tidak terdaftar' });
            }

            const student = students[0];
            const today = new Date().toISOString().split('T')[0];
            const now = new Date();
            const nowTime = now.toTimeString().split(' ')[0]; // HH:MM:SS
            const nowDateTime = now.toISOString().slice(0, 19).replace('T', ' '); // YYYY-MM-DD HH:MM:SS

            // 0. Ambil Pengaturan dari Database
            const [settingsRows] = await pool.query('SELECT * FROM attendance_settings');
            const settings = {};
            settingsRows.forEach(r => { settings[r.key] = r.value });

            const lateThreshold = settings['late_threshold_time'] || '07:30';
            const exitGap = parseInt(settings['exit_min_gap_minutes'] || '60');

            // 2. Cek apakah sudah ada presensi detail hari ini
            const [existing] = await pool.query(
                'SELECT * FROM attendances WHERE student_id = ? AND tanggal = ?',
                [student.id, today]
            );

            let status_tap = '';

            if (existing.length === 0) {
                // --- KONDISI MASUK ---
                // Tentukan status (Hadir/Terlambat) - Gunakan threshold dari settings
                const [h, m] = lateThreshold.split(':');
                const limitMasuk = new Date(now.getFullYear(), now.getMonth(), now.getDate(), parseInt(h), parseInt(m), 0);
                const status = now > limitMasuk ? 'Terlambat' : 'Hadir';

                await pool.query(
                    'INSERT INTO attendances (student_id, tanggal, jam_masuk, status) VALUES (?, ?, ?, ?)',
                    [student.id, today, nowDateTime, status]
                );

                // SYNC: Update/Insert ke siswa_presensi (tabel lama)
                await pool.query(
                    'INSERT INTO siswa_presensi (siswa_id, tanggal, status) VALUES (?, ?, "hadir") ON DUPLICATE KEY UPDATE status = "hadir"',
                    [student.id, today]
                );

                status_tap = 'masuk';
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
                const exitTimeRef = new Date(now.getFullYear(), now.getMonth(), now.getDate(), parseInt(exH), parseInt(exM), 0);

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

                status_tap = 'pulang';
            }

            // Emit real-time event ke Gate Monitor
            const responseData = {
                student: {
                    id: student.id,
                    nama: student.nama,
                    nisn: student.nisn,
                    kelas: student.kelas_nama
                },
                status: status_tap,
                time: nowTime
            };

            io.emit('scan_success', responseData);

            // --- KIRIM WA OTOMATIS (Jika diaktifkan) ---
            if (settings.wa_notification_enabled === 'true' && student.telp) {
                let template = '';
                if (status_tap === 'masuk') {
                    template = status === 'Terlambat' ? settings.wa_template_terlambat : settings.wa_template_masuk;
                } else if (status_tap === 'pulang') {
                    template = settings.wa_template_pulang;
                }

                if (template) {
                    const waMessage = template
                        .replace(/\[nama\]/g, student.nama)
                        .replace(/\[jam\]/g, nowTime);
                    
                    waService.sendMessage(student.telp, waMessage);
                }
            }

            res.json({ success: true, ...responseData });

        } catch (err) {
            console.error('[RFID Scan Error]', err);
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
     */
    static async updateSettings(req, res) {
        const settings = req.body;
        try {
            for (const key in settings) {
                await pool.query(
                    'INSERT INTO attendance_settings (`key`, value) VALUES (?, ?) ON DUPLICATE KEY UPDATE value = VALUES(value)',
                    [key, settings[key].toString()]
                );
            }
            res.json({ success: true, message: 'Pengaturan berhasil diperbarui' });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }
}

module.exports = AttendanceController;
