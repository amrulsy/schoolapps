import { useState, useRef, useEffect } from 'react'
import { useApp } from '../../context/AppContext'
import { Search, CreditCard, User, Trash2 } from 'lucide-react'
import { usePagination } from '../../hooks/usePagination'
import EmptyState from '../../components/EmptyState'
import api from '../../services/api'

export default function RfidEnrollment({ hideHeader = false }) {
    const { students, setStudents, units, addToast } = useApp()
    const [search, setSearch] = useState('')
    const [filterKelas, setFilterKelas] = useState('')
    const [enrollModal, setEnrollModal] = useState({ show: false, student: null, rfid: '' })
    const rfidInputRef = useRef(null)

    const allKelas = units.flatMap(u => u.kelas)
    const filtered = (students || []).filter(s => {
        const nameMatch = (s.nama || '').toLowerCase().includes(search.toLowerCase())
        const nisnMatch = (s.nisn || '').includes(search)
        const rfidMatch = (s.rfid_uid || '').toLowerCase().includes(search.toLowerCase())
        const matchSearch = nameMatch || nisnMatch || rfidMatch
        const matchKelas = !filterKelas || s.kelas === filterKelas
        return matchSearch && matchKelas
    })

    const { paginated, page, setPage, totalPages } = usePagination(filtered, 10)

    useEffect(() => {
        if (enrollModal.show && rfidInputRef.current) {
            rfidInputRef.current.focus()
        }
    }, [enrollModal.show])

    useEffect(() => {
        setPage(1)
    }, [search, filterKelas, setPage])

    const handleEnroll = async (e) => {
        e.preventDefault()
        if (!enrollModal.rfid) return

        try {
            const { data } = await api.put(`/students/${enrollModal.student.id}/rfid`, {
                rfid_uid: enrollModal.rfid
            })
            if (data.success) {
                addToast('success', 'Berhasil', `RFID berhasil didaftarkan untuk ${enrollModal.student.nama}`)
                setStudents(prev => prev.map(s => s.id === enrollModal.student.id ? { ...s, rfid_uid: enrollModal.rfid } : s))
                setEnrollModal({ show: false, student: null, rfid: '' })
            } else {
                addToast('danger', 'Gagal', data.error || 'Terjadi kesalahan')
                setEnrollModal(prev => ({ ...prev, rfid: '' }))
            }
        } catch (err) {
            console.error('[RFID Enroll Error]', err)
            const errorMsg = err.response?.data?.error || err.message || 'Gagal menghubungi server'
            addToast('danger', 'Error', errorMsg)
        }
    }

    const handleClearRfid = async (student) => {
        if (!window.confirm(`Hapus pendaftaran RFID untuk ${student.nama}?`)) return

        try {
            const { data } = await api.put(`/students/${student.id}/rfid`, { rfid_uid: '' })
            if (data.success) {
                addToast('success', 'Berhasil', `RFID berhasil dikosongkan untuk ${student.nama}`)
                setStudents(prev => prev.map(s => s.id === student.id ? { ...s, rfid_uid: null } : s))
            } else {
                addToast('danger', 'Gagal', data.error || 'Terjadi kesalahan')
            }
        } catch (err) {
            console.error('[RFID Clear Error]', err)
            addToast('danger', 'Error', 'Gagal menghubungi server')
        }
    }

    return (
        <div className={`${hideHeader ? '' : 'admin-page'} animate-fadeIn p-4`}>
            {!hideHeader && (
                <div className="d-flex justify-content-between align-items-center mb-4 bg-white p-4 rounded-4 shadow-sm border">
                    <div className="d-flex align-items-center gap-3">
                        <div className="p-3 bg-primary-100 text-primary-600 rounded-3">
                            <CreditCard size={32} />
                        </div>
                        <div>
                            <h2 className="mb-0 fw-bold">Registrasi Kartu RFID</h2>
                            <p className="text-muted small mb-0">Hubungkan kartu RFID dengan data identitas siswa.</p>
                        </div>
                    </div>
                </div>
            )}

            <div className="card border-0 shadow-sm rounded-4 mb-4">
                <div className="card-body p-4">
                    <div className="row g-3">
                        <div className="col-md-8">
                            <div className="position-relative">
                                <Search className="position-absolute top-50 translate-middle-y ms-3 text-muted" size={18} />
                                <input
                                    type="text"
                                    placeholder="Cari nama, NISN, atau ID RFID..."
                                    className="form-control ps-5 py-3 rounded-3 border-light bg-light"
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="col-md-4">
                            <select
                                className="form-select py-3 rounded-3 border-light bg-light"
                                value={filterKelas}
                                onChange={e => setFilterKelas(e.target.value)}
                            >
                                <option value="">Semua Kelas</option>
                                {allKelas.map(k => <option key={k.id} value={k.nama}>{k.nama}</option>)}
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            {filtered.length === 0 ? (
                <EmptyState icon={User} title="Tidak Ditemukan" message="Siswa tidak ditemukan." />
            ) : (
                <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
                    <div className="table-responsive">
                        <table className="table table-hover align-middle mb-0">
                            <thead className="bg-light">
                                <tr>
                                    <th className="px-4 py-3">Siswa</th>
                                    <th className="py-3 text-center">RFID UID</th>
                                    <th className="py-3 text-end px-4">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginated.map(s => (
                                    <tr key={s.id}>
                                        <td className="px-4">
                                            <div className="d-flex align-items-center gap-3">
                                                <div className="bg-light rounded-2 d-flex align-items-center justify-content-center fw-bold text-primary" style={{ width: 40, height: 40 }}>
                                                    {s.nama.charAt(0)}
                                                </div>
                                                <div>
                                                    <div className="fw-bold">{s.nama}</div>
                                                    <div className="text-muted small">{s.nisn} • {s.kelas}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="text-center">
                                            {s.rfid_uid ? (
                                                <span className="badge bg-success-100 text-success-700 font-mono px-3 py-2 rounded-pill">
                                                    {s.rfid_uid}
                                                </span>
                                            ) : (
                                                <span className="text-muted small italic">Belum terdaftar</span>
                                            )}
                                        </td>
                                        <td className="text-end px-4">
                                            <div className="d-flex align-items-center justify-content-end gap-2">
                                                {s.rfid_uid && (
                                                    <button
                                                        className="btn btn-sm btn-outline-danger rounded-circle p-2"
                                                        onClick={() => handleClearRfid(s)}
                                                        title="Hapus RFID"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                )}
                                                <button
                                                    className={`btn btn-sm rounded-pill px-4 ${s.rfid_uid ? 'btn-outline-primary' : 'btn-primary'}`}
                                                    onClick={() => setEnrollModal({ show: true, student: s, rfid: '' })}
                                                >
                                                    {s.rfid_uid ? 'Ganti Kartu' : 'Daftarkan'}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {totalPages > 1 && (
                        <div className="card-footer bg-white p-3 border-0 border-top">
                            <div className="d-flex align-items-center justify-content-between">
                                <span className="text-muted small fw-bold">Halaman {page} dari {totalPages}</span>
                                <div className="btn-group shadow-sm">
                                    <button 
                                        className="btn btn-sm btn-light border text-dark fw-bold px-3" 
                                        disabled={page === 1} 
                                        onClick={() => setPage(p => p - 1)}
                                    >
                                        Sebelumnya
                                    </button>
                                    <button 
                                        className="btn btn-sm btn-light border text-dark fw-bold px-3" 
                                        disabled={page === totalPages} 
                                        onClick={() => setPage(p => p + 1)}
                                    >
                                        Selanjutnya
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Modal Scanner */}
            {enrollModal.show && (
                <div className="modal-backdrop fade show" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1050 }}>
                    <div className="bg-white rounded-5 shadow-2xl p-5 border text-center animate-bounceIn" style={{ maxWidth: 500, width: '90%' }}>
                        <div className="mb-4">
                            <div className="p-4 bg-primary-50 rounded-circle d-inline-block text-primary animate-pulse mb-3">
                                <CreditCard size={64} />
                            </div>
                            <h3 className="fw-black mb-1">Tempelkan Kartu</h3>
                            <p className="text-muted">Menunggu input dari alat scanner RFID untuk siswa:<br /><strong className="text-primary">{enrollModal.student?.nama}</strong></p>
                        </div>

                        <form onSubmit={handleEnroll}>
                            <input
                                ref={rfidInputRef}
                                type="text"
                                className="form-control text-center py-3 fs-3 fw-bold bg-light border-0 mb-4"
                                placeholder="..."
                                value={enrollModal.rfid}
                                onChange={e => setEnrollModal(prev => ({ ...prev, rfid: e.target.value }))}
                                autoComplete="off"
                            />
                            <div className="d-flex gap-2">
                                <button type="button" className="btn btn-light py-3 grow rounded-3" onClick={() => setEnrollModal({ show: false, student: null, rfid: '' })}>Batal</button>
                                <button type="submit" className="btn btn-primary py-3 grow rounded-3" disabled={!enrollModal.rfid}>Hubungkan Kartu</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
