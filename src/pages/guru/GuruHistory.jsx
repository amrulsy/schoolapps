import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { API_BASE, getAuthHeaders } from '../../services/api'
import LoadingSpinner from '../../components/LoadingSpinner'
import {
    History, Calendar, Users, BookOpen, ChevronRight,
    Search, Filter, ArrowLeft, Clock, CheckCircle, X, ChevronDown, Trash2
} from 'lucide-react'

const styles = /*css*/`
  .history-header {
    background: var(--bg-card);
    padding: 24px 32px;
    border-radius: 28px;
    border: 1px solid var(--border-color);
    margin-bottom: 24px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 20px;
  }
  .search-container {
    position: relative;
    flex: 1;
    max-width: 400px;
  }
  .search-input {
    width: 100%;
    padding: 12px 16px 12px 44px;
    background: var(--bg-stripe);
    border: 1.5px solid var(--border-color);
    border-radius: 14px;
    font-size: 0.9rem;
    font-weight: 600;
    transition: all 0.2s;
  }
  .search-input:focus {
    border-color: var(--primary-500);
    background: var(--bg-card);
    outline: none;
    box-shadow: 0 0 0 4px var(--primary-50);
  }
  .search-icon {
    position: absolute;
    left: 14px;
    top: 50%;
    transform: translateY(-50%);
    color: var(--text-muted);
  }
  .filter-panel {
    background: var(--bg-card);
    border-radius: 24px;
    padding: 24px;
    border: 1px solid var(--border-color);
    margin-bottom: 24px;
    animation: slideDown 0.3s ease-out;
  }
  @keyframes slideDown {
    from { opacity: 0; transform: translateY(-10px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .filter-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 16px;
  }
  .filter-group label {
    display: block;
    font-size: 0.75rem;
    font-weight: 800;
    text-transform: uppercase;
    color: var(--text-muted);
    margin-bottom: 8px;
    letter-spacing: 0.5px;
  }
  .filter-select, .filter-date {
    width: 100%;
    padding: 10px 14px;
    background: var(--bg-stripe);
    border: 1.5px solid var(--border-color);
    border-radius: 12px;
    font-size: 0.85rem;
    font-weight: 600;
    color: var(--text-primary);
  }
  .history-table-container {
    background: var(--bg-card);
    border-radius: 24px;
    border: 1px solid var(--border-color);
    overflow: hidden;
    box-shadow: 0 4px 20px rgba(0,0,0,0.03);
  }
  .table-responsive {
    overflow-x: auto;
    width: 100%;
  }
  .history-table {
    width: 100%;
    border-collapse: separate;
    border-spacing: 0;
  }
  .history-table th {
    background: var(--bg-stripe);
    padding: 16px 24px;
    font-size: 0.75rem;
    font-weight: 800;
    text-transform: uppercase;
    color: var(--text-muted);
    letter-spacing: 0.5px;
    text-align: left;
    border-bottom: 2px solid var(--border-color);
    white-space: nowrap;
  }
  .history-table td {
    padding: 16px 24px;
    border-bottom: 1px solid var(--border-color);
    vertical-align: middle;
    color: var(--text-primary);
    transition: background 0.2s;
  }
  .history-row {
    cursor: pointer;
  }
  .history-row:hover td {
    background: var(--primary-50);
  }
  .history-row:last-child td {
    border-bottom: none;
  }
  .cell-subject {
    display: flex;
    align-items: center;
    gap: 16px;
  }
  .subject-icon {
    width: 44px;
    height: 44px;
    border-radius: 14px;
    background: var(--bg-card);
    border: 1px solid var(--border-color);
    box-shadow: 0 2px 8px rgba(0,0,0,0.05);
    color: var(--primary-600);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
  .materi-preview {
    max-width: 250px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    font-size: 0.85rem;
    color: var(--text-secondary);
    font-weight: 500;
  }
  .status-badge {
     padding: 6px 14px;
     border-radius: 10px;
     font-size: 0.75rem;
     font-weight: 800;
     display: inline-flex;
     align-items: center;
     gap: 6px;
  }
  .status-selesai {
     background: rgba(34, 197, 94, 0.1);
     color: #16a34a;
  }
  .status-running {
     background: rgba(59, 130, 246, 0.1);
     color: #2563eb;
  }
  .mini-stat {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 0.85rem;
    color: var(--text-secondary);
    font-weight: 600;
  }
  .empty-state {
    text-align: center;
    padding: 80px 40px;
    background: var(--bg-card);
    border-radius: 32px;
    border: 2px dashed var(--border-color);
    margin-top: 20px;
  }
  @media (max-width: 768px) {
    .history-header { flex-direction: column; align-items: stretch; padding: 16px 20px; border-radius: 20px; }
    .search-container { max-width: none; }
    .filter-panel { padding: 16px; border-radius: 18px; }
    .filter-grid { grid-template-columns: 1fr; }
    .history-table th { padding: 12px 14px; font-size: 0.7rem; }
    .history-table td { padding: 12px 14px; }
    .cell-subject { gap: 10px; }
    .subject-icon { width: 36px; height: 36px; border-radius: 10px; }
    .materi-preview { max-width: 120px; }
    .empty-state { padding: 50px 20px; border-radius: 20px; }
    .history-table-container { border-radius: 18px; }
  }
`

