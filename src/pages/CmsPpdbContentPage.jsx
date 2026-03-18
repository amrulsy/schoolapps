import { useState, useEffect } from 'react'
import { useApp } from '../context/AppContext'
import { Save, Plus, Edit2, Trash2, Eye, LayoutList, ListOrdered, CheckCircle2, RefreshCw } from 'lucide-react'
import { useCustomAlert } from '../hooks/useCustomAlert'

import { API_BASE_CMS as API_BASE, getAuthHeaders } from '../services/api'

const TABS = [
    { key: 'steps', label: 'Langkah Pendaftaran', icon: ListOrdered },
    { key: 'requirements', label: 'Syarat Dokumen', icon: CheckCircle2 },
]

export default function CmsPpdbContentPage() {
    const { addToast } = useApp()
    const { confirmDelete } = useCustomAlert()
    const [activeTab, setActiveTab] = useState('steps')
    const [loading, setLoading] = useState(true)

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

    useEffect(() => { loadAll() }, [])

    const loadAll = async () => {
        setLoading(true)
        await Promise.all([loadSteps(), loadRequirements()])
        setLoading(false)
    }

    // ==================== STEPS ====================
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

    // ==================== REQUIREMENTS ====================
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

    const changeTab = (tab) => {
        setActiveTab(tab)
        setShowStepModal(false)
        setShowReqModal(false)
    }

    // ==================== RENDER ====================
    if (loading) return <div style={{ padding: 40, textAlign: 'center' }}>Memuat data...</div>

    return (
        <div className="fade-in">
            <div className="page-header" style={{ marginBottom: '32px', background: 'linear-gradient(135deg, var(--bg-card), #f8fafc)', padding: '24px 32px', borderRadius: '24px', border: '1px solid var(--border-color)', display: 'flex', flexWrap: 'wrap', gap: 20 }}>
                <div>
                    <div style={{ display: 'inline-block', padding: '6px 16px', background: 'var(--primary-color)', color: 'white', borderRadius: '30px', fontSize: '0.8rem', fontWeight: 700, marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '1px' }}>Dashboard PPDB</div>
                    <h1 style={{ fontSize: '2.2rem', fontWeight: 900, letterSpacing: '-0.5px', marginBottom: '8px', background: 'linear-gradient(45deg, var(--text-color), var(--primary-color))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', display: 'flex', alignItems: 'center', gap: 12 }}>
                        <LayoutList size={28} style={{ color: 'var(--primary-color)' }} /> Konten PPDB
                    </h1>
                    <p className="text-secondary" style={{ fontSize: '1.05rem', margin: 0, opacity: 0.8 }}>Kelola langkah pendaftaran dan syarat dokumen PPDB.</p>
                </div>
                <div className="actions" style={{ gap: 12, marginLeft: 'auto', alignSelf: 'center' }}>
                    <button className="btn btn-outline" style={{ borderRadius: 14, height: 44, fontWeight: 600 }} onClick={loadAll}>
                        <RefreshCw size={16} /> Refresh
                    </button>
                    <a href="/ppdb" target="_blank" rel="noreferrer" className="btn btn-primary" style={{ borderRadius: 14, height: 44, fontWeight: 600 }}>
                        <Eye size={16} /> Lihat Portal
                    </a>
                </div>
            </div>

            {/* Tab Navigation */}
            <div style={tabNavStyle}>
                {TABS.map(t => (
                    <button
                        key={t.key}
                        onClick={() => changeTab(t.key)}
                        style={{ ...tabBtnStyle, ...(activeTab === t.key ? tabBtnActiveStyle : {}) }}
                    >
                        <t.icon size={16} /> <span>{t.label}</span>
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div style={tabContentStyle}>
                {activeTab === 'steps' && renderStepsTab()}
                {activeTab === 'requirements' && renderRequirementsTab()}
            </div>

            {/* Modals */}
            {showStepModal && renderStepModal()}
            {showReqModal && renderReqModal()}
        </div>
    )

    // ==================== TAB RENDERS ====================

    function renderStepsTab() {
        return (
            <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                    <h3 style={sectionTitleStyle}>Alur Pendaftaran</h3>
                    <button className="btn btn-primary btn-sm" style={{ borderRadius: 10 }} onClick={() => openStepModal()}>
                        <Plus size={16} /> Tambah Langkah
                    </button>
                </div>

                <div className="table-responsive card" style={{ padding: 0, border: '1px solid var(--border-color)', borderRadius: 16, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' }}>
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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                    <h3 style={sectionTitleStyle}>Syarat Dokumen</h3>
                    <button className="btn btn-primary btn-sm" style={{ borderRadius: 10 }} onClick={() => openReqModal()}>
                        <Plus size={16} /> Tambah Syarat
                    </button>
                </div>

                <div className="table-responsive card" style={{ padding: 0, border: '1px solid var(--border-color)', borderRadius: 16, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' }}>
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

}

// ==================== STYLES ====================
// Reusing exact same styles from CmsHomePage.jsx

const tabNavStyle = {
    display: 'flex', borderBottom: '1px solid var(--border-color)', marginBottom: 24, gap: 10, overflowX: 'auto', paddingBottom: 5
}
const tabBtnStyle = {
    padding: '12px 20px', background: 'none', border: 'none', borderBottom: '3px solid transparent', cursor: 'pointer',
    fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap', transition: 'all 0.2s'
}
const tabBtnActiveStyle = {
    color: 'var(--primary)', borderBottomColor: 'var(--primary)'
}
const tabContentStyle = {
    background: 'var(--bg-card)', borderRadius: 'var(--radius-xl)', padding: 32,
    boxShadow: '0 4px 20px rgba(0,0,0,0.03)', border: '1px solid var(--border-color)', minHeight: 400
}
const sectionTitleStyle = {
    fontSize: '1.25rem', fontWeight: 700, marginBottom: 8, color: 'var(--text-color)'
}
