import { useState, useEffect, useMemo, useCallback } from 'react'
import { useApp } from '../../context/AppContext'
import {
    Package, Search, Plus, Edit2, Trash2, ArrowLeftRight, RotateCcw,
    BarChart3, Clock, AlertTriangle, CheckCircle, Settings,
     X, Wrench, FileText, TrendingUp
} from 'lucide-react'
import api from '../../services/api'
import EmptyState from '../../components/EmptyState'
import { usePagination } from '../../hooks/usePagination'

const TABS = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'inventaris', label: 'Inventaris', icon: Package },
    { id: 'peminjaman', label: 'Peminjaman', icon: ArrowLeftRight },
    { id: 'pengaturan', label: 'Pengaturan', icon: Settings },
]

const STATUS_BADGE = {
    tersedia: { bg: '#dcfce7', color: '#166534', label: 'Tersedia' },
    dipinjam: { bg: '#fef9c3', color: '#854d0e', label: 'Dipinjam' },
    maintenance: { bg: '#fee2e2', color: '#991b1b', label: 'Maintenance' },
}

const KONDISI_BADGE = {
    baik: { bg: '#dcfce7', color: '#166534', label: 'Baik' },
    rusak_ringan: { bg: '#fef9c3', color: '#854d0e', label: 'Rusak Ringan' },
    rusak_berat: { bg: '#fee2e2', color: '#991b1b', label: 'Rusak Berat' },
}

const PINJAM_STATUS = {
    dipinjam: { bg: '#dbeafe', color: '#1e40af', label: 'Dipinjam' },
    dikembalikan: { bg: '#dcfce7', color: '#166534', label: 'Dikembalikan' },
    terlambat: { bg: '#fee2e2', color: '#991b1b', label: 'Terlambat' },
}

