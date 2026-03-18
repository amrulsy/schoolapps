import { useState, useEffect } from 'react'
import { useApp } from '../context/AppContext'
import { Save, Plus, Edit2, Trash2, Eye, Layout, Monitor, Handshake, GraduationCap, Megaphone, RefreshCw } from 'lucide-react'
import { useCustomAlert } from '../hooks/useCustomAlert'

import { API_BASE_CMS as API_BASE, getAuthHeaders, getBearerHeader } from '../services/api'

const TABS = [
    { key: 'hero', label: 'Hero Section', icon: Monitor },
    { key: 'programs', label: 'Program Keahlian', icon: GraduationCap },
    { key: 'partners', label: 'Mitra / Partner', icon: Handshake },
    { key: 'cta', label: 'CTA Section', icon: Megaphone },
]

export default function CmsHomePage() {
    const { addToast } = useApp()
    const { confirmDelete } = useCustomAlert()
    const [activeTab, setActiveTab] = useState('hero')
    const [loading, setLoading] = useState(true)

    // Settings state (hero + CTA)
    const [settings, setSettings] = useState({})
    const [savingSettings, setSavingSettings] = useState(false)

    // Programs state
    const [programs, setPrograms] = useState([])
    const [showProgramModal, setShowProgramModal] = useState(false)
    const [editProgram, setEditProgram] = useState(null)
    const [programForm, setProgramForm] = useState({ icon: '📚', title: '', description: '', sort_order: 0 })
    const [savingProgram, setSavingProgram] = useState(false)

    // Partners state
    const [partners, setPartners] = useState([])
    const [showPartnerModal, setShowPartnerModal] = useState(false)
    const [editPartner, setEditPartner] = useState(null)
    const [partnerForm, setPartnerForm] = useState({ name: '', logo_url: '', website_url: '', sort_order: 0 })
    const [savingPartner, setSavingPartner] = useState(false)

    useEffect(() => { loadAll() }, [])

    const loadAll = async () => {
        setLoading(true)
        await Promise.all([loadSettings(), loadPrograms(), loadPartners()])
        setLoading(false)
    }

    // ==================== SETTINGS ====================
    const loadSettings = async () => {
        try {
            const res = await fetch(`${API_BASE}/settings`, { headers: getAuthHeaders() })
            if (res.ok) {
                const data = await res.json()
                const map = {}
                data.forEach(s => { map[s.setting_key] = s.setting_value })
                setSettings(map)
            }
        } catch { addToast('danger', 'Error', 'Gagal memuat pengaturan') }
    }

    const handleSettingChange = (key, value) => {
        setSettings(prev => ({ ...prev, [key]: value }))
    }

    const saveSettings = async (keys) => {
        setSavingSettings(true)
        try {
            const updates = keys.map(k => ({ setting_key: k, setting_value: settings[k] || '' }))
            const res = await fetch(`${API_BASE}/settings`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify({ updates })
            })
            if (res.ok) {
                addToast('success', 'Berhasil', 'Pengaturan berhasil disimpan')
            } else {
                addToast('danger', 'Gagal', 'Gagal menyimpan pengaturan')
            }
        } catch { addToast('danger', 'Error', 'Terjadi kesalahan') }
        finally { setSavingSettings(false) }
    }

    // ==================== PROGRAMS ====================
    const loadPrograms = async () => {
        try {
            const res = await fetch(`${API_BASE}/programs`, { headers: getAuthHeaders() })
            if (res.ok) setPrograms(await res.json())
        } catch { /* silent */ }
    }

    const openProgramModal = (p = null) => {
        setEditProgram(p)
        setProgramForm(p
            ? { icon: p.icon, title: p.title, description: p.description || '', sort_order: p.sort_order, is_active: p.is_active }
            : { icon: '📚', title: '', description: '', sort_order: programs.length, is_active: 1 }
        )
        setShowProgramModal(true)
    }

    const saveProgram = async (e) => {
        e.preventDefault()
        setSavingProgram(true)
        try {
            const url = editProgram ? `${API_BASE}/programs/${editProgram.id}` : `${API_BASE}/programs`
            const method = editProgram ? 'PUT' : 'POST'
            const res = await fetch(url, { method, headers: getAuthHeaders(), body: JSON.stringify(programForm) })
            if (res.ok) {
                addToast('success', 'Berhasil', `Program ${editProgram ? 'diperbarui' : 'ditambahkan'}`)
                setShowProgramModal(false)
                loadPrograms()
            } else {
                const err = await res.json()
                addToast('danger', 'Gagal', err.error || 'Terjadi kesalahan')
            }
        } catch { addToast('danger', 'Error', 'Gagal menyimpan program') }
        finally { setSavingProgram(false) }
    }

    const deleteProgram = async (p) => {
        if (await confirmDelete(`Hapus program "${p.title}"?`, 'Data akan dihapus permanen.')) {
            try {
                const res = await fetch(`${API_BASE}/programs/${p.id}`, { method: 'DELETE', headers: getAuthHeaders() })
                if (res.ok) { addToast('success', 'Berhasil', 'Program dihapus'); loadPrograms() }
            } catch { addToast('danger', 'Error', 'Gagal menghapus') }
        }
    }

    // ==================== PARTNERS ====================
    const loadPartners = async () => {
        try {
            const res = await fetch(`${API_BASE}/partners`, { headers: getAuthHeaders() })
            if (res.ok) setPartners(await res.json())
        } catch { /* silent */ }
    }

    const openPartnerModal = (p = null) => {
        setEditPartner(p)
        setPartnerForm(p
            ? { name: p.name, logo_url: p.logo_url, website_url: p.website_url || '', sort_order: p.sort_order, is_active: p.is_active }
            : { name: '', logo_url: '', website_url: '', sort_order: partners.length, is_active: 1 }
        )
        setShowPartnerModal(true)
    }

    const savePartner = async (e) => {
        e.preventDefault()
        setSavingPartner(true)
        try {
            const url = editPartner ? `${API_BASE}/partners/${editPartner.id}` : `${API_BASE}/partners`
            const method = editPartner ? 'PUT' : 'POST'
            const res = await fetch(url, { method, headers: getAuthHeaders(), body: JSON.stringify(partnerForm) })
            if (res.ok) {
                addToast('success', 'Berhasil', `Partner ${editPartner ? 'diperbarui' : 'ditambahkan'}`)
                setShowPartnerModal(false)
                loadPartners()
            } else {
                const err = await res.json()
                addToast('danger', 'Gagal', err.error || 'Terjadi kesalahan')
            }
        } catch { addToast('danger', 'Error', 'Gagal menyimpan partner') }
        finally { setSavingPartner(false) }
    }

    const deletePartner = async (p) => {
        if (await confirmDelete(`Hapus partner "${p.name}"?`, 'Data akan dihapus permanen.')) {
            try {
                const res = await fetch(`${API_BASE}/partners/${p.id}`, { method: 'DELETE', headers: getAuthHeaders() })
                if (res.ok) { addToast('success', 'Berhasil', 'Partner dihapus'); loadPartners() }
            } catch { addToast('danger', 'Error', 'Gagal menghapus') }
        }
    }

    // ==================== RENDER ====================
    if (loading) return <div style={{ padding: 40, textAlign: 'center' }}>Memuat data...</div>

    return (
        <div className="fade-in">
            <div className="page-header">
                <h1><Layout size={24} style={{ marginRight: 8, verticalAlign: 'middle' }} /> Konten Halaman Utama</h1>
                <div className="actions">
                    <button className="btn btn-secondary" onClick={loadAll}>
                        <RefreshCw size={16} /> Refresh
                    </button>
                    <a href="/" target="_blank" rel="noreferrer" className="btn btn-primary">
                        <Eye size={16} /> Lihat Portal
                    </a>
                </div>
            </div>

            {/* Tab Navigation */}
            <div style={tabNavStyle}>
                {TABS.map(t => (
                    <button
                        key={t.key}
                        onClick={() => {
                            setActiveTab(t.key)
                            setShowProgramModal(false)
                            setShowPartnerModal(false)
                        }}
                        style={{
                            ...tabBtnStyle,
                            ...(activeTab === t.key ? tabBtnActiveStyle : {}),
                        }}
                    >
                        <t.icon size={16} />
                        <span>{t.label}</span>
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div style={tabContentStyle}>
                {activeTab === 'hero' && renderHeroTab()}
                {activeTab === 'programs' && renderProgramsTab()}
                {activeTab === 'partners' && renderPartnersTab()}
                {activeTab === 'cta' && renderCtaTab()}
            </div>

            {/* Modals */}
            {showProgramModal && renderProgramModal()}
            {showPartnerModal && renderPartnerModal()}
        </div>
    )

    // ==================== TAB RENDERS ====================

    function renderHeroTab() {
        const heroKeys = ['hero_badge_text', 'hero_title', 'hero_highlight', 'hero_subtitle', 'hero_video_url']
        return (
            <div>
                <div style={sectionCardStyle}>
                    <h3 style={sectionTitleStyle}>🎯 Hero Section</h3>
                    <p style={sectionDescStyle}>
                        Kelola judul, subtitle, badge, dan video yang tampil di bagian atas halaman portal.
                    </p>

                    <div className="form-group mb-4">
                        <label>Badge Teks <span style={hintStyle}>(teks kecil di atas judul)</span></label>
                        <input
                            type="text" className="form-control"
                            value={settings.hero_badge_text || ''}
                            onChange={e => handleSettingChange('hero_badge_text', e.target.value)}
                            placeholder="Penerimaan Peserta Didik Baru"
                        />
                    </div>

                    <div className="form-group mb-4">
                        <label>Judul Hero <span style={hintStyle}>(gunakan baris baru untuk pemisah)</span></label>
                        <textarea
                            className="form-control" rows={3}
                            value={settings.hero_title || ''}
                            onChange={e => handleSettingChange('hero_title', e.target.value)}
                            placeholder="Raih Masa Depan&#10;Cemerlang Bersama&#10;SMK PPRQ"
                        />
                    </div>

                    <div className="form-group mb-4">
                        <label>Teks Highlight <span style={hintStyle}>(bagian yang diberi warna gradient)</span></label>
                        <input
                            type="text" className="form-control"
                            value={settings.hero_highlight || ''}
                            onChange={e => handleSettingChange('hero_highlight', e.target.value)}
                            placeholder="Cemerlang Bersama"
                        />
                    </div>

                    <div className="form-group mb-4">
                        <label>Subtitle Hero</label>
                        <textarea
                            className="form-control" rows={3}
                            value={settings.hero_subtitle || ''}
                            onChange={e => handleSettingChange('hero_subtitle', e.target.value)}
                        />
                    </div>

                    <div className="form-group mb-4">
                        <label>URL Video YouTube <span style={hintStyle}>(embed format)</span></label>
                        <input
                            type="url" className="form-control"
                            value={settings.hero_video_url || ''}
                            onChange={e => handleSettingChange('hero_video_url', e.target.value)}
                            placeholder="https://www.youtube.com/embed/VIDEO_ID"
                        />
                        {settings.hero_video_url && (
                            <div style={{ marginTop: 10, borderRadius: 8, overflow: 'hidden', aspectRatio: '16/9', maxWidth: 400 }}>
                                <iframe
                                    width="100%" height="100%"
                                    src={settings.hero_video_url}
                                    title="Preview" frameBorder="0"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                ></iframe>
                            </div>
                        )}
                    </div>

                    <button
                        className="btn btn-primary"
                        onClick={() => saveSettings(heroKeys)}
                        disabled={savingSettings}
                    >
                        <Save size={16} /> {savingSettings ? 'Menyimpan...' : 'Simpan Hero Section'}
                    </button>
                </div>
            </div>
        )
    }

    function renderProgramsTab() {
        const programSettingsKeys = ['programs_section_label', 'programs_section_title', 'programs_section_subtitle']
        return (
            <div>
                {/* Section Header Settings */}
                <div style={sectionCardStyle}>
                    <h3 style={sectionTitleStyle}>📝 Pengaturan Section</h3>
                    <div className="form-group mb-4">
                        <label>Label Section</label>
                        <input type="text" className="form-control"
                            value={settings.programs_section_label || ''}
                            onChange={e => handleSettingChange('programs_section_label', e.target.value)}
                        />
                    </div>
                    <div className="form-group mb-4">
                        <label>Judul Section</label>
                        <input type="text" className="form-control"
                            value={settings.programs_section_title || ''}
                            onChange={e => handleSettingChange('programs_section_title', e.target.value)}
                        />
                    </div>
                    <div className="form-group mb-4">
                        <label>Subtitle Section</label>
                        <textarea className="form-control" rows={2}
                            value={settings.programs_section_subtitle || ''}
                            onChange={e => handleSettingChange('programs_section_subtitle', e.target.value)}
                        />
                    </div>
                    <button className="btn btn-primary" onClick={() => saveSettings(programSettingsKeys)} disabled={savingSettings}>
                        <Save size={16} /> {savingSettings ? 'Menyimpan...' : 'Simpan Pengaturan'}
                    </button>
                </div>

                {/* Programs List */}
                <div style={{ ...sectionCardStyle, marginTop: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                        <h3 style={{ ...sectionTitleStyle, marginBottom: 0 }}>🎓 Daftar Program Keahlian</h3>
                        <button className="btn btn-primary btn-sm" onClick={() => openProgramModal()}>
                            <Plus size={14} /> Tambah Program
                        </button>
                    </div>

                    {programs.length === 0 ? (
                        <div style={emptyStyle}>Belum ada program keahlian. Klik tombol "Tambah Program" untuk menambahkan.</div>
                    ) : (
                        <div style={{ display: 'grid', gap: 12 }}>
                            {programs.map(p => (
                                <div key={p.id} style={itemCardStyle}>
                                    <div style={{ fontSize: 28, marginRight: 14 }}>{p.icon}</div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{p.title}</div>
                                        <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: 2 }}>{p.description}</div>
                                    </div>
                                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                                        <span style={{ ...badgeStyle, background: p.is_active ? '#dcfce7' : '#f1f5f9', color: p.is_active ? '#16a34a' : '#94a3b8' }}>
                                            {p.is_active ? 'Aktif' : 'Nonaktif'}
                                        </span>
                                        <button className="btn-icon btn-edit" onClick={() => openProgramModal(p)} title="Edit"><Edit2 size={16} /></button>
                                        <button className="btn-icon btn-delete danger" onClick={() => deleteProgram(p)} title="Hapus"><Trash2 size={16} /></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        )
    }

    function renderPartnersTab() {
        return (
            <div style={sectionCardStyle}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <div>
                        <h3 style={{ ...sectionTitleStyle, marginBottom: 4 }}>🤝 Logo Mitra / Partner</h3>
                        <p style={sectionDescStyle}>Logo mitra yang ditampilkan di bawah hero section portal.</p>
                    </div>
                    <button className="btn btn-primary btn-sm" onClick={() => openPartnerModal()}>
                        <Plus size={14} /> Tambah Partner
                    </button>
                </div>

                {partners.length === 0 ? (
                    <div style={emptyStyle}>Belum ada partner. Klik tombol "Tambah Partner" untuk menambahkan.</div>
                ) : (
                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th style={{ width: 50 }}>No</th>
                                    <th style={{ width: 60 }}>Logo</th>
                                    <th>Nama Partner</th>
                                    <th>Website</th>
                                    <th style={{ width: 70 }}>Urutan</th>
                                    <th style={{ width: 80 }}>Status</th>
                                    <th style={{ width: 90 }}>Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {partners.map((p, i) => (
                                    <tr key={p.id}>
                                        <td className="text-center">{i + 1}</td>
                                        <td>
                                            <div style={{ width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f1f5f9', borderRadius: 6, padding: 6 }}>
                                                <img src={p.logo_url} alt={p.name} style={{ maxWidth: '100%', maxHeight: '100%', filter: 'brightness(0) saturate(100%)' }} />
                                            </div>
                                        </td>
                                        <td><strong>{p.name}</strong></td>
                                        <td>
                                            {p.website_url ? (
                                                <a href={p.website_url} target="_blank" rel="noreferrer" style={{ fontSize: '0.8rem', color: 'var(--primary-600)' }}>
                                                    {p.website_url}
                                                </a>
                                            ) : <span style={{ color: '#94a3b8' }}>—</span>}
                                        </td>
                                        <td className="text-center">{p.sort_order}</td>
                                        <td>
                                            <span className={`badge ${p.is_active ? 'badge-success' : 'badge-secondary'}`}>
                                                {p.is_active ? 'Aktif' : 'Off'}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="action-group">
                                                <button className="btn-icon btn-edit" onClick={() => openPartnerModal(p)} title="Edit"><Edit2 size={16} /></button>
                                                <button className="btn-icon btn-delete danger" onClick={() => deletePartner(p)} title="Hapus"><Trash2 size={16} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        )
    }

    function renderCtaTab() {
        const ctaKeys = ['cta_title', 'cta_subtitle', 'cta_button_text']
        return (
            <div style={sectionCardStyle}>
                <h3 style={sectionTitleStyle}>📣 Call-to-Action Section</h3>
                <p style={sectionDescStyle}>
                    Section ajakan di bagian bawah halaman portal sebelum footer.
                </p>

                <div className="form-group mb-4">
                    <label>Judul CTA</label>
                    <input type="text" className="form-control"
                        value={settings.cta_title || ''}
                        onChange={e => handleSettingChange('cta_title', e.target.value)}
                        placeholder="Siap Bergabung Bersama Kami?"
                    />
                </div>

                <div className="form-group mb-4">
                    <label>Subtitle CTA</label>
                    <textarea className="form-control" rows={3}
                        value={settings.cta_subtitle || ''}
                        onChange={e => handleSettingChange('cta_subtitle', e.target.value)}
                    />
                </div>

                <div className="form-group mb-4">
                    <label>Teks Tombol CTA</label>
                    <input type="text" className="form-control"
                        value={settings.cta_button_text || ''}
                        onChange={e => handleSettingChange('cta_button_text', e.target.value)}
                        placeholder="✨ Daftar PPDB Sekarang"
                    />
                </div>

                {/* Live Preview */}
                <div style={{ marginBottom: 20 }}>
                    <label style={{ fontWeight: 600, marginBottom: 8, display: 'block' }}>Preview:</label>
                    <div style={ctaPreviewStyle}>
                        <h3 style={{ fontSize: '1.3rem', fontWeight: 700, color: '#fff', marginBottom: 8 }}>
                            {settings.cta_title || 'Judul CTA'}
                        </h3>
                        <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.9rem', marginBottom: 12 }}>
                            {settings.cta_subtitle || 'Subtitle CTA'}
                        </p>
                        <span style={ctaPreviewBtnStyle}>
                            {settings.cta_button_text || '✨ Tombol CTA'}
                        </span>
                    </div>
                </div>

                <button className="btn btn-primary" onClick={() => saveSettings(ctaKeys)} disabled={savingSettings}>
                    <Save size={16} /> {savingSettings ? 'Menyimpan...' : 'Simpan CTA Section'}
                </button>
            </div>
        )
    }

    // ==================== MODALS ====================

    function renderProgramModal() {
        return (
            <div className="modal-backdrop">
                <div className="modal" style={{ maxWidth: 500 }}>
                    <div className="modal-header">
                        <h3>{editProgram ? 'Edit Program' : 'Tambah Program'}</h3>
                        <button className="btn-icon" onClick={() => setShowProgramModal(false)}>×</button>
                    </div>
                    <div className="modal-body">
                        <form id="programForm" onSubmit={saveProgram}>
                            <div className="form-group mb-4">
                                <label>Icon Emoji <span className="text-danger">*</span></label>
                                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                    <div style={{ fontSize: 32, width: 48, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f1f5f9', borderRadius: 8 }}>
                                        {programForm.icon}
                                    </div>
                                    <input type="text" className="form-control" value={programForm.icon}
                                        onChange={e => setProgramForm({ ...programForm, icon: e.target.value })}
                                        style={{ maxWidth: 80 }} maxLength={2} required
                                    />
                                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                                        {['💻', '🏢', '📊', '🎨', '🔧', '🧪', '🌐', '📱', '🎓', '✈️'].map(emoji => (
                                            <button key={emoji} type="button"
                                                style={{ fontSize: 20, background: 'none', border: programForm.icon === emoji ? '2px solid var(--primary-600)' : '1px solid #e2e8f0', borderRadius: 6, width: 36, height: 36, cursor: 'pointer' }}
                                                onClick={() => setProgramForm({ ...programForm, icon: emoji })}
                                            >{emoji}</button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <div className="form-group mb-4">
                                <label>Nama Program <span className="text-danger">*</span></label>
                                <input type="text" className="form-control" value={programForm.title}
                                    onChange={e => setProgramForm({ ...programForm, title: e.target.value })} required
                                    placeholder="Teknik Komputer & Jaringan"
                                />
                            </div>
                            <div className="form-group mb-4">
                                <label>Deskripsi</label>
                                <textarea className="form-control" rows={3} value={programForm.description}
                                    onChange={e => setProgramForm({ ...programForm, description: e.target.value })}
                                    placeholder="Kuasai jaringan, server, dan infrastruktur IT modern..."
                                />
                            </div>
                            <div className="grid-2 mb-4">
                                <div className="form-group">
                                    <label>Urutan Tampil</label>
                                    <input type="number" className="form-control" value={programForm.sort_order}
                                        onChange={e => setProgramForm({ ...programForm, sort_order: parseInt(e.target.value) || 0 })}
                                    />
                                </div>
                                <div className="form-group" style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: 10 }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', margin: 0 }}>
                                        <input
                                            type="checkbox"
                                            checked={programForm.is_active !== 0}
                                            onChange={e => setProgramForm({ ...programForm, is_active: e.target.checked ? 1 : 0 })}
                                            style={{ width: 18, height: 18 }}
                                        />
                                        <span style={{ fontWeight: 600 }}>Aktif</span>
                                    </label>
                                </div>
                            </div>
                        </form>
                    </div>
                    <div className="modal-footer">
                        <button className="btn btn-secondary" onClick={() => setShowProgramModal(false)} disabled={savingProgram}>Batal</button>
                        <button type="submit" form="programForm" className="btn btn-primary" disabled={savingProgram}>
                            {savingProgram ? 'Menyimpan...' : 'Simpan Program'}
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    function renderPartnerModal() {
        return (
            <div className="modal-backdrop">
                <div className="modal" style={{ maxWidth: 500 }}>
                    <div className="modal-header">
                        <h3>{editPartner ? 'Edit Partner' : 'Tambah Partner'}</h3>
                        <button className="btn-icon" onClick={() => setShowPartnerModal(false)}>×</button>
                    </div>
                    <div className="modal-body">
                        <form id="partnerForm" onSubmit={savePartner}>
                            <div className="form-group mb-4">
                                <label>Nama Partner <span className="text-danger">*</span></label>
                                <input type="text" className="form-control" value={partnerForm.name}
                                    onChange={e => setPartnerForm({ ...partnerForm, name: e.target.value })} required
                                    placeholder="Nama perusahaan / lembaga"
                                />
                            </div>
                            <div className="form-group mb-4">
                                <label>URL Logo <span className="text-danger">*</span></label>
                                <input type="url" className="form-control" value={partnerForm.logo_url}
                                    onChange={e => setPartnerForm({ ...partnerForm, logo_url: e.target.value })} required
                                    placeholder="https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/..."
                                />
                                {partnerForm.logo_url && (
                                    <div style={{ marginTop: 10, padding: 12, background: '#f8f9fa', borderRadius: 8, display: 'flex', justifyContent: 'center' }}>
                                        <img src={partnerForm.logo_url} alt="Preview" style={{ maxHeight: 50, filter: 'brightness(0) saturate(100%)' }} />
                                    </div>
                                )}
                            </div>
                            <div className="form-group mb-4">
                                <label>Website (Opsional)</label>
                                <input type="url" className="form-control" value={partnerForm.website_url}
                                    onChange={e => setPartnerForm({ ...partnerForm, website_url: e.target.value })}
                                    placeholder="https://..."
                                />
                            </div>
                            <div className="grid-2 mb-4">
                                <div className="form-group">
                                    <label>Urutan Tampil</label>
                                    <input type="number" className="form-control" value={partnerForm.sort_order}
                                        onChange={e => setPartnerForm({ ...partnerForm, sort_order: parseInt(e.target.value) || 0 })}
                                    />
                                </div>
                                <div className="form-group" style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: 10 }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', margin: 0 }}>
                                        <input
                                            type="checkbox"
                                            checked={partnerForm.is_active !== 0}
                                            onChange={e => setPartnerForm({ ...partnerForm, is_active: e.target.checked ? 1 : 0 })}
                                            style={{ width: 18, height: 18 }}
                                        />
                                        <span style={{ fontWeight: 600 }}>Aktif</span>
                                    </label>
                                </div>
                            </div>
                        </form>
                    </div>
                    <div className="modal-footer">
                        <button className="btn btn-secondary" onClick={() => setShowPartnerModal(false)} disabled={savingPartner}>Batal</button>
                        <button type="submit" form="partnerForm" className="btn btn-primary" disabled={savingPartner}>
                            {savingPartner ? 'Menyimpan...' : 'Simpan Partner'}
                        </button>
                    </div>
                </div>
            </div>
        )
    }
}

// ==================== STYLES ====================
const tabNavStyle = {
    display: 'flex', gap: 6, padding: '4px',
    background: '#f1f5f9', borderRadius: 10,
    marginBottom: 20, overflowX: 'auto'
}

const tabBtnStyle = {
    display: 'flex', alignItems: 'center', gap: 6,
    padding: '10px 18px', border: 'none', borderRadius: 8,
    background: 'transparent', cursor: 'pointer',
    fontSize: '0.85rem', fontWeight: 500,
    color: '#64748b', transition: 'all 0.2s',
    whiteSpace: 'nowrap'
}

const tabBtnActiveStyle = {
    background: '#fff', color: '#4f46e5',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    fontWeight: 600
}

const tabContentStyle = {
    minHeight: 400
}

const sectionCardStyle = {
    background: '#fff', borderRadius: 12,
    border: '1px solid #e2e8f0',
    padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
}

const sectionTitleStyle = {
    fontSize: '1.1rem', fontWeight: 700,
    color: '#1e293b', marginBottom: 4
}

const sectionDescStyle = {
    fontSize: '0.85rem', color: '#64748b', marginBottom: 20
}

const hintStyle = {
    fontSize: '0.75rem', color: '#94a3b8', fontWeight: 400
}

const itemCardStyle = {
    display: 'flex', alignItems: 'center',
    padding: '14px 16px',
    background: '#fafbfc', borderRadius: 10,
    border: '1px solid #e2e8f0',
    transition: 'all 0.15s'
}

const badgeStyle = {
    display: 'inline-block', padding: '2px 10px',
    borderRadius: 999, fontSize: '0.72rem',
    fontWeight: 600
}

const emptyStyle = {
    textAlign: 'center', padding: 40,
    color: '#94a3b8', fontSize: '0.9rem'
}

const ctaPreviewStyle = {
    background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
    borderRadius: 12, padding: 24, textAlign: 'center'
}

const ctaPreviewBtnStyle = {
    display: 'inline-block', padding: '8px 24px',
    background: '#fff', color: '#4f46e5',
    borderRadius: 8, fontWeight: 600, fontSize: '0.85rem'
}
