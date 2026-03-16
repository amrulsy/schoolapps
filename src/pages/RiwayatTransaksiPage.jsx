import { useState, useRef } from 'react'
import { useApp } from '../context/AppContext'
import Modal from '../components/Modal'
import EmptyState from '../components/EmptyState'
import { useReactToPrint } from 'react-to-print'
import { downloadFile } from '../utils/downloadHelper'
import { FileText, Printer, FileDown, RotateCcw, Search, Eye } from 'lucide-react'
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
        const matchSearch = t.siswaName.toLowerCase().includes(search.toLowerCase()) ||
            t.invoiceNo.toLowerCase().includes(search.toLowerCase())
        return matchSearch
    })

    const totalPages = Math.ceil(filtered.length / PER_PAGE)
    const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE)

    const handleViewReceipt = (tx) => {
        const student = students.find(s => s.id === tx.siswaId) || { nama: tx.siswaName, nisn: '-', kelas: '-' }
        setReceipt({ ...tx, student })
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
                                    <tr key={tx.id} style={{ opacity: tx.status === 'voided' ? 0.6 : 1 }}>
                                        <td>{new Date(tx.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                                        <td className="mono">{tx.invoiceNo}</td>
                                        <td style={{ fontWeight: 500 }}>
                                            {tx.siswaName}
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                                {tx.items.length} item tagihan
                                            </div>
                                        </td>
                                        <td>{tx.kasir}</td>
                                        <td className="mono" style={{ fontWeight: 600 }}>{formatRupiah(tx.total)}</td>
                                        <td style={{ textAlign: 'center' }}>
                                            {tx.status === 'voided' ? (
                                                <span className="badge badge-danger">DIBATALKAN</span>
                                            ) : (
                                                <span className="badge badge-success">SUKSES</span>
                                            )}
                                        </td>
                                        <td style={{ textAlign: 'right' }}>
                                            <button
                                                className="btn-icon"
                                                title="Lihat & Cetak Struk"
                                                onClick={() => handleViewReceipt(tx)}
                                            >
                                                <Eye size={16} />
                                            </button>
                                            {tx.status !== 'voided' && (
                                                <button
                                                    className="btn-icon danger"
                                                    title="Batalkan (Void) Transaksi"
                                                    onClick={() => handleVoid(tx)}
                                                >
                                                    <RotateCcw size={16} />
                                                </button>
                                            )}
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
