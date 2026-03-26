import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useApp } from '../../context/AppContext'
import { useCustomAlert } from '../../hooks/useCustomAlert'
import { API_BASE } from '../../services/api'
import {
    Calendar, Users, Save, CheckCircle, AlertCircle,
    Clock, PieChart as PieChartIcon, Activity, UserCheck,
    UserMinus, Search, Filter, MessageCircle
} from 'lucide-react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { getAuthHeaders } from '../../services/api'
import RfidEnrollment from './RfidEnrollment'
import AttendanceSettings from './AttendanceSettings'

// --- STYLES ---
const styles = /*css*/`
  .attendance-header {
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
  .bg-soft-orange { background: var(--warning-50); color: var(--warning-500); }
  .bg-soft-red { background: var(--danger-50); color: var(--danger-500); }

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

  .pill-soft {
    padding: 6px 12px; border-radius: 50px; font-weight: 700; font-size: 0.75rem; 
    text-transform: uppercase; letter-spacing: 0.5px; display: inline-flex; align-items: center; gap: 6px;
  }
  
  .attendance-btn-group {
    display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; width: 100%;
  }

  .attendance-btn {
    border: none; padding: 10px 4px; border-radius: 10px; font-weight: 700; font-size: 0.7rem;
    transition: all 0.2s; display: flex; flex-direction: column; align-items: center; gap: 4px;
    background: var(--bg-stripe); color: var(--text-secondary);
  }
  
  .attendance-btn:hover { background: var(--bg-hover); transform: scale(1.02); }
  .attendance-btn.active.hadir { background: var(--success-600); color: white; }
  .attendance-btn.active.sakit { background: var(--warning-600); color: white; }
  .attendance-btn.active.izin { background: #3b82f6; color: white; }
  .attendance-btn.active.alpha { background: var(--danger-600); color: white; }

  .modern-input {
    background: var(--bg-input); border: 1.5px solid var(--border-color);
    border-radius: 12px; padding: 0.75rem 1rem; color: var(--text-primary);
    font-weight: 600; transition: all 0.2s; width: 100%;
  }
  .modern-input:focus { border-color: var(--primary-500); box-shadow: 0 0 0 4px var(--primary-50); outline: none; background: var(--bg-card); }

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

  @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
  .animate-fadeIn { animation: fadeIn 0.4s ease-out forwards; }

  @media (max-width: 767px) {
    .attendance-header {
      flex-direction: column;
      align-items: flex-start;
      padding: 16px 20px;
      gap: 16px;
      border-radius: 20px;
      margin-bottom: 20px;
    }
    .attendance-header .d-flex.gap-2 {
      width: 100%;
      flex-wrap: wrap;
    }
    .attendance-header .d-flex.gap-2 button {
      flex: 1;
      min-width: 0;
      justify-content: center;
    }
    .bento-grid {
      gap: 16px;
      margin-bottom: 20px;
    }
    .bento-card {
      padding: 20px;
      border-radius: 20px;
    }
    .bento-card h1 {
      font-size: 2.5rem !important;
    }
    .d-flex.gap-3.mt-4 {
      flex-direction: column;
      gap: 10px !important;
    }
    .attendance-btn-group {
      grid-template-columns: repeat(4, 1fr);
      gap: 4px;
    }
    .attendance-btn {
      padding: 8px 2px;
      font-size: 0.65rem;
    }
    .card-body.p-4 {
      padding: 16px !important;
    }
    .card.shadow-sm {
      border-radius: 20px !important;
    }
  }
`;

