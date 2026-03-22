import { useState, useEffect } from 'react'
import { API_BASE, getAuthHeaders } from '../../services/api'
import LoadingSpinner from '../../components/LoadingSpinner'
import { Clock, PlusCircle, Trash2, Edit, Save, X } from 'lucide-react'

export default function WaktuPelajaranPage() {
    const [jamList, setJamList] = useState([])
    const [loading, setLoading] = useState(true)

    const [showModal, setShowModal] = useState(false)
    const [isEdit, setIsEdit] = useState(false)
    const [submitLoading, setSubmitLoading] = useState(false)
    const [formData, setFormData] = useState({ id: '', jam_ke: '', jam_mulai: '', jam_selesai: '', tipe: 'Pelajaran' })

    const fetchData = async () => {
        setLoading(true)
        try {
            const res = await fetch(`${API_BASE}/admin/jam-pelajaran`, { headers: getAuthHeaders() })
            if (res.ok) setJamList(await res.json())
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchData()
    }, [])

    const openCreateModal = () => {
        setIsEdit(false)
        const nextJamKe = jamList.length > 0 ? Math.max(...jamList.map(j => j.jam_ke)) + 1 : 1
        setFormData({ id: '', jam_ke: nextJamKe, jam_mulai: '', jam_selesai: '', tipe: 'Pelajaran' })
        setShowModal(true)
    }

    const openEditModal = (j) => {
        setIsEdit(true)
        setFormData({ id: j.id, jam_ke: j.jam_ke, jam_mulai: j.jam_mulai, jam_selesai: j.jam_selesai, tipe: j.tipe })
        setShowModal(true)
    }

    const handleDelete = async (id) => {
        if (!window.confirm('Yakin ingin menghapus jam pelajaran ini? Jika sedang dipakai di Jadwal Pelajaran, penghapusan akan gagal.')) return
        try {
            const res = await fetch(`${API_BASE}/admin/jam-pelajaran/${id}`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'Gagal menghapus')
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
            const url = isEdit ? `${API_BASE}/admin/jam-pelajaran/${formData.id}` : `${API_BASE}/admin/jam-pelajaran`

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

    return (
        <div className="admin-page animate-fadeIn">
            <div className="page-header mb-4">
                <div>
                    <h2 className="d-flex align-items-center gap-2">
                        <div className="p-2 bg-primary bg-opacity-10 rounded-lg text-primary">
                            <Clock size={28} />
                        </div>
                        Waktu Pelajaran
                    </h2>
                    <p className="text-secondary">Atur master data Jam ke- dan waktu mulai/selesai untuk jadwal mengajar</p>
                </div>
                <button className="btn btn-primary text-white" onClick={openCreateModal}>
                    <PlusCircle size={20} /> Tambah Jam Pelajaran
                </button>
            </div>

            <div className="card shadow-sm mb-4 border-0">
                <div className="card-body p-4">
                    {loading ? <LoadingSpinner fullScreen={false} /> : (
                        <div className="table-responsive">
                            <table className="table table-hover align-middle">
                                <thead className="table-light">
                                    <tr>
                                        <th>Jam Ke-</th>
                                        <th>Waktu</th>
                                        <th>Tipe</th>
                                        <th className="text-end">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {jamList.length === 0 ? (
                                        <tr><td colSpan="4" className="text-center py-4 text-muted">Belum ada data Jam Pelajaran</td></tr>
                                    ) : jamList.map(j => (
                                        <tr key={j.id}>
                                            <td className="fw-bold text-dark">Jam ke-{j.jam_ke}</td>
                                            <td className="text-secondary">
                                                <div className="d-flex align-items-center gap-1">
                                                    <Clock size={14} /> {j.jam_mulai.substring(0, 5)} - {j.jam_selesai.substring(0, 5)}
                                                </div>
                                            </td>
                                            <td>
                                                <span className={`badge ${j.tipe === 'Pelajaran' ? 'bg-primary bg-opacity-10 text-primary' : 'bg-warning bg-opacity-10 text-dark border-warning'} border`}>
                                                    {j.tipe}
                                                </span>
                                            </td>
                                            <td className="text-end">
                                                <button className="btn btn-sm btn-light text-primary me-2" onClick={() => openEditModal(j)}>
                                                    <Edit size={16} />
                                                </button>
                                                <button className="btn btn-sm btn-light text-danger" onClick={() => handleDelete(j.id)}>
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
                            <h5 className="mb-0 fw-bold">{isEdit ? 'Edit Jam Pelajaran' : 'Tambah Jam Pelajaran'}</h5>
                            <button className="btn-icon" onClick={() => setShowModal(false)}><X size={20} /></button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="modal-body">
                                <div className="mb-3">
                                    <label className="form-label">Urutan Jam Ke- *</label>
                                    <input type="number" className="form-control" required min="1" value={formData.jam_ke} onChange={e => setFormData({ ...formData, jam_ke: e.target.value })} />
                                    <small className="text-muted">Gunakan urutan angka, misal: 1, 2, 3</small>
                                </div>
                                <div className="row mb-3">
                                    <div className="col-6">
                                        <label className="form-label">Jam Mulai *</label>
                                        <input type="time" className="form-control" required value={formData.jam_mulai} onChange={e => setFormData({ ...formData, jam_mulai: e.target.value })} />
                                    </div>
                                    <div className="col-6">
                                        <label className="form-label">Jam Selesai *</label>
                                        <input type="time" className="form-control" required value={formData.jam_selesai} onChange={e => setFormData({ ...formData, jam_selesai: e.target.value })} />
                                    </div>
                                </div>
                                <div className="mb-3">
                                    <label className="form-label">Tipe Sesi *</label>
                                    <select className="form-select" required value={formData.tipe} onChange={e => setFormData({ ...formData, tipe: e.target.value })}>
                                        <option value="Pelajaran">Pelajaran</option>
                                        <option value="Istirahat">Istirahat</option>
                                    </select>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-light" onClick={() => setShowModal(false)}>Batal</button>
                                <button type="submit" className="btn btn-primary text-white" disabled={submitLoading}>
                                    {submitLoading ? 'Menyimpan...' : <><Save size={18} className="me-2" /> Simpan</>}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
