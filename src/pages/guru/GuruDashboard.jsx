import { useState, useEffect } from 'react'
import { API_BASE, getAuthHeaders } from '../../services/api'
import LoadingSpinner from '../../components/LoadingSpinner'
import {
    Calendar, Clock, PlayCircle, PlusCircle, CheckCircle,
    ChevronRight, X, Layout, BookOpen, UserCheck,
    TrendingUp, ArrowRight, HelpCircle, Info, Activity
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../../context/AppContext'

// --- STYLES ---
const styles = /*css*/`
  .guru-header {
    background: var(--bg-card);
    padding: 24px 32px;
    border-radius: 28px;
    border: 1px solid var(--border-color);
    box-shadow: var(--shadow-sm);
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
    position: relative;
    overflow: hidden;
  }
  .guru-header::after {
    content: '';
    position: absolute;
    top: -50%; right: -10%;
    width: 300px; height: 300px;
    background: radial-gradient(circle, var(--primary-50) 0%, transparent 70%);
    z-index: 0;
    pointer-events: none;
  }
  .bento-grid {
    display: grid;
    grid-template-columns: repeat(12, 1fr);
    gap: 20px;
    margin-bottom: 32px;
  }
  .bento-main { grid-column: span 7; }
  .bento-side { grid-column: span 5; display: flex; flex-direction: column; gap: 20px; }
  
  @media (max-width: 1200px) {
    .bento-main, .bento-side { grid-column: span 12; }
  }

  .bento-card {
    background: var(--bg-card);
    border-radius: 24px;
    padding: 24px;
    border: 1px solid var(--border-color);
    box-shadow: var(--shadow-sm);
    height: 100%;
    transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    display: flex;
    flex-direction: column;
  }
  .bento-card:hover {
    box-shadow: var(--shadow-md);
    border-color: var(--primary-200);
  }

  .icon-box-gradient {
    width: 52px;
    height: 52px;
    border-radius: 16px;
    background: linear-gradient(135deg, var(--primary-600), var(--primary-800));
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 8px 16px rgba(37, 99, 235, 0.2);
    flex-shrink: 0;
  }

  .schedule-card {
    background: var(--bg-card);
    border-radius: 20px;
    padding: 20px;
    border: 1px solid var(--border-color);
    transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    position: relative;
    overflow: hidden;
    margin-bottom: 16px;
  }
  .schedule-card.running {
    border: 1px solid var(--primary-500);
    background: linear-gradient(to right, var(--bg-card), var(--primary-50));
  }

  .btn-play-session {
    background: var(--primary-600);
    color: #fff;
    border: none;
    padding: 10px 20px;
    border-radius: 12px;
    font-weight: 700;
    font-size: 0.9rem;
    display: flex;
    align-items: center;
    gap: 8px;
    transition: all 0.2s;
    box-shadow: 0 4px 12px rgba(37, 99, 235, 0.2);
  }
  .btn-play-session:hover {
    background: var(--primary-700);
    transform: translateY(-1px);
  }

  .btn-glass-sidebar {
    background: var(--primary-50);
    backdrop-filter: blur(8px);
    color: var(--primary-600);
    border: 1px solid var(--primary-100);
    padding: 12px;
    border-radius: 14px;
    width: 100%;
    font-weight: 700;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
  }
  .btn-glass-sidebar:hover {
    background: var(--primary-100);
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(var(--primary-rgb), 0.15);
  }

  .progress-premium {
    height: 8px;
    border-radius: 10px;
    background: var(--bg-stripe);
    overflow: hidden;
    position: relative;
    border: 1px solid var(--border-color);
  }
  .progress-premium .progress-bar {
    background: linear-gradient(90deg, var(--primary-500), var(--primary-600));
    border-radius:20px;
    transition: width 1s cubic-bezier(0.16, 1, 0.3, 1);
  }

  /* Modal Overhaul */
  .modal-backdrop {
    position: fixed; inset: 0; background: rgba(15, 23, 42, 0.7);
    backdrop-filter: blur(12px); z-index: 10000;
    display: flex; align-items: center; justify-content: center; padding: 20px;
  }
  .modal-container {
    background: var(--bg-card); width: 100%; max-width: 500px;
    border-radius: 32px; overflow: hidden;
    box-shadow: 0 40px 80px -20px rgba(0,0,0,0.3);
    border: 1px solid var(--border-color);
    animation: modal-in 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  }
  @keyframes modal-in {
    from { opacity: 0; transform: scale(0.95) translateY(20px); }
    to { opacity: 1; transform: scale(1) translateY(0); }
  }
`

export default function GuruDashboard() {
    const { currentUser } = useApp()
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

    const completedCount = data.schedules.filter(s => s.status === 'Selesai').length
    const totalCount = data.schedules.length
    const progressPct = totalCount > 0 ? (completedCount / totalCount) * 100 : 0

    return (
        <div className="animate-fadeIn pb-5">
            <style dangerouslySetInnerHTML={{ __html: styles }} />

            {/* PREMIUM GURU HEADER */}
            <div className="guru-header shadow-sm border-light">
                <div className="d-flex align-items-center gap-4 position-relative" style={{ zIndex: 1 }}>
                    <div className="icon-box-gradient">
                        <Calendar size={28} />
                    </div>
                    <div>
                        <h2 className="fw-black mb-1 text-primary tracking-tight">Selamat Datang, {currentUser?.nama?.split(' ')[0]}!</h2>
                        <div className="d-flex align-items-center gap-3">
                            <span className="text-secondary fw-bold" style={{ fontSize: '0.85rem' }}>
                                {data.day}, {data.date}
                            </span>
                            <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'var(--border-color)' }}></div>
                            <span className="text-primary fw-bold" style={{ fontSize: '0.85rem' }}>
                                {totalCount} Sesi Terjadwal
                            </span>
                        </div>
                    </div>
                </div>
                <button
                    className="btn btn-primary d-flex align-items-center gap-2 px-4 py-2 rounded-2xl border-0 shadow-md fw-bold"
                    style={{ position: 'relative', zIndex: 1 }}
                    onClick={() => setShowAdhoc(true)}
                >
                    <PlusCircle size={20} />
                    Mulai Sesi Ad-Hoc
                </button>
            </div>

            {loading ? <LoadingSpinner fullScreen={false} /> : (
                <div className="bento-grid">
                    {/* MAIN CONTENT: SCHEDULES */}
                    <div className="bento-main">
                        <div className="d-flex align-items-center justify-content-between mb-4 px-1">
                            <h5 className="fw-black mb-0 d-flex align-items-center gap-2 text-primary">
                                <Layout size={20} className="text-primary" />
                                Jadwal Mengajar Hari Ini
                            </h5>
                            <span className="badge bg-primary bg-opacity-10 text-primary px-3 py-2 rounded-pill fw-bold" style={{ fontSize: '0.75rem' }}>
                                {totalCount - completedCount} Sesi Tersisa
                            </span>
                        </div>

                        {data.schedules.length === 0 ? (
                            <div className="bento-card text-center d-flex flex-column align-items-center justify-content-center py-5 border-light shadow-sm">
                                <div className="bg-light rounded-2xl p-4 mb-4" style={{ width: '80px', height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <BookOpen size={40} className="text-primary opacity-50" />
                                </div>
                                <h4 className="fw-black text-primary mb-2">Tidak Ada Jadwal</h4>
                                <p className="text-muted max-w-sm mx-auto fw-medium">Anda tidak memiliki jadwal mengajar hari ini. Gunakan waktu ini untuk persiapan materi atau istirahat! 🎉</p>
                            </div>
                        ) : (
                            data.schedules.map((j) => (
                                <ScheduleCard
                                    key={j.id}
                                    schedule={j}
                                    onAction={() => handleStartSession(j.id, j.status, j.jurnal?.id)}
                                />
                            ))
                        )}

                        {data.activeJournals.length > 0 && (
                            <div className="mt-5">
                                <h5 className="fw-black mb-4 d-flex align-items-center gap-2 text-primary px-1">
                                    <Clock size={20} className="text-warning" />
                                    Sesi Tambahan / Ad-Hoc
                                </h5>
                                {data.activeJournals.map(aj => (
                                    <ScheduleCard
                                        key={aj.id}
                                        schedule={{
                                            ...aj,
                                            jam_mulai: aj.waktu_masuk_aktual,
                                            jam_selesai: aj.waktu_keluar_aktual || '??:??',
                                            status: aj.status_jurnal,
                                            jurnal: aj
                                        }}
                                        isAdhoc={true}
                                        onAction={() => navigate(`/guru/session/${aj.id}`)}
                                    />
                                ))}
                            </div>
                        )}
                    </div>

                    {/* SIDE PANEL: ANALYTICS & TIPS */}
                    <div className="bento-side">
                        <div className="bento-card">
                            <div className="d-flex align-items-center gap-3 mb-4">
                                <div className="bg-success bg-opacity-10 p-2 rounded-xl text-success" style={{ width: '42px', height: '42px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <UserCheck size={22} />
                                </div>
                                <h6 className="fw-bold mb-0 text-primary">Progress Hari Ini</h6>
                            </div>

                            <div className="mb-4">
                                <div className="d-flex justify-content-between align-items-end mb-2">
                                    <span className="text-muted small fw-bold">Sesi Terselesaikan</span>
                                    <span className="text-primary fw-black">{completedCount} / {totalCount}</span>
                                </div>
                                <div className="progress-premium">
                                    <div
                                        className="progress-bar"
                                        style={{ width: `${progressPct}%`, height: '100%' }}
                                    ></div>
                                </div>
                            </div>

                            <div className="p-3 rounded-2xl bg-light border border-light">
                                <p className="small text-muted mb-0 fw-medium">
                                    <Info size={14} className="me-2 text-primary" />
                                    Waktu kehadiran otomatis terekam saat Anda menekan tombol <strong>Mulai Mengajar</strong>.
                                </p>
                            </div>
                        </div>

                        <div className="bento-card bg-primary text-white border-0 shadow-lg" style={{ background: 'linear-gradient(135deg, var(--primary-600), var(--primary-800))' }}>
                            <div className="d-flex align-items-center gap-3 mb-4">
                                <div className="bg-white bg-opacity-20 p-2 rounded-xl text-white">
                                    <HelpCircle size={24} />
                                </div>
                                <h6 className="fw-bold mb-0">Bantuan Mengajar</h6>
                            </div>
                            <p className="small opacity-90 mb-4 fw-medium">Butuh panduan teknis menggunakan Portal Guru atau mencetak jurnal kelas?</p>
                            <button className="btn-glass-sidebar">
                                Lihat Panduan <ArrowRight size={18} />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Ad-Hoc */}
            {showAdhoc && (
                <div className="modal-backdrop">
                    <div className="modal-container">
                        <div className="modal-header border-bottom p-4">
                            <div className="d-flex align-items-center gap-3">
                                <div className="bg-primary bg-opacity-10 p-2 rounded-xl text-primary">
                                    <BookOpen size={20} />
                                </div>
                                <div>
                                    <h5 className="fw-black mb-0">Sesi Ad-Hoc</h5>
                                    <p className="text-muted small mb-0 fw-bold">Mulai sesi di luar jadwal master</p>
                                </div>
                            </div>
                            <button className="btn-close-circle" style={{
                                width: '36px', height: '36px', borderRadius: '50%', border: 'none',
                                background: 'var(--bg-stripe)', color: '#64748b', fontSize: '20px',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                transition: 'all 0.2s'
                            }} onClick={() => setShowAdhoc(false)}>
                                <X size={20} />
                            </button>
                        </div>
                        <div className="modal-body p-4">
                            <form onSubmit={handleAdhocSubmit}>
                                <div className="mb-3">
                                    <label className="form-label fw-bold small text-muted">KELAS</label>
                                    <select className="form-select modern-input" required value={adhocForm.kelas_id} onChange={e => setAdhocForm({ ...adhocForm, kelas_id: e.target.value })}>
                                        <option value="">-- Pilih Kelas --</option>
                                        {classes.map(k => <option key={k.id} value={k.id}>{k.nama}</option>)}
                                    </select>
                                </div>
                                <div className="mb-3">
                                    <label className="form-label fw-bold small text-muted">MATA PELAJARAN</label>
                                    <select className="form-select modern-input" required value={adhocForm.mapel_id} onChange={e => setAdhocForm({ ...adhocForm, mapel_id: e.target.value })}>
                                        <option value="">-- Pilih Mapel --</option>
                                        {mapels.map(m => <option key={m.id} value={m.id}>{m.nama}</option>)}
                                    </select>
                                </div>
                                <div className="mb-4">
                                    <label className="form-label fw-bold small text-muted">MATERI AJAR (OPSIONAL)</label>
                                    <input type="text" className="form-control modern-input" value={adhocForm.materi} onChange={e => setAdhocForm({ ...adhocForm, materi: e.target.value })} placeholder="Topik yang akan diajarkan..." />
                                </div>
                                <div className="d-grid shadow-sm">
                                    <button type="submit" className="btn btn-primary py-3 rounded-2xl fw-bold d-flex align-items-center justify-content-center gap-2" disabled={submitting}>
                                        {submitting ? (
                                            <>
                                                <span className="spinner-border spinner-border-sm" />
                                                Memproses...
                                            </>
                                        ) : (
                                            <>
                                                <PlayCircle size={18} />
                                                Mulai Sesi Sekarang
                                            </>
                                        )}
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

    return (
        <div className={`schedule-card ${isRunning ? 'running' : ''}`}>
            <div className="d-flex align-items-center justify-content-between">
                <div className="d-flex align-items-center gap-4">
                    <div className="text-center" style={{ minWidth: '90px' }}>
                        <div className="fw-black fs-5 text-primary lh-1 mb-1">{schedule.jam_mulai?.substring(0, 5)}</div>
                        <div className="text-muted small fw-bold tracking-wider lh-1">WAKTU MULAI</div>
                    </div>

                    <div className="d-flex flex-column align-items-center gap-1">
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: isRunning ? 'var(--primary-500)' : 'var(--border-color)', boxShadow: isRunning ? '0 0 0 4px var(--primary-50)' : 'none' }}></div>
                        <div style={{ width: '2px', height: '24px', borderRadius: '2px', background: 'var(--border-color)' }}></div>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: isDone ? 'var(--success-500)' : 'var(--border-color)' }}></div>
                    </div>

                    <div>
                        <div className="d-flex align-items-center gap-2 mb-1">
                            <span className="badge bg-primary bg-opacity-10 text-primary px-2 py-1 rounded-lg fw-bold" style={{ fontSize: '0.7rem' }}>
                                {schedule.kelas_nama}
                            </span>
                            {isAdhoc && (
                                <span className="badge bg-warning bg-opacity-10 text-warning px-2 py-1 rounded-lg fw-bold" style={{ fontSize: '0.7rem' }}>
                                    AD-HOC
                                </span>
                            )}
                            {isDone && (
                                <span className="badge bg-success bg-opacity-10 text-success px-2 py-1 rounded-lg fw-bold" style={{ fontSize: '0.7rem' }}>
                                    SELESAI
                                </span>
                            )}
                        </div>
                        <h5 className="fw-black mb-0 text-primary tracking-tight">{schedule.mapel_nama}</h5>
                        <p className="text-muted small mb-0 fw-bold">Selesai: {schedule.jam_selesai?.substring(0, 5)}</p>
                    </div>
                </div>

                <div>
                    {!isDone ? (
                        <button className="btn-play-session" onClick={onAction}>
                            {isRunning ? (
                                <>
                                    <Activity size={18} />
                                    Lanjutkan Sesi
                                </>
                            ) : (
                                <>
                                    <PlayCircle size={18} />
                                    Mulai Mengajar
                                </>
                            )}
                            <ArrowRight size={16} />
                        </button>
                    ) : (
                        <div className="d-flex flex-column align-items-end">
                            <div className="text-success fw-black d-flex align-items-center gap-2">
                                <CheckCircle size={20} />
                                SESI SELESAI
                            </div>
                            <div className="text-muted small fw-bold">Keluar: {schedule.jurnal?.waktu_keluar_aktual?.substring(0, 5)}</div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
