import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { usePortal } from '../context/PortalContext'
import { ArrowRight, CheckCircle, ChevronRight, BookOpen, Users, Trophy, Target } from 'lucide-react'

export default function PortalProgramDetail() {
    const { slug } = useParams()
    const { fetchPublic } = usePortal()
    const [program, setProgram] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        async function loadProgram() {
            setLoading(true)
            setError(null)
            const data = await fetchPublic(`/programs/${slug}`)
            if (data && !data.error) {
                setProgram(data)
            } else {
                setError('Jurusan tidak ditemukan.')
            }
            setLoading(false)
        }
        loadProgram()
        window.scrollTo(0, 0)
    }, [slug, fetchPublic])

    if (loading) {
        return (
            <div className="portal-page">
                <div style={{ height: '400px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div className="portal-skeleton" style={{ height: '40px', width: '300px' }} />
                </div>
                <div className="portal-container" style={{ marginTop: '-60px' }}>
                    <div className="portal-grid portal-grid-4">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="portal-skeleton" style={{ height: '200px', borderRadius: '16px' }} />
                        ))}
                    </div>
                </div>
            </div>
        )
    }

    if (error || !program) {
        return (
            <div className="portal-page" style={{ textAlign: 'center', padding: '100px 20px' }}>
                <h1 style={{ fontSize: '4rem', marginBottom: '16px' }}>🧐</h1>
                <h2>{error || 'Jurusan tidak ditemukan.'}</h2>
                <Link to="/" className="portal-btn portal-btn-primary" style={{ marginTop: '24px' }}>
                    Kembali ke Beranda
                </Link>
            </div>
        )
    }

    const themeColor = program.color_theme || '#4f46e5'
    const features = program.features_json || []

    return (
        <div className="portal-page portal-program-detail">
            {/* ====== HERO SECTION ====== */}
            <section className="program-hero" style={{
                background: `linear-gradient(135deg, ${themeColor}, ${themeColor}dd)`,
                position: 'relative',
                overflow: 'hidden',
                padding: '100px 0 120px 0',
                color: '#fff'
            }}>
                <div className="portal-bg-shapes">
                    <div className="portal-shape-blur" style={{ opacity: 0.3, background: '#fff', top: '-10%', right: '-10%' }} />
                    <div className="portal-shape-blur" style={{ opacity: 0.2, background: '#000', bottom: '-10%', left: '-10%' }} />
                </div>

                <div className="portal-container">
                    <div className="portal-grid portal-grid-2" style={{ alignItems: 'center', gap: '48px' }}>
                        <div className="hero-text-content" style={{ zIndex: 10 }}>
                            <div className="program-badge" style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '8px 16px',
                                background: 'rgba(255,255,255,0.15)',
                                backdropFilter: 'blur(10px)',
                                borderRadius: '100px',
                                fontSize: '0.9rem',
                                fontWeight: 700,
                                marginBottom: '24px',
                                border: '1px solid rgba(255,255,255,0.2)'
                            }}>
                                <span style={{ fontSize: '1.2rem' }}>{program.icon}</span> Jurusan Unggulan
                            </div>
                            <h1 style={{
                                fontSize: 'clamp(2.5rem, 5vw, 3.5rem)',
                                fontWeight: 900,
                                lineHeight: 1.1,
                                marginBottom: '20px',
                                textShadow: '0 4px 12px rgba(0,0,0,0.1)'
                            }}>
                                {program.title}
                            </h1>
                            <p style={{
                                fontSize: '1.25rem',
                                opacity: 0.9,
                                lineHeight: 1.6,
                                marginBottom: '32px',
                                maxWidth: '600px'
                            }}>
                                {program.tagline || program.description}
                            </p>
                            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                                <Link to="/ppdb" className="portal-btn portal-btn-lg" style={{
                                    background: '#fff',
                                    color: themeColor,
                                    border: 'none',
                                    fontWeight: 800,
                                    boxShadow: '0 10px 20px rgba(0,0,0,0.1)'
                                }}>
                                    ✨ Daftar Sekarang
                                </Link>
                                <button onClick={() => document.getElementById('details').scrollIntoView({ behavior: 'smooth' })}
                                    className="portal-btn portal-btn-lg" style={{
                                        background: 'rgba(255,255,255,0.1)',
                                        color: '#fff',
                                        backdropFilter: 'blur(10px)',
                                        border: '1px solid rgba(255,255,255,0.3)'
                                    }}>
                                    Pelajari Detail
                                </button>
                            </div>
                        </div>

                        <div className="hero-illustration" style={{
                            position: 'relative',
                            zIndex: 5,
                            display: 'flex',
                            justifyContent: 'center'
                        }}>
                            <div className="illustration-wrapper" style={{
                                width: '100%',
                                maxWidth: '450px',
                                filter: 'drop-shadow(0 20px 40px rgba(0,0,0,0.2))',
                                animation: 'portal-float 6s infinite ease-in-out'
                            }}>
                                {program.banner_image ? (
                                    <img src={program.banner_image} alt={program.title} style={{ width: '100%', height: 'auto' }} />
                                ) : (
                                    <div style={{
                                        width: '300px',
                                        height: '300px',
                                        background: 'rgba(255,255,255,0.1)',
                                        borderRadius: '50%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '8rem',
                                        backdropFilter: 'blur(20px)',
                                        border: '2px solid rgba(255,255,255,0.2)'
                                    }}>
                                        {program.icon}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ====== FEATURES SECTION ====== */}
            <section className="program-features" style={{
                padding: '0 0 100px 0',
                marginTop: '-60px'
            }}>
                <div className="portal-container">
                    <div className="portal-grid portal-grid-4">
                        {features.map((feat, i) => (
                            <div key={i} className="feature-card" style={{
                                background: '#fff',
                                padding: '32px 24px',
                                borderRadius: '24px',
                                boxShadow: '0 20px 40px rgba(0,0,0,0.06)',
                                border: '1px solid #f1f5f9',
                                transition: 'all 0.3s ease',
                                cursor: 'default',
                                position: 'relative',
                                overflow: 'hidden'
                            }}>
                                <div className="feat-number" style={{
                                    position: 'absolute',
                                    top: '20px',
                                    right: '20px',
                                    fontSize: '3rem',
                                    fontWeight: 900,
                                    color: themeColor,
                                    opacity: 0.05
                                }}>{i + 1}</div>

                                <div className="feat-icon" style={{
                                    width: '56px',
                                    height: '56px',
                                    borderRadius: '16px',
                                    background: `${themeColor}15`,
                                    color: themeColor,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '1.5rem',
                                    marginBottom: '20px'
                                }}>
                                    {feat.icon || <Target size={24} />}
                                </div>
                                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: '12px', color: '#1e293b' }}>
                                    {feat.title || 'Fitur Unggulan'}
                                </h3>
                                <p style={{ fontSize: '0.95rem', color: '#64748b', lineHeight: 1.6 }}>
                                    {feat.description || 'Deskripsi fitur keunggulan jurusan yang akan dipelajari siswa.'}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ====== CONTENT SECTION ====== */}
            <section id="details" className="program-content" style={{ paddingBottom: '100px' }}>
                <div className="portal-container">
                    <div className="portal-grid" style={{ gridTemplateColumns: 'minmax(0, 1fr) 350px', gap: '48px' }}>
                        <div className="main-content">
                            <h2 style={{ fontSize: '2.25rem', fontWeight: 900, marginBottom: '32px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <BookOpen size={32} style={{ color: themeColor }} /> Tentang Jurusan
                            </h2>
                            <div className="rich-text-content" style={{
                                fontSize: '1.1rem',
                                lineHeight: 1.8,
                                color: '#334155'
                            }}>
                                {program.full_content ? (
                                    <div dangerouslySetInnerHTML={{ __html: program.full_content }} />
                                ) : (
                                    <p>{program.description}</p>
                                )}
                            </div>
                        </div>

                        <div className="sidebar">
                            <div className="sidebar-card" style={{
                                background: '#f8fafc',
                                borderRadius: '24px',
                                padding: '32px',
                                border: '1px solid #e2e8f0',
                                position: 'sticky',
                                top: '100px'
                            }}>
                                <h4 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '24px', color: '#1e293b' }}>
                                    Info Pendaftaran
                                </h4>
                                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px 0' }}>
                                    <li style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                                        <CheckCircle size={20} style={{ color: '#10b981', flexShrink: 0 }} />
                                        <span style={{ fontSize: '0.95rem' }}>Terakreditasi A</span>
                                    </li>
                                    <li style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                                        <CheckCircle size={20} style={{ color: '#10b981', flexShrink: 0 }} />
                                        <span style={{ fontSize: '0.95rem' }}>Kurikulum Industri</span>
                                    </li>
                                    <li style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                                        <CheckCircle size={20} style={{ color: '#10b981', flexShrink: 0 }} />
                                        <span style={{ fontSize: '0.95rem' }}>Sertifikasi Internasional</span>
                                    </li>
                                    <li style={{ display: 'flex', gap: '12px' }}>
                                        <CheckCircle size={20} style={{ color: '#10b981', flexShrink: 0 }} />
                                        <span style={{ fontSize: '0.95rem' }}>Penempatan Kerja</span>
                                    </li>
                                </ul>
                                <Link to="/ppdb" className="portal-btn portal-btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                                    Daftar Sekarang <ArrowRight size={18} />
                                </Link>
                                <div style={{
                                    marginTop: '24px',
                                    padding: '16px',
                                    background: '#fff',
                                    borderRadius: '16px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px',
                                    border: '1px solid #e2e8f0'
                                }}>
                                    <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: `${themeColor}15`, color: themeColor, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Users size={20} />
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>KUOTA TERSEDIA</div>
                                        <div style={{ fontSize: '1rem', fontWeight: 800, color: '#1e293b' }}>32 Siswa / Kelas</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    )
}
