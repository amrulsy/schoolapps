import { useState, useEffect, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { usePortal } from '../context/PortalContext'
import {
    ArrowRight, CheckCircle, ChevronRight, BookOpen, Users, Trophy,
    Target, Play, Video, Image as ImageIcon, ThumbsUp, Share2,
    Briefcase, ChevronLeft, MessageCircle, Star, Award, Heart
} from 'lucide-react'

// Import new redesign styles
import '../styles/portal-program-detail.css'

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

    // MOCK DATA FOR NEW SECTIONS
    const milestones = [
        { grade: 'Kelas X', title: 'Fondasi Cipta Karya', skills: ['Dasar Seni Rupa', 'Tipografi Dasar', 'Sketsa Tangan', 'Etika Profesi'], color: '#4f46e5' },
        { grade: 'Kelas XI', title: 'Eksplorasi Medum', skills: ['Desain Grafis', 'Fotografi', 'Videografi', 'Animasi 2D'], color: '#10b981' },
        { grade: 'Kelas XII', title: 'Portfolio & Industri', skills: ['UI/UX Design', 'Project Industri', 'Sertifikasi BNSP', 'Pameran Akhir'], color: '#f59e0b' },
    ]

    const showcaseItems = [
        { id: 1, type: 'image', url: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=600&q=80', title: 'Brand Identity', author: 'Siswa Angkatan 22' },
        { id: 2, type: 'video', url: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=600&q=80', title: 'Short Animation', author: 'Tim Kreatif X' },
        { id: 3, type: 'image', url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&q=80', title: 'Mobile App UI', author: 'Kelompok Beta' },
        { id: 4, type: 'image', url: 'https://images.unsplash.com/photo-1572044162444-ad60f128bdea?w=600&q=80', title: 'Typography Poster', author: 'Andi S.' },
        { id: 5, type: 'image', url: 'https://images.unsplash.com/photo-1626544827763-d516dce335e2?w=600&q=80', title: '3D Character', author: 'Siswa Animasi' },
    ]

    const alumniCareers = [
        { role: 'Art Director', company: 'Creative Agency Jakarta', icon: <Star size={20} /> },
        { role: 'UI/UX Designer', company: 'Tech Startup', icon: <Briefcase size={20} /> },
        { role: 'Videographer', company: 'Media Production', icon: <Video size={20} /> },
        { role: 'Game Animator', company: 'Game Studio', icon: <Play size={20} /> },
    ]

    const alumniList = [
        { id: 1, name: 'Diana R.', role: 'Senior UX Designer', company: 'Gojek', quote: '"Skill praktik di sekolah dan pendekatan mentor sangat relevan. Langsung kepakai di industri tech."', image: 'https://i.pravatar.cc/150?u=diana' },
        { id: 2, name: 'Rizky M.', role: 'Art Director', company: 'Ogilvy', quote: '"Project based learning di SMK benar-benar membentuk mental kreatif dan problem solving saya."', image: 'https://i.pravatar.cc/150?u=rizky' },
        { id: 3, name: 'Bima A.', role: 'Cinematographer', company: 'Visinema', quote: '"Fasilitas lab dan bimbingan guru bikin saya siap terjun langsung ke dunia film dan iklan."', image: 'https://i.pravatar.cc/150?u=bima' },
        { id: 4, name: 'Nadia S.', role: 'Illustrator', company: 'Freelance', quote: '"Bebas berekspresi dan dibimbing bikin portofolio yang solid buat tembus klien internasional."', image: 'https://i.pravatar.cc/150?u=nadia' }
    ]

    return (
        <div className="portal-page portal-program-detail">
            <Helmet>
                <title>{program.title} | Jurusan SMK PPRQ</title>
                <meta name="description" content={program.tagline || program.description} />
                {program.banner_image && <meta property="og:image" content={program.banner_image} />}
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
                                        <div className="stat-item-val">90%</div>
                                        <div className="stat-item-label">Lulus Langsung Kerja</div>
                                    </div>
                                </div>
                                <div className="stat-item">
                                    <Briefcase className="text-blue-400" size={24} color="#60a5fa" />
                                    <div>
                                        <div className="stat-item-val">15+</div>
                                        <div className="stat-item-label">Mitra Industri Aktif</div>
                                    </div>
                                </div>
                                <div className="stat-item">
                                    <Users className="text-emerald-400" size={24} color="#34d399" />
                                    <div>
                                        <div className="stat-item-val">32</div>
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
                                    <img src={program.banner_image} alt={program.title} style={{ width: '100%', height: '100%', objectFit: 'contain', zIndex: 1 }} />
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
                paddingBottom: '30px',
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
            <section className="roadmap-section" style={{ paddingTop: '1px' }}>
                <div className="portal-container">
                    <div style={{ textAlign: 'center', marginBottom: '60px' }}>
                        <h2 style={{ fontSize: '2.5rem', fontWeight: 900, color: '#0f172a', marginBottom: '16px' }}>Curriculum Roadmap</h2>
                        <p style={{ color: '#64748b', fontSize: '1.1rem', maxWidth: '600px', margin: '0 auto' }}>
                            Perjalanan 3 tahun belajar dari dasar hingga siap di dunia industri. Klik tiap milestone untuk melihat rincian peminatan skill.
                        </p>
                    </div>

                    <div className="roadmap-container">
                        {milestones.map((ms, idx) => (
                            <div
                                key={idx}
                                className={`roadmap-item ${activeMilestone === idx ? 'active' : ''}`}
                                onClick={() => setActiveMilestone(idx)}
                                style={activeMilestone === idx ? { borderColor: ms.color } : {}}
                            >
                                <div className="roadmap-grade" style={activeMilestone === idx ? { background: ms.color } : {}}>
                                    {ms.grade}
                                </div>
                                <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1e293b', marginBottom: '12px' }}>
                                    {ms.title}
                                </h3>

                                {activeMilestone === idx && (
                                    <div className="roadmap-skills">
                                        {ms.skills.map((skill, sIdx) => (
                                            <span key={sIdx} className="skill-tag">
                                                {skill}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ====== CONTENT DETAILS SECTION ====== */}
            <section id="details" className="program-content" style={{ padding: '100px 0', background: '#fff' }}>
                <div className="portal-container">
                    <div className="main-content" style={{ maxWidth: '800px', margin: '0 auto' }}>
                        <h2 style={{ fontSize: '2.25rem', fontWeight: 900, marginBottom: '32px', display: 'flex', alignItems: 'center', gap: '12px', justifyContent: 'center' }}>
                            <BookOpen size={32} style={{ color: themeColor }} /> Tentang Jurusan
                        </h2>
                        <div className="rich-text-content" style={{
                            fontSize: '1.1rem',
                            lineHeight: 1.8,
                            color: '#334155',
                            textAlign: 'center'
                        }}>
                            {program.full_content ? (
                                <div dangerouslySetInnerHTML={{ __html: program.full_content }} style={{ textAlign: 'left' }} />
                            ) : (
                                <p>{program.description}</p>
                            )}
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

                    <div className="masonry-grid">
                        {showcaseItems.map(item => (
                            <div key={item.id} className="masonry-item">
                                <img src={item.url} alt={item.title} className="masonry-img" loading="lazy" />

                                <div className="masonry-actions">
                                    <button className="masonry-action-btn"><Heart size={18} /></button>
                                    <button className="masonry-action-btn"><Share2 size={18} /></button>
                                </div>

                                <div className="masonry-overlay">
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'rgba(255,255,255,0.7)', fontSize: '0.8rem', marginBottom: '8px' }}>
                                        {item.type === 'video' ? <Video size={14} /> : <ImageIcon size={14} />}
                                        {item.type.toUpperCase()}
                                    </div>
                                    <h4 style={{ color: '#fff', fontSize: '1.2rem', fontWeight: 800, margin: '0 0 4px 0' }}>{item.title}</h4>
                                    <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.85rem' }}>by {item.author}</span>
                                </div>
                            </div>
                        ))}
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

                    <div className="career-badges">
                        {alumniCareers.map((career, idx) => (
                            <div key={idx} className="career-badge">
                                {career.icon}
                                <span>{career.role}</span>
                            </div>
                        ))}
                    </div>

                    <div className="alumni-carousel">
                        {alumniList.map(alumni => (
                            <div key={alumni.id} className="alumni-card">
                                <div className="alumni-quote">
                                    {alumni.quote}
                                </div>
                                <div className="alumni-profile">
                                    <img src={alumni.image} alt={alumni.name} className="alumni-img" />
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
