import { useState, useMemo } from 'react'
import { useApp } from '../context/AppContext'
import {
    Search, Filter, CreditCard, Printer, MessageCircle, Download,
    TrendingUp, AlertCircle, CheckCircle2, DollarSign
} from 'lucide-react'
import { downloadFile } from '../utils/downloadHelper'
import { printKartuSPP } from '../utils/printHelper'
import SiswaSppDetail from '../features/pembayaran/SiswaSppDetail'

export default function KartuSppPage() {
    const {
        students, bills, units, tahunAjaranList, tahunAjaran: activeTahunAjaran,
        formatRupiah, MONTHS, addToast
    } = useApp()

    const [search, setSearch] = useState('')
    const [filterKelas, setFilterKelas] = useState('')
    const [filterTahun, setFilterTahun] = useState(activeTahunAjaran)
    const [filterStatus, setFilterStatus] = useState('semua')
    const [selectedStudents, setSelectedStudents] = useState([])
    const [viewData, setViewData] = useState(null)
    const [page, setPage] = useState(1)
    const PER_PAGE = 10

    const allKelas = units.flatMap(u => u.kelas)

    // Calculate billing summary for each student
    const now = new Date()
    const currentMonthIdx = now.getMonth() // 0-11
    const currentYear = now.getFullYear()

    const studentStats = useMemo(() => {
        return students.map(student => {
            const studentBills = bills.filter(b => b.siswaId === student.id && b.tahunAjaran === filterTahun)
            const totalTagihan = studentBills.reduce((sum, b) => sum + b.nominal, 0)
            const terbayar = studentBills.filter(b => b.status === 'lunas').reduce((sum, b) => sum + b.nominal, 0)
            const sisa = totalTagihan - terbayar

            // Refined Logic for status
            let isMenunggak = false
            studentBills.forEach(b => {
                const bMonthIdx = MONTHS.indexOf(b.bulan)
                const bYear = b.tahun

                // Compare with current month/year
                const isPastOrCurrent = (bYear < currentYear) || (bYear === currentYear && bMonthIdx <= currentMonthIdx)

                if (isPastOrCurrent && b.status !== 'lunas') {
                    isMenunggak = true
                }
            })

            let status = 'Menunggak'
            if (!isMenunggak) {
                if (sisa === 0 && totalTagihan > 0) {
                    status = 'Lunas'
                } else if (totalTagihan > 0) {
                    status = 'Lunas Sementara'
                } else {
                    status = 'Lunas'
                }
            }

            return {
                ...student,
                totalTagihan,
                terbayar,
                sisa,
                status
            }
        })
    }, [students, bills, filterTahun, currentMonthIdx, currentYear])

    const filtered = studentStats.filter(s => {
        const matchSearch = s.nama.toLowerCase().includes(search.toLowerCase()) || s.nisn.includes(search)
        const matchKelas = !filterKelas || s.kelas === filterKelas
        const matchStatus = filterStatus === 'semua' ||
            (filterStatus === 'lunas' ? s.status === 'Lunas' :
                filterStatus === 'lunas_sementara' ? s.status === 'Lunas Sementara' :
                    s.status === 'Menunggak')
        return matchSearch && matchKelas && matchStatus
    })

    const totals = useMemo(() => {
        const target = filtered.reduce((sum, s) => sum + s.totalTagihan, 0)
        const terkumpul = filtered.reduce((sum, s) => sum + s.terbayar, 0)
        const tunggakan = filtered.reduce((sum, s) => sum + s.sisa, 0)
        const kolektibilitas = target > 0 ? Math.round((terkumpul / target) * 100) : 0
        return { target, terkumpul, tunggakan, kolektibilitas }
    }, [filtered])

    const totalPages = Math.ceil(filtered.length / PER_PAGE)
    const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE)

    const handleExportExcel = async () => {
        try {
            const sheetData = filtered.map((s, i) => ({
                No: i + 1,
                NISN: s.nisn,
                Nama: s.nama,
                Kelas: s.kelas,
                'Total Tagihan': s.totalTagihan,
                Terbayar: s.terbayar,
                Sisa: s.sisa,
                Status: s.status
            }))
            const ws = XLSX.utils.json_to_sheet(sheetData)
            const wb = XLSX.utils.book_new()
            XLSX.utils.book_append_sheet(wb, ws, 'Kartu SPP')
            const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
            const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
            await downloadFile(blob, `Kartu_SPP_Siswa_${filterTahun.replace('/', '-')}.xlsx`)
            addToast('success', 'Export Berhasil', 'Data Kartu SPP berhasil diekspor')
        } catch (err) {
            addToast('danger', 'Export Gagal', 'Gagal mengekspor data ke Excel')
        }
    }

    const handleMassPrint = () => {
        if (selectedStudents.length === 0) {
            addToast('warning', 'Peringatan', 'Pilih minimal satu siswa untuk dicetak')
            return
        }

        addToast('info', 'Mencetak...', `Sedang memproses ${selectedStudents.length} kartu.`)

        selectedStudents.forEach(studentId => {
            const student = students.find(s => s.id === studentId)
            if (!student) return

            const studentBills = bills.filter(b => b.siswaId === studentId && b.tahunAjaran === filterTahun)
            const categoriesMap = {}
            studentBills.forEach(b => {
                if (!categoriesMap[b.kategori]) categoriesMap[b.kategori] = []
                categoriesMap[b.kategori].push(b)
            })

            printKartuSPP(student, categoriesMap, MONTHS, formatRupiah, filterTahun)
        })
    }

    const handleWAReminder = (student) => {
        const message = `Halo Bapak/Ibu Wali Murid dari ${student.nama},\ndari SMK PPRQ menginformasikan bahwa terdapat tagihan SPP/Keuangan yang belum diselesaikan sebesar ${formatRupiah(student.sisa)} untuk tahun ajaran ${filterTahun}. Mohon segera melakukan pembayaran. Terima kasih.`
        const encoded = encodeURIComponent(message)
        window.open(`https://wa.me/${student.telp}?text=${encoded}`, '_blank')
    }

    if (viewData) {
        return <SiswaSppDetail data={viewData} onClose={() => setViewData(null)} year={filterTahun} />
    }

    return (
        <div className="fade-in">
            <div className="page-header">
                <div>
                    <h1>Kartu SPP Siswa</h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Monitoring tunggakan dan cetak kartu SPP massal</p>
                </div>
                <div className="actions">
                    <button className="btn btn-ghost" onClick={handleExportExcel}>
                        <Download size={16} /> Export Excel
                    </button>
                    <button className="btn btn-primary" onClick={handleMassPrint} disabled={selectedStudents.length === 0}>
                        <Printer size={16} /> Cetak Terpilih ({selectedStudents.length})
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-icon blue"><DollarSign size={24} /></div>
                    <div className="stat-info">
                        <h4>Total Target Tagihan</h4>
                        <div className="value">{formatRupiah(totals.target)}</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon green"><CheckCircle2 size={24} /></div>
                    <div className="stat-info">
                        <h4>Total Dana Terkumpul</h4>
                        <div className="value">{formatRupiah(totals.terkumpul)}</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon red"><AlertCircle size={24} /></div>
                    <div className="stat-info">
                        <h4>Total Tunggakan</h4>
                        <div className="value">{formatRupiah(totals.tunggakan)}</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon teal"><TrendingUp size={24} /></div>
                    <div className="stat-info">
                        <h4>Kolektibilitas</h4>
                        <div className="value">{totals.kolektibilitas}%</div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="filter-bar">
                <div className="search-input">
                    <Search size={16} className="search-icon" />
                    <input
                        className="form-control"
                        placeholder="Cari nama atau NISN..."
                        value={search}
                        onChange={e => { setSearch(e.target.value); setPage(1) }}
                    />
                </div>
                <select className="form-control" value={filterTahun} onChange={e => { setFilterTahun(e.target.value); setPage(1) }}>
                    {tahunAjaranList.map(t => <option key={t.id} value={t.tahun}>{t.tahun} {t.status === 'aktif' ? '(Aktif)' : ''}</option>)}
                </select>
                <select className="form-control" value={filterKelas} onChange={e => { setFilterKelas(e.target.value); setPage(1) }}>
                    <option value="">Semua Kelas</option>
                    {allKelas.map(k => <option key={k.id} value={k.nama}>{k.nama}</option>)}
                </select>
                <select className="form-control" value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1) }}>
                    <option value="semua">Semua Status</option>
                    <option value="lunas">Lunas</option>
                    <option value="lunas_sementara">Lunas Sementara</option>
                    <option value="menunggak">Menunggak</option>
                </select>
            </div>

            {/* Data Grid */}
            <div className="table-container">
                <table>
                    <thead>
                        <tr>
                            <th style={{ width: 40 }}>
                                <input
                                    type="checkbox"
                                    checked={paginated.length > 0 && paginated.every(s => selectedStudents.includes(s.id))}
                                    onChange={e => {
                                        if (e.target.checked) {
                                            setSelectedStudents(prev => [...new Set([...prev, ...paginated.map(s => s.id)])])
                                        } else {
                                            setSelectedStudents(prev => prev.filter(id => !paginated.find(s => s.id === id)))
                                        }
                                    }}
                                />
                            </th>
                            <th style={{ width: 40 }}>#</th>
                            <th>Nama Siswa</th>
                            <th>Kelas</th>
                            <th>Total Tagihan</th>
                            <th>Terbayar</th>
                            <th>Sisa</th>
                            <th>Status</th>
                            <th style={{ width: 150 }}>Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginated.length === 0 ? (
                            <tr>
                                <td colSpan="9" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                                    Tidak ada data siswa yang ditemukan.
                                </td>
                            </tr>
                        ) : (
                            paginated.map((s, i) => (
                                <tr key={s.id} className={selectedStudents.includes(s.id) ? 'selected-row' : ''}>
                                    <td>
                                        <input
                                            type="checkbox"
                                            checked={selectedStudents.includes(s.id)}
                                            onChange={e => {
                                                if (e.target.checked) setSelectedStudents(prev => [...prev, s.id])
                                                else setSelectedStudents(prev => prev.filter(id => id !== s.id))
                                            }}
                                        />
                                    </td>
                                    <td>{(page - 1) * PER_PAGE + i + 1}</td>
                                    <td>
                                        <div style={{ fontWeight: 500 }}>{s.nama}</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>NISN: {s.nisn}</div>
                                    </td>
                                    <td>{s.kelas}</td>
                                    <td className="mono">{formatRupiah(s.totalTagihan)}</td>
                                    <td className="mono" style={{ color: 'var(--success-600)' }}>{formatRupiah(s.terbayar)}</td>
                                    <td className="mono" style={{ color: s.sisa > 0 ? 'var(--danger-600)' : 'inherit', fontWeight: s.sisa > 0 ? 600 : 400 }}>
                                        {formatRupiah(s.sisa)}
                                    </td>
                                    <td>
                                        {s.status === 'Lunas' ? (
                                            <span className="badge badge-success">Lunas</span>
                                        ) : s.status === 'Lunas Sementara' ? (
                                            <span className="badge badge-warning">Lunas Sementara</span>
                                        ) : (
                                            <span className="badge badge-danger pulse">Menunggak</span>
                                        )}
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', gap: '4px' }}>
                                            <button
                                                className="btn-icon"
                                                title="Lihat Kartu"
                                                onClick={() => setViewData(s)}
                                            >
                                                <CreditCard size={16} />
                                            </button>
                                            {s.sisa > 0 && (
                                                <button
                                                    className="btn-icon"
                                                    style={{ color: '#25D366' }}
                                                    title="Kirim Reminder WA"
                                                    onClick={() => handleWAReminder(s)}
                                                >
                                                    <MessageCircle size={16} />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {filtered.length > 0 && (
                <div className="pagination">
                    <span>Menampilkan {(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, filtered.length)} dari {filtered.length} siswa</span>
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
            )}
        </div>
    )
}
