import { useState, useEffect } from 'react'
import { API_BASE, getAuthHeaders } from '../../services/api'
import LoadingSpinner from '../../components/LoadingSpinner'
import { Calendar, Clock, PlayCircle, PlusCircle, CheckCircle, ChevronRight, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function GuruDashboard() {
    const [data, setData] = useState({ schedules: [], activeJournals: [], day: '', date: '' })
    const [loading, setLoading] = useState(true)
    const [showAdhoc, setShowAdhoc] = useState(false)
    const navigate = useNavigate()

    const [classes, setClasses] = useState([])
    const [mapels, setMapels] = useState([])
    const [adhocForm, setAdhocForm] = useState({ kelas_id: '', mapel_id: '', materi: '' })
    const [submitting, setSubmitting] = useState(false)

    const fetchData = async () => {
        setLoading(true)
        try {
            const res = await fetch(`${API_BASE}/guru/session/today`, { headers: getAuthHeaders() })
            if (res.ok) setData(await res.json())
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    const fetchAdhocData = async () => {
        try {
            const res = await fetch(`${API_BASE}/guru/session/my-classes`, { headers: getAuthHeaders() })
            if (res.ok) {
                const json = await res.json()
                setClasses(json.kelas || [])
                setMapels(json.mapel || [])
            }
        } catch (err) { }
    }

    useEffect(() => {
        fetchData()
        fetchAdhocData()
    }, [])

    const handleStartSession = async (jadwal_id, currentStatus, jurnal_id) => {
        if (currentStatus === 'Running') {
            navigate(`/guru/session/${jurnal_id}`)
            return
        }
        if (currentStatus === 'Selesai') return

        if (!window.confirm('Mulai sesi belajar sekarang? (Waktu masuk akan tercatat saat ini)')) return

        try {
            const res = await fetch(`${API_BASE}/guru/session/start`, {
                method: 'POST',
                headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
                body: JSON.stringify({ jadwal_id })
            })
            const result = await res.json()
            if (!res.ok) throw new Error(result.error)

            navigate(`/guru/session/${result.id}`)
        } catch (err) {
            alert(err.message)
        }
    }

    const handleAdhocSubmit = async (e) => {
        e.preventDefault()
        setSubmitting(true)
        try {
            const res = await fetch(`${API_BASE}/guru/session/ad-hoc`, {
                method: 'POST',
                headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
                body: JSON.stringify(adhocForm)
            })
            const result = await res.json()
            if (!res.ok) throw new Error(result.error)

            navigate(`/guru/session/${result.id}`)
        } catch (err) {
            alert(err.message)
            setSubmitting(false)
        }
    }

    return (
        <div className="animate-fadeIn">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h2 className="fw-bold m-0 text-dark">Jadwal Anda Hari Ini</h2>
                    <p className="text-secondary mb-0">{data.day}, {data.date}</p>
                </div>
                <button className="btn btn-outline-primary shadow-sm rounded-pill fw-medium" onClick={() => setShowAdhoc(true)}>
                    <PlusCircle size={18} className="me-2" /> Sesi Tambahan / Inval
                </button>
            </div>

            {loading ? <LoadingSpinner fullScreen={false} /> : (
                <div className="row g-4">
                    <div className="col-lg-8">
                        <h5 className="fw-bold mb-3 text-secondary">
                            <Calendar size={18} className="me-2" /> Jadwal Master
                        </h5>
                        {data.schedules.length === 0 ? (
                            <div className="card border-0 shadow-sm bg-light text-center py-5">
                                <div className="text-muted">Tidak ada jadwal mengajar hari ini. Selamat beristirahat! 🎉</div>
                            </div>
                        ) : data.schedules.map((j, i) => (
                            <ScheduleCard
                                key={j.id}
                                schedule={j}
                                onAction={() => handleStartSession(j.id, j.status, j.jurnal?.id)}
                            />
                        ))}

                        {data.activeJournals.length > 0 && (
                            <div className="mt-5">
                                <h5 className="fw-bold mb-3 text-secondary">
                                    <Clock size={18} className="me-2" /> Sesi Tambahan / Ad-Hoc Hari Ini
                                </h5>
                                {data.activeJournals.map(aj => (
                                    <ScheduleCard
                                        key={aj.id}
                                        schedule={{ ...aj, jam_mulai: aj.waktu_masuk_aktual, jam_selesai: aj.waktu_keluar_aktual || '??:??', status: aj.status_jurnal, jurnal: aj }}
                                        isAdhoc={true}
                                        onAction={() => navigate(`/guru/session/${aj.id}`)}
                                    />
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="col-lg-4 d-none d-lg-block">
                        <div className="card shadow-sm border-0 sticky-top" style={{ top: '80px' }}>
                            <div className="card-body">
                                <h6>Status Kehadiran Anda</h6>
                                <p className="text-muted small">Waktu kehadiran otomatis terekam pada server saat Anda menekan tombol "Mulai Mengajar" pada jadwal pertama.</p>
                                <hr />
                                <div className="text-center">
                                    <div className="display-4 fw-bold text-success mb-2">
                                        {data.schedules.filter(s => s.status === 'Selesai').length} / {data.schedules.length}
                                    </div>
                                    <div className="text-muted small">Sesi Terselesaikan Hari Ini</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Ad-Hoc */}
            {showAdhoc && (
                <div className="modal-backdrop">
                    <div className="modal">
                        <div className="modal-header border-0 pb-0">
                            <h5 className="fw-bold mb-0">Mulai Sesi Ad-Hoc / Inval</h5>
                            <button className="btn-icon" onClick={() => setShowAdhoc(false)}><X size={20} /></button>
                        </div>
                        <div className="modal-body">
                            <p className="text-muted small">Gunakan ini jika Anda menggantikan guru lain, atau ada jam tambahan yang tidak ada di Master Jadwal.</p>
                            <form onSubmit={handleAdhocSubmit}>
                                <div className="mb-3">
                                    <label className="form-label">Pilih Kelas</label>
                                    <select className="form-select" required value={adhocForm.kelas_id} onChange={e => setAdhocForm({ ...adhocForm, kelas_id: e.target.value })}>
                                        <option value="">-- Pilih Kelas --</option>
                                        {classes.map(k => <option key={k.id} value={k.id}>{k.nama}</option>)}
                                    </select>
                                </div>
                                <div className="mb-3">
                                    <label className="form-label">Pilih Mata Pelajaran</label>
                                    <select className="form-select" required value={adhocForm.mapel_id} onChange={e => setAdhocForm({ ...adhocForm, mapel_id: e.target.value })}>
                                        <option value="">-- Pilih Mapel --</option>
                                        {mapels.map(m => <option key={m.id} value={m.id}>{m.nama}</option>)}
                                    </select>
                                </div>
                                <div className="mb-3">
                                    <label className="form-label">Materi Ajar (Opsional)</label>
                                    <input type="text" className="form-control" value={adhocForm.materi} onChange={e => setAdhocForm({ ...adhocForm, materi: e.target.value })} placeholder="Topik yang akan diajarkan..." />
                                </div>
                                <div className="d-grid mt-4">
                                    <button type="submit" className="btn btn-primary" disabled={submitting}>
                                        {submitting ? 'Memproses...' : 'Mulai Sesi Sekarang'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

function ScheduleCard({ schedule, onAction, isAdhoc }) {
    const isRunning = schedule.status === 'Running'
    const isDone = schedule.status === 'Selesai'

    let badgeColor = 'bg-secondary'
    if (isRunning) badgeColor = 'bg-warning text-dark'
    if (isDone) badgeColor = 'bg-success'

    return (
        <div className={`card shadow-sm border-0 mb-3 ${isRunning ? 'border border-warning border-3' : ''}`} style={{ transition: 'transform 0.2s', cursor: isDone ? 'default' : 'pointer' }}>
            <div className="card-body p-4 d-flex align-items-center justify-content-between">
                <div className="d-flex align-items-center gap-4">
                    <div className="text-center" style={{ minWidth: '80px' }}>
                        <div className="fw-bold fs-5 text-dark">{schedule.jam_mulai?.substring(0, 5)}</div>
                        <div className="text-muted small">s/d {schedule.jam_selesai?.substring(0, 5)}</div>
                    </div>
                    <div style={{ width: '2px', height: '40px', backgroundColor: '#e2e8f0' }}></div>
                    <div>
                        <h5 className="fw-bold mb-1 text-dark">{schedule.mapel_nama}</h5>
                        <div className="d-flex align-items-center gap-2">
                            <span className="badge bg-light text-dark border px-2 py-1">{schedule.kelas_nama}</span>
                            {isAdhoc && <span className="badge bg-primary bg-opacity-10 text-primary">Ad-Hoc / Tambahan</span>}
                            <span className={`badge ${badgeColor}`}>{schedule.status}</span>
                        </div>
                    </div>
                </div>
                <div>
                    {!isDone ? (
                        <button
                            className={`btn ${isRunning ? 'btn-warning text-dark px-4 fw-bold' : 'btn-primary px-4'}`}
                            onClick={onAction}
                        >
                            {isRunning ? 'Lanjutkan Sesi' : 'Mulai Mengajar'}
                            <ChevronRight size={18} className="ms-2" />
                        </button>
                    ) : (
                        <div className="text-success d-flex align-items-center bg-success bg-opacity-10 px-3 py-2 rounded-pill fw-medium">
                            <CheckCircle size={18} className="me-2" /> Selesai ({schedule.jurnal?.waktu_keluar_aktual?.substring(0, 5)})
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
