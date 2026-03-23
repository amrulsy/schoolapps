import { useState, useEffect } from 'react'
import { API_BASE, getAuthHeaders } from '../../services/api'
import LoadingSpinner from '../../components/LoadingSpinner'
import { PlusCircle, Search, PiggyBank, ArrowDownCircle, ArrowUpCircle, Wallet, TrendingUp, TrendingDown, X, BarChart as BarChartIcon, ChevronLeft, ChevronRight, FileText, Download, User, CheckCircle } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'

// Custom style for hover effects
const styles = /*css*/`
  .bank-mini-header {
    background: #fff;
    padding: 24px 32px;
    border-radius: 32px;
    border: 1px solid rgba(0,0,0,0.05);
    box-shadow: 0 10px 30px rgba(0,0,0,0.02);
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 32px;
  }
  .stat-card-premium {
    border: none;
    border-radius: 32px;
    overflow: hidden;
    height: 100%;
    transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
    position: relative;
  }
  .stat-card-premium:hover {
    transform: translateY(-8px);
    box-shadow: 0 20px 40px rgba(0,0,0,0.1);
  }
  .card-glass-layer {
    background: linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.02));
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 28px;
    height: 100%;
    width: 100%;
    padding: 32px;
    position: relative;
    z-index: 1;
  }
  .activity-item {
    padding: 12px 0;
    border-bottom: 1px solid rgba(0,0,0,0.03);
    transition: all 0.2s;
  }
  .activity-item:last-child { border-bottom: none; }
  .activity-item:hover { background: rgba(0,0,0,0.01); transform: translateX(4px); }
  
  .filter-pill {
    padding: 8px 16px;
    border-radius: 12px;
    font-size: 0.85rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    border: 1px solid transparent;
    background: #f8fafc;
    color: #64748b;
  }
  .filter-pill.active {
    background: #1e293b;
    color: #fff;
  }
  .filter-pill:hover:not(.active) {
    background: #f1f5f9;
    color: #1e293b;
  }
  
  .quick-action-btn {
    width: 32px;
    height: 32px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
  }
  .quick-action-btn:hover { transform: scale(1.1); }

  /* Skeleton Keyframes */
  @keyframes shimmer {
    0% { background-position: -468px 0; }
    100% { background-position: 468px 0; }
  }
  .skeleton {
    background: #f6f7f8;
    background-image: linear-gradient(to right, #f6f7f8 0%, #edeef1 20%, #f6f7f8 40%, #f6f7f8 100%);
    background-repeat: no-repeat;
    background-size: 800px 104px;
    display: inline-block;
    position: relative;
    animation: shimmer 1s linear infinite forwards;
  }
  .btn-primary:active, .btn-light:active, .segmented-item:active {
    transform: scale(0.96);
  }

  .nominal-input-container {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .nominal-input-container:focus-within {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.05);
  }

  .step-container {
    display: flex;
    width: 200%;
    transition: transform 0.5s cubic-bezier(0.16, 1, 0.3, 1);
  }

  .step-content {
    width: 50%;
    flex-shrink: 0;
  }
`;

