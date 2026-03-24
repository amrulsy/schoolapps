import { useState, useEffect } from 'react'
import { API_BASE, getAuthHeaders } from '../../services/api'
import LoadingSpinner from '../../components/LoadingSpinner'
import {
    Clock, Info, Save, UserX, UserCheck, CheckCircle2,
    BookOpen, Search, Users, Activity, ChevronRight, CheckCircle,
    History, Layout, PlayCircle, PlusCircle, TrendingUp, ArrowRight, HelpCircle,
    Calendar
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import { useCustomAlert } from '../../hooks/useCustomAlert'

// --- STYLES ---
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
    position: relative;
    overflow: hidden;
  }
  .bento-grid {
    display: grid;
    grid-template-columns: repeat(12, 1fr);
    gap: 24px;
    margin-bottom: 32px;
  }
  .bento-main { grid-column: span 7; }
  .bento-side { grid-column: span 5; display: flex; flex-direction: column; gap: 24px; }
  
  @media (max-width: 1200px) {
    .bento-main, .bento-side { grid-column: span 12; }
  }

  .bento-card {
    background: var(--bg-card);
    border-radius: 28px;
    padding: 32px;
    border: 1px solid var(--border-color);
    box-shadow: var(--shadow-sm);
    height: 100%;
    transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    display: flex;
    flex-direction: column;
    position: relative;
    overflow: hidden;
  }
  .bento-card:hover {
    transform: translateY(-5px);
    box-shadow: var(--shadow-lg);
    border-color: var(--primary-300);
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

  .schedule-card {
    background: var(--bg-card);
    border-radius: 24px;
    padding: 24px;
    border: 1px solid var(--border-color);
    transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    position: relative;
    overflow: hidden;
    margin-bottom: 20px;
  }
  .schedule-card:hover { 
    background: var(--bg-hover); 
    transform: translateX(4px); 
    box-shadow: var(--shadow-sm);
  }
  .schedule-card.running {
    border: 1px solid var(--primary-400);
    background: linear-gradient(to right, var(--bg-card), var(--primary-50));
  }

  .btn-play-session {
    background: var(--primary-600);
    color: #fff;
    border: none;
    padding: 12px 24px;
    border-radius: 14px;
    font-weight: 700;
    font-size: 0.9rem;
    display: flex;
    align-items: center;
    gap: 10px;
    transition: all 0.2s;
    box-shadow: 0 4px 12px rgba(37, 99, 235, 0.2);
  }
  .btn-play-session:hover {
    background: var(--primary-700);
    transform: translateY(-1px);
    box-shadow: 0 6px 16px rgba(37, 99, 235, 0.3);
  }

  .btn-glass-sidebar {
    background: var(--primary-50);
    color: var(--primary-600);
    border: 1px solid var(--primary-100);
    padding: 14px;
    border-radius: 16px;
    width: 100%;
    font-weight: 700;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
  }
  .btn-glass-sidebar:hover {
    background: var(--primary-600);
    color: #fff;
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(37, 99, 235, 0.15);
  }

  .progress-premium {
    height: 10px;
    border-radius: 10px;
    background: var(--bg-stripe);
    overflow: hidden;
    position: relative;
    border: 1px solid var(--border-color);
  }
  .progress-premium .progress-bar {
    background: linear-gradient(90deg, var(--primary-500), var(--primary-600));
    border-radius:20px;
    transition: width 1.5s cubic-bezier(0.16, 1, 0.3, 1);
  }

  /* Portal Modal Styles (Aligned with Admin style) */
  .modal-backdrop {
    position: fixed; inset: 0; background: rgba(15, 23, 42, 0.7);
    backdrop-filter: blur(12px); z-index: 10000;
    display: flex; align-items: center; justify-content: center; padding: 20px;
  }
  .modal-container {
    background: var(--bg-card); width: 100%; max-width: 600px;
    max-height: 90vh; border-radius: 32px;
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
  .header-text p { margin: 2px 0 0; font-size: 0.8125rem; color: var(--text-secondary); font-weight: 600; }

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
  @keyframes fade-scale-in {
    from { opacity: 0; transform: scale(0.95) translateY(10px); }
    to { opacity: 1; transform: scale(1) translateY(0); }
  }
`

export default function GuruDashboard() {
    const { currentUser } = useApp()
    const { confirmAction } = useCustomAlert()
    const [data, setData] = useState({ schedules: [], activeJournals: [], day: '', date: '' })
    const [loading, setLoading] = useState(true)
    const navigate = useNavigate()

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

    useEffect(() => {
        fetchData()
    }, [])

    const handleStartSession = async (jadwal_id, jadwal_id_end, currentStatus, jurnal_id) => {
        if (currentStatus === 'Running') {
            navigate(`/guru/session/${jurnal_id}`)
            return
        }
        if (currentStatus === 'Selesai') return

        const confirmed = await confirmAction({
            title: 'Mulai Sesi Belajar?',
            text: 'Waktu masuk Anda akan secara otomatis tercatat pada jam sekarang.',
            confirmText: 'Ya, Mulai Sekarang',
            cancelText: 'Batal',
            icon: 'info'
        })
        if (!confirmed) return

        try {
            const res = await fetch(`${API_BASE}/guru/session/start`, {
                method: 'POST',
                headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
                body: JSON.stringify({ jadwal_id, jadwal_id_end })
            })
            const result = await res.json()
            if (!res.ok) throw new Error(result.error)

            navigate(`/guru/session/${result.id}`)
        } catch (err) {
            alert(err.message)
        }
    }

    const completedCount = data.schedules.filter(s => s.status === 'Selesai').length
    const totalCount = data.schedules.length
    const progressPct = totalCount > 0 ? (completedCount / totalCount) * 100 : 0

    return (
        <div className="animate-fadeIn pb-5">
            <style dangerouslySetInnerHTML={{ __html: styles }} />

            {/* PREMIUM GURU HEADER */}
            <div className="guru-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                    <div style={{
                        padding: 14,
                        background: 'linear-gradient(135deg, var(--primary-600), var(--primary-800))',
                        color: '#fbbf24',
                        borderRadius: 18,
                        boxShadow: '0 8px 16px rgba(37, 99, 235, 0.2)'
                    }}>
                        <Calendar size={32} strokeWidth={2.5} />
                    </div>
                    <div>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, letterSpacing: '-0.025em' }}>Selamat Datang, {currentUser?.nama?.split(' ')[0]}!</h2>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: 4 }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                <div style={{ width: 8, height: 8, background: '#10b981', borderRadius: '50%' }}></div> {data.day}, {data.date}
                            </span>
                            <span>•</span>
                            <span className="text-primary fw-bold">
                                {totalCount} Sesi Terjadwal
                            </span>
                        </div>
                    </div>
                </div>
                <button
                    className="btn btn-outline-primary shadow-sm"
                    style={{ borderRadius: 12, padding: '12px 24px', fontWeight: 700, border: '1.5px solid var(--primary-200)', background: 'var(--bg-card)' }}
                    onClick={() => navigate('/guru/history')}
                >
                    <History size={20} className="me-2" />
                    Riwayat Jurnal & Absensi
                </button>
            </div>

            {loading ? <LoadingSpinner fullScreen={false} /> : (
                <div className="bento-grid">
                    {/* MAIN CONTENT: SCHEDULES */}
                    <div className="bento-main">
                        <div className="d-flex align-items-center justify-content-between mb-4 px-1">
                            <h5 className="fw-black mb-0 d-flex align-items-center gap-2 text-primary" style={{ fontSize: '1.1rem', letterSpacing: '-0.5px' }}>
                                <Layout size={20} className="text-primary" />
                                Jadwal Mengajar Hari Ini
                            </h5>
                            <span className="badge border-0 px-3 py-2" style={{ borderRadius: 20, fontSize: '0.75rem', background: 'var(--primary-100)', color: 'var(--primary-700)', fontWeight: 800 }}>
                                {totalCount - completedCount} Sesi Tersisa
                            </span>
                        </div>

                        {data.schedules.length === 0 ? (
                            <div className="bento-card text-center d-flex flex-column align-items-center justify-content-center py-5">
                                <div className="icon-box-soft bg-soft-blue mb-4" style={{ width: 80, height: 80 }}>
                                    <BookOpen size={40} />
                                </div>
                                <h4 className="fw-black text-primary mb-2">Tidak Ada Jadwal</h4>
                                <p className="text-muted max-w-sm mx-auto fw-medium">Anda tidak memiliki jadwal mengajar hari ini. Gunakan waktu ini untuk persiapan materi atau istirahat! 🎉</p>
                            </div>
                        ) : (
                            data.schedules.map((j) => (
                                <ScheduleCard
                                    key={j.id}
                                    schedule={j}
                                    onAction={() => {
                                        const endId = (j.jadwal_ids && Array.isArray(j.jadwal_ids))
                                            ? j.jadwal_ids[j.jadwal_ids.length - 1]
                                            : j.id;
                                        handleStartSession(j.id, endId, j.status, j.jurnal?.id)
                                    }}
                                />
                            ))
                        )}
                    </div>

                    {/* SIDE PANEL: ANALYTICS & TIPS */}
                    <div className="bento-side">
                        <div className="bento-card">
                            <div className="d-flex align-items-center gap-3 mb-4">
                                <div className="icon-box-soft bg-soft-green mb-0" style={{ width: 42, height: 42 }}>
                                    <UserCheck size={20} />
                                </div>
                                <h6 className="fw-bold mb-0 text-primary">Progress Hari Ini</h6>
                            </div>

                            <div className="mb-4">
                                <div className="d-flex justify-content-between align-items-end mb-2">
                                    <span className="text-muted small fw-bold text-uppercase" style={{ fontSize: '0.7rem' }}>Sesi Terselesaikan</span>
                                    <span className="text-primary fw-black" style={{ fontSize: '1.25rem' }}>{completedCount} <span className="text-muted fw-normal" style={{ fontSize: '0.9rem' }}>/ {totalCount}</span></span>
                                </div>
                                <div className="progress-premium">
                                    <div
                                        className="progress-bar"
                                        style={{ width: `${progressPct}%`, height: '100%' }}
                                    ></div>
                                </div>
                            </div>

                            <div className="p-3 rounded-2xl" style={{ background: 'var(--bg-stripe)', border: '1px solid var(--border-color)' }}>
                                <p className="small text-muted mb-0 fw-medium">
                                    <Info size={14} className="me-2 text-primary" />
                                    Waktu kehadiran otomatis terekam saat Anda menekan tombol <strong>Mulai Mengajar</strong>.
                                </p>
                            </div>
                        </div>

                        <div className="bento-card" style={{ background: 'linear-gradient(135deg, var(--primary-600), var(--primary-800))', color: '#fff', border: 'none' }}>
                            <div className="d-flex align-items-center gap-3 mb-4">
                                <div style={{
                                    width: 42, height: 42, borderRadius: 12,
                                    background: 'rgba(255,255,255,0.1)', color: '#fbbf24',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                                }}>
                                    <HelpCircle size={20} />
                                </div>
                                <h6 className="fw-bold mb-0" style={{ color: '#fff' }}>Bantuan Mengajar</h6>
                            </div>
                            <p className="small opacity-80 mb-4 fw-medium">Butuh panduan teknis menggunakan Portal Guru atau mencetak jurnal kelas?</p>
                            <button className="btn-glass-sidebar" style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)' }}>
                                Lihat Panduan <ArrowRight size={18} className="ms-auto" />
                            </button>
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
                            <span className="badge border-0 px-2 py-1" style={{ borderRadius: 8, fontSize: '0.7rem', background: 'var(--primary-100)', color: 'var(--primary-700)', fontWeight: 800 }}>
                                {schedule.kelas_nama}
                            </span>
                            <span className="badge border-0 px-2 py-1" style={{ borderRadius: 8, fontSize: '0.7rem', background: 'var(--primary-100)', color: 'var(--primary-700)', fontWeight: 800 }}>
                                Jam ke-{schedule.jam_ke}{schedule.jam_ke_end && schedule.jam_ke_end !== schedule.jam_ke ? ` s.d ${schedule.jam_ke_end}` : ''}
                            </span>
                            {isAdhoc && (
                                <span className="badge border-0 px-2 py-1" style={{ borderRadius: 8, fontSize: '0.7rem', background: 'var(--warning-100)', color: 'var(--warning-700)', fontWeight: 800 }}>
                                    AD-HOC
                                </span>
                            )}
                            {isDone && (
                                <span className="badge border-0 px-2 py-1" style={{ borderRadius: 8, fontSize: '0.7rem', background: 'var(--success-100)', color: 'var(--success-700)', fontWeight: 800 }}>
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
