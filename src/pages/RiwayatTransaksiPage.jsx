import { useState, useRef } from 'react'
import { useApp } from '../context/AppContext'
import Modal from '../components/Modal'
import EmptyState from '../components/EmptyState'
import { useReactToPrint } from 'react-to-print'
import { downloadFile } from '../utils/downloadHelper'
import { FileText, Printer, FileDown, RotateCcw, Search, Eye, Trash2 } from 'lucide-react'
import ReceiptReprintModal from '../features/transaksi/ReceiptReprintModal'
import { useCustomAlert } from '../hooks/useCustomAlert'

export default function RiwayatTransaksiPage() {
    const { transactions, revertTransaction, formatRupiah, students } = useApp()
    const { confirmDelete } = useCustomAlert()
    const [search, setSearch] = useState('')
    const [page, setPage] = useState(1)
    const [receipt, setReceipt] = useState(null)
    const PER_PAGE = 15

    const filtered = transactions.filter(t => {
        const snama = t.siswa_nama || t.siswaName || ''
        const inv = t.invoice_no || t.invoiceNo || ''
        const matchSearch = snama.toLowerCase().includes(search.toLowerCase()) ||
            inv.toLowerCase().includes(search.toLowerCase())
        return matchSearch
    })

    const totalPages = Math.ceil(filtered.length / PER_PAGE)
    const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE)

    const handleViewReceipt = async (tx) => {
        try {
            const res = await fetch(`http://localhost:3000/api/transactions/${tx.id}`)
            if (res.ok) {
                const detail = await res.json()
                setReceipt(detail)
            } else {
                // Fallback if detail fetch fails
                const student = students.find(s => s.id === (tx.siswa_id || tx.siswaId)) || { nama: tx.siswa_nama || tx.siswaName, nisn: '-', kelas: '-' }
                setReceipt({ ...tx, student, items: tx.items || [] })
            }
        } catch (err) {
            console.error("Fetch receipt detail error:", err)
            const student = students.find(s => s.id === (tx.siswa_id || tx.siswaId)) || { nama: tx.siswa_nama || tx.siswaName, nisn: '-', kelas: '-' }
            setReceipt({ ...tx, student, items: tx.items || [] })
        }
    }

    const handleVoid = async (tx) => {
        const isConfirmed = await confirmDelete(
            `Batalkan Transaksi ${tx.invoiceNo}?`,
            `Dibatalkan oleh: ${tx.siswaName}\n\nTagihan akan dikembalikan menjadi 'Belum Lunas' dan kas akan ditarik. Tindakan ini tidak dapat dibatalkan.`
        )
        if (isConfirmed) {
            revertTransaction(tx.id)
        }
    }

    return (
        <div className="fade-in">
            <div className="page-header">
                <h1>Riwayat Transaksi</h1>
                <p style={{ color: 'var(--text-secondary)' }}>Log pembayaran SPP dan invoice kasir</p>
            </div>

            <div className="filter-bar">
                <div className="search-input" style={{ maxWidth: 400 }}>
                    <Search size={16} className="search-icon" />
                    <input
                        className="form-control"
                        placeholder="Cari No. Invoice atau Nama Siswa..."
                        value={search}
                        onChange={e => { setSearch(e.target.value); setPage(1) }}
                    />
                </div>
            </div>

            {filtered.length === 0 ? (
                <EmptyState
                    icon={FileText}
                    title="Tidak Ada Transaksi"
                    message="Belum ada riwayat transaksi pembayaran kasir yang tercatat."
                />
            ) : (
                <>
                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Tanggal</th>
                                    <th>No. Invoice</th>
                                    <th>Siswa</th>
                                    <th>Kasir</th>
                                    <th>Total Bayar</th>
                                    <th style={{ textAlign: 'center' }}>Status</th>
                                    <th style={{ textAlign: 'right' }}>Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginated.map((tx) => (
                                    <tr key={tx.id} style={{ opacity: (tx.status === 'void' || tx.status === 'voided') ? 0.6 : 1 }}>
                                        <td>{new Date(tx.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                                        <td className="mono">{tx.invoice_no || tx.invoiceNo}</td>
                                        <td style={{ fontWeight: 500 }}>
                                            {tx.siswa_nama || tx.siswaName}
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                                {tx.items?.length || 0} item tagihan
                                            </div>
                                        </td>
                                        <td>{tx.kasir || 'Admin'}</td>
                                        <td className="mono" style={{ fontWeight: 600 }}>{formatRupiah(tx.total)}</td>
                                        <td style={{ textAlign: 'center' }}>
                                            {(tx.status === 'void' || tx.status === 'voided') ? (
                                                <span className="badge badge-danger">DIBATALKAN</span>
                                            ) : (
                                                <span className="badge badge-success">SUKSES</span>
                                            )}
                                        </td>
                                        <td style={{ textAlign: 'right' }}>
                                            <div className="action-group" style={{ justifyContent: 'flex-end' }}>
                                                <button
                                                    className="btn-icon btn-view"
                                                    title="Lihat & Cetak Struk"
                                                    onClick={() => handleViewReceipt(tx)}
                                                >
                                                    <Eye size={20} />
                                                </button>
                                                {tx.status !== 'voided' && (
                                                    <button
                                                        className="btn-icon btn-delete danger"
                                                        title="Batalkan (Void) Transaksi"
                                                        onClick={() => handleVoid(tx)}
                                                    >
                                                        <Trash2 size={20} />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="pagination">
                        <span>Menampilkan {(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, filtered.length)} dari {filtered.length} riwayat</span>
                        <div className="pagination-buttons">
                            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>◀</button>
                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                const p = Math.max(1, Math.min(page - 2, totalPages - 4)) + i
                                if (p > totalPages) return null
                                return <button key={p} className={page === p ? 'active' : ''} onClick={() => setPage(p)}>{p}</button>
                            })}
                            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>▶</button>
                        </div>
                    </div>
                </>
            )}

            {/* Receipt Modal */}
            {receipt && (
                <ReceiptReprintModal receipt={receipt} formatRupiah={formatRupiah} onClose={() => setReceipt(null)} />
            )}
        </div>
    )
}
