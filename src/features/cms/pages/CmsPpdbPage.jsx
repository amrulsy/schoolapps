import { useState, useEffect } from 'react'
import { useApp } from '../../../context/AppContext'
import { Search, Filter, Trash2, CheckCircle, XCircle, Clock, Eye, Download, UserPlus, Users, GraduationCap, X, MapPin, Phone, Calendar, Send, RefreshCw, ListOrdered, CheckCircle2, Edit2, Plus, Layers, Save, Settings } from 'lucide-react'
import Swal from 'sweetalert2'
import { useCustomAlert } from '../../../hooks/useCustomAlert'

import { API_BASE_CMS as API_BASE, getAuthHeaders, getBearerHeader } from '../../../services/api'

export default function CmsPpdbPage() {
    const { addToast } = useApp()
    const { confirmDelete } = useCustomAlert()
    const [activeMainTab, setActiveMainTab] = useState('registrations') // 'registrations', 'steps', 'requirements', 'settings'
    const [registrations, setRegistrations] = useState([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [filterStatus, setFilterStatus] = useState('all')
    const [selectedReg, setSelectedReg] = useState(null)

    // Steps state
    const [steps, setSteps] = useState([])
    const [showStepModal, setShowStepModal] = useState(false)
    const [editStep, setEditStep] = useState(null)
    const [stepForm, setStepForm] = useState({ step_number: '01', icon: '📋', title: '', description: '', sort_order: 0, is_active: 1 })
    const [savingStep, setSavingStep] = useState(false)

    // Requirements state
    const [requirements, setRequirements] = useState([])
    const [showReqModal, setShowReqModal] = useState(false)
    const [editReq, setEditReq] = useState(null)
    const [reqForm, setReqForm] = useState({ text: '', sort_order: 0, is_active: 1 })
    const [savingReq, setSavingReq] = useState(false)

    // Settings state
    const [settings, setSettings] = useState({
        ppdb_is_open: '1',
        ppdb_year: '2025/2026',
        ppdb_quota: '100',
        ppdb_contact_wa: '',
        ppdb_hero_title: 'Penerimaan Siswa Baru',
        ppdb_hero_subtitle: 'Pusat kontrol strategis manajemen pendaftaran peserta didik baru.'
    })
    const [savingSettings, setSavingSettings] = useState(false)

    const styles = `
        @media (max-width: 768px) {
            .cms-hero-header {
                flex-direction: column !important;
                align-items: flex-start !important;
                padding: 30px 20px !important;
                gap: 20px !important;
            }
            .cms-hero-header h1 {
                font-size: 1.8rem !important;
            }
            .cms-hero-actions {
                width: 100%;
                flex-direction: row !important;
            }
            .cms-hero-actions button, .cms-hero-actions a {
                flex: 1;
                justify-content: center;
                font-size: 0.85rem !important;
            }
            .cms-tab-nav {
                width: 100% !important;
                max-width: 100% !important;
                overflow-x: auto;
                white-space: nowrap;
                padding: 4px !important;
                display: flex !important;
                gap: 4px !important;
                scrollbar-width: none;
            }
            .cms-tab-nav::-webkit-scrollbar { display: none; }
            .cms-tab-btn {
                padding: 10px 16px !important;
                font-size: 0.85rem !important;
                flex-shrink: 0;
            }
            .cms-tab-btn span {
                display: inline-block !important;
            }
            .cms-section-card {
                padding: 1.25rem !important;
                border-radius: 20px !important;
            }
            .grid-2 {
                grid-template-columns: 1fr !important;
            }
            .table-responsive thead {
                display: none;
            }
            .table-responsive tr {
                display: block;
                padding: 1.5rem 0;
                border-bottom: 1px solid var(--border-color);
            }
            .table-responsive tr td {
                display: block !important;
                width: 100% !important;
                padding: 0.5rem 24px !important;
                border: none !important;
                text-align: left !important;
            }
            .table-responsive tr td:last-child {
                text-align: left !important;
                padding-top: 1rem !important;
            }
            .table-responsive tr td:last-child .d-flex {
                justify-content: flex-start !important;
            }
        }
    `;

    useEffect(() => {
        loadAll()
    }, [])

    const loadAll = async () => {
        setLoading(true)
        await Promise.all([loadData(), loadSteps(), loadRequirements(), loadSettings()])
        setLoading(false)
    }

    const loadData = async () => {
        try {
            setLoading(true)
            const res = await fetch(`${API_BASE}/ppdb`, {
                headers: getBearerHeader()
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
                headers: getAuthHeaders(),
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
                headers: getBearerHeader()
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

    // ==================== SETTINGS LOGIC ====================
    const loadSettings = async () => {
        try {
            const res = await fetch(`${API_BASE}/settings`, { headers: getAuthHeaders() })
            if (res.ok) {
                const data = await res.json()
                const map = { ...settings }
                data.forEach(s => {
                    if (s.setting_key.startsWith('ppdb_')) {
                        map[s.setting_key] = s.setting_value
                    }
                })
                setSettings(map)
            }
        } catch { /* silent */ }
    }

    const saveSettings = async (keys) => {
        setSavingSettings(true)
        try {
            const updates = keys.map(k => ({ setting_key: k, setting_value: String(settings[k] || '') }))
            const res = await fetch(`${API_BASE}/settings`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify({ updates })
            })
            if (res.ok) {
                addToast('success', 'Berhasil', 'Pengaturan PPDB disimpan')
            } else {
                addToast('danger', 'Gagal', 'Gagal menyimpan pengaturan')
            }
        } catch { addToast('danger', 'Error', 'Terjadi kesalahan') }
        finally { setSavingSettings(false) }
    }

    const handleSettingChange = (key, value) => {
        setSettings(prev => ({ ...prev, [key]: value }))
    }

    // ==================== STEPS LOGIC ====================
    const loadSteps = async () => {
        try {
            const res = await fetch(`${API_BASE}/ppdb-steps`, { headers: getAuthHeaders() })
            if (res.ok) setSteps(await res.json())
        } catch { /* silent */ }
    }

    const openStepModal = (s = null) => {
        setEditStep(s)
        setStepForm(s
            ? { step_number: s.step_number, icon: s.icon, title: s.title, description: s.description || '', sort_order: s.sort_order, is_active: s.is_active }
            : { step_number: `0${steps.length + 1}`.slice(-2), icon: '📋', title: '', description: '', sort_order: steps.length, is_active: 1 }
        )
        setShowStepModal(true)
    }

    const saveStep = async (e) => {
        e.preventDefault()
        setSavingStep(true)
        try {
            const url = editStep ? `${API_BASE}/ppdb-steps/${editStep.id}` : `${API_BASE}/ppdb-steps`
            const method = editStep ? 'PUT' : 'POST'
            const res = await fetch(url, { method, headers: getAuthHeaders(), body: JSON.stringify(stepForm) })
            if (res.ok) {
                addToast('success', 'Berhasil', `Langkah ${editStep ? 'diperbarui' : 'ditambahkan'}`)
                setShowStepModal(false)
                loadSteps()
            } else {
                const err = await res.json()
                addToast('danger', 'Gagal', err.error || 'Terjadi kesalahan')
            }
        } catch { addToast('danger', 'Error', 'Gagal menyimpan langkah') }
        finally { setSavingStep(false) }
    }

    const deleteStep = async (s) => {
        if (await confirmDelete(`Hapus langkah "${s.title}"?`, 'Data akan dihapus permanen.')) {
            try {
                const res = await fetch(`${API_BASE}/ppdb-steps/${s.id}`, { method: 'DELETE', headers: getAuthHeaders() })
                if (res.ok) { addToast('success', 'Berhasil', 'Langkah dihapus'); loadSteps() }
            } catch { addToast('danger', 'Error', 'Gagal menghapus') }
        }
    }

    // ==================== REQUIREMENTS LOGIC ====================
    const loadRequirements = async () => {
        try {
            const res = await fetch(`${API_BASE}/ppdb-requirements`, { headers: getAuthHeaders() })
            if (res.ok) setRequirements(await res.json())
        } catch { /* silent */ }
    }

    const openReqModal = (r = null) => {
        setEditReq(r)
        setReqForm(r
            ? { text: r.text, sort_order: r.sort_order, is_active: r.is_active }
            : { text: '', sort_order: requirements.length, is_active: 1 }
        )
        setShowReqModal(true)
    }

    const saveReq = async (e) => {
        e.preventDefault()
        setSavingReq(true)
        try {
            const url = editReq ? `${API_BASE}/ppdb-requirements/${editReq.id}` : `${API_BASE}/ppdb-requirements`
            const method = editReq ? 'PUT' : 'POST'
            const res = await fetch(url, { method, headers: getAuthHeaders(), body: JSON.stringify(reqForm) })
            if (res.ok) {
                addToast('success', 'Berhasil', `Syarat ${editReq ? 'diperbarui' : 'ditambahkan'}`)
                setShowReqModal(false)
                loadRequirements()
            } else {
                const err = await res.json()
                addToast('danger', 'Gagal', err.error || 'Terjadi kesalahan')
            }
        } catch { addToast('danger', 'Error', 'Gagal menyimpan syarat') }
        finally { setSavingReq(false) }
    }

    const deleteReq = async (r) => {
        if (await confirmDelete(`Hapus syarat ini?`, 'Data akan dihapus permanen.')) {
            try {
                const res = await fetch(`${API_BASE}/ppdb-requirements/${r.id}`, { method: 'DELETE', headers: getAuthHeaders() })
                if (res.ok) { addToast('success', 'Berhasil', 'Syarat dihapus'); loadRequirements() }
            } catch { addToast('danger', 'Error', 'Gagal menghapus') }
        }
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
            <style dangerouslySetInnerHTML={{ __html: styles }} />
            <div className="page-header cms-hero-header">
                <div className="cms-hero-overlay"></div>

                <div style={{ flex: 1, minWidth: '300px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: '16px' }}>
                        <div className="cms-hero-badge">Manajemen PPDB</div>
                        <div className="cms-hero-badge-outline">
                            <Calendar size={14} className="text-primary" strokeWidth={3} /> T.A 2025/2026
                        </div>
                    </div>

                    <h1 style={{ fontSize: '2.5rem', fontWeight: 900, letterSpacing: '-1px', marginBottom: '8px', color: 'var(--text-color)', lineHeight: 1.2 }}>
                        Penerimaan Siswa Baru
                    </h1>
                    <p style={{ fontSize: '1.1rem', margin: 0, color: 'var(--text-color)', opacity: 1, fontWeight: 500, maxWidth: '600px', lineHeight: 1.6 }}>
                        Pusat kontrol strategis manajemen pendaftaran dan konfigurasi alur PPDB.
                    </p>
                </div>

                <div className="cms-hero-actions">
                    <button className="btn btn-outline" style={{ height: 48, borderRadius: 14 }} onClick={loadAll}>
                        <RefreshCw size={18} className="mr-2" /> Refresh
                    </button>
                    <a href="/ppdb" target="_blank" rel="noreferrer" className="btn btn-primary" style={{ height: 48, borderRadius: 14 }}>
                        <Eye size={18} className="mr-2" /> Lihat Portal
                    </a>
                </div>
            </div>

            {/* Top-level Tab Navigation */}
            <div className="cms-tab-nav mb-4" style={{ maxWidth: 'fit-content' }}>
                <button
                    className={`cms-tab-btn ${activeMainTab === 'registrations' ? 'active' : ''}`}
                    onClick={() => setActiveMainTab('registrations')}
                >
                    <Users size={18} /> <span>Data Pendaftar</span>
                </button>
                <button
                    className={`cms-tab-btn ${activeMainTab === 'steps' ? 'active' : ''}`}
                    onClick={() => setActiveMainTab('steps')}
                >
                    <ListOrdered size={18} /> <span>Alur Pendaftaran</span>
                </button>
                <button
                    className={`cms-tab-btn ${activeMainTab === 'requirements' ? 'active' : ''}`}
                    onClick={() => setActiveMainTab('requirements')}
                >
                    <CheckCircle2 size={18} /> <span>Syarat Dokumen</span>
                </button>
                <button
                    className={`cms-tab-btn ${activeMainTab === 'settings' ? 'active' : ''}`}
                    onClick={() => setActiveMainTab('settings')}
                >
                    <Settings size={18} /> <span>Pengaturan</span>
                </button>
            </div>

            {/* Tab Content Area */}
            {activeMainTab === 'registrations' && (
                <div className="animate-fade-in">
                    {/* Stats Section */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '32px' }}>
                        <div className="card" style={{ padding: '20px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '16px', position: 'relative', overflow: 'hidden' }}>
                            <div style={{ padding: '12px', background: 'rgba(99, 102, 241, 0.08)', color: 'var(--primary-color)', borderRadius: '12px' }}>
                                <Users size={22} />
                            </div>
                            <div>
                                <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Total Pendaftar</div>
                                <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-color)', lineHeight: 1 }}>{stats.total}</div>
                            </div>
                        </div>

                        <div className="card" style={{ padding: '20px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '16px', position: 'relative', overflow: 'hidden' }}>
                            <div style={{ padding: '12px', background: 'rgba(245, 158, 11, 0.08)', color: '#f59e0b', borderRadius: '12px' }}>
                                <Clock size={22} />
                            </div>
                            <div>
                                <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Verifikasi</div>
                                <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#d97706', lineHeight: 1 }}>{stats.pending}</div>
                            </div>
                        </div>

                        <div className="card" style={{ padding: '20px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '16px', position: 'relative', overflow: 'hidden' }}>
                            <div style={{ padding: '12px', background: 'rgba(16, 185, 129, 0.08)', color: '#10b981', borderRadius: '12px' }}>
                                <CheckCircle size={22} />
                            </div>
                            <div>
                                <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Diterima</div>
                                <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#059669', lineHeight: 1 }}>{stats.approved}</div>
                            </div>
                        </div>

                        <div className="card" style={{ padding: '20px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', borderRadius: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '12px', position: 'relative', overflow: 'hidden' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <div style={{ padding: '8px', background: 'var(--primary-color)', color: 'white', borderRadius: '8px' }}>
                                        <GraduationCap size={16} />
                                    </div>
                                    <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Sisa Kuota</div>
                                </div>
                                <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-color)' }}>{Math.max(0, (parseInt(settings.ppdb_quota) || 100) - stats.approved)} / {settings.ppdb_quota}</div>
                            </div>
                            <div style={{ width: '100%', height: '6px', background: 'var(--bg-hover)', borderRadius: '10px', overflow: 'hidden' }}>
                                <div style={{ height: '100%', width: `${Math.min(100, ((stats.approved / (parseInt(settings.ppdb_quota) || 100)) * 100))}%`, background: 'var(--primary-color)', borderRadius: '10px' }}></div>
                            </div>
                        </div>
                    </div>

                    {/* Registration List Card */}
                    <div className="card cms-section-card" style={{ padding: 0 }}>
                        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)', display: 'flex', gap: '20px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ flex: 1, minWidth: 0, position: 'relative' }}>
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

                        <div className="table-responsive" style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                            <table className="table" style={{ margin: 0, minWidth: '800px' }}>
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
                    </div>
                </div>
            )}

            {activeMainTab === 'steps' && (
                <div className="cms-section-card animate-fade-in" style={{ padding: 32 }}>
                    {renderStepsTab()}
                </div>
            )}

            {activeMainTab === 'requirements' && (
                <div className="cms-section-card animate-fade-in" style={{ padding: 32 }}>
                    {renderRequirementsTab()}
                </div>
            )}

            {activeMainTab === 'settings' && (
                <div className="cms-section-card animate-fade-in" style={{ padding: 32 }}>
                    {renderSettingsTab()}
                </div>
            )}

            {/* Detail Modal (Candidate) */}
            {selectedReg && (
                <div className="modal-backdrop">
                    <div className="modal" style={{ maxWidth: 650 }}>
                        <div className="modal-header">
                            <h3 style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <UserPlus size={20} className="text-primary" />
                                Detail Pendaftar
                            </h3>
                            <button className="btn-icon" onClick={() => setSelectedReg(null)}>×</button>
                        </div>

                        <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
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

                        <div className="modal-footer" style={{ flexWrap: 'wrap', gap: 10, justifyContent: 'space-between', background: 'var(--bg-hover)', borderRadius: '0 0 20px 20px' }}>
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

            {/* Modals for Steps & Requirements */}
            {showStepModal && renderStepModal()}
            {showReqModal && renderReqModal()}
        </div>
    )

    // ==================== TAB RENDERS ====================

    function renderStepsTab() {
        return (
            <div>
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <div>
                        <h3 className="cms-section-title" style={{ fontSize: '1.4rem' }}>Alur Pendaftaran</h3>
                        <p className="text-secondary small m-0">Susun langkah-langkah yang harus dilalui calon siswa.</p>
                    </div>
                    <button className="btn btn-primary" style={{ borderRadius: 12, height: 42, marginLeft: 'auto' }} onClick={() => openStepModal()}>
                        <Plus size={18} /> Tambah Langkah
                    </button>
                </div>

                <div className="table-responsive" style={{ border: '1px solid var(--border-color)', borderRadius: 16, overflow: 'hidden' }}>
                    <table className="table" style={{ margin: 0 }}>
                        <thead style={{ background: 'var(--bg-hover)' }}>
                            <tr>
                                <th style={{ padding: '16px 24px', color: 'var(--text-muted)', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase' }} width="60">No</th>
                                <th style={{ padding: '16px 24px', color: 'var(--text-muted)', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase' }} width="60">Icon</th>
                                <th style={{ padding: '16px 24px', color: 'var(--text-muted)', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase' }}>Judul</th>
                                <th style={{ padding: '16px 24px', color: 'var(--text-muted)', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase' }}>Deskripsi</th>
                                <th style={{ padding: '16px 24px', color: 'var(--text-muted)', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', textAlign: 'center' }} width="80">Urutan</th>
                                <th style={{ padding: '16px 24px', color: 'var(--text-muted)', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', textAlign: 'center' }} width="80">Status</th>
                                <th style={{ padding: '16px 24px', color: 'var(--text-muted)', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', textAlign: 'right' }} width="100">Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {steps.length === 0 ? (
                                <tr><td colSpan="7" style={{ textAlign: 'center', padding: '100px 0', color: 'var(--text-muted)', fontWeight: 500 }}>Belum ada langkah pendaftaran</td></tr>
                            ) : steps.map(s => (
                                <tr key={s.id}>
                                    <td style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)' }}>
                                        <div style={{ fontWeight: 800, color: 'var(--primary-color)', fontSize: '1rem' }}>{s.step_number}</div>
                                    </td>
                                    <td style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)' }}>
                                        <div style={{ fontSize: '1.5rem', background: 'var(--bg-hover)', width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 10 }}>{s.icon}</div>
                                    </td>
                                    <td style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)' }}>
                                        <div style={{ fontWeight: 700, color: 'var(--text-color)' }}>{s.title}</div>
                                    </td>
                                    <td style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)' }}>
                                        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>{s.description}</span>
                                    </td>
                                    <td style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)', textAlign: 'center' }}>
                                        <span style={{ padding: '4px 10px', background: 'var(--bg-hover)', borderRadius: 6, fontWeight: 700, fontSize: '0.8rem', color: 'var(--text-color)' }}>{s.sort_order}</span>
                                    </td>
                                    <td style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)', textAlign: 'center' }}>
                                        <span className={`badge ${s.is_active ? 'badge-success' : 'badge-danger'}`} style={{ borderRadius: 6 }}>
                                            {s.is_active ? 'Aktif' : 'Nonaktif'}
                                        </span>
                                    </td>
                                    <td style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)', textAlign: 'right' }}>
                                        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                                            <button className="btn-icon text-primary" onClick={() => openStepModal(s)} title="Edit"><Edit2 size={16} /></button>
                                            <button className="btn-icon text-danger" onClick={() => deleteStep(s)} title="Hapus"><Trash2 size={16} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        )
    }

    function renderRequirementsTab() {
        return (
            <div>
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <div>
                        <h3 className="cms-section-title" style={{ fontSize: '1.4rem' }}>Syarat Dokumen</h3>
                        <p className="text-secondary small m-0">Daftar dokumen wajib yang harus diunggah pendaftar.</p>
                    </div>
                    <button className="btn btn-primary" style={{ borderRadius: 12, height: 42, marginLeft: 'auto' }} onClick={() => openReqModal()}>
                        <Plus size={18} /> Tambah Syarat
                    </button>
                </div>

                <div className="table-responsive" style={{ border: '1px solid var(--border-color)', borderRadius: 16, overflow: 'hidden' }}>
                    <table className="table" style={{ margin: 0 }}>
                        <thead style={{ background: 'var(--bg-hover)' }}>
                            <tr>
                                <th style={{ padding: '16px 24px', color: 'var(--text-muted)', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase' }}>Persyaratan / Dokumen</th>
                                <th style={{ padding: '16px 24px', color: 'var(--text-muted)', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', textAlign: 'center' }} width="80">Urutan</th>
                                <th style={{ padding: '16px 24px', color: 'var(--text-muted)', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', textAlign: 'center' }} width="80">Status</th>
                                <th style={{ padding: '16px 24px', color: 'var(--text-muted)', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', textAlign: 'right' }} width="100">Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {requirements.length === 0 ? (
                                <tr><td colSpan="4" style={{ textAlign: 'center', padding: '100px 0', color: 'var(--text-muted)', fontWeight: 500 }}>Belum ada syarat</td></tr>
                            ) : requirements.map(r => (
                                <tr key={r.id}>
                                    <td style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                            <div style={{ padding: 6, background: 'rgba(16, 185, 129, 0.1)', borderRadius: 8, color: '#10b981', display: 'flex' }}>
                                                <CheckCircle2 size={18} strokeWidth={2.5} />
                                            </div>
                                            <span style={{ fontWeight: 600, color: 'var(--text-color)', fontSize: '0.95rem' }}>{r.text}</span>
                                        </div>
                                    </td>
                                    <td style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)', textAlign: 'center' }}>
                                        <span style={{ padding: '4px 10px', background: 'var(--bg-hover)', borderRadius: 6, fontWeight: 700, fontSize: '0.8rem', color: 'var(--text-color)' }}>{r.sort_order}</span>
                                    </td>
                                    <td style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)', textAlign: 'center' }}>
                                        <span className={`badge ${r.is_active ? 'badge-success' : 'badge-danger'}`} style={{ borderRadius: 6 }}>
                                            {r.is_active ? 'Aktif' : 'Nonaktif'}
                                        </span>
                                    </td>
                                    <td style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)', textAlign: 'right' }}>
                                        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                                            <button className="btn-icon text-primary" onClick={() => openReqModal(r)} title="Edit"><Edit2 size={16} /></button>
                                            <button className="btn-icon text-danger" onClick={() => deleteReq(r)} title="Hapus"><Trash2 size={16} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        )
    }

    // ==================== MODALS ====================

    function renderStepModal() {
        return (
            <div className="modal-backdrop">
                <div className="modal" style={{ maxWidth: 500 }}>
                    <div className="modal-header">
                        <h3>{editStep ? 'Edit Langkah' : 'Tambah Langkah'}</h3>
                        <button className="btn-icon" onClick={() => setShowStepModal(false)}>×</button>
                    </div>
                    <div className="modal-body">
                        <form id="stepForm" onSubmit={saveStep}>
                            <div className="grid-2 mb-4">
                                <div className="form-group">
                                    <label>Nomor Langkah</label>
                                    <input type="text" className="form-control" value={stepForm.step_number} required
                                        onChange={e => setStepForm({ ...stepForm, step_number: e.target.value })}
                                        placeholder="01"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Icon / Emoji</label>
                                    <input type="text" className="form-control" value={stepForm.icon}
                                        onChange={e => setStepForm({ ...stepForm, icon: e.target.value })}
                                        placeholder="📋"
                                    />
                                </div>
                            </div>

                            <div className="form-group mb-4">
                                <label>Judul <span className="text-danger">*</span></label>
                                <input type="text" className="form-control" value={stepForm.title} required
                                    onChange={e => setStepForm({ ...stepForm, title: e.target.value })}
                                    placeholder="Daftar Online"
                                />
                            </div>

                            <div className="form-group mb-4">
                                <label>Deskripsi Singkat</label>
                                <textarea className="form-control" rows="2" value={stepForm.description}
                                    onChange={e => setStepForm({ ...stepForm, description: e.target.value })}
                                    placeholder="Isi formulir pendaftaran secara lengkap."
                                />
                            </div>

                            <div className="grid-2 mb-4">
                                <div className="form-group">
                                    <label>Urutan Tampil</label>
                                    <input type="number" className="form-control" value={stepForm.sort_order}
                                        onChange={e => setStepForm({ ...stepForm, sort_order: parseInt(e.target.value) || 0 })}
                                    />
                                </div>
                                <div className="form-group" style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: 10 }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', margin: 0 }}>
                                        <input
                                            type="checkbox"
                                            checked={stepForm.is_active !== 0}
                                            onChange={e => setStepForm({ ...stepForm, is_active: e.target.checked ? 1 : 0 })}
                                            style={{ width: 18, height: 18 }}
                                        />
                                        <span style={{ fontWeight: 600 }}>Aktif</span>
                                    </label>
                                </div>
                            </div>
                        </form>
                    </div>
                    <div className="modal-footer">
                        <button className="btn btn-secondary" onClick={() => setShowStepModal(false)} disabled={savingStep}>Batal</button>
                        <button type="submit" form="stepForm" className="btn btn-primary" disabled={savingStep}>
                            {savingStep ? 'Menyimpan...' : 'Simpan Langkah'}
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    function renderReqModal() {
        return (
            <div className="modal-backdrop">
                <div className="modal" style={{ maxWidth: 500 }}>
                    <div className="modal-header">
                        <h3>{editReq ? 'Edit Syarat' : 'Tambah Syarat'}</h3>
                        <button className="btn-icon" onClick={() => setShowReqModal(false)}>×</button>
                    </div>
                    <div className="modal-body">
                        <form id="reqForm" onSubmit={saveReq}>
                            <div className="form-group mb-4">
                                <label>Persyaratan Dokumen <span className="text-danger">*</span></label>
                                <input type="text" className="form-control" value={reqForm.text} required
                                    onChange={e => setReqForm({ ...reqForm, text: e.target.value })}
                                    placeholder="Contoh: Fotokopi Ijazah / SKL"
                                />
                            </div>

                            <div className="grid-2 mb-4">
                                <div className="form-group">
                                    <label>Urutan Tampil</label>
                                    <input type="number" className="form-control" value={reqForm.sort_order}
                                        onChange={e => setReqForm({ ...reqForm, sort_order: parseInt(e.target.value) || 0 })}
                                    />
                                </div>
                                <div className="form-group" style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: 10 }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', margin: 0 }}>
                                        <input
                                            type="checkbox"
                                            checked={reqForm.is_active !== 0}
                                            onChange={e => setReqForm({ ...reqForm, is_active: e.target.checked ? 1 : 0 })}
                                            style={{ width: 18, height: 18 }}
                                        />
                                        <span style={{ fontWeight: 600 }}>Aktif</span>
                                    </label>
                                </div>
                            </div>
                        </form>
                    </div>
                    <div className="modal-footer">
                        <button className="btn btn-secondary" onClick={() => setShowReqModal(false)} disabled={savingReq}>Batal</button>
                        <button type="submit" form="reqForm" className="btn btn-primary" disabled={savingReq}>
                            {savingReq ? 'Menyimpan...' : 'Simpan Syarat'}
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    function renderSettingsTab() {
        return (
            <div style={{ maxWidth: 800 }}>
                <div className="mb-5">
                    <h3 className="cms-section-title" style={{ fontSize: '1.4rem' }}>Konfigurasi PPDB</h3>
                    <p className="text-secondary small m-0">Atur status pendaftaran, kuota, dan tampilan portal PPDB.</p>
                </div>

                <div className="grid-2 mb-4" style={{ gap: 30 }}>
                    <div className="card p-4" style={{ background: 'var(--bg-hover)', border: '1px solid var(--border-color)', borderRadius: 20 }}>
                        <h4 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
                            <Settings size={18} className="text-primary" /> Status & Kuota
                        </h4>

                        <div className="form-group mb-4">
                            <label className="d-flex align-items-center gap-2 mb-2" style={{ fontWeight: 700, fontSize: '0.9rem' }}>
                                Status Pendaftaran
                            </label>
                            <div className="d-flex gap-3">
                                <button
                                    className={`btn ${settings.ppdb_is_open === '1' ? 'btn-success' : 'btn-outline'}`}
                                    style={{ flex: 1, borderRadius: 12, height: 44 }}
                                    onClick={() => handleSettingChange('ppdb_is_open', '1')}
                                >
                                    <CheckCircle size={18} className="mr-2" /> Buka
                                </button>
                                <button
                                    className={`btn ${settings.ppdb_is_open === '0' ? 'btn-danger' : 'btn-outline'}`}
                                    style={{ flex: 1, borderRadius: 12, height: 44 }}
                                    onClick={() => handleSettingChange('ppdb_is_open', '0')}
                                >
                                    <XCircle size={18} className="mr-2" /> Tutup
                                </button>
                            </div>
                        </div>

                        <div className="form-group mb-4">
                            <label style={{ fontWeight: 700, fontSize: '0.9rem' }}>Tahun Ajaran Target</label>
                            <input
                                type="text"
                                className="form-control"
                                value={settings.ppdb_year}
                                onChange={e => handleSettingChange('ppdb_year', e.target.value)}
                                placeholder="Contoh: 2025/2026"
                                style={{ borderRadius: 10, height: 44 }}
                            />
                        </div>

                        <div className="form-group mb-0">
                            <label style={{ fontWeight: 700, fontSize: '0.9rem' }}>Target Kuota (Siswa)</label>
                            <input
                                type="number"
                                className="form-control"
                                value={settings.ppdb_quota}
                                onChange={e => handleSettingChange('ppdb_quota', e.target.value)}
                                style={{ borderRadius: 10, height: 44 }}
                            />
                        </div>
                    </div>

                    <div className="card p-4" style={{ background: 'var(--bg-hover)', border: '1px solid var(--border-color)', borderRadius: 20 }}>
                        <h4 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
                            <Layers size={18} className="text-primary" /> Tampilan Portal
                        </h4>

                        <div className="form-group mb-4">
                            <label style={{ fontWeight: 700, fontSize: '0.9rem' }}>Judul Hero Portal</label>
                            <input
                                type="text"
                                className="form-control"
                                value={settings.ppdb_hero_title}
                                onChange={e => handleSettingChange('ppdb_hero_title', e.target.value)}
                                style={{ borderRadius: 10, height: 44 }}
                            />
                        </div>

                        <div className="form-group mb-4">
                            <label style={{ fontWeight: 700, fontSize: '0.9rem' }}>Sub-judul Hero</label>
                            <textarea
                                className="form-control"
                                rows="2"
                                value={settings.ppdb_hero_subtitle}
                                onChange={e => handleSettingChange('ppdb_hero_subtitle', e.target.value)}
                                style={{ borderRadius: 10, resize: 'none' }}
                            />
                        </div>

                        <div className="form-group mb-0">
                            <label style={{ fontWeight: 700, fontSize: '0.9rem' }}>No. WhatsApp CS</label>
                            <input
                                type="text"
                                className="form-control"
                                value={settings.ppdb_contact_wa}
                                onChange={e => handleSettingChange('ppdb_contact_wa', e.target.value)}
                                placeholder="Contoh: 08123456789"
                                style={{ borderRadius: 10, height: 44 }}
                            />
                            <small className="text-muted mt-1 d-block">Gunakan format 08xxx atau 62xxx</small>
                        </div>
                    </div>
                </div>

                <div className="d-flex justify-content-end gap-3 mt-4">
                    <button
                        className="btn btn-primary"
                        style={{ borderRadius: 14, height: 50, padding: '0 32px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 10 }}
                        onClick={() => saveSettings(['ppdb_is_open', 'ppdb_year', 'ppdb_quota', 'ppdb_contact_wa', 'ppdb_hero_title', 'ppdb_hero_subtitle'])}
                        disabled={savingSettings}
                    >
                        <Save size={20} />
                        {savingSettings ? 'Menyimpan...' : 'Simpan Pengaturan'}
                    </button>
                </div>
            </div>
        )
    }
}
