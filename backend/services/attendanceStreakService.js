const pool = require('../db');

/**
 * Service to manage student attendance streaks
 * R-19: Attendance Streak Gamification
 */
class AttendanceStreakService {
    /**
     * Calculate and cache current streak for a student
     * A streak is consecutive school days with status 'hadir' or 'terlambat'
     * (terlambat still counts because the student was physically present)
     */
    static async calculateStreak(siswaId) {
        try {
            // Get last 60 attendance records for more accurate calculation
            const [rows] = await pool.query(`
                SELECT tanggal, status 
                FROM siswa_presensi 
                WHERE siswa_id = ? 
                ORDER BY tanggal DESC 
                LIMIT 60
            `, [siswaId]);

            if (rows.length === 0) return 0;

            let streak = 0;
            for (const row of rows) {
                if (row.status === 'hadir' || row.status === 'terlambat') {
                    streak++;
                } else {
                    // sakit, izin, alpha — all break the streak
                    break;
                }
            }
            return streak;
        } catch (err) {
            console.error('[StreakService] Error:', err.message);
            return 0;
        }
    }

    /**
     * Get top streaks for a leaderboard
     * Calculates current streak for all active students and returns top N
     * @param {number} limit - Number of top students to return
     * @returns {Array<{id, nama, kelas_nama, streak}>}
     */
    static async getLeaderboard(limit = 10) {
        try {
            // Get all active students with their recent attendance
            const [students] = await pool.query(`
                SELECT s.id, s.nama, k.nama as kelas_nama
                FROM siswa s
                LEFT JOIN kelas k ON s.kelas_id = k.id
                WHERE s.status = 'aktif'
                ORDER BY s.nama ASC
            `);

            // Calculate streak for each student
            const results = [];
            for (const student of students) {
                const streak = await AttendanceStreakService.calculateStreak(student.id);
                if (streak > 0) {
                    results.push({
                        id: student.id,
                        nama: student.nama,
                        kelas_nama: student.kelas_nama,
                        streak
                    });
                }
            }

            // Sort by streak descending and return top N
            results.sort((a, b) => b.streak - a.streak);
            return results.slice(0, limit);
        } catch (err) {
            console.error('[StreakService] Leaderboard Error:', err.message);
            return [];
        }
    }
}

module.exports = AttendanceStreakService;
