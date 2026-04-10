const pool = require('../db');

/**
 * Service to manage student attendance streaks
 * R-19: Attendance Streak Gamification
 */
class AttendanceStreakService {
    /**
     * Calculate and cache current streak for a student
     * A streak is consecutive days with status 'hadir' (skipping weekends/holidays if possible)
     * For simplicity, we count strictly consecutive calendar days that were school days
     */
    static async calculateStreak(siswaId) {
        try {
            // Get last 30 attendance records
            const [rows] = await pool.query(`
                SELECT tanggal, status 
                FROM siswa_presensi 
                WHERE siswa_id = ? 
                ORDER BY tanggal DESC 
                LIMIT 30
            `, [siswaId]);

            if (rows.length === 0) return 0;

            let streak = 0;
            for (const row of rows) {
                if (row.status === 'hadir') {
                    streak++;
                } else if (row.status === 'sakit' || row.status === 'izin') {
                    // Sick/Permit breaks streak? Usually yes, but we could make it 'frozen'
                    // For now, only 'hadir' increments, everything else breaks it.
                    break;
                } else {
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
     */
    static async getLeaderboard(limit = 10) {
        // This is tricky on-the-fly. In a real 'genius' app, 
        // we'd have a 'current_streak' column in 'siswa' table updated on every scan.
        // Let's implement that in the next step.
    }
}

module.exports = AttendanceStreakService;
