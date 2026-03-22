import { useState } from 'react'
import { useStudent } from '../StudentApp'
import { useNavigate } from 'react-router-dom'
import LoadingSpinner from '../../components/LoadingSpinner'
import * as LucideIcons from 'lucide-react'
import {
    ChevronRight, Wallet, Star, QrCode, X, School, ClipboardCheck
} from 'lucide-react'

export default function StudentDashboard() {
    const { student, bills, transactions, announcements, menuItems, attendanceSummary, formatRupiah, loading } = useStudent()
    const navigate = useNavigate()
    const [showQR, setShowQR] = useState(false)

    const unpaidBills = bills.filter(b => b.status === 'belum')
    const totalUnpaid = unpaidBills.reduce((s, b) => s + Number(b.nominal || 0), 0)
    const recentTx = transactions.slice(0, 3)
    const recentAnnouncements = announcements.slice(0, 3)

    if (loading) {
        return <LoadingSpinner fullScreen={false} message="Menyiapkan Dasbor..." />
    }

    return (
        <div className="stu-dashboard">
            {/* Modal QR Code Fullscreen */}
            {showQR && (
                <div className="stu-qr-modal" onClick={() => setShowQR(false)}>
                    <div className="stu-qr-content" onClick={e => e.stopPropagation()}>
                        <button className="stu-qr-close" onClick={() => setShowQR(false)}>
                            <X size={24} />
                        </button>
                        <h3>Kartu Siswa Digital</h3>
                        <p>Tunjukkan QR ini ke Admin / Satpam</p>
                        <div className="stu-qr-box">
                            {/* Placeholder Icon (Akan diganti React-QR-Code sungguhan nanti) */}
                            <QrCode size={180} strokeWidth={1} color="var(--stu-text)" />
                        </div>
                        <div className="stu-qr-student-info">
                            <strong>{student?.nama || 'Nama Siswa'}</strong>
                            <span>NISN: {student?.nisn || '-'}</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Virtual ID Card Hero */}
            <div className="stu-id-card" onClick={() => setShowQR(true)}>
                <div className="stu-id-bg-patterns"></div>
                <div className="stu-id-top">
                    <div className="stu-id-school-info">
                        <School size={20} color="var(--primary-200)" />
                        <span>SMK PPRQ</span>
                    </div>
                    <div className="stu-id-tap-hint">
                        <QrCode size={14} /> TAP
                    </div>
                </div>
                <div className="stu-id-middle">
                    <div className="stu-id-avatar">
                        {student?.nama?.charAt(0) || 'S'}
                    </div>
                    <div className="stu-id-details">
                        <h2>{student?.nama || 'Nama Siswa'}</h2>
                        <p>{student?.kelas || 'Kelas Siswa'}</p>
                    </div>
                </div>
                <div className="stu-id-bottom">
                    <div className="stu-id-field">
                        <span>NISN</span>
                        <strong>{student?.nisn || '-'}</strong>
                    </div>
                    <div className="stu-id-field text-right">
                        <span>Status</span>
                        <strong className="stu-status-aktif">AKTIF</strong>
                    </div>
                </div>
            </div>

            {/* Quick Summary Row */}
            <div className="stu-summary-row">
                <div className="stu-summary-box" onClick={() => navigate('/siswa-portal/presensi')}>
                    <div className="stu-summary-icon" style={{ color: 'var(--success-500)', background: 'var(--success-50)' }}><ClipboardCheck size={20} /></div>
                    <div className="stu-summary-text">
                        <span>Hadir Bulan Ini</span>
                        <strong>{attendanceSummary?.presentCount || 0} Hari</strong>
                    </div>
                </div>
                <div className="stu-summary-box" onClick={() => navigate('/siswa-portal/bk')}>
                    <div className="stu-summary-icon" style={{ color: 'var(--warning-500)', background: 'var(--warning-50)' }}><Star size={20} /></div>
                    <div className="stu-summary-text">
                        <span>Poin Perilaku</span>
                        <strong>100 Poin</strong>
                    </div>
                </div>
            </div>

            {/* Unpaid Bills Notification Banner (Moved from Top) */}
            {unpaidBills.length > 0 && (
                <div className="stu-billing-alert" onClick={() => navigate('/siswa-portal/keuangan')}>
                    <div className="stu-billing-alert-icon">
                        <Wallet size={20} />
                    </div>
                    <div className="stu-billing-alert-text">
                        <strong>Anda memiliki {unpaidBills.length} Tagihan Aktif</strong>
                        <span>Total: {formatRupiah(totalUnpaid)}</span>
                    </div>
                    <ChevronRight size={18} className="stu-billing-alert-arrow" />
                </div>
            )}

            {/* Application Menu Grid */}
            <div className="stu-section">
                <div className="stu-section-header">
                    <h3 className="stu-section-title">Menu Utama</h3>
                </div>
                <div className="stu-menu-grid">
                    {menuItems.map(item => {
                        const IconComponent = LucideIcons[item.icon] || LucideIcons.Circle
                        return (
                            <button key={item.path || item.to} className="stu-menu-item modern" onClick={() => navigate(item.path || item.to)}>
                                <div className="stu-menu-icon" style={{ background: item.bg, color: item.color }}>
                                    <IconComponent size={26} strokeWidth={1.8} />
                                </div>
                                <span className="stu-menu-label">{item.label}</span>
                            </button>
                        )
                    })}
                </div>
            </div>

            {/* Recent Announcements */}
            {recentAnnouncements.length > 0 && (
                <div className="stu-section">
                    <div className="stu-section-header">
                        <h3 className="stu-section-title">Pengumuman Terbaru</h3>
                        <button className="stu-see-all" onClick={() => navigate('/siswa-portal/pengumuman')}>Lihat Semua</button>
                    </div>
                    <div className="stu-announcement-slider">
                        {recentAnnouncements.map((a, i) => (
                            <div key={i} className="stu-announcement-card modern" onClick={() => navigate('/siswa-portal/pengumuman')}>
                                <div className="stu-announcement-content">
                                    <div className="stu-announcement-header">
                                        <span className="stu-badge-new">INFO</span>
                                        <span className="stu-announcement-date">
                                            {a.created_at ? new Date(a.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) : '-'}
                                        </span>
                                    </div>
                                    <h4 className="line-clamp-2">{a.title || 'Pengumuman Sekolah'}</h4>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Recent Transactions */}
            {recentTx.length > 0 && (
                <div className="stu-section" style={{ paddingBottom: '20px' }}>
                    <div className="stu-section-header">
                        <h3 className="stu-section-title">Riwayat Transaksi</h3>
                        <button className="stu-see-all" onClick={() => navigate('/siswa-portal/keuangan')}>Detail</button>
                    </div>
                    <div className="stu-tx-list modern">
                        {recentTx.map(tx => (
                            <div key={tx.id} className="stu-tx-item modern" onClick={() => navigate('/siswa-portal/keuangan')}>
                                <div className="stu-tx-icon-bg">
                                    <Wallet size={18} color="var(--success-600)" />
                                </div>
                                <div className="stu-tx-info">
                                    <span className="stu-tx-name">{tx.invoice_no || tx.invoiceNo || 'Pembayaran SPP'}</span>
                                    <span className="stu-tx-date">
                                        {new Date(tx.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) || '-'}
                                    </span>
                                </div>
                                <div className="stu-tx-right">
                                    <span className="stu-tx-amount">{formatRupiah(tx.total)}</span>
                                    <span className="stu-tx-status success">Berhasil</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}
