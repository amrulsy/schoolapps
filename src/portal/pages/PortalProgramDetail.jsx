import { useState, useEffect, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { usePortal } from '../context/PortalContext'
import {
    ArrowRight, CheckCircle, ChevronRight, BookOpen, Users, Trophy,
    Target, Play, Video, Image as ImageIcon, ThumbsUp, Share2,
    Briefcase, ChevronLeft, MessageCircle, Star, Award, Heart,
    Book, Settings, GraduationCap
} from 'lucide-react'

// Import new redesign styles
import '../styles/portal-program-detail.css'
import { getDirectDriveUrl } from '../../utils/urlHelper'

export default function PortalProgramDetail() {
    const { slug } = useParams()
    const { fetchPublic } = usePortal()
    const [program, setProgram] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [scrollY, setScrollY] = useState(0)
    const [activeMilestone, setActiveMilestone] = useState(0)
    const [activeFeature, setActiveFeature] = useState(0)

    useEffect(() => {
        const featsLen = program?.features_json?.length || 0;
        if (featsLen <= 0) return;

        const timer = setInterval(() => {
            setActiveFeature(prev => (prev + 1) % featsLen)
        }, 3000)
        return () => clearInterval(timer)
    }, [program])

    const scrollFeatures = (direction) => {
        const featsLen = program?.features_json?.length || 1;
        if (direction === 'left') {
            setActiveFeature(prev => (prev - 1 + featsLen) % featsLen)
        } else {
            setActiveFeature(prev => (prev + 1) % featsLen)
        }
    }

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

    useEffect(() => {
        const handleScroll = () => setScrollY(window.scrollY)
        window.addEventListener('scroll', handleScroll, { passive: true })
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

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

    // DYNAMIC DATA FROM API
    const milestones = (program.milestones_json || []).map(m => ({
        ...m,
        icon: m.icon === 'book' ? <Book size={18} /> :
            m.icon === 'settings' ? <Settings size={18} /> :
                m.icon === 'graduation-cap' ? <GraduationCap size={18} /> :
                    <Book size={18} />
    }))

    const showcaseItems = program.showcase_json || []
    const alumniList = program.alumni_json || []
    const careerProspects = (program.careers_json || [])

    const laborAbsorption = program.stats_json?.labor_absorption || '90%'
    const partnersCount = program.stats_json?.partners_count || '50+'
    const quotaPerClass = program.stats_json?.quota_per_class || '32'
    const learningOutcomes = (program.milestones_json || []).flatMap(m => m.skills || []).slice(0, 5)
    if (learningOutcomes.length === 0) {
        learningOutcomes.push('Dasar Keahlian', 'Praktik Industri', 'Sertifikasi Kompetensi')
    }

    return (
        <div className="portal-page portal-program-detail">
            <Helmet>
                <title>{program.title} | Jurusan SMK PPRQ</title>
                <meta name="description" content={program.tagline || program.description} />
                {program.banner_image && <meta property="og:image" content={getDirectDriveUrl(program.banner_image)} />}
            </Helmet>

            {/* ====== HERO SECTION INTERAKTIF ====== */}
            <section className="program-hero-redesign" style={{
                background: `linear-gradient(135deg, ${themeColor} 0%, #0f172a 80%)`,
                position: 'relative'
            }}>
                {/* Decorative floating shapes */}
                <div style={{
                    position: 'absolute', top: '-10%', right: '-5%', width: '400px', height: '400px',
                    background: 'rgba(255,255,255,0.1)', filter: 'blur(80px)', borderRadius: '50%', zIndex: 0
                }} />
                <div style={{
                    position: 'absolute', bottom: '-10%', left: '-10%', width: '500px', height: '500px',
                    background: `${themeColor}40`, filter: 'blur(100px)', borderRadius: '50%', zIndex: 0
                }} />

                <div className="portal-container program-hero-content" style={{ transform: `translateY(${scrollY * 0.3}px)`, marginTop: '-80px' }}>
                    <div className="portal-grid portal-grid-2" style={{ alignItems: 'center', gap: '48px' }}>
                        {/* Text Content */}
                        <div>
                            <div className="program-badge" style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '8px 16px',
                                background: 'rgba(255,255,255,0.1)',
                                backdropFilter: 'blur(10px)',
                                borderRadius: '100px',
                                fontSize: '0.9rem',
                                fontWeight: 700,
                                marginBottom: '24px',
                                border: '1px solid rgba(255,255,255,0.2)'
                            }}>
                                <span style={{ fontSize: '1.2rem' }}>{program.icon}</span> Kompetensi Keahlian
                            </div>

                            <h1 style={{
                                fontSize: 'clamp(3rem, 6vw, 4.5rem)',
                                fontWeight: 900,
                                lineHeight: 1.1,
                                marginBottom: '20px',
                                maxWidth: '800px',
                                textShadow: '0 10px 30px rgba(0,0,0,0.5)'
                            }}>
                                {program.title}
                            </h1>

                            <p style={{
                                fontSize: '1.25rem',
                                opacity: 0.9,
                                lineHeight: 1.6,
                                maxWidth: '600px',
                                marginBottom: '10px'
                            }}>
                                {program.tagline || program.description}
                            </p>

                            <div className="hero-quick-stats">
                                <div className="stat-item">
                                    <Trophy className="text-yellow-400" size={24} color="#fbbf24" />
                                    <div>
                                        <div className="stat-item-val">{laborAbsorption}</div>
                                        <div className="stat-item-label">Lulus Langsung Kerja</div>
                                    </div>
                                </div>
                                <div className="stat-item">
                                    <Briefcase className="text-blue-400" size={24} color="#60a5fa" />
                                    <div>
                                        <div className="stat-item-val">{partnersCount}</div>
                                        <div className="stat-item-label">Mitra IDUKA Aktif</div>
                                    </div>
                                </div>
                                <div className="stat-item">
                                    <Users className="text-emerald-400" size={24} color="#34d399" />
                                    <div>
                                        <div className="stat-item-val">{quotaPerClass}</div>
                                        <div className="stat-item-label">Kuota per Kelas</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Graphic Card */}
                        <div style={{ display: 'flex', justifyContent: 'center' }}>
                            <div style={{
                                width: '100%',
                                maxWidth: '380px',
                                aspectRatio: '1/1',
                                background: '#fff',
                                borderRadius: '40px',
                                boxShadow: '0 30px 60px rgba(0,0,0,0.25)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                padding: '40px',
                                border: '1px solid rgba(255,255,255,0.6)',
                                position: 'relative',
                                transform: 'rotate(3deg)'
                            }}>
                                <div style={{
                                    position: 'absolute', inset: -20, borderRadius: '50px',
                                    border: `2px dashed rgba(255,255,255,0.3)`, zIndex: 0
                                }} />
                                {program.banner_image ? (
                                    <img src={getDirectDriveUrl(program.banner_image)} alt={program.title} style={{ width: '100%', height: '100%', objectFit: 'contain', zIndex: 1 }} />
                                ) : (
                                    <div style={{ fontSize: '10rem', color: themeColor, zIndex: 1, filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.1))' }}>
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
                paddingBottom: '10px',
                background: 'linear-gradient(180deg, transparent 0%, transparent 100px, #f8fafc 100px, #f8fafc 100%)',
                borderBottom: '1px solid #e2e8f0',
                position: 'relative',
                zIndex: 20,
                marginTop: '-90px'
            }}>
                <div className="portal-container" style={{ position: 'relative' }}>

                    {/* Navigation Left */}
                    <button onClick={() => scrollFeatures('left')} className="portal-btn" style={{
                        position: 'absolute', left: '0px', top: '50%', transform: 'translateY(-50%)', zIndex: 30,
                        width: '48px', height: '48px', borderRadius: '50%', background: '#fff', border: '1px solid #e2e8f0',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0,
                        boxShadow: '0 10px 20px rgba(0,0,0,0.1)', color: themeColor,
                        opacity: 0.9
                    }}>
                        <ChevronLeft size={28} />
                    </button>

                    {/* Navigation Right */}
                    <button onClick={() => scrollFeatures('right')} className="portal-btn" style={{
                        position: 'absolute', right: '0px', top: '50%', transform: 'translateY(-50%)', zIndex: 30,
                        width: '48px', height: '48px', borderRadius: '50%', background: '#fff', border: '1px solid #e2e8f0',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0,
                        boxShadow: '0 10px 20px rgba(0,0,0,0.1)', color: themeColor,
                        opacity: 0.9
                    }}>
                        <ChevronRight size={28} />
                    </button>

                    {/* CoverFlow Slider */}
                    <div className="features-coverflow-container" style={{
                        position: 'relative',
                        height: '240px',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        width: '100%',
                        overflow: 'hidden',
                        padding: '20px 0'
                    }}>
                        {features.map((feat, i) => {
                            let offset = i - activeFeature;
                            const total = features.length;

                            // Wrap around logic for smooth infinite loops
                            if (offset < -Math.floor(total / 2)) offset += total;
                            if (offset > Math.floor(total / 2)) offset -= total;
                            if (total === 4 && offset === 2) offset = -2;

                            const isCenter = offset === 0;
                            const isLeft = offset === -1 || offset === -2;
                            const isRight = offset === 1 || offset === 2;
                            const isHidden = Math.abs(offset) > 1;

                            // Scale, Blur, Translates based on offset
                            const scale = isCenter ? 1 : isHidden ? 0.7 : 0.85;
                            const blur = isCenter ? '0px' : isHidden ? '8px' : '3px';
                            const opacity = isCenter ? 1 : isHidden ? 0 : 0.6;
                            const zIndex = isCenter ? 20 : isHidden ? 0 : 10;
                            const translateX = isCenter ? '0%' : offset < 0 ? `${-105 + (offset + 1) * 20}%` : `${105 + (offset - 1) * 20}%`;

                            return (
                                <div key={i} className="feature-card" style={{
                                    position: 'absolute',
                                    display: 'flex', gap: '16px', alignItems: 'flex-start',
                                    background: '#fff',
                                    padding: '24px',
                                    borderRadius: '24px',
                                    boxShadow: isCenter ? '0 20px 40px rgba(0,0,0,0.1)' : '0 10px 20px rgba(0,0,0,0.05)',
                                    border: '1px solid #f1f5f9',
                                    transition: 'all 0.6s cubic-bezier(0.25, 1, 0.5, 1)',
                                    cursor: isCenter ? 'default' : 'pointer',
                                    width: '100%',
                                    maxWidth: '350px',
                                    transform: `translateX(${translateX}) scale(${scale})`,
                                    opacity: opacity,
                                    filter: `blur(${blur})`,
                                    zIndex: zIndex,
                                    pointerEvents: isCenter ? 'auto' : 'none'
                                }}>
                                    <div style={{
                                        width: '48px', height: '48px', borderRadius: '12px', flexShrink: 0,
                                        background: `${themeColor}15`, color: themeColor,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                                    }}>
                                        {feat.icon || <Target size={24} />}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#1e293b', marginBottom: '6px' }}>
                                            {feat.title || 'Fitur Unggulan'}
                                        </h4>
                                        <p style={{ fontSize: '0.85rem', color: '#64748b', lineHeight: 1.6, margin: 0 }}>
                                            {feat.description || 'Deskripsi fitur keunggulan program jurusan.'}
                                        </p>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </section>

            {/* ====== ROADMAP KURIKULUM ====== */}
            <section className="roadmap-section" style={{ paddingTop: '10px' }}>
                <div className="portal-container">
                    <div style={{ textAlign: 'center', marginBottom: '60px' }}>
                        <h2 style={{ fontSize: '2.5rem', fontWeight: 900, color: '#0f172a', marginBottom: '16px' }}>Curriculum Roadmap</h2>
                        <p style={{ color: '#64748b', fontSize: '1.1rem', maxWidth: '600px', margin: '0 auto' }}>
                            Perjalanan 3 tahun belajar dari dasar hingga siap di dunia industri. Klik tiap milestone untuk melihat rincian peminatan skill.
                        </p>
                    </div>

                    <div className="roadmap-container">
                        {/* Animated Progress Line */}
                        <div className="roadmap-line-filler" style={{
                            height: milestones.length > 0 ? `${((activeMilestone + 1) / milestones.length) * 100}%` : '0%',
                            background: themeColor,
                            boxShadow: `0 0 40px ${themeColor}, 0 0 10px ${themeColor}`
                        }} />

                        {milestones.map((ms, idx) => (
                            <div
                                key={idx}
                                className={`roadmap-step ${activeMilestone === idx ? 'active' : ''}`}
                                onClick={() => setActiveMilestone(idx)}
                            >
                                <div className="roadmap-dot">
                                    {ms.icon}
                                </div>

                                <div className="roadmap-content-card">
                                    <div className="roadmap-grade-badge" style={{
                                        background: activeMilestone === idx ? ms.color : '#f1f5f9',
                                        color: activeMilestone === idx ? '#fff' : '#475569'
                                    }}>
                                        {ms.grade}
                                    </div>

                                    <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1e293b', marginBottom: '8px' }}>
                                        {ms.title}
                                    </h3>

                                    <p style={{ color: '#64748b', fontSize: '1rem', lineHeight: 1.6 }}>
                                        {ms.description || 'Fokus pembelajaran pada tahun ini mencakup fundamental dan keahlian spesifik yang dirancang untuk kebutuhan industri.'}
                                    </p>

                                    <div className="roadmap-skills-list">
                                        {ms.skills.map((skill, sIdx) => (
                                            <span key={sIdx} className="skill-tag">
                                                {skill}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ====== CONTENT DETAILS SECTION ====== */}
            <section id="details" className="program-content" style={{ padding: '60px 0', background: '#fff' }}>
                <div className="portal-container">
                    <div className="about-header" style={{ textAlign: 'center', marginBottom: '40px' }}>
                        <h2 style={{ fontSize: '2.5rem', fontWeight: 900, color: '#0f172a' }}>
                            Tentang Jurusan
                        </h2>
                    </div>
                    <div className="about-program-grid">

                        {/* Left: Image Card */}
                        <div className="about-visual" style={{ position: 'relative' }}>
                            <div style={{
                                width: '100%',
                                borderRadius: '40px',
                                overflow: 'hidden',
                                boxShadow: '0 20px 80px rgba(0,0,0,0.1)',
                                position: 'relative',
                                zIndex: 2
                            }}>
                                <img
                                    src={getDirectDriveUrl(program.about_image || "https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=800&q=80")}
                                    alt={program.title}
                                    style={{ width: '100%', aspectRatio: '4/3', objectFit: 'cover', borderRadius: '24px', display: 'block' }}
                                />
                            </div>
                            {/* Decorative element */}
                            <div style={{
                                position: 'absolute',
                                top: '-20px',
                                right: '-20px',
                                width: '100px',
                                height: '100px',
                                background: `${themeColor}20`,
                                borderRadius: '20px',
                                zIndex: 1
                            }} />
                        </div>

                        <div className="about-text">
                            <p style={{ fontSize: '1.15rem', color: '#475569', lineHeight: 1.8, marginBottom: '32px' }}>
                                <strong>{program.title}</strong> {program.description}
                            </p>

                            <div style={{ marginBottom: '32px' }}>
                                <h4 className="about-subtitle">
                                    <Target size={24} style={{ color: themeColor }} /> Apa yang akan dipelajari?
                                </h4>
                                <div className="about-learning-grid">
                                    {learningOutcomes.map((item, i) => (
                                        <div key={i} className="learning-card">
                                            <div className="learning-card-icon" style={{ background: `${themeColor}15`, color: themeColor }}>
                                                <CheckCircle size={20} />
                                            </div>
                                            <span className="learning-card-text">{item}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div style={{
                                padding: '24px',
                                background: '#f8fafc',
                                borderRadius: '24px',
                                borderLeft: `4px solid ${themeColor}`,
                                fontSize: '1.05rem',
                                color: '#334155',
                                lineHeight: 1.6,
                                fontStyle: 'italic'
                            }}>
                                "{program.quote || "Dengan bimbingan pengajar profesional dan praktisi dari dunia industri, siswa dipersiapkan untuk menghadapi tantangan di era Digital 4.0."}"
                            </div>
                        </div>

                    </div>
                </div>
            </section>

            {/* ====== STUDENT SHOWCASE ====== */}
            <section className="showcase-section">
                <div className="portal-container">
                    <div style={{ textAlign: 'center', marginBottom: '60px' }}>
                        <h2 style={{ fontSize: '2.5rem', fontWeight: 900, color: '#0f172a', marginBottom: '16px' }}>Student Showcase</h2>
                        <p style={{ color: '#64748b', fontSize: '1.1rem', maxWidth: '600px', margin: '0 auto' }}>
                            Karya nyata dari hasil proses belajar. Bukti bahwa siswa vokasi bisa merancang karya siap industri.
                        </p>
                    </div>

                    <div className="showcase-bento-container">
                        <div className="showcase-bento-grid">
                            {showcaseItems.map(item => (
                                <div key={item.id} className={`bento-item bento-${item.size}`}>
                                    <img src={getDirectDriveUrl(item.url)} alt={item.title} className="bento-img" loading="lazy" />

                                    <div className="bento-overlay">
                                        <div className="bento-meta">
                                            {item.type === 'video' ? <Video size={14} /> : <ImageIcon size={14} />}
                                            <span className="bento-type-tag">{item.type.toUpperCase()}</span>
                                        </div>
                                        <div className="bento-details">
                                            <h4 className="bento-title">{item.title}</h4>
                                            <p className="bento-author">by {item.author}</p>
                                        </div>
                                        <div className="bento-actions">
                                            <button className="bento-mini-btn"><Heart size={16} /></button>
                                            <button className="bento-mini-btn"><Share2 size={16} /></button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* ====== ALUMNI & CAREERS ====== */}
            <section className="alumni-section" style={{
                background: `linear-gradient(135deg, #0f172a 40%, ${themeColor} 150%)`
            }}>
                <div className="portal-container">
                    <div style={{ textAlign: 'center', marginBottom: '50px' }}>
                        <h2 style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: '16px' }}>Prospek Karir & Alumni</h2>
                        <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '1.1rem', maxWidth: '600px', margin: '0 auto' }}>
                            Lulus dari jurusan ini mau jadi apa? Berikut prospek utama dan jejak rekam alumni kami di industri.
                        </p>
                    </div>


                    {careerProspects.length > 0 && (
                        <div className="careers-grid mb-10" style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                            gap: '16px',
                            marginBottom: '40px'
                        }}>
                            {careerProspects.map((career, idx) => (
                                <div key={idx} className="career-card" style={{
                                    background: 'rgba(255,255,255,0.05)',
                                    backdropFilter: 'blur(10px)',
                                    borderRadius: '16px',
                                    padding: '16px',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    transition: 'all 0.3s'
                                }}>
                                    <div className="career-icon" style={{
                                        width: '32px', height: '32px', borderRadius: '8px',
                                        background: `${themeColor}20`, color: themeColor,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        marginBottom: '12px'
                                    }}>
                                        <Briefcase size={16} />
                                    </div>
                                    <h4 style={{ color: '#fff', fontSize: '1rem', fontWeight: 800, marginBottom: '4px' }}>
                                        {career.title}
                                    </h4>
                                    <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem', lineHeight: 1.5, margin: 0 }}>
                                        {career.description}
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}

                    <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                        <h3 style={{ color: '#fff', fontSize: '1.5rem', fontWeight: 700 }}>Alumni Success Stories</h3>
                    </div>

                    <div className="alumni-carousel">
                        {alumniList.map(alumni => (
                            <div key={alumni.id} className="alumni-card">
                                <div className="alumni-quote">
                                    {alumni.quote}
                                </div>
                                <div className="alumni-profile">
                                    <img src={getDirectDriveUrl(alumni.image)} alt={alumni.name} className="alumni-img" />
                                    <div>
                                        <div style={{ fontWeight: 800, fontSize: '1.1rem' }}>{alumni.name}</div>
                                        <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem' }}>
                                            {alumni.role} at <strong style={{ color: '#fff' }}>{alumni.company}</strong>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ====== FLOATING CTA ====== */}
            <div className="floating-cta-container">
                <a href="https://wa.me/6281234567890" target="_blank" rel="noreferrer" className="floating-btn floating-btn-secondary">
                    <MessageCircle size={20} />
                    <span>Tanya Guru/Admin</span>
                </a>
                <Link to="/ppdb" className="floating-btn floating-btn-primary">
                    <Award size={20} />
                    <span>Daftar Jurusan Ini</span>
                </Link>
            </div>

        </div>
    )
}
