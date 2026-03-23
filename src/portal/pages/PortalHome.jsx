import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { Play, X, ChevronLeft, ChevronRight, ArrowRight, CheckCircle } from 'lucide-react'
import { usePortal } from '../context/PortalContext'
import '../styles/portal-banners.css'
import '../styles/portal-home-partners.css'
import { getDirectDriveUrl } from '../../utils/urlHelper'

export default function PortalHome() {
    const { fetchPublic } = usePortal()

    const [stats, setStats] = useState(null)
    const [posts, setPosts] = useState([])
    const [banners, setBanners] = useState([])
    const [programs, setPrograms] = useState([])
    const [partners, setPartners] = useState([])
    const [activePartner, setActivePartner] = useState(0)
    const [settings, setSettings] = useState({})
    const [loading, setLoading] = useState(true)
    const [isVideoOpen, setIsVideoOpen] = useState(false)
    const [currentBanner, setCurrentBanner] = useState(0)

    // --- New States for Advanced UX ---
    const [offsetY, setOffsetY] = useState(0)
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
    const [bannerProgress, setBannerProgress] = useState(0)
    // ----------------------------------

    // --- Event Listeners for Parallax & Tilt ---
    useEffect(() => {
        const handleScroll = () => setOffsetY(window.scrollY)
        const handleMouseMove = (e) => {
            setMousePos({
                x: (e.clientX / window.innerWidth - 0.5) * 20, // max 20deg tilt
                y: (e.clientY / window.innerHeight - 0.5) * 20
            })
        }

        window.addEventListener('scroll', handleScroll, { passive: true })
        window.addEventListener('mousemove', handleMouseMove, { passive: true })

        return () => {
            window.removeEventListener('scroll', handleScroll)
            window.removeEventListener('mousemove', handleMouseMove)
        }
    }, [])
    // -------------------------------------------

    useEffect(() => {
        if (banners.length > 0) {
            setBannerProgress(0) // Reset progress on banner change

            const progressTimer = setInterval(() => {
                setBannerProgress(prev => {
                    if (prev >= 100) return 100
                    return prev + (100 / 60) // 60 steps per 6 seconds (100ms interval)
                })
            }, 100)

            const timer = setInterval(() => {
                setCurrentBanner((prev) => (prev + 1) % banners.length)
            }, 6000)

            return () => {
                clearInterval(timer)
                clearInterval(progressTimer)
            }
        }
    }, [banners, currentBanner])

    useEffect(() => {
        if (partners.length <= 1) return
        const timer = setInterval(() => {
            setActivePartner(prev => (prev + 1) % partners.length)
        }, 4000)
        return () => clearInterval(timer)
    }, [partners.length])

    useEffect(() => {
        async function loadData() {
            setLoading(true)
            const [statsData, postsData, bannersData, programsData, partnersData, settingsData] = await Promise.all([
                fetchPublic('/stats'),
                fetchPublic('/posts?limit=3'),
                fetchPublic('/banners'),
                fetchPublic('/programs'),
                fetchPublic('/partners'),
                fetchPublic('/settings')
            ])
            if (statsData) setStats(statsData)
            if (postsData) setPosts(postsData.data || [])
            if (bannersData) setBanners(bannersData)
            if (programsData) setPrograms(programsData)
            if (partnersData) setPartners(partnersData)
            if (settingsData) setSettings(settingsData)
            setLoading(false)
        }
        loadData()
    }, [fetchPublic])

    const scrollPartners = (direction) => {
        const total = partners.length
        if (total === 0) return
        if (direction === 'left') {
            setActivePartner(prev => (prev - 1 + total) % total)
        } else {
            setActivePartner(prev => (prev + 1) % total)
        }
    }

    const formatDate = (dateStr) => {
        if (!dateStr) return ''
        return new Date(dateStr).toLocaleDateString('id-ID', {
            day: 'numeric', month: 'long', year: 'numeric'
        })
    }

    // Parse hero title with highlight
    const renderHeroTitle = () => {
        const title = settings.hero_title || 'Raih Masa Depan\nCemerlang Bersama\nSMK PPRQ'
        const highlight = settings.hero_highlight || 'Cemerlang Bersama'
        const lines = title.split('\n')

        return lines.map((line, i) => {
            if (line.includes(highlight)) {
                const parts = line.split(highlight)
                return (
                    <span key={i}>
                        {parts[0]}
                        <span className="portal-text-gradient">{highlight}</span>
                        {parts[1]}
                        {i < lines.length - 1 && <br />}
                    </span>
                )
            }
            return <span key={i}>{line}{i < lines.length - 1 && <br />}</span>
        })
    }

    const videoUrl = settings.hero_video_url || 'https://www.youtube.com/embed/8y1PekgEC6E'

    return (
        <div className="portal-page portal-home-root">
            <Helmet>
                <title>Beranda | Portal SMK PPRQ</title>
                <meta name="description" content="Selamat datang di Portal Resmi SMK PPRQ. Sekolah Menengah Kejuruan pencetak lulusan siap kerja bersertifikasi dan berkompetensi tinggi." />
                <meta property="og:title" content="Beranda | Portal SMK PPRQ" />
                <meta property="og:description" content="Selamat datang di Portal Resmi SMK PPRQ. Temukan informasi PPDB, Berita, dan Pengumuman terbaru di sini." />
            </Helmet>
            <div className="portal-bg-shapes">
                <div className="portal-shape-blur portal-shape-1" />
                <div className="portal-shape-blur portal-shape-2" />
            </div>
            {/* ====== HERO SECTION ====== */}
            <section className="portal-hero">
                <div
                    className="portal-hero-shapes"
                    style={{ transform: `translateY(${offsetY * 0.5}px)` }}
                >
                    <div className="portal-hero-shape" />
                    <div className="portal-hero-shape" />
                    <div className="portal-hero-shape" />
                </div>

                <div
                    className="portal-hero-content hero-centered"
                    style={{ transform: `translateY(${offsetY * -0.2}px)` }}
                >
                    <div className="portal-hero-grid">
                        <div className="portal-hero-text-column">
                            <div className="portal-hero-badge">
                                🎓 {settings.hero_badge_text || 'Penerimaan Peserta Didik Baru'} {loading ? '...' : (stats?.ppdb_year || '2026/2027')}
                            </div>
                            <h1 className="hero-majestic">
                                {renderHeroTitle()}
                            </h1>
                            <p className="portal-hero-subtitle subtitle-majestic">
                                {settings.hero_subtitle || 'Sekolah Menengah Kejuruan yang mencetak lulusan siap kerja, berkompetensi tinggi, dan berakhlak mulia. Bergabunglah bersama kami!'}
                            </p>
                            <div className="portal-hero-actions actions-centered">
                                <Link to="/ppdb" className="portal-btn portal-btn-primary portal-btn-lg">
                                    ✨ Daftar Sekarang
                                </Link>
                                <Link to="/informasi" className="portal-btn portal-btn-outline portal-btn-lg">
                                    📖 Pelajari Lebih Lanjut
                                </Link>
                                <button
                                    onClick={() => setIsVideoOpen(true)}
                                    className="portal-btn portal-btn-video portal-btn-lg portal-btn-mobile-only"
                                >
                                    <Play size={20} fill="currentColor" />
                                    <span>Tonton Video</span>
                                </button>
                            </div>
                        </div>

                        <div className="portal-hero-video-column">
                            <div
                                className="portal-video-frame-wrapper"
                                style={{
                                    transform: `perspective(1000px) rotateX(${mousePos.y}deg) rotateY(${-mousePos.x}deg)`,
                                    transition: 'transform 0.1s ease-out'
                                }}
                            >
                                <div className="portal-video-frame">
                                    <iframe
                                        width="100%"
                                        height="100%"
                                        src={`${videoUrl}?autoplay=0&mute=0`}
                                        title="School Profile Video"
                                        frameBorder="0"
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                        allowFullScreen
                                    ></iframe>
                                </div>
                                <div className="portal-video-glow" />
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ====== VIDEO MODAL ====== */}
            {isVideoOpen && (
                <div className="portal-video-modal" onClick={() => setIsVideoOpen(false)}>
                    <div className="portal-video-modal-content" onClick={e => e.stopPropagation()}>
                        <button className="portal-video-close" onClick={() => setIsVideoOpen(false)}>
                            <X size={24} />
                        </button>
                        <div className="portal-video-player-container">
                            <iframe
                                width="100%"
                                height="100%"
                                src={`${videoUrl}?autoplay=1`}
                                title="School Profile Video"
                                frameBorder="0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                            ></iframe>
                        </div>
                    </div>
                </div>
            )}

            {/* ====== SCHOOL NETWORK FLOATING SECTION ====== */}
            {(() => {
                try {
                    const json = settings.school_network_json;
                    if (!json) return null;
                    const schools = JSON.parse(json);
                    if (!schools || schools.length === 0) return null;

                    return (
                        <div className="portal-school-network">
                            <div className="school-network-card">
                                {schools.map(school => (
                                    <div key={school.id} className="school-item" title={school.name}>
                                        <div className="school-logo-circle">
                                            {school.logo_url ? (
                                                <img
                                                    src={getDirectDriveUrl(school.logo_url)}
                                                    alt={school.name}
                                                    style={{ maxWidth: '90%', maxHeight: '90%', objectFit: 'contain' }}
                                                />
                                            ) : school.short}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                } catch (e) {
                    return null;
                }
            })()}

            {/* ====== MITRA & PARTNER SECTION ====== */}
            {partners.length > 0 && (
                <section className="portal-partners-section">
                    <div className="portal-container">
                        <div className="portal-section-header">
                            <span className="portal-section-label">Networking</span>
                            <h2 className="portal-section-title">Mitra & Partner Industri</h2>
                            <p className="portal-section-subtitle">
                                Bekerja sama dengan berbagai industri ternama untuk memastikan kurikulum yang relevan dan peluang karir yang luas bagi lulusan.
                            </p>
                        </div>

                        <div style={{ position: 'relative', marginTop: '40px' }}>
                            {/* Navigation */}
                            <button onClick={() => scrollPartners('left')} className="partners-nav-btn left">
                                <ChevronLeft size={32} />
                            </button>
                            <button onClick={() => scrollPartners('right')} className="partners-nav-btn right">
                                <ChevronRight size={32} />
                            </button>

                            {/* CoverFlow Slider */}
                            <div className="partners-coverflow-container">
                                {partners.map((partner, i) => {
                                    let offset = i - activePartner
                                    const total = partners.length

                                    // Wrap around logic for smooth infinite loops
                                    if (offset < -Math.floor(total / 2)) offset += total
                                    if (offset > Math.floor(total / 2)) offset -= total

                                    const isCenter = offset === 0
                                    const isHidden = Math.abs(offset) > 2

                                    // Scale, Blur, Translates based on offset
                                    const scale = isCenter ? 1 : isHidden ? 0.6 : 0.8
                                    const blur = isCenter ? '0px' : isHidden ? '10px' : '4px'
                                    const opacity = isCenter ? 1 : isHidden ? 0 : 0.5
                                    const zIndex = isCenter ? 20 : isHidden ? 0 : 10
                                    const translateX = isCenter ? '0%' : offset < 0 ? `${-110 + (offset + 1) * 25}%` : `${110 + (offset - 1) * 25}%`

                                    return (
                                        <div
                                            key={partner.id}
                                            className={`partner-card ${isCenter ? 'center' : ''}`}
                                            style={{
                                                position: 'absolute',
                                                transform: `translateX(${translateX}) scale(${scale})`,
                                                opacity: opacity,
                                                filter: `blur(${blur})`,
                                                zIndex: zIndex,
                                                pointerEvents: isCenter ? 'auto' : 'none'
                                            }}
                                            onClick={() => setActivePartner(i)}
                                        >
                                            <div className="partner-logo-wrapper">
                                                <img src={getDirectDriveUrl(partner.logo_url)} alt={partner.name} />
                                            </div>
                                            <div className="partner-info">
                                                <h4>{partner.name}</h4>
                                                <p>Mitra Industri Strategis</p>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    </div>
                </section>
            )}

            {/* ====== TABBED PROGRAM KEAHLIAN ====== */}
            <section className="portal-section portal-section-tight-top">
                <div className="portal-container">
                    <div className="portal-section-header">
                        <span className="portal-section-label">
                            {settings.programs_section_label || 'Program Keahlian'}
                        </span>
                        <h2 className="portal-section-title">
                            {settings.programs_section_title || 'Jurusan Unggulan Kami'}
                        </h2>
                        <p className="portal-section-subtitle">
                            {settings.programs_section_subtitle || 'Cari tahu spesialisasi yang paling cocok dengan minat dan bakatmu.'}
                        </p>
                    </div>

                    {/* Tab Navigation */}
                    <div className="portal-program-tabs">
                        {programs.length > 0 ? (
                            programs.map((prog, idx) => (
                                <button
                                    key={prog.id}
                                    className={`portal-tab-btn ${idx === 0 ? 'active' : ''}`}
                                >
                                    {prog.title}
                                </button>
                            ))
                        ) : (
                            <>
                                <button className="portal-tab-btn active">Teknik Komputer</button>
                                <button className="portal-tab-btn">Otomatisasi Perkantoran</button>
                                <button className="portal-tab-btn">Akuntansi Keuangan</button>
                            </>
                        )}
                    </div>

                    {/* Tab Content Display */}
                    <div className="portal-program-tab-content active">
                        <div className="portal-program-tab-grid">
                            <div className="portal-program-tab-info">
                                <div className="portal-program-icon-large">💻</div>
                                <h3>Teknik Komputer & Jaringan</h3>
                                <p>Kuasai jaringan, server, dan infrastruktur IT modern untuk dunia industri digital. Lulusan dipersiapkan menjadi Network Administrator atau IT Support handal.</p>
                                <ul className="portal-program-features">
                                    <li><CheckCircle size={16} /> Praktik Lab Cisco & Mikrotik</li>
                                    <li><CheckCircle size={16} /> Sertifikasi Internasional</li>
                                    <li><CheckCircle size={16} /> Magang di Perusahaan IT</li>
                                </ul>
                                <Link to="/jurusan/tkj" className="portal-btn portal-btn-outline-dark portal-btn-sm" style={{ marginTop: '20px' }}>
                                    Lihat Kurikulum <ArrowRight size={14} />
                                </Link>
                            </div>
                            <div className="portal-program-tab-image">
                                <img src="https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=800" alt="TKJ Lab" />
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ====== BANNER SLIDER SECTION ====== */}
            {banners.length > 0 && (
                <section className="portal-banners-section">
                    <div className="portal-container">
                        <div className="portal-banner-frame">
                            <div className="portal-banner-slider">
                                {banners.map((banner, index) => (
                                    <div
                                        key={banner.id}
                                        className="portal-banner-slide"
                                        style={{ display: index === currentBanner ? 'block' : 'none' }}
                                    >
                                        <img
                                            src={getDirectDriveUrl(banner.image_url)}
                                            alt={banner.title}
                                            className="portal-banner-image"
                                        />
                                        <div className="portal-banner-overlay">
                                            <div className="portal-banner-content">
                                                <h2 className="portal-banner-title">{banner.title}</h2>
                                                <p className="portal-banner-subtitle">{banner.subtitle}</p>
                                                {banner.link_url && (
                                                    <Link
                                                        to={banner.link_url}
                                                        className="portal-btn portal-btn-primary portal-btn-lg"
                                                    >
                                                        🚀 Selengkapnya
                                                    </Link>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                {banners.length > 1 && (
                                    <>
                                        {/* Progress Bar Header */}
                                        <div className="portal-banner-progress-container">
                                            {banners.map((_, i) => (
                                                <div key={i} className="portal-banner-progress-track">
                                                    <div
                                                        className="portal-banner-progress-fill"
                                                        style={{
                                                            width: i === currentBanner ? `${bannerProgress}%` : (i < currentBanner ? '100%' : '0%'),
                                                            transition: i === currentBanner ? 'width 0.1s linear' : 'none'
                                                        }}
                                                    />
                                                </div>
                                            ))}
                                        </div>

                                        <div className="portal-banner-dots" style={{ bottom: '20px' }}>
                                            {banners.map((_, i) => (
                                                <div
                                                    key={i}
                                                    className={`banner-dot ${i === currentBanner ? 'active' : ''}`}
                                                    onClick={() => setCurrentBanner(i)}
                                                />
                                            ))}
                                        </div>
                                        <div className="portal-banner-nav">
                                            <button
                                                className="btn-nav-banner"
                                                onClick={() => setCurrentBanner((prev) => (prev - 1 + banners.length) % banners.length)}
                                            >
                                                <ChevronLeft size={24} />
                                            </button>
                                            <button
                                                className="btn-nav-banner"
                                                onClick={() => setCurrentBanner((prev) => (prev + 1) % banners.length)}
                                            >
                                                <ChevronRight size={24} />
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </section>
            )}

            {/* ====== PENGUMUMAN TERBARU ====== */}
            <section className="portal-section" style={{ background: 'var(--portal-bg-alt)' }}>
                <div className="portal-container">
                    <div className="portal-section-header">
                        <span className="portal-section-label">Info Terkini</span>
                        <h2 className="portal-section-title">Pengumuman Terbaru</h2>
                        <p className="portal-section-subtitle">
                            Tetap update dengan informasi dan kegiatan terbaru dari sekolah.
                        </p>
                    </div>

                    {loading ? (
                        <div className="portal-grid portal-grid-3">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="portal-card">
                                    <div className="portal-skeleton portal-skeleton-card" />
                                    <div className="portal-card-body">
                                        <div className="portal-skeleton portal-skeleton-title" />
                                        <div className="portal-skeleton portal-skeleton-text" />
                                        <div className="portal-skeleton portal-skeleton-text" style={{ width: '60%' }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : posts.length > 0 ? (
                        <div className="portal-grid portal-grid-3">
                            {posts.map(post => (
                                <Link key={post.id} to={`/pengumuman/${post.slug}`} style={{ textDecoration: 'none' }}>
                                    <div className="portal-card">
                                        {post.cover_image && (
                                            <img
                                                src={getDirectDriveUrl(post.cover_image)}
                                                alt={post.title}
                                                className="portal-card-image"
                                                loading="lazy"
                                            />
                                        )}
                                        {!post.cover_image && (
                                            <div className="portal-card-image" style={{
                                                background: 'var(--portal-gradient-soft)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontSize: '2rem'
                                            }}>
                                                📢
                                            </div>
                                        )}
                                        <div className="portal-card-body">
                                            <span className="portal-card-category">{post.category}</span>
                                            <h3 className="portal-card-title">{post.title}</h3>
                                            <p className="portal-card-text">{post.excerpt}</p>
                                            <div className="portal-card-meta">
                                                📅 {formatDate(post.published_at || post.created_at)}
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--portal-text-muted)' }}>
                            Belum ada pengumuman terbaru.
                        </div>
                    )}

                    {posts.length > 0 && (
                        <div style={{ textAlign: 'center', marginTop: '32px' }}>
                            <Link to="/pengumuman" className="portal-btn portal-btn-outline-dark">
                                Lihat Semua Pengumuman →
                            </Link>
                        </div>
                    )}
                </div>
            </section>

            {/* ====== CTA SECTION ====== */}
            <section className="portal-cta">
                <div className="portal-container">
                    <h2>{settings.cta_title || 'Siap Bergabung Bersama Kami?'}</h2>
                    <p>
                        {settings.cta_subtitle || 'Jangan lewatkan kesempatan emas untuk meraih masa depan yang cemerlang. Daftarkan dirimu sekarang juga!'}
                    </p>
                    <Link to="/ppdb" className="portal-btn portal-btn-primary portal-btn-lg">
                        {settings.cta_button_text || '✨ Daftar PPDB Sekarang'}
                    </Link>
                </div>
            </section>

            {/* ====== SMART STICKY ACTION BAR (MOBILE ONLY) ====== */}
            <div className={`portal-mobile-sticky-bar ${offsetY > 300 ? 'visible' : ''}`}>
                <div className="portal-sticky-bar-content">
                    <Link to="/ppdb" className="portal-sticky-btn primary">
                        Daftar PPDB
                    </Link>
                    <a href={`https://wa.me/${settings.contact_whatsapp || '628123456789'}`} target="_blank" rel="noreferrer" className="portal-sticky-btn secondary">
                        Tanya Admin
                    </a>
                </div>
            </div>
        </div>
    )
}
