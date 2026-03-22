import { useState, useEffect } from 'react'
import { API_BASE, getAuthHeaders } from '../../services/api'
import LoadingSpinner from '../../components/LoadingSpinner'
import { PlusCircle, Search, PiggyBank, ArrowDownCircle, ArrowUpCircle, Wallet, TrendingUp, TrendingDown, X, BarChart as BarChartIcon } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'

// Custom style for hover effects
const styles = /*css*/`
  .interactive-card {
    transition: transform 0.3s ease, box-shadow 0.3s ease;
    cursor: pointer;
  }
  .interactive-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 10px 20px rgba(0,0,0,0.1) !important;
  }
  .chart-container-card {
    transition: box-shadow 0.3s ease;
  }
  .chart-container-card:hover {
    box-shadow: 0 8px 16px rgba(0,0,0,0.08) !important;
  }
`;

export default function TabunganPage() {
    const [summary, setSummary] = useState([])
    const [siswaList, setSiswaList] = useState([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [showModal, setShowModal] = useState(false)
    const [formData, setFormData] = useState({ siswa_id: '', tipe: 'setor', nominal: '', note: '' })
    const [submitLoading, setSubmitLoading] = useState(false)

    const fetchData = async (signal) => {
        setLoading(true)
        try {
            const headers = getAuthHeaders()
            const [sumRes, siswaRes] = await Promise.all([
                fetch(`${API_BASE}/admin/tabungan/summary`, { headers, signal }),
                fetch(`${API_BASE}/siswa`, { headers, signal })
            ])

            if (sumRes.ok) setSummary(await sumRes.json())
            if (siswaRes.ok) setSiswaList(await siswaRes.json())
        } catch (err) {
            if (err.name !== 'AbortError') {
                console.error(err)
            }
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        const controller = new AbortController()
        fetchData(controller.signal)
        return () => controller.abort()
    }, [])

    const formatRupiah = (n) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n || 0)

    const filtered = summary.filter(s =>
        s.siswa_nama?.toLowerCase().includes(search.toLowerCase()) ||
        s.nisn?.includes(search)
    )

    // Calculate overall stats
    const totalSaldo = summary.reduce((acc, curr) => acc + Number(curr.saldo), 0)
    const totalSetor = summary.reduce((acc, curr) => acc + Number(curr.total_setor), 0)
    const totalTarik = summary.reduce((acc, curr) => acc + Number(curr.total_tarik), 0)

    // Chart Data: Top 5 Highest Balances
    const chartData = [...summary]
        .sort((a, b) => b.saldo - a.saldo)
        .slice(0, 5)
        .map(s => ({
            name: (s.siswa_nama || 'Siswa').split(' ')[0],
            Saldo: Number(s.saldo || 0)
        }));

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!formData.siswa_id || !formData.nominal) return alert('Pilih siswa dan masukkan nominal')
        setSubmitLoading(true)
        try {
            const payload = { ...formData, nominal: Number(formData.nominal) }
            const res = await fetch(`${API_BASE}/admin/tabungan`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify(payload)
            })
            if (!res.ok) throw new Error('Gagal simpan transaksi')
            alert('Transaksi berhasil disimpan')
            setShowModal(false)
            setFormData({ siswa_id: '', tipe: 'setor', nominal: '', note: '' })
            fetchData()
        } catch (err) {
            alert(err.message)
        } finally {
            setSubmitLoading(false)
        }
    }

    return (
        <div className="admin-page animate-fadeIn">
            <style dangerouslySetInnerHTML={{ __html: styles }} />
            <div className="page-header mb-4">
                <div>
                    <h2 className="d-flex align-items-center gap-2">
                        <div className="p-2 bg-primary bg-opacity-10 rounded-lg text-primary">
                            <PiggyBank size={28} />
                        </div>
                        Kasir Tabungan Bank Mini
                    </h2>
                    <p className="text-secondary">Pusat pengelolaan setoran dan penarikan tabungan siswa</p>
                </div>
                <button className="btn btn-primary btn-lg" onClick={() => setShowModal(true)}>
                    <PlusCircle size={20} /> Transaksi Baru
                </button>
            </div>

            {/* Stats Overview */}
            <div className="row g-4 mb-4">
                <div className="col-md-8">
                    <SummaryCards
                        totalSaldo={totalSaldo}
                        totalSetor={totalSetor}
                        totalTarik={totalTarik}
                    />
                </div>
                <div className="col-md-4">
                    <TopSaldoChart chartData={chartData} formatRupiah={formatRupiah} />
                </div>
            </div>

            {/* Search & Table */}
            <div className="card shadow-sm mb-4 border-0">
                <div className="card-body p-4">
                    <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
                        <div style={{ position: 'relative', width: '100%', maxWidth: '400px' }}>
                            <Search size={18} style={{ position: 'absolute', left: '16px', top: '14px', color: 'var(--text-muted)' }} />
                            <input
                                type="text"
                                placeholder="Cari nama atau NISN siswa..."
                                className="form-control bg-light border-0"
                                style={{ paddingLeft: '48px', height: '48px', borderRadius: '12px' }}
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                            />
                        </div>
                    </div>

                    {loading ? <LoadingSpinner fullScreen={false} /> : (
                        <div className="table-container border-0 mt-2">
                            <table className="table table-hover align-middle mb-0">
                                <thead>
                                    <tr>
                                        <th>Identitas Siswa</th>
                                        <th>Kelas</th>
                                        <th className="text-center">Total Setoran</th>
                                        <th className="text-center">Total Penarikan</th>
                                        <th className="text-end">Saldo Akhir</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filtered.length === 0 ? (
                                        <tr><td colSpan="5" className="text-center py-5 text-muted">Data nasabah tidak ditemukan</td></tr>
                                    ) : filtered.map(s => (
                                        <tr key={s.siswa_id}>
                                            <td>
                                                <div className="fw-bold text-dark">{s.siswa_nama}</div>
                                                <div className="text-muted small">NISN: {s.nisn}</div>
                                            </td>
                                            <td>
                                                <span className="badge bg-light text-dark border">{s.kelas_nama || 'NON-KELAS'}</span>
                                            </td>
                                            <td className="text-center text-success fw-medium">{formatRupiah(s.total_setor)}</td>
                                            <td className="text-center text-danger fw-medium">{formatRupiah(s.total_tarik)}</td>
                                            <td className="text-end">
                                                <div className="fw-bold text-primary" style={{ fontSize: '1.05rem' }}>{formatRupiah(s.saldo)}</div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal Input Transaksi */}
            {showModal && (
                <div className="modal-backdrop">
                    <div className="modal modal-lg">
                        <div className="modal-header">
                            <h3><PiggyBank size={20} className="me-2" /> Input Transaksi Buku Tabungan</h3>
                            <button className="btn-icon" onClick={() => setShowModal(false)}><X size={20} /></button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="modal-body">
                                <div className="row g-3">
                                    <div className="col-md-12">
                                        <label className="form-label d-block mb-2">Tipe Transaksi</label>
                                        <div className="d-flex gap-4 p-3 bg-light rounded-lg">
                                            <label className="d-flex align-items-center gap-2 m-0" style={{ cursor: 'pointer' }}>
                                                <input type="radio" name="tipe" checked={formData.tipe === 'setor'} onChange={() => setFormData({ ...formData, tipe: 'setor' })} className="form-check-input" />
                                                <span className="badge badge-success"><ArrowUpCircle size={14} /> Setoran Masuk</span>
                                            </label>
                                            <label className="d-flex align-items-center gap-2 m-0" style={{ cursor: 'pointer' }}>
                                                <input type="radio" name="tipe" checked={formData.tipe === 'tarik'} onChange={() => setFormData({ ...formData, tipe: 'tarik' })} className="form-check-input" />
                                                <span className="badge badge-danger"><ArrowDownCircle size={14} /> Penarikan Tunai</span>
                                            </label>
                                        </div>
                                    </div>

                                    <div className="col-md-12 mt-3">
                                        <div className="form-group">
                                            <label>Nama Siswa (Nasabah)</label>
                                            <select className="form-control" value={formData.siswa_id} onChange={e => setFormData({ ...formData, siswa_id: e.target.value })} required>
                                                <option value="">-- Cari & Pilih Siswa --</option>
                                                {siswaList.map(s => (
                                                    <option key={s.id} value={s.id}>{s.nama} ({s.kelas_nama || 'Umum'}) - {s.nisn}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="col-md-12">
                                        <div className="form-group">
                                            <label>Nominal Transaksi (Rp)</label>
                                            <div className="position-relative">
                                                <span className="position-absolute start-0 top-50 translate-middle-y ps-3 fw-bold text-muted">Rp</span>
                                                <input type="number" min="1000" className="form-control ps-5" value={formData.nominal} onChange={e => setFormData({ ...formData, nominal: e.target.value })} required placeholder="Misal: 50000" />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="col-md-12">
                                        <div className="form-group">
                                            <label>Berita Acara / Catatan (Opsional)</label>
                                            <textarea className="form-control" rows="2" value={formData.note} onChange={e => setFormData({ ...formData, note: e.target.value })} placeholder="Keterangan transaksi..." />
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Batal</button>
                                <button type="submit" className="btn btn-primary" disabled={submitLoading} style={{ minWidth: '160px' }}>
                                    {submitLoading ? 'Memproses...' : (<><PlusCircle size={18} /> Simpan Transaksi</>)}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}

/**
 * Component-based Summary/KPI Cards
 */
function SummaryCards({ totalSaldo, totalSetor, totalTarik }) {
    return (
        <div className="row g-3">
            <div className="col-12 col-md-4">
                <div className="card shadow-sm border-0 bg-primary bg-opacity-10 h-100 interactive-card">
                    <div className="card-body position-relative overflow-hidden">
                        <div className="position-absolute end-0 top-0 opacity-10 p-3" style={{ transform: 'scale(2) translate(10%, -10%)' }}>
                            <Wallet size={100} className="text-primary" />
                        </div>
                        <div className="d-flex align-items-center mb-3">
                            <div className="p-2 bg-primary bg-gradient rounded-circle text-white shadow-sm me-3"><Wallet size={20} /></div>
                            <h6 className="mb-0 fw-bold text-primary">Total Dana</h6>
                        </div>
                        <h3 className="fw-bold text-dark mb-1">Rp {totalSaldo.toLocaleString('id-ID')}</h3>
                        <p className="text-muted small mb-0"><TrendingUp size={14} className="text-success me-1" /> Dana Aktif</p>
                    </div>
                </div>
            </div>
            <div className="col-12 col-md-4">
                <div className="card shadow-sm border-0 bg-success bg-opacity-10 h-100 interactive-card">
                    <div className="card-body position-relative overflow-hidden">
                        <div className="position-absolute end-0 top-0 opacity-10 p-3" style={{ transform: 'scale(2) translate(10%, -10%)' }}>
                            <ArrowUpCircle size={100} className="text-success" />
                        </div>
                        <div className="d-flex align-items-center mb-3">
                            <div className="p-2 bg-success bg-gradient rounded-circle text-white shadow-sm me-3"><ArrowUpCircle size={20} /></div>
                            <h6 className="mb-0 fw-bold text-success">Total Setoran</h6>
                        </div>
                        <h3 className="fw-bold text-dark mb-1">Rp {totalSetor.toLocaleString('id-ID')}</h3>
                        <p className="text-muted small mb-0"><TrendingUp size={14} className="text-success me-1" /> Akumulasi</p>
                    </div>
                </div>
            </div>
            <div className="col-12 col-md-4">
                <div className="card shadow-sm border-0 bg-danger bg-opacity-10 h-100 interactive-card">
                    <div className="card-body position-relative overflow-hidden">
                        <div className="position-absolute end-0 top-0 opacity-10 p-3" style={{ transform: 'scale(2) translate(10%, -10%)' }}>
                            <ArrowDownCircle size={100} className="text-danger" />
                        </div>
                        <div className="d-flex align-items-center mb-3">
                            <div className="p-2 bg-danger bg-gradient rounded-circle text-white shadow-sm me-3"><ArrowDownCircle size={20} /></div>
                            <h6 className="mb-0 fw-bold text-danger">Total Penarikan</h6>
                        </div>
                        <h3 className="fw-bold text-dark mb-1">Rp {totalTarik.toLocaleString('id-ID')}</h3>
                        <p className="text-muted small mb-0"><TrendingDown size={14} className="text-danger me-1" /> Dana Keluar</p>
                    </div>
                </div>
            </div>
        </div>
    )
}

/**
 * Component-based Top Saldo Analytics Chart
 */
function TopSaldoChart({ chartData, formatRupiah }) {
    return (
        <div className="card shadow-sm border-0 h-100 chart-container-card">
            <div className="card-body p-4 d-flex flex-column justify-content-center">
                <div className="d-flex justify-content-between align-items-center mb-3">
                    <h6 className="mb-0 text-dark fw-bold d-flex align-items-center">
                        <BarChartIcon size={18} className="me-2 text-primary" /> Top 5 Saldo Nasabah
                    </h6>
                </div>
                {chartData.length === 0 ? (
                    <p className="text-muted small text-center my-auto py-5 d-flex flex-column align-items-center">
                        <BarChartIcon size={32} className="opacity-25 mb-2" />
                        Belum ada data transaksi
                    </p>
                ) : (
                    <div style={{ width: '100%', height: 160 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.15} />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={11} dy={5} tick={{ fill: '#6c757d', fontWeight: 500 }} />
                                <YAxis axisLine={false} tickLine={false} fontSize={10} tickFormatter={(value) => `Rp${value / 1000}k`} tick={{ fill: '#adb5bd' }} />
                                <Tooltip
                                    formatter={(value) => formatRupiah(value)}
                                    cursor={{ fill: 'rgba(59, 130, 246, 0.05)' }}
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                />
                                <Bar dataKey="Saldo" radius={[6, 6, 0, 0]} maxBarSize={36}>
                                    {chartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={index === 0 ? '#3b82f6' : '#93c5fd'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                )}
            </div>
        </div>
    )
}
