import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useApp } from '../../context/AppContext'
import { useCustomAlert } from '../../hooks/useCustomAlert'
import { API_BASE } from '../../services/api'
import {
    Calendar, Users, Save, CheckCircle, AlertCircle,
    Clock, PieChart as PieChartIcon, Activity, UserCheck,
    UserMinus, Search, Filter, MessageCircle, ChevronRight,
    LayoutDashboard, UserCircle, Settings as SettingsIcon, ClipboardList
} from 'lucide-react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { getAuthHeaders } from '../../services/api'
import RfidEnrollment from './RfidEnrollment'
import AttendanceSettings from './AttendanceSettings'
import AttendanceRecap from './AttendanceRecap'
import Swal from 'sweetalert2'

// --- SUPER PREMIUM STYLES ---
const styles = /*css*/`
  :root {
    --glass-bg: rgba(255, 255, 255, 0.7);
    --glass-border: rgba(255, 255, 255, 0.4);
    --glass-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.07);
    --accent-blue: #3b82f6;
    --accent-indigo: #6366f1;
    --accent-emerald: #10b981;
    --accent-amber: #f59e0b;
    --accent-rose: #f43f5e;
  }

  .premium-container {
    padding: 0 0 40px 0;
    font-family: 'Inter', sans-serif;
  }

  /* Glassmorphism Base Card */
  .glass-card {
    background: var(--glass-bg);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border: 1px solid var(--glass-border);
    border-radius: 24px;
    box-shadow: var(--glass-shadow);
    transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  }

  .glass-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 40px 0 rgba(31, 38, 135, 0.12);
    border-color: rgba(255, 255, 255, 0.6);
  }

  /* Floating Navigation */
  .floating-nav {
    position: sticky;
    top: -5px;
    z-index: 1000;
    background: rgba(255, 255, 255, 0.82);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.6);
    border-radius: 20px;
    padding: 5px;
    margin: -15px auto 40px auto;
    width: fit-content;
    display: flex;
    gap: 4px;
    box-shadow: 0 10px 40px -10px rgba(0,0,0,0.12);
  }

  .nav-item {
    padding: 10px 20px;
    border-radius: 14px;
    font-weight: 700;
    font-size: 0.85rem;
    color: var(--text-secondary);
    border: none;
    background: transparent;
    transition: all 0.3s;
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
  }

  .nav-item.active {
    background: white;
    color: var(--primary-600);
    box-shadow: 0 4px 12px rgba(0,0,0,0.05);
  }

  /* Hero Section */
  .premium-hero {
    background: linear-gradient(135deg, #f8fafc 0%, #eff6ff 100%);
    border-radius: 32px;
    padding: 40px;
    margin-top: 40px;
    margin-bottom: 30px;
    position: relative;
    overflow: hidden;
    border: 1px solid white;
    box-shadow: inset 0 0 80px rgba(255,255,255,0.5);
  }

  .hero-glow {
    position: absolute;
    width: 300px;
    height: 300px;
    background: radial-gradient(circle, rgba(59, 130, 246, 0.1) 0%, transparent 70%);
    top: -150px;
    right: -100px;
    z-index: 0;
  }

  /* Bento Grid Layout */
  .grid-layout {
    display: grid;
    grid-template-columns: repeat(12, 1fr);
    gap: 24px;
  }

  .main-column { grid-column: span 8; }
  .side-column { grid-column: span 4; display: flex; flex-direction: column; gap: 20px; }

  .h-fit-content { height: fit-content; }

  @media (max-width: 1200px) {
    .main-column, .side-column { grid-column: span 12; }
  }

  /* Custom Status Badges */
  .status-badge {
    padding: 6px 14px;
    border-radius: 12px;
    font-weight: 800;
    font-size: 0.7rem;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    border: 1px solid transparent;
  }

  .badge-hadir { background: #ecfdf5; color: #059669; border-color: #d1fae5; }
  .badge-sakit { background: #fffbeb; color: #d97706; border-color: #fef3c7; }
  .badge-izin { background: #eff6ff; color: #2563eb; border-color: #dbeafe; }
  .badge-alpha { background: #fff1f2; color: #e11d48; border-color: #ffe4e6; }

  /* Compact Action Buttons */
  .action-btn-group {
    display: flex;
    gap: 6px;
  }

  .compact-btn {
    width: 34px;
    height: 34px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid var(--border-color);
    background: white;
    color: var(--text-muted);
    transition: all 0.2s;
    cursor: pointer;
  }

  .compact-btn:hover {
    background: #f8fafc;
    color: var(--primary-600);
    border-color: var(--primary-200);
  }

  .compact-btn.active.hadir { background: var(--accent-emerald); color: white; border-color: var(--accent-emerald); box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3); }
  .compact-btn.active.sakit { background: var(--accent-amber); color: white; border-color: var(--accent-amber); box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3); }
  .compact-btn.active.izin { background: var(--accent-blue); color: white; border-color: var(--accent-blue); box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3); }
  .compact-btn.active.alpha { background: var(--accent-rose); color: white; border-color: var(--accent-rose); box-shadow: 0 4px 12px rgba(244, 63, 94, 0.3); }

  /* Premium Table */
  .premium-table {
    width: 100%;
    border-collapse: separate;
    border-spacing: 0 10px;
  }

  .premium-table tr {
    transition: all 0.2s;
  }

  .premium-table td {
    padding: 16px;
    background: white;
    border-top: 1px solid var(--border-color);
    border-bottom: 1px solid var(--border-color);
  }

  .premium-table td:first-child {
    border-left: 1px solid var(--border-color);
    border-top-left-radius: 16px;
    border-bottom-left-radius: 16px;
    padding-left: 24px;
  }

  .premium-table td:last-child {
    border-right: 1px solid var(--border-color);
    border-top-right-radius: 16px;
    border-bottom-right-radius: 16px;
    padding-right: 24px;
  }

  .premium-table tr:hover td {
    background: #fcfdfe;
    transform: scale(1.005);
  }

  .avatar-ring {
    width: 42px;
    height: 42px;
    border-radius: 14px;
    background: linear-gradient(135deg, white 0%, #f1f5f9 100%);
    border: 1px solid var(--border-color);
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 800;
    color: var(--primary-600);
    box-shadow: 0 2px 4px rgba(0,0,0,0.02);
  }

  /* Micro-animations */
  @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
  .animate-slide { animation: slideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; }

  /* Custom Input Glass */
  .glass-input {
    background: rgba(255,255,255,0.6);
    border: 1.5px solid rgba(255,255,255,0.8);
    backdrop-filter: blur(4px);
    border-radius: 14px;
    padding: 10px 16px;
    transition: all 0.2s;
    font-weight: 600;
  }

  .glass-input:focus {
    background: white;
    border-color: var(--primary-300);
    box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.08);
    outline: none;
  }

  .grid-2 {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }
`;

