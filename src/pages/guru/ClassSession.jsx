import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { API_BASE, getAuthHeaders } from '../../services/api'
import LoadingSpinner from '../../components/LoadingSpinner'
import { Clock, Info, Save, UserX, UserCheck, CheckCircle2 } from 'lucide-react'

export default function ClassSession() {
    const { id } = useParams()
    const navigate = useNavigate()
    const [jurnal, setJurnal] = useState(null)
    const [students, setStudents] = useState([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [materi, setMateri] = useState('')

    const fetchData = async () => {
        setLoading(true)
        try {
            const [jurnalRes, studentRes] = await Promise.all([
                fetch(`${API_BASE}/guru/session/${id}`, { headers: getAuthHeaders() }),
                fetch(`${API_BASE}/guru/session/${id}/students`, { headers: getAuthHeaders() })
            ])

            if (jurnalRes.ok) {
                const jData = await jurnalRes.json()
                setJurnal(jData)
                setMateri(jData.materi || '')
                if (jData.status_jurnal === 'Selesai') {
                    // Jika sudah selesai, kembali saja ke dashboard atau readonly
                    // Untuk simpel kita set saja statenya
                }
            }
            if (studentRes.ok) {
                const sData = await studentRes.json()
                setStudents(sData.students)
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

    const toggleAttendance = async (studentId, currentStatus, isLocked) => {
        if (isLocked || jurnal?.status_jurnal === 'Selesai') return // Tidak bisa diubah

        // Cycle: hadir -> bolos -> hadir (untuk guru simpel saja)
        const nextStatus = currentStatus === 'hadir' ? 'bolos' : 'hadir'

        const newStudents = students.map(s => s.id === studentId ? { ...s, status: nextStatus } : s)
        setStudents(newStudents)

        // Auto save attendance logic per click for seamless experience
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
            console.error("Gagal auto-save presensi", err)
        }
    }

    const setStatus = async (studentId, nextStatus) => {
        if (jurnal?.status_jurnal === 'Selesai') return

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
        } catch (err) { }
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
        } catch (err) { }
    }

    const handleFinish = async () => {
        if (!window.confirm('Akhiri sesi mengajar dan simpan jurnal secara permanen?')) return
        setSaving(true)
        try {
            // Bulk save attendance just to be sure
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

            alert('Sesi berhasil diselesaikan.')
            navigate('/guru')
        } catch (err) {
            alert(err.message)
            setSaving(false)
        }
    }

    if (loading) return <LoadingSpinner fullScreen={true} message="Menyinkronkan Presensi dengan Admin..." />
    if (!jurnal) return <div className="p-4 text-center">Sesi tidak ditemukan</div>

    const isDone = jurnal.status_jurnal === 'Selesai'

    return (
        <div className="animate-fadeIn">
            {/* Session Header */}
            <div className="card shadow border-0 mb-4 bg-primary text-white overflow-hidden" style={{ borderRadius: '1rem' }}>
                <div className="card-body p-4 position-relative">
                    <div style={{ position: 'absolute', right: '-20px', top: '-20px', opacity: 0.1 }}>
                        <Clock size={200} />
                    </div>
                    <div className="d-flex justify-content-between align-items-start position-relative z-1">
                        <div>
                            <span className="badge bg-white text-primary mb-2 px-3 py-2 rounded-pill fw-bold">
                                Kelas {jurnal.kelas_nama}
                            </span>
                            <h2 className="fw-bold mb-1">{jurnal.mapel_nama}</h2>
                            <p className="mb-0 text-white-50 d-flex align-items-center gap-2">
                                <Clock size={16} />
                                Masuk pkl. {jurnal.waktu_masuk_aktual}
                                {isDone && ` - Selesai pkl. ${jurnal.waktu_keluar_aktual || '...'}`}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Area */}
            <div className="row g-4">
                {/* Left: Jurnal Form */}
                <div className="col-lg-4">
                    <div className="card shadow-sm border-0 sticky-top" style={{ top: '80px' }}>
                        <div className="card-header bg-white border-bottom-0 pt-4 pb-2 px-4">
                            <h5 className="fw-bold m-0 text-dark">Laporan Jurnal</h5>
                        </div>
                        <div className="card-body p-4 pt-2">
                            <form>
                                <div className="mb-4">
                                    <label className="form-label fw-medium text-secondary">Materi yang diajarkan / Catatan:</label>
                                    <textarea
                                        className="form-control bg-light"
                                        rows="6"
                                        placeholder="Tuliskan topik, halaman buku, atau catatan kejadian selama kelas berlangsung..."
                                        value={materi}
                                        onChange={e => setMateri(e.target.value)}
                                        disabled={isDone}
                                    />
                                </div>

                                {!isDone ? (
                                    <button
                                        type="button"
                                        className="btn btn-primary w-100 py-3 fw-bold shadow-sm d-flex align-items-center justify-content-center gap-2"
                                        onClick={handleFinish}
                                        disabled={saving}
                                    >
                                        <Save size={20} />
                                        {saving ? 'Memproses...' : 'Akhiri Sesi & Simpan Laporan'}
                                    </button>
                                ) : (
                                    <button
                                        type="button"
                                        className="btn btn-secondary w-100 py-3 fw-bold"
                                        onClick={() => navigate('/guru')}
                                    >
                                        Kembali ke Dashboard
                                    </button>
                                )}
                            </form>
                        </div>
                    </div>
                </div>

                {/* Right: Interactive Roster */}
                <div className="col-lg-8">
                    <div className="card shadow-sm border-0">
                        <div className="card-header bg-white border-bottom pb-3 pt-4 px-4 d-flex justify-content-between align-items-center">
                            <div>
                                <h5 className="fw-bold m-0 text-dark">Presensi Kehadiran Kelas</h5>
                                <p className="text-muted small mb-0">{students.length} Siswa Terdaftar</p>
                            </div>
                            {!isDone && (
                                <button className="btn btn-outline-success btn-sm fw-bold px-3 py-2 rounded-pill d-flex align-items-center gap-2" onClick={handleMarkAllHadir}>
                                    <CheckCircle2 size={16} />
                                    Tandai Semua Hadir
                                </button>
                            )}
                        </div>
                        <div className="card-body p-0">
                            <ul className="list-group list-group-flush">
                                {students.map((s, idx) => {
                                    const isHadir = s.status === 'hadir'
                                    const isBolos = s.status === 'bolos'

                                    let statusUI = {
                                        color: 'var(--success-700)',
                                        bg: 'var(--success-100)',
                                        icon: <UserCheck size={20} />,
                                        label: 'Hadir'
                                    }

                                    if (s.is_locked) {
                                        statusUI = {
                                            color: 'var(--text-secondary)',
                                            bg: 'var(--bg-stripe)',
                                            icon: <UserX size={20} />,
                                            label: `Terkunci Admin: ${s.daily_status?.toUpperCase()}`
                                        }
                                    } else if (isBolos) {
                                        statusUI = {
                                            color: 'var(--danger-700)',
                                            bg: 'var(--danger-100)',
                                            icon: <UserX size={20} />,
                                            label: 'Tidak di Kelas (Bolos)'
                                        }
                                    }

                                    return (
                                        <li
                                            key={s.id}
                                            className={`list-group-item d-flex justify-content-between align-items-center p-3 px-4 ${s.is_locked ? 'bg-light bg-opacity-50' : ''}`}
                                            style={{ transition: 'all 0.2s' }}
                                        >
                                            <div className="d-flex align-items-center gap-3">
                                                <div className="avatar-circle shadow-sm" style={{
                                                    width: '44px', height: '44px', borderRadius: '14px',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    background: 'var(--primary-50)', color: 'var(--primary-600)',
                                                    fontWeight: 800, fontSize: '1.1rem'
                                                }}>
                                                    {s.nama.charAt(0)}
                                                </div>
                                                <div>
                                                    <div className={`fw-bold mb-0 ${s.is_locked ? 'text-muted' : 'text-dark'}`} style={{ fontSize: '0.95rem' }}>{s.nama}</div>
                                                    <div className="text-muted" style={{ fontSize: '0.75rem', fontWeight: 600 }}>NISN: {s.nisn}</div>
                                                </div>
                                            </div>

                                            <div className="d-flex align-items-center gap-2">
                                                {s.is_locked ? (
                                                    <div className="d-flex align-items-center gap-2 p-1 px-3 rounded-pill bg-light border">
                                                        <Info size={16} className="text-secondary" />
                                                        <span className="small fw-bold text-secondary" style={{ fontSize: '0.75rem' }}>
                                                            {s.daily_status?.toUpperCase()} (ADMIN)
                                                        </span>
                                                    </div>
                                                ) : isDone ? (
                                                    <span className="badge border-0 py-2 px-3 fw-bold" style={{ background: statusUI.bg, color: statusUI.color, borderRadius: '8px' }}>
                                                        {statusUI.label}
                                                    </span>
                                                ) : (
                                                    <div className="d-flex bg-light p-1 rounded-pill border" style={{ gap: '4px' }}>
                                                        <button
                                                            className={`btn border-0 rounded-pill px-3 py-1 btn-sm fw-bold transition-all ${isHadir ? 'btn-success shadow-sm' : 'text-secondary'}`}
                                                            style={{ fontSize: '0.75rem', minWidth: '80px' }}
                                                            onClick={() => setStatus(s.id, 'hadir')}
                                                        >
                                                            {isHadir && <UserCheck size={14} className="me-1" />}
                                                            HADIR
                                                        </button>
                                                        <button
                                                            className={`btn border-0 rounded-pill px-3 py-1 btn-sm fw-bold transition-all ${isBolos ? 'btn-danger shadow-sm' : 'text-secondary'}`}
                                                            style={{ fontSize: '0.75rem', minWidth: '80px' }}
                                                            onClick={() => setStatus(s.id, 'bolos')}
                                                        >
                                                            {isBolos && <UserX size={14} className="me-1" />}
                                                            BOLOS
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </li>
                                    )
                                })}
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
