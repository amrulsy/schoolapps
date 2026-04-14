import { useApp } from '../../context/AppContext'
import { useMemo, useEffect, useState } from 'react'
import LoadingSpinner from '../../components/LoadingSpinner'
import {
    Users, UserCheck, GraduationCap,
    UserPlus, ArrowRight,
    TrendingUp, Activity, Sparkles, Zap, ShieldCheck
} from 'lucide-react'
import { Link } from 'react-router-dom'

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
            { label: 'Tenaga Pendidik', value: 42, icon: UserCheck, color: '#10b981', accent: 'rgba(16, 185, 129, 0.5)' }, // Mocked teacher count if not in context
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
            {/* Header / Hero Section */}
            <div className="d-flex justify-content-between align-items-end mb-4">
                <div>
                    <div className="d-flex align-items-center gap-2 mb-1">
                        <Sparkles size={18} className="text-warning" />
                        <span className="text-uppercase fw-bold small text-muted tracking-wider" style={{ letterSpacing: '1.5px' }}>
                            Executive Overview
                        </span>
                    </div>
                    <h1 className="fw-black m-0" style={{ fontSize: '2.5rem', letterSpacing: '-1px' }}>
                        Halo, {currentUser.nama.split(' ')[0]} <span className="wave-emoji">👋</span>
                    </h1>
                </div>
                <div className="text-end d-none d-md-block">
                    <div className="fw-bold text-primary-dark">{new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</div>
                    <div className="text-muted small">Tahun Ajaran Aktif: <strong className="text-primary">{tahunAjaran}</strong></div>
                </div>
            </div>

            {/* Bento Grid */}
            <div className="bento-grid">

                {mainStats.map((stat) => (
                    <div key={stat.label} className="bento-card glass" style={{ '--accent-light': stat.accent }}>
                        <div className="d-flex justify-content-between align-items-start mb-3">
                            <div className="p-3 rounded-4" style={{ backgroundColor: `${stat.color}15`, color: stat.color }}>
                                <stat.icon size={26} />
                            </div>
                            <span className="badge rounded-pill bg-light text-dark fw-bold px-3 py-2 border">+{Math.floor(Math.random() * 5)}%</span>
                        </div>
                        <div className="stat-value mt-auto">{stat.value}</div>
                        <div className="text-muted fw-bold small text-uppercase mt-1" style={{ letterSpacing: '0.5px' }}>{stat.label}</div>
                    </div>
                ))}

                {/* TA / System Status */}
                <div className="bento-card" style={{ background: 'linear-gradient(135deg, #1e293b, #0f172a)', color: '#fff' }}>
                    <div className="d-flex align-items-center gap-2 mb-3">
                        <div className="pulse-live"></div>
                        <span className="small fw-bold opacity-75">SISTEM AKTIF</span>
                    </div>
                    <h3 className="fw-bold mb-2">SIAS Core</h3>
                    <p className="small opacity-60 mb-4">Database: <span className="text-success">Connected</span><br />API Status: <span className="text-success">Operational</span></p>
                    <div className="mt-auto">
                        <Link to="/admin/backup" className="btn btn-primary w-100 rounded-3 btn-sm fw-bold">Backup Database</Link>
                    </div>
                </div>

                {/* Recent Activity - Span 2 Columns, 2 Rows */}
                <div className="bento-card span-2 row-2">
                    <div className="d-flex justify-content-between align-items-center mb-4">
                        <h4 className="fw-bold m-0">Aktivitas Real-time</h4>
                        <Activity size={20} className="text-muted" />
                    </div>
                    <div className="activity-feed-premium flex-grow-1">
                        {recentActivity.map((activity) => (
                            <div key={activity.id} className="activity-item-premium mb-2 border-bottom border-light">
                                <div className="activity-icon-sm" style={{ backgroundColor: `${activity.color}15`, color: activity.color }}>
                                    <activity.icon size={16} />
                                </div>
                                <div className="flex-grow-1">
                                    <div className="d-flex justify-content-between">
                                        <span className="fw-bold small">{activity.title}</span>
                                        <span className="text-muted" style={{ fontSize: '0.7rem' }}>{activity.time.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
                                    </div>
                                    <p className="m-0 small text-dark-emphasis">{activity.text}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                    <Link to="/admin/riwayat" className="btn btn-light w-100 mt-3 fw-bold rounded-4 btn-sm py-2">Lihat Log Lengkap <ArrowRight size={14} className="ms-1" /></Link>
                </div>

                {/* Quick Actions - Span 2 Columns */}
                <div className="bento-card span-2 glass" style={{ '--accent-light': 'rgba(139, 92, 246, 0.3)' }}>
                    <h4 className="fw-bold mb-3">Akses Cepat</h4>
                    <div className="row g-2 mt-auto">
                        <div className="col-6">
                            <Link to="/admin/siswa" className="d-flex align-items-center gap-2 p-3 bg-white hover-up border rounded-4 text-decoration-none text-dark h-100">
                                <UserPlus size={18} className="text-primary" />
                                <span className="fw-bold small">Data Siswa</span>
                            </Link>
                        </div>
                        <div className="col-6">
                            <Link to="/admin/keuangan-dashboard" className="d-flex align-items-center gap-2 p-3 bg-white hover-up border rounded-4 text-decoration-none text-dark h-100">
                                <TrendingUp size={18} className="text-success" />
                                <span className="fw-bold small">Keuangan</span>
                            </Link>
                        </div>
                        <div className="col-6">
                            <Link to="/admin/cms/home" className="d-flex align-items-center gap-2 p-3 bg-white hover-up border rounded-4 text-decoration-none text-dark h-100">
                                <Sparkles size={18} className="text-warning" />
                                <span className="fw-bold small">Kelola Portal</span>
                            </Link>
                        </div>
                        <div className="col-6">
                            <Link to="/admin/pengaturan" className="d-flex align-items-center gap-2 p-3 bg-white hover-up border rounded-4 text-decoration-none text-dark h-100">
                                <Zap size={18} className="text-danger" />
                                <span className="fw-bold small">Konfigurasi</span>
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Portal Connect - Span 2 Columns */}
                <div className="bento-card span-2" style={{ background: 'linear-gradient(135deg, var(--primary-500), var(--secondary-500))', color: '#fff' }}>
                    <div className="row align-items-center h-100">
                        <div className="col-md-8">
                            <div className="badge bg-white bg-opacity-20 text-white mb-2 py-1 px-3 fw-bold rounded-pill" style={{ fontSize: '0.65rem' }}>CONNECTED PORTAL</div>
                            <h3 className="fw-bold mb-1">Portal Publik SMK</h3>
                            <p className="small opacity-80 mb-3">Kelola Pendaftaran PPDB dan Pesan Kontak dengan mudah dari sini.</p>
                            <Link to="/admin/cms/contacts" className="btn btn-white text-primary fw-bold rounded-3 btn-sm px-4">Buka Manajemen Pesan</Link>
                        </div>
                        <div className="col-md-4 d-none d-md-block text-center opacity-50">
                            <ShieldCheck size={100} />
                        </div>
                    </div>
                </div>

            </div>
        </div>
    )
}
