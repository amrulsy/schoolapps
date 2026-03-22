import { useState, useEffect } from 'react'
import { API_BASE, getAuthHeaders } from '../../services/api'
import LoadingSpinner from '../../components/LoadingSpinner'
import { Users, PlusCircle, Search, Trash2, Edit, Save, X } from 'lucide-react'

export default function DataGuruPage() {
    const [guruList, setGuruList] = useState([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [showModal, setShowModal] = useState(false)
    const [isEdit, setIsEdit] = useState(false)
    const [submitLoading, setSubmitLoading] = useState(false)

    const [formData, setFormData] = useState({ id: '', nip: '', nama: '', username: '', password: '' })

    const fetchData = async () => {
        setLoading(true)
        try {
            const res = await fetch(`${API_BASE}/admin/guru`, { headers: getAuthHeaders() })
            if (res.ok) setGuruList(await res.json())
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchData()
    }, [])

    const filtered = guruList.filter(g =>
        (g.nama || '').toLowerCase().includes(search.toLowerCase()) ||
        (g.nip || '').includes(search)
    )

    const openCreateModal = () => {
        setIsEdit(false)
        setFormData({ id: '', nip: '', nama: '', username: '', password: '' })
        setShowModal(true)
    }

    const openEditModal = (guru) => {
        setIsEdit(true)
        setFormData({ id: guru.id, nip: guru.nip || '', nama: guru.nama, username: guru.username || '', password: '' })
        setShowModal(true)
    }

    const handleDelete = async (id, nama) => {
        if (!window.confirm(`Yakin ingin menghapus guru ${nama}? (Akun login juga akan terhapus jika ada)`)) return
        try {
            const res = await fetch(`${API_BASE}/admin/guru/${id}`, {
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
            const url = isEdit ? `${API_BASE}/admin/guru/${formData.id}` : `${API_BASE}/admin/guru`

            const payload = { ...formData }
            if (isEdit && !payload.password) delete payload.password // don't send empty password on edit

            const res = await fetch(url, {
                method,
                headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })

            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'Terjadi kesalahan')

            alert(isEdit ? 'Data berhasil diupdate' : 'Guru berhasil ditambahkan')
            setShowModal(false)
            fetchData()
        } catch (err) {
            alert(err.message)
        } finally {
            setSubmitLoading(false)
        }
    }

    return (
        <div className="admin-page animate-fadeIn">
            <div className="page-header mb-4">
                <div>
                    <h2 className="d-flex align-items-center gap-2">
                        <div className="p-2 bg-primary bg-opacity-10 rounded-lg text-primary">
                            <Users size={28} />
                        </div>
                        Data Master Guru
                    </h2>
                    <p className="text-secondary">Kelola daftar guru dan akses login portal pengajar</p>
                </div>
                <button className="btn btn-primary" onClick={openCreateModal}>
                    <PlusCircle size={20} /> Tambah Guru
                </button>
            </div>

            <div className="card shadow-sm mb-4 border-0">
                <div className="card-body p-4">
                    <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
                        <div style={{ position: 'relative', width: '100%', maxWidth: '400px' }}>
                            <Search size={18} style={{ position: 'absolute', left: '16px', top: '14px', color: 'var(--text-muted)' }} />
                            <input
                                type="text"
                                placeholder="Cari nama atau NIP guru..."
                                className="form-control bg-light border-0"
                                style={{ paddingLeft: '48px', height: '48px', borderRadius: '12px' }}
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                            />
                        </div>
                    </div>

                    {loading ? <LoadingSpinner fullScreen={false} /> : (
                        <div className="table-responsive">
                            <table className="table table-hover align-middle">
                                <thead>
                                    <tr>
                                        <th>NIP</th>
                                        <th>Nama Guru</th>
                                        <th>Username Login</th>
                                        <th className="text-end">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filtered.length === 0 ? (
                                        <tr><td colSpan="4" className="text-center py-4 text-muted">Belum ada data guru</td></tr>
                                    ) : filtered.map(g => (
                                        <tr key={g.id}>
                                            <td className="fw-medium text-secondary">{g.nip || '-'}</td>
                                            <td className="fw-bold text-dark">{g.nama}</td>
                                            <td>
                                                {g.username ? (
                                                    <span className="badge bg-success bg-opacity-10 text-success border border-success-subtle">
                                                        @{g.username}
                                                    </span>
                                                ) : (
                                                    <span className="badge bg-secondary bg-opacity-10 text-secondary border">Tidak ada akses login</span>
                                                )}
                                            </td>
                                            <td className="text-end">
                                                <button className="btn btn-sm btn-light text-primary me-2" onClick={() => openEditModal(g)}>
                                                    <Edit size={16} /> Edit
                                                </button>
                                                <button className="btn btn-sm btn-light text-danger" onClick={() => handleDelete(g.id, g.nama)}>
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

            {showModal && (
                <div className="modal-backdrop">
                    <div className="modal">
                        <div className="modal-header">
                            <h5 className="mb-0 fw-bold">{isEdit ? 'Edit Data Guru' : 'Tambah Guru Baru'}</h5>
                            <button className="btn-icon" onClick={() => setShowModal(false)}><X size={20} /></button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="modal-body">
                                <div className="mb-3">
                                    <label className="form-label">Nama Lengkap (Berta Gelar) *</label>
                                    <input type="text" className="form-control" required value={formData.nama} onChange={e => setFormData({ ...formData, nama: e.target.value })} placeholder="Misal: Budi Santoso, S.Pd" />
                                </div>
                                <div className="mb-3">
                                    <label className="form-label">NIP (Opsional)</label>
                                    <input type="text" className="form-control" value={formData.nip} onChange={e => setFormData({ ...formData, nip: e.target.value })} placeholder="Nomor Induk Pegawai" />
                                </div>
                                <hr />
                                <h6 className="fw-bold mb-3 text-primary">Informasi Akses Login Portal</h6>
                                <div className="mb-3">
                                    <label className="form-label">Username</label>
                                    <input type="text" className="form-control" value={formData.username} onChange={e => setFormData({ ...formData, username: e.target.value })} placeholder="Username untuk login" />
                                </div>
                                <div className="mb-3">
                                    <label className="form-label">Password {isEdit && '(Kosongkan jika tidak ingin mengubah)'}</label>
                                    <input type="password" className="form-control" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} placeholder="Password baru" required={!isEdit && formData.username.length > 0} />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-light" onClick={() => setShowModal(false)}>Batal</button>
                                <button type="submit" className="btn btn-primary" disabled={submitLoading}>
                                    {submitLoading ? 'Menyimpan...' : <><Save size={18} className="me-2" /> Simpan Data</>}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
