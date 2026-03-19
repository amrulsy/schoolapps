import { useStudent } from '../StudentApp'
import { useState } from 'react'
import { Wallet, Receipt, ChevronDown, ChevronUp, CheckCircle, Clock } from 'lucide-react'

export default function KeuanganPage() {
    const { bills, transactions, formatRupiah } = useStudent()
    const [tab, setTab] = useState('tagihan')
    const [expandedTx, setExpandedTx] = useState(null)

    const unpaid = bills.filter(b => b.status === 'belum')
    const paid = bills.filter(b => b.status === 'lunas')
    const totalUnpaid = unpaid.reduce((s, b) => s + Number(b.nominal || 0), 0)

    return (
        <div className="stu-page">
            <h2 className="stu-page-title">💳 Keuangan</h2>

            {/* Summary Card */}
            <div className="stu-finance-summary">
                <div className="stu-finance-amount">
                    <span className="stu-finance-label">Total Tagihan Belum Lunas</span>
                    <span className="stu-finance-value">{formatRupiah(totalUnpaid)}</span>
                </div>
                <div className="stu-finance-counts">
                    <div className="stu-finance-count">
                        <Clock size={14} />
                        <span>{unpaid.length} belum lunas</span>
                    </div>
                    <div className="stu-finance-count success">
                        <CheckCircle size={14} />
                        <span>{paid.length} lunas</span>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="stu-tab-bar">
                <button className={`stu-tab ${tab === 'tagihan' ? 'active' : ''}`} onClick={() => setTab('tagihan')}>
                    <Wallet size={16} /> Tagihan ({unpaid.length})
                </button>
                <button className={`stu-tab ${tab === 'riwayat' ? 'active' : ''}`} onClick={() => setTab('riwayat')}>
                    <Receipt size={16} /> Riwayat ({transactions.length})
                </button>
            </div>

            {/* Tagihan List */}
            {tab === 'tagihan' && (
                <div className="stu-list">
                    {unpaid.length === 0 ? (
                        <div className="stu-empty-mini">🎉 Semua tagihan sudah lunas!</div>
                    ) : unpaid.map(b => (
                        <div key={b.id} className="stu-bill-card">
                            <div className="stu-bill-header">
                                <div>
                                    <span className="stu-bill-kategori">{b.kategori_nama}</span>
                                    <span className="stu-bill-period">{b.bulan} {b.tahun} • {b.tahun_ajaran}</span>
                                </div>
                                <span className="stu-bill-amount">{formatRupiah(b.nominal)}</span>
                            </div>
                            <div className="stu-bill-status unpaid">
                                <Clock size={14} /> Belum Lunas
                            </div>
                        </div>
                    ))}

                    {paid.length > 0 && (
                        <>
                            <h4 className="stu-subsection-title">✅ Sudah Lunas</h4>
                            {paid.slice(0, 10).map(b => (
                                <div key={b.id} className="stu-bill-card paid">
                                    <div className="stu-bill-header">
                                        <div>
                                            <span className="stu-bill-kategori">{b.kategori_nama}</span>
                                            <span className="stu-bill-period">{b.bulan} {b.tahun}</span>
                                        </div>
                                        <span className="stu-bill-amount">{formatRupiah(b.nominal)}</span>
                                    </div>
                                    <div className="stu-bill-status paid-status">
                                        <CheckCircle size={14} /> Lunas
                                    </div>
                                </div>
                            ))}
                        </>
                    )}
                </div>
            )}

            {/* Riwayat List */}
            {tab === 'riwayat' && (
                <div className="stu-list">
                    {transactions.length === 0 ? (
                        <div className="stu-empty-mini">Belum ada riwayat pembayaran</div>
                    ) : transactions.map(tx => (
                        <div key={tx.id} className="stu-tx-card" onClick={() => setExpandedTx(expandedTx === tx.id ? null : tx.id)}>
                            <div className="stu-tx-card-header">
                                <div className="stu-tx-card-info">
                                    <span className="stu-tx-invoice">{tx.invoice_no || tx.invoiceNo}</span>
                                    <span className="stu-tx-card-date">
                                        {new Date(tx.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
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
                                        <span>Total Bayar</span>
                                        <span>{formatRupiah(tx.amount_paid || tx.amountPaid)}</span>
                                    </div>
                                    <div className="stu-tx-detail-row">
                                        <span>Kembalian</span>
                                        <span>{formatRupiah(tx.change_amount || tx.change || 0)}</span>
                                    </div>
                                    <div className="stu-tx-detail-row">
                                        <span>Status</span>
                                        <span className={`stu-badge-sm ${tx.status === 'void' ? 'danger' : 'success'}`}>
                                            {tx.status === 'void' ? 'Dibatalkan' : 'Sukses'}
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
