import { useState, useEffect } from 'react'
import { API_BASE, getAuthHeaders } from '../../services/api'
import LoadingSpinner from '../../components/LoadingSpinner'
import {
    Clock, Info, UserCheck, CheckCircle,
    BookOpen, Users, Activity,
    History, Layout, PlayCircle,  TrendingUp, ArrowRight,
    Calendar, Zap, Lightbulb, Flame, X, BarChart2, Award
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import { useCustomAlert } from '../../hooks/useCustomAlert'
import { useGuruSession } from '../../layouts/GuruSessionContext'
import confetti from 'canvas-confetti'

// --- STYLES ---
const styles = /*css*/`
  .guru-header {
    background: var(--bg-card);
    padding: 24px 32px;
    border-radius: 32px;
    border: 1px solid var(--border-color);
    box-shadow: var(--shadow-sm);
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 24px;
    margin-bottom: 32px;
    position: relative;
    overflow: hidden;
  }
  .bento-grid {
    display: grid;
    grid-template-columns: repeat(12, 1fr);
    gap: 24px;
    margin-bottom: 32px;
  }
  .bento-main { grid-column: span 7; }
  .bento-side { grid-column: span 5; display: flex; flex-direction: column; gap: 24px; }
  
  @media (max-width: 1200px) {
    .bento-main, .bento-side { grid-column: span 12; }
  }

  .bento-card {
    background: var(--bg-card);
    border-radius: 28px;
    padding: 32px;
    border: 1px solid var(--border-color);
    box-shadow: var(--shadow-sm);
    height: 100%;
    transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    display: flex;
    flex-direction: column;
    position: relative;
    overflow: hidden;
  }
  .bento-card:hover {
    transform: translateY(-5px);
    box-shadow: var(--shadow-lg);
    border-color: var(--primary-300);
  }

  .icon-box-soft {
    width: 48px;
    height: 48px;
    border-radius: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 20px;
  }
  .bg-soft-blue { background: var(--primary-50); color: var(--primary-500); }
  .bg-soft-green { background: var(--success-50); color: var(--success-500); }
  .bg-soft-purple { background: rgba(168, 85, 247, 0.1); color: #a855f7; }

  .stat-pill {
    background: var(--bg-stripe);
    border-radius: 16px;
    padding: 16px;
    display: flex;
    align-items: center;
    gap: 12px;
    flex: 1;
    border: 1px solid transparent;
    transition: all 0.2s;
  }
  .stat-pill:hover {
    border-color: var(--border-color);
    background: var(--bg-hover);
  }

  .schedule-card {
    background: var(--bg-card);
    border-radius: 24px;
    padding: 24px;
    border: 1px solid var(--border-color);
    transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    position: relative;
    overflow: hidden;
    margin-bottom: 20px;
  }
  .schedule-card:hover { 
    background: var(--bg-hover); 
    transform: translateX(4px); 
    box-shadow: var(--shadow-sm);
  }
  .schedule-card.running {
    border: 1px solid var(--primary-400);
    background: linear-gradient(to right, var(--bg-card), var(--primary-50));
  }
  
  @keyframes pulse-glow {
    0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.4); }
    70% { box-shadow: 0 0 0 10px rgba(16, 185, 129, 0); }
    100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
  }

  .schedule-card.glowing {
    border: 1.5px solid var(--success-400);
    animation: pulse-glow 2s infinite;
    background: linear-gradient(to right, var(--bg-card), var(--success-50));
  }

  .countdown-badge {
    background: var(--success-100);
    color: var(--success-700);
    padding: 6px 12px;
    border-radius: 20px;
    font-size: 0.75rem;
    font-weight: 800;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    margin-top: 10px;
  }

  .btn-play-session {
    background: var(--primary-600);
    color: #fff;
    border: none;
    padding: 12px 24px;
    border-radius: 14px;
    font-weight: 700;
    font-size: 0.9rem;
    display: flex;
    align-items: center;
    gap: 10px;
    transition: all 0.2s;
    box-shadow: 0 4px 12px rgba(37, 99, 235, 0.2);
  }
  .btn-play-session:hover {
    background: var(--primary-700);
    transform: translateY(-1px);
    box-shadow: 0 6px 16px rgba(37, 99, 235, 0.3);
  }
  
  .quick-context-btn {
    position: relative;
  }
  
  .quick-context-tooltip {
    visibility: hidden;
    opacity: 0;
    position: absolute;
    bottom: calc(100% + 10px);
    right: 0;
    background: var(--bg-card);
    border: 1px solid var(--border-color);
    box-shadow: 0 10px 25px rgba(0,0,0,0.15);
    padding: 16px;
    border-radius: 16px;
    width: 260px;
    z-index: 100;
    transform: translateY(10px);
    transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    pointer-events: none;
    text-align: left;
    color: var(--text-primary);
  }
  .quick-context-tooltip::after {
    content: '';
    position: absolute;
    top: 100%;
    right: 20px;
    border-width: 8px;
    border-style: solid;
    border-color: var(--bg-card) transparent transparent transparent;
  }
  .quick-context-btn:hover .quick-context-tooltip {
    visibility: visible;
    opacity: 1;
    transform: translateY(0);
  }

  .btn-glass-sidebar {
    background: var(--primary-50);
    color: var(--primary-600);
    border: 1px solid var(--primary-100);
    padding: 14px;
    border-radius: 16px;
    width: 100%;
    font-weight: 700;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
  }
  .btn-glass-sidebar:hover {
    background: var(--primary-600);
    color: #fff;
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(37, 99, 235, 0.15);
  }

  .progress-premium {
    height: 10px;
    border-radius: 10px;
    background: var(--bg-stripe);
    overflow: hidden;
    position: relative;
    border: 1px solid var(--border-color);
  }
  .progress-premium .progress-bar {
    background: linear-gradient(90deg, var(--primary-500), var(--primary-600));
    border-radius:20px;
    transition: width 1.5s cubic-bezier(0.16, 1, 0.3, 1);
  }
  
  @keyframes slide-up-stagger {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .stagger-item {
    opacity: 0;
    animation: slide-up-stagger 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  }

  @media (max-width: 767px) {
    .guru-header {
      flex-direction: column;
      align-items: flex-start;
      padding: 16px 20px;
      gap: 16px;
      border-radius: 20px;
      margin-bottom: 20px;
    }
    .guru-header button {
      width: 100%;
      justify-content: center;
    }
    .guru-header h2 {
      font-size: 1.2rem !important;
    }
    .bento-grid {
      gap: 16px;
      margin-bottom: 20px;
    }
    .bento-card {
      padding: 20px;
      border-radius: 20px;
    }
    .bento-card:hover {
      transform: none;
    }
    .schedule-card {
      padding: 16px;
      border-radius: 18px;
      margin-bottom: 14px;
    }
    .schedule-card .d-flex.align-items-center.justify-content-between {
      flex-direction: column;
      align-items: flex-start !important;
      gap: 14px;
    }
    .schedule-card .d-flex.align-items-center.gap-4 {
      gap: 12px !important;
    }
    .schedule-card .d-flex.align-items-center.gap-4 > .text-center {
      min-width: 70px !important;
    }
    .schedule-card .d-flex.flex-column.align-items-center.gap-1 {
      display: none !important;
    }
    .btn-play-session {
      width: 100%;
      justify-content: center;
      padding: 12px 16px;
    }
    .btn-glass-sidebar {
      font-size: 0.85rem;
    }
  }

  /* Progress Ring */
  .ring-track { stroke: var(--bg-stripe); }
  .ring-fill {
    stroke-linecap: round;
    transition: stroke-dashoffset 1.5s cubic-bezier(0.16, 1, 0.3, 1);
    transform: rotate(-90deg);
    transform-origin: 50% 50%;
  }

  /* Pre-Session Modal */
  .briefing-overlay {
    position: fixed; inset: 0; z-index: 9999;
    background: rgba(0,0,0,0.6);
    backdrop-filter: blur(8px);
    display: flex; align-items: center; justify-content: center;
    padding: 20px;
    animation: fadeIn 0.2s ease-out;
  }
  .briefing-modal {
    background: var(--bg-card);
    border-radius: 28px;
    padding: 32px;
    max-width: 480px;
    width: 100%;
    border: 1px solid var(--border-color);
    box-shadow: 0 24px 64px rgba(0,0,0,0.2);
    animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  }
  @keyframes slideUp {
    from { transform: translateY(30px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }
  @keyframes fadeIn {
    from { opacity: 0; } to { opacity: 1; }
  }
  .briefing-tip {
    background: var(--primary-50);
    border: 1px solid var(--primary-100);
    border-radius: 16px;
    padding: 16px;
    margin-top: 20px;
  }

  /* Insight Card */
  .insight-chip {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 12px 14px;
    background: var(--bg-stripe);
    border-radius: 14px;
    border: 1px solid var(--border-color);
    font-size: 0.82rem;
    font-weight: 700;
    color: var(--text-primary);
    margin-bottom: 10px;
    transition: all 0.2s;
  }
  .insight-chip:hover { background: var(--bg-hover); }
  .insight-chip:last-child { margin-bottom: 0; }
`

export default function GuruDashboard() {
    const { currentUser } = useApp()
    const { confirmAction, showError } = useCustomAlert()
    const { setSessionBadge } = useGuruSession()
    const [data, setData] = useState({ schedules: [], activeJournals: [], day: '', date: '' })
    const [weeklyInsights, setWeeklyInsights] = useState(null)
    const [loading, setLoading] = useState(true)
    const [now, setNow] = useState(new Date())
    const [hasFiredConfetti, setHasFiredConfetti] = useState(false)
    const [briefingSchedule, setBriefingSchedule] = useState(null) // R9: Pre-Session Modal
    const navigate = useNavigate()

    const fetchData = async () => {
        try {
            const res = await fetch(`${API_BASE}/guru/session/today`, { headers: getAuthHeaders() })
            if (res.ok) setData(await res.json())
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    const fetchWeeklyInsights = async () => {
        try {
            const res = await fetch(`${API_BASE}/guru/session/history`, { headers: getAuthHeaders() })
            if (res.ok) {
                const history = await res.json()
                if (Array.isArray(history) && history.length > 0) {
                    const now = new Date()
                    const weekAgo = new Date(now); weekAgo.setDate(weekAgo.getDate() - 7)
                    const twoWeeksAgo = new Date(now); twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14)
                    const thisWeek = history.filter(h => new Date(h.tanggal) >= weekAgo)
                    const lastWeek = history.filter(h => new Date(h.tanggal) >= twoWeeksAgo && new Date(h.tanggal) < weekAgo)
                    const avgAttendance = thisWeek.length > 0
                        ? Math.round(thisWeek.reduce((acc, h) => acc + (h.total_presensi || 0), 0) / thisWeek.length)
                        : 0
                    // Most active class this week
                    const classCounts = thisWeek.reduce((acc, h) => { acc[h.kelas_nama] = (acc[h.kelas_nama] || 0) + 1; return acc }, {})
                    const topClass = Object.entries(classCounts).sort((a, b) => b[1] - a[1])[0]
                    setWeeklyInsights({
                        thisWeekCount: thisWeek.length,
                        lastWeekCount: lastWeek.length,
                        trend: thisWeek.length >= lastWeek.length ? 'up' : 'down',
                        avgAttendance,
                        topClass: topClass ? topClass[0] : null,
                        totalSessions: history.length
                    })
                }
            }
        } catch (err) { console.error('Insights error:', err) }
    }

    // Initial Fetch & Setup
    useEffect(() => {
        fetchData()
        fetchWeeklyInsights()
        
        // Auto-refresh interval (Context-Sync Polling) every 30s
        const syncTimer = setInterval(() => {
            fetchData()
        }, 30000)

        // Clock timer for countdowns every 1s
        const clockTimer = setInterval(() => {
            setNow(new Date())
        }, 1000)

        return () => {
            clearInterval(syncTimer)
            clearInterval(clockTimer)
        }
    }, [])

    const handleStartSession = async (jadwal_id, jadwal_id_end, currentStatus, jurnal_id, schedule) => {
        if (currentStatus === 'Running') {
            navigate(`/guru/session/${jurnal_id}`)
            return
        }
        if (currentStatus === 'Selesai') return

        // R9: Show Pre-Session Briefing Modal
        setBriefingSchedule(schedule)
    }

    const handleConfirmStartSession = async (schedule) => {
        setBriefingSchedule(null)
        const jadwal_id = schedule.id
        const jadwal_id_end = (schedule.jadwal_ids && Array.isArray(schedule.jadwal_ids))
            ? schedule.jadwal_ids[schedule.jadwal_ids.length - 1]
            : schedule.id

        const confirmed = await confirmAction({
            title: 'Mulai Sesi Belajar?',
            text: 'Waktu masuk Anda akan secara otomatis tercatat pada jam sekarang.',
            confirmText: 'Ya, Mulai Sekarang',
            cancelText: 'Batal',
            icon: 'info'
        })
        if (!confirmed) return

        try {
            const res = await fetch(`${API_BASE}/guru/session/start`, {
                method: 'POST',
                headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
                body: JSON.stringify({ jadwal_id, jadwal_id_end })
            })
            const result = await res.json()
            if (!res.ok) throw new Error(result.error)

            navigate(`/guru/session/${result.id}`)
        } catch (err) {
            showError('Gagal Memulai Sesi', err.message)
        }
    }

    const completedCount = data.schedules.filter(s => s.status === 'Selesai').length
    const totalCount = data.schedules.length
    const progressPct = totalCount > 0 ? (completedCount / totalCount) * 100 : 0
    const perfectStreak = progressPct === 100 && totalCount > 0
    const runningCount = data.schedules.filter(s => s.status === 'Running').length
    const remainingCount = totalCount - completedCount - runningCount

    // R12: Update Live Session Badge in navbar
    useEffect(() => {
        if (runningCount > 0) {
            setSessionBadge({ type: 'running', label: `${runningCount} Sesi Aktif` })
        } else if (remainingCount > 0) {
            setSessionBadge({ type: 'remaining', label: `${remainingCount} Sesi Tersisa` })
        } else if (perfectStreak) {
            setSessionBadge({ type: 'done', label: '✓ Semua Selesai' })
        } else {
            setSessionBadge(null)
        }
        return () => setSessionBadge(null)
    }, [runningCount, remainingCount, perfectStreak, setSessionBadge])

    // Fire Confetti Once on 100%
    useEffect(() => {
        if (perfectStreak && !hasFiredConfetti) {
            confetti({
                particleCount: 150,
                spread: 80,
                origin: { y: 0.6 },
                colors: ['#10b981', '#3b82f6', '#fbbf24', '#f43f5e']
            })
            setHasFiredConfetti(true)
        } else if (!perfectStreak) {
            setHasFiredConfetti(false) // reset if ad-hoc added
        }
    }, [perfectStreak, hasFiredConfetti])

    return (
        <div className="pb-5" style={{ paddingBottom: 'calc(20px + env(safe-area-inset-bottom))' }}>
            <style dangerouslySetInnerHTML={{ __html: styles }} />

            {/* R9: Pre-Session Briefing Modal */}
            {briefingSchedule && (
                <BriefingModal
                    schedule={briefingSchedule}
                    onConfirm={() => handleConfirmStartSession(briefingSchedule)}
                    onClose={() => setBriefingSchedule(null)}
                />
            )}

            {/* PREMIUM GURU HEADER */}
            <div className="guru-header stagger-item" style={{ animationDelay: '0s' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                    <div style={{
                        padding: 14,
                        background: 'linear-gradient(135deg, var(--primary-600), var(--primary-800))',
                        color: '#fbbf24',
                        borderRadius: 18,
                        boxShadow: '0 8px 16px rgba(37, 99, 235, 0.2)'
                    }}>
                        <Calendar size={32} strokeWidth={2.5} />
                    </div>
                    <div>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, letterSpacing: '-0.025em' }}>Selamat Datang, {currentUser?.nama?.split(' ')[0]}!</h2>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: 4 }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                <div className="pulse-dot" style={{ width: 8, height: 8, background: '#10b981', borderRadius: '50%' }}></div> {data.day}, {data.date}
                            </span>
                            <span>•</span>
                            <span className="text-primary fw-bold">
                                {totalCount} Sesi Terjadwal
                            </span>
                        </div>
                    </div>
                </div>
                <button
                    className="btn btn-outline-primary shadow-sm"
                    style={{ borderRadius: 12, padding: '12px 24px', fontWeight: 700, border: '1.5px solid var(--primary-200)', background: 'var(--bg-card)' }}
                    onClick={() => navigate('/guru/history')}
                >
                    <History size={20} className="me-2" />
                    Riwayat Jurnal & Absensi
                </button>
            </div>

            {loading && data.schedules.length === 0 ? <LoadingSpinner fullScreen={false} /> : (
                <div className="bento-grid">
                    {/* MAIN CONTENT: SCHEDULES */}
                    <div className="bento-main">
                        <div className="d-flex align-items-center justify-content-between mb-4 px-1 stagger-item" style={{ animationDelay: '0.1s' }}>
                            <h5 className="fw-black mb-0 d-flex align-items-center gap-2 text-primary" style={{ fontSize: '1.1rem', letterSpacing: '-0.5px' }}>
                                <Layout size={20} className="text-primary" />
                                Jadwal Mengajar Hari Ini
                                <div className="spinner-grow text-primary ms-2" role="status" style={{ width: '0.8rem', height: '0.8rem', animationDuration: '2s' }} />
                            </h5>
                            <span className="badge border-0 px-3 py-2" style={{ borderRadius: 20, fontSize: '0.75rem', background: 'var(--primary-100)', color: 'var(--primary-700)', fontWeight: 800 }}>
                                {totalCount - completedCount} Sesi Tersisa
                            </span>
                        </div>

                        {data.schedules.length === 0 ? (
                            <div className="bento-card text-center d-flex flex-column align-items-center justify-content-center py-5 stagger-item" style={{ animationDelay: '0.2s' }}>
                                <div className="icon-box-soft bg-soft-blue mb-4" style={{ width: 80, height: 80 }}>
                                    <BookOpen size={40} />
                                </div>
                                <h4 className="fw-black text-primary mb-2">Tidak Ada Jadwal</h4>
                                <p className="text-muted max-w-sm mx-auto fw-medium">Anda tidak memiliki jadwal mengajar hari ini. Gunakan waktu ini untuk persiapan materi atau istirahat! 🎉</p>
                            </div>
                        ) : (
                            data.schedules.map((j, idx) => (
                                <ScheduleCard
                                    key={j.id}
                                    schedule={j}
                                    now={now}
                                    index={idx + 2} // for stagger delay
                                    onAction={() => {
                                        handleStartSession(j.id, null, j.status, j.jurnal?.id, j)
                                    }}
                                />
                            ))
                        )}
                    </div>

                    {/* SIDE PANEL: ANALYTICS & TIPS */}
                    <div className="bento-side">
                        {/* R8: Progress Ring Card */}
                        <div className="bento-card stagger-item" style={{ animationDelay: '0.2s' }}>
                            <div className="d-flex align-items-center gap-3 mb-4">
                                <div className="icon-box-soft bg-soft-green mb-0" style={{ width: 42, height: 42 }}>
                                    <UserCheck size={20} />
                                </div>
                                <h6 className="fw-bold mb-0 text-primary">Progress Hari Ini</h6>
                            </div>

                            {/* Circular Progress Ring */}
                            <div className="d-flex align-items-center gap-4 mb-4">
                                <ProgressRing pct={progressPct} isDone={perfectStreak} size={80} />
                                <div>
                                    {perfectStreak ? (
                                        <span className="text-success fw-black d-flex align-items-center gap-1" style={{ fontSize: '1.1rem' }}>
                                            <Flame size={18} /> Sempurna!
                                        </span>
                                    ) : (
                                        <div className="fw-black text-primary" style={{ fontSize: '1.5rem', lineHeight: 1 }}>
                                            {completedCount}<span className="text-muted fw-normal" style={{ fontSize: '0.9rem' }}>/{totalCount}</span>
                                        </div>
                                    )}
                                    <div className="text-muted small fw-bold mt-1">Sesi Selesai</div>
                                </div>
                            </div>
                            
                            {perfectStreak ? (
                                <div className="p-3 rounded-2xl" style={{ background: 'var(--success-50)', border: '1px solid var(--success-200)', color: 'var(--success-700)' }}>
                                    <p className="small mb-0 fw-bold">
                                        ✨ Luar biasa! Anda berhasil menyelesaikan semua sesi mengajar hari ini dengan konsisten.
                                    </p>
                                </div>
                            ) : (
                                <div className="p-3 rounded-2xl" style={{ background: 'var(--bg-stripe)', border: '1px solid var(--border-color)' }}>
                                    <p className="small text-muted mb-0 fw-medium">
                                        <Info size={14} className="me-2 text-primary" />
                                        Waktu kehadiran otomatis terekam saat Anda menekan tombol <strong>Mulai Mengajar</strong>.
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* R6: Teaching Insights Card */}
                        {weeklyInsights && (
                            <div className="bento-card stagger-item" style={{ animationDelay: '0.25s' }}>
                                <div className="d-flex align-items-center gap-3 mb-3">
                                    <div className="icon-box-soft bg-soft-purple mb-0" style={{ width: 42, height: 42 }}>
                                        <BarChart2 size={20} />
                                    </div>
                                    <h6 className="fw-bold mb-0 text-primary">Insights Minggu Ini</h6>
                                </div>
                                <div className="insight-chip">
                                    <div style={{ width: 32, height: 32, borderRadius: 10, background: weeklyInsights.trend === 'up' ? 'var(--success-50)' : 'rgba(239,68,68,0.1)', color: weeklyInsights.trend === 'up' ? 'var(--success-600)' : '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                        <TrendingUp size={16} style={{ transform: weeklyInsights.trend === 'down' ? 'scaleY(-1)' : 'none' }} />
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Sesi Minggu Ini</div>
                                        <div style={{ fontWeight: 800 }}>{weeklyInsights.thisWeekCount} sesi <span style={{ color: weeklyInsights.trend === 'up' ? 'var(--success-600)' : '#ef4444', fontSize: '0.75rem' }}>({weeklyInsights.trend === 'up' ? '+' : ''}{weeklyInsights.thisWeekCount - weeklyInsights.lastWeekCount} vs minggu lalu)</span></div>
                                    </div>
                                </div>
                                {weeklyInsights.avgAttendance > 0 && (
                                    <div className="insight-chip">
                                        <div style={{ width: 32, height: 32, borderRadius: 10, background: 'var(--primary-50)', color: 'var(--primary-600)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                            <Users size={16} />
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Rata-rata Hadir</div>
                                            <div style={{ fontWeight: 800 }}>{weeklyInsights.avgAttendance} siswa / sesi</div>
                                        </div>
                                    </div>
                                )}
                                {weeklyInsights.topClass && (
                                    <div className="insight-chip">
                                        <div style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(251,191,36,0.1)', color: '#b45309', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                            <Award size={16} />
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Kelas Teraktif</div>
                                            <div style={{ fontWeight: 800 }}>{weeklyInsights.topClass}</div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* R7: NINJA MODE / COMMAND PALETTE — Enhanced Shortcut Guide */}
                        <div className="bento-card stagger-item" style={{ animationDelay: '0.3s', background: 'linear-gradient(135deg, var(--primary-600), var(--primary-800))', color: '#fff', border: 'none' }}>
                            <div className="d-flex align-items-center justify-content-between mb-3">
                                <div className="d-flex align-items-center gap-3">
                                    <div style={{
                                        width: 42, height: 42, borderRadius: 12,
                                        background: 'rgba(255,255,255,0.1)', color: '#fbbf24',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                                    }}>
                                        <Zap size={20} />
                                    </div>
                                    <h6 className="fw-bold mb-0" style={{ color: '#fff' }}>Ninja Mode</h6>
                                </div>
                                <kbd style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.2)', padding: '4px 8px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 800 }}>Ctrl + K</kbd>
                            </div>
                            <p className="small opacity-80 mb-3 fw-medium lh-sm">Gunakan Command Palette atau shortcut keyboard untuk navigasi super cepat.</p>
                            {/* Shortcut Guide */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 16 }}>
                                {[['Ctrl+K', 'Palette'], ['Alt+1', 'Beranda'], ['Alt+2', 'Riwayat'], ['Alt+3', 'Rapor']].map(([key, label]) => (
                                    <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px', background: 'rgba(255,255,255,0.08)', borderRadius: 10, border: '1px solid rgba(255,255,255,0.12)' }}>
                                        <kbd style={{ background: 'rgba(0,0,0,0.25)', padding: '2px 6px', borderRadius: 6, fontSize: '0.65rem', fontWeight: 800, whiteSpace: 'nowrap' }}>{key}</kbd>
                                        <span style={{ fontSize: '0.72rem', fontWeight: 700, opacity: 0.85 }}>{label}</span>
                                    </div>
                                ))}
                            </div>
                            <button className="btn-glass-sidebar" onClick={() => window.dispatchEvent(new Event('open-command-palette'))} style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)' }}>
                                Coba Sekarang <ArrowRight size={18} className="ms-auto" />
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

function ScheduleCard({ schedule, onAction, now, index }) {
    const isAdhoc = false; // Add adhoc prop if API returns it, placeholder for now
    const isRunning = schedule.status === 'Running'
    const isDone = schedule.status === 'Selesai'

    // Smart Timeline logic
    let isApproaching = false;
    let countdownText = null;
    
    if (!isDone && schedule.jam_mulai && now) {
        const [hours, minutes] = schedule.jam_mulai.split(':');
        // Construct the start time for today
        const scheduleTime = new Date();
        scheduleTime.setHours(parseInt(hours, 10));
        scheduleTime.setMinutes(parseInt(minutes, 10));
        scheduleTime.setSeconds(0);
        
        const timeDiffMs = scheduleTime.getTime() - now.getTime();
        const minsLeft = timeDiffMs / (1000 * 60);

        // If it starts within the next 45 minutes
        if (minsLeft > 0 && minsLeft <= 45) {
            isApproaching = true;
            const m = Math.floor(timeDiffMs / (1000 * 60));
            const s = Math.floor((timeDiffMs % (1000 * 60)) / 1000);
            countdownText = `Dimulai dalam ${m}m ${s}s`;
        } else if (minsLeft <= 0 && minsLeft > -120) {
            // Already past start time but not completed
            isApproaching = true; 
        }
    }

    return (
        <div className={`schedule-card stagger-item ${isRunning ? 'running' : ''} ${isApproaching && !isRunning && !isDone ? 'glowing' : ''}`} style={{ animationDelay: `${index * 0.1}s` }}>
            <div className="d-flex align-items-center justify-content-between">
                <div className="d-flex align-items-center gap-4">
                    <div className="text-center" style={{ minWidth: '90px' }}>
                        <div className="fw-black fs-4 text-primary lh-1 mb-1">{schedule.jam_mulai?.substring(0, 5)}</div>
                        <div className="text-muted fw-bold tracking-wider lh-1" style={{ fontSize: '0.65rem' }}>WAKTU MULAI</div>
                    </div>

                    <div className="d-flex flex-column align-items-center gap-2 px-2">
                        <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: isRunning ? 'var(--primary-500)' : 'var(--border-color)', boxShadow: isRunning ? '0 0 0 4px var(--primary-50)' : 'none' }}></div>
                        <div style={{ width: '2px', height: '28px', borderRadius: '2px', background: 'var(--border-color)' }}></div>
                        <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: isDone ? 'var(--success-500)' : 'var(--border-color)' }}></div>
                    </div>

                    <div className="flex-grow-1">
                        <div className="d-flex align-items-center flex-wrap gap-2 mb-2">
                            <span className="badge border-0 px-2 py-1" style={{ borderRadius: 8, fontSize: '0.7rem', background: 'var(--primary-100)', color: 'var(--primary-700)', fontWeight: 800 }}>
                                {schedule.kelas_nama}
                            </span>
                            <span className="badge border-0 px-2 py-1" style={{ borderRadius: 8, fontSize: '0.7rem', background: 'var(--primary-100)', color: 'var(--primary-700)', fontWeight: 800 }}>
                                Jam ke-{schedule.jam_ke}{schedule.jam_ke_end && schedule.jam_ke_end !== schedule.jam_ke ? ` s.d ${schedule.jam_ke_end}` : ''}
                            </span>
                            {isAdhoc && (
                                <span className="badge border-0 px-2 py-1" style={{ borderRadius: 8, fontSize: '0.7rem', background: 'var(--warning-100)', color: 'var(--warning-700)', fontWeight: 800 }}>
                                    AD-HOC
                                </span>
                            )}
                            {isDone && (
                                <span className="badge border-0 px-2 py-1" style={{ borderRadius: 8, fontSize: '0.7rem', background: 'var(--success-100)', color: 'var(--success-700)', fontWeight: 800 }}>
                                    SELESAI
                                </span>
                            )}
                        </div>
                        <h5 className="fw-black mb-0 text-primary tracking-tight">{schedule.mapel_nama}</h5>
                        {countdownText && (
                            <div className="countdown-badge">
                                <Clock size={12} /> {countdownText}
                            </div>
                        )}
                        {!countdownText && <p className="text-muted small mt-2 mb-0 fw-bold"><Clock size={12} className="me-1"/> Selesai: {schedule.jam_selesai?.substring(0, 5)}</p>}
                    </div>
                </div>

                <div className="ms-auto mt-3 mt-md-0">
                    {!isDone ? (
                        <div className="quick-context-btn">
                            <button className="btn-play-session" onClick={onAction}>
                                {isRunning ? (
                                    <>
                                        <Activity size={18} />
                                        Lanjutkan Sesi
                                    </>
                                ) : (
                                    <>
                                        <PlayCircle size={18} />
                                        Mulai Mengajar
                                    </>
                                )}
                                <ArrowRight size={16} />
                            </button>
                            {/* Quick Context Tooltip */}
                            <div className="quick-context-tooltip">
                                <div className="d-flex align-items-center gap-2 mb-2">
                                    <div style={{ background: 'var(--warning-100)', padding: '6px', borderRadius: '8px', color: 'var(--warning-600)' }}>
                                        <Lightbulb size={16} />
                                    </div>
                                    <span className="fw-black text-primary" style={{ fontSize: '0.85rem' }}>Quick Recall</span>
                                </div>
                                <p className="small text-muted mb-0 lh-sm fw-medium">
                                    Sebelum mulai, sekilas info kelas <strong>{schedule.kelas_nama}</strong>:
                                    <br/><br/>
                                    <span className="text-primary fw-bold">Topik Terakhir:</span><br/>
                                    {schedule.materi_terakhir || 'Belum ada catatan pertemuan sebelumnya.'}
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="d-flex flex-column align-items-end stagger-item" style={{ animationDelay: `${index * 0.1 + 0.2}s` }}>
                            <div className="text-success fw-black d-flex align-items-center gap-2">
                                <CheckCircle size={20} />
                                SESI SELESAI
                            </div>
                            <div className="text-muted small fw-bold mt-1">Keluar: {schedule.jurnal?.waktu_keluar_aktual?.substring(0, 5)}</div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

// R8: Circular Progress Ring Component
function ProgressRing({ pct, isDone, size = 80 }) {
    const radius = (size / 2) - 8
    const circumference = 2 * Math.PI * radius
    const offset = circumference - (pct / 100) * circumference
    const color = isDone ? 'var(--success-500)' : 'var(--primary-500)'
    return (
        <svg width={size} height={size} style={{ flexShrink: 0 }}>
            <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="var(--border-color)" strokeWidth="7" />
            <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke={color} strokeWidth="7"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                style={{ transition: 'stroke-dashoffset 1.5s cubic-bezier(0.16, 1, 0.3, 1)', transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }}
            />
            <text x="50%" y="50%" textAnchor="middle" dominantBaseline="central"
                style={{ fontSize: size * 0.2, fontWeight: 800, fill: color }}>
                {isDone ? '✓' : `${Math.round(pct)}%`}
            </text>
        </svg>
    )
}

// R9: Pre-Session Briefing Modal
const TEACHING_TIPS = [
    'Mulai kelas dengan pertanyaan pemantik untuk mengaktifkan prior knowledge siswa.',
    'Gunakan teknik "Think-Pair-Share" agar semua siswa terlibat aktif.',
    'Berikan umpan balik positif spesifik, bukan hanya "bagus" atau "benar".',
    'Variasikan metode belajar: visual, auditori, dan kinestetik setiap sesi.',
    'Sisihkan 5 menit di akhir kelas untuk refleksi dan ringkasan bersama.',
    'Hubungkan materi baru dengan konteks kehidupan nyata siswa.',
    'Ajukan pertanyaan terbuka yang mendorong berpikir kritis.',
]

function BriefingModal({ schedule, onConfirm, onClose }) {
    const tip = TEACHING_TIPS[Math.floor(Math.random() * TEACHING_TIPS.length)]
    return (
        <div className="briefing-overlay" onClick={onClose}>
            <div className="briefing-modal" onClick={e => e.stopPropagation()}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                        <div style={{ width: 52, height: 52, borderRadius: 16, background: 'linear-gradient(135deg, var(--primary-600), var(--primary-800))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fbbf24' }}>
                            <PlayCircle size={28} />
                        </div>
                        <div>
                            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Siap Mengajar?</div>
                            <h4 style={{ margin: 0, fontWeight: 800, fontSize: '1.2rem', color: 'var(--text-primary)', letterSpacing: '-0.03em' }}>{schedule.mapel_nama}</h4>
                        </div>
                    </div>
                    <button onClick={onClose} style={{ background: 'var(--bg-stripe)', border: '1px solid var(--border-color)', borderRadius: 10, padding: 6, cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}>
                        <X size={18} />
                    </button>
                </div>
                <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
                    <span style={{ padding: '6px 14px', borderRadius: 100, background: 'var(--primary-50)', color: 'var(--primary-700)', fontSize: '0.8rem', fontWeight: 800, border: '1px solid var(--primary-100)' }}>{schedule.kelas_nama}</span>
                    <span style={{ padding: '6px 14px', borderRadius: 100, background: 'var(--bg-stripe)', color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 700, border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: 5 }}>
                        <Clock size={13} /> {schedule.jam_mulai?.substring(0, 5)} – {schedule.jam_selesai?.substring(0, 5)}
                    </span>
                </div>
                <div style={{ background: 'var(--bg-stripe)', borderRadius: 16, padding: '14px 16px', border: '1px solid var(--border-color)', marginBottom: 16 }}>
                    <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 5 }}>
                        <Lightbulb size={12} /> Topik Pertemuan Terakhir
                    </div>
                    <p style={{ margin: 0, fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.9rem', lineHeight: 1.5 }}>
                        {schedule.materi_terakhir || 'Belum ada catatan pertemuan sebelumnya untuk kelas ini.'}
                    </p>
                </div>
                <div className="briefing-tip">
                    <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--primary-600)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>💡 Tips Mengajar Hari Ini</div>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6, fontWeight: 500 }}>{tip}</p>
                </div>
                <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                    <button onClick={onClose} style={{ flex: 1, padding: '12px', borderRadius: 14, border: '1.5px solid var(--border-color)', background: 'var(--bg-stripe)', color: 'var(--text-secondary)', fontWeight: 700, cursor: 'pointer', fontSize: '0.875rem' }}>
                        Kembali
                    </button>
                    <button onClick={onConfirm} style={{ flex: 2, padding: '12px', borderRadius: 14, border: 'none', background: 'linear-gradient(135deg, var(--primary-600), var(--primary-700))', color: '#fff', fontWeight: 800, cursor: 'pointer', fontSize: '0.875rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: '0 4px 14px rgba(37,99,235,0.3)' }}>
                        <PlayCircle size={18} /> Mulai Mengajar Sekarang
                    </button>
                </div>
            </div>
        </div>
    )
}
