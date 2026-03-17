import { useState, useEffect } from 'react'
import { useApp } from '../context/AppContext'
import { Search, Filter, Trash2, CheckCircle, XCircle, Clock, Eye, Download, UserPlus, Users, GraduationCap, X, MapPin, Phone, Calendar, Send } from 'lucide-react'
import Swal from 'sweetalert2'

const API_BASE = 'http://localhost:3000/api/admin/cms'

export default function CmsPpdbPage() {
    const { addToast } = useApp()
    const [registrations, setRegistrations] = useState([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [filterStatus, setFilterStatus] = useState('all')
    const [selectedReg, setSelectedReg] = useState(null) // For detail drawer

    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        try {
            setLoading(true)
            const res = await fetch(`${API_BASE}/ppdb`, {
                headers: { 'Authorization': 'Bearer dummy-token' }
            })
            if (res.ok) {
                const data = await res.json()
                setRegistrations(data)
            }
        } catch (err) {
            addToast('danger', 'Error', 'Gagal memuat data PPDB')
        } finally {
            setLoading(false)
        }
    }

    const handleUpdateStatus = async (id, newStatus) => {
        const { isConfirmed } = await Swal.fire({
            title: 'Konfirmasi',
            text: `Ubah status pendaftaran menjadi ${newStatus.toUpperCase()}?`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Ya, Ubah',
            confirmButtonColor: newStatus === 'approved' ? '#10b981' : '#ef4444',
            cancelButtonText: 'Batal'
        })

        if (!isConfirmed) return

        try {
            const res = await fetch(`${API_BASE}/ppdb/${id}/status`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer dummy-token'
                },
                body: JSON.stringify({ status: newStatus })
            })

            if (res.ok) {
                addToast('success', 'Berhasil', 'Status pendaftaran diperbarui')
                setRegistrations(prev => prev.map(r => r.id === id ? { ...r, status: newStatus } : r))
                if (selectedReg && selectedReg.id === id) {
                    setSelectedReg(prev => ({ ...prev, status: newStatus }))
                }
            }
        } catch (err) {
            addToast('danger', 'Error', 'Gagal memperbarui status')
        }
    }

    const handleDelete = async (id) => {
        const { isConfirmed } = await Swal.fire({
            title: 'Hapus Data?',
            text: "Data yang dihapus tidak dapat dikembalikan!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            confirmButtonText: 'Ya, Hapus',
            cancelButtonText: 'Batal'
        })

        if (!isConfirmed) return

        try {
            const res = await fetch(`${API_BASE}/ppdb/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': 'Bearer dummy-token' }
            })

            if (res.ok) {
                addToast('success', 'Berhasil', 'Data berhasil dihapus')
                setRegistrations(prev => prev.filter(r => r.id !== id))
                if (selectedReg && selectedReg.id === id) setSelectedReg(null)
            }
        } catch (err) {
            addToast('danger', 'Error', 'Gagal menghapus data')
        }
    }

    const filteredData = registrations.filter(r => {
        const matchSearch = r.nama_lengkap.toLowerCase().includes(search.toLowerCase()) ||
            r.registration_number.toLowerCase().includes(search.toLowerCase()) ||
            r.nisn.includes(search)
        const matchStatus = filterStatus === 'all' || r.status === filterStatus
        return matchSearch && matchStatus
    })

    const stats = {
        total: registrations.length,
        pending: registrations.filter(r => r.status === 'pending').length,
        approved: registrations.filter(r => r.status === 'approved').length,
        rejected: registrations.filter(r => r.status === 'rejected').length
    }

    const getStatusBadge = (status) => {
        switch (status) {
            case 'approved': return <span className="badge" style={{ background: '#dcfce7', color: '#166534', border: '1px solid #bbf7d0' }}>Diterima</span>
            case 'rejected': return <span className="badge" style={{ background: '#fee2e2', color: '#991b1b', border: '1px solid #fecaca' }}>Ditolak</span>
            default: return <span className="badge" style={{ background: '#fef9c3', color: '#854d0e', border: '1px solid #fef08a' }}>Menunggu</span>
        }
    }

    return (
        <div className="fade-in">
            <div className="page-header" style={{ marginBottom: '32px' }}>
                <div>
                    <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>Penerimaan Siswa Baru</h1>
                    <p className="text-secondary">Pusat data Pendaftaran Peserta Didik Baru (PPDB)</p>
                </div>
                <div className="actions" style={{ gap: 12 }}>
                    <button className="btn btn-outline" style={{ borderRadius: 10 }} onClick={loadData}>
                        Muat Ulang
                    </button>
                    <button className="btn btn-primary" style={{ borderRadius: 10, background: 'var(--primary-color)' }} onClick={() => addToast('info', 'Segera Hadir', 'Ekspor Excel sedang dikembangkan')}>
                        <Download size={16} /> Ekspor Excel
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="portal-grid-4" style={{ gap: '20px', marginBottom: '32px' }}>
                <div className="card" style={{ padding: '24px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', display: 'flex', gap: 20, alignItems: 'center' }}>
                    <div style={{ padding: 12, background: 'rgba(99, 102, 241, 0.1)', color: 'var(--primary-color)', borderRadius: 12 }}><Users size={28} /></div>
                    <div>
                        <div className="text-secondary" style={{ fontSize: '0.85rem' }}>Total Pendaftar</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{stats.total}</div>
                    </div>
                </div>
                <div className="card" style={{ padding: '24px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', display: 'flex', gap: 20, alignItems: 'center' }}>
                    <div style={{ padding: 12, background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', borderRadius: 12 }}><Clock size={28} /></div>
                    <div>
                        <div className="text-secondary" style={{ fontSize: '0.85rem' }}>Menunggu Verifikasi</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{stats.pending}</div>
                    </div>
                </div>
                <div className="card" style={{ padding: '24px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', display: 'flex', gap: 20, alignItems: 'center' }}>
                    <div style={{ padding: 12, background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', borderRadius: 12 }}><CheckCircle size={28} /></div>
                    <div>
                        <div className="text-secondary" style={{ fontSize: '0.85rem' }}>Diterima</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{stats.approved}</div>
                    </div>
                </div>
                <div className="card" style={{ padding: '24px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', display: 'flex', gap: 20, alignItems: 'center', background: 'linear-gradient(135deg, var(--primary-color), #4f46e5)', color: 'white' }}>
                    <div style={{ padding: 12, background: 'rgba(255, 255, 255, 0.2)', color: 'white', borderRadius: 12 }}><GraduationCap size={28} /></div>
                    <div>
                        <div style={{ fontSize: '0.85rem', opacity: 0.9 }}>Kuota Tersisa</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>-- / 100</div>
                    </div>
                </div>
            </div>

            <div className="card" style={{ border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05)', borderRadius: 16 }}>
                <div style={{ padding: '24px', borderBottom: '1px solid #f1f5f9', display: 'flex', gap: '20px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ flex: 1, minWidth: '300px', position: 'relative' }}>
                        <Search style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} size={18} />
                        <input
                            type="text"
                            className="form-control"
                            placeholder="Cari nama, NISN, atau No. Registrasi..."
                            style={{ paddingLeft: '48px', height: '48px', borderRadius: 12, background: '#f8fafc', border: '1px solid #e2e8f0' }}
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ padding: '8px 16px', background: '#f1f5f9', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 10 }}>
                            <Filter size={16} color="#64748b" />
                            <select style={{ border: 'none', background: 'transparent', fontWeight: 600, color: '#475569', cursor: 'pointer', outline: 'none' }} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                                <option value="all">Semua Status</option>
                                <option value="pending">Menunggu</option>
                                <option value="approved">Diterima</option>
                                <option value="rejected">Ditolak</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="table-responsive">
                    <table className="table" style={{ margin: 0 }}>
                        <thead style={{ background: '#f8fafc' }}>
                            <tr>
                                <th style={{ padding: '16px 24px', color: '#64748b', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase' }}>Waktu Daftar</th>
                                <th style={{ padding: '16px 24px', color: '#64748b', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase' }}>No. Registrasi</th>
                                <th style={{ padding: '16px 24px', color: '#64748b', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase' }}>Calon Siswa</th>
                                <th style={{ padding: '16px 24px', color: '#64748b', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase' }}>Asal Sekolah</th>
                                <th style={{ padding: '16px 24px', color: '#64748b', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase' }}>Status</th>
                                <th style={{ padding: '16px 24px', color: '#64748b', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', textAlign: 'right' }}>Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="6" style={{ textAlign: 'center', padding: '100px 0' }}>Memuat data pendaftaran...</td></tr>
                            ) : filteredData.length === 0 ? (
                                <tr><td colSpan="6" style={{ textAlign: 'center', padding: '100px 0' }}>
                                    <div style={{ opacity: 0.5, marginBottom: 10 }}><UserPlus size={48} style={{ margin: '0 auto' }} /></div>
                                    <div style={{ color: '#64748b' }}>Tidak ada data pendaftaran ditemukan.</div>
                                </td></tr>
                            ) : filteredData.map(r => (
                                <tr key={r.id} style={{ transition: 'all 0.2s' }}>
                                    <td style={{ padding: '20px 24px' }}>
                                        <div style={{ fontWeight: 600 }}>{new Date(r.created_at).toLocaleDateString('id-ID')}</div>
                                        <div className="text-secondary" style={{ fontSize: '0.8rem' }}>{new Date(r.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</div>
                                    </td>
                                    <td style={{ padding: '20px 24px' }}>
                                        <span style={{ padding: '6px 12px', background: '#f1f5f9', borderRadius: 8, fontWeight: 700, fontSize: '0.85rem', color: '#1e293b' }}>{r.registration_number}</span>
                                    </td>
                                    <td style={{ padding: '20px 24px' }}>
                                        <div style={{ fontWeight: 700, color: '#0f172a' }}>{r.nama_lengkap}</div>
                                        <div className="text-secondary" style={{ fontSize: '0.85rem' }}>NISN: {r.nisn}</div>
                                    </td>
                                    <td style={{ padding: '20px 24px', color: '#475569' }}>{r.asal_sekolah}</td>
                                    <td style={{ padding: '20px 24px' }}>{getStatusBadge(r.status)}</td>
                                    <td style={{ padding: '20px 24px', textAlign: 'right' }}>
                                        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                                            <button className="btn btn-icon btn-light" style={{ borderRadius: 10, border: '1px solid #e2e8f0' }} onClick={() => setSelectedReg(r)} title="Lihat Detail">
                                                <Eye size={18} />
                                            </button>

                                            {r.status === 'pending' && (
                                                <>
                                                    <button className="btn btn-icon btn-success" style={{ borderRadius: 10, background: '#dcfce7', color: '#166534', border: 'none' }} onClick={() => handleUpdateStatus(r.id, 'approved')} title="Terima">
                                                        <CheckCircle size={18} />
                                                    </button>
                                                    <button className="btn btn-icon btn-danger" style={{ borderRadius: 10, background: '#fee2e2', color: '#991b1b', border: 'none' }} onClick={() => handleUpdateStatus(r.id, 'rejected')} title="Tolak">
                                                        <XCircle size={18} />
                                                    </button>
                                                </>
                                            )}

                                            <button className="btn btn-icon btn-light" style={{ borderRadius: 10, color: '#ef4444', border: '1px solid #fee2e2' }} onClick={() => handleDelete(r.id)} title="Hapus">
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div style={{ padding: '20px 24px', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div className="text-secondary" style={{ fontSize: '0.85rem' }}>
                        Menampilkan <strong style={{ color: '#0f172a' }}>{filteredData.length}</strong> dari {registrations.length} pendaftar terdaftar
                    </div>
                </div>
            </div>

            {/* Detail Drawer (Glassmorphism backdrop) */}
            {selectedReg && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', justifyContent: 'flex-end' }}>
                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)' }} onClick={() => setSelectedReg(null)}></div>
                    <div className="slide-left" style={{ position: 'relative', width: '450px', background: 'white', height: '100%', boxShadow: '-10px 0 25px rgba(0,0,0,0.1)', overflowY: 'auto' }}>
                        <div style={{ padding: '32px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                                <div style={{ padding: '6px 12px', background: 'rgba(99, 102, 241, 0.1)', color: 'var(--primary-color)', borderRadius: 20, fontSize: '0.8rem', fontWeight: 800 }}>DETAIL PESERTA</div>
                                <button onClick={() => setSelectedReg(null)} style={{ border: 'none', background: '#f1f5f9', width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                                    <X size={20} />
                                </button>
                            </div>

                            <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                                <div style={{ width: 80, height: 80, background: '#f1f5f9', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', color: '#64748b' }}>
                                    <UserPlus size={40} />
                                </div>
                                <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0 }}>{selectedReg.nama_lengkap}</h2>
                                <p style={{ color: '#64748b', fontSize: '1rem', marginTop: 4 }}>{selectedReg.registration_number}</p>
                                <div style={{ marginTop: 12 }}>{getStatusBadge(selectedReg.status)}</div>
                            </div>

                            <div style={{ display: 'grid', gap: '24px' }}>
                                <div style={{ display: 'flex', gap: 16 }}>
                                    <div style={{ color: 'var(--primary-color)', opacity: 0.6 }}><GraduationCap size={20} /></div>
                                    <div>
                                        <div style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1, fontWeight: 700 }}>Informasi Akademik</div>
                                        <div style={{ marginTop: 4, fontWeight: 600 }}>NISN: {selectedReg.nisn}</div>
                                        <div style={{ fontSize: '0.9rem', color: '#475569' }}>Asal: {selectedReg.asal_sekolah}</div>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: 16 }}>
                                    <div style={{ color: 'var(--primary-color)', opacity: 0.6 }}><Calendar size={20} /></div>
                                    <div>
                                        <div style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1, fontWeight: 700 }}>TTL & Identitas</div>
                                        <div style={{ marginTop: 4, fontWeight: 600 }}>{selectedReg.tempat_lahir || '-'}, {selectedReg.tgl_lahir ? new Date(selectedReg.tgl_lahir).toLocaleDateString('id-ID') : '-'}</div>
                                        <div style={{ fontSize: '0.9rem', color: '#475569' }}>{selectedReg.jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan'} • Agama: {selectedReg.agama || '-'}</div>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: 16 }}>
                                    <div style={{ color: 'var(--primary-color)', opacity: 0.6 }}><Phone size={20} /></div>
                                    <div>
                                        <div style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1, fontWeight: 700 }}>Kontak Darurat</div>
                                        <div style={{ marginTop: 4, fontWeight: 600 }}>Ortu: {selectedReg.telepon_ortu}</div>
                                        <div style={{ fontSize: '0.9rem', color: '#475569' }}>Siswa: {selectedReg.telepon_siswa || '-'}</div>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: 16 }}>
                                    <div style={{ color: 'var(--primary-color)', opacity: 0.6 }}><MapPin size={20} /></div>
                                    <div>
                                        <div style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1, fontWeight: 700 }}>Alamat Tinggal</div>
                                        <div style={{ marginTop: 4, fontWeight: 500, lineHeight: 1.6, color: '#475569' }}>{selectedReg.alamat_lengkap}</div>
                                    </div>
                                </div>
                            </div>

                            <div style={{ marginTop: '48px', padding: '24px', background: '#f8fafc', borderRadius: 20 }}>
                                <h4 style={{ margin: '0 0 16px', fontSize: '1rem', fontWeight: 800 }}>Tindakan Pengelola</h4>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                    <button
                                        className="btn"
                                        style={{ background: '#10b981', color: 'white', borderRadius: 12, height: 44, fontWeight: 600 }}
                                        onClick={() => handleUpdateStatus(selectedReg.id, 'approved')}
                                        disabled={selectedReg.status === 'approved'}
                                    >
                                        <CheckCircle size={18} /> Terima
                                    </button>
                                    <button
                                        className="btn"
                                        style={{ background: '#ef4444', color: 'white', borderRadius: 12, height: 44, fontWeight: 600 }}
                                        onClick={() => handleUpdateStatus(selectedReg.id, 'rejected')}
                                        disabled={selectedReg.status === 'rejected'}
                                    >
                                        <XCircle size={18} /> Tolak
                                    </button>
                                </div>
                                <button
                                    className="btn btn-outline"
                                    style={{ width: '100%', marginTop: 12, borderRadius: 12, height: 44, borderColor: '#e2e8f0', color: '#64748b' }}
                                    onClick={() => window.open(`https://wa.me/${selectedReg.telepon_ortu.replace(/^0/, '62')}`, '_blank')}
                                >
                                    <Send size={18} /> Hubungi via WhatsApp
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