export default function GuruHistory() {
    const [history, setHistory] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [search, setSearch] = useState('')
    const [showFilters, setShowFilters] = useState(false)
    const [filters, setFilters] = useState({
        startDate: '',
        endDate: '',
        kelas: '',
        mapel: ''
    })
    const navigate = useNavigate()

    useEffect(() => {
        fetchHistory()
    }, [])

    const fetchHistory = async () => {
        setLoading(true)
        setError(null)
        try {
            const res = await fetch(`${API_BASE}/guru/session/history`, { headers: getAuthHeaders() })
            if (!res.ok) throw new Error('Gagal mengambil data riwayat')
            const data = await res.json()
            console.log("Journal History Data:", data)
            setHistory(Array.isArray(data) ? data : [])
        } catch (err) {
            console.error("Fetch History Error:", err)
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    // Derived lists for filters
    const classes = useMemo(() => [...new Set(history.map(item => item.kelas_nama))].filter(Boolean).sort(), [history])
    const subjects = useMemo(() => [...new Set(history.map(item => item.mapel_nama))].filter(Boolean).sort(), [history])

    const filteredHistory = useMemo(() => {
        if (!Array.isArray(history)) return []
        return history.filter(item => {
            // Search match
            const searchLower = search.toLowerCase()
            const matchSearch =
                (item.kelas_nama?.toLowerCase() || '').includes(searchLower) ||
                (item.mapel_nama?.toLowerCase() || '').includes(searchLower) ||
                (item.materi?.toLowerCase() || '').includes(searchLower)

            if (!matchSearch) return false

            // Filter match
            if (filters.kelas && item.kelas_nama !== filters.kelas) return false
            if (filters.mapel && item.mapel_nama !== filters.mapel) return false

            // Compare as YYYY-MM-DD strings for consistency
            const itemDateStr = item.tanggal ? new Date(item.tanggal).toLocaleDateString('en-CA') : ''

            if (filters.startDate && itemDateStr < filters.startDate) return false
            if (filters.endDate && itemDateStr > filters.endDate) return false

            return true
        })
    }, [history, search, filters])

    const formatDate = (dateStr) => {
        if (!dateStr) return '-'
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }
        try {
            return new Date(dateStr).toLocaleDateString('id-ID', options)
        } catch (e) {
            return dateStr
        }
    }

    const resetFilters = () => {
        setFilters({ startDate: '', endDate: '', kelas: '', mapel: '' })
        setSearch('')
    }

    const activeFilterCount = Object.values(filters).filter(v => v !== '').length + (search ? 1 : 0)

    return (
        <div className="pb-5 animate-fadeIn">
            <style dangerouslySetInnerHTML={{ __html: styles }} />

            <div className="d-flex align-items-center gap-3 mb-4">
                <button
                    onClick={() => navigate('/guru')}
                    className="btn btn-outline-secondary p-2 rounded-circle border-0"
                    style={{ background: 'var(--bg-card)', color: 'var(--text-primary)' }}
                >
                    <ArrowLeft size={20} />
                </button>
                <div>
                    <h2 className="fw-black text-primary mb-0" style={{ letterSpacing: '-1px' }}>Riwayat Jurnal</h2>
                    <div className="d-flex align-items-center gap-2">
                        <p className="text-muted small mb-0 fw-bold">Daftar pengajaran yang telah Anda laksanakan</p>
                        <span
                            style={{ fontSize: '10px', opacity: 0.3, cursor: 'help' }}
                            title={`Diagnostic: Guru ID ${history[0]?.guru_id || 'N/A'}, Total items: ${history.length}`}
                        >
                            • Diagnostic Info
                        </span>
                    </div>
                </div>
            </div>

            <div className="history-header">
                <div className="search-container">
                    <Search className="search-icon" size={20} />
                    <input
                        type="text"
                        className="search-input"
                        placeholder="Cari kelas, mapel, atau materi..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <div className="d-flex gap-2">
                    <button
                        className={`btn d-flex align-items-center gap-2 ${showFilters ? 'btn-primary' : 'btn-outline-secondary'}`}
                        style={{ borderRadius: 14, fontWeight: 700, padding: '10px 20px' }}
                        onClick={() => setShowFilters(!showFilters)}
                    >
                        <Filter size={18} />
                        Filter
                        {activeFilterCount > 0 && <span className="badge bg-white text-primary ms-1" style={{ fontSize: '0.65rem' }}>{activeFilterCount}</span>}
                    </button>
                    <button
                        className="btn btn-light d-flex align-items-center justify-content-center p-0 rounded-circle"
                        style={{ width: 44, height: 44 }}
                        onClick={fetchHistory}
                        title="Refresh"
                    >
                        <Clock size={20} />
                    </button>
                </div>
            </div>

            {showFilters && (
                <div className="filter-panel">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                        <h6 className="fw-black mb-0 text-primary">Filter Lanjutan</h6>
                        <button className="btn btn-sm btn-link text-muted p-0 fw-bold" onClick={resetFilters}>
                            <Trash2 size={14} className="me-1" /> Reset Filter
                        </button>
                    </div>
                    <div className="filter-grid">
                        <div className="filter-group">
                            <label>Mulai Tanggal</label>
                            <input
                                type="date"
                                className="filter-date"
                                value={filters.startDate}
                                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                            />
                        </div>
                        <div className="filter-group">
                            <label>Sampai Tanggal</label>
                            <input
                                type="date"
                                className="filter-date"
                                value={filters.endDate}
                                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                            />
                        </div>
                        <div className="filter-group">
                            <label>Kelas</label>
                            <select
                                className="filter-select"
                                value={filters.kelas}
                                onChange={(e) => setFilters({ ...filters, kelas: e.target.value })}
                            >
                                <option value="">Semua Kelas</option>
                                {classes.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                        <div className="filter-group">
                            <label>Mata Pelajaran</label>
                            <select
                                className="filter-select"
                                value={filters.mapel}
                                onChange={(e) => setFilters({ ...filters, mapel: e.target.value })}
                            >
                                <option value="">Semua Mapel</option>
                                {subjects.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                    </div>
                </div>
            )}

            {loading ? <LoadingSpinner fullScreen={false} /> : error ? (
                <div className="empty-state text-danger">
                    <X size={48} className="mb-3 opacity-50" />
                    <h5 className="fw-bold">Gagal memuat data</h5>
                    <p className="text-muted small">{error}</p>
                    <button className="btn btn-primary mt-2" onClick={fetchHistory}>Coba Lagi</button>
                </div>
            ) : (
                <>
                    {history.length === 0 ? (
                        <div className="empty-state">
                            <History size={64} className="text-muted mb-3 opacity-20" />
                            <h5 className="text-muted fw-bold">Belum ada riwayat aktivitas</h5>
                            <p className="text-muted small">Semua pengajaran yang Anda selesaikan akan muncul di sini.</p>
                        </div>
                    ) : filteredHistory.length === 0 ? (
                        <div className="empty-state">
                            <Search size={64} className="text-muted mb-3 opacity-20" />
                            <h5 className="text-muted fw-bold">Tidak ada data yang cocok</h5>
                            <p className="text-muted small">Coba ubah kata kunci pencarian atau filter Anda.</p>
                            <button className="btn btn-outline-primary btn-sm mt-2" onClick={resetFilters}>
                                Hapus Semua Filter
                            </button>
                        </div>
                    ) : (
                        <div className="history-table-container">
                            <div className="table-responsive">
                                <table className="history-table">
                                    <thead>
                                        <tr>
                                            <th>Mata Pelajaran & Kelas</th>
                                            <th>Tanggal</th>
                                            <th>Waktu</th>
                                            <th>Materi</th>
                                            <th>Status</th>
                                            <th></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredHistory.map(item => (
                                            <tr
                                                key={item.id}
                                                className="history-row"
                                                onClick={() => navigate(`/guru/session/${item.id}`)}
                                            >
                                                <td>
                                                    <div className="cell-subject">
                                                        <div className="subject-icon">
                                                            <BookOpen size={20} />
                                                        </div>
                                                        <div>
                                                            <h6 className="fw-black text-primary mb-1">{item.mapel_nama}</h6>
                                                            <span className="text-muted fw-bold small">{item.kelas_nama}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td>
                                                    <div className="mini-stat">
                                                        <Calendar size={14} className="text-secondary" />
                                                        {formatDate(item.tanggal)}
                                                    </div>
                                                </td>
                                                <td>
                                                    <div className="d-flex flex-column gap-1">
                                                        <div className="fw-black fs-5 text-primary lh-1 mb-1">
                                                            Jam ke-{item.jam_ke}{item.jam_ke_end && item.jam_ke_end !== item.jam_ke ? ` s.d ${item.jam_ke_end}` : ''}
                                                        </div>
                                                        <div className="mini-stat">
                                                            <Clock size={14} className="text-warning" />
                                                            {item.jadwal_mulai?.substring(0, 5) || '--:--'} - {item.jadwal_selesai?.substring(0, 5) || '--:--'}
                                                        </div>
                                                        <div className="mini-stat text-muted" style={{ fontSize: '0.65rem' }} title="Waktu Terakhir Diperbarui">
                                                            <History size={10} className="me-1 opacity-50" />
                                                            Update: {item.waktu_keluar_aktual?.substring(0, 5) || item.waktu_masuk_aktual?.substring(0, 5) || '--:--'}
                                                        </div>
                                                        <div className="mini-stat mt-1" style={{ fontSize: '0.75rem' }}>
                                                            <Users size={12} className="text-primary" />
                                                            {item.total_presensi} Siswa Hadir
                                                        </div>
                                                    </div>
                                                </td>
                                                <td>
                                                    <div className="materi-preview" title={item.materi || 'Belum ada materi'}>
                                                        {item.materi || '-'}
                                                    </div>
                                                </td>
                                                <td>
                                                    {item.status_jurnal === 'Selesai' ? (
                                                        <span className="status-badge status-selesai">
                                                            <CheckCircle size={14} /> Selesai
                                                        </span>
                                                    ) : (
                                                        <span className="status-badge status-running">
                                                            <Clock size={14} /> Berjalan
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="text-end">
                                                    <button className="btn btn-sm btn-light rounded-circle" style={{ width: 36, height: 36, background: 'var(--bg-stripe)', border: '1px solid var(--border-color)' }}>
                                                        <ChevronRight size={16} className="text-primary" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    )
}
