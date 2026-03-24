import { useState, useCallback } from 'react'
import { usePagination } from '../../hooks/usePagination'
import * as XLSX from 'xlsx'
import { useApp } from '../../context/AppContext'
import EmptyState from '../../components/EmptyState'
import { downloadFile } from '../../utils/downloadHelper'
import { useDropzone } from 'react-dropzone'
import { Search, Plus, Upload, Download, Edit2, Trash2, Users, Eye, ChevronLeft, ChevronRight, CheckCircle, Layers, TrendingUp } from 'lucide-react'
import { useCustomAlert } from '../../hooks/useCustomAlert'

// Features
import SiswaForm from '../../features/siswa/SiswaForm'
import SiswaProfile from '../../features/siswa/SiswaProfile'
import ImportDropzoneModal from '../../features/siswa/ImportDropzoneModal'

const styles = /*css*/`
  .siswa-header {
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
  .bg-soft-orange { background: var(--warning-50); color: var(--warning-500); }

  .gender-stat {
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
  .gender-stat:hover {
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
  .student-avatar {
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
  .activity-item:hover .student-avatar {
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
`;

export default function SiswaPage() {
    const { students, addStudent, updateStudent, deleteStudent, units, formatRupiah, addToast } = useApp()
    const { confirmDelete } = useCustomAlert()
    const [search, setSearch] = useState('')
    const [filterKelas, setFilterKelas] = useState('')
    const [filterStatus, setFilterStatus] = useState('semua')
    const [showModal, setShowModal] = useState(false)
    const [editData, setEditData] = useState(null)
    const [viewData, setViewData] = useState(null)

    const allKelas = units.flatMap(u => u.kelas)

    const filtered = (students || []).filter(s => {
        if (!s) return false
        const matchSearch = String(s.nama || '').toLowerCase().includes((search || '').toLowerCase()) || String(s.nisn || '').includes(search || '')
        const matchKelas = !filterKelas || s.kelas === filterKelas
        const matchStatus = filterStatus === 'semua' || s.status === filterStatus
        return matchSearch && matchKelas && matchStatus
    })

    const { page, setPage, totalPages, paginated, resetPage, perPage: PER_PAGE } = usePagination(filtered, 10)

    const handleSave = (data) => {
        if (editData) {
            updateStudent(editData.id, data)
        } else {
            addStudent(data)
        }
        setShowModal(false)
        setEditData(null)
    }

    const handleEdit = (student) => {
        setEditData(student)
        setShowModal(true)
    }

    const handleDelete = async (student) => {
        const isConfirmed = await confirmDelete(
            `Hapus Siswa "${student.nama}"?`,
            "Data profil dan seluruh riwayat tagihan siswa ini akan dihapus secara permanen."
        )
        if (isConfirmed) {
            deleteStudent(student.id)
        }
    }

    const [showImportModal, setShowImportModal] = useState(false)

    const doImportRows = useCallback((rows) => {
        let added = 0
        rows.forEach(row => {
            if (row.Nama && row.NISN) {
                addStudent({
                    nisn: String(row.NISN),
                    nama: row.Nama,
                    kelas: row.Kelas || allKelas[0]?.nama,
                    kelasId: allKelas.find(k => k.nama === String(row.Kelas))?.id || allKelas[0]?.id || 0,
                    jk: row.JK === 'P' ? 'P' : 'L',
                    status: 'aktif',
                    tempatLahir: row['Tempat Lahir'] || '',
                    tglLahir: row['Tgl Lahir'] || '',
                    telp: String(row.Telp || ''),
                    alamat: row.Alamat || '',
                    wali: row.Wali || ''
                })
                added++
            }
        })
        return added
    }, [addStudent, allKelas])

    const handleExportExcel = async () => {
        try {
            const sheetData = filtered.map((s, i) => ({
                No: i + 1,
                NISN: s.nisn,
                Nama: s.nama,
                Kelas: s.kelas,
                JK: s.jk,
                Status: s.status ? s.status.charAt(0).toUpperCase() + s.status.slice(1) : '-',
                'Tempat Lahir': s.tempatLahir,
                'Tgl Lahir': s.tglLahir,
                Wali: s.wali,
                Telp: s.telp,
                Alamat: s.alamat
            }))
            const ws = XLSX.utils.json_to_sheet(sheetData)
            ws['!cols'] = [
                { wch: 5 }, { wch: 15 }, { wch: 25 }, { wch: 12 }, { wch: 6 },
                { wch: 10 }, { wch: 15 }, { wch: 12 }, { wch: 20 }, { wch: 15 }, { wch: 30 },
            ]
            const wb = XLSX.utils.book_new()
            XLSX.utils.book_append_sheet(wb, ws, 'Data Siswa')
            const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
            const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
            await downloadFile(blob, 'Data_Siswa_SIAS.xlsx')
            addToast('success', 'Export Berhasil', `${filtered.length} data siswa berhasil diekspor ke Excel`)
        } catch (err) {
            console.error('Export error:', err)
            addToast('danger', 'Export Gagal', 'Gagal melakukan export Excel.')
        }
    }

    if (viewData) {
        return <SiswaProfile data={viewData} onClose={() => setViewData(null)} />
    }

    const totalSiswa = (students || []).length
    const siswaAktif = (students || []).filter(s => s.status === 'aktif').length
    const totalKelas = new Set((students || []).map(s => s.kelas)).size

    const maleCount = (students || []).filter(s => s.jk === 'L').length
    const femaleCount = (students || []).filter(s => s.jk === 'P').length

    return (
        <div className="admin-page animate-fadeIn">
            <style dangerouslySetInnerHTML={{ __html: styles }} />
            <div className="siswa-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                    <div style={{
                        padding: 14,
                        background: 'linear-gradient(135deg, #1e293b, #334155)',
                        color: '#fbbf24',
                        borderRadius: 18,
                        boxShadow: '0 8px 16px rgba(0,0,0,0.15)'
                    }}>
                        <Users size={32} strokeWidth={2.5} />
                    </div>
                    <div>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, letterSpacing: '-0.025em' }}>Data Induk Siswa</h2>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: 4 }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                <div style={{ width: 8, height: 8, background: '#10b981', borderRadius: '50%' }}></div> Sistem Terverifikasi
                            </span>
                            <span>•</span>
                            <span>Manajemen Profil & Akademik</span>
                        </div>
                    </div>
                </div>
                <div className="d-flex gap-2">
                    <button className="btn btn-light" style={{ borderRadius: 12, padding: '10px 20px', fontWeight: 600 }} onClick={() => setShowImportModal(true)}>
                        <Upload size={18} /> Import
                    </button>
                    <button className="btn btn-light" style={{ borderRadius: 12, padding: '10px 20px', fontWeight: 600 }} onClick={handleExportExcel}>
                        <Download size={18} /> Export
                    </button>
                    <button className="btn btn-primary" style={{ borderRadius: 12, padding: '10px 24px', fontWeight: 700 }} onClick={() => { setEditData(null); setShowModal(true) }}>
                        <Plus size={20} /> Tambah Siswa
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
                                <div className="text-muted small fw-bold text-uppercase letter-spacing-1 mb-1">Total Entitas Siswa</div>
                                <h1 className="fw-black mb-0" style={{ fontSize: '3.5rem', letterSpacing: '-2px', color: 'var(--text-primary)' }}>{totalSiswa}</h1>
                            </div>
                            <div className="d-none d-md-block">
                                <TrendingUp size={48} className="text-primary opacity-10" />
                            </div>
                        </div>

                        <div className="d-flex gap-3 mt-4">
                            <div className="gender-stat">
                                <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#3b82f6' }}></div>
                                <div className="flex-grow-1">
                                    <div className="text-muted" style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase' }}>Laki-laki</div>
                                    <div className="fw-bold" style={{ color: 'var(--text-primary)' }}>{maleCount}</div>
                                </div>
                            </div>
                            <div className="gender-stat">
                                <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#ec4899' }}></div>
                                <div className="flex-grow-1">
                                    <div className="text-muted" style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase' }}>Perempuan</div>
                                    <div className="fw-bold" style={{ color: 'var(--text-primary)' }}>{femaleCount}</div>
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
                                <h3 className="fw-bold mb-0" style={{ color: 'var(--text-primary)' }}>{siswaAktif} <span className="text-muted fw-normal" style={{ fontSize: '0.9rem' }}>Siswa</span></h3>
                            </div>
                        </div>
                    </div>
                    <div className="bento-card">
                        <div className="d-flex align-items-center gap-3">
                            <div className="icon-box-soft bg-soft-purple mb-0" style={{ width: 42, height: 42 }}>
                                <Layers size={20} />
                            </div>
                            <div>
                                <div className="text-muted small fw-bold text-uppercase mb-0" style={{ fontSize: '0.65rem' }}>Rombel Belajar</div>
                                <h3 className="fw-bold mb-0" style={{ color: 'var(--text-primary)' }}>{totalKelas} <span className="text-muted fw-normal" style={{ fontSize: '0.9rem' }}>Kelas</span></h3>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters Area */}
            <div className="card shadow-sm mb-4 border-0" style={{ borderRadius: 32, overflow: 'hidden' }}>
                <div className="card-body p-4">
                    <div className="d-flex flex-column gap-4">
                        <div className="d-flex align-items-center gap-3 flex-wrap">
                            <div style={{ position: 'relative', width: '100%', maxWidth: '400px' }}>
                                <Search size={18} style={{ position: 'absolute', left: '16px', top: '14px', color: 'var(--text-muted)' }} />
                                <input
                                    type="text"
                                    placeholder="Cari nama atau NISN siswa..."
                                    className="form-control border-0 shadow-none"
                                    style={{ paddingLeft: '48px', height: '48px', borderRadius: '14px', background: 'var(--bg-input)', color: 'var(--text-primary)' }}
                                    value={search}
                                    onChange={e => { setSearch(e.target.value); resetPage() }}
                                />
                            </div>

                            <div className="d-flex gap-2 ms-md-auto align-items-center">
                                <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Status:</div>
                                {['semua', 'aktif', 'lulus', 'pindah'].map(s => (
                                    <div
                                        key={s}
                                        className={`filter-pill ${filterStatus === s ? 'active' : ''}`}
                                        onClick={() => { setFilterStatus(s); resetPage() }}
                                    >
                                        {s.toUpperCase()}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="d-flex align-items-center gap-3">
                            <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Kelas:</div>
                            <div className="d-flex gap-2 flex-wrap">
                                <div
                                    className={`filter-pill ${!filterKelas ? 'active' : ''}`}
                                    onClick={() => { setFilterKelas(''); resetPage() }}
                                >
                                    SEMUA
                                </div>
                                {allKelas.map(k => (
                                    <div
                                        key={k.id}
                                        className={`filter-pill ${filterKelas === k.nama ? 'active' : ''}`}
                                        onClick={() => { setFilterKelas(k.nama); resetPage() }}
                                    >
                                        {k.nama}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {filtered.length === 0 ? (
                <EmptyState
                    icon={Users}
                    title="Belum Ada Data Siswa"
                    message="Data siswa belum tersedia. Mulai dengan menambahkan siswa baru atau import dari file Excel."
                    action={
                        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                            <Plus size={16} /> Tambah Siswa Pertama
                        </button>
                    }
                />
            ) : (
                <div className="card shadow-sm border-0" style={{ borderRadius: 32, overflow: 'hidden' }}>
                    <div className="card-body p-0">
                        <div className="table-responsive text-nowrap">
                            <table className="table table-hover align-middle mb-0">
                                <thead style={{ background: 'var(--bg-stripe)' }}>
                                    <tr>
                                        <th className="ps-4 py-3" style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', borderBottom: '1px solid var(--border-color)' }}>Identitas Siswa</th>
                                        <th className="py-3" style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', borderBottom: '1px solid var(--border-color)' }}>NISN</th>
                                        <th className="py-3" style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', borderBottom: '1px solid var(--border-color)' }}>Kelas</th>
                                        <th className="py-3" style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', borderBottom: '1px solid var(--border-color)' }}>J. Kelamin</th>
                                        <th className="py-3" style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', borderBottom: '1px solid var(--border-color)' }}>Status</th>
                                        <th className="text-center py-3 pe-4" style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', borderBottom: '1px solid var(--border-color)' }}>Aksi</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginated.map((s, idx) => (
                                        <tr key={s.id} className="activity-item">
                                            <td className="ps-4">
                                                <div className="d-flex align-items-center gap-3">
                                                    <div className="student-avatar">
                                                        {(s.nama || '?').charAt(0)}
                                                    </div>
                                                    <div>
                                                        <div className="fw-bold" style={{ color: 'var(--text-primary)', fontSize: '0.95rem' }}>{s.nama}</div>
                                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', opacity: 0.8, marginTop: 2 }}>ID: #{s.id.toString().padStart(4, '0')}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="mono fw-bold text-primary" style={{ fontSize: '0.9rem' }}>{s.nisn}</td>
                                            <td>
                                                <span className="badge border-0 px-3 py-2" style={{ borderRadius: 8, fontSize: '0.75rem', background: 'var(--bg-stripe)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}>{s.kelas || 'NON-KELAS'}</span>
                                            </td>
                                            <td>
                                                <div className="d-flex align-items-center gap-2">
                                                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: s.jk === 'L' ? '#3b82f6' : '#ec4899', boxShadow: `0 0 8px ${s.jk === 'L' ? '#3b82f644' : '#ec489944'}` }}></div>
                                                    <span className="fw-medium text-muted" style={{ fontSize: '0.85rem' }}>{s.jk === 'L' ? 'Laki-laki' : 'Perempuan'}</span>
                                                </div>
                                            </td>
                                            <td>
                                                <div className="d-flex align-items-center gap-2">
                                                    <div style={{
                                                        width: 10, height: 10, borderRadius: '50%',
                                                        background: s.status === 'aktif' ? '#10b981' : s.status === 'lulus' ? '#3b82f6' : '#f59e0b',
                                                        boxShadow: `0 0 10px ${s.status === 'aktif' ? '#10b98144' : s.status === 'lulus' ? '#3b82f644' : '#f59e0b44'}`
                                                    }}></div>
                                                    <span className="fw-bold" style={{ fontSize: '0.85rem', textTransform: 'capitalize', color: 'var(--text-primary)' }}>{s.status}</span>
                                                </div>
                                            </td>
                                            <td className="pe-4">
                                                <div className="d-flex justify-content-center gap-2">
                                                    <button className="quick-action-btn" style={{ background: 'var(--bg-stripe)', color: 'var(--text-muted)', border: '1px solid var(--border-color)' }} onClick={() => setViewData(s)} title="Lihat Profil">
                                                        <Eye size={18} />
                                                    </button>
                                                    <button className="quick-action-btn" style={{ background: 'var(--primary-100)', color: 'var(--primary-600)', border: '1px solid transparent' }} onClick={() => handleEdit(s)} title="Edit">
                                                        <Edit2 size={18} />
                                                    </button>
                                                    <button className="quick-action-btn" style={{ background: 'var(--danger-100)', color: 'var(--danger-600)', border: '1px solid transparent' }} onClick={() => handleDelete(s)} title="Hapus">
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="d-flex justify-content-between align-items-center p-4 border-top">
                                <div className="text-muted small fw-bold">
                                    Menampilkan {(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, filtered.length)} dari {filtered.length} siswa
                                </div>
                                <div className="d-flex gap-2 align-items-center bg-light p-1" style={{ borderRadius: 14 }}>
                                    <button
                                        className="btn btn-sm btn-white d-flex align-items-center justify-content-center bg-white border-0 shadow-sm transition-all"
                                        style={{ width: 32, height: 32, borderRadius: 10, color: page === 1 ? '#cbd5e1' : '#475569' }}
                                        disabled={page === 1}
                                        onClick={() => setPage(p => Math.max(1, p - 1))}
                                    >
                                        <ChevronLeft size={16} strokeWidth={3} />
                                    </button>
                                    <div className="d-flex gap-1 px-2 fw-bold text-dark small">
                                        {page} <span className="text-muted mx-1">/</span> {totalPages}
                                    </div>
                                    <button
                                        className="btn btn-sm btn-white d-flex align-items-center justify-content-center bg-white border-0 shadow-sm transition-all"
                                        style={{ width: 32, height: 32, borderRadius: 10, color: page === totalPages ? '#cbd5e1' : '#475569' }}
                                        disabled={page === totalPages}
                                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                    >
                                        <ChevronRight size={16} strokeWidth={3} />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {showModal && (
                <SiswaForm
                    data={editData}
                    allKelas={allKelas}
                    onSave={handleSave}
                    onClose={() => { setShowModal(false); setEditData(null) }}
                />
            )}

            {showImportModal && (
                <ImportDropzoneModal
                    onConfirm={(rows) => {
                        const added = doImportRows(rows)
                        if (added > 0) addToast('success', 'Import Berhasil', `${added} data siswa berhasil diimport dari Excel`)
                        else addToast('warning', 'Tidak Ada Data', 'Tidak ada baris valid. Pastikan kolom Nama dan NISN terisi.')
                        setShowImportModal(false)
                    }}
                    onClose={() => setShowImportModal(false)}
                />
            )}
        </div>
    )
}
