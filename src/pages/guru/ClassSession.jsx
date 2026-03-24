import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { API_BASE, getAuthHeaders } from '../../services/api'
import LoadingSpinner from '../../components/LoadingSpinner'
import {
    Clock, Info, Save, UserX, UserCheck, CheckCircle2,
    BookOpen, Search, Users, Activity, ChevronRight, CheckCircle, ArrowLeft,
    Pencil, X, History
} from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { useCustomAlert } from '../../hooks/useCustomAlert'

// --- STYLES ---
const styles = `
  .session-header {
    background: var(--bg-card);
    padding: 24px 32px;
    border-radius: 32px;
    border: 1px solid var(--border-color);
    box-shadow: var(--shadow-sm);
    margin-bottom: 32px;
  }
  .bento-grid {
    display: grid;
    grid-template-columns: repeat(12, 1fr);
    gap: 24px;
    align-items: start;
  }
  .bento-main { grid-column: span 8; }
  .bento-side { grid-column: span 4; position: sticky; top: 24px; }
  
  @media (max-width: 1200px) {
    .bento-main { grid-column: span 12; }
    .bento-side { grid-column: span 12; position: static; }
  }

  .bento-card {
    background: var(--bg-card);
    border-radius: 28px;
    padding: 32px;
    border: 1px solid var(--border-color);
    box-shadow: var(--shadow-sm);
    margin-bottom: 24px;
  }

  .stats-row {
    display: flex;
    gap: 16px;
    margin-bottom: 32px;
  }
  .stat-pill {
    flex: 1;
    background: var(--bg-stripe);
    padding: 16px 20px;
    border-radius: 20px;
    display: flex;
    align-items: center;
    gap: 12px;
    border: 1px solid transparent;
    transition: all 0.2s;
  }
  .stat-pill:hover { border-color: var(--border-color); background: var(--bg-hover); }
  .stat-icon {
    width: 40px;
    height: 40px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .student-list {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 16px;
  }
  .student-card {
    background: var(--bg-card);
    border: 1px solid var(--border-color);
    border-radius: 20px;
    padding: 16px;
    display: flex;
    align-items: center;
    gap: 16px;
    transition: all 0.2s;
  }
  .student-card:hover { transform: translateY(-2px); box-shadow: var(--shadow-md); border-color: var(--primary-200); }
  .student-avatar {
    width: 48px;
    height: 48px;
    border-radius: 14px;
    background: linear-gradient(135deg, var(--primary-100), var(--primary-200));
    color: var(--primary-700);
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 800;
  }

  .status-actions {
    display: flex;
    gap: 4px;
    background: var(--bg-stripe);
    padding: 4px;
    border-radius: 12px;
    margin-left: auto;
  }
  .status-btn {
    width: 34px;
    height: 34px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: none;
    background: transparent;
    color: var(--text-muted);
    transition: all 0.2s;
  }
  .status-btn.active.hadir { background: var(--success-500); color: #fff; box-shadow: 0 4px 8px rgba(16, 185, 129, 0.3); }
  .status-btn.active.bolos { background: var(--danger-500); color: #fff; box-shadow: 0 4px 8px rgba(239, 68, 68, 0.3); }
  
  .search-wrapper {
    position: relative;
    margin-bottom: 24px;
  }
  .search-icon { position: absolute; left: 16px; top: 50%; transform: translateY(-50%); color: var(--text-muted); }
  .search-input {
    width: 100%;
    padding: 12px 16px 12px 48px;
    border-radius: 16px;
    border: 1.5px solid var(--border-color);
    background: var(--bg-stripe);
    font-weight: 600;
    font-size: 0.9rem;
    transition: all 0.2s;
  }
  .search-input:focus { outline: none; border-color: var(--primary-400); background: var(--bg-card); box-shadow: 0 0 0 4px var(--primary-50); }

  .journal-textarea {
    width: 100%;
    border-radius: 20px;
    padding: 16px;
    border: 1.5px solid var(--border-color);
    background: var(--bg-stripe);
    color: var(--text-primary);
    font-size: 0.95rem;
    line-height: 1.6;
    min-height: 200px;
    resize: none;
    transition: all 0.2s;
  }
  .journal-textarea:focus {
    border-color: var(--primary-400);
    background: var(--bg-card);
    outline: none;
    box-shadow: 0 0 0 4px var(--primary-50);
  }

  .progress-premium {
    height: 10px;
    background: var(--bg-stripe);
    border-radius: 10px;
    overflow: hidden;
    border: 1px solid var(--border-color);
  }
  .progress-bar {
    background: linear-gradient(90deg, var(--primary-500), var(--primary-700));
    transition: width 0.3s ease;
  }

  .stat-pill-sm {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 12px;
    background: var(--bg-stripe);
    border-radius: 100px;
    font-size: 0.75rem;
    font-weight: 700;
    color: var(--text-secondary);
    border: 1px solid var(--border-color);
  }

  .attendance-item {
    border-bottom: 1px solid var(--border-color);
    padding: 12px 0;
  }
  .attendance-item:last-child { border-bottom: none; }

  .btn-status-toggle {
    padding: 6px 12px;
    border-radius: 100px;
    font-size: 0.75rem;
    font-weight: 800;
    border: 1.5px solid var(--border-color);
    background: var(--bg-stripe);
    color: var(--text-muted);
    transition: all 0.2s;
  }
  .btn-status-toggle.active-hadir {
    background: var(--success-500);
    color: #fff;
    border-color: var(--success-500);
    box-shadow: 0 4px 12px rgba(34, 197, 94, 0.25);
  }
  .btn-status-toggle.active-bolos {
    background: var(--danger-500);
    color: #fff;
    border-color: var(--danger-500);
    box-shadow: 0 4px 12px rgba(239, 68, 68, 0.25);
  }
`

