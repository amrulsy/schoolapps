import { useState } from 'react'
import { usePortal } from '../context/PortalContext'

export default function PortalContact() {
    const { postPublic, fetchPublic } = usePortal()
    const [form, setForm] = useState({ nama: '', email: '', telepon: '', subjek: '', pesan: '' })
    const [settings, setSettings] = useState({})
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)
    const [error, setError] = useState(null)

    useEffect(() => {
        async function loadSettings() {
            const data = await fetchPublic('/settings')
            if (data) setSettings(data)
        }
        loadSettings()
    }, [fetchPublic])

    function handleChange(e) {
        setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
    }

    async function handleSubmit(e) {
        e.preventDefault()
        if (!form.nama || !form.pesan) {
            setError('Nama dan pesan harus diisi.')
            return
        }

        setLoading(true)
        setError(null)
        setSuccess(false)

        const result = await postPublic('/contact', form)

        if (result.error) {
            setError(result.error)
        } else {
            setSuccess(true)
            setForm({ nama: '', email: '', telepon: '', subjek: '', pesan: '' })
        }
        setLoading(false)
    }

    const contactInfo = [
        { icon: '📍', label: 'Alamat', value: settings.contact_address || 'Jl. Pendidikan No. 1, Jakarta' },
        { icon: '📞', label: 'Telepon', value: settings.contact_phone || '021-XXXXXXX' },
        { icon: '✉️', label: 'Email', value: settings.contact_email || 'info@smkpprq.sch.id' },
        { icon: '🕐', label: 'Jam Operasional', value: settings.contact_hours || 'Senin - Jumat: 07:00 - 15:00 WIB' },
    ]

    return (
        <div className="portal-page">
            <div className="portal-page-header">
                <div className="portal-container">
                    <h1>📞 Hubungi Kami</h1>
                    <p>Ada pertanyaan? Jangan ragu untuk menghubungi kami.</p>
                </div>
            </div>

            <section className="portal-section">
                <div className="portal-container">
                    <div className="portal-contact-grid">
                        {/* Form */}
                        <div>
                            <h2 style={{ fontSize: '1.3rem', fontWeight: '700', marginBottom: '24px' }}>
                                Kirim Pesan
                            </h2>

                            {success && (
                                <div className="portal-alert portal-alert-success">
                                    ✅ Pesan berhasil dikirim! Kami akan segera merespons.
                                </div>
                            )}

                            {error && (
                                <div className="portal-alert portal-alert-error">
                                    ❌ {error}
                                </div>
                            )}

                            <form onSubmit={handleSubmit}>
                                <div className="portal-form-group">
                                    <label className="portal-form-label">Nama Lengkap *</label>
                                    <input className="portal-form-input" name="nama" value={form.nama} onChange={handleChange} placeholder="Masukkan nama Anda" required />
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                    <div className="portal-form-group">
                                        <label className="portal-form-label">Email</label>
                                        <input className="portal-form-input" name="email" type="email" value={form.email} onChange={handleChange} placeholder="email@contoh.com" />
                                    </div>
                                    <div className="portal-form-group">
                                        <label className="portal-form-label">Telepon</label>
                                        <input className="portal-form-input" name="telepon" value={form.telepon} onChange={handleChange} placeholder="08xxxx" />
                                    </div>
                                </div>

                                <div className="portal-form-group">
                                    <label className="portal-form-label">Subjek</label>
                                    <input className="portal-form-input" name="subjek" value={form.subjek} onChange={handleChange} placeholder="Perihal pesan Anda" />
                                </div>

                                <div className="portal-form-group">
                                    <label className="portal-form-label">Pesan *</label>
                                    <textarea className="portal-form-textarea" name="pesan" value={form.pesan} onChange={handleChange} placeholder="Tulis pesan Anda di sini..." required />
                                </div>

                                <button type="submit" className="portal-btn portal-btn-primary portal-btn-lg" disabled={loading} style={{ width: '100%', justifyContent: 'center' }}>
                                    {loading ? '⏳ Mengirim...' : '✉️ Kirim Pesan'}
                                </button>
                            </form>
                        </div>

                        {/* Contact Info */}
                        <div>
                            <h2 style={{ fontSize: '1.3rem', fontWeight: '700', marginBottom: '24px' }}>
                                Informasi Kontak
                            </h2>

                            {contactInfo.map((info, i) => (
                                <div key={i} className="portal-contact-info-card">
                                    <div className="portal-contact-info-icon">{info.icon}</div>
                                    <div>
                                        <div className="portal-contact-info-label">{info.label}</div>
                                        <div className="portal-contact-info-value">{info.value}</div>
                                    </div>
                                </div>
                            ))}

                            {/* Map placeholder */}
                            <div className="portal-card" style={{
                                marginTop: '24px', height: '220px',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                background: 'var(--portal-bg-alt)', border: '2px dashed var(--portal-border)',
                                overflow: 'hidden', padding: 0
                            }}>
                                {settings.contact_maps_embed ? (
                                    <div style={{ width: '100%', height: '100%' }} dangerouslySetInnerHTML={{ __html: settings.contact_maps_embed }} />
                                ) : (
                                    <div style={{ textAlign: 'center', color: 'var(--portal-text-muted)' }}>
                                        <div style={{ fontSize: '2rem', marginBottom: '8px' }}>🗺️</div>
                                        <p style={{ margin: 0, fontSize: '0.85rem' }}>Google Maps dapat ditambahkan melalui CMS admin.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    )
}
