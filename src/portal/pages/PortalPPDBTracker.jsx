import { useState, useRef } from 'react'
import { Helmet } from 'react-helmet-async'
import { Search, MapPin, School, Calendar, Download, Loader2 } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import html2canvas from 'html2canvas'
import { API_BASE_PUBLIC, getMediaUrl } from '../../services/api'



export default function PortalPPDBTracker() {
    const [regNumber, setRegNumber] = useState('')
    const [loading, setLoading] = useState(false)
    const [data, setData] = useState(null)
    const [error, setError] = useState('')
    const cardRef = useRef(null)

    const handleTrack = async (e) => {
        e.preventDefault()
        if (!regNumber.trim()) return
        setLoading(true); setError(''); setData(null)
        try {
            const res = await fetch(`${API_BASE_PUBLIC}/ppdb/track/${encodeURIComponent(regNumber.trim())}`)
            const json = await res.json()
            if (json.error) setError(json.error)
            else setData(json)
        } catch { setError('Gagal menghubungkan ke server.') }
        finally { setLoading(false) }
    }

    const handleDownloadCard = async () => {
        if (!cardRef.current) return
        try {
            const canvas = await html2canvas(cardRef.current, { scale: 2, backgroundColor: '#ffffff', useCORS: true })
            const link = document.createElement('a')
            link.download = `Kartu_PPDB_${data.registration_number}.png`
            link.href = canvas.toDataURL('image/png')
            link.click()
        } catch(e) { console.error(e) }
    }

    const currentStepIdx = data ? data.steps.filter(s => s.done).length - 1 : -1

    return (
        <div className="portal-page" style={{ background: 'linear-gradient(135deg, #f0f4ff 0%, #faf5ff 50%, #fff1f2 100%)', minHeight: '100vh', paddingTop: '100px' }}>
            <Helmet><title>Lacak Status PPDB</title></Helmet>
            <div className="portal-container" style={{ maxWidth: '700px' }}>

                {/* Header */}
                <div style={{ textAlign: 'center', marginBottom: '36px' }}>
                    <div style={{ width: 72, height: 72, background: 'var(--portal-gradient-soft)', color: 'var(--portal-primary)', borderRadius: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', boxShadow: '0 8px 20px rgba(99,102,241,0.15)' }}><MapPin size={32} /></div>
                    <h1 style={{ fontSize: '2rem', fontWeight: 900, color: '#1e293b', marginBottom: '8px' }}>Lacak Status PPDB</h1>
                    <p style={{ color: '#64748b', fontSize: '1rem', maxWidth: '450px', margin: '0 auto' }}>Masukkan nomor registrasi untuk melihat progres pendaftaran Anda secara real-time.</p>
                </div>

                {/* Search Form */}
                <div style={{ 
                    background: 'rgba(255, 255, 255, 0.7)', 
                    backdropFilter: 'blur(10px)', 
                    borderRadius: '24px', 
                    padding: '24px', 
                    boxShadow: '0 10px 20px rgba(0,0,0,0.05)',
                    marginBottom: '32px',
                    border: '1px solid rgba(255,255,255,0.8)'
                }}>
                    <form onSubmit={handleTrack} style={{ display: 'flex', gap: '12px' }}>
                        <div style={{ position: 'relative', flex: 1 }}>
                            <Search size={20} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                            <input 
                                type="text" 
                                className="portal-form-input" 
                                value={regNumber} 
                                onChange={e => setRegNumber(e.target.value)} 
                                placeholder="Nomor Registrasi..." 
                                style={{ 
                                    width: '100%', 
                                    height: '56px', 
                                    borderRadius: '16px', 
                                    fontSize: '1rem', 
                                    fontWeight: 600, 
                                    paddingLeft: '48px',
                                    border: '1px solid #f1f5f9',
                                    background: 'white'
                                }} 
                            />
                        </div>
                        <button type="submit" className="portal-btn portal-btn-primary" style={{ height: '56px', borderRadius: '16px', padding: '0 24px', fontWeight: 800, whiteSpace: 'nowrap', boxShadow: '0 8px 16px rgba(79,70,229,0.2)' }} disabled={loading}>
                            {loading ? <Loader2 className="animate-spin" size={20} /> : 'Cek'}
                        </button>
                    </form>
                </div>

                {error && <div style={{ background: '#fee2e2', color: '#991b1b', padding: '16px 20px', borderRadius: '14px', fontWeight: 600, marginBottom: '24px', border: '1px solid #fecaca' }}>{error}</div>}

                {data && (
                    <div style={{ animation: 'fadeInUp 0.4s ease-out' }}>
                        {/* Student Info Card */}
                        <div style={{ background: 'white', borderRadius: '24px', padding: '28px', boxShadow: '0 10px 30px rgba(0,0,0,0.06)', marginBottom: '24px' }}>
                            <div style={{ display: 'flex', gap: '20px', alignItems: 'center', marginBottom: '24px' }}>
                                {data.foto_path ? (
                                    <img src={getMediaUrl(data.foto_path)} alt="Foto" style={{ width: 64, height: 85, objectFit: 'cover', borderRadius: '12px', border: '2px solid #e2e8f0' }} />
                                ) : (
                                    <div style={{ width: 64, height: 85, borderRadius: '12px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', border: '2px solid #e2e8f0' }}><Search size={24} /></div>
                                )}
                                <div>
                                    <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 900, color: '#1e293b' }}>{data.nama}</h2>
                                    <p style={{ margin: '4px 0', color: 'var(--portal-primary)', fontWeight: 700, fontSize: '0.9rem' }}>{data.registration_number}</p>
                                    <div style={{ display: 'flex', gap: '12px', fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><School size={14} /> {data.asal_sekolah}</span>
                                        {data.gelombang && <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Calendar size={14} /> {data.gelombang}</span>}
                                    </div>
                                </div>
                            </div>

                            {/* Timeline */}
                            <div style={{ position: 'relative', padding: '0 0 0 28px' }}>
                                {/* Vertical line */}
                                <div style={{ position: 'absolute', left: '14px', top: '4px', bottom: '4px', width: '3px', background: '#e2e8f0', borderRadius: '2px' }} />
                                {data.steps.map((step, i) => {
                                    const isCurrent = i === currentStepIdx
                                    return (
                                        <div key={i} style={{ position: 'relative', paddingBottom: i < data.steps.length - 1 ? '28px' : '0', display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                                            {/* Dot */}
                                            <div style={{
                                                position: 'absolute', left: '-21px', top: '2px',
                                                width: step.done ? 22 : 18, height: step.done ? 22 : 18,
                                                borderRadius: '50%',
                                                background: step.done ? '#10b981' : '#e2e8f0',
                                                border: isCurrent ? '3px solid rgba(16,185,129,0.3)' : 'none',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                color: 'white', fontSize: '0.7rem', fontWeight: 900,
                                                animation: isCurrent ? 'pulse 2s infinite' : 'none',
                                                boxShadow: step.done ? '0 2px 8px rgba(16,185,129,0.3)' : 'none'
                                            }}>
                                                {step.done ? '✓' : ''}
                                            </div>
                                            {/* Content */}
                                            <div style={{ marginLeft: '12px' }}>
                                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                                    <span style={{ fontSize: '1.2rem' }}>{step.icon}</span>
                                                    <span style={{ fontWeight: 800, color: step.done ? '#1e293b' : '#94a3b8', fontSize: '0.95rem' }}>{step.label}</span>
                                                </div>
                                                {step.done && step.date && <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>{new Date(step.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>}
                                                {isCurrent && <span style={{ display: 'inline-block', marginTop: '4px', padding: '2px 10px', borderRadius: '6px', background: 'rgba(16,185,129,0.1)', color: '#10b981', fontSize: '0.75rem', fontWeight: 800 }}>Tahap saat ini</span>}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>

                        {/* Registration Card with QR */}
                        <div ref={cardRef} style={{ 
                            background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)', 
                            borderRadius: '32px', 
                            padding: '32px', 
                            boxShadow: '0 20px 40px rgba(0,0,0,0.08)', 
                            marginBottom: '24px',
                            border: '1px solid #e2e8f0',
                            position: 'relative',
                            overflow: 'hidden'
                        }}>
                            <div style={{ position: 'absolute', top: '-10%', right: '-10%', width: '150px', height: '150px', background: 'rgba(79,70,229,0.03)', borderRadius: '50%' }} />
                            
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '20px', position: 'relative' }}>
                                <div>
                                    <div style={{ 
                                        display: 'inline-block',
                                        padding: '4px 12px',
                                        background: 'rgba(79,70,229,0.1)',
                                        color: '#4f46e5',
                                        borderRadius: '8px',
                                        fontSize: '0.65rem', 
                                        fontWeight: 900, 
                                        textTransform: 'uppercase', 
                                        letterSpacing: '0.1em', 
                                        marginBottom: '12px' 
                                    }}>Kartu Digital Siswa Baru</div>
                                    <h3 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 900, color: '#1e293b', letterSpacing: '-0.02em' }}>{data.nama}</h3>
                                    <p style={{ margin: '6px 0 0', fontWeight: 800, color: '#4f46e5', fontSize: '1.05rem' }}>{data.registration_number}</p>
                                    <p style={{ margin: '4px 0', fontSize: '0.85rem', color: '#64748b', fontWeight: 500 }}>{data.asal_sekolah}</p>
                                </div>
                                <div style={{ flexShrink: 0, padding: '12px', background: 'white', borderRadius: '20px', boxShadow: '0 8px 16px rgba(0,0,0,0.04)', border: '1px solid #f1f5f9' }}>
                                    <QRCodeSVG value={data.registration_number} size={90} level="H" includeMargin={true} />
                                </div>
                            </div>
                        </div>

                        <button onClick={handleDownloadCard} className="portal-btn" style={{ width: '100%', height: '58px', background: 'white', border: '2px solid #e2e8f0', borderRadius: '18px', fontWeight: 800, color: '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', transition: 'all 0.2s', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
                            <Download size={20} /> Simpan Kartu PDF / Gambar
                        </button>
                    </div>
                )}
            </div>

            <style>{`
                @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
                @keyframes pulse { 0%, 100% { box-shadow: 0 0 0 0 rgba(16,185,129,0.4); } 50% { box-shadow: 0 0 0 8px rgba(16,185,129,0); } }
            `}</style>
        </div>
    )
}
