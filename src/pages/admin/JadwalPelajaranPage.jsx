import { useState, useEffect } from 'react'
import { API_BASE, getAuthHeaders } from '../../services/api'
import LoadingSpinner from '../../components/LoadingSpinner'
import { Calendar, PlusCircle, Trash2, Edit, Save, X, Search, Clock, ChevronDown, ChevronRight, BookOpen } from 'lucide-react'

export default function JadwalPelajaranPage() {
    const [jadwalList, setJadwalList] = useState([])
    const [guruList, setGuruList] = useState([])
    const [kelasList, setKelasList] = useState([])
    const [mapelList, setMapelList] = useState([])
    const [jamList, setJamList] = useState([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')

    // UI state
    const [selectedKelasId, setSelectedKelasId] = useState(null)
    const [expandedHari, setExpandedHari] = useState('Senin')

    // Modal state
    const [showModal, setShowModal] = useState(false)
    const [isEdit, setIsEdit] = useState(false)
    const [submitLoading, setSubmitLoading] = useState(false)
    const [formData, setFormData] = useState({ id: '', guru_id: '', kelas_id: '', mapel_id: '', hari: 'Senin', jam_pelajaran_id: '' })

    const fetchData = async () => {
        setLoading(true)
        try {
            const [jadwalRes, guruRes, kelasRes, mapelRes, jamRes] = await Promise.all([
                fetch(`${API_BASE}/admin/jadwal`, { headers: getAuthHeaders() }),
                fetch(`${API_BASE}/admin/guru`, { headers: getAuthHeaders() }),
                fetch(`${API_BASE}/kelas`, { headers: getAuthHeaders() }),
                fetch(`${API_BASE}/admin/akademik/mapel`, { headers: getAuthHeaders() }),
                fetch(`${API_BASE}/admin/jam-pelajaran`, { headers: getAuthHeaders() })
            ])
            if (jadwalRes.ok) setJadwalList(await jadwalRes.json())
            if (guruRes.ok) setGuruList(await guruRes.json())

            if (kelasRes.ok) {
                const kelasData = await kelasRes.json()
                setKelasList(kelasData)
                if (kelasData.length > 0 && !selectedKelasId) {
                    setSelectedKelasId(kelasData[0].id)
                }
            }

            if (mapelRes.ok) setMapelList(await mapelRes.json())
            if (jamRes.ok) setJamList(await jamRes.json())
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchData()
    }, [])

    const openCreateModal = (hari = 'Senin') => {
        setIsEdit(false)
        setFormData({ id: '', guru_id: '', kelas_id: selectedKelasId || (kelasList[0]?.id || ''), mapel_id: '', hari: hari, jam_pelajaran_id: jamList.length > 0 ? jamList[0].id : '' })
        setShowModal(true)
    }

    const openEditModal = (j) => {
        setIsEdit(true)
        setFormData({ id: j.id, guru_id: j.guru_id, kelas_id: j.kelas_id, mapel_id: j.mapel_id, hari: j.hari, jam_pelajaran_id: j.jam_pelajaran_id })
        setShowModal(true)
    }

    const handleDelete = async (id) => {
        if (!window.confirm('Yakin ingin menghapus jadwal ini?')) return
        try {
            const res = await fetch(`${API_BASE}/admin/jadwal/${id}`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            })
            if (!res.ok) throw new Error('Gagal menghapus')
            fetchData()
        } catch (err) {
            alert(err.message)
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setSubmitLoading(true)
        try {
            const method = isEdit ? 'PUT' : 'POST'
            const url = isEdit ? `${API_BASE}/admin/jadwal/${formData.id}` : `${API_BASE}/admin/jadwal`

            const res = await fetch(url, {
                method,
                headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            })

            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'Terjadi kesalahan')

            setShowModal(false)
            fetchData()
        } catch (err) {
            alert(err.message)
        } finally {
            setSubmitLoading(false)
        }
    }

    // Filter current class schedules
    const currentKelasSchedules = jadwalList.filter(j => j.kelas_id === parseInt(selectedKelasId))
    const selectedKelasData = kelasList.find(k => k.id === parseInt(selectedKelasId))

    // Apply search filter for classes (left panel)
    const filteredKelas = kelasList.filter(k => (k.nama || '').toLowerCase().includes(search.toLowerCase()))

    const daysOfWeek = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu']

    return (
        <div className="admin-page animate-fadeIn">
            <div className="page-header mb-4">
                <div>
                    <h2 className="d-flex align-items-center gap-2">
                        <div className="p-2 bg-success bg-opacity-10 rounded-lg text-success">
                            <Calendar size={28} />
                        </div>
                        Penjadwalan Mengajar
                    </h2>
                    <p className="text-secondary">Pusat pengaturan jadwal template mingguan Guru berdasarkan Kelas</p>
                </div>
            </div>

            {loading ? <LoadingSpinner fullScreen={false} /> : (
                <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                    {/* LEFT PANEL: KELAS LIST */}
                    <div style={{ flex: '1 1 300px', maxWidth: '350px' }}>
                        <div className="card shadow-sm border-0 h-100" style={{ borderRadius: '16px' }}>
                            <div className="card-body p-4">
                                <h5 className="fw-bold mb-4 d-flex align-items-center gap-2 text-dark">
                                    <BookOpen size={20} className="text-primary" /> Daftar Kelas
                                </h5>

                                <div className="mb-4" style={{ position: 'relative' }}>
                                    <Search size={18} style={{ position: 'absolute', left: '16px', top: '14px', color: 'var(--text-muted)' }} />
                                    <input
                                        type="text"
                                        placeholder="Cari kelas..."
                                        className="form-control bg-light border-0"
                                        style={{ paddingLeft: '44px', height: '46px', borderRadius: '12px', fontSize: '0.95rem' }}
                                        value={search}
                                        onChange={e => setSearch(e.target.value)}
                                    />
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '600px', overflowY: 'auto', paddingRight: '4px' }}>
                                    {filteredKelas.length === 0 ? (
                                        <div className="text-center text-muted py-4 bg-light rounded-3">Kelas tidak ditemukan</div>
                                    ) : filteredKelas.map(k => (
                                        <button
                                            key={k.id}
                                            className={`btn w-100 text-start d-flex justify-content-between align-items-center px-4 py-3 border-0 ${selectedKelasId === k.id ? 'bg-primary text-white shadow' : 'bg-light text-dark'}`}
                                            onClick={() => setSelectedKelasId(k.id)}
                                            style={{
                                                borderRadius: '12px',
                                                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                                transform: selectedKelasId === k.id ? 'scale(1.02)' : 'scale(1)'
                                            }}
                                        >
                                            <span className="fw-medium">{k.nama}</span>
                                            <ChevronRight size={18} style={{ opacity: selectedKelasId === k.id ? 1 : 0.3 }} />
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT PANEL: JADWAL PER HARI */}
                    <div style={{ flex: '2 1 600px' }}>
                        {selectedKelasData ? (
                            <div className="card shadow-sm border-0 h-100" style={{ borderRadius: '16px' }}>
                                <div className="card-header bg-white border-bottom-0 p-4 pb-2 d-flex justify-content-between align-items-center mt-2 flex-wrap gap-3">
                                    <div>
                                        <h4 className="fw-bold mb-2 text-dark d-flex align-items-center gap-2">
                                            Jadwal Kelas <span className="text-primary bg-primary bg-opacity-10 px-3 py-1 rounded-pill">{selectedKelasData.nama}</span>
                                        </h4>
                                        <div className="text-muted small">Kelola jadwal pelajaran per hari untuk kelas ini</div>
                                    </div>
                                    <button className="btn btn-primary text-white shadow-sm px-4 rounded-pill d-flex align-items-center gap-2" onClick={() => openCreateModal(expandedHari)} style={{ transition: 'all 0.3s', transform: 'translateY(-2px)' }}>
                                        <PlusCircle size={18} /> Tambah Jadwal
                                    </button>
                                </div>

                                <div className="card-body p-4 pt-3">
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                        {daysOfWeek.map((hari) => {
                                            const isExpanded = expandedHari === hari;
                                            const jadwalHariIni = currentKelasSchedules.filter(j => j.hari === hari);

                                            return (
                                                <div className={`border-0 rounded-4 overflow-hidden transition-all`} key={hari} style={{ backgroundColor: isExpanded ? '#fff' : '#f8f9fa', border: isExpanded ? '1px solid var(--primary-light)' : '1px solid transparent', boxShadow: isExpanded ? '0 4px 12px rgba(0,0,0,0.05)' : 'none' }}>
                                                    <button
                                                        className={`w-100 border-0 text-start px-4 py-3 d-flex justify-content-between align-items-center transition-all`}
                                                        onClick={() => setExpandedHari(isExpanded ? null : hari)}
                                                        style={{
                                                            backgroundColor: isExpanded ? 'var(--primary-light)' : 'transparent',
                                                            color: isExpanded ? 'var(--primary)' : 'var(--text-dark)',
                                                            cursor: 'pointer'
                                                        }}
                                                    >
                                                        <div className="d-flex align-items-center gap-3">
                                                            <div className={`p-2 rounded-circle ${isExpanded ? 'bg-primary text-white' : 'bg-white text-secondary shadow-sm'}`}>
                                                                <Calendar size={20} />
                                                            </div>
                                                            <span className="fw-bold fs-5">Hari {hari}</span>
                                                        </div>
                                                        <div className="d-flex align-items-center gap-3">
                                                            <span className={`badge rounded-pill px-3 py-2 ${jadwalHariIni.length > 0 ? (isExpanded ? 'bg-white text-primary shadow-sm' : 'bg-primary bg-opacity-10 text-primary') : 'bg-secondary bg-opacity-10 text-secondary'}`}>
                                                                {jadwalHariIni.length} Sesi
                                                            </span>
                                                            <ChevronDown size={20} style={{ transform: isExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.3s' }} opacity={0.5} />
                                                        </div>
                                                    </button>

                                                    <div className={`collapse ${isExpanded ? 'show' : ''}`} style={{ transition: 'height 0.3s ease-out' }}>
                                                        <div className="p-3 bg-white">
                                                            {jadwalHariIni.length === 0 ? (
                                                                <div className="text-center py-5 text-muted">
                                                                    <div className="mb-3 d-inline-flex bg-light p-4 rounded-circle"><Calendar size={32} className="opacity-25" /></div>
                                                                    <p className="mb-2">Belum ada jadwal untuk hari {hari} di kelas {selectedKelasData.nama}.</p>
                                                                    <button className="btn btn-link py-1 fw-bold text-decoration-none" onClick={() => openCreateModal(hari)}>+ Tambah Jadwal Sekarang</button>
                                                                </div>
                                                            ) : (
                                                                <div className="table-responsive rounded-3 border">
                                                                    <table className="table table-hover align-middle mb-0 border-white" style={{ width: '100%' }}>
                                                                        <thead className="bg-light text-secondary small fw-bold" style={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                                                            <tr>
                                                                                <th className="ps-4 py-3 border-0">Jam Pelajaran</th>
                                                                                <th className="py-3 border-0">Mata Pelajaran</th>
                                                                                <th className="py-3 border-0">Guru Pengajar</th>
                                                                                <th className="text-end pe-4 py-3 border-0">Aksi</th>
                                                                            </tr>
                                                                        </thead>
                                                                        <tbody>
                                                                            {jadwalHariIni.map(j => (
                                                                                <tr key={j.id} style={{ transition: 'background-color 0.2s' }}>
                                                                                    <td className="ps-4 py-3">
                                                                                        <div className="fw-bold text-dark d-flex align-items-center gap-2 mb-1">
                                                                                            <Clock size={14} className="text-primary" />
                                                                                            Jam ke-{j.jam_ke}
                                                                                        </div>
                                                                                        <small className="text-muted ms-4 fw-medium">{j.jam_mulai?.substring(0, 5)} - {j.jam_selesai?.substring(0, 5)}</small>
                                                                                    </td>
                                                                                    <td className="py-3">
                                                                                        <span className="badge bg-primary bg-opacity-10 text-primary border-0 px-3 py-2 rounded-pill fw-bold">
                                                                                            {j.mapel_nama}
                                                                                        </span>
                                                                                    </td>
                                                                                    <td className="fw-medium text-dark py-3 d-flex align-items-center gap-2">
                                                                                        <div className="avatar bg-light text-primary rounded-circle d-flex align-items-center justify-content-center fw-bold" style={{ width: '32px', height: '32px', fontSize: '12px' }}>
                                                                                            {j.guru_nama?.charAt(0)}
                                                                                        </div>
                                                                                        {j.guru_nama}
                                                                                    </td>
                                                                                    <td className="text-end pe-4 py-3">
                                                                                        <button className="btn btn-sm btn-light text-primary me-2 rounded-circle shadow-sm" style={{ width: '36px', height: '36px' }} onClick={() => openEditModal(j)}>
                                                                                            <Edit size={16} />
                                                                                        </button>
                                                                                        <button className="btn btn-sm btn-light text-danger rounded-circle shadow-sm" style={{ width: '36px', height: '36px' }} onClick={() => handleDelete(j.id)}>
                                                                                            <Trash2 size={16} />
                                                                                        </button>
                                                                                    </td>
                                                                                </tr>
                                                                            ))}
                                                                        </tbody>
                                                                    </table>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="card shadow-sm border-0 h-100 d-flex align-items-center justify-content-center bg-white" style={{ borderRadius: '16px' }}>
                                <div className="text-center text-muted p-5">
                                    <div className="bg-light rounded-circle d-inline-flex p-4 mb-4">
                                        <BookOpen size={48} className="text-primary opacity-50" />
                                    </div>
                                    <h4 className="fw-bold text-dark">Belum Ada Kelas Terpilih</h4>
                                    <p className="text-secondary">Pilih salah satu kelas di menu samping kiri untuk melihat dan mengelola jadwal pelajarannya.</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* MODAL TAMBAH/EDIT */}
            {showModal && (
                <div className="modal-backdrop" style={{ zIndex: 1050 }}>
                    <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                        <div className="modal-dialog modal-dialog-centered">
                            <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '16px', overflow: 'hidden' }}>
                                <div className="modal-header bg-light border-0 p-4">
                                    <h5 className="mb-0 fw-bold d-flex align-items-center gap-2">
                                        <Calendar size={20} className="text-primary" /> {isEdit ? 'Edit Jadwal' : 'Tambah Jadwal Baru'}
                                    </h5>
                                    <button className="btn-close shadow-none" onClick={() => setShowModal(false)}></button>
                                </div>
                                <form onSubmit={handleSubmit}>
                                    <div className="modal-body p-4">
                                        {/* KELAS IS PRE-SELECTED */}
                                        <div className="mb-4">
                                            <label className="form-label fw-medium text-secondary small text-uppercase tracking-wider">Kelas Terpilih</label>
                                            <select className="form-select bg-light border-0 fw-bold shadow-sm" style={{ height: '48px', borderRadius: '12px' }} required disabled value={formData.kelas_id} onChange={e => setFormData({ ...formData, kelas_id: e.target.value })}>
                                                <option value="">-- Pilih Kelas --</option>
                                                {kelasList.map(k => <option key={k.id} value={k.id}>{k.nama}</option>)}
                                            </select>
                                        </div>

                                        <div className="row g-3 mb-4">
                                            <div className="col-md-6">
                                                <label className="form-label fw-medium text-secondary small text-uppercase tracking-wider">Hari *</label>
                                                <select className="form-select border-0 shadow-sm bg-light" style={{ height: '48px', borderRadius: '12px' }} required value={formData.hari} onChange={e => setFormData({ ...formData, hari: e.target.value })}>
                                                    {['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'].map(h => (
                                                        <option key={h} value={h}>{h}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className="col-md-6">
                                                <label className="form-label fw-medium text-secondary small text-uppercase tracking-wider">Waktu Pelajaran *</label>
                                                <select className="form-select border-0 shadow-sm bg-light" style={{ height: '48px', borderRadius: '12px' }} required value={formData.jam_pelajaran_id} onChange={e => setFormData({ ...formData, jam_pelajaran_id: e.target.value })}>
                                                    <option value="">-- Pilih Jam --</option>
                                                    {jamList.map(j => (
                                                        <option key={j.id} value={j.id}>
                                                            Jam ke-{j.jam_ke} ({j.jam_mulai.substring(0, 5)}-{j.jam_selesai.substring(0, 5)})
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>

                                        <div className="mb-4">
                                            <label className="form-label fw-medium text-secondary small text-uppercase tracking-wider">Mata Pelajaran *</label>
                                            <select className="form-select border-0 shadow-sm bg-light" style={{ height: '48px', borderRadius: '12px' }} required value={formData.mapel_id} onChange={e => setFormData({ ...formData, mapel_id: e.target.value })}>
                                                <option value="">-- Pilih Mapel --</option>
                                                {mapelList.map(m => <option key={m.id} value={m.id}>{m.nama}</option>)}
                                            </select>
                                        </div>

                                        <div className="mb-2">
                                            <label className="form-label fw-medium text-secondary small text-uppercase tracking-wider">Guru Pengajar *</label>
                                            <select className="form-select border-0 shadow-sm bg-light" style={{ height: '48px', borderRadius: '12px' }} required value={formData.guru_id} onChange={e => setFormData({ ...formData, guru_id: e.target.value })}>
                                                <option value="">-- Pilih Guru --</option>
                                                {guruList.map(g => <option key={g.id} value={g.id}>{g.nama}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                    <div className="modal-footer border-0 p-4 pt-0">
                                        <button type="button" className="btn btn-light rounded-pill px-4 fw-medium" onClick={() => setShowModal(false)}>Batal</button>
                                        <button type="submit" className="btn btn-primary text-white rounded-pill px-4 shadow-sm fw-medium d-flex align-items-center gap-2" disabled={submitLoading}>
                                            {submitLoading ? 'Menyimpan...' : <><Save size={18} /> Simpan Jadwal</>}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