export default function AttendancePage() {
    const { units } = useApp()
    const { showSuccess, showError } = useCustomAlert()

    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
    const [selectedKelasId, setSelectedKelasId] = useState('')
    const [students, setStudents] = useState([])
    const [loading, setLoading] = useState(false)
    const [saving, setSaving] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [sendWA, setSendWA] = useState(false)
    const [activeTab, setActiveTab] = useState('harian') // 'harian' | 'rfid' | 'pengaturan'
    const isMounted = useRef(true)

    useEffect(() => {
        isMounted.current = true
        return () => { isMounted.current = false }
    }, [])

    const allDetailKelas = useMemo(() =>
        (units || []).flatMap(u => (u.kelas || []).map(k => ({ ...k, unitNama: u.nama }))),
        [units])

    const fetchAttendance = useCallback(async (signal) => {
        if (!selectedDate || !selectedKelasId) {
            setStudents([])
            return
        }
        setLoading(true)
        try {
            const res = await fetch(`${API_BASE}/admin/presensi?date=${selectedDate}&kelasId=${selectedKelasId}`, {
                headers: getAuthHeaders(),
                signal
            })
            if (!res.ok) throw new Error('Gagal mengambil data presensi')
            const data = await res.json()
            if (isMounted.current && (!signal || !signal.aborted)) {
                setStudents(data)
            }
        } catch (err) {
            if (isMounted.current && err.name !== 'AbortError' && !signal?.aborted) {
                showError('Kesalahan', err.message)
            }
        } finally {
            if (isMounted.current && (!signal || !signal.aborted)) setLoading(false)
        }
    }, [selectedDate, selectedKelasId, showError])

    useEffect(() => {
        const controller = new AbortController()
        fetchAttendance(controller.signal)
        return () => controller.abort()
    }, [fetchAttendance])

    const handleStatusChange = (siswaId, newStatus) => {
        setStudents(prev => prev.map(s => s.id === siswaId ? { ...s, status: newStatus } : s))
    }

    const handleKeteranganChange = (siswaId, note) => {
        setStudents(prev => prev.map(s => s.id === siswaId ? { ...s, keterangan: note } : s))
    }

    const markAllHadir = () => {
        setStudents(prev => prev.map(s => ({ ...s, status: 'hadir' })))
    }

    const handleSave = async () => {
        if (!selectedDate || !selectedKelasId) return
        setSaving(true)
        try {
            const res = await fetch(`${API_BASE}/admin/presensi/bulk`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({
                    date: selectedDate,
                    attendanceData: students.map(s => ({
                        siswa_id: s.id,
                        status: s.status,
                        keterangan: s.keterangan
                    })),
                    sendWA
                })
            })
            if (!res.ok) throw new Error('Gagal menyimpan data presensi')
            if (isMounted.current) {
                showSuccess('Berhasil', sendWA ? 'Data presensi disimpan & notifikasi WA dikirim.' : 'Data presensi berhasil disimpan.')
                setSendWA(false)
            }
        } catch (err) {
            if (isMounted.current) showError('Gagal Menyimpan', err.message)
        } finally {
            if (isMounted.current) setSaving(false)
        }
    }

    // Stats calculations
    const stats = useMemo(() => {
        const total = students.length
        const hadir = students.filter(s => s.status === 'hadir').length
        const sakit = students.filter(s => s.status === 'sakit').length
        const izin = students.filter(s => s.status === 'izin').length
        const alpha = students.filter(s => s.status === 'alpha').length
        return { total, hadir, absensi: sakit + izin + alpha, alpha, hadirPct: total ? (hadir / total) * 100 : 0 }
    }, [students])

    const chartData = useMemo(() => [
        { name: 'Hadir', value: students.filter(s => s.status === 'hadir').length, color: '#10b981' },
        { name: 'Sakit', value: students.filter(s => s.status === 'sakit').length, color: '#f59e0b' },
        { name: 'Izin', value: students.filter(s => s.status === 'izin').length, color: '#3b82f6' },
        { name: 'Alpha', value: students.filter(s => s.status === 'alpha').length, color: '#ef4444' }
    ].filter(d => d.value > 0), [students])

    const filteredStudents = students.filter(s =>
        s.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.nisn.includes(searchQuery)
    )

    return (
        <div className="admin-page animate-fadeIn pb-5">
            <style dangerouslySetInnerHTML={{ __html: styles }} />

            {/* STANDARDIZED HEADER */}
            <div className="attendance-header">
                <div>
                    <div className="d-flex align-items-center gap-3 mb-1">
                        <div style={{
                            width: 52, height: 52,
                            background: 'linear-gradient(135deg, #2563eb, #1e40af)',
                            borderRadius: '16px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            boxShadow: '0 8px 16px rgba(37, 99, 235, 0.2)'
                        }}>
                            <Calendar size={28} />
                        </div>
                        <div>
                            <h2 className="fw-black mb-0" style={{ letterSpacing: '-1px', color: 'var(--text-primary)' }}>Presensi Siswa</h2>
                            <p className="text-muted small fw-bold mb-0 text-uppercase letter-spacing-1">Kehadiran Harian & Rekapitulasi</p>
                        </div>
                    </div>
                </div>
                <div className="d-flex gap-2 flex-wrap">
                    {/* WA Toggle */}
                    {activeTab === 'harian' && students.length > 0 && (
                        <div
                            style={{
                                display: 'flex', alignItems: 'center', gap: 10,
                                padding: '8px 16px', borderRadius: '14px', cursor: 'pointer',
                                background: sendWA ? 'rgba(37, 211, 102, 0.1)' : 'transparent',
                                border: `1.5px solid ${sendWA ? 'rgba(37, 211, 102, 0.3)' : 'var(--border-color)'}`,
                                transition: 'all 0.2s'
                            }}
                            onClick={() => setSendWA(!sendWA)}
                        >
                            <MessageCircle size={18} style={{ color: sendWA ? '#25D366' : 'var(--text-muted)' }} />
                            <span style={{ fontWeight: 700, fontSize: '0.8rem', color: sendWA ? '#25D366' : 'var(--text-secondary)' }}>
                                Kirim WA
                            </span>
                            <div style={{
                                width: 36, height: 20, borderRadius: 10,
                                background: sendWA ? '#25D366' : 'var(--border-color)',
                                position: 'relative', transition: 'background 0.2s'
                            }}>
                                <div style={{
                                    width: 16, height: 16, borderRadius: '50%',
                                    background: '#fff', position: 'absolute', top: 2,
                                    left: sendWA ? 18 : 2,
                                    transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.15)'
                                }} />
                            </div>
                        </div>
                    )}
                    {activeTab === 'harian' && (
                        <button
                            className="btn btn-primary shadow-sm"
                            style={{ borderRadius: '14px', padding: '12px 24px', fontWeight: 700 }}
                            onClick={handleSave}
                            disabled={saving || students.length === 0}
                        >
                            {saving ? (
                                <><span className="spinner-border spinner-border-sm me-2" />Menyimpan...</>
                            ) : (
                                <><Save size={18} className="me-2" /> Simpan Presensi</>
                            )}
                        </button>
                    )}
                </div>
            </div>

            {/* TABS NAVIGATION */}
            <div className="d-flex gap-2 mb-4 p-1 bg-white rounded-4 border shadow-sm w-fit-content">
                <button 
                    className={`btn px-4 py-2 rounded-3 fw-bold transition-all ${activeTab === 'harian' ? 'btn-primary' : 'btn-link text-decoration-none text-muted'}`}
                    onClick={() => setActiveTab('harian')}
                >
                    Presensi Harian
                </button>
                <button 
                    className={`btn px-4 py-2 rounded-3 fw-bold transition-all ${activeTab === 'rfid' ? 'btn-primary' : 'btn-link text-decoration-none text-muted'}`}
                    onClick={() => setActiveTab('rfid')}
                >
                    Registrasi RFID
                </button>
                <button 
                    className={`btn px-4 py-2 rounded-3 fw-bold transition-all ${activeTab === 'pengaturan' ? 'btn-primary' : 'btn-link text-decoration-none text-muted'}`}
                    onClick={() => setActiveTab('pengaturan')}
                >
                    Pengaturan
                </button>
            </div>

            {activeTab === 'rfid' ? (
                <RfidEnrollment hideHeader={true} />
            ) : activeTab === 'pengaturan' ? (
                <AttendanceSettings />
            ) : (
                <>
                {/* BENTO GRID (7/5 Split) for Stats & Controls */}
                <div className="bento-grid">
                    <div className="bento-main">
                        <div className="bento-card">
                            <div className="d-flex justify-content-between align-items-start mb-4">
                                <div>
                                    <div className="icon-box-soft bg-soft-blue">
                                        <Users size={24} />
                                    </div>
                                    <div className="text-muted small fw-bold text-uppercase letter-spacing-1 mb-1">Total Siswa Terdaftar</div>
                                    <h1 className="fw-black mb-0" style={{ fontSize: '3.5rem', letterSpacing: '-2px', color: 'var(--text-primary)' }}>{stats.total}</h1>
                                </div>
                                <div className="d-none d-md-block opacity-10">
                                    <Activity size={48} className="text-primary" />
                                </div>
                            </div>
                            <div className="d-flex gap-3 mt-4">
                                <div className="stat-pill">
                                    <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#10b981' }}></div>
                                    <div className="flex-grow-1">
                                        <div className="text-muted small fw-bold text-uppercase" style={{ fontSize: '0.65rem' }}>Hadir</div>
                                        <div className="fw-bold" style={{ color: 'var(--text-primary)' }}>{stats.hadir}</div>
                                    </div>
                                </div>
                                <div className="stat-pill">
                                    <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#f59e0b' }}></div>
                                    <div className="flex-grow-1">
                                        <div className="text-muted small fw-bold text-uppercase" style={{ fontSize: '0.65rem' }}>Izin/Sakit</div>
                                        <div className="fw-bold" style={{ color: 'var(--text-primary)' }}>{stats.absensi - stats.alpha}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="bento-side">
                        <div className="bento-card">
                            <div className="mb-4">
                                <h5 className="fw-black mb-1 d-flex align-items-center gap-2">
                                    <Filter size={18} className="text-primary" /> Filter
                                </h5>
                                <p className="text-muted small fw-bold text-uppercase mb-0" style={{ fontSize: '0.65rem' }}>Pilih Parameter</p>
                            </div>
                            <div className="d-grid gap-3">
                                <div className="position-relative">
                                    <Calendar size={18} className="position-absolute text-muted" style={{ left: '12px', top: '14px' }} />
                                    <input
                                        type="date" className="modern-input" style={{ paddingLeft: '2.5rem' }}
                                        value={selectedDate} onChange={e => setSelectedDate(e.target.value)}
                                    />
                                </div>
                                <div className="position-relative">
                                    <Users size={18} className="position-absolute text-muted" style={{ left: '12px', top: '14px' }} />
                                    <select
                                        className="modern-input" style={{ paddingLeft: '2.5rem' }}
                                        value={selectedKelasId} onChange={e => setSelectedKelasId(e.target.value)}
                                    >
                                        <option value="">-- Pilih Kelas --</option>
                                        {allDetailKelas.map(k => (
                                            <option key={k.id} value={k.id}>{k.unitNama} - {k.nama}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="row g-4 mt-1">
                    {/* List Siswa */}
                    <div className="col-lg-8">
                        <div className="card shadow-sm border-0" style={{ borderRadius: 32, overflow: 'hidden' }}>
                            <div className="card-header bg-white border-0 p-4 pb-0">
                                <div className="d-flex justify-content-between align-items-center mb-3">
                                    <h5 className="fw-black mb-0">Daftar Siswa</h5>
                                    {students.length > 0 && (
                                        <button className="btn btn-light btn-sm fw-bold border rounded-pill px-3" onClick={markAllHadir}>
                                            <CheckCircle size={14} className="me-1 text-success" /> Hadirkan Semua
                                        </button>
                                    )}
                                </div>
                                <div style={{ position: 'relative' }}>
                                    <Search size={18} style={{ position: 'absolute', left: '16px', top: '14px', color: 'var(--text-muted)' }} />
                                    <input
                                        type="text" placeholder="Cari nama..." className="form-control border-0 shadow-none ps-5"
                                        style={{ height: '48px', borderRadius: '14px', background: 'var(--bg-stripe)' }}
                                        value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="card-body p-0">
                                <div className="table-responsive">
                                    <table className="table table-hover align-middle mb-0">
                                        <thead className="bg-light">
                                            <tr>
                                                <th className="ps-4 py-3 border-0 small fw-bold text-secondary">NAMA SISWA</th>
                                                <th className="text-center py-3 border-0 small fw-bold text-secondary">STATUS</th>
                                                <th className="pe-4 py-3 border-0 small fw-bold text-secondary">KETERANGAN</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {loading ? (
                                                <tr><td colSpan="3" className="text-center py-5">
                                                    <div className="spinner-border text-primary me-2" role="status" />
                                                    <span className="fw-bold">Memuat...</span>
                                                </td></tr>
                                            ) : filteredStudents.length === 0 ? (
                                                <tr><td colSpan="3" className="text-center py-5 text-muted fw-bold">Tidak ada data.</td></tr>
                                            ) : (
                                                filteredStudents.map((s, idx) => (
                                                    <tr key={s.id} className="animate-fadeIn" style={{ animationDelay: `${idx * 0.05}s` }}>
                                                        <td className="ps-4">
                                                            <div className="d-flex align-items-center gap-3">
                                                                <div className="student-avatar">{s.nama.charAt(0)}</div>
                                                                <div>
                                                                    <div className="fw-bold">{s.nama}</div>
                                                                    <div className="small text-muted opacity-50">NISN: {s.nisn}</div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="text-center">
                                                            <div className="attendance-btn-group mx-auto" style={{ maxWidth: '240px' }}>
                                                                {['hadir', 'sakit', 'izin', 'alpha'].map(type => (
                                                                    <AttendanceBtn key={type} active={s.status === type} type={type} onClick={() => handleStatusChange(s.id, type)} />
                                                                ))}
                                                            </div>
                                                        </td>
                                                        <td className="pe-4">
                                                            <input
                                                                type="text" className="modern-input py-2 text-center" style={{ fontSize: '0.8rem' }} placeholder="..."
                                                                value={s.keterangan || ''} onChange={e => handleKeteranganChange(s.id, e.target.value)}
                                                            />
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Visualisasi Side */}
                    <div className="col-lg-4">
                        <div className="bento-card">
                            <h5 className="fw-black mb-3 d-flex align-items-center gap-2">
                                <PieChartIcon size={20} className="text-primary" /> Statistik
                            </h5>
                            {students.length > 0 ? (
                                <>
                                    <div style={{ width: '100%', height: 260 }}>
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={chartData} cx="50%" cy="50%"
                                                    innerRadius={65} outerRadius={85} paddingAngle={8}
                                                    dataKey="value" stroke="none"
                                                >
                                                    {chartData.map((e, i) => <Cell key={i} fill={e.color} />)}
                                                </Pie>
                                                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                                                <Legend verticalAlign="bottom" height={36} formatter={(val) => <span className="small fw-bold">{val}</span>} />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                    <div className="mt-4 p-4 rounded-4" style={{ background: 'var(--bg-stripe)' }}>
                                        <div className="d-flex justify-content-between mb-2">
                                            <span className="text-secondary small fw-bold">PARTISIPASI</span>
                                            <span className="text-primary fw-black">{stats.hadirPct.toFixed(1)}%</span>
                                        </div>
                                        <div className="progress" style={{ height: '8px', borderRadius: '10px', background: 'var(--border-color)' }}>
                                            <div className="progress-bar bg-primary" style={{ width: `${stats.hadirPct}%` }} />
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="text-center py-5 text-muted opacity-30 fw-bold">Statistik belum tersedia.</div>
                            )}
                        </div>
                    </div>
                </div>
                </>
            )}
        </div>
    )
}



function AttendanceBtn({ active, type, onClick }) {
    const labels = { hadir: 'HDIR', sakit: 'SKIT', izin: 'IZIN', alpha: 'ALPH' }
    const icons = {
        hadir: <UserCheck size={14} />,
        sakit: <Clock size={14} />,
        izin: <AlertCircle size={14} />,
        alpha: <UserMinus size={14} />
    }

    return (
        <button className={`attendance-btn ${active ? `active ${type}` : ''}`} onClick={onClick}>
            {icons[type]}
            <span style={{ fontSize: '0.65rem' }}>{labels[type]}</span>
        </button>
    )
}
