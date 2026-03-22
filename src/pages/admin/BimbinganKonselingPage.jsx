import { useState, useEffect } from 'react'
import { API_BASE } from '../../services/api'
import LoadingSpinner from '../../components/LoadingSpinner'
import { Star, AlertTriangle, Search, Award, PlusCircle, Trash2, Calendar, User, X, ShieldAlert, Trophy, TrendingUp } from 'lucide-react'

export default function BimbinganKonselingPage() {
    const [catatan, setCatatan] = useState([])
    const [kategoriList, setKategoriList] = useState([])
    const [siswaList, setSiswaList] = useState([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [showModal, setShowModal] = useState(false)
    const [formData, setFormData] = useState({ siswa_id: '', bk_kategori_id: '', tanggal: new Date().toISOString().split('T')[0], keterangan: '' })
    const [submitLoading, setSubmitLoading] = useState(false)

    const fetchData = async () => {
        setLoading(true)
        try {
            const token = localStorage.getItem('token')
            const headers = { 'Authorization': `Bearer ${token}` }
            const [catRes, katRes, swRes] = await Promise.all([
                fetch(`${API_BASE}/admin/bk`, { headers }),
                fetch(`${API_BASE}/admin/bk/kategori`, { headers }),
                fetch(`${API_BASE}/siswa`, { headers })
            ])

            if (catRes.ok) setCatatan(await catRes.json())
            if (katRes.ok) setKategoriList(await katRes.json())
            if (swRes.ok) setSiswaList(await swRes.json())
        } catch (err) {
            console.error(err)
            alert('Gagal mengambil data BK')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchData()
    }, [])

    const filtered = catatan.filter(c =>
        c.siswa_nama?.toLowerCase().includes(search.toLowerCase()) ||
        c.nisn?.includes(search) ||
        c.kategori_nama?.toLowerCase().includes(search.toLowerCase())
    )

    // Calculate Stats
    const totalPelanggaran = catatan.filter(c => c.tipe === 'pelanggaran').length
    const totalPrestasi = catatan.filter(c => c.tipe === 'prestasi').length
    const totalPoinNet = catatan.reduce((acc, curr) => {
        return curr.tipe === 'prestasi' ? acc + curr.poin : acc - curr.poin
    }, 0)

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!formData.siswa_id || !formData.bk_kategori_id) return alert('Lengkapi data wajib')
        setSubmitLoading(true)
        try {
            const token = localStorage.getItem('token')
            const res = await fetch(`${API_BASE}/admin/bk`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(formData)
            })
            if (!res.ok) throw new Error('Gagal menyimpan catatan')
            alert('Catatan berhasil ditambahkan')
            setShowModal(false)
            setFormData({ siswa_id: '', bk_kategori_id: '', tanggal: new Date().toISOString().split('T')[0], keterangan: '' })
            fetchData()
        } catch (err) { alert(err.message) } finally { setSubmitLoading(false) }
    }

    const handleDelete = async (id) => {
        if (!window.confirm('Hapus catatan ini?')) return
        try {
            const token = localStorage.getItem('token')
            await fetch(`${API_BASE}/admin/bk/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } })
            fetchData()
        } catch (err) { alert(err.message) }
    }

    return (
        <div className="admin-page animate-fadeIn">
            <div className="page-header mb-4">
                <div>
                    <h2 className="d-flex align-items-center gap-2">
                        <div className="p-2 bg-warning bg-opacity-10 rounded-lg text-warning">
                            <Star size={28} />
                        </div>
                        Bimbingan & Konseling
                    </h2>
                    <p className="text-secondary">Monitoring kedisiplinan dan pencapaian prestasi siswa</p>
                </div>
                <button className="btn btn-primary btn-lg" onClick={() => setShowModal(true)}>
                    <PlusCircle size={20} /> Tambah Catatan
                </button>
            </div>

            {/* BK Stats */}
            <div className="stats-grid mb-4">
                <div className="stat-card red-accent">
                    <div className="stat-icon red"><ShieldAlert size={24} /></div>
                    <div className="stat-info">
                        <h4>Total Pelanggaran</h4>
                        <div className="value">{totalPelanggaran}</div>
                        <div className="change down">Perlu Perhatian</div>
                    </div>
                </div>
                <div className="stat-card green-accent">
                    <div className="stat-icon green"><Award size={24} /></div>
                    <div className="stat-info">
                        <h4>Total Prestasi</h4>
                        <div className="value">{totalPrestasi}</div>
                        <div className="change up">Kebanggaan Sekolah</div>
                    </div>
                </div>
                <div className="stat-card blue-accent">
                    <div className="stat-icon blue"><TrendingUp size={24} /></div>
                    <div className="stat-info">
                        <h4>Poin Net Akumulasi</h4>
                        <div className="value">{totalPoinNet > 0 ? '+' : ''}{totalPoinNet}</div>
                    </div>
                </div>
            </div>

            <div className="card shadow-sm border-0">
                <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
                    <div style={{ position: 'relative', minWidth: '300px' }}>
                        <Search size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
                        <input
                            type="text"
                            placeholder="Cari nama siswa atau kategori..."
                            className="form-control"
                            style={{ paddingLeft: '42px', height: '44px', borderRadius: '12px' }}
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>
                </div>

                {loading ? <LoadingSpinner fullScreen={false} /> : (
                    <div className="table-container border-0">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Tanggal</th>
                                    <th>Siswa</th>
                                    <th>Klasifikasi</th>
                                    <th className="text-center">Poin</th>
                                    <th>Keterangan</th>
                                    <th className="text-end">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.length === 0 ? (
                                    <tr><td colSpan="6" className="text-center py-5 text-muted">Belum ada catatan bimbingan konseling</td></tr>
                                ) : filtered.map(c => (
                                    <tr key={c.id}>
                                        <td style={{ whiteSpace: 'nowrap' }}>
                                            <div className="d-flex align-items-center gap-2">
                                                <Calendar size={14} className="text-muted" />
                                                {new Date(c.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                                            </div>
                                        </td>
                                        <td>
                                            <div className="fw-bold text-dark">{c.siswa_nama}</div>
                                            <div className="text-muted small">{c.nisn} • {c.kelas_nama}</div>
                                        </td>
                                        <td>
                                            {c.tipe === 'prestasi' ? (
                                                <span className="badge badge-success"><Award size={12} /> {c.kategori_nama}</span>
                                            ) : (
                                                <span className="badge badge-danger"><ShieldAlert size={12} /> {c.kategori_nama}</span>
                                            )}
                                        </td>
                                        <td className="text-center">
                                            <strong className={c.tipe === 'prestasi' ? 'text-success' : 'text-danger'}>
                                                {c.tipe === 'prestasi' ? '+' : '-'}{c.poin}
                                            </strong>
                                        </td>
                                        <td style={{ maxWidth: '250px' }} className="text-truncate">
                                            {c.keterangan || '-'}
                                        </td>
                                        <td className="text-end">
                                            <button className="btn-icon btn-delete" onClick={() => handleDelete(c.id)}>
                                                <Trash2 size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Modal Tambah Catatan */}
            {showModal && (
                <div className="modal-backdrop">
                    <div className="modal modal-lg">
                        <div className="modal-header">
                            <h3><PlusCircle size={20} className="me-2 text-primary" /> Input Catatan BK Baru</h3>
                            <button className="btn-icon" onClick={() => setShowModal(false)}><X size={20} /></button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="modal-body">
                                <div className="row g-4">
                                    <div className="col-md-6">
                                        <div className="form-group">
                                            <label>Nama Siswa</label>
                                            <select className="form-control" value={formData.siswa_id} onChange={e => setFormData({ ...formData, siswa_id: e.target.value })} required>
                                                <option value="">-- Cari Nama Siswa --</option>
                                                {siswaList.map(s => <option key={s.id} value={s.id}>{s.nama} ({s.kelas_nama || 'NON-KLAS'})</option>)}
                                            </select>
                                        </div>
                                    </div>
                                    <div className="col-md-6">
                                        <div className="form-group">
                                            <label>Kategori Pelanggaran/Prestasi</label>
                                            <select className="form-control" value={formData.bk_kategori_id} onChange={e => setFormData({ ...formData, bk_kategori_id: e.target.value })} required>
                                                <option value="">-- Pilih Kategori --</option>
                                                {kategoriList.map(k => (
                                                    <option key={k.id} value={k.id}>
                                                        [{k.tipe.toUpperCase()}] {k.nama} ({k.poin} Poin)
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                    <div className="col-md-12">
                                        <div className="form-group">
                                            <label>Tanggal Kejadian</label>
                                            <input type="date" className="form-control" value={formData.tanggal} onChange={e => setFormData({ ...formData, tanggal: e.target.value })} required />
                                        </div>
                                    </div>
                                    <div className="col-md-12">
                                        <div className="form-group">
                                            <label>Detail Keterangan / Kronologi</label>
                                            <textarea className="form-control" rows="4" value={formData.keterangan} onChange={e => setFormData({ ...formData, keterangan: e.target.value })} placeholder="Tuliskan detail kejadian di sini..." />
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Batal</button>
                                <button type="submit" className="btn btn-primary" disabled={submitLoading} style={{ minWidth: '150px' }}>
                                    {submitLoading ? 'Menyimpan...' : 'Simpan Catatan'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
