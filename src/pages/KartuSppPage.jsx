import { useState, useMemo, useEffect, useRef } from 'react'
import * as XLSX from 'xlsx'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import { useApp } from '../context/AppContext'
import {
    Search, Filter, CreditCard, Printer, MessageCircle, Download,
    TrendingUp, AlertCircle, CheckCircle2, DollarSign, FileText
} from 'lucide-react'
import { downloadFile } from '../utils/downloadHelper'
import { printKartuSPP } from '../utils/printHelper'
import { useCustomAlert } from '../hooks/useCustomAlert'
import SiswaSppDetail from '../features/pembayaran/SiswaSppDetail'

export default function KartuSppPage() {
    const {
        students, bills, units, tahunAjaranList, tahunAjaran: activeTahunAjaran,
        formatRupiah, MONTHS, addToast
    } = useApp()
    const { showError } = useCustomAlert()

    const [search, setSearch] = useState('')
    const [filterKelas, setFilterKelas] = useState('')
    const [filterTahun, setFilterTahun] = useState(activeTahunAjaran)
    const [filterStatus, setFilterStatus] = useState('semua')
    const [selectedStudents, setSelectedStudents] = useState([])
    const [viewData, setViewData] = useState(null)
    const [page, setPage] = useState(1)
    const PER_PAGE = 10

    // Sync with active TA from context
    useEffect(() => {
        if (activeTahunAjaran) setFilterTahun(activeTahunAjaran)
    }, [activeTahunAjaran])

    const allKelas = units.flatMap(u => u.kelas)

    // Calculate billing summary for each student
    const now = new Date()
    const currentMonthIdx = now.getMonth() // 0-11
    const currentYear = now.getFullYear()

    const studentStats = useMemo(() => {
        return students.map(student => {
            const studentBills = bills.filter(b => b.siswa_id === student.id && b.tahun_ajaran === filterTahun)
            const totalTagihan = studentBills.reduce((sum, b) => sum + Number(b.nominal), 0)
            const terbayar = studentBills.filter(b => b.status === 'lunas').reduce((sum, b) => sum + Number(b.nominal), 0)
            const sisa = totalTagihan - terbayar

            // Refined Logic for status
            let isMenunggak = false
            // Academic month mapping (July=0 -> Index 6, Jan=6 -> Index 0, etc.)
            const convertToStandardIdx = (idx) => idx <= 5 ? idx + 7 : idx - 5 // Approx correction
            // Safe mapping based on names
            const monthNamesStandard = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']

            studentBills.forEach(b => {
                const bMonthIdxStandard = monthNamesStandard.indexOf(b.bulan)
                const bYear = Number(b.tahun)

                const tagihanAbsMonth = (bYear * 12) + bMonthIdxStandard
                const currentAbsMonth = (currentYear * 12) + currentMonthIdx

                if (tagihanAbsMonth <= currentAbsMonth && b.status !== 'lunas') {
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
    }, [students, bills, filterTahun, currentMonthIdx, currentYear, MONTHS])

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

    const [isExportingPDF, setIsExportingPDF] = useState(false)
    const pdfTemplateRef = useRef(null)

    const handleExportPDF = async () => {
        setIsExportingPDF(true)
        addToast('info', 'Menyiapkan PDF...', 'Sabar ya, sistem sedang merender dokumen.')

        try {
            const container = pdfTemplateRef.current
            const pages = container.querySelectorAll('.pdf-report-page')
            const pdf = new jsPDF('p', 'mm', 'a4')
            const pdfWidth = pdf.internal.pageSize.getWidth()
            const pdfHeight = pdf.internal.pageSize.getHeight()

            for (let i = 0; i < pages.length; i++) {
                const pageElement = pages[i]
                const canvas = await html2canvas(pageElement, {
                    scale: 2,
                    useCORS: true,
                    logging: false,
                    backgroundColor: '#ffffff'
                })

                const imgData = canvas.toDataURL('image/png')

                // If not the first page, add a new page to PDF
                if (i > 0) pdf.addPage()

                // Add the image (full page)
                pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight)
            }

            const blob = pdf.output('blob')
            const cleanTA = filterTahun.replace(/\//g, '-')
            const fileName = `Laporan_Rekap_SPP_${cleanTA}.pdf`

            await downloadFile(blob, fileName)
            addToast('success', 'PDF Berhasil', 'Laporan PDF telah berhasil diunduh.')
        } catch (err) {
            console.error('PDF Export Error:', err)
            addToast('danger', 'Gagal', 'Terjadi kesalahan saat mengekspor ke PDF.')
        } finally {
            setIsExportingPDF(false)
        }
    }

    const handleExportExcel = async () => {
        try {
            const today = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
            const nowTime = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }).replace(':', '.')
            const numFmt = (val) => ({ t: 'n', v: Number(val) || 0, z: '"Rp"#,##0' })

            // --- SHEET 1: RINGKASAN & STATISTIK ---
            const ringkasanAOA = [
                ['LAPORAN REKAPITULASI PEMBAYARAN SISWA (SIAS)'],
                [`Tahun Pelajaran: ${filterTahun}`],
                [`Unit/Kelas: ${filterKelas || 'Semua Kelas'}`],
                [`Status: ${filterStatus.toUpperCase()}`],
                [`Dihasilkan pada: ${today} - ${nowTime}`],
                [],
                ['I. RINGKASAN KOLEKTIBILITAS'],
                ['Total Target Tagihan', numFmt(totals.target)],
                ['Total Dana Terkumpul', numFmt(totals.terkumpul)],
                ['Total Tunggakan Sisa', numFmt(totals.tunggakan)],
                ['Presentase Kolektibilitas', { t: 's', v: `${totals.kolektibilitas}%` }],
                [],
                ['II. INFORMASI PENDUKUNG'],
                ['Jumlah Siswa Terdata', filtered.length],
                ['Keterangan', 'Laporan ini mencakup seluruh tagihan aktif untuk periode dan filter yang dipilih.'],
                [],
                ['Dicetak oleh:', 'Sistem Informasi Administrasi Sekolah (SIAS)'],
            ]

            const wsRingkasan = XLSX.utils.aoa_to_sheet(ringkasanAOA)
            wsRingkasan['!merges'] = [
                { s: { r: 0, c: 0 }, e: { r: 0, c: 5 } }, // Title merge
            ]
            wsRingkasan['!cols'] = [{ wch: 25 }, { wch: 40 }]

            // --- SHEET 2: DETAIL DATA SISWA ---
            const headerRow = ["No", "NISN", "Nama Siswa", "Kelas", "Target Tagihan", "Terbayar", "Sisa Tunggakan", "Status", "Tahun Ajaran"]
            const detailRows = filtered.map((s, i) => [
                i + 1,
                s.nisn,
                s.nama,
                s.kelas,
                numFmt(s.totalTagihan),
                numFmt(s.terbayar),
                numFmt(s.sisa),
                s.status,
                filterTahun
            ])

            // Grand Total Row
            const totalRow = [
                "TOTAL", "", "", "",
                numFmt(totals.target),
                numFmt(totals.terkumpul),
                numFmt(totals.tunggakan),
                "", ""
            ]

            const wsDetail = XLSX.utils.aoa_to_sheet([headerRow, ...detailRows, totalRow])

            // Layout Detail: Auto-filter & Freeze Panes
            wsDetail['!autofilter'] = { ref: `A1:I${detailRows.length + 1}` }
            wsDetail['!freeze'] = { xSplit: 0, ySplit: 1 } // Freeze header row

            wsDetail['!cols'] = [
                { wch: 5 },  // No
                { wch: 15 }, // NISN
                { wch: 35 }, // Nama
                { wch: 10 }, // Kelas
                { wch: 18 }, // Target
                { wch: 15 }, // Terbayar
                { wch: 18 }, // Sisa
                { wch: 15 }, // Status
                { wch: 15 }  // TA
            ]

            // --- FINAL ASSEMBLY ---
            const wb = XLSX.utils.book_new()
            XLSX.utils.book_append_sheet(wb, wsRingkasan, 'Ringkasan Laporan')
            XLSX.utils.book_append_sheet(wb, wsDetail, 'Detail Siswa')

            const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
            const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })

            const cleanTA = filterTahun.replace(/\//g, '-')
            const cleanDate = new Date().toISOString().slice(0, 10).replace(/-/g, '')
            const fileName = `Rekap_SPP_Siswa_${cleanTA}_${cleanDate}.xlsx`

            await downloadFile(blob, fileName)
            addToast('success', 'Ekspor Berhasil', `Laporan Excel ${fileName} telah tersimpan.`)
        } catch (err) {
            console.error('Excel Export Error:', err)
            addToast('danger', 'Export Gagal', 'Gagal memproses ekspor data Excel. Coba lagi.')
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

            const studentBills = bills.filter(b => b.siswa_id === studentId && b.tahun_ajaran === filterTahun)
            const categoriesMap = {}
            studentBills.forEach(b => {
                const catName = b.kategori_nama || b.kategori || 'Lain-lain'
                if (!categoriesMap[catName]) categoriesMap[catName] = []
                categoriesMap[catName].push(b)
            })

            const success = printKartuSPP(student, categoriesMap, MONTHS, formatRupiah, filterTahun)
            if (success === false) {
                showError('Popup Diblokir', 'Mohon izinkan popup di browser Anda untuk mencetak kartu SPP.')
            }
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
                    <button
                        className="btn btn-ghost"
                        onClick={handleExportPDF}
                        disabled={isExportingPDF}
                        style={{ color: 'var(--danger-600)' }}
                    >
                        <FileText size={16} /> {isExportingPDF ? 'Exporting...' : 'Export PDF'}
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
            {/* Hidden PDF Template (Refactored for Clean Page Breaks) */}
            <div style={{ position: 'absolute', left: '-9999px', top: '-9999px', width: '794px' }}>
                <div ref={pdfTemplateRef}>
                    {/* Page Logic: Split students into chunks */}
                    {(() => {
                        const chunks = []
                        const firstPageRows = 15
                        const otherPageRows = 22

                        // First page chunk
                        chunks.push(filtered.slice(0, firstPageRows))

                        // Subsequent chunks
                        for (let i = firstPageRows; i < filtered.length; i += otherPageRows) {
                            chunks.push(filtered.slice(i, i + otherPageRows))
                        }

                        // If no data, ensure at least one empty chunk to show header
                        if (filtered.length === 0) chunks[0] = []

                        return chunks.map((chunk, pageIdx) => (
                            <div
                                key={pageIdx}
                                className="pdf-report-page"
                                style={{
                                    width: '794px',
                                    height: '1122px', // Standard A4 at 96dpi
                                    padding: '40px',
                                    background: '#ffffff',
                                    fontFamily: "'Inter', 'Segoe UI', sans-serif",
                                    color: '#1e293b',
                                    position: 'relative',
                                    marginBottom: '20px',
                                    boxSizing: 'border-box' // CRITICAL: Ensure padding doesn't expand width
                                }}
                            >
                                {/* Header (Only on Page 1) */}
                                {pageIdx === 0 && (
                                    <>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #3b82f6', paddingBottom: '15px', marginBottom: '15px' }}>
                                            <div>
                                                <h1 style={{ margin: 0, color: '#1e3a8a', fontSize: '24px', fontWeight: 800 }}>SMK PPRQ</h1>
                                                <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '12px' }}>Sistem Informasi Administrasi Sekolah</p>
                                                <p style={{ margin: '2px 0 0', color: '#64748b', fontSize: '11px' }}>Jl. Pesantren No.1 • Telp: (021) 123-4567</p>
                                            </div>
                                            <div style={{ textAlign: 'right' }}>
                                                <div style={{ fontSize: '18px', fontWeight: 800, color: '#3b82f6', letterSpacing: '-0.5px' }}>LAPORAN KARTU SPP</div>
                                                <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px', fontWeight: 600 }}>Tahun Ajaran: {filterTahun}</div>
                                            </div>
                                        </div>

                                        {/* Summary Info */}
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '15px' }}>
                                            <div style={{ background: '#eff6ff', padding: '10px', borderRadius: '6px', border: '1px solid #bfdbfe' }}>
                                                <div style={{ fontSize: '10px', color: '#3b82f6', fontWeight: 700, textTransform: 'uppercase' }}>Total Target</div>
                                                <div style={{ fontSize: '14px', fontWeight: 800, color: '#1e3a8a', marginTop: '2px' }}>{formatRupiah(totals.target)}</div>
                                            </div>
                                            <div style={{ background: '#f0fdf4', padding: '10px', borderRadius: '6px', border: '1px solid #bbf7d0' }}>
                                                <div style={{ fontSize: '10px', color: '#16a34a', fontWeight: 700, textTransform: 'uppercase' }}>Dana Terkumpul</div>
                                                <div style={{ fontSize: '14px', fontWeight: 800, color: '#14532d', marginTop: '2px' }}>{formatRupiah(totals.terkumpul)}</div>
                                            </div>
                                            <div style={{ background: '#fef2f2', padding: '10px', borderRadius: '6px', border: '1px solid #fecaca' }}>
                                                <div style={{ fontSize: '10px', color: '#dc2626', fontWeight: 700, textTransform: 'uppercase' }}>Tunggakan</div>
                                                <div style={{ fontSize: '14px', fontWeight: 800, color: '#7f1d1d', marginTop: '2px' }}>{formatRupiah(totals.tunggakan)}</div>
                                            </div>
                                            <div style={{ background: '#f5f3ff', padding: '10px', borderRadius: '6px', border: '1px solid #ddd6fe' }}>
                                                <div style={{ fontSize: '10px', color: '#7c3aed', fontWeight: 700, textTransform: 'uppercase' }}>Kolektibilitas</div>
                                                <div style={{ fontSize: '14px', fontWeight: 800, color: '#4c1d95', marginTop: '2px' }}>{totals.kolektibilitas}%</div>
                                            </div>
                                        </div>
                                    </>
                                )}

                                {/* Page Title if not first page */}
                                {pageIdx > 0 && (
                                    <div style={{ marginBottom: '10px', fontSize: '11px', color: '#64748b', fontWeight: 600 }}>
                                        ↳ Lanjutan Laporan Rekapitulasi SPP - TA {filterTahun}
                                    </div>
                                )}

                                {/* Table - BULLETPROOF LAYOUT */}
                                <table style={{
                                    width: '100%',
                                    borderCollapse: 'collapse',
                                    fontSize: '11px',
                                    border: '1px solid #cbd5e1',
                                    tableLayout: 'fixed' // CRITICAL: Forces exact widths, stops column shifting
                                }}>
                                    <tbody>
                                        {/* Header Row (Moved inside tbody to fix html2canvas rendering bug) */}
                                        <tr style={{ background: '#1e3a8a', color: '#ffffff' }}>
                                            <td style={{ padding: '8px 5px', textAlign: 'center', borderRight: '1px solid #3b82f6', width: '35px', fontWeight: 600, boxSizing: 'border-box' }}>NO</td>
                                            <td style={{ padding: '8px 10px', textAlign: 'left', borderRight: '1px solid #3b82f6', width: '220px', fontWeight: 600, boxSizing: 'border-box' }}>NAMA SISWA / NISN</td>
                                            <td style={{ padding: '8px 5px', textAlign: 'center', borderRight: '1px solid #3b82f6', width: '80px', fontWeight: 600, boxSizing: 'border-box' }}>KELAS</td>
                                            <td style={{ padding: '8px 10px', textAlign: 'right', borderRight: '1px solid #3b82f6', width: '100px', fontWeight: 600, boxSizing: 'border-box' }}>TARGET</td>
                                            <td style={{ padding: '8px 10px', textAlign: 'right', borderRight: '1px solid #3b82f6', width: '100px', fontWeight: 600, boxSizing: 'border-box' }}>TERBAYAR</td>
                                            <td style={{ padding: '8px 10px', textAlign: 'right', borderRight: '1px solid #3b82f6', width: '100px', fontWeight: 600, boxSizing: 'border-box' }}>SISA</td>
                                            <td style={{ padding: '8px 5px', textAlign: 'center', width: '79px', fontWeight: 600, boxSizing: 'border-box' }}>STATUS</td>
                                        </tr>
                                        {chunk.map((s, i) => {
                                            const globalIdx = pageIdx === 0 ? i : (firstPageRows + (pageIdx - 1) * otherPageRows + i)
                                            return (
                                                <tr key={s.id} style={{ background: i % 2 === 0 ? '#ffffff' : '#f8fafc' }}>
                                                    <td style={{ padding: '8px 5px', border: '1px solid #cbd5e1', textAlign: 'center', width: '35px', boxSizing: 'border-box' }}>{globalIdx + 1}</td>
                                                    <td style={{ padding: '8px 10px', border: '1px solid #cbd5e1', textAlign: 'left', width: '220px', boxSizing: 'border-box' }}>
                                                        <div style={{ fontWeight: 600 }}>{s.nama}</div>
                                                        <div style={{ fontSize: '9px', color: '#64748b' }}>{s.nisn}</div>
                                                    </td>
                                                    <td style={{ padding: '8px 5px', border: '1px solid #cbd5e1', textAlign: 'center', width: '80px', boxSizing: 'border-box' }}>{s.kelas}</td>
                                                    <td style={{ padding: '8px 10px', border: '1px solid #cbd5e1', textAlign: 'right', width: '100px', boxSizing: 'border-box' }}>{formatRupiah(s.totalTagihan)}</td>
                                                    <td style={{ padding: '8px 10px', border: '1px solid #cbd5e1', textAlign: 'right', color: '#16a34a', width: '100px', boxSizing: 'border-box', fontWeight: 600 }}>{formatRupiah(s.terbayar)}</td>
                                                    <td style={{ padding: '8px 10px', border: '1px solid #cbd5e1', textAlign: 'right', color: s.sisa > 0 ? '#dc2626' : 'inherit', width: '100px', boxSizing: 'border-box', fontWeight: s.sisa > 0 ? 700 : 400 }}>
                                                        {formatRupiah(s.sisa)}
                                                    </td>
                                                    <td style={{ padding: '8px 5px', border: '1px solid #cbd5e1', textAlign: 'center', width: '79px', boxSizing: 'border-box' }}>
                                                        <span style={{
                                                            padding: '3px 6px',
                                                            borderRadius: '4px',
                                                            fontSize: '9px',
                                                            fontWeight: 700,
                                                            background: s.status === 'Lunas' ? '#dcfce7' : s.status === 'Lunas Sementara' ? '#fef9c3' : '#fee2e2',
                                                            color: s.status === 'Lunas' ? '#166534' : s.status === 'Lunas Sementara' ? '#854d0e' : '#991b1b',
                                                            display: 'inline-block'
                                                        }}>
                                                            {s.status}
                                                        </span>
                                                    </td>
                                                </tr>
                                            )
                                        })}

                                        {/* Total summary row only on the last page */}
                                        {pageIdx === chunks.length - 1 && (
                                            <tr style={{ background: '#f1f5f9', fontWeight: 700 }}>
                                                <td colSpan="3" style={{ padding: '10px', textAlign: 'right', border: '1px solid #cbd5e1', borderTop: '2px solid #1e3a8a', boxSizing: 'border-box' }}>TOTAL KESELURUHAN</td>
                                                <td style={{ padding: '10px', textAlign: 'right', border: '1px solid #cbd5e1', borderTop: '2px solid #1e3a8a', boxSizing: 'border-box', width: '100px' }}>{formatRupiah(totals.target)}</td>
                                                <td style={{ padding: '10px', textAlign: 'right', border: '1px solid #cbd5e1', borderTop: '2px solid #1e3a8a', boxSizing: 'border-box', width: '100px', color: '#16a34a' }}>{formatRupiah(totals.terkumpul)}</td>
                                                <td style={{ padding: '10px', textAlign: 'right', border: '1px solid #cbd5e1', borderTop: '2px solid #1e3a8a', boxSizing: 'border-box', width: '100px', color: '#dc2626' }}>{formatRupiah(totals.tunggakan)}</td>
                                                <td style={{ border: '1px solid #cbd5e1', borderTop: '2px solid #1e3a8a', boxSizing: 'border-box', width: '79px' }}></td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>

                                {/* Footer (Always at bottom of every page) */}
                                <div style={{
                                    position: 'absolute',
                                    bottom: '40px',
                                    left: '40px',
                                    right: '40px',
                                    paddingTop: '15px',
                                    borderTop: '1px dashed #cbd5e1',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                }}>
                                    <div style={{ fontSize: '9px', color: '#94a3b8' }}>
                                        Dihasilkan oleh SIAS pada {new Date().toLocaleString('id-ID')}
                                    </div>
                                    <div style={{ fontSize: '9px', color: '#94a3b8', fontWeight: 600 }}>
                                        Halaman {pageIdx + 1} dari {chunks.length}
                                    </div>
                                </div>
                            </div>
                        ))
                    })()}
                </div>
            </div>
        </div>
    )
}
