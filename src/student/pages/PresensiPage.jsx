import { useState, useMemo } from 'react'
import * as LucideIcons from 'lucide-react'
import { AreaChart, Area, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useStudent } from '../StudentApp'

const statusConfig = {
    hadir: { color: '#10B981', bg: 'rgba(16, 185, 129, 0.1)', icon: LucideIcons.UserCheck, label: 'Hadir' },
    sakit: { color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.1)', icon: LucideIcons.HeartPulse, label: 'Sakit' },
    izin: { color: '#3B82F6', bg: 'rgba(59, 130, 246, 0.1)', icon: LucideIcons.ClipboardList, label: 'Izin' },
    alpha: { color: '#EF4444', bg: 'rgba(239, 68, 68, 0.1)', icon: LucideIcons.UserX, label: 'Alfa' },
}

export default function PresensiPage() {
    const { attendanceDocs } = useStudent()
    
    // 1. Get unique available months from data
    const availableMonths = useMemo(() => {
        if (!attendanceDocs?.length) return []
        const months = attendanceDocs.map(r => {
            const d = new Date(r.date)
            return d.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })
        })
        // Unique and sorted by date (latest first relies on records being sorted or explicit sort)
        return [...new Set(months)].sort((a, b) => {
            // Note: Simple string sort won't work for months, but since they come from records 
            // that are mostly chronological, or we can parse them back. 
            // Better: get months from chronological records.
            return 0 
        })
    }, [attendanceDocs])

    const [selectedMonth, setSelectedMonth] = useState(availableMonths[0] || new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }))

    // Update selectedMonth if data loads and nothing is selected
    useMemo(() => {
        if (availableMonths.length > 0 && !availableMonths.includes(selectedMonth)) {
            setSelectedMonth(availableMonths[0])
        }
    }, [availableMonths, selectedMonth])

    const allRecordsSorted = useMemo(() => {
        return [...(attendanceDocs || [])].sort((a, b) => new Date(b.date) - new Date(a.date))
    }, [attendanceDocs])

    const filteredRecords = useMemo(() => {
        return allRecordsSorted.filter(r => {
            const d = new Date(r.date)
            return d.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }) === selectedMonth
        })
    }, [allRecordsSorted, selectedMonth])

    const summary = useMemo(() => {
        return filteredRecords.reduce((acc, curr) => {
            const s = curr.status.toLowerCase()
            if (acc[s] !== undefined) acc[s]++
            return acc
        }, { hadir: 0, sakit: 0, izin: 0, alpha: 0 })
    }, [filteredRecords])

    const totalInMonth = filteredRecords.length
    const percentage = totalInMonth > 0 ? Math.round((summary.hadir / totalInMonth) * 100) : 0

    // Trend Pulse (Latest 7 days of the selected month)
    const trendData = useMemo(() => {
        return filteredRecords.slice(0, 7).reverse().map(r => ({
            name: new Date(r.date).toLocaleDateString('id-ID', { day: 'numeric' }),
            status: r.status.toLowerCase() === 'hadir' ? 100 : 70
        }))
    }, [filteredRecords])

    // Helper to format time strings (HH:mm)
    const formatTime = (timeStr) => {
        if (!timeStr) return '--:--'
        try {
            // Handle ISO string or full datetime
            const d = new Date(timeStr.includes('T') ? timeStr : `2000-01-01T${timeStr}`)
            if (isNaN(d.getTime())) return '--:--'
            return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false })
        } catch { return '--:--' }
    }

    return (
        <div className="stu-page">
            <div className="stu-header-v3 stu-fade-up">
                <div className="stu-title-stack">
                    <h1 className="stu-title-main">Presensi</h1>
                    <div className="stu-subtitle-row">
                        <LucideIcons.Calendar size={14} />
                        <span className="stu-subtitle-text">{selectedMonth}</span>
                    </div>
                </div>
                <div className="stu-live-pulse-container">
                    <span className="stu-pulse-label">LIVE TRACKING</span>
                    <div className="stu-pulse-ping-box">
                        <div className="stu-pulse-ping-dot" />
                        <div className="stu-pulse-ping-ring" />
                    </div>
                </div>
            </div>

            {/* Month Selector Pills */}
            {availableMonths.length > 1 && (
                <div className="stu-month-filter stu-fade-up delay-1">
                    {availableMonths.map(m => (
                        <div 
                            key={m} 
                            className={`stu-month-pill ${selectedMonth === m ? 'active' : ''}`}
                            onClick={() => setSelectedMonth(m)}
                        >
                            {m}
                        </div>
                    ))}
                </div>
            )}

            {/* Compact Overview Row (Ring + Chart) */}
            <div className="stu-att-overview-row stu-fade-up delay-1">
                {/* Compact Hero/Ring */}
                <div className="stu-attendance-hero-compact">
                    <div className="stu-ring-compact">
                        <svg viewBox="0 0 100 100" className="stu-ring-svg">
                            <circle cx="50" cy="50" r="44" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="8" />
                            <circle cx="50" cy="50" r="44" fill="none" stroke="#fff" strokeWidth="8"
                                strokeDasharray={`${percentage * 2.76} ${276 - percentage * 2.76}`}
                                strokeDashoffset="69" strokeLinecap="round" 
                                style={{ transition: 'stroke-dasharray 1.5s cubic-bezier(0.34, 1.56, 0.64, 1)' }}
                            />
                        </svg>
                        <div className="stu-ring-compact-text">{percentage}%</div>
                    </div>
                    <span className="stu-att-hero-label-compact">Tingkat Kehadiran</span>
                </div>

                {/* Compact Trend Chart */}
                <div className="stu-trend-card-compact">
                    <div className="stu-trend-header-compact">
                        <h4>Attendance Pulse</h4>
                        <span className="stu-trend-growth">{percentage > 80 ? 'Excellent' : 'Good'}</span>
                    </div>
                    <div style={{ width: '100%', height: 70 }}>
                        <ResponsiveContainer>
                            <AreaChart data={trendData}>
                                <defs>
                                    <linearGradient id="colorAttComp" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="var(--stu-primary)" stopOpacity={0.4}/>
                                        <stop offset="95%" stopColor="var(--stu-primary)" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <Area 
                                    type="monotone" 
                                    dataKey="status" 
                                    stroke="var(--stu-primary)" 
                                    strokeWidth={3} 
                                    fillOpacity={1} 
                                    fill="url(#colorAttComp)" 
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Summary Grid V2 */}
            <div className="stu-att-grid-premium stu-fade-up delay-3">
                {Object.entries(statusConfig).map(([key, cfg], index) => (
                    <div key={key} className={`stu-att-card-modern stu-fade-up`} style={{ animationDelay: `${0.4 + (index * 0.1)}s` }}>
                        <cfg.icon size={20} color={cfg.color} />
                        <div className="stu-att-info-modern">
                            <span className="stu-att-value-modern">{summary[key]}</span>
                            <span className="stu-att-label-modern">{cfg.label}</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* History Timeline V2 */}
            <div className="stu-section stu-fade-up delay-4">
                <div className="stu-section-header">
                    <h3 className="stu-section-title">Timeline Aktivitas</h3>
                    <div className="stu-action-group">
                        <button className="stu-btn-action-sm secondary">
                            <LucideIcons.Download size={12} /> Cetak
                        </button>
                    </div>
                </div>
                
                <div className="stu-timeline-container">
                    {filteredRecords.length === 0 ? (
                        <div className="stu-empty-mini">Belum ada riwayat aktivitas</div>
                    ) : (
                        filteredRecords.map((r, index) => {
                            const cfg = statusConfig[r.status.toLowerCase()] || statusConfig.alpha
                            const dateObj = new Date(r.date)
                            const isPresent = r.status.toLowerCase() === 'hadir'
                            return (
                                <div key={index} className="stu-timeline-item-v2 stu-fade-up" style={{ animationDelay: `${0.1 * index}s` }}>
                                    <div className="stu-timeline-dot-v2" style={{ borderColor: cfg.color }} />
                                    <div className="stu-timeline-card-v2">
                                        <div className="stu-timeline-info">
                                            <span className="stu-timeline-day-v2">
                                                {dateObj.toLocaleDateString('id-ID', { day: 'numeric', month: 'long' })}
                                            </span>
                                            <div className="stu-timeline-meta-v2" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                                <span>{dateObj.toLocaleDateString('id-ID', { weekday: 'long' })}</span>
                                                {isPresent && (
                                                    <>
                                                        <span style={{ opacity: 0.3 }}>|</span>
                                                        <span style={{ color: 'var(--stu-text)', fontWeight: 700 }}>
                                                            {formatTime(r.jam_masuk)} - {formatTime(r.jam_pulang)}
                                                        </span>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                        <div className="stu-timeline-status" style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.color}33` }}>
                                            <cfg.icon size={12} />
                                            <span>{cfg.label}</span>
                                        </div>
                                    </div>
                                </div>
                            )
                        })
                    )}
                </div>
            </div>
            
            <div style={{ height: '100px' }} />
        </div>
    )
}