export default function LabInventarisPage() {
    const { addToast, students } = useApp()
    const [activeTab, setActiveTab] = useState('dashboard')
    const [inventaris, setInventaris] = useState([])
    const [kategori, setKategori] = useState([])
    const [peminjaman, setPeminjaman] = useState([])
    const [dashboard, setDashboard] = useState(null)
    const [settings, setSettings] = useState({})
    const [loading, setLoading] = useState(true)

    // Filters
    const [search, setSearch] = useState('')
    const [filterKategori, setFilterKategori] = useState('')
    const [filterStatus, setFilterStatus] = useState('')
    const [peminjamanFilter, setPeminjamanFilter] = useState('aktif')

    // Modals
    const [itemModal, setItemModal] = useState({ show: false, data: null })
    const [kategoriModal, setKategoriModal] = useState({ show: false, data: null })
    const [pinjamModal, setPinjamModal] = useState({ show: false })
    const [returnModal, setReturnModal] = useState({ show: false, data: null })

    const fetchAll = useCallback(async () => {
        setLoading(true)
        try {
            const [invRes, katRes, dashRes, setRes] = await Promise.all([
                api.get('/admin/lab/inventaris'),
                api.get('/admin/lab/kategori'),
                api.get('/admin/lab/dashboard'),
                api.get('/admin/lab/settings'),
            ])
            setInventaris(invRes.data)
            setKategori(katRes.data)
            setDashboard(dashRes.data)
            setSettings(setRes.data)
        } catch (err) {
            addToast('danger', 'Error', err.message)
        }
        setLoading(false)
    }, [addToast])

    useEffect(() => { fetchAll() }, [fetchAll])

    const fetchPeminjaman = useCallback(async (filter) => {
        try {
            const { data } = await api.get(`/admin/lab/peminjaman?status=${filter}`)
            setPeminjaman(data)
        } catch (err) { addToast('danger', 'Error', err.message) }
    }, [addToast])

    useEffect(() => {
        if (activeTab === 'peminjaman') fetchPeminjaman(peminjamanFilter)
    }, [activeTab, peminjamanFilter, fetchPeminjaman])

    // Filtered inventaris
    const filtered = useMemo(() => {
        return inventaris.filter(item => {
            const matchSearch = !search || item.nama.toLowerCase().includes(search.toLowerCase()) ||
                item.kode.toLowerCase().includes(search.toLowerCase()) ||
                (item.merk || '').toLowerCase().includes(search.toLowerCase())
            const matchKat = !filterKategori || item.kategori_id === parseInt(filterKategori)
            const matchStatus = !filterStatus || item.status === filterStatus
            return matchSearch && matchKat && matchStatus
        })
    }, [inventaris, search, filterKategori, filterStatus])

    const { page, setPage, totalPages, paginated } = usePagination(filtered, 12)

    // ==================== CRUD HANDLERS ====================

    const handleSaveItem = async (formData) => {
        try {
            if (formData.id) {
                await api.put(`/admin/lab/inventaris/${formData.id}`, formData)
                addToast('success', 'Berhasil', 'Item berhasil diperbarui')
            } else {
                await api.post('/admin/lab/inventaris', formData)
                addToast('success', 'Berhasil', 'Item berhasil ditambahkan')
            }
            setItemModal({ show: false, data: null })
            fetchAll()
        } catch (err) {
            addToast('danger', 'Gagal', err.response?.data?.error || err.message)
        }
    }

    const handleDeleteItem = async (id) => {
        if (!confirm('Yakin ingin menghapus item ini?')) return
        try {
            await api.delete(`/admin/lab/inventaris/${id}`)
            addToast('success', 'Berhasil', 'Item berhasil dihapus')
            fetchAll()
        } catch (err) {
            addToast('danger', 'Gagal', err.response?.data?.error || err.message)
        }
    }

    const handleSaveKategori = async (formData) => {
        try {
            if (formData.id) {
                await api.put(`/admin/lab/kategori/${formData.id}`, formData)
                addToast('success', 'Berhasil', 'Kategori diperbarui')
            } else {
                await api.post('/admin/lab/kategori', formData)
                addToast('success', 'Berhasil', 'Kategori ditambahkan')
            }
            setKategoriModal({ show: false, data: null })
            fetchAll()
        } catch (err) {
            addToast('danger', 'Gagal', err.response?.data?.error || err.message)
        }
    }

    const handleDeleteKategori = async (id) => {
        if (!confirm('Yakin ingin menghapus kategori ini?')) return
        try {
            await api.delete(`/admin/lab/kategori/${id}`)
            addToast('success', 'Berhasil', 'Kategori dihapus')
            fetchAll()
        } catch (err) {
            addToast('danger', 'Gagal', err.response?.data?.error || err.message)
        }
    }

    const handleReturn = async (id, kondisi_kembali) => {
        try {
            await api.put(`/admin/lab/peminjaman/${id}/return`, { kondisi_kembali })
            addToast('success', 'Berhasil', 'Pengembalian berhasil dicatat')
            setReturnModal({ show: false, data: null })
            fetchPeminjaman(peminjamanFilter)
            fetchAll()
        } catch (err) {
            addToast('danger', 'Gagal', err.response?.data?.error || err.message)
        }
    }

    const handleSaveSettings = async (newSettings) => {
        try {
            await api.post('/admin/lab/settings', newSettings)
            setSettings(newSettings)
            addToast('success', 'Berhasil', 'Pengaturan berhasil disimpan')
        } catch (err) {
            addToast('danger', 'Gagal', err.message)
        }
    }

    const handleCreatePeminjaman = async (formData) => {
        try {
            await api.post('/admin/lab/peminjaman', formData)
            addToast('success', 'Berhasil', 'Peminjaman berhasil dicatat')
            setPinjamModal({ show: false })
            fetchPeminjaman(peminjamanFilter)
            fetchAll()
        } catch (err) {
            addToast('danger', 'Gagal', err.response?.data?.error || err.message)
        }
    }

    const formatDate = (d) => {
        if (!d) return '-'
        return new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    }

    const isOverdue = (batas) => {
        if (!batas) return false
        return new Date() > new Date(batas)
    }

    if (loading) {
        return (
            <div className="admin-page animate-fadeIn p-4 d-flex align-items-center justify-content-center" style={{ minHeight: 400 }}>
                <div className="text-center">
                    <div className="spinner-border text-primary mb-3" />
                    <p className="text-muted">Memuat data inventaris...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="admin-page animate-fadeIn p-4">
            {/* Header */}
            <div className="d-flex justify-content-between align-items-center mb-4 bg-white p-4 rounded-4 shadow-sm border">
                <div className="d-flex align-items-center gap-3">
                    <div className="p-3 rounded-3" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff' }}>
                        <Package size={32} />
                    </div>
                    <div>
                        <h2 className="mb-0 fw-bold">Inventaris Lab</h2>
                        <p className="text-muted small mb-0">Kelola peralatan dan peminjaman inventaris laboratorium</p>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="card border-0 shadow-sm rounded-4 mb-4">
                <div className="card-body p-0">
                    <div className="d-flex border-bottom" style={{ overflowX: 'auto' }}>
                        {TABS.map(tab => (
                            <button
                                key={tab.id}
                                className={`btn border-0 rounded-0 px-4 py-3 d-flex align-items-center gap-2 ${activeTab === tab.id ? 'text-primary fw-bold' : 'text-muted'}`}
                                style={{
                                    borderBottom: activeTab === tab.id ? '3px solid var(--primary-500)' : '3px solid transparent',
                                    transition: 'all 0.2s', whiteSpace: 'nowrap', minWidth: 'fit-content'
                                }}
                                onClick={() => setActiveTab(tab.id)}
                            >
                                <tab.icon size={18} /> {tab.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Tab Content */}
            {activeTab === 'dashboard' && <DashboardTab dashboard={dashboard} formatDate={formatDate} />}
            {activeTab === 'inventaris' && (
                <InventarisTab
                    paginated={paginated} filtered={filtered} kategori={kategori}
                    search={search} setSearch={setSearch}
                    filterKategori={filterKategori} setFilterKategori={setFilterKategori}
                    filterStatus={filterStatus} setFilterStatus={setFilterStatus}
                    page={page} setPage={setPage} totalPages={totalPages}
                    onAdd={() => setItemModal({ show: true, data: null })}
                    onEdit={(item) => setItemModal({ show: true, data: item })}
                    onDelete={handleDeleteItem}
                    formatDate={formatDate}
                />
            )}
            {activeTab === 'peminjaman' && (
                <PeminjamanTab
                    peminjaman={peminjaman} peminjamanFilter={peminjamanFilter}
                    setPeminjamanFilter={setPeminjamanFilter}
                    onReturn={(item) => setReturnModal({ show: true, data: item })}
                    onAdd={() => setPinjamModal({ show: true })}
                    formatDate={formatDate} isOverdue={isOverdue}
                />
            )}
            {activeTab === 'pengaturan' && (
                <PengaturanTab
                    settings={settings} kategori={kategori}
                    onSaveSettings={handleSaveSettings}
                    onAddKategori={() => setKategoriModal({ show: true, data: null })}
                    onEditKategori={(k) => setKategoriModal({ show: true, data: k })}
                    onDeleteKategori={handleDeleteKategori}
                />
            )}

            {/* Modals */}
            {itemModal.show && (
                <ItemModal data={itemModal.data} kategori={kategori} onSave={handleSaveItem} onClose={() => setItemModal({ show: false, data: null })} />
            )}
            {kategoriModal.show && (
                <KategoriModal data={kategoriModal.data} onSave={handleSaveKategori} onClose={() => setKategoriModal({ show: false, data: null })} />
            )}
            {returnModal.show && (
                <ReturnModal data={returnModal.data} onReturn={handleReturn} onClose={() => setReturnModal({ show: false, data: null })} />
            )}
            {pinjamModal.show && (
                <PinjamManualModal inventaris={inventaris.filter(i => i.status === 'tersedia')} students={students} onSave={handleCreatePeminjaman} onClose={() => setPinjamModal({ show: false })} />
            )}
        </div>
    )
}

// ==================== DASHBOARD TAB ====================
function DashboardTab({ dashboard, formatDate }) {
    if (!dashboard) return null
    const { stats, topItems, overdueList, stockData } = dashboard

    const statCards = [
        { label: 'Total Item', value: stats.total, icon: Package, bg: '#6366f1', color: '#fff' },
        { label: 'Tersedia', value: stats.tersedia, icon: CheckCircle, bg: '#10b981', color: '#fff' },
        { label: 'Dipinjam', value: stats.dipinjam, icon: ArrowLeftRight, bg: '#f59e0b', color: '#fff' },
        { label: 'Terlambat', value: stats.overdue, icon: AlertTriangle, bg: '#ef4444', color: '#fff' },
        { label: 'Maintenance', value: stats.maintenance, icon: Wrench, bg: '#6b7280', color: '#fff' },
        { label: 'Total Peminjaman', value: stats.totalPeminjaman, icon: TrendingUp, bg: '#3b82f6', color: '#fff' },
    ]

    return (
        <div>
            {/* Stat Cards */}
            <div className="row g-3 mb-4">
                {statCards.map((s, i) => (
                    <div key={i} className="col-6 col-md-4 col-lg-2">
                        <div className="card border-0 shadow-sm rounded-4 h-100 overflow-hidden" style={{ transition: 'transform 0.2s' }}
                            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-4px)'}
                            onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                        >
                            <div className="card-body p-3 text-center">
                                <div className="d-inline-flex p-2 rounded-3 mb-2" style={{ background: s.bg, color: s.color }}>
                                    <s.icon size={20} />
                                </div>
                                <div className="fw-black fs-3">{s.value}</div>
                                <div className="text-muted small">{s.label}</div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Stock Levels */}
            <div className="row mb-4">
                <div className="col-12">
                    <div className="card border-0 shadow-sm rounded-4">
                        <div className="card-header bg-transparent border-0 pt-4 px-4 pb-0">
                            <h6 className="fw-bold d-flex align-items-center gap-2"><Package size={18} className="text-primary" /> Analitik Stok Barang</h6>
                        </div>
                        <div className="card-body px-4 pb-4">
                            <div className="row g-3">
                                {stockData?.map((item, i) => {
                                    const percent = (item.tersedia / item.total) * 100
                                    const isLow = item.tersedia <= 1 && item.total > 1
                                    return (
                                        <div key={i} className="col-md-6 col-lg-4">
                                            <div className="p-3 border rounded-3 bg-light-subtle">
                                                <div className="d-flex justify-content-between align-items-start mb-2">
                                                    <div>
                                                        <div className="fw-bold">{item.nama}</div>
                                                        <div className="text-muted small">Limit Pinjam: {item.limit_pinjam} per siswa</div>
                                                    </div>
                                                    <span className={`badge ${isLow ? 'bg-danger' : 'bg-success'}`}>{item.tersedia} / {item.total}</span>
                                                </div>
                                                <div className="progress" style={{ height: 6 }}>
                                                    <div className={`progress-bar ${isLow ? 'bg-danger' : 'bg-success'}`} style={{ width: `${percent}%` }}></div>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                }) || <p className="text-muted text-center py-3">Belum ada data stok</p>}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="row g-4">
                {/* Top Items */}
                <div className="col-md-6">
                    <div className="card border-0 shadow-sm rounded-4 h-100">
                        <div className="card-header bg-transparent border-0 pt-4 px-4 pb-0">
                            <h6 className="fw-bold d-flex align-items-center gap-2"><TrendingUp size={18} className="text-primary" /> Item Paling Sering Dipinjam</h6>
                        </div>
                        <div className="card-body px-4">
                            {topItems.length === 0 ? (
                                <p className="text-muted text-center py-3">Belum ada data peminjaman</p>
                            ) : topItems.map((item, i) => (
                                <div key={i} className="d-flex align-items-center gap-3 py-2 border-bottom" style={{ borderColor: '#f1f5f9 !important' }}>
                                    <div className="fw-bold text-muted" style={{ width: 24 }}>#{i + 1}</div>
                                    <div className="flex-grow-1">
                                        <div className="fw-semibold">{item.nama}</div>
                                        <div className="text-muted small">{item.kode}</div>
                                    </div>
                                    <span className="badge bg-primary-100 text-primary-700 rounded-pill px-3">{item.total_pinjam}x</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Overdue Items */}
                <div className="col-md-6">
                    <div className="card border-0 shadow-sm rounded-4 h-100">
                        <div className="card-header bg-transparent border-0 pt-4 px-4 pb-0">
                            <h6 className="fw-bold d-flex align-items-center gap-2"><AlertTriangle size={18} className="text-danger" /> Peminjaman Terlambat</h6>
                        </div>
                        <div className="card-body px-4">
                            {overdueList.length === 0 ? (
                                <div className="text-center py-4">
                                    <CheckCircle size={40} className="text-success mb-2" style={{ opacity: 0.5 }} />
                                    <p className="text-muted">Tidak ada peminjaman terlambat 🎉</p>
                                </div>
                            ) : overdueList.map((item, i) => (
                                <div key={i} className="d-flex align-items-center gap-3 py-2 border-bottom">
                                    <div className="p-2 rounded-2" style={{ background: '#fee2e2' }}>
                                        <AlertTriangle size={16} className="text-danger" />
                                    </div>
                                    <div className="flex-grow-1">
                                        <div className="fw-semibold">{item.siswa_nama} <span className="text-muted fw-normal small">• {item.kelas_nama}</span></div>
                                        <div className="text-muted small">{item.inventaris_kode} — {item.inventaris_nama}</div>
                                    </div>
                                    <div className="text-end">
                                        <div className="text-danger small fw-bold">Batas: {formatDate(item.batas_kembali)}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

// ==================== INVENTARIS TAB ====================
function InventarisTab({ paginated, filtered, kategori, search, setSearch, filterKategori, setFilterKategori, filterStatus, setFilterStatus, page, setPage, totalPages, onAdd, onEdit, onDelete }) {
    return (
        <div>
            {/* Toolbar */}
            <div className="card border-0 shadow-sm rounded-4 mb-4">
                <div className="card-body p-4">
                    <div className="row g-3 align-items-end">
                        <div className="col-md-4">
                            <div className="position-relative">
                                <Search className="position-absolute top-50 translate-middle-y ms-3 text-muted" size={18} />
                                <input type="text" placeholder="Cari nama, kode, merk..." className="form-control ps-5 py-2 rounded-3 border-light bg-light" value={search} onChange={e => setSearch(e.target.value)} />
                            </div>
                        </div>
                        <div className="col-md-3">
                            <select className="form-select py-2 rounded-3 border-light bg-light" value={filterKategori} onChange={e => setFilterKategori(e.target.value)}>
                                <option value="">Semua Kategori</option>
                                {kategori.map(k => <option key={k.id} value={k.id}>{k.icon} {k.nama}</option>)}
                            </select>
                        </div>
                        <div className="col-md-3">
                            <select className="form-select py-2 rounded-3 border-light bg-light" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                                <option value="">Semua Status</option>
                                <option value="tersedia">Tersedia</option>
                                <option value="dipinjam">Dipinjam</option>
                                <option value="maintenance">Maintenance</option>
                            </select>
                        </div>
                        <div className="col-md-2">
                            <button className="btn btn-primary w-100 py-2 rounded-3 d-flex align-items-center justify-content-center gap-2" onClick={onAdd}>
                                <Plus size={18} /> Tambah
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Table */}
            {filtered.length === 0 ? (
                <EmptyState icon={Package} title="Belum Ada Inventaris" message="Tambahkan item inventaris untuk memulai." />
            ) : (
                <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
                    <div className="table-responsive">
                        <table className="table table-hover align-middle mb-0">
                            <thead className="bg-light">
                                <tr>
                                    <th className="px-4 py-3">Kode</th>
                                    <th className="py-3">Nama Item</th>
                                    <th className="py-3">Kategori</th>
                                    <th className="py-3 text-center">Max Pinjam</th>
                                    <th className="py-3 text-center">Durasi</th>
                                    <th className="py-3 text-center">Kondisi</th>
                                    <th className="py-3 text-center">Status</th>
                                    <th className="py-3">Peminjam</th>
                                    <th className="py-3 text-end px-4">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginated.map(item => {
                                    const sBadge = STATUS_BADGE[item.status] || STATUS_BADGE.tersedia
                                    const kBadge = KONDISI_BADGE[item.kondisi] || KONDISI_BADGE.baik
                                    return (
                                        <tr key={item.id}>
                                            <td className="px-4">
                                                <span className="badge bg-light text-dark font-mono fw-bold border">{item.kode}</span>
                                            </td>
                                            <td>
                                                <div className="fw-bold">{item.nama}</div>
                                                {item.merk && <div className="text-muted small">{item.merk}</div>}
                                            </td>
                                            <td>
                                                <span>{item.kategori_icon} {item.kategori_nama}</span>
                                            </td>
                                            <td className="text-center">
                                                <span className="fw-bold">{item.max_pinjam_per_siswa || 1}</span>
                                            </td>
                                            <td className="text-center">
                                                <span className="small fw-semibold">
                                                    {item.durasi_tipe === 'akhir_hari' ? 'Selesai Sekolah' : `${item.durasi_pinjam} ${item.durasi_tipe === 'hari' ? 'Hari' : 'Jam Pel.'}`}
                                                </span>
                                            </td>
                                            <td className="text-center">
                                                <span className="badge rounded-pill px-3 py-1" style={{ background: kBadge.bg, color: kBadge.color }}>{kBadge.label}</span>
                                            </td>
                                            <td className="text-center">
                                                <span className="badge rounded-pill px-3 py-1" style={{ background: sBadge.bg, color: sBadge.color }}>{sBadge.label}</span>
                                            </td>
                                            <td>
                                                {item.peminjam_nama ? (
                                                    <div>
                                                        <div className="fw-semibold small">{item.peminjam_nama}</div>
                                                        <div className="text-muted small">{item.peminjam_kelas || '-'}</div>
                                                    </div>
                                                ) : (<span className="text-muted small">—</span>)}
                                            </td>
                                            <td className="text-end px-4">
                                                <div className="d-flex gap-1 justify-content-end">
                                                    <button className="btn btn-sm btn-light rounded-2" title="Edit" onClick={() => onEdit(item)}><Edit2 size={14} /></button>
                                                    <button className="btn btn-sm btn-light rounded-2 text-danger" title="Hapus" onClick={() => onDelete(item.id)}><Trash2 size={14} /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                    {totalPages > 1 && (
                        <div className="card-footer bg-transparent border-0 d-flex justify-content-between align-items-center p-3">
                            <span className="text-muted small">{filtered.length} item</span>
                            <div className="d-flex gap-1">
                                {Array.from({ length: totalPages }, (_, i) => (
                                    <button key={i} className={`btn btn-sm ${page === i + 1 ? 'btn-primary' : 'btn-light'} rounded-2`} onClick={() => setPage(i + 1)}>{i + 1}</button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

// ==================== PEMINJAMAN TAB ====================
function PeminjamanTab({ peminjaman, peminjamanFilter, setPeminjamanFilter, onReturn, onAdd, formatDate, isOverdue }) {
    return (
        <div>
            <div className="d-flex gap-2 mb-4 flex-wrap">
                <button className={`btn rounded-pill px-4 ${peminjamanFilter === 'aktif' ? 'btn-primary' : 'btn-light'}`} onClick={() => setPeminjamanFilter('aktif')}>
                    <Clock size={16} className="me-1" /> Aktif
                </button>
                <button className={`btn rounded-pill px-4 ${peminjamanFilter === 'riwayat' ? 'btn-primary' : 'btn-light'}`} onClick={() => setPeminjamanFilter('riwayat')}>
                    <FileText size={16} className="me-1" /> Riwayat
                </button>
                <div className="flex-grow-1" />
                <button className="btn btn-primary rounded-pill px-4" onClick={onAdd}>
                    <Plus size={16} className="me-1" /> Peminjaman Manual
                </button>
            </div>

            {peminjaman.length === 0 ? (
                <EmptyState icon={ArrowLeftRight} title="Belum Ada Data" message={peminjamanFilter === 'aktif' ? 'Tidak ada peminjaman aktif saat ini.' : 'Belum ada riwayat peminjaman.'} />
            ) : (
                <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
                    <div className="table-responsive">
                        <table className="table table-hover align-middle mb-0">
                            <thead className="bg-light">
                                <tr>
                                    <th className="px-4 py-3">Siswa</th>
                                    <th className="py-3">Item</th>
                                    <th className="py-3">Waktu Pinjam</th>
                                    <th className="py-3">Batas Kembali</th>
                                    <th className="py-3 text-center">Status</th>
                                    {peminjamanFilter === 'riwayat' && <th className="py-3">Waktu Kembali</th>}
                                    {peminjamanFilter === 'aktif' && <th className="py-3 text-end px-4">Aksi</th>}
                                </tr>
                            </thead>
                            <tbody>
                                {peminjaman.map(p => {
                                    const overdue = p.status === 'dipinjam' && isOverdue(p.batas_kembali)
                                    const badge = overdue ? { bg: '#fee2e2', color: '#991b1b', label: 'Terlambat!' } : (PINJAM_STATUS[p.status] || PINJAM_STATUS.dipinjam)
                                    return (
                                        <tr key={p.id} style={overdue ? { background: '#fff5f5' } : {}}>
                                            <td className="px-4">
                                                <div className="fw-bold">{p.siswa_nama}</div>
                                                <div className="text-muted small">{p.kelas_nama || '-'} • {p.siswa_nisn}</div>
                                            </td>
                                            <td>
                                                <div className="fw-semibold">{p.kategori_icon} {p.inventaris_nama}</div>
                                                <div className="text-muted small">{p.inventaris_kode} {p.inventaris_merk ? `• ${p.inventaris_merk}` : ''}</div>
                                            </td>
                                            <td><span className="small">{formatDate(p.tanggal_pinjam)}</span></td>
                                            <td>
                                                <span className={`small ${overdue ? 'text-danger fw-bold' : ''}`}>
                                                    {overdue && <AlertTriangle size={14} className="me-1" />}
                                                    {formatDate(p.batas_kembali)}
                                                </span>
                                            </td>
                                            <td className="text-center">
                                                <span className="badge rounded-pill px-3 py-1" style={{ background: badge.bg, color: badge.color }}>{badge.label}</span>
                                            </td>
                                            {peminjamanFilter === 'riwayat' && <td><span className="small">{formatDate(p.tanggal_kembali)}</span></td>}
                                            {peminjamanFilter === 'aktif' && (
                                                <td className="text-end px-4">
                                                    <button className="btn btn-sm btn-outline-success rounded-pill px-3" onClick={() => onReturn(p)}>
                                                        <RotateCcw size={14} className="me-1" /> Kembalikan
                                                    </button>
                                                </td>
                                            )}
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    )
}

// ==================== PENGATURAN TAB ====================
function PengaturanTab({ settings, kategori, onSaveSettings, onAddKategori, onEditKategori, onDeleteKategori }) {
    const [form, setForm] = useState({
        batas_pinjam_hari: settings.batas_pinjam_hari || '1',
        max_pinjam_per_siswa: settings.max_pinjam_per_siswa || '5',
        wa_notification_enabled: settings.wa_notification_enabled || 'false',
        wa_template_pinjam: settings.wa_template_pinjam || '',
        wa_template_kembali: settings.wa_template_kembali || '',
    })

    return (
        <div className="row g-4">
            {/* Settings */}
            <div className="col-md-6">
                <div className="card border-0 shadow-sm rounded-4">
                    <div className="card-header bg-transparent border-0 pt-4 px-4 pb-0">
                        <h6 className="fw-bold">⚙️ Pengaturan Umum</h6>
                    </div>
                    <div className="card-body px-4 pb-4">
                        <div className="mb-3">
                            <label className="form-label fw-semibold small">Batas Pinjam (Hari)</label>
                            <input type="number" className="form-control rounded-3" min="1" value={form.batas_pinjam_hari} onChange={e => setForm({ ...form, batas_pinjam_hari: e.target.value })} />
                        </div>
                        <div className="mb-3">
                            <label className="form-label fw-semibold small">Maks. Item per Siswa</label>
                            <input type="number" className="form-control rounded-3" min="1" value={form.max_pinjam_per_siswa} onChange={e => setForm({ ...form, max_pinjam_per_siswa: e.target.value })} />
                        </div>
                        <div className="mb-3">
                            <label className="form-label fw-semibold small">Notifikasi WhatsApp</label>
                            <select className="form-select rounded-3" value={form.wa_notification_enabled} onChange={e => setForm({ ...form, wa_notification_enabled: e.target.value })}>
                                <option value="false">Nonaktif</option>
                                <option value="true">Aktif</option>
                            </select>
                        </div>
                        {form.wa_notification_enabled === 'true' && (
                            <>
                                <div className="mb-3">
                                    <label className="form-label fw-semibold small">Template WA Peminjaman</label>
                                    <textarea className="form-control rounded-3" rows={4} value={form.wa_template_pinjam} onChange={e => setForm({ ...form, wa_template_pinjam: e.target.value })} />
                                    <div className="form-text">Variabel: [nama], [item], [kode], [waktu], [batas]</div>
                                </div>
                                <div className="mb-3">
                                    <label className="form-label fw-semibold small">Template WA Pengembalian</label>
                                    <textarea className="form-control rounded-3" rows={4} value={form.wa_template_kembali} onChange={e => setForm({ ...form, wa_template_kembali: e.target.value })} />
                                    <div className="form-text">Variabel: [nama], [item], [kode], [waktu]</div>
                                </div>
                            </>
                        )}
                        <button className="btn btn-primary rounded-3 w-100 py-2" onClick={() => onSaveSettings(form)}>Simpan Pengaturan</button>
                    </div>
                </div>
            </div>

            {/* Kategori Management */}
            <div className="col-md-6">
                <div className="card border-0 shadow-sm rounded-4">
                    <div className="card-header bg-transparent border-0 pt-4 px-4 pb-0 d-flex justify-content-between align-items-center">
                        <h6 className="fw-bold mb-0">📂 Kategori Inventaris</h6>
                        <button className="btn btn-sm btn-primary rounded-pill px-3" onClick={onAddKategori}>
                            <Plus size={14} className="me-1" /> Tambah
                        </button>
                    </div>
                    <div className="card-body px-4 pb-4">
                        {kategori.length === 0 ? (
                            <p className="text-muted text-center py-3">Belum ada kategori</p>
                        ) : kategori.map(k => (
                            <div key={k.id} className="d-flex align-items-center gap-3 py-2 border-bottom">
                                <span style={{ fontSize: '1.5rem' }}>{k.icon}</span>
                                <div className="flex-grow-1">
                                    <div className="fw-semibold">{k.nama}</div>
                                    <div className="text-muted small">{k.item_count || 0} item{k.deskripsi ? ` • ${k.deskripsi}` : ''}</div>
                                </div>
                                <div className="d-flex gap-1">
                                    <button className="btn btn-sm btn-light rounded-2" onClick={() => onEditKategori(k)}><Edit2 size={14} /></button>
                                    <button className="btn btn-sm btn-light rounded-2 text-danger" onClick={() => onDeleteKategori(k.id)}><Trash2 size={14} /></button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}

// ==================== MODALS ====================

function ModalWrapper({ title, onClose, children, width = 600 }) {
    return (
        <div className="modal-backdrop fade show" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1050 }}>
            <div className="bg-white rounded-4 shadow-2xl border animate-bounceIn" style={{ maxWidth: width, width: '95%', maxHeight: '90vh', overflow: 'auto' }}>
                <div className="d-flex justify-content-between align-items-center p-4 border-bottom">
                    <h5 className="fw-bold mb-0">{title}</h5>
                    <button className="btn btn-sm btn-light rounded-circle" onClick={onClose}><X size={18} /></button>
                </div>
                <div className="p-4">{children}</div>
            </div>
        </div>
    )
}

function ItemModal({ data, kategori, onSave, onClose }) {
    const [form, setForm] = useState({
        id: data?.id || null,
        kategori_id: data?.kategori_id || (kategori[0]?.id || ''),
        kode: data?.kode || '',
        nama: data?.nama || '',
        merk: data?.merk || '',
        spesifikasi: data?.spesifikasi || '',
        kondisi: data?.kondisi || 'baik',
        status: data?.status || 'tersedia',
        lokasi: data?.lokasi || '',
        nilai_aset: data?.nilai_aset || '',
        tanggal_perolehan: data?.tanggal_perolehan ? data.tanggal_perolehan.split('T')[0] : '',
        catatan: data?.catatan || '',
        max_pinjam_per_siswa: data?.max_pinjam_per_siswa || 1,
        durasi_pinjam: data?.durasi_pinjam || 1,
        durasi_tipe: data?.durasi_tipe || 'hari',
    })

    const handleSubmit = (e) => { e.preventDefault(); onSave(form) }

    return (
        <ModalWrapper title={data ? 'Edit Item Inventaris' : 'Tambah Item Inventaris'} onClose={onClose}>
            <form onSubmit={handleSubmit}>
                <div className="row g-3">
                    <div className="col-md-6">
                        <label className="form-label small fw-semibold">Kode <span className="text-danger">*</span></label>
                        <input type="text" className="form-control rounded-3" placeholder="CAM-001" value={form.kode} onChange={e => setForm({ ...form, kode: e.target.value })} required />
                    </div>
                    <div className="col-md-6">
                        <label className="form-label small fw-semibold">Kategori <span className="text-danger">*</span></label>
                        <select className="form-select rounded-3" value={form.kategori_id} onChange={e => setForm({ ...form, kategori_id: e.target.value })} required>
                            <option value="">Pilih Kategori</option>
                            {kategori.map(k => <option key={k.id} value={k.id}>{k.icon} {k.nama}</option>)}
                        </select>
                    </div>
                    <div className="col-12">
                        <label className="form-label small fw-semibold">Nama Item <span className="text-danger">*</span></label>
                        <input type="text" className="form-control rounded-3" placeholder="Canon EOS 90D" value={form.nama} onChange={e => setForm({ ...form, nama: e.target.value })} required />
                    </div>
                    <div className="col-md-6">
                        <label className="form-label small fw-semibold">Merk</label>
                        <input type="text" className="form-control rounded-3" value={form.merk} onChange={e => setForm({ ...form, merk: e.target.value })} />
                    </div>
                    <div className="col-md-6">
                        <label className="form-label small fw-semibold">Lokasi</label>
                        <input type="text" className="form-control rounded-3" placeholder="Lab DKV Lt. 2" value={form.lokasi} onChange={e => setForm({ ...form, lokasi: e.target.value })} />
                    </div>
                    <div className="col-md-4">
                        <label className="form-label small fw-semibold">Kondisi</label>
                        <select className="form-select rounded-3" value={form.kondisi} onChange={e => setForm({ ...form, kondisi: e.target.value })}>
                            <option value="baik">Baik</option>
                            <option value="rusak_ringan">Rusak Ringan</option>
                            <option value="rusak_berat">Rusak Berat</option>
                        </select>
                    </div>
                    <div className="col-md-4">
                        <label className="form-label small fw-semibold">Nilai Aset (Rp)</label>
                        <input type="number" className="form-control rounded-3" value={form.nilai_aset} onChange={e => setForm({ ...form, nilai_aset: e.target.value })} />
                    </div>
                    <div className="col-md-4">
                        <label className="form-label small fw-semibold">Tgl Perolehan</label>
                        <input type="date" className="form-control rounded-3" value={form.tanggal_perolehan} onChange={e => setForm({ ...form, tanggal_perolehan: e.target.value })} />
                    </div>
                    <div className="col-md-4">
                        <label className="form-label small fw-semibold">Maks. Pinjam/Siswa</label>
                        <input type="number" className="form-control rounded-3" min="1" value={form.max_pinjam_per_siswa} onChange={e => setForm({ ...form, max_pinjam_per_siswa: e.target.value })} />
                    </div>
                    <div className="col-md-4">
                        <label className="form-label small fw-semibold">Durasi Pinjam</label>
                        <div className="input-group">
                            <input
                                type="number" className="form-control rounded-start-3" min="1"
                                value={form.durasi_pinjam} onChange={e => setForm({ ...form, durasi_pinjam: e.target.value })}
                                disabled={form.durasi_tipe === 'akhir_hari'}
                            />
                            <select className="form-select rounded-end-3" value={form.durasi_tipe} onChange={e => setForm({ ...form, durasi_tipe: e.target.value })}>
                                <option value="hari">Hari</option>
                                <option value="jam_pelajaran">Jam Pel.</option>
                                <option value="akhir_hari">Hingga Pulang Sekolah</option>
                            </select>
                        </div>
                    </div>
                    <div className="col-12">
                        <label className="form-label small fw-semibold">Spesifikasi</label>
                        <textarea className="form-control rounded-3" rows={2} value={form.spesifikasi} onChange={e => setForm({ ...form, spesifikasi: e.target.value })} />
                    </div>
                    <div className="col-12">
                        <label className="form-label small fw-semibold">Catatan</label>
                        <textarea className="form-control rounded-3" rows={2} value={form.catatan} onChange={e => setForm({ ...form, catatan: e.target.value })} />
                    </div>
                </div>
                <div className="d-flex gap-2 mt-4">
                    <button type="button" className="btn btn-light py-2 flex-grow-1 rounded-3" onClick={onClose}>Batal</button>
                    <button type="submit" className="btn btn-primary py-2 flex-grow-1 rounded-3">{data ? 'Simpan Perubahan' : 'Tambah Item'}</button>
                </div>
            </form>
        </ModalWrapper>
    )
}

function KategoriModal({ data, onSave, onClose }) {
    const [form, setForm] = useState({
        id: data?.id || null,
        nama: data?.nama || '',
        icon: data?.icon || '📦',
        deskripsi: data?.deskripsi || '',
    })
    const handleSubmit = (e) => { e.preventDefault(); onSave(form) }

    const emojiOptions = ['📦', '📷', '🔍', '🖊️', '💻', '🎨', '🎬', '🎤', '📱', '⌨️', '🖥️', '🖨️', '🔧', '📐', '🎭']

    return (
        <ModalWrapper title={data ? 'Edit Kategori' : 'Tambah Kategori'} onClose={onClose} width={450}>
            <form onSubmit={handleSubmit}>
                <div className="mb-3">
                    <label className="form-label small fw-semibold">Icon</label>
                    <div className="d-flex flex-wrap gap-2">
                        {emojiOptions.map(e => (
                            <button key={e} type="button" className={`btn rounded-3 p-2 ${form.icon === e ? 'btn-primary' : 'btn-light'}`} style={{ fontSize: '1.3rem', width: 44, height: 44 }} onClick={() => setForm({ ...form, icon: e })}>{e}</button>
                        ))}
                    </div>
                </div>
                <div className="mb-3">
                    <label className="form-label small fw-semibold">Nama Kategori <span className="text-danger">*</span></label>
                    <input type="text" className="form-control rounded-3" value={form.nama} onChange={e => setForm({ ...form, nama: e.target.value })} required />
                </div>
                <div className="mb-3">
                    <label className="form-label small fw-semibold">Deskripsi</label>
                    <textarea className="form-control rounded-3" rows={2} value={form.deskripsi} onChange={e => setForm({ ...form, deskripsi: e.target.value })} />
                </div>
                <div className="d-flex gap-2">
                    <button type="button" className="btn btn-light py-2 flex-grow-1 rounded-3" onClick={onClose}>Batal</button>
                    <button type="submit" className="btn btn-primary py-2 flex-grow-1 rounded-3">Simpan</button>
                </div>
            </form>
        </ModalWrapper>
    )
}

function ReturnModal({ data, onReturn, onClose }) {
    const [kondisi, setKondisi] = useState(data?.kondisi_pinjam || 'baik')

    return (
        <ModalWrapper title="Pengembalian Item" onClose={onClose} width={450}>
            <div className="text-center mb-4">
                <div className="p-3 bg-success-100 text-success-700 rounded-circle d-inline-block mb-3">
                    <RotateCcw size={40} />
                </div>
                <h5 className="fw-bold">{data?.inventaris_nama}</h5>
                <p className="text-muted">{data?.inventaris_kode} • Dipinjam oleh {data?.siswa_nama}</p>
            </div>
            <div className="mb-4">
                <label className="form-label small fw-semibold">Kondisi Saat Dikembalikan</label>
                <select className="form-select rounded-3" value={kondisi} onChange={e => setKondisi(e.target.value)}>
                    <option value="baik">✅ Baik</option>
                    <option value="rusak_ringan">⚠️ Rusak Ringan</option>
                    <option value="rusak_berat">❌ Rusak Berat</option>
                </select>
            </div>
            <div className="d-flex gap-2">
                <button className="btn btn-light py-2 flex-grow-1 rounded-3" onClick={onClose}>Batal</button>
                <button className="btn btn-success py-2 flex-grow-1 rounded-3" onClick={() => onReturn(data.id, kondisi)}>Konfirmasi Pengembalian</button>
            </div>
        </ModalWrapper>
    )
}

function PinjamManualModal({ inventaris, students, onSave, onClose }) {
    const [form, setForm] = useState({ inventaris_id: '', siswa_id: '', catatan: '' })
    const [searchSiswa, setSearchSiswa] = useState('')

    const filteredSiswa = useMemo(() => {
        if (!searchSiswa) return (students || []).slice(0, 20)
        return (students || []).filter(s =>
            s.nama.toLowerCase().includes(searchSiswa.toLowerCase()) ||
            (s.nisn || '').includes(searchSiswa)
        ).slice(0, 20)
    }, [students, searchSiswa])

    const handleSubmit = (e) => {
        e.preventDefault()
        if (!form.inventaris_id || !form.siswa_id) return
        onSave(form)
    }

    return (
        <ModalWrapper title="Peminjaman Manual" onClose={onClose}>
            <form onSubmit={handleSubmit}>
                <div className="mb-3">
                    <label className="form-label small fw-semibold">Item Inventaris <span className="text-danger">*</span></label>
                    <select className="form-select rounded-3" value={form.inventaris_id} onChange={e => setForm({ ...form, inventaris_id: e.target.value })} required>
                        <option value="">Pilih item...</option>
                        {inventaris.map(i => <option key={i.id} value={i.id}>{i.kode} — {i.nama}</option>)}
                    </select>
                </div>
                <div className="mb-3">
                    <label className="form-label small fw-semibold">Siswa <span className="text-danger">*</span></label>
                    <input type="text" className="form-control rounded-3 mb-2" placeholder="Cari nama / NISN..." value={searchSiswa} onChange={e => setSearchSiswa(e.target.value)} />
                    <select className="form-select rounded-3" size={5} value={form.siswa_id} onChange={e => setForm({ ...form, siswa_id: e.target.value })} required>
                        {filteredSiswa.map(s => <option key={s.id} value={s.id}>{s.nama} • {s.nisn} • {s.kelas}</option>)}
                    </select>
                </div>
                <div className="mb-3">
                    <label className="form-label small fw-semibold">Catatan</label>
                    <textarea className="form-control rounded-3" rows={2} value={form.catatan} onChange={e => setForm({ ...form, catatan: e.target.value })} />
                </div>
                <div className="d-flex gap-2">
                    <button type="button" className="btn btn-light py-2 flex-grow-1 rounded-3" onClick={onClose}>Batal</button>
                    <button type="submit" className="btn btn-primary py-2 flex-grow-1 rounded-3">Catat Peminjaman</button>
                </div>
            </form>
        </ModalWrapper>
    )
}
