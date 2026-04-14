import { useStudent } from '../StudentApp'
import { useState } from 'react'
import * as LucideIcons from 'lucide-react'
import {
    Wallet, Receipt, ChevronDown, ChevronUp, CheckCircle,
    Clock, ShieldCheck, Sparkles, Building2, BookOpen,
    Shirt, CreditCard, Star
} from 'lucide-react'

// Helper for category-based icons
const getCategoryIcon = (name) => {
    const n = name.toLowerCase()
    if (n.includes('spp') || n.includes('bulanan')) return <Building2 size={22} />
    if (n.includes('buku') || n.includes('modul')) return <BookOpen size={22} />
    if (n.includes('seragam')) return <Shirt size={22} />
    if (n.includes('pendaftaran') || n.includes('gedung')) return <ShieldCheck size={22} />
    return <CreditCard size={22} />
}

const PaymentPulseRing = ({ percentage }) => {
    const radius = 28
    const circumference = 2 * Math.PI * radius
    const offset = circumference - (percentage / 100) * circumference

    return (
        <div className="stu-pulse-container">
            <svg className="stu-pulse-ring-svg" width="64" height="64">
                <circle className="stu-pulse-ring-bg" cx="32" cy="32" r={radius} />
                <circle
                    className="stu-pulse-ring-fill"
                    cx="32" cy="32" r={radius}
                    style={{ strokeDasharray: circumference, strokeDashoffset: offset }}
                />
            </svg>
            <span className="stu-pulse-percent">{Math.round(percentage)}%</span>
        </div>
    )
}

