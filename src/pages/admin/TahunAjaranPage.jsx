import { useState, useEffect } from 'react'
import { Calendar, CheckCircle2, Plus, Users, Shield,   Loader2,  X } from 'lucide-react'
import Modal from '../../components/Modal'
import api from '../../services/api'
import { useCustomAlert } from '../../hooks/useCustomAlert'

const STYLES = /*css*/`
  .ta-page { animation: fadeIn 0.5s ease-out; }
  @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

  .ta-card {
    background: var(--bg-card); border: 1px solid var(--border-color);
    border-radius: 24px; padding: 24px; margin-bottom: 24px;
    box-shadow: var(--shadow-sm); transition: all 0.3s ease;
  }
  .ta-card:hover { border-color: var(--primary-300); box-shadow: var(--shadow-md); }

  .ta-header {
    display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;
  }
  .ta-title { display: flex; align-items: center; gap: 12px; }
  .ta-title h3 { margin: 0; font-size: 1.25rem; font-weight: 800; color: var(--text-primary); }

  .semester-pill {
    display: flex; background: var(--bg-base); padding: 4px; border-radius: 12px;
    border: 1px solid var(--border-color);
  }
  .sem-btn {
    padding: 6px 16px; border-radius: 8px; border: none; font-size: 0.8rem;
    font-weight: 700; cursor: pointer; transition: all 0.2s; background: transparent; color: var(--text-secondary);
  }
  .sem-btn.active { background: var(--primary-600); color: white; box-shadow: 0 2px 6px rgba(59,130,246,0.3); }

  .grid-ta { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px; }

  .badge-ta {
    padding: 4px 10px; border-radius: 8px; font-size: 0.75rem; font-weight: 700;
  }
  .badge-ta.aktif { background: var(--success-50); color: var(--success-600); border: 1px solid var(--success-100); }
  .badge-ta.nonaktif { background: var(--bg-body); color: var(--text-muted); border: 1px solid var(--border-color); }

  /* Wali Kelas List */
  .wk-item {
    display: flex; align-items: center; justify-content: space-between;
    padding: 12px 16px; border-radius: 16px; border: 1px solid var(--border-color);
    margin-bottom: 8px; transition: all 0.2s;
  }
  .wk-item:hover { background: var(--bg-hover); border-color: var(--primary-200); }
  .wk-info { display: flex; flex-direction: column; }
  .wk-class { font-weight: 800; font-size: 0.9rem; color: var(--text-primary); }
  .wk-teacher { font-size: 0.8rem; color: var(--text-secondary); }

  .btn-circle {
    width: 32px; height: 32px; border-radius: 50%; border: none;
    display: flex; align-items: center; justify-content: center;
    background: var(--bg-base); color: var(--text-muted); cursor: pointer; transition: all 0.2s;
  }
  .btn-circle:hover { background: var(--danger-50); color: #ef4444; }
`

