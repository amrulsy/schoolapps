import { useStudent } from '../StudentApp'
import { useNavigate } from 'react-router-dom'
import LoadingSpinner from '../../components/LoadingSpinner'
import {
    User, BookOpen, ClipboardCheck, Award, Wallet, PiggyBank,
    Megaphone, Shield, MessageCircle, HelpCircle, ChevronRight, Bell
} from 'lucide-react'

const menuItems = [
    { icon: ClipboardCheck, label: 'Presensi', desc: 'Kehadiran harian', to: '/siswa-portal/presensi', color: '#3B82F6' },
    { icon: Award, label: 'Nilai & e-Rapor', desc: 'Rapor digital', to: '/siswa-portal/nilai', color: '#8B5CF6' },
    { icon: Wallet, label: 'Tagihan', desc: 'Status pembayaran', to: '/siswa-portal/keuangan', color: '#F59E0B' },
    { icon: PiggyBank, label: 'Tabungan', desc: 'Saldo tabungan', to: '/siswa-portal/tabungan', color: '#10B981' },
    { icon: Megaphone, label: 'Pengumuman', desc: 'Mading digital', to: '/siswa-portal/pengumuman', color: '#EC4899' },
    { icon: Shield, label: 'Bimbingan (BK)', desc: 'Tata tertib & poin', to: '/siswa-portal/bk', color: '#EF4444' },
    { icon: MessageCircle, label: 'Pesan', desc: 'Chat sekolah', to: '/siswa-portal/pesan', color: '#06B6D4' },
    { icon: User, label: 'Profil Saya', desc: 'Data lengkap', to: '/siswa-portal/profil', color: '#6366F1' },
]

export default function StudentDashboard() {
    const { student, bills, transactions, announcements, formatRupiah, loading } = useStudent()
    const navigate = useNavigate()

    const unpaidBills = bills.filter(b => b.status === 'belum')
    const totalUnpaid = unpaidBills.reduce((s, b) => s + Number(b.nominal || 0), 0)
    const recentTx = transactions.slice(0, 3)
    const recentAnnouncements = announcements.slice(0, 3)

    if (loading) {
        return <LoadingSpinner fullScreen={false} message="Memuat Dashboard Siswa..." />
    }

    return (
        <div className="stu-dashboard">
            {/* Quick Stats */}
            <div className="stu-quick-stats">
                <div className="stu-stat-card stu-stat-warning" onClick={() => navigate('/siswa-portal/keuangan')}>
                    <div className="stu-stat-icon"><Wallet size={20} /></div>
                    <div className="stu-stat-content">
                        <span className="stu-stat-label">Tagihan Belum Lunas</span>
                        <span className="stu-stat-value">{formatRupiah(totalUnpaid)}</span>
                        <span className="stu-stat-sub">{unpaidBills.length} tagihan</span>
                    </div>
                </div>
                <div className="stu-stat-card stu-stat-success" onClick={() => navigate('/siswa-portal/presensi')}>
                    <div className="stu-stat-icon"><ClipboardCheck size={20} /></div>
                    <div className="stu-stat-content">
                        <span className="stu-stat-label">Presensi Bulan Ini</span>
                        <span className="stu-stat-value">95%</span>
                        <span className="stu-stat-sub">19/20 hari</span>
                    </div>
                </div>
            </div>

            {/* Module Menu Grid */}
            <div className="stu-section">
                <h3 className="stu-section-title">Menu Utama</h3>
                <div className="stu-menu-grid">
                    {menuItems.map(item => (
                        <button key={item.to} className="stu-menu-item" onClick={() => navigate(item.to)}>
                            <div className="stu-menu-icon" style={{ background: `${item.color}15`, color: item.color }}>
                                <item.icon size={22} strokeWidth={1.8} />
                            </div>
                            <span className="stu-menu-label">{item.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Recent Announcements */}
            {recentAnnouncements.length > 0 && (
                <div className="stu-section">
                    <div className="stu-section-header">
                        <h3 className="stu-section-title">📢 Pengumuman Terbaru</h3>
                        <button className="stu-see-all" onClick={() => navigate('/siswa-portal/pengumuman')}>Lihat semua</button>
                    </div>
                    <div className="stu-announcement-list">
                        {recentAnnouncements.map((a, i) => (
                            <div key={i} className="stu-announcement-card">
                                <div className="stu-announcement-badge">Baru</div>
                                <h4>{a.title || 'Pengumuman'}</h4>
                                <p>{a.excerpt || a.content?.substring(0, 80) || 'Klik untuk membaca selengkapnya'}</p>
                                <span className="stu-announcement-date">
                                    {a.created_at ? new Date(a.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) : '-'}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Recent Transactions */}
            {recentTx.length > 0 && (
                <div className="stu-section">
                    <div className="stu-section-header">
                        <h3 className="stu-section-title">💳 Transaksi Terakhir</h3>
                        <button className="stu-see-all" onClick={() => navigate('/siswa-portal/keuangan')}>Lihat semua</button>
                    </div>
                    <div className="stu-tx-list">
                        {recentTx.map(tx => (
                            <div key={tx.id} className="stu-tx-item">
                                <div className="stu-tx-icon">💰</div>
                                <div className="stu-tx-info">
                                    <span className="stu-tx-name">{tx.invoice_no || tx.invoiceNo}</span>
                                    <span className="stu-tx-date">
                                        {new Date(tx.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                                    </span>
                                </div>
                                <span className="stu-tx-amount">{formatRupiah(tx.total)}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}
