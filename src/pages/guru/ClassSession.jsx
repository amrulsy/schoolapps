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
                            <h5 className="fw-bold m-0 text-dark">Presensi Kehadiran Kelas ({students.length} Siswa)</h5>
                            <span className="badge bg-light text-dark border px-3 py-2 fw-medium">
                                <Info size={14} className="me-2 text-primary" />
                                Klik pada baris siswa untuk Absen Bolos
                            </span>
                        </div>
                        <div className="card-body p-0">
                            <ul className="list-group list-group-flush">
                                {students.map((s, idx) => {
                                    const isHadir = s.status === 'hadir'
                                    const isBolos = s.status === 'bolos'

                                    let statusUI = {
                                        color: 'text-success',
                                        bg: 'bg-success',
                                        icon: <UserCheck size={20} />,
                                        label: 'Hadir'
                                    }

                                    if (s.is_locked) {
                                        statusUI = { color: 'text-secondary', bg: 'bg-secondary', icon: <UserX size={20} />, label: `Terkunci Admin: ${s.daily_status?.toUpperCase()}` }
                                    } else if (isBolos) {
                                        statusUI = { color: 'text-danger', bg: 'bg-danger', icon: <UserX size={20} />, label: 'Tidak di Kelas (Bolos)' }
                                    }

                                    return (
                                        <li
                                            key={s.id}
                                            className={`list-group-item d-flex justify-content-between align-items-center p-3 px-4 ${s.is_locked ? 'bg-light' : ''}`}
                                            onClick={() => toggleAttendance(s.id, s.status, s.is_locked)}
                                            style={{ cursor: (s.is_locked || isDone) ? 'default' : 'pointer', transition: 'background-color 0.2s' }}
                                        >
                                            <div className="d-flex align-items-center gap-3">
                                                <div className="avatar-circle bg-light text-secondary fw-bold" style={{ width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    {s.nama.charAt(0)}
                                                </div>
                                                <div>
                                                    <div className={`fw-bold ${s.is_locked ? 'text-muted' : 'text-dark'}`}>{s.nama}</div>
                                                    <div className="text-muted small">NISN: {s.nisn}</div>
                                                </div>
                                            </div>

                                            <div className={`d-flex align-items-center gap-2 ${statusUI.color}`}>
                                                {statusUI.icon}
                                                <span className={`badge ${statusUI.bg} bg-opacity-10 border border-opacity-25 py-2 px-3 fw-bold`}>
                                                    {statusUI.label}
                                                </span>
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