export default function KeuanganPage() {
    const { bills, transactions, formatRupiah } = useStudent()
    const [tab, setTab] = useState('tagihan')
    const [expandedTx, setExpandedTx] = useState(null)

    const unpaid = bills.filter(b => b.status === 'belum')
    const paid = bills.filter(b => b.status === 'lunas')
    const totalUnpaid = unpaid.reduce((s, b) => s + Number(b.nominal || 0), 0)
    const totalPaidCount = paid.length
    const totalBillsCount = bills.length
    const paidPercentage = totalBillsCount > 0 ? (totalPaidCount / totalBillsCount) * 100 : 0

    return (
        <div className="stu-page">
            {/* Decorative Background Elements */}
            <div className="stu-finance-backdrop-circles">
                <div className="stu-f-circle stu-f-circle-1" />
                <div className="stu-f-circle stu-f-circle-2" />
            </div>

            <div className="stu-section-header">
                <h2 className="stu-page-title">💳 Keuangan</h2>
                <div className="stu-live-clock">
                    <span className="stu-pulse-dot" /> LIVE
                </div>
            </div>

            {/* Premium Wallet Hero */}
            <div className="stu-wallet-hero stu-fade-up">
                <div className="stu-wallet-shine" />
                <div className="stu-wallet-content">
                    <div className="stu-wallet-info">
                        <span className="stu-wallet-label">Total Tagihan Aktif</span>
                        <span className="stu-wallet-balance">{formatRupiah(totalUnpaid)}</span>
                        <div className="stu-finance-counts" style={{ marginTop: '12px' }}>
                            <div className="stu-finance-count">
                                <Clock size={12} /> <span>{unpaid.length} Menunggu</span>
                            </div>
                            <div className="stu-finance-count success">
                                <CheckCircle size={12} /> <span>{paid.length} Lunas</span>
                            </div>
                        </div>
                    </div>
                    <PaymentPulseRing percentage={paidPercentage} />
                </div>
            </div>

            {/* Smart Tabs */}
            <div className="stu-tab-bar stu-fade-up delay-1">
                <button className={`stu-tab ${tab === 'tagihan' ? 'active' : ''}`} onClick={() => setTab('tagihan')}>
                    <Wallet size={16} /> Tagihan & Pembayaran
                </button>
                <button className={`stu-tab ${tab === 'riwayat' ? 'active' : ''}`} onClick={() => setTab('riwayat')}>
                    <Receipt size={16} /> Riwayat Transaksi
                </button>
            </div>

            {/* Content Lists */}
            <div className="stu-main-content">
                {tab === 'tagihan' && (
                    <div className="stu-list">
                        {unpaid.length === 0 ? (
                            <div className="stu-empty-mini stu-fade-up">🎉 Luar biasa! Semua tagihan Anda telah lunas.</div>
                        ) : (
                            unpaid.map((b, idx) => (
                                <div key={b.id} className={`stu-receipt-card stu-fade-up`} style={{ animationDelay: `${idx * 0.1 + 0.2}s` }}>
                                    <div className="stu-receipt-header">
                                        <div className="stu-receipt-icon" style={{ background: 'var(--stu-bg)', color: 'var(--stu-primary)' }}>
                                            {getCategoryIcon(b.kategori_nama)}
                                        </div>
                                        <div className="stu-receipt-title">
                                            <h4>{b.kategori_nama}</h4>
                                            <p>{b.bulan} {b.tahun} • {b.tahun_ajaran}</p>
                                        </div>
                                        <span className="stu-receipt-amount">{formatRupiah(b.nominal)}</span>
                                    </div>
                                    <div className="stu-receipt-footer">
                                        <span className="stu-status-pill unpaid">Menunggu Pembayaran</span>
                                        <div className="stu-xp-reward">
                                            <Sparkles size={12} /> +50 XP
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}

                        {paid.length > 0 && (
                            <>
                                <h4 className="stu-subsection-title stu-fade-up">Terakhir Dibayar</h4>
                                {paid.slice(0, 5).map((b, idx) => (
                                    <div key={b.id} className="stu-receipt-card stu-fade-up" style={{ opacity: 0.8, animationDelay: `${idx * 0.1 + 0.5}s` }}>
                                        <div className="stu-receipt-header">
                                            <div className="stu-receipt-icon" style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--stu-success)' }}>
                                                <CheckCircle size={22} />
                                            </div>
                                            <div className="stu-receipt-title">
                                                <h4>{b.kategori_nama}</h4>
                                                <p>{b.bulan} {b.tahun}</p>
                                            </div>
                                            <span className="stu-receipt-amount">{formatRupiah(b.nominal)}</span>
                                        </div>
                                        <div className="stu-receipt-footer">
                                            <span className="stu-status-pill paid">Lunas Terverifikasi</span>
                                            <Star size={14} style={{ color: 'var(--stu-warning)' }} />
                                        </div>
                                    </div>
                                ))}
                            </>
                        )}
                    </div>
                )}

                {tab === 'riwayat' && (
                    <div className="stu-list">
                        {transactions.length === 0 ? (
                            <div className="stu-empty-mini stu-fade-up">Belum ada riwayat transaksi digital.</div>
                        ) : transactions.map((tx, idx) => (
                            <div
                                key={tx.id}
                                className={`stu-tx-card stu-fade-up`}
                                style={{ animationDelay: `${idx * 0.1 + 0.2}s` }}
                                onClick={() => setExpandedTx(expandedTx === tx.id ? null : tx.id)}
                            >
                                <div className="stu-tx-card-header">
                                    <div className="stu-tx-card-info">
                                        <span className="stu-tx-invoice">INV/{tx.invoice_no || tx.invoiceNo || tx.id}</span>
                                        <span className="stu-tx-card-date">
                                            {new Date(tx.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                                        </span>
                                    </div>
                                    <div className="stu-tx-card-right">
                                        <span className="stu-tx-card-amount">{formatRupiah(tx.total)}</span>
                                        {expandedTx === tx.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                    </div>
                                </div>
                                {expandedTx === tx.id && (
                                    <div className="stu-tx-detail">
                                        <div className="stu-tx-detail-row">
                                            <span>Metode Pembayaran</span>
                                            <span style={{ fontWeight: 700 }}>{tx.metode || 'Transfer Bank'}</span>
                                        </div>
                                        <div className="stu-tx-detail-row">
                                            <span>Total Pembayaran</span>
                                            <span>{formatRupiah(tx.amount_paid || tx.amountPaid)}</span>
                                        </div>
                                        <div className="stu-tx-detail-row">
                                            <span>Status Transaksi</span>
                                            <span className={`stu-badge-sm ${tx.status === 'void' ? 'danger' : 'success'}`}>
                                                {tx.status === 'void' ? 'Dibatalkan' : 'Berhasil'}
                                            </span>
                                        </div>
                                        <button className="stu-btn-action-sm secondary" style={{ width: '100%', marginTop: '12px', justifyContent: 'center' }}>
                                            <LucideIcons.Download size={14} /> Unduh Struk Digital
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
