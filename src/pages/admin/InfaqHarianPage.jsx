import { useState, useEffect, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import LoadingSpinner from '../../components/LoadingSpinner'
import {
    HandHeart, Calendar, Users, CheckCircle2, AlertCircle,
    ChevronRight, Search, ChevronLeft, Edit3, TrendingUp, BarChart3,
    Settings, X, FileText, MapPin, Clock
} from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell } from 'recharts'
import api from '../../services/api'
import Swal from 'sweetalert2'

export default function InfaqHarianPage() {
    const { units, formatRupiah, addToast } = useApp()
    const navigate = useNavigate()
    const [kelasId, setKelasId] = useState('')
    const [date, setDate] = useState(new Date().toISOString().split('T')[0])
    const [loading, setLoading] = useState(false)
    const [data, setData] = useState({ isCollection: true, students: [], settings: {} })
    const [search, setSearch] = useState('')
    const [summaryData, setSummaryData] = useState({ daily: [], classes: [] })
    const [selectedSiswa, setSelectedSiswa] = useState(null)
    const [showHistory, setShowHistory] = useState(false)

    // Global Summary state
    const [globalSummary, setGlobalSummary] = useState(null)
    const [transactions, setTransactions] = useState({ transactions: [], pagination: {} })
    const [txPage, setTxPage] = useState(1)
    const [selectedTA, setSelectedTA] = useState('')
    const [showSummaryPanel, setShowSummaryPanel] = useState(false)

    const fetchSummary = useCallback(async () => {
        try {
            const end = new Date().toISOString().split('T')[0]
            const start = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
            const res = await api.get('/admin/infaq/summary', { params: { startDate: start, endDate: end } })
            setSummaryData(res.data)
        } catch (err) { console.error(err) }
    }, [])

    const fetchGlobalSummary = useCallback(async () => {
        try {
            const params = {}
            if (selectedTA) params.tahun_ajaran_id = selectedTA
            const res = await api.get('/admin/infaq/summary/global', { params })
            setGlobalSummary(res.data)
        } catch (err) { console.error(err) }
    }, [selectedTA])

    const fetchTransactions = useCallback(async (page = 1) => {
        try {
            const params = { page, limit: 10 }
            if (selectedTA) params.tahun_ajaran_id = selectedTA
            const res = await api.get('/admin/infaq/transactions', { params })
            setTransactions(res.data)
            setTxPage(page)
        } catch (err) { console.error(err) }
    }, [selectedTA])

    const fetchStatus = useCallback(async () => {
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
    }, [kelasId, date])

    useEffect(() => { fetchStatus(); fetchSummary() }, [fetchStatus, fetchSummary])
    useEffect(() => { fetchGlobalSummary(); fetchTransactions(1) }, [fetchGlobalSummary, fetchTransactions])


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

    const openHistoryModal = (siswa) => {
        setSelectedSiswa(siswa)
        setShowHistory(true)
    }

    // Monthly chart data from global summary
    const monthlyChartData = useMemo(() => {
        if (!globalSummary?.monthly) return []
        return globalSummary.monthly.map(m => ({
            label: `${['', 'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'][m.bulan]} ${m.tahun}`,
            total: Number(m.total_collected),
            students: m.unique_students
        }))
    }, [globalSummary])

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
                    <button
                        className={`btn ${showSummaryPanel ? 'btn-dark' : 'btn-outline-dark'} rounded-4 border-0 px-4 d-flex align-items-center gap-2 fw-bold shadow-sm`}
                        onClick={() => { setShowSummaryPanel(!showSummaryPanel); if (!showSummaryPanel) { fetchGlobalSummary(); fetchTransactions(1) } }}
                    >
                        <BarChart3 size={18} /> Ringkasan Global
                    </button>
                    <button
                        className="btn btn-primary rounded-4 border-0 px-4 d-flex align-items-center gap-2 fw-bold shadow-sm"
                        onClick={() => navigate('/admin/infaq-settings')}
                    >
                        <Settings size={18} /> Pengaturan
                    </button>
                    <div className="glass p-2 px-3 rounded-4 border d-flex align-items-center gap-2">
                        <Calendar size={18} className="text-muted" />
                        <input type="date" className="border-0 bg-transparent fw-bold" value={date} onChange={(e) => setDate(e.target.value)} />
                    </div>
                </div>
            </div>

            <div className="row g-4 mb-4">
                <div className="col-md-3">
                    <div className="bento-card glass h-100">
                        <div className="text-muted small fw-bold mb-2">PILIH KELAS</div>
                        <select className="form-select border-0 shadow-none bg-light rounded-3 fw-bold" value={kelasId} onChange={(e) => setKelasId(e.target.value)}>
                            <option value="">-- Pilih Kelas --</option>
                            {units.map(unit => unit.kelas?.map(k => (<option key={k.id} value={k.id}>{k.nama}</option>)))}
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
                            <div className="progress-bar bg-primary" style={{ width: `${(stats.paid / stats.total) * 100 || 0}%` }}></div>
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

            {/* Student Table */}
            <div className="bento-card glass">
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <h4 className="fw-bold m-0 d-flex align-items-center gap-2">
                        <Users size={20} className="text-muted" /> Rincian Siswa
                    </h4>
                    <div className="search-box glass border d-flex align-items-center gap-2 px-3 py-1 rounded-pill">
                        <Search size={16} className="text-muted" />
                        <input type="text" placeholder="Cari nama siswa..." className="border-0 bg-transparent" value={search} onChange={(e) => setSearch(e.target.value)} />
                    </div>
                </div>
                <div className="table-responsive">
                    <table className="table table-hover align-middle">
                        <thead>
                            <tr className="text-muted small">
                                <th>SISWA</th>
                                <th>STATUS HARI INI</th>
                                <th>TOTAL TUNGGAKAN</th>
                                <th className="text-end">AKSI</th>
                            </tr>
                        </thead>
                        <tbody>
                            {!kelasId ? (
                                <tr><td colSpan="4" className="text-center py-5 text-muted fst-italic">Silakan pilih kelas terlebih dahulu</td></tr>
                            ) : loading ? (
                                <tr><td colSpan="4" className="text-center py-5"><LoadingSpinner message="Mengambil data..." /></td></tr>
                            ) : filteredStudents.length === 0 ? (
                                <tr><td colSpan="4" className="text-center py-5 text-muted">Tidak ada data ditemukan</td></tr>
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
                                                <span className="small">Hari</span>
                                            </div>
                                        ) : (
                                            <span className="text-success small fw-bold">Lunas</span>
                                        )}
                                    </td>
                                    <td className="text-end">
                                        <button
                                            className="btn btn-primary btn-sm rounded-pill px-4 fw-bold d-flex align-items-center gap-2 shadow-sm ms-auto"
                                            onClick={() => openHistoryModal(s)}
                                        >
                                            <HandHeart size={14} /> Bayar Infaq
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Weekly Chart & Ranking */}
            <div className="row g-4 mt-2">
                <div className="col-md-8">
                    <div className="bento-card glass">
                        <h4 className="fw-bold mb-4 d-flex align-items-center gap-2">
                            <BarChart3 size={20} className="text-muted" /> Tren Koleksi (7 Hari Terakhir)
                        </h4>
                        <div style={{ height: '300px' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={summaryData.daily}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.1} />
                                    <XAxis dataKey="tanggal" tick={{ fontSize: 10 }} tickFormatter={v => new Date(v).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} />
                                    <YAxis tick={{ fontSize: 10 }} tickFormatter={v => v >= 1000 ? `${v / 1000}rb` : v} />
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
                                </div>
                            ))}
                            {summaryData.classes.length === 0 && <div className="text-center py-5 text-muted fst-italic">Belum ada data pekan ini</div>}
                        </div>
                    </div>
                </div>
            </div>

            {/* === GLOBAL SUMMARY PANEL === */}
            {showSummaryPanel && (
                <div className="mt-4 fade-in">
                    <div className="bento-card glass">
                        <div className="d-flex justify-content-between align-items-center mb-4">
                            <h4 className="fw-bold m-0 d-flex align-items-center gap-2">
                                <TrendingUp size={20} className="text-primary" /> Ringkasan Global Infaq
                            </h4>
                            <div className="d-flex align-items-center gap-3">
                                <select
                                    className="form-select form-select-sm rounded-pill border-0 bg-light px-3 fw-bold"
                                    style={{ width: 'auto' }}
                                    value={selectedTA}
                                    onChange={e => setSelectedTA(e.target.value)}
                                >
                                    <option value="">Semua Tahun Ajaran</option>
                                    {globalSummary?.tahun_ajaran_list?.map(ta => (
                                        <option key={ta.id} value={ta.id}>{ta.tahun}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Stats Cards */}
                        {globalSummary && (
                            <div className="row g-3 mb-4">
                                <div className="col-md-4">
                                    <div className="p-3 rounded-4 bg-success bg-opacity-10 border border-success-subtle">
                                        <div className="text-muted small fw-bold">TOTAL TERKUMPUL</div>
                                        <div className="h4 fw-black text-success m-0 mt-1">{formatRupiah(globalSummary.grand_total)}</div>
                                    </div>
                                </div>
                                <div className="col-md-4">
                                    <div className="p-3 rounded-4 bg-primary bg-opacity-10 border border-primary-subtle">
                                        <div className="text-muted small fw-bold">TOTAL TRANSAKSI</div>
                                        <div className="h4 fw-black text-primary m-0 mt-1">{globalSummary.total_records?.toLocaleString('id-ID')}</div>
                                    </div>
                                </div>
                                <div className="col-md-4">
                                    <div className="p-3 rounded-4 bg-warning bg-opacity-10 border border-warning-subtle">
                                        <div className="text-muted small fw-bold">KELAS AKTIF</div>
                                        <div className="h4 fw-black text-warning m-0 mt-1">{globalSummary.classes?.length || 0}</div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Monthly Chart */}
                        {monthlyChartData.length > 0 && (
                            <div className="mb-4">
                                <h6 className="fw-bold mb-3 d-flex align-items-center gap-2"><BarChart3 size={16} /> Koleksi Per Bulan</h6>
                                <div style={{ height: '250px' }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={monthlyChartData}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.1} />
                                            <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                                            <YAxis tick={{ fontSize: 10 }} tickFormatter={v => v >= 1000000 ? `${v / 1000000}jt` : v >= 1000 ? `${v / 1000}rb` : v} />
                                            <RechartsTooltip
                                                formatter={(value) => [formatRupiah(value), 'Total']}
                                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                                            />
                                            <Bar dataKey="total" radius={[6, 6, 0, 0]} fill="#3b82f6" barSize={30} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        )}

                        {/* Class Leaderboard */}
                        {globalSummary?.classes?.length > 0 && (
                            <div className="mb-4">
                                <h6 className="fw-bold mb-3 d-flex align-items-center gap-2"><Users size={16} /> Peringkat Kelas</h6>
                                <div className="row g-2">
                                    {globalSummary.classes.slice(0, 8).map((c, i) => (
                                        <div key={c.kelas_id} className="col-md-3 col-6">
                                            <div className="p-3 rounded-3 border bg-light d-flex align-items-center gap-2">
                                                <div className="rank-num">{i + 1}</div>
                                                <div>
                                                    <div className="fw-bold small">{c.kelas_nama}</div>
                                                    <div className="text-success fw-bold" style={{ fontSize: '0.75rem' }}>{formatRupiah(c.total)}</div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Transaction Log */}
                        <div>
                            <h6 className="fw-bold mb-3 d-flex align-items-center gap-2"><FileText size={16} /> Riwayat Transaksi Terbaru</h6>
                            <div className="table-responsive">
                                <table className="table table-sm table-hover align-middle">
                                    <thead>
                                        <tr className="text-muted small">
                                            <th>SISWA</th>
                                            <th>KELAS</th>
                                            <th>TGL INFAQ</th>
                                            <th>TGL BAYAR</th>
                                            <th>NOMINAL</th>
                                            <th>T.A</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {transactions.transactions?.map(tx => (
                                            <tr key={tx.id}>
                                                <td>
                                                    <div className="fw-bold small">{tx.siswa_nama}</div>
                                                    <div className="text-muted" style={{ fontSize: '0.65rem' }}>{tx.nis}</div>
                                                </td>
                                                <td className="small">{tx.kelas_nama || '-'}</td>
                                                <td className="small">{new Date(tx.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                                                <td className="small text-muted">{new Date(tx.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
                                                <td className="fw-bold text-success small">{formatRupiah(tx.nominal)}</td>
                                                <td className="small">{tx.tahun_ajaran || '-'}</td>
                                            </tr>
                                        ))}
                                        {(!transactions.transactions || transactions.transactions.length === 0) && (
                                            <tr><td colSpan="6" className="text-center py-4 text-muted fst-italic">Belum ada transaksi</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                            {transactions.pagination?.total_pages > 1 && (
                                <div className="d-flex justify-content-between align-items-center mt-3">
                                    <div className="text-muted small">
                                        Halaman {transactions.pagination.page} dari {transactions.pagination.total_pages} ({transactions.pagination.total} transaksi)
                                    </div>
                                    <div className="d-flex gap-2">
                                        <button className="btn btn-sm btn-light rounded-pill px-3" disabled={txPage <= 1} onClick={() => fetchTransactions(txPage - 1)}>
                                            <ChevronLeft size={14} />
                                        </button>
                                        <button className="btn btn-sm btn-light rounded-pill px-3" disabled={txPage >= transactions.pagination.total_pages} onClick={() => fetchTransactions(txPage + 1)}>
                                            <ChevronRight size={14} />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* History Modal */}
            {showHistory && selectedSiswa && (
                <HistoryModal
                    siswa={selectedSiswa}
                    onClose={() => setShowHistory(false)}
                    refreshParent={() => { fetchStatus(); fetchSummary() }}
                    addToast={addToast}
                    date={date}
                    settings={data.settings}
                />
            )}

            <style dangerouslySetInnerHTML={{
                __html: `
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
                .tracking-wider { letter-spacing: 1px; }
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
                .calendar-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 6px; }
                .calendar-day {
                    aspect-ratio: 1; border-radius: 10px; display: flex; flex-direction: column;
                    align-items: center; justify-content: center; font-size: 0.8rem;
                    position: relative; cursor: default; transition: all 0.15s;
                    border: 1px solid var(--border-color);
                }
                .calendar-day.is-today { border: 2px solid var(--primary-500); }
                .calendar-day.paid { background: #dcfce7; color: #166534; border-color: #bbf7d0; cursor: pointer; }
                .calendar-day.paid:hover { background: #bbf7d0; }
                .calendar-day.missed { background: #fee2e2; color: #991b1b; border-color: #fecaca; cursor: pointer; }
                .calendar-day.missed:hover { background: #fecaca; transform: scale(1.05); }
                .calendar-day.missed.selected { background: #3b82f6 !important; color: white !important; border-color: #2563eb !important; transform: scale(1.08); }
                .calendar-day.holiday { background: #f3f4f6; color: #9ca3af; opacity: 0.5; }
                .calendar-day.prepaid { background: #fef9c3; color: #854d0e; border-color: #fef08a; }
                .day-status-icon { margin-top: 2px; }
                .modal-overlay {
                    position: fixed; top: 0; left: 0; width: 100%; height: 100%;
                    background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center;
                    z-index: 1050; backdrop-filter: blur(4px);
                }
                .history-modal-content {
                    background: var(--bg-card); width: 95%; max-width: 700px; max-height: 95vh;
                    border-radius: 24px; overflow: hidden; display: flex; flex-direction: column;
                    box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25); border: 1px solid var(--border-color);
                }
                .batch-pay-bar {
                    position: sticky; bottom: 0; background: linear-gradient(135deg, #3b82f6, #2563eb);
                    color: white; padding: 16px 24px; display: flex; justify-content: space-between;
                    align-items: center; border-top: none; animation: slideUp 0.3s ease;
                }
                @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
                .paid-tooltip {
                    position: absolute; bottom: calc(100% + 8px); left: 50%; transform: translateX(-50%);
                    background: #1e293b; color: white; padding: 6px 12px; border-radius: 8px;
                    font-size: 0.65rem; white-space: nowrap; z-index: 10; pointer-events: none;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.2);
                }
                .paid-tooltip::after {
                    content: ''; position: absolute; top: 100%; left: 50%; transform: translateX(-50%);
                    border: 5px solid transparent; border-top-color: #1e293b;
                }
                @media (max-width: 768px) {
                    .infaq-page .d-flex.justify-content-between.align-items-center.mb-4 { flex-direction: column; align-items: flex-start; gap: 1rem; }
                    .infaq-page .d-flex.gap-3 { width: 100%; flex-wrap: wrap; }
                    .bento-card { padding: 1.5rem; border-radius: 20px; }
                    .search-box { width: 100%; margin-top: 1rem; }
                    .table-responsive thead { display: none; }
                    .table-responsive tr { display: block; padding: 1rem 0; border-bottom: 1px solid var(--border-color); }
                    .table-responsive tr td { display: block; width: 100% !important; padding: 0.5rem 0 !important; border: none; text-align: left !important; }
                    .calendar-grid { gap: 4px; }
                    .calendar-day { font-size: 0.7rem; }
                    .history-modal-content { width: 98%; }
                }
            `}} />
        </div>
    )
}

// ============================================================
// HISTORY MODAL — Batch Select, Tooltips, Quick Pay
// ============================================================

function HistoryModal({ siswa, onClose, refreshParent, addToast }) {
    const [viewDate, setViewDate] = useState(new Date())
    const [data, setData] = useState(null)
    const [editEnrollment, setEditEnrollment] = useState(false)
    const [newEnrollmentDate, setNewEnrollmentDate] = useState('')
    const [processing, setProcessing] = useState(false)
    const [selectedDates, setSelectedDates] = useState(new Set())
    const [hoveredPaidDay, setHoveredPaidDay] = useState(null)

    useEffect(() => { fetchHistory() }, [fetchHistory])

    const fetchHistory = useCallback(async () => {
        try {
            const res = await api.get(`/admin/infaq/history/${siswa.id}?year=${viewDate.getFullYear()}&month=${viewDate.getMonth()}`)
            setData(res.data)
            if (res.data.student?.tanggal_masuk) {
                setNewEnrollmentDate(res.data.student.tanggal_masuk.split('T')[0])
            }
            setSelectedDates(new Set()) // Clear selections on month change
        } catch (err) {
            addToast?.('danger', 'Gagal memuat riwayat')
        }
    }, [siswa.id, viewDate, addToast])

    const updateEnrollmentDate = async () => {
        if (!newEnrollmentDate) return
        setProcessing(true)
        try {
            await api.put(`/admin/infaq/siswa/${siswa.id}/enrollment`, { tanggal_masuk: newEnrollmentDate })
            addToast?.('success', 'Tanggal masuk diperbarui')
            setEditEnrollment(false)
            fetchHistory()
            refreshParent()
        } catch (err) {
            addToast?.('danger', 'Gagal memperbarui tanggal masuk')
        } finally {
            setProcessing(false)
        }
    }

    // Quick Pay for an entire academic year's arrears
    const handleQuickPay = async (ta) => {
        if (!ta.missed_dates || ta.missed_dates.length === 0) return
        const nominal = Number(data.settings?.nominal_default) || 2000
        const total = ta.missed_dates.length * nominal

        const result = await Swal.fire({
            title: `Bayar Tunggakan ${ta.tahun}`,
            html: `Lunasi <b>${ta.missed_dates.length} hari</b> tunggakan sekaligus.<br/>Total: <b>Rp ${total.toLocaleString('id-ID')}</b>`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Ya, Bayar Sekarang',
            cancelButtonText: 'Batal'
        })

        if (result.isConfirmed) {
            setProcessing(true)
            try {
                await api.post('/admin/infaq/pay', {
                    payments: [{
                        siswa_id: siswa.id,
                        nominal,
                        missed_dates: ta.missed_dates,
                        ta_id: ta.id
                    }],
                    user_id: 1
                })
                addToast?.('success', `Berhasil melunasi ${ta.missed_dates.length} hari tunggakan tahun ${ta.tahun}`)
                fetchHistory()
                refreshParent()
            } catch (err) {
                addToast?.('danger', 'Gagal memproses pembayaran')
            } finally {
                setProcessing(false)
            }
        }
    }

    // Toggle a missed day selection (batch select)
    const toggleDate = (dateStr) => {
        setSelectedDates(prev => {
            const next = new Set(prev)
            if (next.has(dateStr)) next.delete(dateStr)
            else next.add(dateStr)
            return next
        })
    }

    // Batch pay all selected dates
    const handleBatchPay = async () => {
        if (selectedDates.size === 0) return
        const nominal = Number(data.settings?.nominal_default) || 2000
        const total = selectedDates.size * nominal

        const result = await Swal.fire({
            title: `Bayar ${selectedDates.size} Hari Infaq`,
            html: `Total: <b>Rp ${total.toLocaleString('id-ID')}</b><br/><span class="text-muted small">(${nominal.toLocaleString('id-ID')} × ${selectedDates.size} hari)</span>`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Bayar Sekarang',
            cancelButtonText: 'Batal'
        })

        if (result.isConfirmed) {
            setProcessing(true)
            try {
                await api.post('/admin/infaq/pay', {
                    payments: [{
                        siswa_id: siswa.id,
                        nominal,
                        dates: Array.from(selectedDates)
                    }],
                    user_id: 1
                })
                addToast?.('success', `Berhasil membayar ${selectedDates.size} hari infaq`)
                setSelectedDates(new Set())
                fetchHistory()
                refreshParent()
            } catch (err) {
                addToast?.('danger', 'Gagal memproses pembayaran')
            } finally {
                setProcessing(false)
            }
        }
    }

    // Select all missed days in current month view
    const selectAllMissed = () => {
        const missedInMonth = days.filter(d => d && d.status === 'missed').map(d => d.date)
        setSelectedDates(new Set(missedInMonth))
    }

    const clearSelection = () => setSelectedDates(new Set())

    // Calendar calculation
    const month = viewDate.getMonth()
    const year = viewDate.getFullYear()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const firstDay = new Date(year, month, 1).getDay()
    const firstDayIndex = firstDay === 0 ? 6 : firstDay - 1

    const days = []
    for (let i = 0; i < firstDayIndex; i++) days.push(null)
    for (let d = 1; d <= daysInMonth; d++) {
        const dStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
        const dateObj = new Date(year, month, d)

        const payment = data?.history?.find(p => p.tanggal === dStr)
        const holiday = data?.holidays?.find(h => h.tanggal === dStr)
        const activeDays = data?.settings?.active_days || [1, 2, 3, 4, 5, 6]

        let status = 'none'
        const todayStr = new Date().toISOString().split('T')[0]
        const isFuture = dStr > todayStr

        if (holiday || !activeDays.includes(dateObj.getDay())) status = 'holiday'
        else if (payment && isFuture) status = 'prepaid'
        else if (payment) status = 'paid'
        else if (!isFuture) status = 'missed'

        days.push({
            day: d, date: dStr, status,
            holiday: holiday?.keterangan,
            isToday: dStr === todayStr,
            paidAt: payment?.created_at || null,
            nominal: payment?.nominal || null
        })
    }

    const missedCount = days.filter(d => d && d.status === 'missed').length
    const nominal = Number(data?.settings?.nominal_default) || 2000

    const nextMonth = () => setViewDate(new Date(year, month + 1, 1))
    const prevMonth = () => setViewDate(new Date(year, month - 1, 1))

    return (
        <div className="modal-overlay px-3" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="history-modal-content fade-in-up">
                {/* Header */}
                <div className="p-4 border-bottom d-flex justify-content-between align-items-center bg-light bg-opacity-50">
                    <div className="d-flex align-items-center gap-3">
                        <div className="avatar bg-primary text-white rounded-circle" style={{ width: 45, height: 45, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>
                            {siswa.nama.charAt(0)}
                        </div>
                        <div>
                            <div className="d-flex align-items-center gap-2">
                                <h5 className="fw-black m-0">Bayar Infaq: {siswa.nama}</h5>
                                <button className="btn btn-sm btn-light border-0 rounded-circle p-1" onClick={() => setEditEnrollment(!editEnrollment)} title="Edit Tanggal Masuk">
                                    <Edit3 size={14} className="text-muted" />
                                </button>
                            </div>
                            {editEnrollment ? (
                                <div className="d-flex align-items-center gap-2 mt-1">
                                    <input type="date" className="form-control form-control-sm py-0 h-auto" style={{ width: '130px', fontSize: '0.75rem' }} value={newEnrollmentDate} onChange={(e) => setNewEnrollmentDate(e.target.value)} />
                                    <button className="btn btn-xs btn-primary py-0 px-2" style={{ fontSize: '0.65rem', height: '24px' }} onClick={updateEnrollmentDate} disabled={processing}>Simpan</button>
                                </div>
                            ) : (
                                <p className="text-muted small m-0">
                                    {siswa.nis || 'Tanpa NIS'} • Masuk: {data?.student?.tanggal_masuk ? new Date(data.student.tanggal_masuk).toLocaleDateString('id-ID') : `Angkatan ${siswa.angkatan}`}
                                </p>
                            )}
                        </div>
                    </div>
                    <button className="btn btn-light btn-icon rounded-circle border" onClick={onClose}><X size={20} /></button>
                </div>

                {/* Arrears Cards (previous years) */}
                {data?.academicYears && data.academicYears.some(ta => !ta.isCurrent) && (
                    <div className="px-4 py-3 bg-success bg-opacity-10 border-bottom d-flex gap-3 overflow-auto no-scrollbar">
                        {data.academicYears.filter(ta => !ta.isCurrent).map(ta => (
                            <div key={ta.id} className={`d-flex align-items-center bg-white border rounded-pill px-3 py-1 shadow-sm flex-shrink-0 fw-bold small ${ta.isLunas ? 'text-success border-success-subtle' : 'text-danger border-danger-subtle'}`}>
                                {ta.isLunas ? (
                                    <><CheckCircle2 size={14} className="me-2" /> {ta.tahun} Lunas</>
                                ) : (
                                    <div className="d-flex align-items-center gap-2">
                                        <AlertCircle size={14} />
                                        <span>{ta.tahun}: {ta.missed_days} Hari</span>
                                        <button
                                            className="btn btn-danger btn-xs py-0 px-2 rounded-pill ms-1 fw-black"
                                            style={{ fontSize: '0.65rem' }}
                                            onClick={() => handleQuickPay(ta)}
                                            disabled={processing}
                                        >
                                            Lunasi
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {/* Calendar Body */}
                <div className="p-4 overflow-auto" style={{ flex: 1 }}>
                    {!data ? (
                        <div className="text-center py-5"><LoadingSpinner message="Memuat kalender..." /></div>
                    ) : (
                        <>
                            {/* Month Navigation */}
                            <div className="d-flex justify-content-between align-items-center mb-4">
                                <div className="d-flex align-items-center gap-3">
                                    <h6 className="fw-bold m-0 d-flex align-items-center gap-2">
                                        <Calendar size={18} />
                                        {new Date(year, month).toLocaleString('id-ID', { month: 'long', year: 'numeric' })}
                                    </h6>
                                    <select
                                        className="form-select form-select-sm rounded-pill border-0 bg-light px-3 fw-bold shadow-none"
                                        style={{ width: 'auto' }}
                                        value={`${year}-${month}`}
                                        onChange={(e) => { const [y, m] = e.target.value.split('-'); setViewDate(new Date(parseInt(y), parseInt(m), 1)) }}
                                    >
                                        {(() => {
                                            const activeTA = data.academicYears?.find(ta => ta.isCurrent)
                                            if (!activeTA) return <option value={`${year}-${month}`}>{new Date(year, month).toLocaleString('id-ID', { month: 'long' })}</option>
                                            const start = new Date(activeTA.tanggal_mulai)
                                            const end = new Date(activeTA.tanggal_selesai)
                                            const options = []
                                            let curr = new Date(start.getFullYear(), start.getMonth(), 1)
                                            while (curr <= end) {
                                                options.push(<option key={`${curr.getFullYear()}-${curr.getMonth()}`} value={`${curr.getFullYear()}-${curr.getMonth()}`}>{curr.toLocaleString('id-ID', { month: 'long', year: 'numeric' })}</option>)
                                                curr.setMonth(curr.getMonth() + 1)
                                            }
                                            return options
                                        })()}
                                    </select>
                                </div>
                                <div className="d-flex gap-2">
                                    <button className="btn btn-light btn-sm rounded-pill border px-3" onClick={prevMonth}><ChevronLeft size={16} /></button>
                                    <button className="btn btn-light btn-sm rounded-pill border px-3" onClick={nextMonth}><ChevronRight size={16} /></button>
                                </div>
                            </div>

                            {/* Batch Action Bar (above calendar) */}
                            {missedCount > 0 && (
                                <div className="d-flex align-items-center gap-2 mb-3">
                                    <button className="btn btn-outline-primary btn-sm rounded-pill px-3 fw-bold" onClick={selectAllMissed}>
                                        Pilih Semua ({missedCount})
                                    </button>
                                    {selectedDates.size > 0 && (
                                        <button className="btn btn-outline-secondary btn-sm rounded-pill px-3" onClick={clearSelection}>
                                            Batal Pilih
                                        </button>
                                    )}
                                    <div className="text-muted small ms-auto">
                                        <MapPin size={12} className="me-1" />
                                        Klik hari <b className="text-danger">merah</b> untuk memilih, lalu bayar sekaligus
                                    </div>
                                </div>
                            )}

                            {/* Calendar Grid */}
                            <div className="calendar-grid mb-3">
                                {['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'].map(d => (
                                    <div key={d} className="text-center text-muted small fw-bold mb-2">{d}</div>
                                ))}
                                {days.map((d, i) => (
                                    d ? (
                                        <div
                                            key={i}
                                            className={`calendar-day ${d.status} ${d.isToday ? 'is-today' : ''} ${selectedDates.has(d.date) ? 'selected' : ''}`}
                                            onClick={() => {
                                                if (d.status === 'missed') toggleDate(d.date)
                                                if (d.status === 'paid') setHoveredPaidDay(hoveredPaidDay === d.date ? null : d.date)
                                            }}
                                            onMouseEnter={() => d.status === 'paid' && setHoveredPaidDay(d.date)}
                                            onMouseLeave={() => d.status === 'paid' && setHoveredPaidDay(null)}
                                            title={d.holiday || (d.status === 'missed' ? 'Klik untuk memilih' : '')}
                                            style={{ position: 'relative' }}
                                        >
                                            <span className="small fw-bold">{d.day}</span>
                                            <div className="day-status-icon">
                                                {d.status === 'paid' && <CheckCircle2 size={11} />}
                                                {d.status === 'missed' && (selectedDates.has(d.date) ? <CheckCircle2 size={11} /> : <X size={11} />)}
                                                {d.status === 'prepaid' && <Clock size={11} />}
                                            </div>
                                            {/* Paid date tooltip */}
                                            {d.status === 'paid' && hoveredPaidDay === d.date && d.paidAt && (
                                                <div className="paid-tooltip">
                                                    Dibayar: {new Date(d.paidAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                    {' '}{new Date(d.paidAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                            )}
                                        </div>
                                    ) : <div key={i}></div>
                                ))}
                            </div>

                            {/* Legend */}
                            <div className="legend row g-2 p-3 glass rounded-4 border">
                                <div className="col-3 d-flex align-items-center gap-2 small">
                                    <div className="rounded-circle bg-success" style={{ width: 8, height: 8 }}></div> Lunas
                                </div>
                                <div className="col-3 d-flex align-items-center gap-2 small">
                                    <div className="rounded-circle bg-danger" style={{ width: 8, height: 8 }}></div> Belum
                                </div>
                                <div className="col-3 d-flex align-items-center gap-2 small">
                                    <div className="rounded-circle bg-warning" style={{ width: 8, height: 8 }}></div> Prabayar
                                </div>
                                <div className="col-3 d-flex align-items-center gap-2 small">
                                    <div className="rounded-circle" style={{ width: 8, height: 8, background: '#3b82f6' }}></div> Dipilih
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* Batch Pay Footer */}
                {selectedDates.size > 0 ? (
                    <div className="batch-pay-bar">
                        <div>
                            <div className="fw-bold">{selectedDates.size} hari dipilih</div>
                            <div className="small opacity-75">Total: Rp {(selectedDates.size * nominal).toLocaleString('id-ID')}</div>
                        </div>
                        <button className="btn btn-light fw-black rounded-pill px-4 shadow" onClick={handleBatchPay} disabled={processing}>
                            {processing ? 'Memproses...' : `Bayar Rp ${(selectedDates.size * nominal).toLocaleString('id-ID')}`}
                        </button>
                    </div>
                ) : (
                    <div className="p-3 px-4 bg-light border-top d-flex justify-content-between align-items-center">
                        <div className="small text-muted">
                            <MapPin size={12} className="me-1" />
                            Hover hari <b className="text-success">hijau</b> untuk lihat tanggal bayar
                        </div>
                        <button className="btn btn-dark rounded-pill px-4 fw-bold btn-sm" onClick={onClose}>Tutup</button>
                    </div>
                )}
            </div>
        </div>
    )
}