export default function TahunAjaranPage() {
    const { confirmAction } = useCustomAlert()
    const { showAlert } = useCustomAlert()
    const [loading, setLoading] = useState(true)
    const [taList, setTaList] = useState([])
    const [showTAModal, setShowTAModal] = useState(false)
    const [showWKModal, setShowWKModal] = useState(false)
    const [newTA, setNewTA] = useState({ tahun: '', tanggal_mulai: '', tanggal_selesai: '' })
    const [editingTA, setEditingTA] = useState(null)

    // Wali Kelas assignment state
    const [selectedTA, setSelectedTA] = useState(null)
    const [waliKelasList, setWaliKelasList] = useState([])
    const [teachers, setTeachers] = useState([])
    const [classes, setClasses] = useState([])
    const [assignForm, setAssignForm] = useState({ kelas_id: '', guru_id: '' })

    useEffect(() => { loadData() }, [])

    const loadData = async () => {
        try {
            setLoading(true)
            const [resTA, resTeachers, resClasses] = await Promise.all([
                api.get('/tahun-ajaran'),
                api.get('/admin/guru'),
                api.get('/kelas')
            ])
            setTaList(resTA.data)
            setTeachers(resTeachers.data)
            setClasses(resClasses.data)
            setLoading(false)
        } catch { setLoading(false) }
    }

    const handleSetAktif = async (id, tahun) => {
        const isConfirmed = await confirmAction({
            title: `Aktifkan Tahun Ajaran ${tahun}?`,
            text: "Tahun ajaran yang sedang aktif akan otomatis dinonaktifkan. Pastikan data transaksi dan jadwal sudah sesuai.",
            icon: 'warning',
            confirmText: 'Ya, Aktifkan'
        })

        if (!isConfirmed) return

        try {
            await api.put(`/tahun-ajaran/${id}/status`)
            loadData()
            showAlert('Berhasil', 'Tahun ajaran aktif diperbarui', 'success')
        } catch { showAlert('Error', 'Gagal memperbarui status', 'error') }
    }

    const handleSetSemester = async (id, semester) => {
        try {
            await api.put(`/tahun-ajaran/${id}/semester`, { semester_aktif: semester })
            setTaList(prev => prev.map(t => t.id === id ? { ...t, semester_aktif: semester } : t))
            showAlert('Berhasil', `Semester aktif diubah ke ${semester}`, 'success')
        } catch { showAlert('Error', 'Gagal memperbarui semester', 'error') }
    }

    const handleAddTA = async () => {
        if (!newTA.tahun) return
        try {
            await api.post('/tahun-ajaran', newTA)
            setNewTA({ tahun: '', tanggal_mulai: '', tanggal_selesai: '' })
            setShowTAModal(false)
            loadData()
            showAlert('Berhasil', 'Tahun ajaran baru ditambahkan', 'success')
        } catch { showAlert('Error', 'Gagal menambah tahun ajaran', 'error') }
    }

    const handleEditTA = async () => {
        if (!editingTA?.tahun) return
        try {
            await api.put(`/tahun-ajaran/${editingTA.id}`, editingTA)
            setEditingTA(null)
            loadData()
            showAlert('Berhasil', 'Data tahun ajaran diperbarui', 'success')
        } catch { showAlert('Error', 'Gagal memperbarui data', 'error') }
    }

    // Wali Kelas functions
    const openWaliKelas = async (ta) => {
        setSelectedTA(ta)
        try {
            const res = await api.get('/wali-kelas', { params: { tahun_ajaran_id: ta.id } })
            setWaliKelasList(res.data)
            setShowWKModal(true)
        } catch (err) {
            console.error(err);
            showAlert('Error', 'Gagal memuat data wali kelas', 'error')
        }
    }

    const handleAssignWali = async (e) => {
        e.preventDefault()
        if (!assignForm.guru_id || !assignForm.kelas_id) return showAlert('Peringatan', 'Lengkapi data wali kelas', 'warning')

        try {
            setLoading(true)
            await api.post('/wali-kelas', {
                guru_id: assignForm.guru_id,
                kelas_id: assignForm.kelas_id,
                tahun_ajaran_id: selectedTA?.id
            })
            showAlert('Berhasil', 'Wali kelas ditugaskan', 'success')
            openWaliKelas(selectedTA) // Refresh list
            setAssignForm({ kelas_id: '', guru_id: '' })
        } catch {
            showAlert('Error', 'Gagal menugaskan wali kelas', 'error')
        } finally { setLoading(false) }
    }

    const handleRemoveWali = async (id) => {
        try {
            await api.delete(`/wali-kelas/${id}`)
            setWaliKelasList(prev => prev.filter(w => w.id !== id))
        } catch { showAlert('Error', 'Gagal menghapus penugasan', 'error') }
    }

    if (loading) return <div className="ta-page"><style>{STYLES}</style><div className="empty-state"><Loader2 className="spin" /></div></div>

    return (
        <div className="ta-page">
            <style>{STYLES}</style>

            <div className="page-header" style={{ marginBottom: 32 }}>
                <div>
                    <h1 className="fw-black text-primary mb-1">Pengaturan Akademik</h1>
                    <p className="text-muted fw-medium">Kelola tahun ajaran, semester aktif, dan penugasan Wali Kelas.</p>
                </div>
                <button className="btn btn-primary shadow-sm" style={{ borderRadius: 14, padding: '12px 24px' }} onClick={() => setShowTAModal(true)}>
                    <Plus size={18} className="me-2" /> Tambah Tahun Ajaran
                </button>
            </div>

            <div className="grid-ta">
                {taList.map(t => (
                    <div key={t.id} className="ta-card">
                        <div className="ta-header">
                            <div className="ta-title">
                                <div style={{ background: t.status === 'aktif' ? 'var(--primary-100)' : 'var(--bg-body)', padding: 10, borderRadius: 12, color: t.status === 'aktif' ? 'var(--primary-600)' : 'var(--text-muted)' }}>
                                    <Calendar size={20} />
                                </div>
                                <div>
                                    <h3>{t.tahun}</h3>
                                    <span className={`badge-ta ${t.status === 'aktif' ? 'aktif' : 'nonaktif'}`}>
                                        {t.status === 'aktif' ? '● Aktif Sekarang' : 'Nonaktif'}
                                    </span>
                                    {t.tanggal_mulai && (
                                        <div className="text-muted mt-2" style={{ fontSize: '0.7rem' }}>
                                            {new Date(t.tanggal_mulai).toLocaleDateString('id-ID')} - {t.tanggal_selesai ? new Date(t.tanggal_selesai).toLocaleDateString('id-ID') : '...'}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="d-flex align-items-center gap-2">
                                <button className="btn-circle" onClick={() => setEditingTA({...t, tanggal_mulai: t.tanggal_mulai?.split('T')[0], tanggal_selesai: t.tanggal_selesai?.split('T')[0]})}>
                                    <Shield size={16} />
                                </button>
                                {t.status === 'aktif' && (
                                    <div className="semester-pill">
                                        <button className={`sem-btn ${t.semester_aktif === 'Ganjil' ? 'active' : ''}`} onClick={() => handleSetSemester(t.id, 'Ganjil')}>Ganjil</button>
                                        <button className={`sem-btn ${t.semester_aktif === 'Genap' ? 'active' : ''}`} onClick={() => handleSetSemester(t.id, 'Genap')}>Genap</button>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
                            {t.status !== 'aktif' ? (
                                <button className="btn btn-ghost w-100" style={{ color: 'var(--success-600)', background: 'var(--success-50)', borderRadius: 12 }} onClick={() => handleSetAktif(t.id, t.tahun)}>
                                    <CheckCircle2 size={16} className="me-2" /> Aktifkan Tahun Ini
                                </button>
                            ) : (
                                <button className="btn btn-ghost w-100" style={{ color: 'var(--primary-600)', background: 'var(--primary-50)', borderRadius: 12 }} onClick={() => openWaliKelas(t)}>
                                    <Users size={16} className="me-2" /> Atur Wali Kelas
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Add TA Modal */}
            {showTAModal && (
                <Modal title="Tahun Ajaran Baru" onClose={() => setShowTAModal(false)} footer={
                    <div className="d-flex gap-2 justify-content-end">
                        <button className="btn btn-ghost" onClick={() => setShowTAModal(false)}>Batal</button>
                        <button className="btn btn-primary" onClick={handleAddTA}>Simpan</button>
                    </div>
                }>
                    <div className="form-group mb-3">
                        <label className="fw-bold mb-2 small text-uppercase">Tahun Ajaran</label>
                        <input className="form-control" placeholder="Contoh: 2026/2027" value={newTA.tahun} onChange={e => setNewTA({ ...newTA, tahun: e.target.value })} autoFocus />
                    </div>
                    <div className="row">
                        <div className="col-md-6 form-group">
                            <label className="fw-bold mb-2 small text-uppercase">Tanggal Mulai</label>
                            <input type="date" className="form-control" value={newTA.tanggal_mulai} onChange={e => setNewTA({ ...newTA, tanggal_mulai: e.target.value })} />
                        </div>
                        <div className="col-md-6 form-group">
                            <label className="fw-bold mb-2 small text-uppercase">Tanggal Selesai</label>
                            <input type="date" className="form-control" value={newTA.tanggal_selesai} onChange={e => setNewTA({ ...newTA, tanggal_selesai: e.target.value })} />
                        </div>
                    </div>
                    <p className="small text-muted mt-3">Tahun ajaran baru akan diset sebagai Ganjil secara default.</p>
                </Modal>
            )}

            {/* Edit TA Modal */}
            {editingTA && (
                <Modal title="Ubah Tahun Ajaran" onClose={() => setEditingTA(null)} footer={
                    <div className="d-flex gap-2 justify-content-end">
                        <button className="btn btn-ghost" onClick={() => setEditingTA(null)}>Batal</button>
                        <button className="btn btn-primary" onClick={handleEditTA}>Simpan</button>
                    </div>
                }>
                    <div className="form-group mb-3">
                        <label className="fw-bold mb-2 small text-uppercase">Tahun Ajaran</label>
                        <input className="form-control" placeholder="Contoh: 2026/2027" value={editingTA.tahun} onChange={e => setEditingTA({ ...editingTA, tahun: e.target.value })} />
                    </div>
                    <div className="row">
                        <div className="col-md-6 form-group">
                            <label className="fw-bold mb-2 small text-uppercase">Tanggal Mulai</label>
                            <input type="date" className="form-control" value={editingTA.tanggal_mulai || ''} onChange={e => setEditingTA({ ...editingTA, tanggal_mulai: e.target.value })} />
                        </div>
                        <div className="col-md-6 form-group">
                            <label className="fw-bold mb-2 small text-uppercase">Tanggal Selesai</label>
                            <input type="date" className="form-control" value={editingTA.tanggal_selesai || ''} onChange={e => setEditingTA({ ...editingTA, tanggal_selesai: e.target.value })} />
                        </div>
                    </div>
                </Modal>
            )}

            {/* Wali Kelas Modal */}
            {showWKModal && (
                <Modal title={`Wali Kelas ${selectedTA?.tahun}`} width={600} onClose={() => setShowWKModal(false)}>
                    <div style={{ marginBottom: 24 }}>
                        <h6 className="fw-bold small text-uppercase mb-3" style={{ color: 'var(--primary-600)' }}>Tambah Penugasan</h6>
                        <div className="d-flex gap-2">
                            <select className="form-select" value={assignForm.kelas_id} onChange={e => setAssignForm({ ...assignForm, kelas_id: e.target.value })}>
                                <option value="">Pilih Kelas...</option>
                                {classes.map(c => <option key={c.id} value={c.id}>{c.nama}</option>)}
                            </select>
                            <select className="form-select" value={assignForm.guru_id} onChange={e => setAssignForm({ ...assignForm, guru_id: e.target.value })}>
                                <option value="">Pilih Guru...</option>
                                {teachers.map(g => <option key={g.id} value={g.id}>{g.nama}</option>)}
                            </select>
                            <button className="btn btn-primary" onClick={handleAssignWali}><Plus size={18} /></button>
                        </div>
                    </div>

                    <h6 className="fw-bold small text-uppercase mb-3">Daftar Wali Kelas</h6>
                    {waliKelasList.length === 0 ? (
                        <div className="text-center py-4 text-muted small">Belum ada wali kelas yang ditugaskan.</div>
                    ) : (
                        <div style={{ maxHeight: '300px', overflowY: 'auto', paddingRight: 4 }}>
                            {waliKelasList.map(w => (
                                <div key={w.id} className="wk-item">
                                    <div className="wk-info">
                                        <span className="wk-class">{w.kelas_nama}</span>
                                        <span className="wk-teacher">{w.guru_nama}</span>
                                    </div>
                                    <button className="btn-circle" onClick={() => handleRemoveWali(w.id)}><X size={16} /></button>
                                </div>
                            ))}
                        </div>
                    )}
                </Modal>
            )}
        </div>
    )
}
