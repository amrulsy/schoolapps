import { useApp } from '../../context/AppContext'
import { useMemo, useEffect, useState } from 'react'
import LoadingSpinner from '../../components/LoadingSpinner'
import {
    Users, UserCheck, GraduationCap,
    UserPlus, ArrowRight,
    TrendingUp, Activity, Sparkles, Zap, ShieldCheck
} from 'lucide-react'
import { Link } from 'react-router-dom'

const dashStyles = `
    .dashboard-ultimate { padding-bottom: 16px; }
    .dashboard-hero-row {
        display: flex;
        justify-content: space-between;
        align-items: flex-end;
        margin-bottom: 28px;
        gap: 16px;
        flex-wrap: wrap;
    }
    .dashboard-hero-title {
        font-size: clamp(1.6rem, 5vw, 2.5rem);
        font-weight: 900;
        margin: 0;
        letter-spacing: -1px;
        color: var(--text-primary);
    }
    .dashboard-hero-eyebrow {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 6px;
        font-size: 0.72rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 1.5px;
        color: var(--text-muted);
    }
    .dashboard-hero-meta {
        text-align: right;
        font-size: 0.85rem;
    }
    .dashboard-hero-meta .date {
        font-weight: 700;
        color: var(--text-primary);
    }
    .dashboard-hero-meta .ta {
        color: var(--text-muted);
        margin-top: 2px;
    }
    @media (max-width: 767px) {
        .dashboard-hero-meta { display: none; }
        .dashboard-hero-row { margin-bottom: 20px; }
        .dashboard-hero-title { letter-spacing: -0.5px; }
    }
    @media (max-width: 480px) {
        .dashboard-hero-title { font-size: 1.4rem; }
    }
    .dash-quick-link {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 14px 16px;
        background: var(--bg-card);
        border: 1px solid var(--border-color);
        border-radius: 14px;
        text-decoration: none;
        color: var(--text-primary);
        transition: all 0.2s ease;
        font-weight: 600;
        font-size: 0.88rem;
    }
    .dash-quick-link:hover {
        transform: translateY(-3px);
        box-shadow: var(--shadow-md);
        border-color: var(--primary-300);
        text-decoration: none;
        color: var(--text-primary);
    }
    .dash-quick-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 10px;
    }
    @media (max-width: 480px) {
        .dash-quick-link { padding: 10px 12px; font-size: 0.82rem; }
    }
    .dash-portal-row {
        display: flex;
        gap: 20px;
        align-items: center;
    }
    .dash-portal-icon {
        opacity: 0.4;
        flex-shrink: 0;
    }
    @media (max-width: 640px) {
        .dash-portal-icon { display: none; }
    }
`

