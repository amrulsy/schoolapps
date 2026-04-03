import { useState, useEffect } from 'react'
import { QRCodeCanvas } from 'qrcode.react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { useStudent } from '../StudentApp'
import { useNavigate } from 'react-router-dom'
import LoadingSpinner from '../../components/LoadingSpinner'
import * as LucideIcons from 'lucide-react'
import {
    ChevronRight, Wallet, Star, QrCode, X, School, ClipboardCheck
} from 'lucide-react'

export default function StudentDashboard() {
    const { student, bills, transactions, announcements, menuItems, attendanceSummary, attendanceDocs, bkData, nilaiData, xpStats, formatRupiah, loading } = useStudent()
    const navigate = useNavigate()
    const [showQR, setShowQR] = useState(false)
    const [selectedDay, setSelectedDay] = useState(null)

    const unpaidBills = bills.filter(b => b.status === 'belum')
    const totalUnpaid = unpaidBills.reduce((s, b) => s + Number(b.nominal || 0), 0)
    const recentTx = transactions.slice(0, 3)
    const recentAnnouncements = announcements.slice(0, 3)

    // Generate Heatmap Data (Last 30 days) - Fixed for API keys & Timezones
    const heatmapDays = [...Array(30)].map((_, i) => {
        const targetDate = new Date()
        targetDate.setDate(targetDate.getDate() - (29 - i))
        // Local YYYY-MM-DD format for matching
        const dateStr = targetDate.toLocaleDateString('en-CA') // YYYY-MM-DD
        
        const record = attendanceDocs?.find(doc => {
            const docDateVal = doc.date || doc.tanggal
            if (!docDateVal) return false
            const docDateStr = new Date(docDateVal).toLocaleDateString('en-CA')
            return docDateStr === dateStr
        })
        
        // Final tooltip & status return
        const formattedDate = targetDate.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' })
        const statusLabel = record ? (record.status.charAt(0).toUpperCase() + record.status.slice(1)) : 'Tidak ada data'
        const timeLabel = record?.time || record?.check_in || ''
        const tooltip = `${formattedDate}: ${statusLabel} ${timeLabel ? `(${timeLabel})` : ''}`
        
        return { 
            date: dateStr, 
            displayDate: formattedDate,
            fullDate: targetDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
            status: record?.status?.toLowerCase() || 'none', 
            record,
            tooltip 
        }
    })

    // Academic Pulse Data
    const pulseData = (nilaiData?.subjects?.muatanNasional || []).slice(0, 6).map(s => ({
        name: s.nama_pelajaran?.substring(0, 4),
        score: s.nilai_akhir || 0
    }))

    if (loading) {
        return <DashboardSkeleton />
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
                            <QRCodeCanvas 
                                value={JSON.stringify({ n: student?.nisn, i: student?.id, t: Date.now() })}
                                size={180}
                                level="H"
                                includeMargin={true}
                                imageSettings={{
                                    src: "/logo-pprq.png", // Atau logo sekolah jika ada
                                    x: undefined,
                                    y: undefined,
                                    height: 30,
                                    width: 30,
                                    excavate: true,
                                }}
                            />
                        </div>
                        <div className="stu-qr-student-info">
                            <strong>{student?.nama || 'Nama Siswa'}</strong>
                            <span>NISN: {student?.nisn || '-'}</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Attendance Detail Bottom Sheet */}
            {selectedDay && (
                <>
                    <div className="stu-bs-overlay" onClick={() => setSelectedDay(null)} />
                    <div className="stu-bottom-sheet">
                        <div className="stu-bs-handle" />
                        <div className="stu-bs-header">
                            <div>
                                <h3>Detail Presensi</h3>
                                <span className="stu-bs-date">{selectedDay.fullDate}</span>
                            </div>
                            <button className="stu-bs-close" onClick={() => setSelectedDay(null)}>
                                <X size={20} />
                            </button>
                        </div>

                        <div className={`stu-detail-status-banner ${selectedDay.status}`}>
                            <ClipboardCheck size={24} />
                            <div style={{ textAlign: 'center' }}>
                                <strong style={{ display: 'block', fontSize: '1.2rem', textTransform: 'capitalize' }}>
                                    {selectedDay.status === 'none' ? 'Tidak Ada Data' : selectedDay.status}
                                </strong>
                                <span style={{ fontSize: '0.75rem', opacity: 0.8 }}>
                                    Status kehadiran pada tanggal ini
                                </span>
                            </div>
                        </div>

                        <div className="stu-detail-grid">
                            <div className="stu-detail-card primary">
                                <div className="stu-detail-card-label">
                                    <LucideIcons.LogIn size={14} /> Jam Masuk
                                </div>
                                <div className="stu-detail-card-value">
                                    {(() => {
                                        const rawTime = selectedDay.record?.jam_masuk || selectedDay.record?.time || selectedDay.record?.check_in
                                        if (!rawTime) return '--:--'
                                        
                                        if (rawTime instanceof Date) {
                                            return rawTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
                                        }

                                        const time = String(rawTime)
                                        if (time.includes(' ')) {
                                            const timePart = time.split(' ')[1]
                                            return timePart.includes(':') ? timePart.substring(0, 5) : '--:--'
                                        }
                                        if (time.includes(':') && !time.includes('-')) {
                                            return time.substring(0, 5)
                                        }
                                        if (time.includes('T')) {
                                            const timePart = time.split('T')[1]
                                            return timePart.includes(':') ? timePart.substring(0, 5) : '--:--'
                                        }
                                        
                                        return '--:--'
                                    })()}
                                </div>
                            </div>
                            <div className="stu-detail-card">
                                <div className="stu-detail-card-label">
                                    <LucideIcons.LogOut size={14} /> Jam Pulang
                                </div>
                                <div className="stu-detail-card-value">
                                    {(() => {
                                        const rawTime = selectedDay.record?.jam_pulang || selectedDay.record?.check_out || selectedDay.record?.jam_pulang
                                        if (!rawTime) return '--:--'
                                        
                                        if (rawTime instanceof Date) {
                                            return rawTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
                                        }

                                        const time = String(rawTime)
                                        if (time.includes(' ')) {
                                            const timePart = time.split(' ')[1]
                                            return timePart.includes(':') ? timePart.substring(0, 5) : '--:--'
                                        }
                                        if (time.includes(':') && !time.includes('-')) {
                                            return time.substring(0, 5)
                                        }
                                        if (time.includes('T')) {
                                            const timePart = time.split('T')[1]
                                            return timePart.includes(':') ? timePart.substring(0, 5) : '--:--'
                                        }
                                        
                                        return '--:--'
                                    })()}
                                </div>
                            </div>
                        </div>

                        {selectedDay.record?.keterangan && (
                            <div className="stu-detail-note-box">
                                <h4>Catatan / Keterangan</h4>
                                <p className="stu-detail-note-text">{selectedDay.record.keterangan}</p>
                            </div>
                        )}

                        <button className="stu-btn-close-full" onClick={() => setSelectedDay(null)}>
                            <LucideIcons.X size={18} /> Tutup Detail
                        </button>
                    </div>
                </>
            )}

            {/* Virtual ID Card Hero */}
            <div className="stu-id-card stu-fade-up" onClick={() => setShowQR(true)}>
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
                        <div className="stu-id-name-row">
                            <h2>{student?.nama || 'Nama Siswa'}</h2>
                            <span className="stu-lvl-badge">Lvl {xpStats?.level || 1}</span>
                        </div>
                        <p>{student?.kelas || 'Kelas Siswa'}</p>
                        <div className="stu-xp-bar-container">
                            <div className="stu-xp-progress" style={{ width: `${xpStats?.progress || 0}%` }}></div>
                        </div>
                    </div>
                </div>
                <div className="stu-id-bottom">
                    <div className="stu-id-field">
                        <span>NISN</span>
                        <strong>{student?.nisn || '-'}</strong>
                    </div>
                    <div className="stu-id-field text-right">
                        <span>Status</span>
                        <strong className={`stu-status-badge ${student?.status?.toLowerCase() || 'aktif'}`}>
                            {student?.status?.toUpperCase() || 'AKTIF'}
                        </strong>
                    </div>
                </div>
            </div>

            {/* Quick Summary Row */}
            <div className="stu-summary-row stu-fade-up delay-1">
                <div className="stu-summary-box" onClick={() => navigate('/siswa-portal/presensi')}>
                    <div className="stu-summary-icon" style={{ color: 'var(--success-500)', background: 'var(--success-50)' }}><ClipboardCheck size={20} /></div>
                    <div className="stu-summary-text">
                        <span>Hadir Bulan Ini</span>
                        <strong>{attendanceSummary?.presentCount || 0} Hari</strong>
                    </div>
                </div>
                <div className="stu-summary-box" onClick={() => navigate('/siswa-portal/bk')}>
                    <div className="stu-summary-icon" style={{ 
                        color: (bkData?.poin?.netPoin || 0) >= 75 ? 'var(--success-500)' : (bkData?.poin?.netPoin || 0) >= 50 ? 'var(--warning-500)' : 'var(--danger-500)', 
                        background: (bkData?.poin?.netPoin || 0) >= 75 ? 'var(--success-50)' : (bkData?.poin?.netPoin || 0) >= 50 ? 'var(--warning-50)' : 'var(--danger-50)' 
                    }}>
                        <Star size={20} />
                    </div>
                    <div className="stu-summary-text">
                        <span>Poin Perilaku</span>
                        <strong>{bkData?.poin?.netPoin || 0} Poin</strong>
                    </div>
                </div>
            </div>

            {/* Unpaid Bills Notification Banner */}
            {unpaidBills.length > 0 && (
                <div className="stu-billing-alert stu-fade-up delay-1" onClick={() => navigate('/siswa-portal/keuangan')}>
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
            <div className="stu-section stu-fade-up delay-2">
                <div className="stu-section-header">
                    <h3 className="stu-section-title">Menu Utama</h3>
                </div>
                <div className="stu-menu-grid">
                    {(menuItems && menuItems.length > 0 ? menuItems : [
                        { label: 'Presensi', icon: 'ClipboardCheck', bg: 'rgba(16, 185, 129, 0.1)', color: '#10B981', path: '/siswa-portal/presensi' },
                        { label: 'Nilai Rapor', icon: 'ScrollText', bg: 'rgba(99, 102, 241, 0.1)', color: '#6366F1', path: '/siswa-portal/nilai' },
                        { label: 'Keuangan', icon: 'Wallet', bg: 'rgba(245, 158, 11, 0.1)', color: '#F59E0B', path: '/siswa-portal/keuangan' },
                        { label: 'Tabungan', icon: 'Coins', bg: 'rgba(20, 184, 166, 0.1)', color: '#14B8A6', path: '/siswa-portal/tabungan' },
                        { label: 'BK & Poin', icon: 'ShieldAlert', bg: 'rgba(239, 68, 68, 0.1)', color: '#EF4444', path: '/siswa-portal/bk' },
                        { label: 'Pesan', icon: 'MessageCircle', bg: 'rgba(139, 92, 246, 0.1)', color: '#8B5CF6', path: '/siswa-portal/pesan' },
                        { label: 'Info', icon: 'Info', bg: 'rgba(14, 165, 233, 0.1)', color: '#0EA5E9', path: '/siswa-portal/pengumuman' },
                        { label: 'Profil', icon: 'User', bg: 'rgba(100, 116, 139, 0.1)', color: '#64748B', path: '/siswa-portal/profil' }
                    ]).map(item => {
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

            {/* Attendance Heatmap & Quick Actions */}
            <div className="stu-section stu-fade-up delay-3">
                <div className="stu-section-header">
                    <div className="stu-title-stack">
                        <h3 className="stu-section-title">Aktivitas Presensi (30 Hari)</h3>
                        <div className="stu-live-clock">
                            <span className="stu-pulse-dot" />
                            {new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                        </div>
                    </div>
                    <div className="stu-action-group">
                        <button className="stu-btn-action-sm" onClick={() => navigate('/siswa-portal/presensi')}>
                            <LucideIcons.Plus size={14} /> Izin
                        </button>
                        <button className="stu-btn-action-sm secondary" onClick={() => navigate('/siswa-portal/presensi')}>
                            Detail
                        </button>
                    </div>
                </div>
                <div className="stu-heatmap-card">
                    <div className="stu-heatmap-grid">
                        {heatmapDays.map((day, i) => {
                            const dayNum = day.date.split('-')[2]
                            const checkInTime = day.tooltip.includes('(') ? day.tooltip.split('(')[1].replace(')', '') : ''
                            
                            return (
                                <div key={i} className={`stu-heatmap-cell ${day.status}`} title={day.tooltip} onClick={() => setSelectedDay(day)}>
                                    <span className="stu-cell-date">{dayNum}</span>
                                    {checkInTime && <span className="stu-cell-time">{checkInTime}</span>}
                                </div>
                            )
                        })}
                    </div>
                    <div className="stu-heatmap-legend">
                        <div className="stu-legend-item"><div className="stu-heatmap-cell hadir" /><span>Hadir</span></div>
                        <div className="stu-legend-item"><div className="stu-heatmap-cell sakit" /><span>Sakit</span></div>
                        <div className="stu-legend-item"><div className="stu-heatmap-cell izin" /><span>Izin</span></div>
                        <div className="stu-legend-item"><div className="stu-heatmap-cell alfa" /><span>Alfa</span></div>
                    </div>
                </div>
            </div>

            {/* Academic Pulse Chart */}
            <div className="stu-section stu-fade-up delay-4">
                <div className="stu-section-header">
                    <h3 className="stu-section-title">Performa Akademik</h3>
                    <button className="stu-see-all" onClick={() => navigate('/siswa-portal/nilai')}>Rapor</button>
                </div>
                <div className="stu-pulse-card">
                    <div style={{ width: '100%', height: 120 }}>
                        <ResponsiveContainer>
                            <AreaChart data={pulseData}>
                                <defs>
                                    <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="var(--stu-primary)" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="var(--stu-primary)" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <Area type="monotone" dataKey="score" stroke="var(--stu-primary)" fillOpacity={1} fill="url(#colorScore)" strokeWidth={3} dot={{ fill: 'var(--stu-primary)', strokeWidth: 2, r: 4, stroke: '#fff' }} />
                                <Tooltip 
                                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', fontSize: '11px', background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(8px)' }} 
                                    labelStyle={{ fontWeight: 'bold', color: 'var(--stu-primary)' }}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="stu-pulse-footer">
                        <span>Tren Nilai 6 Mata Pelajaran Terakhir</span>
                    </div>
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
                                    <span className={`stu-tx-status ${tx.status || 'success'}`}>
                                        {tx.status === 'pending' ? 'Diproses' : 'Berhasil'}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}

function DashboardSkeleton() {
    return (
        <div className="stu-dashboard" style={{ padding: '20px' }}>
            <div className="stu-skeleton stu-skeleton-card" style={{ height: '180px', borderRadius: '24px' }} />
            <div className="stu-summary-row" style={{ marginTop: '20px' }}>
                <div className="stu-skeleton stu-skeleton-card" style={{ flex: 1, height: '80px' }} />
                <div className="stu-skeleton stu-skeleton-card" style={{ flex: 1, height: '80px' }} />
            </div>
            <div className="stu-section" style={{ marginTop: '24px' }}>
                <div className="stu-skeleton stu-skeleton-title" />
                <div className="stu-menu-grid">
                    {[1,2,3,4,5,6,7,8].map(i => (
                        <div key={i} className="stu-skeleton" style={{ height: '80px', borderRadius: '16px' }} />
                    ))}
                </div>
            </div>
        </div>
    )
}
