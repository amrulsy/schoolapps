import { useState, useEffect, useCallback, useRef } from 'react'
import { useApp } from '../../context/AppContext'
import { useCustomAlert } from '../../hooks/useCustomAlert'
import { API_BASE } from '../../services/api'
import { Calendar, Users, Save, CheckCircle, XCircle, AlertCircle, Clock, PieChart as PieChartIcon, Activity } from 'lucide-react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { getAuthHeaders } from '../../services/api'

export default function AttendancePage() {
    const { units } = useApp()
    const { showSuccess, showError } = useCustomAlert()

    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
    const [selectedKelasId, setSelectedKelasId] = useState('')
    const [students, setStudents] = useState([])
    const [loading, setLoading] = useState(false)
    const [saving, setSaving] = useState(false)
    const isMounted = useRef(true)

    useEffect(() => {
        isMounted.current = true
        return () => {
            isMounted.current = false
        }
    }, [])

    // Flat list of classes for the dropdown
    const allDetailKelas = (units || []).flatMap(u => (u.kelas || []).map(k => ({ ...k, unitNama: u.nama })))

    // Calculate stats for chart
    const statsData = [
        { name: 'Hadir', value: students.filter(s => s.status === 'hadir').length, color: '#10b981' },
        { name: 'Sakit', value: students.filter(s => s.status === 'sakit').length, color: '#f59e0b' },
        { name: 'Izin', value: students.filter(s => s.status === 'izin').length, color: '#3b82f6' },
        { name: 'Alpha', value: students.filter(s => s.status === 'alpha').length, color: '#ef4444' }
    ].filter(d => d.value > 0);

    const totalStudents = students.length;

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
            if (isMounted.current && err.name !== 'AbortError' && (!signal || !signal.aborted)) {
                // Check if signal was aborted before showing error to avoid race conditions
                if (!signal?.aborted) showError('Kesalahan', err.message)
            }
        } finally {
            if (isMounted.current && (!signal || !signal.aborted)) {
                setLoading(false)
            }
        }
    }, [selectedDate, selectedKelasId, showError]) // Removed getAuthHeaders from dependency as it is a stable import

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
                    }))
                })
            })
            if (!res.ok) throw new Error('Gagal menyimpan data presensi')
            if (isMounted.current) showSuccess('Berhasil', 'Data presensi berhasil disimpan.')
        } catch (err) {
            if (isMounted.current) showError('Gagal Menyimpan', err.message)
        } finally {
            if (isMounted.current) setSaving(false)
        }
    }

    return (
        <div className="admin-page animate-fadeIn">
            <div className="page-header mb-4">
                <div>
                    <h2 className="d-flex align-items-center gap-2">
                        <div className="p-2 bg-primary bg-opacity-10 rounded-lg text-primary">
                            <Activity size={28} />
                        </div>
                        Presensi Siswa
                    </h2>
                    <p className="text-secondary">Kelola kehadiran harian siswa per kelas dengan analitik statistik.</p>
                </div>
                <div className="actions">
                    <button
                        className="btn btn-primary btn-lg shadow-sm"
                        onClick={handleSave}
                        disabled={saving || students.length === 0}
                    >
                        {saving ? 'Menyimpan...' : <><Save size={20} /> Simpan Presensi</>}
                    </button>
                </div>
            </div>

            <div className="row mb-4">
                <div className="col-lg-8">
                    <div className="card shadow-sm border-0 h-100">
                        <div className="card-body p-4">
                            <h5 className="mb-4 text-dark fw-bold">Filter Pencarian</h5>
                            <div className="row g-3">
                                <div className="col-md-6">
                                    <label className="form-label text-muted fw-semibold mb-2">Tanggal Presensi</label>
                                    <div className="input-group">
                                        <span className="input-group-text bg-light border-0"><Calendar size={18} className="text-muted" /></span>
                                        <input
                                            type="date"
                                            className="form-control border-0 bg-light"
                                            value={selectedDate}
                                            onChange={e => setSelectedDate(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <div className="col-md-6">
                                    <label className="form-label text-muted fw-semibold mb-2">Pilih Kelas</label>
                                    <div className="input-group">
                                        <span className="input-group-text bg-light border-0"><Users size={18} className="text-muted" /></span>
                                        <select
                                            className="form-select border-0 bg-light"
                                            value={selectedKelasId}
                                            onChange={e => setSelectedKelasId(e.target.value)}
                                        >
                                            <option value="">-- Pilih Kelas --</option>
                                            {allDetailKelas.map(k => (
                                                <option key={k.id} value={k.id}>{k.unitNama} - {k.nama}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>
                            {students.length > 0 && (
                                <div className="mt-4 pt-4 border-top">
                                    <button className="btn btn-success" onClick={markAllHadir}>
                                        <CheckCircle size={18} className="me-2" /> Centang Hadir Semua
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="col-lg-4 mt-4 mt-lg-0">
                    <AttendanceStats statsData={statsData} totalStudents={totalStudents} />
                </div>
            </div>

            <div className="mb-4">
                <div className="d-flex justify-content-between align-items-center mb-3 px-1">
                    <h5 className="mb-0 fw-bold text-dark">Daftar Siswa</h5>
                    <span className="badge bg-primary bg-opacity-10 text-primary rounded-pill px-3 py-2 fw-semibold">
                        {students.length} Siswa
                    </span>
                </div>

                {loading ? (
                    <div className="text-center py-5">
                        <div className="spinner-border text-primary" role="status"></div>
                        <p className="mt-3 fw-medium text-secondary">Memuat data siswa...</p>
                    </div>
                ) : students.length === 0 ? (
                    <div className="card shadow-sm border-0 bg-light">
                        <div className="card-body text-center py-5 text-secondary fw-medium d-flex flex-column align-items-center">
                            <Users size={48} className="text-muted opacity-50 mb-3" />
                            {selectedKelasId ? 'Tidak ada siswa aktif di kelas ini.' : 'Pilih kelas terlebih dahulu untuk melihat dan mengelola daftar siswa.'}
                        </div>
                    </div>
                ) : (
                    <div className="row g-3">
                        {students.map((s, i) => (
                            <div key={s.id} className="col-12 col-md-6 col-xl-4">
                                <StudentCard
                                    student={s}
                                    index={i}
                                    onStatusChange={handleStatusChange}
                                    onKeteranganChange={handleKeteranganChange}
                                />
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

/**
 * Component-based UI for Attendance Analytics
 */
function AttendanceStats({ statsData, totalStudents }) {
    return (
        <div className="card shadow-sm border-0 h-100">
            <div className="card-body p-4 d-flex flex-column align-items-center justify-content-center">
                <h5 className="mb-3 text-dark fw-bold align-self-start w-100 text-center">Analitik Kehadiran</h5>
                {totalStudents === 0 ? (
                    <div className="text-center text-muted my-auto py-4">
                        <PieChartIcon size={48} className="opacity-25 mb-2" />
                        <p>Pilih kelas untuk melihat statistik.</p>
                    </div>
                ) : (
                    <div style={{ width: '100%', height: 220 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={statsData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {statsData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip borderRadius={8} />
                                <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '13px' }} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                )}
            </div>
        </div>
    )
}

/**
 * Component-based Card layout for Student Item
 */
function StudentCard({ student, index, onStatusChange, onKeteranganChange }) {
    const s = student;
    const statusColors = {
        hadir: { bg: '#ecfdf5', text: '#059669' },
        sakit: { bg: '#fffbeb', text: '#d97706' },
        izin: { bg: '#eff6ff', text: '#2563eb' },
        alpha: { bg: '#fef2f2', text: '#dc2626' }
    };

    const currentStyle = statusColors[s.status] || statusColors.hadir;

    return (
        <div className="card shadow-sm border-0 h-100 animate-fadeIn" style={{ overflow: 'hidden', borderRadius: '12px' }}>
            <div className="card-body p-0">
                {/* Status Header */}
                <div className="p-3 d-flex justify-content-between align-items-center border-bottom" style={{ backgroundColor: currentStyle.bg }}>
                    <div className="d-flex align-items-center gap-2">
                        <div className="fw-bold px-2 py-1 rounded" style={{ fontSize: '0.8rem', backgroundColor: 'rgba(255,255,255,0.7)', color: '#4b5563' }}>
                            No. {index + 1}
                        </div>
                    </div>
                    <div className="fw-bold" style={{ fontSize: '0.85rem', color: currentStyle.text }}>
                        {(s.status || 'BELUM').toUpperCase()}
                    </div>
                </div>

                {/* Content */}
                <div className="p-3">
                    <div className="d-flex flex-column mb-3">
                        <span className="fw-bold text-dark fs-6 text-truncate" title={s.nama}>{s.nama}</span>
                        <span className="text-muted small mono" style={{ fontSize: '0.8rem' }}>NISN: {s.nisn}</span>
                    </div>

                    {/* Status Options */}
                    <div className="d-flex justify-content-between gap-2 mb-3">
                        <AttendanceButton
                            active={s.status === 'hadir'}
                            variant="success"
                            icon={<CheckCircle size={14} />}
                            label="Hadir"
                            onClick={() => onStatusChange(s.id, 'hadir')}
                        />
                        <AttendanceButton
                            active={s.status === 'sakit'}
                            variant="warning"
                            icon={<Clock size={14} />}
                            label="Sakit"
                            onClick={() => onStatusChange(s.id, 'sakit')}
                        />
                        <AttendanceButton
                            active={s.status === 'izin'}
                            variant="info"
                            icon={<AlertCircle size={14} />}
                            label="Izin"
                            onClick={() => onStatusChange(s.id, 'izin')}
                        />
                        <AttendanceButton
                            active={s.status === 'alpha'}
                            variant="danger"
                            icon={<XCircle size={14} />}
                            label="Alpha"
                            onClick={() => onStatusChange(s.id, 'alpha')}
                        />
                    </div>

                    {/* Note Input */}
                    <div className="position-relative">
                        <input
                            type="text"
                            className="form-control form-control-sm border-0 bg-light px-3"
                            placeholder="Tulis catatan opsional..."
                            value={s.keterangan || ''}
                            onChange={e => onKeteranganChange(s.id, e.target.value)}
                            style={{ height: '36px', borderRadius: '8px', fontSize: '0.85rem' }}
                        />
                    </div>
                </div>
            </div>
        </div>
    )
}

function AttendanceButton({ active, variant, icon, label, onClick }) {
    const baseClass = "btn btn-sm d-flex align-items-center gap-1"
    const activeClasses = {
        success: "btn-success shadow-sm",
        warning: "btn-warning text-dark shadow-sm",
        info: "btn-info text-white shadow-sm",
        danger: "btn-danger shadow-sm"
    }
    const inactiveClass = "btn-light text-muted border"

    return (
        <button
            type="button"
            className={`${baseClass} ${active ? activeClasses[variant] : inactiveClass}`}
            onClick={onClick}
            title={label}
            style={{ flex: 1, minWidth: '0', justifyContent: 'center', padding: '6px 4px', borderRadius: '8px' }}
        >
            <div className="d-flex align-items-center gap-1 flex-wrap justify-content-center">
                {icon}
                <span style={{ fontSize: '0.75rem', fontWeight: active ? '600' : '500' }}>{label}</span>
            </div>
        </button>
    )
}