export default function TabunganPage() {
    const [summary, setSummary] = useState([])
    const [siswaList, setSiswaList] = useState([])
    const [transactions, setTransactions] = useState([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [filterClass, setFilterClass] = useState('ALL')
    const [filterStatus, setFilterStatus] = useState('ALL')
    const [showModal, setShowModal] = useState(false)
    const [formData, setFormData] = useState({ siswa_id: '', tipe: 'setor', nominal: '', note: '' })
    const [modalSearch, setModalSearch] = useState('')
    const [submitLoading, setSubmitLoading] = useState(false)
    const [showConfirm, setShowConfirm] = useState(false)

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1)
    const itemsPerPage = 8

    // History Modal state
    const [showHistoryModal, setShowHistoryModal] = useState(false)
    const [selectedHistorySiswa, setSelectedHistorySiswa] = useState(null)

    // Custom Select state
    const [showSelectDropdown, setShowSelectDropdown] = useState(false)

    const fetchData = async (signal) => {
        setLoading(true)
        try {
            const headers = getAuthHeaders()
            const [sumRes, siswaRes, transRes] = await Promise.all([
                fetch(`${API_BASE}/admin/tabungan/summary`, { headers, signal }),
                fetch(`${API_BASE}/siswa`, { headers, signal }),
                fetch(`${API_BASE}/admin/tabungan`, { headers, signal })
            ])

            if (sumRes.ok) setSummary(await sumRes.json())
            if (siswaRes.ok) setSiswaList(await siswaRes.json())
            if (transRes.ok) setTransactions(await transRes.json())
        } catch (err) {
            if (err.name !== 'AbortError') {
                console.error(err)
            }
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        const controller = new AbortController()
        fetchData(controller.signal)
        return () => controller.abort()
    }, [])

    const formatRupiah = (n) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n || 0)

    // Unique classes for filter
    const classes = ['ALL', ...new Set(summary.map(s => s.kelas_nama).filter(Boolean))]

    const filtered = summary.filter(s => {
        const matchSearch = s.siswa_nama?.toLowerCase().includes(search.toLowerCase()) || s.nisn?.includes(search)
        const matchClass = filterClass === 'ALL' || s.kelas_nama === filterClass
        const matchStatus = filterStatus === 'ALL' ||
            (filterStatus === 'HIGH' && s.saldo >= 1000000) ||
            (filterStatus === 'LOW' && s.saldo < 10000)
        return matchSearch && matchClass && matchStatus
    })

    // Auto-reset page when filter changes
    useEffect(() => { setCurrentPage(1) }, [search, filterClass, filterStatus])

    // Pagination setup
    const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1
    const paginatedData = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

    // Calculate overall stats
    const totalSaldo = summary.reduce((acc, curr) => acc + Number(curr.saldo), 0)
    const totalSetor = summary.reduce((acc, curr) => acc + Number(curr.total_setor), 0)
    const totalTarik = summary.reduce((acc, curr) => acc + Number(curr.total_tarik), 0)

    // Chart Data: Top 5 Highest Balances
    const chartData = [...summary]
        .sort((a, b) => b.saldo - a.saldo)
        .slice(0, 5)
        .map(s => ({
            name: (s.siswa_nama || 'Siswa').split(' ')[0],
            Saldo: Number(s.saldo || 0)
        }));

    const selectedSiswaData = summary.find(s => s.siswa_id == formData.siswa_id || s.id == formData.siswa_id)
    const currentSiswaSaldo = selectedSiswaData?.saldo || 0
    const nominalNum = Number(formData.nominal || 0)
    const estimatedNewSaldo = formData.tipe === 'setor' ? currentSiswaSaldo + nominalNum : currentSiswaSaldo - nominalNum

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!formData.siswa_id || !formData.nominal) return alert('Pilih siswa dan masukkan nominal')

        if (!showConfirm) {
            setShowConfirm(true)
            return
        }

        setSubmitLoading(true)
        try {
            const payload = { ...formData, nominal: Number(formData.nominal) }
            const res = await fetch(`${API_BASE}/admin/tabungan`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify(payload)
            })
            if (!res.ok) throw new Error('Gagal simpan transaksi')
            alert('Transaksi berhasil disimpan')
            setShowConfirm(false)
            setShowModal(false)
            setFormData({ siswa_id: '', tipe: 'setor', nominal: '', note: '' })
            fetchData()
        } catch (err) {
            alert(err.message)
        } finally {
            setSubmitLoading(false)
        }
    }

    return (
        <div className="admin-page animate-fadeIn">
            <style dangerouslySetInnerHTML={{ __html: styles }} />
            <div className="bank-mini-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                    <div style={{
                        padding: 14,
                        background: 'linear-gradient(135deg, #1e293b, #334155)',
                        color: '#fbbf24',
                        borderRadius: 18,
                        boxShadow: '0 8px 16px rgba(0,0,0,0.15)'
                    }}>
                        <PiggyBank size={32} strokeWidth={2.5} />
                    </div>
                    <div>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, letterSpacing: '-0.025em' }}>Bank Mini SIAS</h2>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: 4 }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                <div style={{ width: 8, height: 8, background: '#10b981', borderRadius: '50%' }}></div> Sistem Aktif
                            </span>
                            <span>•</span>
                            <span>Manajemen Tabungan Siswa</span>
                        </div>
                    </div>
                </div>
                <button className="btn btn-primary" style={{ borderRadius: 12, padding: '12px 24px', fontWeight: 700 }} onClick={() => setShowModal(true)}>
                    <PlusCircle size={20} /> Transaksi Baru
                </button>
            </div>

            {/* Stats Overview */}
            <div className="mb-4">
                <SummaryCards
                    totalSaldo={totalSaldo}
                    totalSetor={totalSetor}
                    totalTarik={totalTarik}
                    loading={loading}
                />
            </div>

            <div className="grid-60-40 mb-5">
                <div>
                    <TopSaldoChart chartData={chartData} formatRupiah={formatRupiah} loading={loading} />
                </div>
                <div>
                    <RecentActivity transactions={transactions} formatRupiah={formatRupiah} loading={loading} />
                </div>
            </div>

            {/* Quick Filters */}
            <div className="d-flex align-items-center gap-3 mb-4 flex-wrap">
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)' }}>FILTER:</div>
                <div className="d-flex gap-2">
                    {classes.map(c => (
                        <div
                            key={c}
                            className={`filter-pill ${filterClass === c ? 'active' : ''}`}
                            onClick={() => setFilterClass(c)}
                        >
                            {c}
                        </div>
                    ))}
                </div>
                <div className="ms-auto d-flex gap-2">
                    <div className={`filter-pill ${filterStatus === 'ALL' ? 'active' : ''}`} onClick={() => setFilterStatus('ALL')}>SEMUA</div>
                    <div className={`filter-pill ${filterStatus === 'HIGH' ? 'active' : ''}`} onClick={() => setFilterStatus('HIGH')}>SALDO TINGGI (&gt;1jt)</div>
                    <div className={`filter-pill ${filterStatus === 'LOW' ? 'active' : ''}`} onClick={() => setFilterStatus('LOW')}>SALDO MINIM (&lt;10rb)</div>
                </div>
            </div>

            {/* Search & Table */}
            <div className="card shadow-sm mb-4 border-0" style={{ borderRadius: 32, overflow: 'hidden' }}>
                <div className="card-body p-4">
                    <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
                        <div style={{ position: 'relative', width: '100%', maxWidth: '400px' }}>
                            <Search size={18} style={{ position: 'absolute', left: '16px', top: '14px', color: 'var(--text-muted)' }} />
                            <input
                                type="text"
                                placeholder="Cari nama atau NISN siswa..."
                                className="form-control bg-light border-0 shadow-none"
                                style={{ paddingLeft: '48px', height: '48px', borderRadius: '14px' }}
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                            />
                        </div>
                        <div className="d-flex gap-2">
                            <button className="btn btn-light d-flex align-items-center gap-2 border-0 shadow-sm transition-all" style={{ borderRadius: 12, fontWeight: 600, padding: '10px 20px', backgroundColor: '#fff', color: '#475569' }}>
                                <Download size={18} /> Ekspor Data
                            </button>
                        </div>
                    </div>

                    {loading ? (
                        <div className="d-flex flex-column gap-3">
                            {[1, 2, 3, 4, 5].map(i => (
                                <div key={i} className="w-full">
                                    <div className="p-3 border-bottom d-flex align-items-center gap-3">
                                        <div className="skeleton" style={{ width: 40, height: 40, borderRadius: 12 }}></div>
                                        <div className="flex-grow-1">
                                            <div className="skeleton mb-2" style={{ width: '30%', height: 14 }}></div>
                                            <div className="skeleton" style={{ width: '20%', height: 10 }}></div>
                                        </div>
                                        <div className="skeleton" style={{ width: 100, height: 24 }}></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="table-container border-0 mt-2 text-nowrap" style={{ overflowX: 'auto' }}>
                            <table className="table table-hover align-middle mb-0">
                                <thead>
                                    <tr style={{ borderBottom: '2px solid rgba(0,0,0,0.02)' }}>
                                        <th className="ps-4 py-3" style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-muted)' }}>Identitas Siswa</th>
                                        <th className="py-3" style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-muted)' }}>Kelas</th>
                                        <th className="text-center py-3" style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-muted)' }}>Total Setoran</th>
                                        <th className="text-center py-3" style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-muted)' }}>Total Penarikan</th>
                                        <th className="text-end py-3" style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-muted)' }}>Saldo Akhir</th>
                                        <th className="text-center py-3 pe-4" style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-muted)' }}>Aksi Cepat</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginatedData.length === 0 ? (
                                        <tr>
                                            <td colSpan="6" className="text-center py-5">
                                                <div className="d-flex flex-column align-items-center justify-content-center opacity-50">
                                                    <User size={48} className="mb-3 text-muted" />
                                                    <div className="fw-bold text-dark fs-5">Data Nasabah Tidak Ditemukan</div>
                                                    <div className="small text-muted mt-1">Coba sesuaikan kata pencarian atau filter kelas</div>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : paginatedData.map(s => (
                                        <tr key={s.siswa_id} className="align-middle activity-item">
                                            <td className="ps-4">
                                                <div className="d-flex align-items-center gap-3">
                                                    <div style={{
                                                        width: 44, height: 44, borderRadius: 14,
                                                        background: 'linear-gradient(135deg, #f8fafc, #f1f5f9)',
                                                        border: '1px solid #e2e8f0',
                                                        color: '#1e293b', display: 'flex', alignItems: 'center',
                                                        justifyContent: 'center', fontWeight: 800, fontSize: '1rem'
                                                    }}>
                                                        {(s.siswa_nama || '?').charAt(0)}
                                                    </div>
                                                    <div>
                                                        <div className="fw-bold text-dark" style={{ fontSize: '0.95rem' }}>{s.siswa_nama}</div>
                                                        <div className="text-muted small" style={{ fontSize: '0.75rem' }}>NISN: {s.nisn}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <span className="badge bg-light text-dark border-0 px-3 py-2" style={{ borderRadius: 8, fontSize: '0.75rem' }}>{s.kelas_nama || 'NON-KELAS'}</span>
                                            </td>
                                            <td className="text-center">
                                                <div className="fw-bold text-success" style={{ fontSize: '0.9rem' }}>{formatRupiah(s.total_setor)}</div>
                                            </td>
                                            <td className="text-center">
                                                <div className="fw-bold text-danger" style={{ fontSize: '0.9rem' }}>{formatRupiah(s.total_tarik)}</div>
                                            </td>
                                            <td className="text-end">
                                                <div className="fw-black text-dark" style={{ fontSize: '1.1rem', letterSpacing: '-0.5px' }}>{formatRupiah(s.saldo)}</div>
                                            </td>
                                            <td className="text-center pe-4">
                                                <div className="d-flex justify-content-center gap-2">
                                                    <button
                                                        className="quick-action-btn"
                                                        style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: 'none' }}
                                                        title="Setor Tunai"
                                                        onClick={() => {
                                                            setFormData({ siswa_id: s.siswa_id, tipe: 'setor', nominal: '', note: '' })
                                                            setShowModal(true)
                                                        }}
                                                    >
                                                        <ArrowUpCircle size={18} />
                                                    </button>
                                                    <button
                                                        className="quick-action-btn"
                                                        style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: 'none' }}
                                                        title="Tarik Tunai"
                                                        onClick={() => {
                                                            setFormData({ siswa_id: s.siswa_id, tipe: 'tarik', nominal: '', note: '' })
                                                            setShowModal(true)
                                                        }}
                                                    >
                                                        <ArrowDownCircle size={18} />
                                                    </button>
                                                    <button
                                                        className="quick-action-btn"
                                                        style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', border: 'none' }}
                                                        title="Riwayat Transaksi"
                                                        onClick={() => {
                                                            setSelectedHistorySiswa(s)
                                                            setShowHistoryModal(true)
                                                        }}
                                                    >
                                                        <FileText size={18} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            {/* Pagination Controls */}
                            {totalPages > 1 && (
                                <div className="d-flex justify-content-between align-items-center mt-4 pt-3 border-top px-3">
                                    <div className="text-muted small fw-bold">
                                        Menampilkan {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, filtered.length)} dari {filtered.length} nasabah
                                    </div>
                                    <div className="d-flex gap-2 align-items-center bg-light p-1" style={{ borderRadius: 14 }}>
                                        <button
                                            className="btn btn-sm btn-white d-flex align-items-center justify-content-center bg-white border-0 shadow-sm transition-all"
                                            style={{ width: 32, height: 32, borderRadius: 10, color: currentPage === 1 ? '#cbd5e1' : '#475569' }}
                                            disabled={currentPage === 1}
                                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                        >
                                            <ChevronLeft size={16} strokeWidth={3} />
                                        </button>
                                        <div className="d-flex gap-1 px-2 fw-bold text-dark small">
                                            {currentPage} <span className="text-muted mx-1">/</span> {totalPages}
                                        </div>
                                        <button
                                            className="btn btn-sm btn-white d-flex align-items-center justify-content-center bg-white border-0 shadow-sm transition-all"
                                            style={{ width: 32, height: 32, borderRadius: 10, color: currentPage === totalPages ? '#cbd5e1' : '#475569' }}
                                            disabled={currentPage === totalPages}
                                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                        >
                                            <ChevronRight size={16} strokeWidth={3} />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Modal Riwayat Transaksi Siswa */}
            {showHistoryModal && selectedHistorySiswa && (() => {
                const historyTrans = transactions.filter(t => t.siswa_id === selectedHistorySiswa.siswa_id)
                return (
                    <div className="modal-backdrop px-3" style={{ zIndex: 1050, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)' }}>
                        <div className="modal modal-lg animate-fadeIn shadow-lg border-0" style={{ borderRadius: 24, overflow: 'hidden' }}>
                            <div className="modal-header border-0 pb-0 pt-4 px-4">
                                <div>
                                    <h4 className="fw-bold mb-1 d-flex align-items-center gap-2 text-dark"><FileText size={24} className="text-primary" /> Riwayat Keuangan Siswa</h4>
                                    <div className="text-muted small">Detail pergerakan dana {selectedHistorySiswa.siswa_nama}</div>
                                </div>
                                <button className="btn-icon bg-light rounded-circle" style={{ width: 36, height: 36 }} onClick={() => setShowHistoryModal(false)}><X size={18} /></button>
                            </div>
                            <div className="modal-body p-4">
                                <div className="d-flex flex-wrap align-items-center gap-3 mb-4 p-3 rounded-xl border" style={{ borderRadius: 16, backgroundColor: '#f8fafc', borderColor: '#e2e8f0' }}>
                                    <div style={{
                                        width: 56, height: 56, borderRadius: 16,
                                        background: 'linear-gradient(135deg, #1e293b, #0f172a)',
                                        color: '#fff', display: 'flex', alignItems: 'center',
                                        justifyContent: 'center', fontWeight: 800, fontSize: '1.5rem',
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                                    }}>
                                        {(selectedHistorySiswa.siswa_nama || '?').charAt(0)}
                                    </div>
                                    <div className="flex-grow-1">
                                        <div className="fw-bold text-dark fs-5">{selectedHistorySiswa.siswa_nama}</div>
                                        <div className="text-muted d-flex gap-2 align-items-center" style={{ fontSize: '0.85rem' }}>
                                            <span className="badge bg-secondary bg-opacity-10 text-secondary border-0">{selectedHistorySiswa.kelas_nama || 'Umum'}</span>
                                            <span>NISN: {selectedHistorySiswa.nisn}</span>
                                        </div>
                                    </div>
                                    <div className="text-start text-md-end ms-md-auto mt-2 mt-md-0 d-flex flex-column align-items-md-end">
                                        <div className="text-muted small fw-bold mb-1">Saldo Akhir</div>
                                        <h4 className="mb-0 fw-black text-dark">{formatRupiah(selectedHistorySiswa.saldo)}</h4>
                                    </div>
                                </div>

                                <h6 className="fw-bold text-dark mb-3">Daftar Transaksi</h6>
                                <div className="table-responsive shadow-sm" style={{ maxHeight: '400px', overflowY: 'auto', borderRadius: 16, border: '1px solid #e2e8f0' }}>
                                    <table className="table table-hover align-middle mb-0 text-nowrap">
                                        <thead className="bg-light" style={{ position: 'sticky', top: 0, zIndex: 1 }}>
                                            <tr>
                                                <th className="py-3 px-4 border-bottom-0" style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 800 }}>WAKTU</th>
                                                <th className="py-3 border-bottom-0" style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 800 }}>JENIS</th>
                                                <th className="py-3 text-end border-bottom-0" style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 800 }}>NOMINAL</th>
                                                <th className="py-3 text-end pe-4 border-bottom-0" style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 800 }}>KETERANGAN</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {historyTrans.length === 0 ? (
                                                <tr><td colSpan="4" className="text-center py-5 text-muted">Belum ada transaksi pada rekening ini.</td></tr>
                                            ) : historyTrans.map((t, idx) => (
                                                <tr key={idx}>
                                                    <td className="px-4 py-3" style={{ fontSize: '0.85rem' }}>
                                                        <div className="fw-bold text-dark">{new Date(t.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                                                        <div className="text-muted" style={{ fontSize: '0.75rem' }}>{new Date(t.tanggal).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</div>
                                                    </td>
                                                    <td className="py-3">
                                                        <span className={`badge border-0 rounded-pill px-3 py-2 ${t.tipe === 'setor' ? 'bg-success bg-opacity-10 text-success' : 'bg-danger bg-opacity-10 text-danger'}`}>
                                                            {t.tipe === 'setor' ? 'SETORAN' : 'PENARIKAN'}
                                                        </span>
                                                    </td>
                                                    <td className={`text-end fw-bold py-3 ${t.tipe === 'setor' ? 'text-success' : 'text-danger'}`} style={{ fontSize: '1.05rem' }}>
                                                        {t.tipe === 'setor' ? '+' : '-'}{formatRupiah(t.nominal).replace('Rp', '').trim()}
                                                    </td>
                                                    <td className="text-end pe-4 py-3 text-muted text-break" style={{ fontSize: '0.85rem', fontStyle: t.note ? 'italic' : 'normal', minWidth: '150px' }}>
                                                        {t.note || '-'}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                            <div className="modal-footer border-0 p-4 pt-0">
                                <button type="button" className="btn btn-light" style={{ borderRadius: 14, fontWeight: 700, padding: '12px 24px' }} onClick={() => setShowHistoryModal(false)}>Tutup Riwayat</button>
                            </div>
                        </div>
                    </div>
                )
            })}

            {/* Modal Input Transaksi */}
            {showModal && (
                <div className="modal-backdrop">
                    <div className="modal modal-lg">
                        <div className="modal-header">
                            <h3><PiggyBank size={20} className="me-2" /> Input Transaksi Buku Tabungan</h3>
                            <button className="btn-icon" onClick={() => setShowModal(false)}><X size={20} /></button>
                        </div>
                        <form onSubmit={handleSubmit} style={{ overflow: 'hidden' }}>
                            <div className="modal-body p-0" style={{ backgroundColor: '#fff' }}>
                                <div className="step-container" style={{ transform: showConfirm ? 'translateX(-50%)' : 'translateX(0)' }}>
                                    {/* STEP 1: INPUT FORM */}
                                    <div className="step-content d-flex flex-column gap-3 p-3 activity-item" style={{ border: 'none' }}>
                                        {/* Segmented Control: Tipe */}
                                        <div className="p-1 bg-light d-flex rounded-xl" style={{ border: '1px solid #e2e8f0' }}>
                                            <div
                                                className={`flex-grow-1 p-3 rounded-lg d-flex align-items-center justify-content-center gap-2 cursor-pointer transition-all segmented-item ${formData.tipe === 'setor' ? 'bg-white shadow-sm text-success fw-bold' : 'text-muted fw-semibold'}`}
                                                onClick={() => setFormData({ ...formData, tipe: 'setor' })}
                                            >
                                                <ArrowUpCircle size={20} />
                                                <span>Setor Tunai</span>
                                            </div>
                                            <div
                                                className={`flex-grow-1 p-3 rounded-lg d-flex align-items-center justify-content-center gap-2 cursor-pointer transition-all segmented-item ${formData.tipe === 'tarik' ? 'bg-white shadow-sm text-danger fw-bold' : 'text-muted fw-semibold'}`}
                                                onClick={() => setFormData({ ...formData, tipe: 'tarik' })}
                                            >
                                                <ArrowDownCircle size={20} />
                                                <span>Tarik Tunai</span>
                                            </div>
                                        </div>

                                        {/* Card: Main Input Groups */}
                                        <div className="bg-white border rounded-2xl overflow-visible p-4 shadow-sm" style={{ borderColor: '#f1f5f9' }}>
                                            {/* Nasabah Selection */}
                                            <div className="mb-4 position-relative">
                                                <div className="d-flex justify-content-between align-items-end mb-2">
                                                    <label className="fw-black d-block text-dark small text-uppercase letter-spacing-1 m-0 opacity-80">Nasabah <span className="text-danger">*</span></label>
                                                    {formData.siswa_id && (
                                                        <div className="badge rounded-pill bg-primary bg-opacity-10 text-primary border-0 px-3 py-2" style={{ fontSize: '0.75rem', fontWeight: 800 }}>
                                                            Saldo: {formatRupiah(currentSiswaSaldo)}
                                                        </div>
                                                    )}
                                                </div>
                                                <div
                                                    className="form-control d-flex align-items-center justify-content-between outline-none shadow-sm transition-all"
                                                    style={{ height: '52px', borderRadius: 12, backgroundColor: showSelectDropdown ? '#fff' : '#f8fafc', border: showSelectDropdown ? '2px solid #3b82f6' : '1px solid #e2e8f0', cursor: 'pointer' }}
                                                    onClick={() => setShowSelectDropdown(!showSelectDropdown)}
                                                >
                                                    <div className="d-flex align-items-center gap-2 overflow-hidden">
                                                        <User size={18} className="text-muted flex-shrink-0" />
                                                        <span className={formData.siswa_id ? 'text-dark fw-bold' : 'text-muted'} style={{ fontSize: '0.95rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                            {formData.siswa_id
                                                                ? (() => {
                                                                    const selected = siswaList.find(s => s.id == formData.siswa_id);
                                                                    return selected ? `${selected.nama} (${selected.kelas_nama || 'Umum'})` : 'Pilih Nasabah';
                                                                })()
                                                                : 'Cari & Pilih Nasabah...'
                                                            }
                                                        </span>
                                                    </div>
                                                    <ChevronRight size={18} className="text-muted" style={{ transform: showSelectDropdown ? 'rotate(90deg)' : 'rotate(0deg)', transition: '0.2s' }} />
                                                </div>

                                                {showSelectDropdown && (
                                                    <div className="position-absolute w-100 bg-white shadow-xl border mt-2 z-3 animate-fadeIn" style={{ top: '100%', left: 0, zIndex: 1000, borderRadius: 20, overflow: 'hidden', border: '1px solid #e2e8f0', boxShadow: '0 20px 50px rgba(0,0,0,0.1)' }}>
                                                        <div className="p-3 bg-white border-bottom d-flex align-items-center gap-3">
                                                            <Search size={18} className="text-primary opacity-50" />
                                                            <input
                                                                type="text"
                                                                className="flex-grow-1 border-0 bg-transparent outline-none fw-bold text-dark"
                                                                placeholder="Cari Nasabah..."
                                                                value={modalSearch}
                                                                onChange={e => setModalSearch(e.target.value)}
                                                                onClick={e => e.stopPropagation()}
                                                                autoFocus
                                                                style={{ fontSize: '0.95rem' }}
                                                            />
                                                        </div>
                                                        <div style={{ maxHeight: '280px', overflowY: 'auto' }} className="custom-dropdown-list pb-2">
                                                            <div className="px-3 py-2 text-muted fw-bold small text-uppercase letter-spacing-1 bg-light bg-opacity-50" style={{ fontSize: '0.65rem' }}>Daftar Nasabah</div>
                                                            {siswaList.filter(s => s.nama.toLowerCase().includes(modalSearch.toLowerCase()) || s.nisn.includes(modalSearch)).length === 0 ? (
                                                                <div className="p-5 text-center text-muted small">
                                                                    <User size={32} className="opacity-20 mb-2" />
                                                                    <div>Nasabah tidak ditemukan</div>
                                                                </div>
                                                            ) : (
                                                                siswaList
                                                                    .filter(s => s.nama.toLowerCase().includes(modalSearch.toLowerCase()) || s.nisn.includes(modalSearch))
                                                                    .map(s => (
                                                                        <div
                                                                            key={s.id}
                                                                            className="d-flex align-items-center justify-content-between mx-2 my-1 p-3 cursor-pointer rounded-xl transition-all"
                                                                            onClick={() => {
                                                                                setFormData({ ...formData, siswa_id: s.id });
                                                                                setShowSelectDropdown(false);
                                                                                setModalSearch('');
                                                                            }}
                                                                            style={{
                                                                                backgroundColor: formData.siswa_id == s.id ? '#eff6ff' : 'transparent',
                                                                                border: formData.siswa_id == s.id ? '1px solid #dbeafe' : '1px solid transparent'
                                                                            }}
                                                                            onMouseEnter={e => { if (formData.siswa_id != s.id) e.currentTarget.style.backgroundColor = '#f8fafc' }}
                                                                            onMouseLeave={e => { if (formData.siswa_id != s.id) e.currentTarget.style.backgroundColor = 'transparent' }}
                                                                        >
                                                                            <div className="d-flex align-items-center gap-3">
                                                                                <div style={{ width: 42, height: 42, borderRadius: 12, background: formData.siswa_id == s.id ? '#3b82f6' : '#f1f5f9', color: formData.siswa_id == s.id ? '#fff' : '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                                                                                    {(s.nama || '?').charAt(0)}
                                                                                </div>
                                                                                <div>
                                                                                    <div className={`fw-bold ${formData.siswa_id == s.id ? 'text-primary' : 'text-dark'}`}>{s.nama}</div>
                                                                                    <div className="text-muted d-flex gap-2 align-items-center mt-1" style={{ fontSize: '0.75rem' }}>
                                                                                        <span className="fw-medium">NISN: {s.nisn}</span>
                                                                                        <span style={{ width: 4, height: 4, borderRadius: '50%', background: '#cbd5e1' }}></span>
                                                                                        <span className="fw-medium">{s.kelas_nama || 'Umum'}</span>
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                            {formData.siswa_id == s.id && <CheckCircle size={20} className="text-primary" />}
                                                                        </div>
                                                                    ))
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Nominal Transaksi */}
                                        <div className="mb-4">
                                            <div className="d-flex justify-content-between align-items-center mb-2">
                                                <label className="fw-bold d-block text-dark small text-uppercase letter-spacing-1 m-0">Nominal Transaksi <span className="text-danger">*</span></label>
                                                {formData.nominal && formData.siswa_id && (
                                                    <div className={`fw-bold small transition-all animate-fadeIn ${estimatedNewSaldo < 0 ? 'text-danger' : 'text-primary'}`} style={{ fontSize: '0.75rem' }}>
                                                        Estimasi Saldo: {formatRupiah(estimatedNewSaldo)}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="d-flex align-items-center bg-light shadow-inner transition-all border-2 nominal-input-container" style={{ height: '64px', borderRadius: 16, padding: '0 20px', border: '2px solid transparent', borderColor: formData.nominal ? (formData.tipe === 'setor' ? '#10b981' : '#ef4444') : '#f1f5f9' }}>
                                                <span className={`fw-bold me-3 ${formData.nominal ? (formData.tipe === 'setor' ? 'text-success' : 'text-danger') : 'text-muted'}`} style={{ fontSize: '1.4rem' }}>Rp</span>
                                                <input
                                                    type="text"
                                                    className="border-0 bg-transparent flex-grow-1 outline-none text-dark"
                                                    value={formData.nominal ? Number(formData.nominal).toLocaleString('id-ID') : ''}
                                                    onChange={e => {
                                                        const val = e.target.value.replace(/\D/g, '');
                                                        setFormData({ ...formData, nominal: val });
                                                    }}
                                                    placeholder="0"
                                                    style={{ fontSize: '1.8rem', fontWeight: 900, width: '100%', color: '#1e293b' }}
                                                />
                                            </div>
                                            <div className="d-flex gap-1 flex-wrap mt-3">
                                                {[20000, 50000, 100000, 200000, 500000].map(amt => (
                                                    <button
                                                        type="button"
                                                        key={amt}
                                                        className="btn btn-sm fw-bold border shadow-sm transition-all segmented-item"
                                                        style={{ borderRadius: 10, color: '#64748b', padding: '10px 14px', backgroundColor: '#fff', fontSize: '0.8rem', flex: '1 1 auto' }}
                                                        onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#f8fafc'; e.currentTarget.style.borderColor = '#cbd5e1'; }}
                                                        onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#fff'; e.currentTarget.style.borderColor = '#e2e8f0'; }}
                                                        onClick={() => setFormData({ ...formData, nominal: (Number(formData.nominal || 0) + amt).toString() })}
                                                    >
                                                        + {amt / 1000}k
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Berita Acara */}
                                        <div>
                                            <label className="fw-bold mb-2 d-block text-dark small text-uppercase letter-spacing-1">Berita Acara (Opsional)</label>
                                            <textarea
                                                className="form-control bg-light border-0 outline-none p-3"
                                                rows="2"
                                                value={formData.note}
                                                onChange={e => setFormData({ ...formData, note: e.target.value })}
                                                placeholder="Tambahkan catatan untuk transaksi ini..."
                                                style={{ borderRadius: 14, resize: 'none', border: '1px solid #f1f5f9' }}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* STEP 2: KONFIRMASI (SLIDE IN FROM RIGHT) */}
                                <div className="step-content d-flex flex-column gap-3 p-4">
                                    <div className="bg-white p-4 text-center" style={{ borderRadius: 32 }}>
                                        <div className={`mb-4 mx-auto d-flex align-items-center justify-content-center ${formData.tipe === 'setor' ? 'bg-success' : 'bg-danger'}`} style={{ width: 84, height: 84, borderRadius: 28, transform: 'rotate(-5deg)', boxShadow: `0 12px 24px ${formData.tipe === 'setor' ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}` }}>
                                            {formData.tipe === 'setor' ? <ArrowUpCircle size={44} className="text-white" /> : <ArrowDownCircle size={44} className="text-white" />}
                                        </div>
                                        <h3 className="fw-black text-dark mb-1" style={{ fontSize: '1.6rem' }}>Tinjau Transaksi</h3>
                                        <p className="text-muted mb-4 fw-medium">Pastikan nominal dan nasabah sudah sesuai.</p>

                                        <div className="p-4 rounded-3xl" style={{ backgroundColor: '#f8fafc', border: '1.5px dashed #cbd5e1' }}>
                                            <div className="d-flex justify-content-between align-items-center mb-3">
                                                <span className="text-muted fw-bold small text-uppercase letter-spacing-1">Tipe Transaksi</span>
                                                <span className={`badge ${formData.tipe === 'setor' ? 'bg-success' : 'bg-danger'} text-white fw-black px-3 py-2`} style={{ borderRadius: 10 }}>
                                                    {formData.tipe === 'setor' ? 'SETORAN' : 'PENARIKAN'}
                                                </span>
                                            </div>
                                            <div className="d-flex justify-content-between align-items-start mb-3">
                                                <span className="text-muted fw-bold small text-uppercase letter-spacing-1">Nasabah</span>
                                                <div className="text-end">
                                                    <div className="text-dark fw-black" style={{ fontSize: '1.1rem' }}>{siswaList.find(s => s.id == formData.siswa_id)?.nama}</div>
                                                    <div className="text-muted small fw-bold">Kelas: {siswaList.find(s => s.id == formData.siswa_id)?.kelas_nama || 'Umum'}</div>
                                                </div>
                                            </div>
                                            <div className="d-flex justify-content-between mt-4 pt-4 border-top">
                                                <div className="text-start">
                                                    <span className="text-dark opacity-50 fw-bold small text-uppercase d-block mb-1">Total Akumulasi</span>
                                                    <span className="text-dark fw-black" style={{ fontSize: '1.1rem' }}>Saldo Akhir</span>
                                                </div>
                                                <div className="text-end">
                                                    <span className={`fw-black d-block mb-1 ${formData.tipe === 'setor' ? 'text-success' : 'text-danger'}`} style={{ fontSize: '1.8rem', letterSpacing: '-1px' }}>
                                                        {formatRupiah(formData.nominal)}
                                                    </span>
                                                    <span className="text-primary fw-bold small">→ {formatRupiah(estimatedNewSaldo)}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="modal-footer px-4 py-3 border-top-0 d-flex justify-content-end gap-3" style={{ backgroundColor: '#fff', borderBottomLeftRadius: '2rem', borderBottomRightRadius: '2rem' }}>
                                {!showConfirm ? (
                                    <>
                                        <button type="button" className="btn btn-link text-muted fw-bold text-decoration-none" style={{ fontSize: '0.9rem' }} onClick={() => setShowModal(false)}>Batal</button>
                                        <button type="submit" className="btn btn-primary shadow-lg d-flex align-items-center gap-2" style={{ minWidth: '200px', height: '52px', borderRadius: 14, fontWeight: 800, background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)', border: 'none' }}>
                                            <span className="flex-grow-1">Lanjut Konfirmasi</span>
                                            <ChevronRight size={20} />
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <button type="button" className="btn btn-light fw-bold px-4" style={{ height: '52px', borderRadius: 14, color: '#64748b', border: '1px solid #e2e8f0' }} onClick={() => setShowConfirm(false)}>Kembali Edit</button>
                                        <button type="submit" className="btn btn-primary d-flex align-items-center justify-content-center gap-2 shadow-xl" disabled={submitLoading} style={{ minWidth: '220px', height: '52px', borderRadius: 14, fontWeight: 800, background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', border: 'none' }}>
                                            {submitLoading ? 'Memproses...' : (<><CheckCircle size={20} /> <span>Proses Transaksi</span></>)}
                                        </button>
                                    </>
                                )}
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}

/**
 * Component-based Summary/KPI Cards
 */
function SummaryCards({ totalSaldo, totalSetor, totalTarik, loading }) {
    if (loading) {
        return (
            <div className="grid-3 mb-5">
                {[1, 2, 3].map(i => (
                    <div key={i}>
                        <div className="stat-card-premium border-0 shadow-sm" style={{ background: '#fff', borderRadius: 32, height: 180 }}>
                            <div className="p-5">
                                <div className="skeleton mb-4" style={{ width: '40%', height: 16, borderRadius: 4 }}></div>
                                <div className="skeleton mb-3" style={{ width: '80%', height: 40, borderRadius: 8 }}></div>
                                <div className="skeleton" style={{ width: '60%', height: 12, borderRadius: 4 }}></div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        )
    }
    return (
        <div className="grid-3 mb-5">
            {/* Total Balance Card */}
            <div>
                <div className="stat-card-premium" style={{ background: 'linear-gradient(225deg, #1e293b 0%, #020617 100%)' }}>
                    <div className="card-glass-layer">
                        <div className="position-absolute" style={{ top: -30, right: -30, opacity: 0.05 }}>
                            <Wallet size={160} />
                        </div>
                        <div className="d-flex align-items-center gap-3 mb-4">
                            <div style={{ padding: 10, background: 'rgba(251, 191, 36, 0.1)', color: '#fbbf24', borderRadius: 14 }}>
                                <Wallet size={20} />
                            </div>
                            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '1.5px' }}>Total Saldo</span>
                        </div>
                        <h3 style={{ fontSize: '2.2rem', fontWeight: 900, margin: 0, color: '#fff', letterSpacing: '-1px' }}>
                            <span style={{ fontSize: '1.2rem', fontWeight: 600, opacity: 0.5, marginRight: 8 }}>Rp</span>
                            {totalSaldo.toLocaleString('id-ID')}
                        </h3>
                        <div className="mt-4 pt-3 border-top border-white border-opacity-10">
                            <div className="d-flex align-items-center gap-2 text-success" style={{ fontSize: '0.85rem', fontWeight: 700 }}>
                                <TrendingUp size={16} /> Dana Tersedia di Kas
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Total Deposit Card */}
            <div>
                <div className="stat-card-premium" style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.04)', boxShadow: '0 10px 30px rgba(0,0,0,0.02)' }}>
                    <div className="p-5 h-100 d-flex flex-column">
                        <div className="d-flex align-items-center gap-3 mb-4">
                            <div style={{ padding: 10, background: 'rgba(16, 185, 129, 0.08)', color: '#10b981', borderRadius: 14 }}>
                                <ArrowUpCircle size={20} />
                            </div>
                            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1.5px' }}>Akumulasi Setoran</span>
                        </div>
                        <h3 style={{ fontSize: '2.2rem', fontWeight: 900, margin: 0, color: '#1e293b', letterSpacing: '-1px' }}>
                            <span style={{ fontSize: '1.2rem', fontWeight: 600, color: '#10b981', marginRight: 8 }}>+</span>
                            {totalSetor.toLocaleString('id-ID')}
                        </h3>
                        <div className="mt-auto pt-3 border-top border-light">
                            <div className="text-muted" style={{ fontSize: '0.85rem' }}>Total dana nasabah masuk</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Total Withdrawal Card */}
            <div>
                <div className="stat-card-premium" style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.04)', boxShadow: '0 10px 30px rgba(0,0,0,0.02)' }}>
                    <div className="p-5 h-100 d-flex flex-column">
                        <div className="d-flex align-items-center gap-3 mb-4">
                            <div style={{ padding: 10, background: 'rgba(239, 68, 68, 0.08)', color: '#ef4444', borderRadius: 14 }}>
                                <ArrowDownCircle size={20} />
                            </div>
                            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1.5px' }}>Akumulasi Tarikan</span>
                        </div>
                        <h3 style={{ fontSize: '2.2rem', fontWeight: 900, margin: 0, color: '#1e293b', letterSpacing: '-1px' }}>
                            <span style={{ fontSize: '1.2rem', fontWeight: 600, color: '#ef4444', marginRight: 8 }}>-</span>
                            {totalTarik.toLocaleString('id-ID')}
                        </h3>
                        <div className="mt-auto pt-3 border-top border-light">
                            <div className="text-muted" style={{ fontSize: '0.85rem' }}>Total penarikan tunai siswa</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

/**
 * Component-based Top Saldo Analytics Chart
 */
function TopSaldoChart({ chartData, formatRupiah, loading }) {
    return (
        <div className="card shadow-sm border-0 h-100 chart-container-card" style={{ borderRadius: 32, overflow: 'hidden' }}>
            <div className="card-body p-4 d-flex flex-column justify-content-center">
                <div className="d-flex justify-content-between align-items-center mb-3">
                    <h6 className="mb-0 text-dark fw-bold d-flex align-items-center">
                        <BarChartIcon size={18} className="me-2 text-primary" /> Top 5 Saldo Nasabah
                    </h6>
                </div>
                {loading ? (
                    <div className="flex-grow-1 d-flex flex-column gap-3 mt-4">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="skeleton" style={{ width: '100%', height: 24, borderRadius: 6 }}></div>
                        ))}
                    </div>
                ) : chartData.length === 0 ? (
                    <p className="text-muted small text-center my-auto py-5 d-flex flex-column align-items-center">
                        <BarChartIcon size={32} className="opacity-25 mb-2" />
                        Belum ada data transaksi
                    </p>
                ) : (
                    <div style={{ width: '100%', height: 160 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.15} />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={11} dy={5} tick={{ fill: '#6c757d', fontWeight: 500 }} />
                                <YAxis axisLine={false} tickLine={false} fontSize={10} tickFormatter={(value) => `Rp${value / 1000}k`} tick={{ fill: '#adb5bd' }} />
                                <Tooltip
                                    formatter={(value) => formatRupiah(value)}
                                    cursor={{ fill: 'rgba(251, 191, 36, 0.05)' }}
                                    contentStyle={{
                                        borderRadius: '16px',
                                        border: 'none',
                                        boxShadow: '0 10px 20px rgba(0,0,0,0.1)',
                                        padding: '12px'
                                    }}
                                />
                                <Bar dataKey="Saldo" radius={[8, 8, 0, 0]} maxBarSize={32}>
                                    {chartData.map((entry, index) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={index === 0 ? '#fbbf24' : '#1e293b'}
                                            fillOpacity={index === 0 ? 1 : 0.8}
                                        />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                )}
            </div>
        </div>
    )
}

/**
 * Recent Activity Widget
 */
function RecentActivity({ transactions, formatRupiah, loading }) {
    return (
        <div className="card shadow-sm border-0 h-100" style={{ borderRadius: 32, overflow: 'hidden' }}>
            <div className="card-body p-4 d-flex flex-column">
                <h6 className="mb-4 text-dark fw-bold d-flex align-items-center">
                    <TrendingUp size={18} className="me-2 text-primary" /> Aktivitas Terkini
                </h6>
                <div className="flex-grow-1 overflow-auto" style={{ maxHeight: '320px', paddingRight: '12px' }}>
                    {loading ? (
                        <div className="d-flex flex-column gap-3">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="activity-item d-flex gap-3">
                                    <div className="skeleton" style={{ width: 32, height: 32, borderRadius: 8 }}></div>
                                    <div className="flex-grow-1">
                                        <div className="skeleton mb-2" style={{ width: '60%', height: 12 }}></div>
                                        <div className="skeleton" style={{ width: '40%', height: 8 }}></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : transactions.length === 0 ? (
                        <div className="text-center py-5 opacity-25 d-flex flex-column align-items-center">
                            <PlusCircle size={32} className="mb-2" />
                            <div className="small">Belum ada aktivitas transaksi</div>
                        </div>
                    ) : transactions.slice(0, 10).map(t => (
                        <div key={t.id} className="activity-item">
                            <div className="d-flex justify-content-between align-items-start">
                                <div style={{ flex: 1 }}>
                                    <div className="fw-bold small text-dark" style={{ lineHeight: 1.2 }}>{t.siswa_nama}</div>
                                    <div className="text-muted" style={{ fontSize: '0.65rem', marginTop: 2 }}>
                                        {new Date(t.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                </div>
                                <div className={`fw-bold small text-end ${t.tipe === 'setor' ? 'text-success' : 'text-danger'}`} style={{ minWidth: '80px' }}>
                                    {t.tipe === 'setor' ? '+' : '-'}{formatRupiah(t.nominal).replace('Rp', '').trim()}
                                </div>
                            </div>
                            {t.note && (
                                <div style={{
                                    padding: '6px 10px', background: '#f8fafc',
                                    borderRadius: '8px', fontSize: '0.65rem',
                                    color: '#64748b', marginTop: '6px',
                                    fontStyle: 'italic'
                                }}>
                                    "{t.note}"
                                </div>
                            )}
                        </div>
                    ))}
                </div>
                {!loading && transactions.length > 10 && (
                    <div className="mt-3 text-center">
                        <button className="btn btn-link btn-sm text-decoration-none fw-bold" style={{ fontSize: '0.7rem' }}>Lihat Seluruh Riwayat</button>
                    </div>
                )}
            </div>
        </div>
    )
}
