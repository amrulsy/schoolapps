import { useState, useEffect } from 'react'
import { useApp } from '../context/AppContext'
import { Save, RefreshCw, Globe, Mail, Phone, Share2, Shield, Layout, Radio, MessageSquare, BookOpen } from 'lucide-react'
import RichTextEditor from '../components/RichTextEditor'

import { API_BASE_CMS as API_BASE, getAuthHeaders, getBearerHeader } from '../services/api'

export default function CmsSettingsPage() {
    const { addToast } = useApp()
    const [settings, setSettings] = useState([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [form, setForm] = useState({})

    useEffect(() => {
        loadSettings()
    }, [])

    const loadSettings = async () => {
        try {
            setLoading(true)
            const res = await fetch(`${API_BASE}/settings`, {
                headers: getBearerHeader()
            })
            if (res.ok) {
                const data = await res.json()
                setSettings(data)
                const map = {}
                data.forEach(s => {
                    map[s.setting_key] = s.setting_value
                })
                setForm(map)
            }
        } catch (err) {
            addToast('danger', 'Error', 'Gagal memuat pengaturan')
        } finally {
            setLoading(false)
        }
    }

    const handleChange = (key, value) => {
        setForm(prev => ({ ...prev, [key]: value }))
    }

    const handleSubmit = async (e) => {
        if (e) e.preventDefault()
        setSaving(true)
        try {
            const updates = Object.keys(form).map(key => ({
                setting_key: key,
                setting_value: form[key]
            }))

            const res = await fetch(`${API_BASE}/settings`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify({ updates })
            })

            if (res.ok) {
                addToast('success', 'Berhasil', 'Pengaturan berhasil disimpan')
                loadSettings()
            } else {
                const err = await res.json()
                addToast('danger', 'Gagal', err.error || 'Terjadi kesalahan')
            }
        } catch (err) {
            addToast('danger', 'Error', 'Gagal menyimpan pengaturan')
        } finally {
            setSaving(false)
        }
    }

    const formatLabel = (key) => {
        return key.replace(/^(social_|contact_|school_)/, '').replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
    }

    const renderSettingInput = (s) => {
        const value = form[s.setting_key] || ''
        const originalValue = settings.find(orig => orig.setting_key === s.setting_key)?.setting_value
        const isChanged = value !== originalValue
        const isRichText = ['school_profile_content', 'school_vision_mission_content'].includes(s.setting_key)

        if (s.setting_type === 'boolean' || ['registration_open'].includes(s.setting_key)) {
            const isTrue = value === 'true' || value === '1'
            return (
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: 8, padding: 4 }}>
                        <button
                            type="button"
                            className={`btn btn-sm ${isTrue ? 'btn-primary' : ''}`}
                            style={{ border: 'none', boxShadow: isTrue ? '0 2px 4px rgba(0,0,0,0.1)' : 'none', background: isTrue ? '' : 'transparent', color: isTrue ? '' : '#64748b' }}
                            onClick={() => handleChange(s.setting_key, 'true')}
                        >
                            Buka
                        </button>
                        <button
                            type="button"
                            className={`btn btn-sm ${!isTrue ? 'btn-primary' : ''}`}
                            style={{ border: 'none', boxShadow: !isTrue ? '0 2px 4px rgba(0,0,0,0.1)' : 'none', background: !isTrue ? '' : 'transparent', color: !isTrue ? '' : '#64748b' }}
                            onClick={() => handleChange(s.setting_key, 'false')}
                        >
                            Tutup
                        </button>
                    </div>
                    {isChanged && <span className="badge badge-warning">Berubah</span>}
                </div>
            )
        }

        if (isRichText) {
            return (
                <div style={{ border: isChanged ? '1px solid var(--warning-color)' : '', borderRadius: 8, overflow: 'hidden' }}>
                    <RichTextEditor
                        value={value}
                        onChange={(val) => handleChange(s.setting_key, val)}
                    />
                </div>
            )
        }

        if (s.setting_type === 'textarea') {
            return (
                <textarea
                    className="form-control"
                    rows="3"
                    value={value}
                    onChange={(e) => handleChange(s.setting_key, e.target.value)}
                    style={{ border: isChanged ? '1px solid var(--warning-color)' : '' }}
                />
            )
        }

        return (
            <div style={{ position: 'relative' }}>
                <input
                    type="text"
                    className="form-control"
                    value={value}
                    onChange={(e) => handleChange(s.setting_key, e.target.value)}
                    style={{ border: isChanged ? '1px solid var(--warning-color)' : '' }}
                />
                {isChanged && <div style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)' }}><span className="badge badge-warning">!</span></div>}
            </div>
        )
    }

    if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Memuat pengaturan...</div>

    const generalKeys = ['site_title', 'site_description', 'school_name', 'school_tagline', 'footer_description']
    const schoolInfoKeys = ['school_profile_content', 'school_vision_mission_content']
    const contactKeys = ['contact_email', 'contact_phone', 'contact_hours', 'contact_address', 'contact_maps_embed', 'wa_number']
    const socialKeys = ['social_facebook', 'social_instagram', 'social_youtube', 'social_twitter']
    const registrationKeys = ['registration_open', 'ppdb_year', 'registration_message', 'registration_link']

    const generalSettings = settings.filter(s => generalKeys.includes(s.setting_key))
    const schoolInfoSettings = settings.filter(s => schoolInfoKeys.includes(s.setting_key))
    const contactSettings = settings.filter(s => contactKeys.includes(s.setting_key))
    const socialSettings = settings.filter(s => socialKeys.includes(s.setting_key))
    const registrationSettings = settings.filter(s => registrationKeys.includes(s.setting_key))

    return (
        <div className="fade-in">
            <div className="page-header">
                <div>
                    <h1>Pengaturan Portal</h1>
                    <p className="text-secondary">Kelola informasi publik dan konfigurasi website</p>
                </div>
                <div className="actions">
                    <button className="btn btn-outline" onClick={loadSettings} disabled={saving}>
                        <RefreshCw size={16} /> Segarkan
                    </button>
                    <button className="btn btn-primary" onClick={handleSubmit} disabled={saving}>
                        <Save size={16} /> {saving ? 'Menyimpan...' : 'Simpan Semua'}
                    </button>
                </div>
            </div>

            <div className="row">
                <div className="col-md-7">
                    <div className="card mb-4">
                        <h2 style={{ fontSize: '1.1rem', padding: '16px 24px', margin: 0, borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: 10 }}>
                            <Globe size={18} color="var(--primary-color)" /> Informasi Umum
                        </h2>
                        <div style={{ padding: '24px' }}>
                            {generalSettings.map(s => (
                                <div key={s.setting_key} className="form-group mb-4">
                                    <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: 8 }}>
                                        {s.description || formatLabel(s.setting_key)}
                                    </label>
                                    {renderSettingInput(s)}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="card mb-4">
                        <h2 style={{ fontSize: '1.1rem', padding: '16px 24px', margin: 0, borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: 10 }}>
                            <BookOpen size={18} color="#059669" /> Isi Halaman Informasi
                        </h2>
                        <div style={{ padding: '24px' }}>
                            <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: 20 }}>
                                Konten ini akan tampil di halaman <strong>/informasi</strong> pada tab Profil dan Visi Misi.
                            </p>
                            {schoolInfoSettings.map(s => (
                                <div key={s.setting_key} className="form-group mb-4">
                                    <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: 12 }}>
                                        {s.description || formatLabel(s.setting_key)}
                                    </label>
                                    {renderSettingInput(s)}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="col-md-5">

                    <div className="card mb-4">
                        <h2 style={{ fontSize: '1.1rem', padding: '16px 24px', margin: 0, borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: 10 }}>
                            <Radio size={18} color="#e11d48" /> Pendaftaran / PPDB
                        </h2>
                        <div style={{ padding: '24px' }}>
                            {registrationSettings.map(s => (
                                <div key={s.setting_key} className="form-group mb-4">
                                    <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: 8 }}>
                                        {s.description || formatLabel(s.setting_key)}
                                    </label>
                                    {renderSettingInput(s)}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="col-md-6">
                    <div className="card mb-4">
                        <h2 style={{ fontSize: '1.1rem', padding: '16px 24px', margin: 0, borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: 10 }}>
                            <Mail size={18} color="#2563eb" /> Kontak & Alamat
                        </h2>
                        <div style={{ padding: '24px' }}>
                            {contactSettings.map(s => (
                                <div key={s.setting_key} className="form-group mb-4">
                                    <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: 8 }}>
                                        {s.description || formatLabel(s.setting_key)}
                                    </label>
                                    {renderSettingInput(s)}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="card mb-4">
                        <h2 style={{ fontSize: '1.1rem', padding: '16px 24px', margin: 0, borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: 10 }}>
                            <Share2 size={18} color="#8b5cf6" /> Media Sosial
                        </h2>
                        <div style={{ padding: '24px' }}>
                            {socialSettings.map(s => (
                                <div key={s.setting_key} className="form-group mb-4">
                                    <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: 8 }}>
                                        {s.description || formatLabel(s.setting_key)}
                                    </label>
                                    {renderSettingInput(s)}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