export default function AttendancePage() {
    const { units } = useApp()
    const { showSuccess, showError } = useCustomAlert()

    const [selectedDate, setSelectedDate] = useState(new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' }))
    const [selectedKelasId, setSelectedKelasId] = useState('')
    const [students, setStudents] = useState([])
    const [loading, setLoading] = useState(false)
    const [saving, setSaving] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [sendWA, setSendWA] = useState(false)
    const [activeTab, setActiveTab] = useState('harian')
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
        const kelasNama = allDetailKelas.find(k => k.id.toString() === selectedKelasId)?.nama || 'Kelas'
        
        const result = await Swal.fire({
            title: 'Simpan Presensi?',
            html: `Simpan data presensi untuk kelas <b>${kelasNama}</b> tanggal <b>${selectedDate}</b>?`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Ya, Simpan',
            cancelButtonText: 'Batal',
            confirmButtonColor: '#3b82f6',
            borderRadius: '24px'
        })
        if (!result.isConfirmed) return

        setSaving(true)
        try {
            const res = await fetch(`${API_BASE}/admin/presensi/bulk`, {
                method: 'POST',
                // Bug #9 Fixed: include Content-Type so Express body-parser can parse JSON
                headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    date: selectedDate,
                    attendanceData: students.map(s => ({
                        siswa_id: s.id,
                        status: s.status,
                        keterangan: s.keterangan || ''
                    })),
                    sendWA
                })
            })
            if (!res.ok) throw new Error('Gagal menyimpan data presensi')
            showSuccess('Berhasil', 'Data presensi berhasil diperbarui')
            // Bug #3 Fixed: use a fresh AbortController to prevent memory leak on unmount
            const refreshController = new AbortController()
            fetchAttendance(refreshController.signal)
        } catch (err) {
            showError('Gagal', err.message)
        } finally {
            setSaving(false)
        }
    }

    const stats = useMemo(() => {
        const total = students.length
        // Bug #4 Fix: case-insensitive check so both 'Terlambat' (RFID) and 'terlambat' (manual) count as hadir
        const hadir = students.filter(s => s.status === 'hadir' || s.status?.toLowerCase() === 'terlambat').length
        const sakit = students.filter(s => s.status === 'sakit').length
        const izin = students.filter(s => s.status === 'izin').length
        const alpha = students.filter(s => s.status === 'alpha').length
        return { total, hadir, sakit, izin, alpha, hadirPct: total ? (hadir / total) * 100 : 0 }
    }, [students])

    const chartData = useMemo(() => [
        { name: 'Hadir', value: stats.hadir, color: '#10b981' },
        { name: 'Sakit', value: stats.sakit, color: '#f59e0b' },
        { name: 'Izin', value: stats.izin, color: '#3b82f6' },
        { name: 'Alpha', value: stats.alpha, color: '#f43f5e' }
    ].filter(d => d.value > 0), [stats])

    const filteredStudents = useMemo(() => 
        students.filter(s => s.nama.toLowerCase().includes(searchQuery.toLowerCase()) || s.nisn.includes(searchQuery)),
        [students, searchQuery]
    )

    return (
        <div className="premium-container animate-slide">
            <style dangerouslySetInnerHTML={{ __html: styles }} />

            {/* FLOATING NAV */}
            <div className="floating-nav shadow-lg">
                <button className={`nav-item ${activeTab === 'harian' ? 'active' : ''}`} onClick={() => setActiveTab('harian')}>
                    <LayoutDashboard size={18} /> Presensi
                </button>
                <button className={`nav-item ${activeTab === 'rfid' ? 'active' : ''}`} onClick={() => setActiveTab('rfid')}>
                    <UserCircle size={18} /> Registrasi
                </button>
                <button className={`nav-item ${activeTab === 'rekap' ? 'active' : ''}`} onClick={() => setActiveTab('rekap')}>
                    <ClipboardList size={18} /> Rekap
                </button>
                <button className={`nav-item ${activeTab === 'pengaturan' ? 'active' : ''}`} onClick={() => setActiveTab('pengaturan')}>
                    <SettingsIcon size={18} /> Pengaturan
                </button>
            </div>

            {activeTab === 'harian' && (
                <>
                {/* HERO SEARCH & FILTERS */}
                <div className="premium-hero glass-card border-0">
                    <div className="hero-glow"></div>
                    <div className="row align-items-center g-4 position-relative">
                        <div className="col-lg-6">
                            <h2 className="fw-black mb-1" style={{ letterSpacing: '-1.5px', fontSize: '2rem' }}>Command Center</h2>
                            <p className="text-muted fw-semibold mb-4">Manajemen kehadiran siswa secara real-time dan terstruktur.</p>
                            
                            <div className="d-flex gap-2 mb-2">
                                <div className="flex-grow-1 position-relative">
                                    <Calendar size={18} className="position-absolute text-primary" style={{ left: 16, top: 14 }} />
                                    <input 
                                        type="date" className="glass-input w-100 ps-5" 
                                        value={selectedDate} onChange={e => setSelectedDate(e.target.value)} 
                                    />
                                </div>
                                <div className="flex-grow-1 position-relative">
                                    <Users size={18} className="position-absolute text-primary" style={{ left: 16, top: 14 }} />
                                    <select 
                                        className="glass-input w-100 ps-5" 
                                        value={selectedKelasId} onChange={e => setSelectedKelasId(e.target.value)}
                                    >
                                        <option value="">Pilih Kelas...</option>
                                        {allDetailKelas.map(k => (
                                            <option key={k.id} value={k.id}>{k.unitNama} - {k.nama}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>
                        <div className="col-lg-6 text-lg-end">
                            {/* Actions and Stats moved to sidebar for better layout */}
                        </div>
                    </div>
                </div>

                {students.length > 0 ? (
                    <div className="grid-layout">
                        {/* MAIN LIST */}
                        <div className="main-column">
                            <div className="glass-card p-4">
                                <div className="d-flex justify-content-between align-items-center mb-4 px-2">
                                    <h5 className="fw-black mb-0">Daftar Kehadiran</h5>
                                    <div className="d-flex gap-2">
                                        <div className="position-relative">
                                            <Search size={16} className="position-absolute text-muted" style={{ left: 14, top: 12 }} />
                                            <input 
                                                type="text" className="form-control form-control-sm border-0 bg-light rounded-pill ps-5" 
                                                placeholder="Cari Siswa..." style={{ width: 200, height: 40 }}
                                                value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                                            />
                                        </div>
                                        <button className="btn btn-soft-primary btn-sm rounded-pill px-3 fw-bold border" onClick={markAllHadir}>
                                            <CheckCircle size={14} className="me-1" /> Hadir Semua
                                        </button>
                                    </div>
                                </div>

                                <div className="table-responsive">
                                    <table className="premium-table">
                                        <thead>
                                            <tr className="text-muted small fw-bold">
                                                <th className="ps-4">SISWA</th>
                                                <th className="text-center">STATUS</th>
                                                <th>KETERANGAN</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredStudents.map((s) => (
                                                <tr key={s.id}>
                                                    <td className="ps-4">
                                                        <div className="d-flex align-items-center gap-3">
                                                            <div className="avatar-ring">{s.nama.charAt(0)}</div>
                                                            <div>
                                                                <div className="fw-black" style={{ color: '#1e293b' }}>{s.nama}</div>
                                                                <div className="small text-muted fw-semibold">NISN: {s.nisn}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="text-center">
                                                        <div className="action-btn-group justify-content-center">
                                                            <CompactStatusBtn active={s.status === 'hadir'} type="hadir" onClick={() => handleStatusChange(s.id, 'hadir')} />
                                                            <CompactStatusBtn active={s.status === 'sakit'} type="sakit" onClick={() => handleStatusChange(s.id, 'sakit')} />
                                                            <CompactStatusBtn active={s.status === 'izin'} type="izin" onClick={() => handleStatusChange(s.id, 'izin')} />
                                                            <CompactStatusBtn active={s.status === 'alpha'} type="alpha" onClick={() => handleStatusChange(s.id, 'alpha')} />
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <input 
                                                            type="text" className="form-control form-control-sm border-0 bg-light rounded-3 fw-semibold" 
                                                            placeholder="Catatan..." value={s.keterangan || ''}
                                                            onChange={e => handleKeteranganChange(s.id, e.target.value)}
                                                        />
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>

                        {/* SIDEBAR STATS & ACTIONS */}
                        <div className="side-column">
                            {/* QUICK ACTIONS CARD */}
                            <div className="glass-card p-4 h-fit-content mb-2">
                                <h5 className="fw-black mb-3 d-flex align-items-center gap-2">
                                    <Activity size={20} className="text-primary" /> Kontrol Presensi
                                </h5>
                                
                                <div className="d-flex flex-column gap-2 mb-4">
                                    <button 
                                        className={`btn w-100 rounded-4 py-3 fw-bold d-flex align-items-center justify-content-center gap-2 transition-all ${sendWA ? 'btn-success' : 'btn-outline-secondary'}`}
                                        style={{ borderStyle: sendWA ? 'solid' : 'dashed', borderWidth: '2px' }}
                                        onClick={() => setSendWA(!sendWA)}
                                    >
                                        <MessageCircle size={20} /> {sendWA ? 'WhatsApp Aktif' : 'Kirim WhatsApp'}
                                    </button>
                                    <button 
                                        className="btn btn-primary w-100 rounded-4 py-3 fw-bold d-flex align-items-center justify-content-center gap-2 shadow-sm"
                                        disabled={saving} onClick={handleSave}
                                        style={{ fontSize: '1.1rem' }}
                                    >
                                        {saving ? <div className="spinner-border spinner-border-sm" /> : <Save size={20} />}
                                        Simpan Data
                                    </button>
                                </div>

                                <div className="grid-2 pb-2">
                                    <div className="p-3 rounded-4 bg-light border-0">
                                        <div className="text-muted small fw-bold text-uppercase mb-1">Hadir</div>
                                        <div className="fw-black text-primary h3 mb-0">{stats.hadirPct.toFixed(1)}%</div>
                                    </div>
                                    <div className="p-3 rounded-4 bg-light border-0">
                                        <div className="text-muted small fw-bold text-uppercase mb-1">Total Siswa</div>
                                        <div className="fw-black text-dark h3 mb-0">{stats.total}</div>
                                    </div>
                                </div>
                            </div>

                            <div className="glass-card p-4 h-fit-content">
                                <h5 className="fw-black mb-4 d-flex align-items-center gap-2">
                                    <PieChartIcon size={20} className="text-primary" /> Distribusi Hari Ini
                                </h5>
                                <div style={{ width: '100%', height: 280 }}>
                                    <ResponsiveContainer>
                                        <PieChart>
                                            <Pie
                                                data={chartData} innerRadius={70} outerRadius={90} 
                                                paddingAngle={10} dataKey="value" stroke="none"
                                            >
                                                {chartData.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                                            </Pie>
                                            <Tooltip 
                                                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}
                                            />
                                            <Legend verticalAlign="bottom" align="center" iconType="circle" wrapperStyle={{ paddingTop: 20 }} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>

                                <div className="mt-4 d-grid gap-2">
                                    <StatLine label="Hadir" value={stats.hadir} color="#10b981" />
                                    <StatLine label="Sakit/Izin" value={stats.sakit + stats.izin} color="#3b82f6" />
                                    <StatLine label="Alpha" value={stats.alpha} color="#f43f5e" />
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="glass-card p-5 text-center mt-4">
                        <div className="opacity-20 mb-4">
                            <LayoutDashboard size={80} className="mx-auto text-primary" />
                        </div>
                        <h4 className="fw-black text-dark mb-2">Belum Ada Data Terpilih</h4>
                        <p className="text-muted mx-auto" style={{ maxWidth: 400 }}>Pilih tanggal dan kelas di atas untuk mulai mengelola kehadiran siswa melalui Command Center.</p>
                    </div>
                )}
                </>
            )}

            {activeTab === 'rfid' && <RfidEnrollment hideHeader={true} />}
            {activeTab === 'pengaturan' && <AttendanceSettings />}
            {activeTab === 'rekap' && <AttendanceRecap />}
        </div>
    )
}

function CompactStatusBtn({ active, type, onClick }) {
    const icons = {
        hadir: <UserCheck size={16} />,
        sakit: <Clock size={16} />,
        izin: <AlertCircle size={16} />,
        alpha: <UserMinus size={16} />
    }
    return (
        <button className={`compact-btn ${active ? `active ${type}` : ''}`} onClick={onClick}>
            {icons[type]}
        </button>
    )
}

function StatLine({ label, value, color }) {
    return (
        <div className="d-flex justify-content-between align-items-center p-3 rounded-4" style={{ background: '#f8fafc' }}>
            <div className="d-flex align-items-center gap-2">
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: color }} />
                <span className="small fw-bold text-muted text-uppercase">{label}</span>
            </div>
            <span className="fw-black" style={{ color: '#1e293b' }}>{value}</span>
        </div>
    )
}
