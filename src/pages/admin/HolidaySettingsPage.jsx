import { useState, useEffect } from 'react'
import { useApp } from '../../context/AppContext'
import LoadingSpinner from '../../components/LoadingSpinner'
import {
    CalendarOff, Trash2, Plus, Calendar,
    AlertTriangle, Sparkles, ChevronRight, Info
} from 'lucide-react'
import api from '../../services/api'
import Swal from 'sweetalert2'

export default function HolidaySettingsPage() {
    const { axiosConfig } = useApp()
    const [holidays, setHolidays] = useState([])
    const [loading, setLoading] = useState(false)
    const [newHoliday, setNewHoliday] = useState({ tanggal: '', keterangan: '' })

    const fetchHolidays = async () => {
        setLoading(true)
        try {
            const res = await api.get('/admin/infaq/holidays')
            setHolidays(res.data)
        } catch (err) {
            Swal.fire('Error', 'Gagal memuat data libur', 'error')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchHolidays()
    }, [])

    const handleAdd = async (e) => {
        e.preventDefault()
        if (!newHoliday.tanggal || !newHoliday.keterangan) return
        try {
            await api.post('/admin/infaq/holidays', newHoliday)
            setNewHoliday({ tanggal: '', keterangan: '' })
            fetchHolidays()
            Swal.fire({
                title: 'Berhasil',
                text: 'Hari libur tambahan telah ditambahkan.',
                icon: 'success',
                timer: 1500,
                showConfirmButton: false
            })
        } catch (err) {
            Swal.fire('Error', err.response?.data?.error || 'Gagal menambahkan hari libur', 'error')
        }
    }

    const handleDelete = async (id) => {
        const result = await Swal.fire({
            title: 'Apakah Anda yakin?',
            text: "Hari libur ini akan dihapus dari sistem.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            confirmButtonText: 'Ya, Hapus'
        })

        if (result.isConfirmed) {
            try {
                await api.delete(`/admin/infaq/holidays/${id}`)
                fetchHolidays()
                Swal.fire('Dihapus!', 'Hari libur telah dihapus.', 'success')
            } catch (err) {
                Swal.fire('Error', 'Gagal menghapus data', 'error')
            }
        }
    }

    return (
        <div className="holiday-settings fade-in">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <div className="d-flex align-items-center gap-2 mb-1">
                        <CalendarOff size={18} className="text-danger" />
                        <span className="text-uppercase fw-bold small text-muted tracking-wider">Konfigurasi Kalender</span>
                    </div>
                    <h1 className="fw-black m-0">Pengaturan Hari Libur</h1>
                </div>
            </div>

            <div className="row g-4">
                <div className="col-md-4">
                    <div className="bento-card glass">
                        <div className="d-flex align-items-center gap-2 mb-4">
                            <Plus size={20} className="text-primary" />
                            <h4 className="fw-bold m-0">Tambah Libur</h4>
                        </div>
                        <form onSubmit={handleAdd}>
                            <div className="mb-3">
                                <label className="form-label text-muted small fw-bold">TANGGAL</label>
                                <div className="input-group glass border rounded-3 overflow-hidden">
                                    <span className="input-group-text bg-transparent border-0"><Calendar size={18} className="text-muted" /></span>
                                    <input
                                        type="date"
                                        className="form-control border-0 bg-transparent py-2 fw-bold"
                                        value={newHoliday.tanggal}
                                        onChange={(e) => setNewHoliday({ ...newHoliday, tanggal: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="mb-4">
                                <label className="form-label text-muted small fw-bold">KETERANGAN / NAMA LIBUR</label>
                                <input
                                    type="text"
                                    className="form-control glass border rounded-3 py-2 fw-bold"
                                    placeholder="Contoh: Idul Fitri"
                                    value={newHoliday.keterangan}
                                    onChange={(e) => setNewHoliday({ ...newHoliday, keterangan: e.target.value })}
                                    required
                                />
                            </div>
                            <button type="submit" className="btn btn-primary w-100 rounded-3 py-2 fw-bold d-flex align-items-center justify-content-center gap-2">
                                <Sparkles size={18} /> Simpan Hari Libur
                            </button>
                        </form>
                        
                        <div className="alert alert-info mt-4 border-0 rounded-4 glass d-flex gap-3" style={{ fontSize: '0.85rem' }}>
                            <Info size={32} className="text-primary flex-shrink-0" />
                            <div>
                                <strong>Info:</strong> Hari Minggu sudah otomatis dianggap libur oleh sistem infaq. Gunakan menu ini hanya untuk <strong>libur tambahan</strong>.
                            </div>
                        </div>
                    </div>
                </div>

                <div className="col-md-8">
                    <div className="bento-card glass h-100">
                        <div className="d-flex justify-content-between align-items-center mb-4">
                            <h4 className="fw-bold m-0">Daftar Libur Tambahan</h4>
                            <span className="badge bg-light text-muted border px-3 rounded-pill">{holidays.length} Hari Terdaftar</span>
                        </div>

                        <div className="table-responsive">
                            <table className="table table-hover align-middle">
                                <thead className="text-muted small">
                                    <tr>
                                        <th>TANGGAL</th>
                                        <th>KETERANGAN</th>
                                        <th className="text-end">AKSI</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        <tr><td colSpan="3" className="text-center py-5"><LoadingSpinner message="Memuat data..." /></td></tr>
                                    ) : holidays.length === 0 ? (
                                        <tr><td colSpan="3" className="text-center py-5 text-muted fst-italic">Belum ada hari libur tambahan</td></tr>
                                    ) : holidays.map(h => (
                                        <tr key={h.id}>
                                            <td className="fw-bold">
                                                {new Date(h.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                                            </td>
                                            <td><span className="text-dark-emphasis fw-medium">{h.keterangan}</span></td>
                                            <td className="text-end">
                                                <button
                                                    className="btn btn-light-danger btn-sm rounded-3 p-2 border-0"
                                                    onClick={() => handleDelete(h.id)}
                                                    title="Hapus"
                                                >
                                                    <Trash2 size={16} className="text-danger" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
