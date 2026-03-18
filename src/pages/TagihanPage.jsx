import { useState } from 'react'
import { usePagination } from '../hooks/usePagination'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import Modal from '../components/Modal'
import EmptyState from '../components/EmptyState'
import { Search, Zap, FileText, AlertCircle, History } from 'lucide-react'

// Features
import GenerateModal from '../features/tagihan/GenerateModal'
import SingleGenerateModal from '../features/tagihan/SingleGenerateModal'
import DiscountModal from '../features/tagihan/DiscountModal'

export default function TagihanPage() {
    const navigate = useNavigate()
    const { bills, categories, units, students, formatRupiah, generateBulkBills, generateSingleBill, MONTHS, applyDiscountToBills, addToast, tahunAjaranList } = useApp()
    const [filterTahunAjaran, setFilterTahunAjaran] = useState('')
    const [search, setSearch] = useState('')
    const [filterKelas, setFilterKelas] = useState('')
    const [filterKategori, setFilterKategori] = useState('')
    const [filterStatus, setFilterStatus] = useState('semua')
    const [showGenerate, setShowGenerate] = useState(false)
    const [showSingleGenerate, setShowSingleGenerate] = useState(false)
    const [showDiscountModal, setShowDiscountModal] = useState(false)
    const [selectedBills, setSelectedBills] = useState([])
    const allKelas = units.flatMap(u => u.kelas)

    const filtered = bills.filter(b => {
        const matchSearch = (b.siswa_nama || '').toLowerCase().includes(search.toLowerCase())
        const matchKelas = !filterKelas || (b.kelas_nama === filterKelas || b.kelas === filterKelas)
        const matchKategori = !filterKategori || (b.kategori_nama === filterKategori || b.kategori === filterKategori)
        const matchStatus = filterStatus === 'semua' || b.status === filterStatus
        const matchTA = !filterTahunAjaran || (b.tahun_ajaran === filterTahunAjaran || b.tahunAjaran === filterTahunAjaran)
        return matchSearch && matchKelas && matchKategori && matchStatus && matchTA
    })

    const handleApplyDiscount = (type, value) => {
        applyDiscountToBills(selectedBills, type, value)
        setShowDiscountModal(false)
        setSelectedBills([])
    }

    const { page, setPage, totalPages, paginated, resetPage, perPage: PER_PAGE } = usePagination(filtered, 15)

    return (
        <div className="fade-in">
            <div className="page-header">
                <h1>Manajemen Tagihan</h1>
                <div className="actions">
                    {selectedBills.length > 0 && (
                        <button className="btn btn-warning" onClick={() => setShowDiscountModal(true)}>
                            🏷️ Beri Diskon ({selectedBills.length})
                        </button>
                    )}
                    <button className="btn btn-ghost" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }} onClick={() => navigate('/admin/riwayat-generate')}>
                        <History size={16} /> Riwayat
                    </button>
                    <button className="btn btn-outline" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }} onClick={() => setShowSingleGenerate(true)}>
                        <FileText size={16} /> Buat Tagihan Tunggal
                    </button>
                    <button className="btn btn-primary" onClick={() => setShowGenerate(true)}>
                        <Zap size={16} /> Generate Massal
                    </button>
                </div>
            </div>

            <div className="filter-bar">
                <div className="search-input">
                    <Search size={16} className="search-icon" />
                    <input className="form-control" placeholder="Cari nama siswa..." value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} />
                </div>
                <select className="form-control" value={filterKelas} onChange={e => { setFilterKelas(e.target.value); setPage(1) }}>
                    <option value="">Semua Kelas</option>
                    {allKelas.map(k => <option key={k.id} value={k.nama}>{k.nama}</option>)}
                </select>
                <select className="form-control" value={filterKategori} onChange={e => { setFilterKategori(e.target.value); setPage(1) }}>
                    <option value="">Semua Kategori</option>
                    {categories.map(c => <option key={c.id} value={c.nama}>{c.nama}</option>)}
                </select>
                <select className="form-control" value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1) }}>
                    <option value="semua">Semua Status</option>
                    <option value="belum">Belum Lunas</option>
                    <option value="lunas">Lunas</option>
                </select>
                <select className="form-control" value={filterTahunAjaran} onChange={e => { setFilterTahunAjaran(e.target.value); setPage(1) }}>
                    <option value="">Semua Thn Ajaran</option>
                    {tahunAjaranList.map(ta => <option key={ta.id} value={ta.tahun}>{ta.tahun}</option>)}
                </select>
            </div>

            {filtered.length === 0 ? (
                <EmptyState
                    icon={FileText}
                    title="Belum Ada Tagihan"
                    message="Belum ada tagihan untuk filter yang dipilih. Gunakan fitur Generate Tagihan untuk membuat tagihan massal."
                    action={
                        <button className="btn btn-primary" onClick={() => setShowGenerate(true)}>
                            <Zap size={16} /> Generate Tagihan Pertama
                        </button>
                    }
                />
            ) : (
                <>
                    <div className="table-container">
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
                                    <th>Bulan/Tahun Ajaran</th>
                                    <th>Nominal</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginated.map((b, i) => (
                                    <tr key={b.id} className={selectedBills.includes(b.id) ? 'selected-row' : ''}>
                                        <td>
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
                                        <td>{(page - 1) * PER_PAGE + i + 1}</td>
                                        <td style={{ fontWeight: 500 }}>{b.siswa_nama}</td>
                                        <td>{b.kelas_nama}</td>
                                        <td>{b.kategori_nama}</td>
                                        <td>
                                            {b.bulan}'{b.tahun.toString().slice(-2)}
                                            <br /><span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>({b.tahun_ajaran})</span>
                                        </td>
                                        <td className="mono">
                                            {b.is_diskon && (
                                                <span style={{ textDecoration: 'line-through', color: 'var(--text-secondary)', fontSize: '0.8rem', display: 'block' }}>
                                                    {formatRupiah(b.nominal_asli || b.nominal)}
                                                </span>
                                            )}
                                            <span style={{ color: b.is_diskon ? 'var(--warning-600)' : 'inherit', fontWeight: b.is_diskon ? 600 : 400 }}>
                                                {formatRupiah(b.nominal)}
                                            </span>
                                            {b.is_diskon && (
                                                <span className="badge badge-warning" style={{ display: 'block', width: 'max-content', marginTop: 4, fontSize: '0.65rem' }}>🏷️ Diskon</span>
                                            )}
                                        </td>
                                        <td>
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
                        <span>Menampilkan {(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, filtered.length)} dari {filtered.length} tagihan</span>
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