export default function ClassSession() {
    const { id } = useParams()
    const navigate = useNavigate()
    const { addToast } = useApp()
    const { confirmAction, showError, showSuccess } = useCustomAlert()
    const [jurnal, setJurnal] = useState(null)
    const [students, setStudents] = useState([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [editMode, setEditMode] = useState(false)
    const [materi, setMateri] = useState('')
    const [searchQuery, setSearchQuery] = useState('')

    const fetchData = async () => {
        setLoading(true)
        try {
            const [jurnalRes, studentRes] = await Promise.all([
                fetch(`${API_BASE}/guru/session/${id}`, { headers: getAuthHeaders() }),
                fetch(`${API_BASE}/guru/session/${id}/students`, { headers: getAuthHeaders() })
            ])

            if (jurnalRes.ok) {
                const jData = await jurnalRes.json()
                console.log("[DEBUG ClassSession] Jurnal Data:", jData)
                if (jData && typeof jData === 'object') {
                    setJurnal(jData)
                    setMateri(jData.materi || '')
                }
            } else {
                console.warn("[DEBUG ClassSession] Failed to fetch journal detail", await jurnalRes.text())
            }

            if (studentRes.ok) {
                const sData = await studentRes.json()
                console.log("[DEBUG ClassSession] Students Data:", sData)
                if (sData && Array.isArray(sData.students)) {
                    setStudents(sData.students)
                } else {
                    setStudents([])
                }
            } else {
                console.warn("[DEBUG ClassSession] Failed to fetch students", await studentRes.text())
            }
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchData()
    }, [id])

    const setStatus = async (studentId, nextStatus) => {
        if (jurnal?.status_jurnal === 'Selesai' && !editMode) return

        const newStudents = students.map(s => s.id === studentId ? { ...s, status: nextStatus } : s)
        setStudents(newStudents)

        try {
            await fetch(`${API_BASE}/guru/session/attendance`, {
                method: 'PUT',
                headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    jurnal_id: id,
                    attendanceList: [{ siswa_id: studentId, status: nextStatus }]
                })
            })
        } catch (err) {
            console.error("Gagal save presensi", err)
        }
    }

    const handleMarkAllHadir = async () => {
        const unLockedStudents = students.filter(s => !s.is_locked)
        const newStudents = students.map(s => s.is_locked ? s : { ...s, status: 'hadir' })
        setStudents(newStudents)

        try {
            await fetch(`${API_BASE}/guru/session/attendance`, {
                method: 'PUT',
                headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    jurnal_id: id,
                    attendanceList: unLockedStudents.map(s => ({ siswa_id: s.id, status: 'hadir' }))
                })
            })
            showSuccess('Presensi Berhasil', 'Semua siswa ditandai hadir.')
        } catch (err) { }
    }

    const handleSaveMateri = async () => {
        setSaving(true)
        try {
            const res = await fetch(`${API_BASE}/guru/session/${id}/materi`, {
                method: 'PUT',
                headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
                body: JSON.stringify({ materi })
            })
            if (!res.ok) throw new Error('Gagal menyimpan catatan')
            showSuccess('Tersimpan', 'Catatan jurnal berhasil diperbarui.')
        } catch (err) {
            showError('Gagal Menyimpan', err.message)
        } finally {
            setSaving(false)
        }
    }

    const handleSaveChanges = async () => {
        setSaving(true)
        try {
            // Bulk save attendance 
            await fetch(`${API_BASE}/guru/session/attendance`, {
                method: 'PUT',
                headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    jurnal_id: id,
                    attendanceList: students.map(s => ({ siswa_id: s.id, status: s.status }))
                })
            })

            // Update materi & timestamp
            const res = await fetch(`${API_BASE}/guru/session/${id}/edit`, {
                method: 'PUT',
                headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
                body: JSON.stringify({ materi })
            })
            if (!res.ok) throw new Error('Gagal menyimpan perubahan')

            showSuccess('Tersimpan', 'Perubahan jurnal berhasil disimpan.')
            setEditMode(false)
            fetchData() // Refresh to get the new waktu_keluar_aktual
        } catch (err) {
            showError('Gagal Menyimpan', err.message)
        } finally {
            setSaving(false)
        }
    }

    const handleFinish = async () => {
        const confirmed = await confirmAction({
            title: 'Selesaikan Sesi?',
            text: 'Akhiri sesi mengajar dan simpan laporan secara permanen? Data yang sudah difinalisasi tidak dapat diubah kembali.',
            confirmText: 'Ya, Selesaikan',
            cancelText: 'Batal',
            icon: 'warning'
        })
        if (!confirmed) return
        setSaving(true)
        try {
            // Bulk save attendance 
            await fetch(`${API_BASE}/guru/session/attendance`, {
                method: 'PUT',
                headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    jurnal_id: id,
                    attendanceList: students.map(s => ({ siswa_id: s.id, status: s.status }))
                })
            })

            // Finish Journal
            const res = await fetch(`${API_BASE}/guru/session/${id}/finish`, {
                method: 'PUT',
                headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
                body: JSON.stringify({ materi })
            })
            if (!res.ok) throw new Error('Gagal mengakhiri sesi')

            showSuccess('Sesi Berakhir', 'Jurnal mengajar telah difinalisasi.')
            navigate('/guru')
        } catch (err) {
            showError('Gagal Finalisasi', err.message)
            setSaving(false)
        }
    }

    if (loading) return <LoadingSpinner fullScreen={true} message="Menyiapkan data kelas..." />
    if (!jurnal) return <div className="p-5 text-center fw-bold">Sesi tidak ditemukan</div>

    const isDone = jurnal.status_jurnal === 'Selesai'
    const filteredStudents = students.filter(s =>
        s.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.nisn.includes(searchQuery)
    )

    // Stats
    const totalSiswa = students.length
    const statsHadir = students.filter(s => s.status === 'hadir').length
    const statsBolos = students.filter(s => s.status === 'bolos').length
    const statsLocked = students.filter(s => s.is_locked).length
    const progressPct = totalSiswa > 0 ? ((statsHadir + statsBolos + statsLocked) / totalSiswa) * 100 : 0

    return (
        <div className="animate-fadeIn pb-5">
            <style dangerouslySetInnerHTML={{ __html: styles }} />

            {/* Premium Header Card */}
            <div className="card shadow-sm border-0 mb-4 overflow-hidden"
                style={{ background: 'var(--bg-card)', borderRadius: '32px', border: '1px solid var(--border-color)', padding: '24px' }}>
                <div className="card-body p-2 d-flex align-items-center gap-4">
                    <div className="bg-primary text-white p-4 rounded-xl d-flex align-items-center justify-content-center shadow-sm"
                        style={{
                            width: '80px', height: '80px',
                            background: 'linear-gradient(135deg, var(--primary-600) 0%, var(--primary-800) 100%)',
                            borderRadius: '24px'
                        }}>
                        <Activity size={40} />
                    </div>
                    <div className="flex-grow-1">
                        <div className="d-flex align-items-center gap-2 mb-2">
                            <span className="badge border-0 px-3 py-2"
                                style={{ borderRadius: 10, fontSize: '0.7rem', background: 'var(--primary-100)', color: 'var(--primary-700)', fontWeight: 800 }}>
                                KELAS {jurnal?.kelas_nama}
                            </span>
                            {isDone ? (
                                <span className="badge border-0 px-3 py-2"
                                    style={{ borderRadius: 10, fontSize: '0.7rem', background: 'var(--success-100)', color: 'var(--success-700)', fontWeight: 800 }}>
                                    SESI SELESAI
                                </span>
                            ) : (
                                <span className="badge border-0 px-3 py-2"
                                    style={{ borderRadius: 10, fontSize: '0.7rem', background: 'var(--warning-100)', color: 'var(--warning-700)', fontWeight: 800 }}>
                                    SESI AKTIF
                                </span>
                            )}
                        </div>
                        <h2 className="fw-black mb-1 text-primary tracking-tight" style={{ fontSize: '1.8rem' }}>{jurnal?.mapel_nama}</h2>
                        <div className="d-flex flex-column gap-1 mt-2">
                            <div className="d-flex align-items-center justify-content-between">
                                <div className="d-flex align-items-center gap-2" style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                                    <Clock size={16} className="text-warning" />
                                    {jurnal?.jadwal_mulai?.substring(0, 5) || '--:--'} - {jurnal?.jadwal_selesai?.substring(0, 5) || '--:--'}
                                    {jurnal?.jam_ke && (
                                        <span className="ms-1 fw-black text-primary" style={{ fontSize: '0.85rem' }}>
                                            (Jam ke-{jurnal.jam_ke}{jurnal.jam_ke_end && jurnal.jam_ke_end !== jurnal.jam_ke ? ` s.d ${jurnal.jam_ke_end}` : ''})
                                        </span>
                                    )}
                                </div>
                                {isDone ? (
                                    <div className="d-flex align-items-center gap-1 text-muted" style={{ fontSize: '0.75rem', fontWeight: 600, opacity: 0.8 }} title="Waktu Terakhir Diperbarui">
                                        <CheckCircle size={12} className="text-success" />
                                        Update: {jurnal.waktu_keluar_aktual?.substring(0, 5)}
                                    </div>
                                ) : (
                                    <div className="d-flex align-items-center gap-1 text-muted" style={{ fontSize: '0.75rem', fontWeight: 600, opacity: 0.8 }} title="Waktu Mulai Aktual">
                                        <History size={12} className="text-secondary" />
                                        Update: {jurnal.waktu_masuk_aktual?.substring(0, 5)}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="d-none d-md-block text-end">
                        <div className="text-muted small fw-bold text-uppercase mb-1">Kehadiran Hari Ini</div>
                        <div className="fw-black text-primary" style={{ fontSize: '1.5rem' }}>{statsHadir}<span className="text-muted fw-normal" style={{ fontSize: '1.0rem' }}>/{totalSiswa}</span></div>
                    </div>
                </div>
            </div>

            <div className="bento-grid">
                {/* Side: Journal & Completion */}
                <div className="bento-side">
                    {/* Journal Card */}
                    <div className="bento-card">
                        <div className="d-flex align-items-center gap-3 mb-4">
                            <div className="icon-box-soft bg-soft-purple" style={{ width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(168, 85, 247, 0.1)', color: '#a855f7' }}>
                                <BookOpen size={18} />
                            </div>
                            <h6 className="fw-bold m-0" style={{ fontSize: '0.9rem' }}>Laporan Jurnal</h6>
                        </div>
                        <div className="mb-4">
                            <label className="form-label fw-bold small text-muted text-uppercase tracking-wider mb-2">Materi / Catatan</label>
                            <textarea
                                className="journal-textarea"
                                placeholder="Tuliskan materi yang diajarkan atau catatan penting lainnya..."
                                value={materi}
                                onChange={e => setMateri(e.target.value)}
                                disabled={isDone && !editMode}
                                style={{ minHeight: '180px' }}
                            />
                        </div>

                        {!isDone ? (
                            <div className="d-flex flex-column gap-2">
                                <button
                                    className="btn btn-outline-primary w-100 py-3 fw-bold rounded-xl d-flex align-items-center justify-content-center gap-2"
                                    onClick={handleSaveMateri}
                                    disabled={saving}
                                >
                                    <Save size={18} />
                                    SIMPAN CATATAN
                                </button>
                                <button
                                    className="btn btn-primary w-100 py-3 fw-black shadow-md rounded-2xl d-flex align-items-center justify-content-center gap-3"
                                    style={{ fontSize: '0.95rem' }}
                                    onClick={handleFinish}
                                    disabled={saving}
                                >
                                    {saving ? (
                                        <span className="spinner-border spinner-border-sm" />
                                    ) : (
                                        <>
                                            <CheckCircle2 size={20} />
                                            SELESAIKAN SESI
                                        </>
                                    )}
                                    <ChevronRight size={18} />
                                </button>
                            </div>
                        ) : editMode ? (
                            <div className="d-flex flex-column gap-2">
                                <button
                                    className="btn btn-primary w-100 py-3 fw-bold rounded-xl d-flex align-items-center justify-content-center gap-2"
                                    onClick={handleSaveChanges}
                                    disabled={saving}
                                >
                                    <Save size={18} />
                                    SIMPAN PERUBAHAN
                                </button>
                                <button
                                    className="btn btn-outline-danger w-100 py-2 fw-bold rounded-xl d-flex align-items-center justify-content-center gap-2"
                                    onClick={() => { setEditMode(false); setMateri(jurnal.materi || '') }}
                                    disabled={saving}
                                >
                                    <X size={18} />
                                    BATAL EDIT
                                </button>
                            </div>
                        ) : (
                            <div className="d-flex flex-column gap-2">
                                <button
                                    className="btn btn-outline-primary w-100 py-3 fw-bold rounded-xl d-flex align-items-center justify-content-center gap-2 mb-1"
                                    onClick={() => setEditMode(true)}
                                >
                                    <Pencil size={18} />
                                    EDIT JURNAL
                                </button>
                                <button
                                    className="btn btn-ghost w-100 py-2 fw-bold text-muted border-0"
                                    style={{ fontSize: '0.8rem' }}
                                    onClick={() => navigate('/guru')}
                                >
                                    Sesi Telah Selesai - Kembali
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Progress Card */}
                    <div className="bento-card">
                        <div className="d-flex align-items-center gap-3 mb-3">
                            <div className="icon-box-soft bg-soft-green" style={{ width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--success-50)', color: 'var(--success-600)' }}>
                                <CheckCircle size={18} />
                            </div>
                            <h6 className="fw-bold m-0" style={{ fontSize: '0.9rem' }}>Progres Presensi</h6>
                        </div>
                        <div className="d-flex justify-content-between align-items-center mb-2">
                            <span className="text-muted small fw-bold">{Math.round(progressPct)}% Selesai</span>
                            <span className="text-primary small fw-black">{statsHadir + statsBolos + statsLocked} / {totalSiswa}</span>
                        </div>
                        <div className="progress-premium mb-3">
                            <div className="progress-bar" style={{ width: `${progressPct}%`, height: '100%' }}></div>
                        </div>
                    </div>
                </div>

                {/* Main: Attendance Center */}
                <div className="bento-main">
                    <div className="bento-card">
                        <div className="d-flex flex-column gap-4">
                            {/* Toolbar */}
                            <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
                                <div className="d-flex align-items-center gap-2">
                                    <div className="icon-box-soft bg-soft-blue" style={{ width: 40, height: 40, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--primary-50)', color: 'var(--primary-600)' }}>
                                        <Users size={20} />
                                    </div>
                                    <h5 className="fw-bold m-0" style={{ letterSpacing: '-0.02em' }}>Daftar Presensi</h5>
                                </div>
                                {(!isDone || editMode) && (
                                    <button
                                        className="btn btn-outline-success btn-sm fw-bold px-4 py-2 rounded-pill d-flex align-items-center gap-2 shadow-sm"
                                        style={{ fontSize: '0.75rem' }}
                                        onClick={handleMarkAllHadir}>
                                        <CheckCircle2 size={16} />
                                        Tandai Semua Hadir
                                    </button>
                                )}
                            </div>

                            {/* Logic Stats */}
                            <div className="d-flex flex-wrap gap-2">
                                <div className="stat-pill-sm">
                                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--success-500)' }}></div>
                                    Hadir: {statsHadir}
                                </div>
                                <div className="stat-pill-sm">
                                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--danger-500)' }}></div>
                                    Bolos: {statsBolos}
                                </div>
                                <div className="stat-pill-sm">
                                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--text-muted)' }}></div>
                                    Terkunci Admin: {statsLocked}
                                </div>
                            </div>

                            {/* Search & List */}
                            <div className="search-wrapper">
                                <Search className="search-icon" size={18} />
                                <input
                                    type="text"
                                    className="search-input"
                                    placeholder="Cari nama siswa atau NISN..."
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                />
                            </div>

                            <div className="attendance-list mt-2">
                                {filteredStudents.length === 0 ? (
                                    <div className="text-center py-5">
                                        <p className="text-muted fw-medium">Siswa tidak ditemukan.</p>
                                    </div>
                                ) : (
                                    filteredStudents.map((s) => {
                                        const isHadir = s.status === 'hadir'
                                        const isBolos = s.status === 'bolos'
                                        return (
                                            <div key={s.id} className="attendance-item p-3 d-flex align-items-center justify-content-between">
                                                <div className="d-flex align-items-center gap-3">
                                                    <div className="student-avatar">
                                                        {s.nama?.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <div className="fw-bold text-primary" style={{ fontSize: '0.95rem' }}>{s.nama}</div>
                                                        <div className="small text-muted fw-medium">NISN: {s.nisn}</div>
                                                    </div>
                                                </div>

                                                <div className="d-flex align-items-center gap-2">
                                                    {s.is_locked ? (
                                                        <div className="px-3 py-1 rounded-pill border small fw-bold text-muted" style={{ background: 'var(--bg-stripe)', fontSize: '0.7rem' }}>
                                                            <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--text-muted)', display: 'inline-block', marginRight: 6 }}></div>
                                                            {s.daily_status?.toUpperCase()}
                                                        </div>
                                                    ) : (isDone && !editMode) ? (
                                                        <span className={`badge border-0 py-2 px-3 fw-bold rounded-pill ${isHadir ? 'badge-success' : isBolos ? 'badge-danger' : 'badge-secondary'}`}>
                                                            {s.status?.toUpperCase() || 'BELUM ABSEN'}
                                                        </span>
                                                    ) : (
                                                        <div className="d-flex gap-2">
                                                            <button
                                                                className={`btn-status-toggle ${isHadir ? 'active-hadir' : ''}`}
                                                                onClick={() => setStatus(s.id, 'hadir')}>
                                                                HADIR
                                                            </button>
                                                            <button
                                                                className={`btn-status-toggle ${isBolos ? 'active-bolos' : ''}`}
                                                                onClick={() => setStatus(s.id, 'bolos')}>
                                                                BOLOS
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )
                                    })
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
