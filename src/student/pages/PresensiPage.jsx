import { useState } from 'react'
import { Calendar, CheckCircle, XCircle, AlertCircle, Clock } from 'lucide-react'

// Mock attendance data
const mockAttendance = {
    summary: { hadir: 19, sakit: 1, izin: 1, alpha: 0, total: 21 },
    records: [
        { date: '2026-03-19', status: 'hadir' },
        { date: '2026-03-18', status: 'hadir' },
        { date: '2026-03-17', status: 'hadir' },
        { date: '2026-03-14', status: 'sakit' },
        { date: '2026-03-13', status: 'hadir' },
        { date: '2026-03-12', status: 'hadir' },
        { date: '2026-03-11', status: 'hadir' },
        { date: '2026-03-10', status: 'izin' },
        { date: '2026-03-07', status: 'hadir' },
        { date: '2026-03-06', status: 'hadir' },
        { date: '2026-03-05', status: 'hadir' },
        { date: '2026-03-04', status: 'hadir' },
        { date: '2026-03-03', status: 'hadir' },
    ]
}

const statusConfig = {
    hadir: { color: '#10B981', bg: '#ECFDF5', icon: CheckCircle, label: 'Hadir' },
    sakit: { color: '#F59E0B', bg: '#FFFBEB', icon: AlertCircle, label: 'Sakit' },
    izin: { color: '#3B82F6', bg: '#EFF6FF', icon: Clock, label: 'Izin' },
    alpha: { color: '#EF4444', bg: '#FEF2F2', icon: XCircle, label: 'Alpha' },
}

export default function PresensiPage() {
    const [month] = useState('Maret 2026')
    const { summary, records } = mockAttendance
    const percentage = Math.round((summary.hadir / summary.total) * 100)

    return (
        <div className="stu-page">
            <h2 className="stu-page-title">📋 Presensi</h2>

            {/* Attendance Ring */}
            <div className="stu-attendance-ring-card">
                <div className="stu-ring-container">
                    <svg viewBox="0 0 100 100" className="stu-ring-svg">
                        <circle cx="50" cy="50" r="42" fill="none" stroke="#E5E7EB" strokeWidth="8" />
                        <circle cx="50" cy="50" r="42" fill="none" stroke="#10B981" strokeWidth="8"
                            strokeDasharray={`${percentage * 2.64} ${264 - percentage * 2.64}`}
                            strokeDashoffset="66" strokeLinecap="round" />
                    </svg>
                    <div className="stu-ring-text">
                        <span className="stu-ring-percent">{percentage}%</span>
                        <span className="stu-ring-label">Kehadiran</span>
                    </div>
                </div>
                <div className="stu-ring-month">{month}</div>
            </div>

            {/* Summary Stats */}
            <div className="stu-attendance-stats">
                {Object.entries(statusConfig).map(([key, cfg]) => (
                    <div key={key} className="stu-att-stat" style={{ background: cfg.bg }}>
                        <cfg.icon size={18} color={cfg.color} />
                        <span className="stu-att-stat-count" style={{ color: cfg.color }}>{summary[key]}</span>
                        <span className="stu-att-stat-label">{cfg.label}</span>
                    </div>
                ))}
            </div>

            {/* Daily Records */}
            <div className="stu-section">
                <h3 className="stu-section-title">Riwayat Kehadiran</h3>
                <div className="stu-list">
                    {records.map(r => {
                        const cfg = statusConfig[r.status]
                        return (
                            <div key={r.date} className="stu-attendance-item">
                                <div className="stu-att-date">
                                    <Calendar size={16} />
                                    {new Date(r.date).toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' })}
                                </div>
                                <span className="stu-att-badge" style={{ background: cfg.bg, color: cfg.color }}>
                                    <cfg.icon size={14} /> {cfg.label}
                                </span>
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}
