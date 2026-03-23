import { useState, useEffect } from 'react'
import { useApp } from '../../../context/AppContext'
import { Save, Plus, Edit2, Trash2, Eye, Layout, Monitor, Handshake, GraduationCap, Megaphone, RefreshCw, Image as ImageIcon, FileText, Building2, Globe, Mail, Type, Star, PlayCircle, AlignLeft } from 'lucide-react'
import { useCustomAlert } from '../../../hooks/useCustomAlert'
import { getDirectDriveUrl } from '../../../utils/urlHelper'
import MediaUploadField from '../../../components/MediaUploadField'

import { API_BASE_CMS as API_BASE, getAuthHeaders, getBearerHeader } from '../../../services/api'
import CmsBannersPage from './CmsBannersPage'
import CmsPostsPage from './CmsPostsPage'

const TABS = [
    { key: 'hero', label: 'Hero Section', icon: Monitor },
    { key: 'banners', label: 'Banners', icon: ImageIcon },
    { key: 'posts', label: 'Pengumuman / Berita', icon: FileText },
    { key: 'programs', label: 'Program Keahlian', icon: GraduationCap },
    { key: 'partners', label: 'Mitra / Partner', icon: Handshake },
    { key: 'school-network', label: 'Network Sekolah', icon: Building2 },
    { key: 'cta', label: 'CTA Section', icon: Megaphone },
    { key: 'site', label: 'Informasi Situs', icon: Globe },
    { key: 'contact', label: 'Kontak & Sosial', icon: Mail },
]

