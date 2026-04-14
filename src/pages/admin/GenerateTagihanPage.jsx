import { useState } from 'react'
import { usePagination } from '../../hooks/usePagination'
import { useApp } from '../../context/AppContext'

import EmptyState from '../../components/EmptyState'
import LoadingSpinner from '../../components/LoadingSpinner'
import { Search, Zap, FileText, History, RotateCcw, AlertCircle, Calendar,  Hash } from 'lucide-react'

// Features
import GenerateModal from '../../features/tagihan/GenerateModal'
import SingleGenerateModal from '../../features/tagihan/SingleGenerateModal'
import DiscountModal from '../../features/tagihan/DiscountModal'

export default function GenerateTagihanPage() {
    const {
        bills, categories, units, students, formatRupiah,
        generateBulkBills, generateSingleBill, MONTHS,
        applyDiscountToBills, addToast, tahunAjaranList,
        generateLogs, rollbackGeneration, loading
    } = useApp()

    const [activeTab, setActiveTab] = useState('daftar') // 'daftar' or 'riwayat'

    // --- State for Daftar Tagihan ---
    const [filterTahunAjaran, setFilterTahunAjaran] = useState('')
    const [searchTagihan, setSearchTagihan] = useState('')
    const [filterKelas, setFilterKelas] = useState('')
    const [filterKategori, setFilterKategori] = useState('')
    const [filterStatus, setFilterStatus] = useState('semua')
    const [showGenerate, setShowGenerate] = useState(false)
    const [showSingleGenerate, setShowSingleGenerate] = useState(false)
    const [showDiscountModal, setShowDiscountModal] = useState(false)
    const [selectedBills, setSelectedBills] = useState([])
    const allKelas = units.flatMap(u => u.kelas)

    // --- State for Riwayat Generate ---
    const [searchRiwayat, setSearchRiwayat] = useState('')
    const [isProcessingRollback, setIsProcessingRollback] = useState(false)

    // Filtering logic for Tagihan
    const filteredBills = bills.filter(b => {
        const matchSearch = (b.siswa_nama || '').toLowerCase().includes(searchTagihan.toLowerCase())
        const matchKelas = !filterKelas || (b.kelas_nama === filterKelas || b.kelas === filterKelas)
        const matchKategori = !filterKategori || (b.kategori_nama === filterKategori || b.kategori === filterKategori)
        const matchStatus = filterStatus === 'semua' || b.status === filterStatus
        const matchTA = !filterTahunAjaran || (b.tahun_ajaran === filterTahunAjaran || b.tahunAjaran === filterTahunAjaran)
        return matchSearch && matchKelas && matchKategori && matchStatus && matchTA
    })

    const { page, setPage, totalPages, paginated, perPage: PER_PAGE } = usePagination(filteredBills, 15)

    // Filtering logic for Riwayat
    const filteredLogs = (generateLogs || []).filter(log =>
        (log.keterangan || '').toLowerCase().includes(searchRiwayat.toLowerCase()) ||
        (log.operator || '').toLowerCase().includes(searchRiwayat.toLowerCase())
    )

    const handleApplyDiscount = (type, value) => {
        applyDiscountToBills(selectedBills, type, value)
        setShowDiscountModal(false)
        setSelectedBills([])
    }

    const handleRollback = async (id) => {
        if (!window.confirm('Apakah Anda yakin ingin melakukan rollback? Seluruh tagihan yang dibuat dalam batch ini akan dihapus. (Hanya bisa dilakukan jika belum ada tagihan yang dibayar)')) {
            return
        }
        setIsProcessingRollback(true)
        await rollbackGeneration(id)
        setIsProcessingRollback(false)
    }

    if (loading && activeTab === 'riwayat') return <LoadingSpinner fullScreen={false} message="Memuat Riwayat..." />

    return (
        <div className="fade-in">
            <div className="page-header">
                <div>
                    <h1>Generate & Kelola Tagihan</h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Pusat kontrol pembuatan dan riwayat tagihan siswa</p>
                </div>
                <div className="actions">
                    {activeTab === 'daftar' && (
                        <>
                            {selectedBills.length > 0 && (
                                <button className="btn btn-warning" onClick={() => setShowDiscountModal(true)}>
                                    🏷️ Diskon ({selectedBills.length})
                                </button>
                            )}
                            <button className="btn btn-outline" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }} onClick={() => setShowSingleGenerate(true)}>
                                <FileText size={16} /> Tagihan Tunggal
                            </button>
                            <button className="btn btn-primary" onClick={() => setShowGenerate(true)}>
                                <Zap size={16} /> Generate Massal
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Tabs Navigation */}
            <div className="mobile-scroll-x" style={{ gap: '2px', marginBottom: '24px', borderBottom: '1px solid var(--border-color)' }}>
                <button
                    onClick={() => setActiveTab('daftar')}
                    style={{
                        padding: '12px 24px',
                        border: 'none',
                        background: 'none',
                        color: activeTab === 'daftar' ? 'var(--primary-600)' : 'var(--text-secondary)',
                        fontWeight: 600,
                        borderBottom: activeTab === 'daftar' ? '2px solid var(--primary-600)' : '2px solid transparent',
                        transition: 'all 0.2s'
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <FileText size={18} /> Daftar Tagihan
                    </div>
                </button>
                <button
                    onClick={() => setActiveTab('riwayat')}
                    style={{
                        padding: '12px 24px',
                        border: 'none',
                        background: 'none',
                        color: activeTab === 'riwayat' ? 'var(--primary-600)' : 'var(--text-secondary)',
                        fontWeight: 600,
                        borderBottom: activeTab === 'riwayat' ? '2px solid var(--primary-600)' : '2px solid transparent',
                        transition: 'all 0.2s'
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <History size={18} /> Riwayat Generate
                    </div>
                </button>
            </div>

            {activeTab === 'daftar' ? (
                <>
                    <div className="filter-bar">
                        <div className="search-input">
                            <Search size={18} className="search-icon" />
                            <input
                                className="form-control"
                                placeholder="Cari nama siswa..."
                                value={searchTagihan}
                                onChange={e => { setSearchTagihan(e.target.value); setPage(1) }}
                            />
                        </div>

                        <div className="filter-group">
                            <div className="status-filters">
                                <button
                                    className={`status-pill ${filterStatus === 'semua' ? 'active' : ''}`}
                                    onClick={() => { setFilterStatus('semua'); setPage(1) }}
                                >
                                    Semua
                                </button>
                                <button
                                    className={`status-pill menunggak ${filterStatus === 'belum' ? 'active' : ''}`}
                                    onClick={() => { setFilterStatus('belum'); setPage(1) }}
                                >
                                    Belum Lunas
                                </button>
                                <button
                                    className={`status-pill lunas ${filterStatus === 'lunas' ? 'active' : ''}`}
                                    onClick={() => { setFilterStatus('lunas'); setPage(1) }}
                                >
                                    Lunas
                                </button>
                            </div>

                            <select className="form-control" value={filterKelas} onChange={e => { setFilterKelas(e.target.value); setPage(1) }}>
                                <option value="">Semua Kelas</option>
                                {allKelas.map(k => <option key={k.id} value={k.nama}>{k.nama}</option>)}
                            </select>

                            <select className="form-control" value={filterKategori} onChange={e => { setFilterKategori(e.target.value); setPage(1) }}>
                                <option value="">Semua Kategori</option>
                                {categories.map(c => <option key={c.id} value={c.nama}>{c.nama}</option>)}
                            </select>

                            <select className="form-control" value={filterTahunAjaran} onChange={e => { setFilterTahunAjaran(e.target.value); setPage(1) }}>
                                <option value="">Tahun Ajaran</option>
                                {tahunAjaranList.map(ta => <option key={ta.id} value={ta.tahun}>{ta.tahun}</option>)}
                            </select>
                        </div>
                    </div>

                    {filteredBills.length === 0 ? (
                        <EmptyState
                            icon={FileText}
                            title="Belum Ada Tagihan"
                            message="Belum ada tagihan untuk filter yang dipilih."
                        />
                    ) : (
                        <>
                            <div className="table-container table-responsive-cards">
                                <table>
                                    <thead>
                                        <tr>
                                            <th style={{ width: 40 }}>
                                                <input
                                                    type="checkbox"
                                                    checked={paginated.length > 0 && paginated.every(b => selectedBills.includes(b.id) || b.status === 'lunas')}
                                                    onChange={(e) => {
                                                        if (e.target.checked) {
                                                            const unpaids = paginated.filter(b => b.status !== 'lunas').map(b => b.id)
                                                            setSelectedBills(prev => [...new Set([...prev, ...unpaids])])
                                                        } else {
                                                            setSelectedBills(prev => prev.filter(id => !paginated.find(b => b.id === id)))
                                                        }
                                                    }}
                                                />
                                            </th>
                                            <th style={{ width: 40 }}>#</th>
                                            <th>Nama Siswa</th>
                                            <th>Kelas</th>
                                            <th>Kategori</th>
                                            <th>Periode</th>
                                            <th>Nominal</th>
                                            <th>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {paginated.map((b, i) => (
                                            <tr key={b.id} className={selectedBills.includes(b.id) ? 'selected-row' : ''}>
                                                <td data-label="">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedBills.includes(b.id)}
                                                        disabled={b.status === 'lunas'}
                                                        onChange={(e) => {
                                                            if (e.target.checked) setSelectedBills(prev => [...prev, b.id])
                                                            else setSelectedBills(prev => prev.filter(id => id !== b.id))
                                                        }}
                                                    />
                                                </td>
                                                <td data-label="#">{(page - 1) * PER_PAGE + i + 1}</td>
                                                <td data-label="Siswa" style={{ fontWeight: 500 }}>{b.siswa_nama}</td>
                                                <td data-label="Kelas">{b.kelas_nama}</td>
                                                <td data-label="Kategori">{b.kategori_nama}</td>
                                                <td data-label="Periode">
                                                    {b.bulan}&apos;{b.tahun.toString().slice(-2)}
                                                    <br /><span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>({b.tahun_ajaran})</span>
                                                </td>
                                                <td data-label="Nominal" className="mono">
                                                    {b.is_diskon && (
                                                        <span style={{ textDecoration: 'line-through', color: 'var(--text-secondary)', fontSize: '0.8rem', display: 'block' }}>
                                                            {formatRupiah(b.nominal_asli || b.nominal)}
                                                        </span>
                                                    )}
                                                    <span style={{ color: b.is_diskon ? 'var(--warning-600)' : 'inherit', fontWeight: b.is_diskon ? 600 : 400 }}>
                                                        {formatRupiah(b.nominal)}
                                                    </span>
                                                </td>
                                                <td data-label="Status">
                                                    {b.status === 'lunas' ? (
                                                        <span className="badge badge-success">Lunas</span>
                                                    ) : (
                                                        <span className="badge badge-danger pulse">Belum Lunas</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <div className="pagination">
                                <span>{(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, filteredBills.length)} dari {filteredBills.length}</span>
                                <div className="pagination-buttons">
                                    <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>◀</button>
                                    <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>▶</button>
                                </div>
                            </div>
                        </>
                    )}
                </>
            ) : (
                <>
                    <div className="filter-bar">
                        <div className="search-input">
                            <Hash size={18} className="search-icon" />
                            <input
                                className="form-control"
                                placeholder="Cari keterangan atau operator..."
                                value={searchRiwayat}
                                onChange={e => setSearchRiwayat(e.target.value)}
                            />
                        </div>
                    </div>

                    {filteredLogs.length === 0 ? (
                        <EmptyState
                            icon={History}
                            title="Riwayat Kosong"
                            message="Belum ada catatan pembuatan tagihan."
                        />
                    ) : (
                        <div className="table-container">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Waktu</th>
                                        <th>Tipe</th>
                                        <th>Keterangan</th>
                                        <th>Jumlah</th>
                                        <th>Operator</th>
                                        <th style={{ textAlign: 'right' }}>Aksi</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredLogs.map(log => (
                                        <tr key={log.id}>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <Calendar size={14} color="var(--primary-500)" />
                                                    <div>
                                                        {new Date(log.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                                            {new Date(log.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <span className={`badge ${log.tipe === 'bulk' ? 'badge-primary' : 'badge-ghost'}`}>
                                                    {log.tipe === 'bulk' ? 'Massal' : 'Tunggal'}
                                                </span>
                                            </td>
                                            <td style={{ fontWeight: 500 }}>{log.keterangan}</td>
                                            <td>{log.jumlah_tagihan} Items</td>
                                            <td>{log.operator || '-'}</td>
                                            <td style={{ textAlign: 'right' }}>
                                                <button
                                                    className="btn btn-danger btn-sm"
                                                    style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                                                    onClick={() => handleRollback(log.id)}
                                                    disabled={isProcessingRollback}
                                                >
                                                    <RotateCcw size={14} /> Rollback
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    <div style={{ marginTop: '24px', padding: '16px', borderRadius: '8px', backgroundColor: 'var(--warning-50)', border: '1px solid var(--warning-200)', display: 'flex', gap: '12px' }}>
                        <AlertCircle size={20} color="var(--warning-600)" style={{ flexShrink: 0 }} />
                        <div style={{ fontSize: '0.85rem', color: 'var(--warning-800)' }}>
                            <strong>Catatan:</strong> Rollback hanya dapat dilakukan jika <strong>seluruh tagihan</strong> dalam batch tersebut belum ada yang dibayar.
                        </div>
                    </div>
                </>
            )}

            {/* Modals */}
            {showGenerate && (
                <GenerateModal
                    allKelas={allKelas}
                    categories={categories}
                    MONTHS={MONTHS}
                    formatRupiah={formatRupiah}
                    onGenerate={generateBulkBills}
                    onClose={() => setShowGenerate(false)}
                    tahunAjaranList={tahunAjaranList}
                />
            )}

            {showSingleGenerate && (
                <SingleGenerateModal
                    students={students}
                    categories={categories}
                    MONTHS={MONTHS}
                    formatRupiah={formatRupiah}
                    addToast={addToast}
                    onGenerate={generateSingleBill}
                    onClose={() => setShowSingleGenerate(false)}
                    tahunAjaranList={tahunAjaranList}
                />
            )}

            {showDiscountModal && (
                <DiscountModal
                    count={selectedBills.length}
                    onClose={() => setShowDiscountModal(false)}
                    onApply={handleApplyDiscount}
                />
            )}
        </div>
    )
}
