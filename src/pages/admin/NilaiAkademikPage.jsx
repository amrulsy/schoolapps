import { useState, useEffect } from 'react'
import { API_BASE } from '../../services/api'
import LoadingSpinner from '../../components/LoadingSpinner'
import { BookOpen, Search, Filter, PlusCircle, CheckCircle, GraduationCap, TrendingUp, ListChecks, X, Calendar, Book } from 'lucide-react'

export default function NilaiAkademikPage() {
    const [nilaiList, setNilaiList] = useState([])
    const [siswaList, setSiswaList] = useState([])
    const [mapelList, setMapelList] = useState([])
    const [tahunList, setTahunList] = useState([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')

    const [filterTahun, setFilterTahun] = useState('')
    const [filterSemester, setFilterSemester] = useState('Ganjil')

    const [showModal, setShowModal] = useState(false)
    const [formData, setFormData] = useState({ siswa_id: '', mapel_id: '', tahun_ajaran_id: '', semester: 'Ganjil', tugas: 0, uts: 0, uas: 0 })
    const [submitLoading, setSubmitLoading] = useState(false)

    const fetchData = async () => {
        setLoading(true)
        try {
            const token = localStorage.getItem('token')
            const headers = { 'Authorization': `Bearer ${token}` }
            const [nilaiRes, swRes, mapelRes, thnRes] = await Promise.all([
                fetch(`${API_BASE}/admin/akademik/nilai?tahun_ajaran_id=${filterTahun}&semester=${filterSemester}`, { headers }),
                fetch(`${API_BASE}/siswa`, { headers }),
                fetch(`${API_BASE}/admin/akademik/mapel`, { headers }),
                fetch(`${API_BASE}/tahun-ajaran`, { headers })
            ])

            if (nilaiRes.ok) setNilaiList(await nilaiRes.json())
            if (swRes.ok) setSiswaList(await swRes.json())
            if (mapelRes.ok) setMapelList(await mapelRes.json())

            if (thnRes.ok) {
                const thn = await thnRes.json()
                setTahunList(thn)
                if (!filterTahun && thn.length > 0) {
                    const active = thn.find(t => t.status === 'aktif')
                    setFilterTahun(active ? active.id : thn[0].id)
                }
            }
        } catch (err) {
            console.error(err)
            alert('Gagal mengambil data Akademik')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchData()
    }, [filterTahun, filterSemester])

    const filtered = nilaiList.filter(n =>
        n.siswa_nama?.toLowerCase().includes(search.toLowerCase()) ||
        n.nisn?.includes(search) ||
        n.mapel_nama?.toLowerCase().includes(search.toLowerCase())
    )

    // Calculate Academic Stats
    const totalEntri = filtered.length
    const avgNilai = filtered.length > 0
        ? (filtered.reduce((acc, curr) => acc + Number(curr.akhir), 0) / filtered.length).toFixed(1)
        : 0
    const jmlMapel = new Set(filtered.map(f => f.mapel_id)).size

    const getNilaiColor = (score) => {
        if (score >= 85) return 'text-success'
        if (score >= 75) return 'text-primary'
        if (score >= 60) return 'text-warning'
        return 'text-danger'
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!formData.siswa_id || !formData.mapel_id || !formData.tahun_ajaran_id) return alert('Lengkapi data wajib form!')
        setSubmitLoading(true)
        try {
            const token = localStorage.getItem('token')
            const res = await fetch(`${API_BASE}/admin/akademik/nilai`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(formData)
            })
            if (!res.ok) throw new Error('Gagal menyimpan nilai')
            alert('Nilai berhasil disimpan!')
            setShowModal(false)
            fetchData()
        } catch (err) { alert(err.message) } finally { setSubmitLoading(false) }
    }

    const getGrade = (score) => {
        if (score >= 90) return 'A'
        if (score >= 80) return 'B'
        if (score >= 70) return 'C'
        if (score >= 60) return 'D'
        return 'E'
    }

    return (
        <div className="admin-page animate-fadeIn">
            <div className="page-header mb-4">
                <div>
                    <h2 className="d-flex align-items-center gap-2">
                        <div className="p-2 bg-success bg-opacity-10 rounded-lg text-success">
                            <GraduationCap size={28} />
                        </div>
                        Akademik & Penilaian
                    </h2>
                    <p className="text-secondary">Pusat monitoring dan input nilai raport siswa</p>
                </div>
                <button className="btn btn-primary btn-lg" onClick={() => setShowModal(true)}>
                    <PlusCircle size={20} /> Input Nilai Baru
                </button>
            </div>

            {/* Academic Stats */}
            <div className="stats-grid mb-4">
                <div className="stat-card blue-accent">
                    <div className="stat-icon blue"><TrendingUp size={24} /></div>
                    <div className="stat-info">
                        <h4>Rata-rata Nilai</h4>
                        <div className="value">{avgNilai}</div>
                        <div className="change up">Berdasarkan Filter</div>
                    </div>
                </div>
                <div className="stat-card teal-accent">
                    <div className="stat-icon teal"><ListChecks size={24} /></div>
                    <div className="stat-info">
                        <h4>Total Entri Nilai</h4>
                        <div className="value">{totalEntri}</div>
                    </div>
                </div>
                <div className="stat-card green-accent">
                    <div className="stat-icon green"><Book size={24} /></div>
                    <div className="stat-info">
                        <h4>Mata Pelajaran</h4>
                        <div className="value">{jmlMapel}</div>
                    </div>
                </div>
            </div>

            {/* Filter Section */}
            <div className="card shadow-sm border-0 mb-4 p-4">
                <div className="d-flex align-items-center gap-2 mb-3 text-primary fw-bold">
                    <Filter size={18} /> Filter Akademik
                </div>
                <div className="row g-3">
                    <div className="col-md-4">
                        <div style={{ position: 'relative' }}>
                            <Search size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
                            <input
                                type="text"
                                placeholder="Cari siswa atau mata pelajaran..."
                                className="form-control"
                                style={{ paddingLeft: '42px', height: '44px', borderRadius: '12px' }}
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="col-md-4">
                        <select className="form-control" style={{ height: '44px', borderRadius: '12px' }} value={filterTahun} onChange={e => setFilterTahun(e.target.value)}>
                            <option value="">Semua Tahun Ajaran</option>
                            {tahunList.map(t => <option key={t.id} value={t.id}>{t.tahun}</option>)}
                        </select>
                    </div>
                    <div className="col-md-4">
                        <select className="form-control" style={{ height: '44px', borderRadius: '12px' }} value={filterSemester} onChange={e => setFilterSemester(e.target.value)}>
                            <option value="Ganjil">Semester Ganjil</option>
                            <option value="Genap">Semester Genap</option>
                        </select>
                    </div>
                </div>
            </div>

            <div className="card shadow-sm border-0">
                {loading ? <LoadingSpinner fullScreen={false} /> : (
                    <div className="table-container border-0">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Mata Pelajaran</th>
                                    <th>Identitas Siswa</th>
                                    <th>Kelas</th>
                                    <th className="text-center">Tugas</th>
                                    <th className="text-center">UTS</th>
                                    <th className="text-center">UAS</th>
                                    <th className="text-end">Nilai Akhir</th>
                                    <th className="text-center">Grade</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.length === 0 ? (
                                    <tr><td colSpan="8" className="text-center py-5 text-muted">Belum ada data nilai akademik</td></tr>
                                ) : filtered.map(n => (
                                    <tr key={n.id}>
                                        <td>
                                            <div className="fw-bold text-primary">{n.mapel_nama}</div>
                                        </td>
                                        <td>
                                            <div className="fw-bold text-dark">{n.siswa_nama}</div>
                                            <div className="text-muted small">{n.nisn}</div>
                                        </td>
                                        <td>
                                            <span className="badge badge-secondary">{n.kelas_nama || 'NON-KELAS'}</span>
                                        </td>
                                        <td className="text-center">{Number(n.tugas).toFixed(0)}</td>
                                        <td className="text-center">{Number(n.uts).toFixed(0)}</td>
                                        <td className="text-center">{Number(n.uas).toFixed(0)}</td>
                                        <td className="text-end">
                                            <div className={`fw-bold ${getNilaiColor(n.akhir)}`} style={{ fontSize: '1.1rem' }}>
                                                {Number(n.akhir).toFixed(1)}
                                            </div>
                                        </td>
                                        <td className="text-center">
                                            <span className={`badge badge-${n.akhir >= 80 ? 'success' : n.akhir >= 70 ? 'info' : n.akhir >= 60 ? 'warning' : 'danger'}`}>
                                                {getGrade(n.akhir)}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Modal Input Nilai */}
            {showModal && (
                <div className="modal-backdrop">
                    <div className="modal modal-lg">
                        <div className="modal-header">
                            <h3><PlusCircle size={20} className="me-2 text-primary" /> Input Nilai Akademik Siswa</h3>
                            <button className="btn-icon" onClick={() => setShowModal(false)}><X size={20} /></button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="modal-body">
                                <div className="row g-4">
                                    <div className="col-md-6">
                                        <div className="form-group">
                                            <label>Tahun Ajaran</label>
                                            <select className="form-control" value={formData.tahun_ajaran_id} onChange={e => setFormData({ ...formData, tahun_ajaran_id: e.target.value })} required>
                                                <option value="">-- Pilih Tahun Ajaran --</option>
                                                {tahunList.map(t => <option key={t.id} value={t.id}>{t.tahun}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                    <div className="col-md-6">
                                        <div className="form-group">
                                            <label>Semester</label>
                                            <select className="form-control" value={formData.semester} onChange={e => setFormData({ ...formData, semester: e.target.value })} required>
                                                <option value="Ganjil">Ganjil</option>
                                                <option value="Genap">Genap</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="col-md-12">
                                        <div className="form-group">
                                            <label>Nama Siswa</label>
                                            <select className="form-control" value={formData.siswa_id} onChange={e => setFormData({ ...formData, siswa_id: e.target.value })} required>
                                                <option value="">-- Cari Nama Siswa --</option>
                                                {siswaList.map(s => <option key={s.id} value={s.id}>{s.nama} ({s.kelas_nama || 'Umum'}) - {s.nisn}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                    <div className="col-md-12">
                                        <div className="form-group">
                                            <label>Mata Pelajaran</label>
                                            <select className="form-control" value={formData.mapel_id} onChange={e => setFormData({ ...formData, mapel_id: e.target.value })} required>
                                                <option value="">-- Pilih Mata Pelajaran --</option>
                                                {mapelList.map(m => <option key={m.id} value={m.id}>[{m.tingkat || 'Umum'}] {m.nama}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                    <div className="col-md-4">
                                        <div className="form-group">
                                            <label>Nilai Tugas (30%)</label>
                                            <input type="number" step="0.01" max="100" min="0" className="form-control" value={formData.tugas} onChange={e => setFormData({ ...formData, tugas: e.target.value })} required />
                                        </div>
                                    </div>
                                    <div className="col-md-4">
                                        <div className="form-group">
                                            <label>Nilai UTS (30%)</label>
                                            <input type="number" step="0.01" max="100" min="0" className="form-control" value={formData.uts} onChange={e => setFormData({ ...formData, uts: e.target.value })} required />
                                        </div>
                                    </div>
                                    <div className="col-md-4">
                                        <div className="form-group">
                                            <label>Nilai UAS (40%)</label>
                                            <input type="number" step="0.01" max="100" min="0" className="form-control" value={formData.uas} onChange={e => setFormData({ ...formData, uas: e.target.value })} required />
                                        </div>
                                    </div>
                                </div>
                                <div className="alert alert-info py-2 mt-4" style={{ fontSize: '0.85rem' }}>
                                    <TrendingUp size={14} className="me-1" /> Nilai akhir dihitung otomatis dengan formula standar akademik.
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Batal</button>
                                <button type="submit" className="btn btn-primary" disabled={submitLoading} style={{ minWidth: '150px' }}>
                                    {submitLoading ? 'Menyimpan...' : (<><CheckCircle size={18} /> Simpan Nilai</>)}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
