import { useState, useEffect } from 'react'
import { useApp } from '../context/AppContext'
import { Search, Filter, Trash2, CheckCircle, XCircle, Clock, Eye, Download, UserPlus, Users, GraduationCap, X, MapPin, Phone, Calendar, Send, RefreshCw } from 'lucide-react'
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
            <div className="page-header" style={{
                marginBottom: '32px',
                background: 'linear-gradient(135deg, var(--bg-card), #f8fafc)',
                padding: '32px',
                borderRadius: '24px',
                border: '1px solid var(--border-color)',
                display: 'flex',
                flexWrap: 'wrap',
                gap: 24,
                position: 'relative',
                overflow: 'hidden'
            }}>
                <div style={{ position: 'absolute', top: 0, right: 0, width: '300px', height: '100%', background: 'radial-gradient(circle at 100% 0%, var(--primary-color) 0%, transparent 70%)', opacity: 0.03, pointerEvents: 'none' }}></div>

                <div style={{ flex: 1, minWidth: '300px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: '16px' }}>
                        <div style={{ padding: '6px 16px', background: 'var(--primary-color)', color: 'white', borderRadius: '30px', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>Dashboard PPDB</div>
                        <div style={{ padding: '6px 16px', background: 'white', color: 'var(--text-color)', border: '1px solid var(--primary-color)', borderRadius: '30px', fontSize: '0.75rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Calendar size={14} className="text-primary" strokeWidth={3} /> T.A 2025/2026
                        </div>
                    </div>

                    <h1 style={{ fontSize: '2.5rem', fontWeight: 900, letterSpacing: '-1px', marginBottom: '8px', color: 'var(--text-color)', lineHeight: 1.2 }}>
                        Penerimaan Siswa Baru
                    </h1>
                    <p style={{ fontSize: '1.1rem', margin: 0, color: 'var(--text-color)', opacity: 1, fontWeight: 500, maxWidth: '600px', lineHeight: 1.6 }}>
                        Pusat kontrol strategis manajemen pendaftaran peserta didik baru. Pantau progres verifikasi dan kuota secara real-time.
                    </p>
                </div>

                <div className="actions" style={{ gap: 12, display: 'flex', alignItems: 'center', alignSelf: 'flex-end' }}>
                    <button
                        className="btn btn-outline"
                        style={{ borderRadius: 16, height: 48, padding: '0 24px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 10, transition: 'all 0.3s' }}
                        onClick={loadData}
                    >
                        <RefreshCw size={18} /> Muat Ulang
                    </button>
                    <button
                        className="btn btn-primary"
                        style={{
                            borderRadius: 16,
                            background: 'var(--primary-color)',
                            height: 48,
                            padding: '0 24px',
                            fontWeight: 700,
                            boxShadow: '0 10px 20px -5px rgba(99, 102, 241, 0.4)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10,
                            border: 'none'
                        }}
                        onClick={() => addToast('info', 'Segera Hadir', 'Ekspor Excel sedang dikembangkan')}
                    >
                        <Download size={20} strokeWidth={2.5} /> Ekspor Data
                    </button>
                </div>
            </div>

            {/* Compact & Modern Stats Section */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '32px' }}>
                {/* Total Pendaftar */}
                <div className="card" style={{ padding: '20px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '16px', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ padding: '12px', background: 'rgba(99, 102, 241, 0.08)', color: 'var(--primary-color)', borderRadius: '12px' }}>
                        <Users size={22} />
                    </div>
                    <div>
                        <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Total Pendaftar</div>
                        <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-color)', lineHeight: 1 }}>{stats.total}</div>
                    </div>
                    <Users size={40} style={{ position: 'absolute', right: -10, bottom: -10, opacity: 0.03, color: 'var(--primary-color)' }} />
                </div>

                {/* Menunggu Verifikasi */}
                <div className="card" style={{ padding: '20px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '16px', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ padding: '12px', background: 'rgba(245, 158, 11, 0.08)', color: '#f59e0b', borderRadius: '12px' }}>
                        <Clock size={22} />
                    </div>
                    <div>
                        <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Verifikasi</div>
                        <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#d97706', lineHeight: 1 }}>{stats.pending} <span style={{ fontSize: '0.85rem', fontWeight: 600, opacity: 0.7 }}>Menunggu</span></div>
                    </div>
                    <Clock size={40} style={{ position: 'absolute', right: -10, bottom: -10, opacity: 0.03, color: '#f59e0b' }} />
                </div>

                {/* Diterima */}
                <div className="card" style={{ padding: '20px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '16px', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ padding: '12px', background: 'rgba(16, 185, 129, 0.08)', color: '#10b981', borderRadius: '12px' }}>
                        <CheckCircle size={22} />
                    </div>
                    <div>
                        <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Diterima</div>
                        <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#059669', lineHeight: 1 }}>{stats.approved} <span style={{ fontSize: '0.85rem', fontWeight: 600, opacity: 0.7 }}>Siswa</span></div>
                    </div>
                    <CheckCircle size={40} style={{ position: 'absolute', right: -10, bottom: -10, opacity: 0.03, color: '#10b981' }} />
                </div>

                {/* Kuota Tersisa */}
                <div className="card" style={{ padding: '20px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', borderRadius: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '12px', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{ padding: '8px', background: 'var(--primary-color)', color: 'white', borderRadius: '8px' }}>
                                <GraduationCap size={16} />
                            </div>
                            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Sisa Kuota</div>
                        </div>
                        <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-color)' }}>{Math.max(0, 100 - stats.approved)} / 100</div>
                    </div>
                    <div style={{ width: '100%', height: '6px', background: 'var(--bg-hover)', borderRadius: '10px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${Math.min(100, ((stats.approved / 100) * 100))}%`, background: 'var(--primary-color)', borderRadius: '10px' }}></div>
                    </div>
                </div>
            </div>

            <div className="card" style={{ border: '1px solid var(--border-color)', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)', borderRadius: 16 }}>
                <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)', display: 'flex', gap: '20px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ flex: 1, minWidth: '300px', position: 'relative' }}>
                        <Search style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} size={18} />
                        <input
                            type="text"
                            className="form-control"
                            placeholder="Cari nama, NISN, atau No. Registrasi..."
                            style={{ paddingLeft: '48px', height: '44px', borderRadius: 12, background: 'var(--bg-hover)', border: '1px solid var(--border-color)' }}
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ padding: '8px 16px', background: 'var(--bg-hover)', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 10, border: '1px solid var(--border-color)' }}>
                            <Filter size={16} color="var(--text-muted)" />
                            <select style={{ border: 'none', background: 'transparent', fontWeight: 600, color: 'var(--text-color)', cursor: 'pointer', outline: 'none' }} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
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
                        <thead style={{ background: 'var(--bg-hover)' }}>
                            <tr>
                                <th style={{ padding: '16px 24px', color: 'var(--text-muted)', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase' }}>Waktu Daftar</th>
                                <th style={{ padding: '16px 24px', color: 'var(--text-muted)', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase' }}>No. Registrasi</th>
                                <th style={{ padding: '16px 24px', color: 'var(--text-muted)', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase' }}>Calon Siswa</th>
                                <th style={{ padding: '16px 24px', color: 'var(--text-muted)', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase' }}>Asal Sekolah</th>
                                <th style={{ padding: '16px 24px', color: 'var(--text-muted)', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase' }}>Status</th>
                                <th style={{ padding: '16px 24px', color: 'var(--text-muted)', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', textAlign: 'right' }}>Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="6" style={{ textAlign: 'center', padding: '100px 0', color: 'var(--text-muted)' }}>Memuat data pendaftaran...</td></tr>
                            ) : filteredData.length === 0 ? (
                                <tr><td colSpan="6" style={{ textAlign: 'center', padding: '100px 0' }}>
                                    <div style={{ opacity: 0.3, marginBottom: 15, color: 'var(--text-muted)' }}><UserPlus size={48} style={{ margin: '0 auto' }} /></div>
                                    <div style={{ color: 'var(--text-muted)', fontWeight: 500 }}>Tidak ada data pendaftaran ditemukan.</div>
                                </td></tr>
                            ) : filteredData.map(r => (
                                <tr key={r.id} style={{ transition: 'all 0.2s' }}>
                                    <td style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)' }}>
                                        <div style={{ fontWeight: 600 }}>{new Date(r.created_at).toLocaleDateString('id-ID')}</div>
                                        <div className="text-secondary" style={{ fontSize: '0.8rem' }}>{new Date(r.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</div>
                                    </td>
                                    <td style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)' }}>
                                        <span style={{ padding: '6px 12px', background: 'var(--bg-hover)', borderRadius: 8, fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-color)' }}>{r.registration_number}</span>
                                    </td>
                                    <td style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)' }}>
                                        <div style={{ fontWeight: 700, color: 'var(--text-color)' }}>{r.nama_lengkap}</div>
                                        <div className="text-secondary" style={{ fontSize: '0.85rem' }}>NISN: {r.nisn}</div>
                                    </td>
                                    <td style={{ padding: '20px 24px', color: 'var(--text-muted)', borderBottom: '1px solid var(--border-color)' }}>{r.asal_sekolah}</td>
                                    <td style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)' }}>{getStatusBadge(r.status)}</td>
                                    <td style={{ padding: '20px 24px', textAlign: 'right', borderBottom: '1px solid var(--border-color)' }}>
                                        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                                            <button className="btn-icon text-primary" onClick={() => setSelectedReg(r)} title="Lihat Detail">
                                                <Eye size={18} />
                                            </button>

                                            {r.status === 'pending' && (
                                                <>
                                                    <button className="btn-icon text-success" onClick={() => handleUpdateStatus(r.id, 'approved')} title="Terima">
                                                        <CheckCircle size={18} />
                                                    </button>
                                                    <button className="btn-icon text-danger" onClick={() => handleUpdateStatus(r.id, 'rejected')} title="Tolak">
                                                        <XCircle size={18} />
                                                    </button>
                                                </>
                                            )}

                                            <button className="btn-icon text-danger" onClick={() => handleDelete(r.id)} title="Hapus">
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div style={{ padding: '20px 24px', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div className="text-secondary" style={{ fontSize: '0.85rem' }}>
                        Menampilkan <strong style={{ color: 'var(--text-color)' }}>{filteredData.length}</strong> dari {registrations.length} pendaftar terdaftar
                    </div>
                </div>
            </div>

            {/* Detail Modal (Aligned with other modals) */}
            {selectedReg && (
                <div className="modal-backdrop">
                    <div className="modal" style={{ maxWidth: 600 }}>
                        <div className="modal-header">
                            <h3 style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <UserPlus size={20} className="text-primary" />
                                Detail Pendaftar
                            </h3>
                            <button className="btn-icon" onClick={() => setSelectedReg(null)}>×</button>
                        </div>

                        <div className="modal-body">
                            <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                                <div style={{ width: 80, height: 80, background: 'var(--bg-hover)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 15px', color: 'var(--text-muted)' }}>
                                    <UserPlus size={40} />
                                </div>
                                <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: '0 0 5px 0' }}>{selectedReg.nama_lengkap}</h2>
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', margin: 0, marginBottom: 10 }}>{selectedReg.registration_number}</p>
                                <div>{getStatusBadge(selectedReg.status)}</div>
                            </div>

                            <div className="grid-2" style={{ gap: '20px' }}>
                                <div className="card" style={{ padding: 16, border: '1px solid var(--border-color)', boxShadow: 'none' }}>
                                    <div style={{ display: 'flex', gap: 12 }}>
                                        <div style={{ color: 'var(--primary)', opacity: 0.8 }}><GraduationCap size={20} /></div>
                                        <div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1, fontWeight: 700 }}>Akademik</div>
                                            <div style={{ marginTop: 4, fontWeight: 600, fontSize: '0.95rem' }}>NISN: {selectedReg.nisn}</div>
                                            <div style={{ fontSize: '0.85rem', color: 'var(--text-color)', marginTop: 2 }}>Asal: {selectedReg.asal_sekolah}</div>
                                        </div>
                                    </div>
                                </div>

                                <div className="card" style={{ padding: 16, border: '1px solid var(--border-color)', boxShadow: 'none' }}>
                                    <div style={{ display: 'flex', gap: 12 }}>
                                        <div style={{ color: 'var(--primary)', opacity: 0.8 }}><Calendar size={20} /></div>
                                        <div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1, fontWeight: 700 }}>Identitas & Lahir</div>
                                            <div style={{ marginTop: 4, fontWeight: 600, fontSize: '0.95rem' }}>
                                                {selectedReg.tempat_lahir || '-'}, {selectedReg.tgl_lahir ? new Date(selectedReg.tgl_lahir).toLocaleDateString('id-ID') : '-'}
                                            </div>
                                            <div style={{ fontSize: '0.85rem', color: 'var(--text-color)', marginTop: 2 }}>
                                                {selectedReg.jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan'} • Agama: {selectedReg.agama || '-'}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="card" style={{ padding: 16, border: '1px solid var(--border-color)', boxShadow: 'none' }}>
                                    <div style={{ display: 'flex', gap: 12 }}>
                                        <div style={{ color: 'var(--primary)', opacity: 0.8 }}><Phone size={20} /></div>
                                        <div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1, fontWeight: 700 }}>Kontak Darurat</div>
                                            <div style={{ marginTop: 4, fontWeight: 600, fontSize: '0.95rem' }}>Ortu: {selectedReg.telepon_ortu}</div>
                                            <div style={{ fontSize: '0.85rem', color: 'var(--text-color)', marginTop: 2 }}>Siswa: {selectedReg.telepon_siswa || '-'}</div>
                                        </div>
                                    </div>
                                </div>

                                <div className="card" style={{ padding: 16, border: '1px solid var(--border-color)', boxShadow: 'none' }}>
                                    <div style={{ display: 'flex', gap: 12 }}>
                                        <div style={{ color: 'var(--primary)', opacity: 0.8 }}><MapPin size={20} /></div>
                                        <div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1, fontWeight: 700 }}>Alamat Tinggal</div>
                                            <div style={{ marginTop: 4, fontWeight: 500, lineHeight: 1.5, fontSize: '0.85rem', color: 'var(--text-color)' }}>
                                                {selectedReg.alamat_lengkap}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="modal-footer" style={{ flexWrap: 'wrap', gap: 10, justifyContent: 'space-between', background: 'var(--bg-hover)' }}>
                            <button
                                className="btn btn-outline"
                                style={{ borderRadius: 8, height: 38, display: 'flex', alignItems: 'center', gap: 8 }}
                                onClick={() => window.open(`https://wa.me/${selectedReg.telepon_ortu.replace(/^0/, '62')}`, '_blank')}
                            >
                                <Send size={16} /> WA Orang Tua
                            </button>

                            <div style={{ display: 'flex', gap: 10 }}>
                                <button
                                    className="btn btn-success"
                                    onClick={() => handleUpdateStatus(selectedReg.id, 'approved')}
                                    disabled={selectedReg.status === 'approved'}
                                    style={{ borderRadius: 8, display: 'flex', alignItems: 'center', gap: 6 }}
                                >
                                    <CheckCircle size={16} /> Terima
                                </button>
                                <button
                                    className="btn btn-danger"
                                    onClick={() => handleUpdateStatus(selectedReg.id, 'rejected')}
                                    disabled={selectedReg.status === 'rejected'}
                                    style={{ borderRadius: 8, display: 'flex', alignItems: 'center', gap: 6 }}
                                >
                                    <XCircle size={16} /> Tolak
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