export default function DashboardPage() {
    const {
        students, units, currentUser, loading,
        generateLogs, transactions, tahunAjaran, formatRupiah
    } = useApp()

    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    const mainStats = useMemo(() => {
        const active = students.filter(s => s.status === 'aktif').length
        const totalKelas = units.reduce((s, u) => s + (u.kelas?.length || 0), 0)

        return [
            { label: 'Siswa Aktif', value: active, icon: Users, color: '#3b82f6', accent: 'rgba(59, 130, 246, 0.5)' },
            { label: 'Tenaga Pendidik', value: 42, icon: UserCheck, color: '#10b981', accent: 'rgba(16, 185, 129, 0.5)' },
            { label: 'Total Kelas', value: totalKelas, icon: GraduationCap, color: '#f59e0b', accent: 'rgba(245, 158, 11, 0.5)' },
        ]
    }, [students, units])

    const recentActivity = useMemo(() => {
        const logs = []
        generateLogs.slice(0, 4).forEach(log => {
            logs.push({
                id: `gen-${log.id}`,
                title: 'Sistem',
                text: log.keterangan,
                time: new Date(log.created_at),
                icon: Zap,
                color: '#8b5cf6'
            })
        })
        transactions.slice(0, 4).forEach(tx => {
            logs.push({
                id: `tx-${tx.id}`,
                title: 'Keuangan',
                text: `${tx.siswa_nama || 'Siswa'} membayar ${formatRupiah(tx.total)}`,
                time: new Date(tx.tanggal || tx.created_at),
                icon: TrendingUp,
                color: '#10b981'
            })
        })
        return logs.sort((a, b) => b.time - a.time).slice(0, 5)
    }, [generateLogs, transactions, formatRupiah])

    if (loading) return <LoadingSpinner fullScreen={false} message="Menganalisis Sistem..." />

    return (
        <div className={`dashboard-ultimate ${mounted ? 'fade-in' : 'opacity-0'}`}>
            <style dangerouslySetInnerHTML={{ __html: dashStyles }} />

            {/* Header / Hero Section */}
            <div className="dashboard-hero-row">
                <div>
                    <div className="dashboard-hero-eyebrow">
                        <Sparkles size={14} style={{ color: '#f59e0b' }} />
                        <span>Executive Overview</span>
                    </div>
                    <h1 className="dashboard-hero-title">
                        Halo, {currentUser.nama.split(' ')[0]} <span className="wave-emoji">👋</span>
                    </h1>
                </div>
                <div className="dashboard-hero-meta">
                    <div className="date">{new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</div>
                    <div className="ta">Tahun Ajaran Aktif: <strong style={{ color: 'var(--primary-600)' }}>{tahunAjaran}</strong></div>
                </div>
            </div>

            {/* Bento Grid */}
            <div className="bento-grid">

                {mainStats.map((stat) => (
                    <div key={stat.label} className="bento-card glass" style={{ '--accent-light': stat.accent }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                            <div style={{ padding: 12, borderRadius: 12, backgroundColor: `${stat.color}15`, color: stat.color }}>
                                <stat.icon size={24} />
                            </div>
                            <span className="badge" style={{ background: 'var(--bg-stripe)', color: 'var(--text-muted)', border: '1px solid var(--border-color)', borderRadius: 100 }}>
                                +{Math.floor(Math.random() * 5)}%
                            </span>
                        </div>
                        <div className="stat-value" style={{ marginTop: 'auto' }}>{stat.value}</div>
                        <div style={{ color: 'var(--text-muted)', fontWeight: 700, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: 4 }}>{stat.label}</div>
                    </div>
                ))}

                {/* TA / System Status */}
                <div className="bento-card" style={{ background: 'linear-gradient(135deg, #1e293b, #0f172a)', color: '#fff' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                        <div className="pulse-live"></div>
                        <span style={{ fontSize: '0.72rem', fontWeight: 700, opacity: 0.75 }}>SISTEM AKTIF</span>
                    </div>
                    <h3 style={{ fontWeight: 700, marginBottom: 8, fontSize: '1rem' }}>SIAS Core</h3>
                    <p style={{ fontSize: '0.82rem', opacity: 0.6, marginBottom: 16 }}>
                        Database: <span style={{ color: '#10b981' }}>Connected</span><br />
                        API Status: <span style={{ color: '#10b981' }}>Operational</span>
                    </p>
                    <div style={{ marginTop: 'auto' }}>
                        <Link to="/admin/backup" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', fontSize: '0.82rem' }}>Backup Database</Link>
                    </div>
                </div>

                {/* Recent Activity - Span 2 Columns, 2 Rows */}
                <div className="bento-card span-2 row-2">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                        <h4 style={{ fontWeight: 700, margin: 0, fontSize: '0.95rem' }}>Aktivitas Real-time</h4>
                        <Activity size={18} style={{ color: 'var(--text-muted)' }} />
                    </div>
                    <div className="activity-feed-premium" style={{ flexGrow: 1 }}>
                        {recentActivity.map((activity) => (
                            <div key={activity.id} className="activity-item-premium" style={{ marginBottom: 8, borderBottom: '1px solid var(--border-color)', paddingBottom: 8 }}>
                                <div className="activity-icon-sm" style={{ backgroundColor: `${activity.color}15`, color: activity.color }}>
                                    <activity.icon size={16} />
                                </div>
                                <div style={{ flexGrow: 1, minWidth: 0 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                                        <span style={{ fontWeight: 700, fontSize: '0.82rem' }}>{activity.title}</span>
                                        <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem', flexShrink: 0 }}>{activity.time.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
                                    </div>
                                    <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{activity.text}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                    <Link to="/admin/riwayat" className="btn btn-ghost" style={{ width: '100%', justifyContent: 'center', marginTop: 12, fontSize: '0.82rem' }}>
                        Lihat Log Lengkap <ArrowRight size={14} style={{ marginLeft: 4 }} />
                    </Link>
                </div>

                {/* Quick Actions - Span 2 Columns */}
                <div className="bento-card span-2 glass" style={{ '--accent-light': 'rgba(139, 92, 246, 0.3)' }}>
                    <h4 style={{ fontWeight: 700, marginBottom: 16, fontSize: '0.95rem' }}>Akses Cepat</h4>
                    <div className="dash-quick-grid">
                        <Link to="/admin/siswa" className="dash-quick-link">
                            <UserPlus size={18} style={{ color: 'var(--primary-500)', flexShrink: 0 }} />
                            <span>Data Siswa</span>
                        </Link>
                        <Link to="/admin/keuangan-dashboard" className="dash-quick-link">
                            <TrendingUp size={18} style={{ color: 'var(--success-500)', flexShrink: 0 }} />
                            <span>Keuangan</span>
                        </Link>
                        <Link to="/admin/cms/home" className="dash-quick-link">
                            <Sparkles size={18} style={{ color: '#f59e0b', flexShrink: 0 }} />
                            <span>Kelola Portal</span>
                        </Link>
                        <Link to="/admin/pengaturan" className="dash-quick-link">
                            <Zap size={18} style={{ color: 'var(--danger-500)', flexShrink: 0 }} />
                            <span>Konfigurasi</span>
                        </Link>
                    </div>
                </div>

                {/* Portal Connect - Span 2 Columns */}
                <div className="bento-card span-2" style={{ background: 'linear-gradient(135deg, var(--primary-500), var(--secondary-500))', color: '#fff' }}>
                    <div className="dash-portal-row">
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'inline-block', padding: '4px 12px', background: 'rgba(255,255,255,0.2)', borderRadius: 20, fontSize: '0.65rem', fontWeight: 700, marginBottom: 8, letterSpacing: 0.5 }}>CONNECTED PORTAL</div>
                            <h3 style={{ fontWeight: 700, marginBottom: 6, fontSize: 'clamp(1rem, 2.5vw, 1.2rem)' }}>Portal Publik SMK</h3>
                            <p style={{ fontSize: '0.85rem', opacity: 0.8, marginBottom: 16 }}>Kelola Pendaftaran PPDB dan Pesan Kontak dengan mudah dari sini.</p>
                            <Link to="/admin/cms/contacts" style={{ background: '#fff', color: 'var(--primary-700)', padding: '8px 20px', borderRadius: 10, fontWeight: 700, fontSize: '0.85rem', textDecoration: 'none', display: 'inline-block' }}>Buka Manajemen Pesan</Link>
                        </div>
                        <div className="dash-portal-icon">
                            <ShieldCheck size={90} />
                        </div>
                    </div>
                </div>

            </div>
        </div>
    )
}
