import { useState, useEffect, useMemo } from 'react'
import { useApp } from '../../context/AppContext'
import LoadingSpinner from '../../components/LoadingSpinner'
import {
    HandHeart, Calendar, Users, CheckCircle2, AlertCircle,
    ChevronRight, Search, Filter, Zap, Clock, TrendingUp, Sparkles, Plus, BarChart3,
    History, X, ChevronLeft, MapPin
} from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell } from 'recharts'
import api from '../../services/api'
import Swal from 'sweetalert2'

export default function InfaqHarianPage() {
    const { units, formatRupiah, axiosConfig } = useApp()
    const [kelasId, setKelasId] = useState('')
    const [date, setDate] = useState(new Date().toISOString().split('T')[0])
    const [loading, setLoading] = useState(false)
    const [data, setData] = useState({ isCollection: true, students: [] })
    const [search, setSearch] = useState('')
    const [summaryData, setSummaryData] = useState({ daily: [], classes: [] })
    const [selectedSiswa, setSelectedSiswa] = useState(null)
    const [historyData, setHistoryData] = useState(null)
    const [showHistory, setShowHistory] = useState(false)

    const fetchSummary = async () => {
        try {
            const end = new Date().toISOString().split('T')[0]
            const start = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
            const res = await api.get('/admin/infaq/summary', { params: { startDate: start, endDate: end } })
            setSummaryData(res.data)
        } catch (err) { console.error(err) }
    }

    const fetchStatus = async () => {
        if (!kelasId) return
        setLoading(true)
        try {
            const res = await api.get('/admin/infaq/status', { params: { date, kelas_id: kelasId } })
            setData(res.data)
        } catch (err) {
            Swal.fire('Error', err.response?.data?.error || err.message, 'error')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchStatus()
        fetchSummary()
    }, [kelasId, date])

    const handlePay = async (siswaId, nominal, days = 1) => {
        try {
            await api.post('/admin/infaq/pay', {
                payments: [{ siswa_id: siswaId, date, nominal, days }],
                user_id: 1 // TODO: Get current user ID
            })
            fetchStatus()
            if (days > 1) {
                Swal.fire({
                    title: 'Berhasil!',
                    text: `Infaq prabayar selama ${days} hari telah dicatat.`,
                    icon: 'success',
                    timer: 2000,
                    showConfirmButton: false
                })
            }
        } catch (err) {
            Swal.fire('Error', 'Gagal mencatat pembayaran', 'error')
        }
    }

    const filteredStudents = useMemo(() => {
        return data.students.filter(s =>
            s.nama.toLowerCase().includes(search.toLowerCase()) ||
            s.nis?.toLowerCase().includes(search.toLowerCase())
        )
    }, [data.students, search])

    const stats = useMemo(() => {
        const paid = data.students.filter(s => s.has_paid).length
        const total = data.students.length
        const amount = data.students.reduce((acc, s) => acc + (s.nominal || 0), 0)
        return { paid, total, amount }
    }, [data.students])

    const openPrepaidModal = (siswa) => {
        Swal.fire({
            title: `Infaq Prabayar: ${siswa.nama}`,
            html: `
                <div class="text-start">
                    <label class="form-label d-block text-muted small fw-bold">Pilih Durasi</label>
                    <select id="prepaid-days" class="form-select rounded-3 mb-3">
                        <option value="6">1 Minggu (6 Hari)</option>
                        <option value="12">2 Minggu (12 Hari)</option>
                        <option value="24">1 Bulan (24 Hari)</option>
                    </select>
                    <label class="form-label d-block text-muted small fw-bold">Nominal per Hari (Default Rp 2.000)</label>
                    <input type="number" id="prepaid-nominal" class="form-control rounded-3" value="2000">
                </div>
            `,
            showCancelButton: true,
            confirmButtonText: 'Proses Pembayaran',
            confirmButtonColor: '#3b82f6',
            preConfirm: () => {
                const days = document.getElementById('prepaid-days').value
                const nominalPerDay = document.getElementById('prepaid-nominal').value
                return { days: parseInt(days), totalNominal: nominalPerDay * days }
            }
        }).then((result) => {
            if (result.isConfirmed) {
                handlePay(siswa.id, result.value.totalNominal, result.value.days)
            }
        })
    }

    const openHistoryModal = async (siswa) => {
        setSelectedSiswa(siswa)
        setShowHistory(true)
        setHistoryData(null)
        try {
            const res = await api.get(`/admin/infaq/history/${siswa.id}`)
            setHistoryData(res.data)
        } catch (err) {
            Swal.fire('Error', 'Gagal mengambil riwayat infaq', 'error')
            setShowHistory(false)
        }
    }

    const handlePastPay = async (date) => {
        const result = await Swal.fire({
            title: 'Bayar Infaq Terlewat',
            text: `Apakah Anda ingin membayar infaq untuk tanggal ${new Date(date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}?`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Ya, Bayar',
            cancelButtonText: 'Batal'
        })

        if (result.isConfirmed) {
            try {
                await api.post('/admin/infaq/pay', {
                    payments: [{ siswa_id: selectedSiswa.id, date, nominal: 2000, days: 1 }],
                    user_id: 1
                })
                // Refresh data
                const res = await api.get(`/admin/infaq/history/${selectedSiswa.id}`)
                setHistoryData(res.data)
                fetchStatus()
            } catch (err) {
                Swal.fire('Error', 'Gagal memproses pembayaran', 'error')
            }
        }
    }

    return (
        <div className="infaq-page fade-in">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <div className="d-flex align-items-center gap-2 mb-1">
                        <HandHeart size={18} className="text-primary" />
                        <span className="text-uppercase fw-bold small text-muted tracking-wider">Layanan Infaq</span>
                    </div>
                    <h1 className="fw-black m-0">Infaq Harian</h1>
                </div>
                <div className="d-flex gap-3">
                    <div className="glass p-2 px-3 rounded-4 border d-flex align-items-center gap-2">
                        <Calendar size={18} className="text-muted" />
                        <input
                            type="date"
                            className="border-0 bg-transparent fw-bold"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            <div className="row g-4 mb-4">
                <div className="col-md-3">
                    <div className="bento-card glass h-100">
                        <div className="text-muted small fw-bold mb-2">PILIH KELAS</div>
                        <select
                            className="form-select border-0 shadow-none bg-light rounded-3 fw-bold"
                            value={kelasId}
                            onChange={(e) => setKelasId(e.target.value)}
                        >
                            <option value="">-- Pilih Kelas --</option>
                            {units.map(unit =>
                                unit.kelas?.map(k => (
                                    <option key={k.id} value={k.id}>{k.nama}</option>
                                ))
                            )}
                        </select>
                    </div>
                </div>
                <div className="col-md-3">
                    <div className="bento-card glass h-100" style={{ '--accent-light': 'rgba(16, 185, 129, 0.2)' }}>
                        <div className="d-flex justify-content-between align-items-center mb-1">
                            <span className="text-muted small fw-bold">TERKUMPUL HARI INI</span>
                            <TrendingUp size={16} className="text-success" />
                        </div>
                        <div className="h3 fw-black m-0 text-success">{formatRupiah(stats.amount)}</div>
                    </div>
                </div>
                <div className="col-md-3">
                    <div className="bento-card glass h-100" style={{ '--accent-light': 'rgba(59, 130, 246, 0.2)' }}>
                        <div className="text-muted small fw-bold mb-1">PARTISIPASI</div>
                        <div className="h3 fw-black m-0 text-primary">{stats.paid} / {stats.total}</div>
                        <div className="progress mt-2" style={{ height: '6px' }}>
                            <div
                                className="progress-bar bg-primary"
                                style={{ width: `${(stats.paid / stats.total) * 100 || 0}%` }}
                            ></div>
                        </div>
                    </div>
                </div>
                <div className="col-md-3">
                    <div className="bento-card bg-dark text-white h-100">
                        <div className="text-muted small fw-bold mb-1 opacity-75">STATUS HARI</div>
                        <div className="d-flex align-items-center gap-2 mt-1">
                            {data.isCollection ? (
                                <><div className="pulse-live bg-success"></div> <span className="fw-bold text-success">Hari Koleksi</span></>
                            ) : (
                                <><AlertCircle size={20} className="text-danger" /> <span className="fw-bold text-danger">{data.reason}</span></>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="bento-card glass">
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <h4 className="fw-bold m-0 d-flex align-items-center gap-2">
                        <Users size={20} className="text-muted" /> Rincian Siswa
                    </h4>
                    <div className="search-box glass border d-flex align-items-center gap-2 px-3 py-1 rounded-pill">
                        <Search size={16} className="text-muted" />
                        <input
                            type="text"
                            placeholder="Cari nama siswa..."
                            className="border-0 bg-transparent"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>

                <div className="table-responsive">
                    <table className="table table-hover align-middle">
                        <thead>
                            <tr className="text-muted small">
                                <th>SISWA</th>
                                <th>STATUS</th>
                                <th>OVERDUE (HARI)</th>
                                <th className="text-end">AKSI</th>
                            </tr>
                        </thead>
                        <tbody>
                            {!kelasId ? (
                                <tr>
                                    <td colSpan="4" className="text-center py-5 text-muted fst-italic">Silakan pilih kelas terlebih dahulu</td>
                                </tr>
                            ) : loading ? (
                                <tr>
                                    <td colSpan="4" className="text-center py-5"><LoadingSpinner message="Mengambil data..." /></td>
                                </tr>
                            ) : filteredStudents.length === 0 ? (
                                <tr>
                                    <td colSpan="4" className="text-center py-5 text-muted">Tidak ada data ditemukan</td>
                                </tr>
                            ) : filteredStudents.map(s => (
                                <tr key={s.id}>
                                    <td>
                                        <div className="fw-bold">{s.nama}</div>
                                        <div className="text-muted small">{s.nis || 'Tanpa NIS'}</div>
                                    </td>
                                    <td>
                                        {s.has_paid ? (
                                            <span className="badge bg-success-subtle text-success border border-success-subtle rounded-pill px-3">
                                                <CheckCircle2 size={12} className="me-1" /> Sudah Infaq
                                            </span>
                                        ) : (
                                            <span className="badge bg-light text-muted border rounded-pill px-3">Belum Infaq</span>
                                        )}
                                    </td>
                                    <td>
                                        {s.missed_days > 0 ? (
                                            <div className="d-flex align-items-center gap-2 text-danger fw-bold">
                                                <div className="overdue-badge">{s.missed_days}</div>
                                                <span className="small">Hari Terlewat</span>
                                            </div>
                                        ) : (
                                            <span className="text-success small fw-bold">Lancar</span>
                                        )}
                                    </td>
                                    <td className="text-end">
                                        <div className="d-flex justify-content-end gap-2">
                                            {!s.has_paid && data.isCollection && (
                                                <>
                                                    <button
                                                        className="btn btn-primary btn-sm rounded-pill px-3 fw-bold d-flex align-items-center gap-1"
                                                        onClick={() => handlePay(s.id, 2000, 1)}
                                                        title="Bayar Hari Ini"
                                                    >
                                                        <Plus size={14} /> Rp 2rb
                                                    </button>
                                                    <button
                                                        className="btn btn-outline-primary btn-sm rounded-pill px-3 fw-bold d-flex align-items-center gap-1"
                                                        onClick={() => openPrepaidModal(s)}
                                                        title="Bayar Banyak Hari"
                                                    >
                                                        <Zap size={14} /> Prabayar
                                                    </button>
                                                </>
                                            )}
                                            <button
                                                className="btn btn-light btn-sm rounded-pill px-3 fw-bold d-flex align-items-center gap-1 border"
                                                onClick={() => openHistoryModal(s)}
                                                title="Lihat Riwayat & Kalender"
                                            >
                                                <History size={14} /> Riwayat
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="row g-4 mt-2">
                <div className="col-md-8">
                    <div className="bento-card glass">
                        <div className="d-flex justify-content-between align-items-center mb-4">
                            <h4 className="fw-bold m-0 d-flex align-items-center gap-2">
                                <BarChart3 size={20} className="text-muted" /> Tren Koleksi (7 Hari Trakhir)
                            </h4>
                        </div>
                        <div style={{ height: '300px' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={summaryData.daily}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.1} />
                                    <XAxis 
                                        dataKey="tanggal" 
                                        tick={{ fontSize: 10 }} 
                                        tickFormatter={v => new Date(v).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                                    />
                                    <YAxis tick={{ fontSize: 10 }} tickFormatter={v => v >= 1000 ? `${v/1000}rb` : v} />
                                    <RechartsTooltip 
                                        formatter={(value) => [formatRupiah(value), 'Total Infaq']}
                                        labelFormatter={v => new Date(v).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })}
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                                    />
                                    <Bar dataKey="total" radius={[6, 6, 0, 0]} barSize={40}>
                                        {summaryData.daily.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={index === summaryData.daily.length - 1 ? '#3b82f6' : '#94a3b8'} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
                <div className="col-md-4">
                    <div className="bento-card glass h-100">
                        <h4 className="fw-bold mb-4">Top Kelas Sepekan</h4>
                        <div className="class-ranking">
                            {summaryData.classes.slice(0, 5).map((c, i) => (
                                <div key={i} className="d-flex align-items-center gap-3 mb-3 p-2 rounded-3 hover-up border-bottom border-light">
                                    <div className="rank-num">{i + 1}</div>
                                    <div className="flex-grow-1">
                                        <div className="fw-bold small">{c.kelas_nama}</div>
                                        <div className="text-muted" style={{ fontSize: '0.7rem' }}>{formatRupiah(c.total)}</div>
                                    </div>
                                    <div className="progress flex-grow-1" style={{ height: '4px', maxWidth: '60px' }}>
                                        <div className="progress-bar bg-success" style={{ width: '70%' }}></div>
                                    </div>
                                </div>
                            ))}
                            {summaryData.classes.length === 0 && <div className="text-center py-5 text-muted fst-italic">Belum ada data pekan ini</div>}
                        </div>
                    </div>
                </div>
            </div>

            {showHistory && (
                <HistoryModal 
                    siswa={selectedSiswa} 
                    data={historyData} 
                    onClose={() => setShowHistory(false)} 
                    onPay={handlePastPay}
                    formatRupiah={formatRupiah} 
                />
            )}

            <style dangerouslySetInnerHTML={{ __html: `
                .rank-num {
                    width: 24px; height: 24px; background: var(--primary-100); color: var(--primary-600);
                    border-radius: 50%; display: flex; align-items: center; justify-content: center;
                    font-weight: 800; font-size: 0.7rem;
                }
                .hover-up:hover { transform: translateY(-2px); transition: transform 0.2s; }
                .overdue-badge {
                    width: 24px; height: 24px; background: #fee2e2; color: #ef4444; border-radius: 6px;
                    display: flex; align-items: center; justify-content: center; font-size: 0.75rem;
                }
                .search-box input:focus { outline: none; }
                .tracking-wider { letterSpacing: 1px; }

                .calendar-grid {
                    display: grid;
                    grid-template-columns: repeat(7, 1fr);
                    gap: 8px;
                }
                .calendar-day {
                    aspect-ratio: 1;
                    border-radius: 12px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    font-size: 0.8rem;
                    position: relative;
                    cursor: default;
                    transition: all 0.2s;
                    border: 1px solid var(--border-color);
                }
                .calendar-day.is-today { border: 2px solid var(--primary-500); }
                .calendar-day.paid { background: #dcfce7; color: #166534; border-color: #bbf7d0; }
                .calendar-day.missed { background: #fee2e2; color: #991b1b; border-color: #fecaca; cursor: pointer; }
                .calendar-day.missed:hover { background: #fecaca; transform: scale(1.05); }
                .calendar-day.holiday { background: #f3f4f6; color: #9ca3af; opacity: 0.5; }
                .calendar-day.prepaid { background: #fef9c3; color: #854d0e; border-color: #fef08a; }
                
                .day-status-icon {
                    margin-top: 4px;
                }

                .modal-overlay {
                    position: fixed; top: 0; left: 0; width: 100%; height: 100%;
                    background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center;
                    z-index: 1050; backdrop-filter: blur(4px);
                }
                .history-modal-content {
                    background: var(--bg-card); width: 90%; max-width: 700px; max-height: 90vh;
                    border-radius: 24px; overflow: hidden; display: flex; flex-direction: column;
                    box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25); border: 1px solid var(--border-color);
                }
            `}} />
        </div>
    )
}

function HistoryModal({ siswa, data, onClose, onPay, formatRupiah }) {
    const [viewDate, setViewDate] = useState(new Date())
    
    const daysInMonth = (month, year) => new Date(year, month + 1, 0).getDate()
    const firstDayIndex = (month, year) => new Date(year, month, 1).getDay() // 0=Sun, 1=Mon

    const month = viewDate.getMonth()
    const year = viewDate.getFullYear()
    const daysCount = daysInMonth(month, year)
    const firstDay = firstDayIndex(month, year)
    
    // Shift firstDay to match Monday start (Mon=0, Sun=6)
    // original: 0=Sun, 1=Mon, 2=Tue...
    // adjusted: 0=Mon, 1=Tue... 6=Sun
    const adjustedFirstDay = firstDay === 0 ? 6 : firstDay - 1

    const days = []
    
    // Empty slots before first day
    for (let i = 0; i < adjustedFirstDay; i++) days.push(null)
    
    // Actual days
    for (let d = 1; d <= daysCount; d++) {
        const dStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
        const dateObj = new Date(year, month, d)
        const isSunday = dateObj.getDay() === 0
        const isToday = dStr === new Date().toISOString().split('T')[0]
        const isFuture = dStr > new Date().toISOString().split('T')[0]
        
        const payment = data?.history?.find(p => p.tanggal === dStr)
        const holiday = data?.holidays?.find(h => h.tanggal === dStr)
        
        let status = 'none'
        if (isSunday || holiday) status = 'holiday'
        else if (payment && isFuture) status = 'prepaid'
        else if (payment) status = 'paid'
        else if (!isFuture) status = 'missed'
        else status = 'none'

        days.push({ day: d, date: dStr, status, holiday: holiday?.keterangan, isToday })
    }

    const nextMonth = () => setViewDate(new Date(year, month + 1, 1))
    const prevMonth = () => setViewDate(new Date(year, month - 1, 1))

    return (
        <div className="modal-overlay px-3">
            <div className="history-modal-content fade-in-up">
                <div className="p-4 border-bottom d-flex justify-content-between align-items-center bg-light bg-opacity-50">
                    <div className="d-flex align-items-center gap-3">
                        <div className="avatar bg-primary text-white rounded-circle p-2" style={{ width: 45, height: 45, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {siswa.nama.charAt(0)}
                        </div>
                        <div>
                            <h5 className="fw-black m-0">{siswa.nama}</h5>
                            <p className="text-muted small m-0">{siswa.nis || 'Tanpa NIS'} • Kelas {siswa.kelas_nama}</p>
                        </div>
                    </div>
                    <button className="btn btn-light btn-icon rounded-circle border" onClick={onClose}><X size={20} /></button>
                </div>

                <div className="p-4 overflow-auto">
                    {!data ? (
                        <div className="text-center py-5"><LoadingSpinner message="Memuat kalender..." /></div>
                    ) : (
                        <>
                            <div className="d-flex justify-content-between align-items-center mb-4">
                                <h6 className="fw-bold m-0 d-flex align-items-center gap-2">
                                    <Calendar size={18} />
                                    {new Date(year, month).toLocaleString('id-ID', { month: 'long', year: 'numeric' })}
                                </h6>
                                <div className="d-flex gap-2">
                                    <button className="btn btn-light btn-sm rounded-pill border px-3" onClick={prevMonth}><ChevronLeft size={16} /></button>
                                    <button className="btn btn-light btn-sm rounded-pill border px-3" onClick={nextMonth}><ChevronRight size={16} /></button>
                                </div>
                            </div>

                            <div className="calendar-grid mb-4">
                                {['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'].map(d => (
                                    <div key={d} className="text-center text-muted small fw-bold mb-2">{d}</div>
                                ))}
                                {days.map((d, i) => (
                                    d ? (
                                        <div 
                                            key={i} 
                                            className={`calendar-day ${d.status} ${d.isToday ? 'is-today' : ''}`}
                                            onClick={() => d.status === 'missed' && onPay(d.date)}
                                            title={d.holiday || (d.status === 'missed' ? 'Klik untuk bayar' : '')}
                                        >
                                            <span className="small fw-bold">{d.day}</span>
                                            <div className="day-status-icon">
                                                {d.status === 'paid' && <CheckCircle2 size={12} />}
                                                {d.status === 'missed' && <X size={12} />}
                                                {d.status === 'prepaid' && <Clock size={12} />}
                                            </div>
                                        </div>
                                    ) : <div key={i}></div>
                                ))}
                            </div>

                            <div className="legend row g-2 mt-4 p-3 glass rounded-4 border">
                                <div className="col-4 d-flex align-items-center gap-2 small">
                                    <div className="rounded-circle bg-success" style={{ width: 8, height: 8 }}></div> Lunas
                                </div>
                                <div className="col-4 d-flex align-items-center gap-2 small">
                                    <div className="rounded-circle bg-danger" style={{ width: 8, height: 8 }}></div> Menunggak
                                </div>
                                <div className="col-4 d-flex align-items-center gap-2 small">
                                    <div className="rounded-circle bg-warning" style={{ width: 8, height: 8 }}></div> Prabayar
                                </div>
                                <div className="col-4 d-flex align-items-center gap-2 small">
                                    <div className="rounded-circle bg-secondary" style={{ width: 8, height: 8, opacity: 0.5 }}></div> Libur
                                </div>
                            </div>
                        </>
                    )}
                </div>
                
                <div className="p-4 bg-light border-top d-flex justify-content-between">
                    <div className="small text-muted">
                        <MapPin size={12} className="me-1" />
                        Klik pada hari <b className="text-danger">Merah</b> untuk membayar hari tersebut.
                    </div>
                    <button className="btn btn-dark rounded-pill px-4 fw-bold" onClick={onClose}>Tutup</button>
                </div>
            </div>
        </div>
    )
}
