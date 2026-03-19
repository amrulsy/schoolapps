import { useState } from 'react'
import { useApp } from '../../context/AppContext'
import Modal from '../../components/Modal'
import EmptyState from '../../components/EmptyState'
import * as XLSX from 'xlsx'
import { downloadFile } from '../../utils/downloadHelper'
import { Search, Plus, TrendingUp, TrendingDown, Wallet, BookOpen, Download } from 'lucide-react'

// Features
import ExpenseForm from '../../features/transaksi/ExpenseForm'

export default function ArusKasPage() {
    const { cashFlow, addExpense, formatRupiah } = useApp()
    const [filterTipe, setFilterTipe] = useState('semua')
    const [showModal, setShowModal] = useState(false)
    const [page, setPage] = useState(1)
    const PER_PAGE = 15

    const totalIncome = cashFlow.filter(c => c.tipe === 'masuk').reduce((s, c) => s + Number(c.nominal), 0)
    const totalExpense = cashFlow.filter(c => c.tipe === 'keluar').reduce((s, c) => s + Number(c.nominal), 0)
    const saldo = totalIncome - totalExpense

    const filtered = cashFlow.filter(c => filterTipe === 'semua' || c.tipe === filterTipe)
    const totalPages = Math.ceil(filtered.length / PER_PAGE)
    const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE)

    const handleAddExpense = (data) => {
        addExpense(data.keterangan, Number(data.nominal), data.tanggal)
        setShowModal(false)
    }

    const handleExportExcel = async () => {
        const sheetData = filtered.map((c, i) => ({
            No: i + 1,
            Tanggal: c.tanggal ? new Date(c.tanggal).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }) : '-',
            Tipe: c.tipe === 'masuk' ? 'Pemasukan' : 'Pengeluaran',
            Keterangan: c.keterangan,
            Nominal: Number(c.nominal),
            Referensi: c.ref || '-',
        }))
        // Baris summary saldo
        sheetData.push({ No: '', Tanggal: '', Tipe: '', Keterangan: '' })
        sheetData.push({ No: '', Tanggal: '', Tipe: 'TOTAL PEMASUKAN', Nominal: totalIncome })
        sheetData.push({ No: '', Tanggal: '', Tipe: 'TOTAL PENGELUARAN', Nominal: totalExpense })
        sheetData.push({ No: '', Tanggal: '', Tipe: 'SALDO BERSIH', Nominal: saldo })

        const ws = XLSX.utils.json_to_sheet(sheetData)
        ws['!cols'] = [
            { wch: 5 },  // No
            { wch: 18 }, // Tanggal
            { wch: 14 }, // Tipe
            { wch: 45 }, // Keterangan
            { wch: 16 }, // Nominal
            { wch: 14 }, // Referensi
        ]
        const wb = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(wb, ws, 'Arus Kas')
        const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
        const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
        await downloadFile(blob, 'Laporan_Arus_Kas_SIAS.xlsx')
    }

    return (
        <div className="fade-in">
            <div className="page-header">
                <h1>Buku Arus Kas</h1>
                <div className="actions">
                    <button className="btn btn-ghost" onClick={handleExportExcel}>
                        <Download size={16} /> Export Excel
                    </button>
                    <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                        <Plus size={16} /> Tambah Pengeluaran
                    </button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="cashflow-cards">
                <div className="cashflow-card income">
                    <div className="cf-label"><TrendingUp size={16} /> Pemasukan</div>
                    <div className="cf-value">{formatRupiah(totalIncome)}</div>
                </div>
                <div className="cashflow-card expense">
                    <div className="cf-label"><TrendingDown size={16} /> Pengeluaran</div>
                    <div className="cf-value">{formatRupiah(totalExpense)}</div>
                </div>
                <div className="cashflow-card balance">
                    <div className="cf-label"><Wallet size={16} /> Saldo</div>
                    <div className="cf-value">{formatRupiah(saldo)}</div>
                </div>
            </div>

            {/* Filter */}
            <div className="filter-bar">
                <select className="form-control" value={filterTipe} onChange={e => { setFilterTipe(e.target.value); setPage(1) }} style={{ minWidth: 150 }}>
                    <option value="semua">Semua Tipe</option>
                    <option value="masuk">Pemasukan</option>
                    <option value="keluar">Pengeluaran</option>
                </select>
            </div>

            {filtered.length === 0 ? (
                <EmptyState
                    icon={BookOpen}
                    title="Belum Ada Transaksi"
                    message="Belum ada transaksi arus kas. Transaksi pembayaran akan otomatis tercatat, atau tambahkan pengeluaran manual."
                    action={
                        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                            <Plus size={16} /> Tambah Pengeluaran
                        </button>
                    }
                />
            ) : (
                <>
                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th style={{ width: 50 }}>No</th>
                                    <th>Tanggal</th>
                                    <th>Keterangan</th>
                                    <th>Nominal</th>
                                    <th>Tipe</th>
                                    <th>Ref</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginated.map((cf, i) => (
                                    <tr key={cf.id}>
                                        <td>{(page - 1) * PER_PAGE + i + 1}</td>
                                        <td>{cf.tanggal ? new Date(cf.tanggal).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}</td>
                                        <td style={{ fontWeight: 500 }}>{cf.keterangan}</td>
                                        <td className="mono" style={{ fontWeight: 600 }}>{formatRupiah(Number(cf.nominal))}</td>
                                        <td>
                                            {cf.tipe === 'masuk' ? (
                                                <span className="badge badge-success">💚 Masuk</span>
                                            ) : (
                                                <span className="badge badge-danger">🔴 Keluar</span>
                                            )}
                                        </td>
                                        <td className="mono" style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{cf.ref}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="pagination">
                        <span>Menampilkan {(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, filtered.length)} dari {filtered.length} transaksi</span>
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

            {showModal && (
                <ExpenseForm onSave={handleAddExpense} onClose={() => setShowModal(false)} />
            )}
        </div>
    )
}