export default function CmsHomePage() {
    const tabBtnStyle = {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '10px 20px',
        border: 'none',
        background: 'none',
        color: '#64748b',
        fontWeight: 600,
        cursor: 'pointer',
        borderBottom: '2px solid transparent',
        transition: 'all 0.2s'
    }

    const tabBtnActiveStyle = {
        color: 'var(--primary-600)',
        borderBottom: '2px solid var(--primary-600)',
        background: 'var(--primary-50)'
    }

    const badgeStyle = {
        padding: '4px 10px',
        borderRadius: '100px',
        fontSize: '0.75rem',
        fontWeight: 700
    }
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
    const [programForm, setProgramForm] = useState({
        icon: '📚', title: '', slug: '', tagline: '', description: '',
        banner_image: '', color_theme: '#4f46e5',
        features_json: [
            { id: 1, title: '', description: '', icon: '' },
            { id: 2, title: '', description: '', icon: '' },
            { id: 3, title: '', description: '', icon: '' },
            { id: 4, title: '', description: '', icon: '' }
        ],
        milestones_json: [],
        showcase_json: [],
        alumni_json: [],
        careers_json: [],
        stats_json: { labor_absorption: '', partners_count: '' },
        full_content: '', sort_order: 0
    })
    const [savingProgram, setSavingProgram] = useState(false)

    // Partners state
    const [partners, setPartners] = useState([])
    const [showPartnerModal, setShowPartnerModal] = useState(false)
    const [editPartner, setEditPartner] = useState(null)
    const [partnerForm, setPartnerForm] = useState({ name: '', logo_url: '', website_url: '', sort_order: 0 })
    const [savingPartner, setSavingPartner] = useState(false)

    // School Network state
    const [showSchoolModal, setShowSchoolModal] = useState(false)
    const [editSchool, setEditSchool] = useState(null)
    const [schoolForm, setSchoolForm] = useState({ name: '', short: '', logo_url: '' })
    const [savingSchool, setSavingSchool] = useState(false)

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
        if (p) {
            let features = p.features_json;
            if (typeof features === 'string') {
                try { features = JSON.parse(features) } catch { features = [] }
            }
            if (!Array.isArray(features) || features.length === 0) {
                features = [
                    { id: 1, title: '', description: '', icon: '' },
                    { id: 2, title: '', description: '', icon: '' },
                    { id: 3, title: '', description: '', icon: '' },
                    { id: 4, title: '', description: '', icon: '' }
                ]
            }
            // Ensure 4 items
            while (features.length < 4) features.push({ id: features.length + 1, title: '', description: '', icon: '' });

            const parseJson = (val, def = []) => {
                if (!val) return def;
                if (typeof val === 'string') {
                    try { return JSON.parse(val) } catch { return def }
                }
                return val;
            };

            setProgramForm({
                icon: p.icon, title: p.title, slug: p.slug || '', tagline: p.tagline || '',
                description: p.description || '', banner_image: p.banner_image || '',
                color_theme: p.color_theme || '#4f46e5', features_json: features,
                milestones_json: parseJson(p.milestones_json, []),
                showcase_json: parseJson(p.showcase_json, []),
                alumni_json: parseJson(p.alumni_json, []),
                careers_json: parseJson(p.careers_json, []),
                stats_json: parseJson(p.stats_json, { labor_absorption: '', partners_count: '' }),
                full_content: p.full_content || '', sort_order: p.sort_order, is_active: p.is_active
            })
        } else {
            setProgramForm({
                icon: '📚', title: '', slug: '', tagline: '', description: '',
                banner_image: '', color_theme: '#4f46e5',
                features_json: [
                    { id: 1, title: '', description: '', icon: '' },
                    { id: 2, title: '', description: '', icon: '' },
                    { id: 3, title: '', description: '', icon: '' },
                    { id: 4, title: '', description: '', icon: '' }
                ],
                milestones_json: [],
                showcase_json: [],
                alumni_json: [],
                careers_json: [],
                stats_json: { labor_absorption: '', partners_count: '' },
                full_content: '', sort_order: programs.length, is_active: 1
            })
        }
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

    // ==================== SCHOOL NETWORK ====================
    const getSchoolList = () => {
        const json = settings.school_network_json
        if (!json) return []
        try { return JSON.parse(json) } catch { return [] }
    }

    const openSchoolModal = (s = null) => {
        setEditSchool(s)
        setSchoolForm(s ? { ...s } : { name: '', short: '', logo_url: '' })
        setShowSchoolModal(true)
    }

    const saveSchool = async (e) => {
        e.preventDefault()
        setSavingSchool(true)
        try {
            const list = getSchoolList()
            let newList
            if (editSchool) {
                newList = list.map(item => item.id === editSchool.id ? { ...schoolForm } : item)
            } else {
                const newId = list.length > 0 ? Math.max(...list.map(i => i.id)) + 1 : 1
                newList = [...list, { id: newId, ...schoolForm }]
            }

            const res = await fetch(`${API_BASE}/settings`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify({
                    updates: [{ setting_key: 'school_network_json', setting_value: JSON.stringify(newList) }]
                })
            })

            if (res.ok) {
                addToast('success', 'Berhasil', `Data sekolah ${editSchool ? 'diperbarui' : 'ditambahkan'}`)
                setShowSchoolModal(false)
                loadSettings()
            } else {
                addToast('danger', 'Gagal', 'Gagal menyimpan data')
            }
        } catch { addToast('danger', 'Error', 'Terjadi kesalahan') }
        finally { setSavingSchool(false) }
    }

    const deleteSchool = async (s) => {
        if (await confirmDelete(`Hapus data "${s.name}"?`)) {
            try {
                const list = getSchoolList().filter(item => item.id !== s.id)
                const res = await fetch(`${API_BASE}/settings`, {
                    method: 'PUT',
                    headers: getAuthHeaders(),
                    body: JSON.stringify({
                        updates: [{ setting_key: 'school_network_json', setting_value: JSON.stringify(list) }]
                    })
                })
                if (res.ok) { addToast('success', 'Berhasil', 'Data dihapus'); loadSettings() }
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
            <div className="cms-tab-nav">
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
            <div style={{ minHeight: 400 }}>
                {activeTab === 'hero' && renderHeroTab()}
                {activeTab === 'banners' && <CmsBannersPage hideHeader={true} />}
                {activeTab === 'posts' && <CmsPostsPage hideHeader={true} />}
                {activeTab === 'programs' && renderProgramsTab()}
                {activeTab === 'partners' && renderPartnersTab()}
                {activeTab === 'school-network' && renderSchoolNetworkTab()}
                {activeTab === 'cta' && renderCtaTab()}
                {activeTab === 'site' && renderSiteTab()}
                {activeTab === 'contact' && renderContactTab()}
            </div>

            {/* Modals */}
            {showProgramModal && renderProgramModal()}
            {showPartnerModal && renderPartnerModal()}
            {showSchoolModal && renderSchoolModal()}
        </div>
    )

    // ==================== TAB RENDERS ====================

    function renderHeroTab() {
        const heroKeys = ['hero_badge_text', 'hero_title', 'hero_highlight', 'hero_subtitle', 'hero_video_url']
        return (
            <div className="cms-hero-container animate-fade-in">
                <div className="cms-hero-flex">
                    {/* Left Side: Editor Form */}
                    <div className="cms-hero-editor">
                        <div className="cms-section-card no-margin">
                            <h3 className="cms-section-title">
                                <Monitor size={20} className="mr-2 text-primary" /> Pengaturan Hero Section
                            </h3>
                            <p className="cms-section-desc">
                                Kelola judul utama dan video pengenalan yang tampil di bagian atas portal.
                            </p>

                            <div className="grid-2 gap-4 mb-4">
                                <div className="form-group">
                                    <label className="cms-label">
                                        <Star size={14} className="mr-1 text-warning" /> Badge Teks
                                    </label>
                                    <input
                                        type="text" className="form-control"
                                        value={settings.hero_badge_text || ''}
                                        onChange={e => handleSettingChange('hero_badge_text', e.target.value)}
                                        placeholder="Penerimaan Siswa Baru"
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="cms-label">
                                        <Type size={14} className="mr-1 text-primary" /> Teks Highlight
                                    </label>
                                    <input
                                        type="text" className="form-control"
                                        value={settings.hero_highlight || ''}
                                        onChange={e => handleSettingChange('hero_highlight', e.target.value)}
                                        placeholder="Gunakan Warna Gradient"
                                    />
                                </div>
                            </div>

                            <div className="form-group mb-4">
                                <label className="cms-label">
                                    <AlignLeft size={14} className="mr-1 text-slate" /> Judul Utama
                                </label>
                                <textarea
                                    className="form-control" rows={3}
                                    value={settings.hero_title || ''}
                                    onChange={e => handleSettingChange('hero_title', e.target.value)}
                                    placeholder="Gunakan Baris Baru Untuk Pemisah Visual"
                                />
                                <small className="text-muted mt-1 d-block">💡 Tips: Gunakan 'Enter' untuk membagi judul menjadi beberapa baris.</small>
                            </div>

                            <div className="form-group mb-4">
                                <label className="cms-label">
                                    <AlignLeft size={14} className="mr-1 text-slate" /> Subtitle Hero
                                </label>
                                <textarea
                                    className="form-control" rows={2}
                                    value={settings.hero_subtitle || ''}
                                    onChange={e => handleSettingChange('hero_subtitle', e.target.value)}
                                    placeholder="Deskripsi singkat pendukung judul utama..."
                                />
                            </div>

                            <div className="form-group mb-4">
                                <label className="cms-label">
                                    <PlayCircle size={14} className="mr-1 text-danger" /> YouTube Video Embed
                                </label>
                                <input
                                    type="url" className="form-control"
                                    value={settings.hero_video_url || ''}
                                    onChange={e => handleSettingChange('hero_video_url', e.target.value)}
                                    placeholder="https://www.youtube.com/embed/XXXXXX"
                                />
                            </div>

                            <div className="cms-editor-footer mt-5">
                                <button
                                    className="btn btn-primary btn-lg w-full"
                                    onClick={() => saveSettings(heroKeys)}
                                    disabled={savingSettings}
                                >
                                    <Save size={18} className="mr-2" />
                                    {savingSettings ? 'Sedang Menyimpan...' : 'Simpan Semua Perubahan Hero'}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Right Side: Live Preview */}
                    <div className="cms-hero-preview">
                        <div className="cms-preview-sticky">
                            <h4 className="cms-preview-label">Live Preview</h4>
                            <div className="cms-hero-live-card">
                                <div className="cms-preview-badge">
                                    {settings.hero_badge_text || "BADGE TEKS"}
                                </div>
                                <h1 className="cms-preview-title">
                                    {settings.hero_title ? settings.hero_title.split('\n').map((line, i) => (
                                        <div key={i}>
                                            {line} {i === 1 && <span className="text-gradient">{settings.hero_highlight}</span>}
                                        </div>
                                    )) : "Judul Utama Hero"}
                                </h1>
                                <p className="cms-preview-subtitle">
                                    {settings.hero_subtitle || "Teks subtitle hero Anda akan tampil di sini..."}
                                </p>

                                {settings.hero_video_url ? (
                                    <div className="cms-preview-video-container">
                                        <iframe
                                            width="100%" height="100%"
                                            src={settings.hero_video_url}
                                            title="YouTube video player" frameBorder="0"
                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                            allowFullScreen
                                        ></iframe>
                                    </div>
                                ) : (
                                    <div className="cms-preview-video-placeholder">
                                        <PlayCircle size={32} className="mb-2" />
                                        <span>Video Preview Belum Tersedia</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    function renderProgramsTab() {
        const programSettingsKeys = ['programs_section_label', 'programs_section_title', 'programs_section_subtitle']
        return (
            <div>
                {/* Section Header Settings */}
                <div className="cms-section-card">
                    <h3 className="cms-section-title">📝 Pengaturan Section</h3>
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
                <div className="cms-section-card" style={{ marginTop: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                        <h3 className="cms-section-title" style={{ marginBottom: 0 }}>🎓 Daftar Program Keahlian</h3>
                        <button className="btn btn-primary btn-sm" onClick={() => openProgramModal()}>
                            <Plus size={14} /> Tambah Program
                        </button>
                    </div>

                    {programs.length === 0 ? (
                        <div className="cms-empty-state">Belum ada program keahlian. Klik tombol "Tambah Program" untuk menambahkan.</div>
                    ) : (
                        <div style={{ display: 'grid', gap: 12 }}>
                            {programs.map(p => (
                                <div key={p.id} className="cms-item-card">
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
            <div className="cms-section-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <div>
                        <h3 className="cms-section-title" style={{ marginBottom: 4 }}>🤝 Logo Mitra / Partner</h3>
                        <p className="cms-section-desc">Logo mitra yang ditampilkan di bawah hero section portal.</p>
                    </div>
                    <button className="btn btn-primary btn-sm" onClick={() => openPartnerModal()}>
                        <Plus size={14} /> Tambah Partner
                    </button>
                </div>

                {partners.length === 0 ? (
                    <div className="cms-empty-state">Belum ada partner. Klik tombol "Tambah Partner" untuk menambahkan.</div>
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
                                                <img src={getDirectDriveUrl(p.logo_url)} alt={p.name} style={{ maxWidth: '100%', maxHeight: '100%', filter: 'brightness(0) saturate(100%)' }} />
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

    function renderSchoolNetworkTab() {
        const schools = getSchoolList()
        return (
            <div className="cms-section-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <div>
                        <h3 className="cms-section-title" style={{ marginBottom: 4 }}>🏫 Network Sekolah Affiliasi</h3>
                        <p className="cms-section-desc">Daftar sekolah yang tampil pada kartu melayang di beranda portal.</p>
                    </div>
                    <button className="btn btn-primary btn-sm" onClick={() => openSchoolModal()}>
                        <Plus size={14} /> Tambah Sekolah
                    </button>
                </div>

                {schools.length === 0 ? (
                    <div className="cms-empty-state">Belum ada data sekolah. Klik tombol &quot;Tambah Sekolah&quot; untuk menambahkan.</div>
                ) : (
                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th style={{ width: 50 }}>No</th>
                                    <th style={{ width: 60 }}>Logo</th>
                                    <th>Nama Sekolah</th>
                                    <th>Singkatan</th>
                                    <th style={{ width: 100 }}>Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {schools.map((s, i) => (
                                    <tr key={s.id}>
                                        <td className="text-center">{i + 1}</td>
                                        <td>
                                            <div style={{ width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f1f5f9', borderRadius: 8, overflow: 'hidden' }}>
                                                {s.logo_url ? (
                                                    <img src={getDirectDriveUrl(s.logo_url)} alt={s.name} style={{ maxWidth: '100%', maxHeight: '100%' }} />
                                                ) : <div style={{ fontSize: '0.6rem', fontWeight: 800 }}>{s.short}</div>}
                                            </div>
                                        </td>
                                        <td><strong>{s.name}</strong></td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 800, color: 'var(--primary-600)' }}>
                                                    {s.short}
                                                </div>
                                                <span>{s.short}</span>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="action-group">
                                                <button className="btn-icon btn-edit" onClick={() => openSchoolModal(s)} title="Edit"><Edit2 size={16} /></button>
                                                <button className="btn-icon btn-delete danger" onClick={() => deleteSchool(s)} title="Hapus"><Trash2 size={16} /></button>
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

    function renderSiteTab() {
        const siteKeys = ['site_title', 'site_description', 'school_name', 'school_tagline', 'footer_description']
        return (
            <div className="cms-section-card">
                <h3 className="cms-section-title">🌐 Informasi Situs & SEO</h3>
                <p className="cms-section-desc">Konfigurasi judul situs, deskripsi SEO, dan identitas sekolah.</p>

                <div className="form-group mb-4">
                    <label>Judul Situs (SEO Title)</label>
                    <input type="text" className="form-control"
                        value={settings.site_title || ''}
                        onChange={e => handleSettingChange('site_title', e.target.value)}
                        placeholder="Contoh: SIAS SMK PPRQ - Portal Informasi Sekolah"
                    />
                </div>

                <div className="form-group mb-4">
                    <label>Deskripsi Situs (SEO Meta Description)</label>
                    <textarea className="form-control" rows={3}
                        value={settings.site_description || ''}
                        onChange={e => handleSettingChange('site_description', e.target.value)}
                        placeholder="Deskripsi singkat mengenai sekolah untuk mesin pencari..."
                    />
                </div>

                <div className="grid-2 gap-4 mb-4">
                    <div className="form-group">
                        <label>Nama Sekolah</label>
                        <input type="text" className="form-control"
                            value={settings.school_name || ''}
                            onChange={e => handleSettingChange('school_name', e.target.value)}
                        />
                    </div>
                    <div className="form-group">
                        <label>Tagline Sekolah</label>
                        <input type="text" className="form-control"
                            value={settings.school_tagline || ''}
                            onChange={e => handleSettingChange('school_tagline', e.target.value)}
                        />
                    </div>
                </div>

                <div className="form-group mb-4">
                    <label>Deskripsi Footer</label>
                    <textarea className="form-control" rows={3}
                        value={settings.footer_description || ''}
                        onChange={e => handleSettingChange('footer_description', e.target.value)}
                    />
                </div>

                <button className="btn btn-primary" onClick={() => saveSettings(siteKeys)} disabled={savingSettings}>
                    <Save size={16} /> {savingSettings ? 'Menyimpan...' : 'Simpan Informasi Situs'}
                </button>
            </div>
        )
    }

    function renderContactTab() {
        const contactKeys = ['contact_email', 'contact_phone', 'contact_address', 'wa_number', 'social_facebook', 'social_instagram', 'social_youtube']
        return (
            <div className="cms-section-card">
                <h3 className="cms-section-title">📞 Kontak & Media Sosial</h3>
                <p className="cms-section-desc">Informasi kontak sekolah dan link akun media sosial resmi.</p>

                <div className="grid-2 gap-4 mb-4">
                    <div className="form-group">
                        <label>Email Kontak</label>
                        <input type="email" className="form-control"
                            value={settings.contact_email || ''}
                            onChange={e => handleSettingChange('contact_email', e.target.value)}
                        />
                    </div>
                    <div className="form-group">
                        <label>Telepon / WhatsApp</label>
                        <input type="text" className="form-control"
                            value={settings.contact_phone || ''}
                            onChange={e => handleSettingChange('contact_phone', e.target.value)}
                        />
                    </div>
                </div>

                <div className="form-group mb-4">
                    <label>No. WhatsApp (Hanya angka, misal: 628123456789)</label>
                    <input type="text" className="form-control"
                        value={settings.wa_number || ''}
                        onChange={e => handleSettingChange('wa_number', e.target.value)}
                    />
                </div>

                <div className="form-group mb-4">
                    <label>Alamat Lengkap</label>
                    <textarea className="form-control" rows={2}
                        value={settings.contact_address || ''}
                        onChange={e => handleSettingChange('contact_address', e.target.value)}
                    />
                </div>

                <div className="divider mb-4" style={{ height: 1, background: '#e2e8f0' }} />
                <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: 12, color: '#475569' }}>LINK MEDIA SOSIAL</h4>

                <div className="form-group mb-4">
                    <label>Facebook URL</label>
                    <input type="url" className="form-control"
                        value={settings.social_facebook || ''}
                        onChange={e => handleSettingChange('social_facebook', e.target.value)}
                        placeholder="https://facebook.com/..."
                    />
                </div>
                <div className="form-group mb-4">
                    <label>Instagram URL</label>
                    <input type="url" className="form-control"
                        value={settings.social_instagram || ''}
                        onChange={e => handleSettingChange('social_instagram', e.target.value)}
                        placeholder="https://instagram.com/..."
                    />
                </div>
                <div className="form-group mb-4">
                    <label>YouTube Channel URL</label>
                    <input type="url" className="form-control"
                        value={settings.social_youtube || ''}
                        onChange={e => handleSettingChange('social_youtube', e.target.value)}
                        placeholder="https://youtube.com/c/..."
                    />
                </div>

                <button className="btn btn-primary" onClick={() => saveSettings(contactKeys)} disabled={savingSettings}>
                    <Save size={16} /> {savingSettings ? 'Menyimpan...' : 'Simpan Kontak & Sosial'}
                </button>
            </div>
        )
    }

    // ==================== MODALS ====================

    function renderProgramModal() {
        const updateFeature = (index, field, value) => {
            const newFeatures = [...programForm.features_json]
            newFeatures[index] = { ...newFeatures[index], [field]: value }
            setProgramForm({ ...programForm, features_json: newFeatures })
        }

        const addListItem = (key, defaultValue) => {
            const newList = [...programForm[key], defaultValue]
            setProgramForm({ ...programForm, [key]: newList })
        }

        const updateListItem = (key, index, field, value) => {
            const newList = [...programForm[key]]
            newList[index] = { ...newList[index], [field]: value }
            setProgramForm({ ...programForm, [key]: newList })
        }

        const removeListItem = (key, index) => {
            const newList = programForm[key].filter((_, i) => i !== index)
            setProgramForm({ ...programForm, [key]: newList })
        }

        return (
            <div className="modal-backdrop">
                <div className="modal" style={{ maxWidth: 800, width: '95%', maxHeight: '90vh', overflowY: 'auto' }}>
                    <div className="modal-header">
                        <h3>{editProgram ? 'Edit Detail Jurusan' : 'Tambah Detail Jurusan'}</h3>
                        <button className="btn-icon" onClick={() => setShowProgramModal(false)}>×</button>
                    </div>
                    <div className="modal-body">
                        <form id="programForm" onSubmit={saveProgram}>
                            <div className="grid-2 gap-4 mb-4">
                                <div className="form-group">
                                    <label>Nama Jurusan <span className="text-danger">*</span></label>
                                    <input type="text" className="form-control" value={programForm.title}
                                        onChange={e => setProgramForm({ ...programForm, title: e.target.value })} required
                                        placeholder="Teknik Komputer & Jaringan"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Slug URL <span className="cms-hint">(misal: tkj)</span></label>
                                    <input type="text" className="form-control" value={programForm.slug}
                                        onChange={e => setProgramForm({ ...programForm, slug: e.target.value })}
                                        placeholder="tkj"
                                    />
                                </div>
                            </div>

                            <div className="grid-2 gap-4 mb-4">
                                <div className="form-group">
                                    <label>Icon Emoji <span className="text-danger">*</span></label>
                                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                        <div style={{ fontSize: 24, width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f1f5f9', borderRadius: 8 }}>
                                            {programForm.icon}
                                        </div>
                                        <input type="text" className="form-control" value={programForm.icon}
                                            onChange={e => setProgramForm({ ...programForm, icon: e.target.value })}
                                            style={{ maxWidth: 60 }} maxLength={2} required
                                        />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label>Warna Tema <span className="cms-hint">(untuk gradient)</span></label>
                                    <div style={{ display: 'flex', gap: 8 }}>
                                        <input type="color" className="form-control" value={programForm.color_theme}
                                            onChange={e => setProgramForm({ ...programForm, color_theme: e.target.value })}
                                            style={{ width: 50, padding: 2, height: 38 }}
                                        />
                                        <input type="text" className="form-control" value={programForm.color_theme}
                                            onChange={e => setProgramForm({ ...programForm, color_theme: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="form-group mb-4">
                                <label>Tagline <span className="cms-hint">(tampil di hero detail)</span></label>
                                <input type="text" className="form-control" value={programForm.tagline}
                                    onChange={e => setProgramForm({ ...programForm, tagline: e.target.value })}
                                    placeholder="Sekolah Pemrograman Terbaik untuk Masa Depan"
                                />
                            </div>

                            <div className="form-group mb-4">
                                <label>Ringkasan Pendek <span className="cms-hint">(tampil di kartu beranda)</span></label>
                                <textarea className="form-control" rows={2} value={programForm.description}
                                    onChange={e => setProgramForm({ ...programForm, description: e.target.value })}
                                    placeholder="Kuasai jaringan, server, dan infrastruktur IT modern..."
                                />
                            </div>

                            <MediaUploadField
                                label="Gambar Banner (3D / Ilustrasi)"
                                value={programForm.banner_image || ''}
                                onChange={(url) => setProgramForm({ ...programForm, banner_image: url })}
                                helperText="Gunakan gambar PNG/WebP transparan untuk hasil terbaik."
                            />

                            <div className="grid-2 gap-4 mb-4">
                                <div className="form-group">
                                    <label>Persentase Kerja <span className="cms-hint">(misal: 90%)</span></label>
                                    <input type="text" className="form-control" value={programForm.stats_json?.labor_absorption || ''}
                                        onChange={e => setProgramForm({ ...programForm, stats_json: { ...programForm.stats_json, labor_absorption: e.target.value } })}
                                        placeholder="90%"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Jumlah Mitra <span className="cms-hint">(misal: 50+)</span></label>
                                    <input type="text" className="form-control" value={programForm.stats_json?.partners_count || ''}
                                        onChange={e => setProgramForm({ ...programForm, stats_json: { ...programForm.stats_json, partners_count: e.target.value } })}
                                        placeholder="50+"
                                    />
                                </div>
                            </div>

                            <hr style={{ margin: '24px 0', borderColor: '#e2e8f0' }} />
                            <h4 style={{ marginBottom: 16 }}>✨ Fitur Keunggulan (4 Card)</h4>
                            <div className="grid-2 gap-4">
                                {programForm.features_json.map((feat, idx) => (
                                    <div key={idx} style={{ padding: 16, background: '#f8fafc', borderRadius: 12, border: '1px solid #e2e8f0' }}>
                                        <div style={{ fontWeight: 700, marginBottom: 10, fontSize: '0.8rem', color: '#64748b' }}>CARD {idx + 1}</div>
                                        <div className="form-group mb-2">
                                            <label style={{ fontSize: '0.75rem' }}>Judul</label>
                                            <input type="text" className="form-control form-control-sm" value={feat.title}
                                                onChange={e => updateFeature(idx, 'title', e.target.value)} />
                                        </div>
                                        <div className="form-group mb-2">
                                            <label style={{ fontSize: '0.75rem' }}>Deskripsi</label>
                                            <textarea className="form-control form-control-sm" rows={2} value={feat.description}
                                                onChange={e => updateFeature(idx, 'description', e.target.value)} />
                                        </div>
                                        <div className="form-group">
                                            <label style={{ fontSize: '0.75rem' }}>Icon/Emoji</label>
                                            <input type="text" className="form-control form-control-sm" value={feat.icon}
                                                onChange={e => updateFeature(idx, 'icon', e.target.value)} placeholder="🚀" />
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* MILESTONES / ROADMAP */}
                            <hr style={{ margin: '24px 0', borderColor: '#e2e8f0' }} />
                            <div className="d-flex justify-content-between align-items-center mb-4">
                                <h4 style={{ margin: 0 }}>📍 Kurikulum Roadmap (Milestones)</h4>
                                <button type="button" className="btn btn-sm btn-outline-primary"
                                    onClick={() => addListItem('milestones_json', { grade: 'Kelas X', title: '', skills: [], icon: 'book', color: '#4f46e5' })}>
                                    <Plus size={14} /> Tambah Milestone
                                </button>
                            </div>
                            <div className="grid-1 gap-4 mb-4">
                                {programForm.milestones_json.map((m, idx) => (
                                    <div key={idx} style={{ padding: 16, background: '#f8fafc', borderRadius: 12, border: '1px solid #e2e8f0', position: 'relative' }}>
                                        <button type="button" className="btn-icon" style={{ position: 'absolute', top: 10, right: 10, color: 'red' }}
                                            onClick={() => removeListItem('milestones_json', idx)}><Trash2 size={16} /></button>
                                        <div className="grid-3 gap-3 mb-3">
                                            <div className="form-group">
                                                <label style={{ fontSize: '0.75rem' }}>Tingkat (Grade)</label>
                                                <input type="text" className="form-control form-control-sm" value={m.grade}
                                                    onChange={e => updateListItem('milestones_json', idx, 'grade', e.target.value)} />
                                            </div>
                                            <div className="form-group">
                                                <label style={{ fontSize: '0.75rem' }}>Judul Milestone</label>
                                                <input type="text" className="form-control form-control-sm" value={m.title}
                                                    onChange={e => updateListItem('milestones_json', idx, 'title', e.target.value)} />
                                            </div>
                                            <div className="form-group">
                                                <label style={{ fontSize: '0.75rem' }}>Warna & Icon</label>
                                                <div className="d-flex gap-2">
                                                    <input type="color" className="form-control form-control-sm" style={{ width: 40, padding: 0 }} value={m.color}
                                                        onChange={e => updateListItem('milestones_json', idx, 'color', e.target.value)} />
                                                    <input type="text" className="form-control form-control-sm" value={m.icon}
                                                        onChange={e => updateListItem('milestones_json', idx, 'icon', e.target.value)} placeholder="book" />
                                                </div>
                                            </div>
                                        </div>
                                        <div className="form-group">
                                            <label style={{ fontSize: '0.75rem' }}>Skills (pisahkan dengan koma)</label>
                                            <input type="text" className="form-control form-control-sm"
                                                value={Array.isArray(m.skills) ? m.skills.join(', ') : m.skills || ''}
                                                onChange={e => updateListItem('milestones_json', idx, 'skills', e.target.value.split(',').map(s => s.trim()))}
                                                placeholder="Skill 1, Skill 2, Skill 3" />
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* SHOWCASE */}
                            <hr style={{ margin: '24px 0', borderColor: '#e2e8f0' }} />
                            <div className="d-flex justify-content-between align-items-center mb-4">
                                <h4 style={{ margin: 0 }}>🎨 Student Showcase (Karya Siswa)</h4>
                                <button type="button" className="btn btn-sm btn-outline-primary"
                                    onClick={() => addListItem('showcase_json', { type: 'image', url: '', title: '', author: '', size: 'standard' })}>
                                    <Plus size={14} /> Tambah Karya
                                </button>
                            </div>
                            <div className="grid-2 gap-4 mb-4">
                                {programForm.showcase_json.map((s, idx) => (
                                    <div key={idx} style={{ padding: 16, background: '#f8fafc', borderRadius: 12, border: '1px solid #e2e8f0', position: 'relative' }}>
                                        <button type="button" className="btn-icon" style={{ position: 'absolute', top: 10, right: 10, color: 'red' }}
                                            onClick={() => removeListItem('showcase_json', idx)}><Trash2 size={16} /></button>
                                        <MediaUploadField
                                            label="Upload Bukti/Gambar"
                                            value={s.thumbnail}
                                            onChange={(url) => updateListItem('showcase_json', idx, 'thumbnail', url)}
                                            compact={true}
                                            previewStyle={{ height: '120px' }}
                                        />
                                        <div className="grid-2 gap-2 mb-2">
                                            <div className="form-group">
                                                <label style={{ fontSize: '0.75rem' }}>Judul Karya</label>
                                                <input type="text" className="form-control form-control-sm" value={s.title}
                                                    onChange={e => updateListItem('showcase_json', idx, 'title', e.target.value)} />
                                            </div>
                                            <div className="form-group">
                                                <label style={{ fontSize: '0.75rem' }}>Penulis/Siswa</label>
                                                <input type="text" className="form-control form-control-sm" value={s.author}
                                                    onChange={e => updateListItem('showcase_json', idx, 'author', e.target.value)} />
                                            </div>
                                        </div>
                                        <div className="grid-2 gap-2">
                                            <div className="form-group">
                                                <label style={{ fontSize: '0.75rem' }}>Tipe</label>
                                                <select className="form-control form-control-sm" value={s.type}
                                                    onChange={e => updateListItem('showcase_json', idx, 'type', e.target.value)}>
                                                    <option value="image">Image</option>
                                                    <option value="video">Video</option>
                                                </select>
                                            </div>
                                            <div className="form-group">
                                                <label style={{ fontSize: '0.75rem' }}>Ukuran Bento</label>
                                                <select className="form-control form-control-sm" value={s.size}
                                                    onChange={e => updateListItem('showcase_json', idx, 'size', e.target.value)}>
                                                    <option value="standard">Standard</option>
                                                    <option value="large">Large (2x2)</option>
                                                    <option value="tall">Tall (1x2)</option>
                                                    <option value="wide">Wide (2x1)</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* CAREERS */}
                            <hr style={{ margin: '24px 0', borderColor: '#e2e8f0' }} />
                            <div className="d-flex justify-content-between align-items-center mb-4">
                                <h4 style={{ margin: 0 }}>💼 Prospek Karir (Lulusan Mau Jadi Apa?)</h4>
                                <button type="button" className="btn btn-sm btn-outline-primary"
                                    onClick={() => addListItem('careers_json', { title: '', description: '' })}>
                                    <Plus size={14} /> Tambah Karir
                                </button>
                            </div>
                            <div className="grid-2 gap-4 mb-4">
                                {(programForm.careers_json || []).map((c, idx) => (
                                    <div key={idx} style={{ padding: 16, background: '#f8fafc', borderRadius: 12, border: '1px solid #e2e8f0', position: 'relative' }}>
                                        <button type="button" className="btn-icon" style={{ position: 'absolute', top: 10, right: 10, color: 'red' }}
                                            onClick={() => removeListItem('careers_json', idx)}><Trash2 size={16} /></button>
                                        <div className="form-group mb-2">
                                            <label style={{ fontSize: '0.75rem' }}>Judul Karir / Role</label>
                                            <input type="text" className="form-control form-control-sm" value={c.title}
                                                onChange={e => updateListItem('careers_json', idx, 'title', e.target.value)}
                                                placeholder="Contoh: Web Developer" />
                                        </div>
                                        <div className="form-group">
                                            <label style={{ fontSize: '0.75rem' }}>Deskripsi Singkat</label>
                                            <textarea className="form-control form-control-sm" rows={2} value={c.description}
                                                onChange={e => updateListItem('careers_json', idx, 'description', e.target.value)}
                                                placeholder="Contoh: Merancang dan membangun website modern." />
                                        </div>
                                    </div>
                                ))}
                                {(!programForm.careers_json || programForm.careers_json.length === 0) && (
                                    <div style={{ gridColumn: 'span 2', textAlign: 'center', padding: 20, color: '#94a3b8', border: '2px dashed #e2e8f0', borderRadius: 12 }}>
                                        Belum ada data prospek karir. Klik &quot;Tambah Karir&quot;.
                                    </div>
                                )}
                            </div>

                            {/* ALUMNI */}
                            <hr style={{ margin: '24px 0', borderColor: '#e2e8f0' }} />
                            <div className="d-flex justify-content-between align-items-center mb-4">
                                <h4 style={{ margin: 0 }}>👨‍🎓 Alumni Success Stories</h4>
                                <button type="button" className="btn btn-sm btn-outline-primary"
                                    onClick={() => addListItem('alumni_json', { name: '', role: '', company: '', quote: '', image: '' })}>
                                    <Plus size={14} /> Tambah Alumni
                                </button>
                            </div>
                            <div className="grid-1 gap-3 mb-4">
                                {programForm.alumni_json.map((a, idx) => (
                                    <div key={idx} style={{ padding: 12, background: '#f8fafc', borderRadius: 12, border: '1px solid #e2e8f0', position: 'relative' }}>
                                        <button type="button" className="btn-icon" style={{ position: 'absolute', top: 8, right: 8, color: 'red' }}
                                            onClick={() => removeListItem('alumni_json', idx)}><Trash2 size={14} /></button>

                                        <div style={{ display: 'flex', gap: 16 }}>
                                            {/* Photo Column */}
                                            <div style={{ width: 140, flexShrink: 0 }}>
                                                <MediaUploadField
                                                    label="Foto"
                                                    value={a.image}
                                                    onChange={(url) => updateListItem('alumni_json', idx, 'image', url)}
                                                    compact={true}
                                                />
                                            </div>

                                            {/* Info Column */}
                                            <div style={{ flex: 1 }}>
                                                <div className="grid-3 gap-2 mb-2">
                                                    <div className="form-group">
                                                        <label style={{ fontSize: '0.7rem' }}>Nama</label>
                                                        <input type="text" className="form-control form-control-sm" value={a.name}
                                                            onChange={e => updateListItem('alumni_json', idx, 'name', e.target.value)} />
                                                    </div>
                                                    <div className="form-group">
                                                        <label style={{ fontSize: '0.7rem' }}>Jabatan</label>
                                                        <input type="text" className="form-control form-control-sm" value={a.role}
                                                            onChange={e => updateListItem('alumni_json', idx, 'role', e.target.value)} />
                                                    </div>
                                                    <div className="form-group">
                                                        <label style={{ fontSize: '0.7rem' }}>Perusahaan</label>
                                                        <input type="text" className="form-control form-control-sm" value={a.company}
                                                            onChange={e => updateListItem('alumni_json', idx, 'company', e.target.value)} />
                                                    </div>
                                                </div>
                                                <div className="form-group">
                                                    <label style={{ fontSize: '0.7rem' }}>Testimoni Singkat</label>
                                                    <textarea className="form-control form-control-sm" rows={1} value={a.quote}
                                                        onChange={e => updateListItem('alumni_json', idx, 'quote', e.target.value)}
                                                        style={{ resize: 'none' }} />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <hr style={{ margin: '24px 0', borderColor: '#e2e8f0' }} />
                            <div className="form-group mb-4">
                                <label>Konten Lengkap <span className="cms-hint">(HTML didukung)</span></label>
                                <textarea className="form-control" rows={10} value={programForm.full_content}
                                    onChange={e => setProgramForm({ ...programForm, full_content: e.target.value })}
                                    placeholder="Tulis detail lengkap jurusan di sini..."
                                />
                            </div>

                            <div className="grid-2 gap-4 mb-4">
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
                            {savingProgram ? 'Menyimpan...' : 'Simpan Detail Jurusan'}
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
                            <MediaUploadField
                                label="Logo Partner"
                                value={partnerForm.logo_url}
                                onChange={(url) => setPartnerForm({ ...partnerForm, logo_url: url })}
                                helperText="Disarankan menggunakan logo monokrom/SVG untuk tampilan terbaik."
                                previewStyle={{ height: '120px', background: '#f8f9fa' }}
                            />
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

    function renderSchoolModal() {
        return (
            <div className="modal-backdrop">
                <div className="modal" style={{ maxWidth: 400 }}>
                    <div className="modal-header">
                        <h3>{editSchool ? 'Edit Data Sekolah' : 'Tambah Sekolah'}</h3>
                        <button className="btn-icon" onClick={() => setShowSchoolModal(false)}>×</button>
                    </div>
                    <div className="modal-body">
                        <form id="schoolForm" onSubmit={saveSchool}>
                            <div className="form-group mb-4">
                                <label>Nama Sekolah <span className="text-danger">*</span></label>
                                <input type="text" className="form-control" value={schoolForm.name}
                                    onChange={e => setSchoolForm({ ...schoolForm, name: e.target.value })} required
                                    placeholder="Contoh: MTS PPRQ"
                                />
                            </div>
                            <div className="form-group mb-2">
                                <label>Singkatan (Max 4 char) <span className="text-danger">*</span></label>
                                <input type="text" className="form-control" value={schoolForm.short}
                                    onChange={e => setSchoolForm({ ...schoolForm, short: e.target.value.toUpperCase() })}
                                    maxLength={4} required
                                    placeholder="MTS"
                                />
                                <p className="cms-hint mt-1">Teks ini akan tampil jika logo tidak ada.</p>
                            </div>
                            <MediaUploadField
                                label="Logo Sekolah (PNG/SVG)"
                                value={schoolForm.logo_url}
                                onChange={(url) => setSchoolForm({ ...schoolForm, logo_url: url })}
                                helperText="Gunakan logo dengan latar transparan."
                                previewStyle={{ height: '100px', background: '#f8f9fa' }}
                            />
                        </form>
                    </div>
                    <div className="modal-footer">
                        <button className="btn btn-secondary" onClick={() => setShowSchoolModal(false)} disabled={savingSchool}>Batal</button>
                        <button type="submit" form="schoolForm" className="btn btn-primary" disabled={savingSchool}>
                            {savingSchool ? 'Menyimpan...' : 'Simpan Data'}
                        </button>
                    </div>
                </div>
            </div>
        )
    }
}

