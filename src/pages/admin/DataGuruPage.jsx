import { useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { usePagination } from '../../hooks/usePagination'
import { API_BASE, getAuthHeaders } from '../../services/api'
import LoadingSpinner from '../../components/LoadingSpinner'
import { Users, PlusCircle, Search, Trash2, Edit, Save, X, TrendingUp, CheckCircle, ShieldCheck, Eye, ChevronLeft, ChevronRight, UserPlus, Info, Edit2 } from 'lucide-react'
import { useCustomAlert } from '../../hooks/useCustomAlert'
import { useApp } from '../../context/AppContext'

const styles = /*css*/`
  .guru-header {
    background: var(--bg-card);
    padding: 24px 32px;
    border-radius: 32px;
    border: 1px solid var(--border-color);
    box-shadow: var(--shadow-sm);
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 32px;
  }
  .bento-grid {
    display: grid;
    grid-template-columns: repeat(12, 1fr);
    gap: 24px;
    margin-bottom: 32px;
  }
  .bento-card {
    background: var(--bg-card);
    border-radius: 28px;
    padding: 32px;
    border: 1px solid var(--border-color);
    box-shadow: var(--shadow-sm);
    transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    position: relative;
    overflow: hidden;
    height: 100%;
  }
  .bento-card:hover {
    transform: translateY(-5px);
    box-shadow: var(--shadow-lg);
    border-color: var(--primary-300);
  }
  .bento-main { grid-column: span 7; }
  .bento-side { grid-column: span 5; display: flex; flex-direction: column; gap: 24px; }
  
  @media (max-width: 992px) {
    .bento-main, .bento-side { grid-column: span 12; }
  }

  .icon-box-soft {
    width: 48px;
    height: 48px;
    border-radius: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 20px;
  }
  .bg-soft-blue { background: var(--primary-50); color: var(--primary-500); }
  .bg-soft-green { background: var(--success-50); color: var(--success-500); }
  .bg-soft-purple { background: rgba(168, 85, 247, 0.1); color: #a855f7; }

  .stat-pill {
    background: var(--bg-stripe);
    border-radius: 16px;
    padding: 16px;
    display: flex;
    align-items: center;
    gap: 12px;
    flex: 1;
    border: 1px solid transparent;
    transition: all 0.2s;
  }
  .stat-pill:hover {
    border-color: var(--border-color);
    background: var(--bg-hover);
  }
  .filter-pill {
    padding: 8px 16px;
    border-radius: 12px;
    font-size: 0.85rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    border: 1px solid var(--border-color);
    background: var(--bg-stripe);
    color: var(--text-secondary);
  }
  .filter-pill.active {
    background: var(--primary-600);
    color: #fff;
    border-color: var(--primary-600);
    box-shadow: 0 4px 12px rgba(37, 99, 235, 0.2);
  }
  .filter-pill:hover:not(.active) {
    background: var(--bg-hover);
    color: var(--text-primary);
  }
  .teacher-avatar {
    width: 44px;
    height: 44px;
    border-radius: 12px;
    background: var(--bg-hover);
    border: 1px solid var(--border-color);
    color: var(--primary-500);
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 800;
    font-size: 1.1rem;
    box-shadow: inset 0 2px 4px rgba(0,0,0,0.05);
    transition: all 0.2s;
  }
  .activity-item:hover .teacher-avatar {
    background: var(--primary-50);
    color: var(--primary-600);
    border-color: var(--primary-200);
    transform: scale(1.05);
  }
  .quick-action-btn {
    width: 36px;
    height: 36px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
    border: none;
  }
  .quick-action-btn:hover {
    transform: scale(1.1);
  }
  .activity-item:hover { 
    background: var(--bg-hover); 
    transform: translateX(4px); 
    box-shadow: var(--shadow-sm);
  }

  /* Portal Modal Styles (Banner-like) */
  .modal-backdrop {
    position: fixed; inset: 0; background: rgba(15, 23, 42, 0.7);
    backdrop-filter: blur(12px); z-index: 10000;
    display: flex; align-items: center; justify-content: center; padding: 20px;
  }
  .modal-container {
    background: var(--bg-card); width: 100%; max-width: 800px;
    max-height: 90vh; border-radius: 28px;
    display: flex; flex-direction: column; overflow: hidden;
    box-shadow: 0 40px 80px -20px rgba(0,0,0,0.3);
    border: 1px solid var(--border-color);
    animation: fade-scale-in 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  }
  .modal-header {
    padding: 24px 28px; background: var(--bg-card);
    border-bottom: 1px solid var(--border-color); display: flex;
    justify-content: space-between; align-items: center;
  }
  .header-content { display: flex; align-items: center; gap: 16px; }
  .header-icon { 
    width: 48px; height: 48px; border-radius: 14px;
    background: var(--primary-100); color: var(--primary-600);
    display: flex; align-items: center; justify-content: center;
  }
  .header-text h2 { margin: 0; font-size: 1.25rem; font-weight: 800; color: var(--text-primary); letter-spacing: -0.5px; }
  .header-text p { margin: 2px 0 0; font-size: 0.8125rem; color: var(--text-secondary); fw-bold; }

  .btn-close-circle {
    width: 36px; height: 36px; border-radius: 50%; border: none;
    background: var(--bg-stripe); color: var(--text-secondary); font-size: 20px;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; transition: all 0.2s;
  }
  .btn-close-circle:hover { background: var(--danger-100); color: var(--danger-600); transform: rotate(90deg); }

  .modal-body-scroll {
    flex: 1; overflow-y: auto; padding: 28px; background: var(--bg-stripe);
  }
  .form-section-card {
    background: var(--bg-card); padding: 24px; border-radius: 20px;
    border: 1px solid var(--border-color); box-shadow: var(--shadow-sm);
    margin-bottom: 24px;
  }
  .section-title { display: flex; align-items: center; gap: 10px; margin-bottom: 20px; }
  .section-title h3 { margin: 0; font-size: 0.75rem; font-weight: 800; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.1em; }
  .section-title svg { color: var(--primary-500); }

  .modern-input {
    width: 100%; padding: 12px 16px; border-radius: 12px;
    border: 1.5px solid var(--border-color); background: var(--bg-input);
    color: var(--text-primary); font-size: 0.9375rem; font-weight: 600;
    transition: all 0.2s;
  }
  .modern-input:focus { border-color: var(--primary-500); background: var(--bg-card); outline: none; box-shadow: 0 0 0 4px var(--primary-50); }

  .modal-footer-custom {
    padding: 20px 28px; background: var(--bg-card); border-top: 1px solid var(--border-color);
    display: flex; justify-content: flex-end; gap: 12px;
  }
  .btn-glass-secondary {
    padding: 12px 24px; border-radius: 14px; border: 1px solid var(--border-color);
    background: transparent; color: var(--text-secondary); font-weight: 700; cursor: pointer; transition: all 0.2s;
  }
  .btn-glass-secondary:hover { background: var(--bg-stripe); color: var(--text-primary); }

  .btn-modern-primary {
    padding: 12px 28px; border-radius: 14px; border: none;
    background: var(--primary-600); color: #fff; font-weight: 700;
    display: flex; align-items: center; gap: 10px; cursor: pointer;
    transition: all 0.2s; box-shadow: 0 4px 12px rgba(37, 99, 235, 0.2);
  }
  .btn-modern-primary:hover { background: var(--primary-700); transform: translateY(-1px); box-shadow: 0 6px 16px rgba(37, 99, 235, 0.3); }

  @keyframes fade-scale-in {
    from { opacity: 0; transform: scale(0.95) translateY(10px); }
    to { opacity: 1; transform: scale(1) translateY(0); }
  }
`;

export default function DataGuruPage() {
    const { confirmDelete } = useCustomAlert()
    const [guruList, setGuruList] = useState([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [showModal, setShowModal] = useState(false)
    const [isEdit, setIsEdit] = useState(false)
    const [submitLoading, setSubmitLoading] = useState(false)

    const [formData, setFormData] = useState({ id: '', nip: '', nama: '', username: '', password: '' })
    const [filterStatus, setFilterStatus] = useState('semua')

    const fetchData = async () => {
        setLoading(true)
        try {
            const res = await fetch(`${API_BASE}/admin/guru`, { headers: getAuthHeaders() })
            if (res.ok) setGuruList(await res.json())
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchData()
    }, [])

    const filtered = guruList.filter(g => {
        const matchSearch = (g.nama || '').toLowerCase().includes(search.toLowerCase()) ||
            (g.nip || '').includes(search)
        const matchStatus = filterStatus === 'semua' || (filterStatus === 'aktif' && g.username) || (filterStatus === 'non-aktif' && !g.username)
        return matchSearch && matchStatus
    })

    const { page, setPage, totalPages, paginated, resetPage, perPage: PER_PAGE } = usePagination(filtered, 10)

    // Stats
    const totalGuru = guruList.length
    const withLoginCount = guruList.filter(g => g.username).length
    const activePercentage = totalGuru > 0 ? Math.round((withLoginCount / totalGuru) * 100) : 0

    const openCreateModal = () => {
        setIsEdit(false)
        setFormData({ id: '', nip: '', nama: '', username: '', password: '' })
        setShowModal(true)
    }

    const openEditModal = (guru) => {
        setIsEdit(true)
        setFormData({ id: guru.id, nip: guru.nip || '', nama: guru.nama, username: guru.username || '', password: '' })
        setShowModal(true)
    }

    const handleDelete = async (id, nama) => {
        if (!window.confirm(`Yakin ingin menghapus guru ${nama}? (Akun login juga akan terhapus jika ada)`)) return
        try {
            const res = await fetch(`${API_BASE}/admin/guru/${id}`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            })
            if (!res.ok) throw new Error('Gagal menghapus')
            fetchData()
        } catch (err) {
            alert(err.message)
        }
    }

    const saveTeacher = async (e) => {
        e.preventDefault()
        setSubmitLoading(true)
        try {
            const method = isEdit ? 'PUT' : 'POST'
            const url = isEdit ? `${API_BASE}/admin/guru/${formData.id}` : `${API_BASE}/admin/guru`

            const payload = { ...formData }
            if (isEdit && !payload.password) delete payload.password // don't send empty password on edit

            const res = await fetch(url, {
                method,
                headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })

            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'Terjadi kesalahan')

            alert(isEdit ? 'Data berhasil diupdate' : 'Guru berhasil ditambahkan')
            setShowModal(false)
            fetchData()
        } catch (err) {
            alert(err.message)
        } finally {
            setSubmitLoading(false)
        }
    }

    return (
        <div className="admin-page animate-fadeIn pb-5">
            <style dangerouslySetInnerHTML={{ __html: styles }} />

            <div className="guru-header">
                <div>
                    <div className="d-flex align-items-center gap-3 mb-1">
                        <div style={{
                            width: 52, height: 52,
                            background: 'linear-gradient(135deg, #1e293b, #334155)',
                            borderRadius: '16px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            boxShadow: '0 8px 16px rgba(0,0,0,0.1)'
                        }}>
                            <Users size={28} />
                        </div>
                        <div>
                            <h2 className="fw-black mb-0" style={{ letterSpacing: '-1px', color: 'var(--text-primary)' }}>Data Master Guru</h2>
                            <p className="text-muted small fw-bold mb-0 text-uppercase letter-spacing-1">Personal Pengajar & Manajemen Akses</p>
                        </div>
                    </div>
                </div>
                <div className="d-flex gap-2">
                    <button className="btn btn-primary shadow-sm" style={{ borderRadius: '14px', padding: '12px 24px', fontWeight: 700 }} onClick={openCreateModal}>
                        <PlusCircle size={20} className="me-2" /> Tambah Guru
                    </button>
                </div>
            </div>

            {/* Bento Stats Overview */}
            <div className="bento-grid">
                {/* Main Card */}
                <div className="bento-main">
                    <div className="bento-card">
                        <div className="d-flex justify-content-between align-items-start mb-4">
                            <div>
                                <div className="icon-box-soft bg-soft-blue">
                                    <Users size={24} />
                                </div>
                                <div className="text-muted small fw-bold text-uppercase letter-spacing-1 mb-1">Total Entitas Pengajar</div>
                                <h1 className="fw-black mb-0" style={{ fontSize: '3.5rem', letterSpacing: '-2px', color: 'var(--text-primary)' }}>{totalGuru}</h1>
                            </div>
                            <div className="d-none d-md-block">
                                <TrendingUp size={48} className="text-primary opacity-10" />
                            </div>
                        </div>

                        <div className="d-flex gap-3 mt-4">
                            <div className="stat-pill">
                                <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#3b82f6' }}></div>
                                <div className="flex-grow-1">
                                    <div className="text-muted" style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase' }}>Dengan Akses Login</div>
                                    <div className="fw-bold" style={{ color: 'var(--text-primary)' }}>{withLoginCount}</div>
                                </div>
                            </div>
                            <div className="stat-pill">
                                <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#10b981' }}></div>
                                <div className="flex-grow-1">
                                    <div className="text-muted" style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase' }}>Tingkat Aktifitas</div>
                                    <div className="fw-bold" style={{ color: 'var(--text-primary)' }}>{activePercentage}%</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Side Cards */}
                <div className="bento-side">
                    <div className="bento-card">
                        <div className="d-flex align-items-center gap-3">
                            <div className="icon-box-soft bg-soft-green mb-0" style={{ width: 42, height: 42 }}>
                                <CheckCircle size={20} />
                            </div>
                            <div>
                                <div className="text-muted small fw-bold text-uppercase mb-0" style={{ fontSize: '0.65rem' }}>Status Aktif</div>
                                <h3 className="fw-bold mb-0" style={{ color: 'var(--text-primary)' }}>{withLoginCount} <span className="text-muted fw-normal" style={{ fontSize: '0.9rem' }}>Guru</span></h3>
                            </div>
                        </div>
                    </div>
                    <div className="bento-card">
                        <div className="d-flex align-items-center gap-3">
                            <div className="icon-box-soft bg-soft-purple mb-0" style={{ width: 42, height: 42 }}>
                                <ShieldCheck size={20} />
                            </div>
                            <div>
                                <div className="text-muted small fw-bold text-uppercase mb-0" style={{ fontSize: '0.65rem' }}>Hak Akses</div>
                                <h3 className="fw-bold mb-0" style={{ color: 'var(--text-primary)' }}>Admin <span className="text-muted fw-normal" style={{ fontSize: '0.9rem' }}>Entry</span></h3>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters Area */}
            <div className="card shadow-sm mb-4 border-0" style={{ borderRadius: 32, overflow: 'hidden' }}>
                <div className="card-body p-4">
                    <div className="d-flex align-items-center gap-3 flex-wrap">
                        <div style={{ position: 'relative', width: '100%', maxWidth: '400px' }}>
                            <Search size={18} style={{ position: 'absolute', left: '16px', top: '14px', color: 'var(--text-muted)' }} />
                            <input
                                type="text"
                                placeholder="Cari nama atau NIP guru..."
                                className="form-control border-0 shadow-none"
                                style={{ paddingLeft: '48px', height: '48px', borderRadius: '14px', background: 'var(--bg-input)', color: 'var(--text-primary)' }}
                                value={search}
                                onChange={e => { setSearch(e.target.value); resetPage() }}
                            />
                        </div>

                        <div className="d-flex gap-2 ms-md-auto align-items-center">
                            <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Filter:</div>
                            {[
                                { id: 'semua', label: 'SEMUA' },
                                { id: 'aktif', label: 'DENGAN AKSES' },
                                { id: 'non-aktif', label: 'TANPA AKSES' }
                            ].map(s => (
                                <div
                                    key={s.id}
                                    className={`filter-pill ${filterStatus === s.id ? 'active' : ''}`}
                                    onClick={() => { setFilterStatus(s.id); resetPage() }}
                                >
                                    {s.label}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {loading ? <LoadingSpinner fullScreen={false} /> : (
                <div className="card shadow-sm border-0" style={{ borderRadius: 32, overflow: 'hidden' }}>
                    <div className="card-body p-0">
                        <div className="table-responsive text-nowrap">
                            <table className="table table-hover align-middle mb-0">
                                <thead style={{ background: 'var(--bg-stripe)' }}>
                                    <tr>
                                        <th className="ps-4 py-3" style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', borderBottom: '1px solid var(--border-color)' }}>Identitas Pengajar</th>
                                        <th className="py-3" style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', borderBottom: '1px solid var(--border-color)' }}>NIP</th>
                                        <th className="py-3" style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', borderBottom: '1px solid var(--border-color)' }}>Hak Akses</th>
                                        <th className="text-center py-3 pe-4" style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', borderBottom: '1px solid var(--border-color)' }}>Aksi</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginated.length === 0 ? (
                                        <tr><td colSpan="4" className="text-center py-5">
                                            <Users size={48} className="text-muted opacity-20 mb-3" />
                                            <p className="text-muted fw-bold">Tidak ada data guru yang ditemukan</p>
                                        </td></tr>
                                    ) : paginated.map(g => (
                                        <tr key={g.id} className="activity-item">
                                            <td className="ps-4">
                                                <div className="d-flex align-items-center gap-3">
                                                    <div className="teacher-avatar">
                                                        {(g.nama || '?').charAt(0)}
                                                    </div>
                                                    <div>
                                                        <div className="fw-bold" style={{ color: 'var(--text-primary)', fontSize: '0.95rem' }}>{g.nama}</div>
                                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', opacity: 0.8, marginTop: 2 }}>Username: @{g.username || '-'}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="mono fw-bold text-primary" style={{ fontSize: '0.9rem' }}>{g.nip || '-'}</td>
                                            <td>
                                                {g.username ? (
                                                    <div className="d-flex align-items-center gap-2">
                                                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px #10b98144' }}></div>
                                                        <span className="fw-medium text-muted" style={{ fontSize: '0.85rem' }}>Terverifikasi</span>
                                                    </div>
                                                ) : (
                                                    <div className="d-flex align-items-center gap-2">
                                                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--gray-400)' }}></div>
                                                        <span className="fw-medium text-muted" style={{ fontSize: '0.85rem' }}>Belum Ada Akses</span>
                                                    </div>
                                                )}
                                            </td>
                                            <td className="pe-4">
                                                <div className="d-flex justify-content-center gap-2">
                                                    <button className="quick-action-btn" style={{ background: 'var(--primary-100)', color: 'var(--primary-600)', border: '1px solid transparent' }} onClick={() => openEditModal(g)} title="Edit">
                                                        <Edit size={18} />
                                                    </button>
                                                    <button className="quick-action-btn" style={{ background: 'var(--danger-100)', color: 'var(--danger-600)', border: '1px solid transparent' }} onClick={() => confirmDelete(() => handleDelete(g.id, g.nama))} title="Hapus">
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {totalPages > 1 && (
                            <div className="d-flex justify-content-between align-items-center p-4 border-top" style={{ borderColor: 'var(--border-color)' }}>
                                <div className="text-muted small">
                                    Menampilkan <b>{paginated.length}</b> dari <b>{filtered.length}</b> guru
                                </div>
                                <div className="d-flex gap-2">
                                    <button
                                        className="btn btn-icon-sm"
                                        disabled={page === 1}
                                        onClick={() => setPage(p => p - 1)}
                                        style={{ background: 'var(--bg-stripe)', border: '1px solid var(--border-color)' }}
                                    >
                                        <ChevronLeft size={18} />
                                    </button>
                                    {[...Array(totalPages)].map((_, i) => (
                                        <button
                                            key={i}
                                            className={`btn btn-icon-sm ${page === i + 1 ? 'btn-primary' : ''}`}
                                            onClick={() => setPage(i + 1)}
                                            style={page !== i + 1 ? { background: 'var(--bg-stripe)', border: '1px solid var(--border-color)' } : {}}
                                        >
                                            {i + 1}
                                        </button>
                                    ))}
                                    <button
                                        className="btn btn-icon-sm"
                                        disabled={page === totalPages}
                                        onClick={() => setPage(p => p + 1)}
                                        style={{ background: 'var(--bg-stripe)', border: '1px solid var(--border-color)' }}
                                    >
                                        <ChevronRight size={18} />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {showModal && createPortal(
                <div className="modal-backdrop">
                    <div className="modal-container">
                        <div className="modal-header">
                            <div className="header-content">
                                <div className="header-icon">
                                    {isEdit ? <Edit size={24} /> : <UserPlus size={24} />}
                                </div>
                                <div className="header-text">
                                    <h2>{isEdit ? 'Edit Data Guru' : 'Tambah Guru Baru'}</h2>
                                    <p>Kelola profil dan hak akses tenaga pengajar</p>
                                </div>
                            </div>
                            <button className="btn-close-circle" onClick={() => setShowModal(false)} title="Tutup">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="modal-body-scroll">
                            <form id="teacherForm" onSubmit={saveTeacher}>
                                <div className="form-section-card">
                                    <div className="section-title">
                                        <Info size={18} />
                                        <h3>Identitas Guru</h3>
                                    </div>
                                    <div className="row g-3">
                                        <div className="col-md-6">
                                            <div className="form-group mb-3">
                                                <label className="form-label small fw-bold text-uppercase text-muted mb-2">Nama Lengkap <span className="text-danger">*</span></label>
                                                <input type="text" className="modern-input" value={formData.nama} onChange={e => setFormData({ ...formData, nama: e.target.value })} required placeholder="Nama lengkap & gelar" />
                                            </div>
                                        </div>
                                        <div className="col-md-6">
                                            <div className="form-group mb-3">
                                                <label className="form-label small fw-bold text-uppercase text-muted mb-2">NIP / NUPTK <span className="text-danger">*</span></label>
                                                <input type="text" className="modern-input" value={formData.nip} onChange={e => setFormData({ ...formData, nip: e.target.value })} required placeholder="Nomor Induk Pegawai" />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="row g-3">
                                        <div className="col-md-6">
                                            <div className="form-group mb-3">
                                                <label className="form-label small fw-bold text-uppercase text-muted mb-2">Jenis Kelamin</label>
                                                <select className="modern-input" value={formData.jenis_kelamin} onChange={e => setFormData({ ...formData, jenis_kelamin: e.target.value })}>
                                                    <option value="L">Laki-laki</option>
                                                    <option value="P">Perempuan</option>
                                                </select>
                                            </div>
                                        </div>
                                        <div className="col-md-6">
                                            <div className="form-group mb-3">
                                                <label className="form-label small fw-bold text-uppercase text-muted mb-2">No. WhatsApp</label>
                                                <input type="text" className="modern-input" value={formData.no_telp} onChange={e => setFormData({ ...formData, no_telp: e.target.value })} placeholder="628..." />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="form-section-card">
                                    <div className="section-title">
                                        <ShieldCheck size={18} />
                                        <h3>Akses Login Portal</h3>
                                    </div>
                                    <div className="form-group mb-3">
                                        <label className="form-label small fw-bold text-uppercase text-muted mb-2">Username</label>
                                        <input type="text" className="modern-input" value={formData.username} onChange={e => setFormData({ ...formData, username: e.target.value })} placeholder="Username untuk login" />
                                    </div>
                                    <div className="form-group mb-2">
                                        <label className="form-label small fw-bold text-uppercase text-muted mb-2">Password {isEdit && '(Kosongkan jika tidak ubah)'}</label>
                                        <input type="password" className="modern-input" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} placeholder="Password baru" required={!isEdit && (formData.username || '').length > 0} />
                                    </div>
                                    <p className="text-muted mb-0 small">* Username dan password digunakan untuk akses portal guru.</p>
                                </div>
                            </form>
                        </div>

                        <div className="modal-footer-custom">
                            <button type="button" className="btn-glass-secondary" onClick={() => setShowModal(false)}>Batal</button>
                            <button type="submit" form="teacherForm" className="btn-modern-primary" disabled={submitLoading}>
                                {submitLoading ? <LoadingSpinner size="sm" /> : <><Save size={18} /> Simpan Data</>}
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    )
}
