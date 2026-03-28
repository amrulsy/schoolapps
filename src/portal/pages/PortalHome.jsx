import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { 
    Play, X, ChevronLeft, ChevronRight, ArrowRight, CheckCircle, 
    ChevronDown, MessageCircle, GraduationCap, Trophy, Briefcase 
} from 'lucide-react'
import { usePortal } from '../context/PortalContext'
import { getDirectDriveUrl } from '../../utils/urlHelper'
import '../styles/portal-banners.css'
import '../styles/portal-home-partners.css'
import '../styles/portal-programs.css'

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

    // New states for new sections
    const [testimonials, setTestimonials] = useState([])
    const [gallery, setGallery] = useState([])
    const [faq, setFaq] = useState([])
    const [activeFaq, setActiveFaq] = useState(null)
    const [galleryFilter, setGalleryFilter] = useState('Semua')
    const [lightboxImg, setLightboxImg] = useState(null)
    const [identityLogos, setIdentityLogos] = useState([])
    const [hoveredCard, setHoveredCard] = useState(null)
    // ----------------------------------

    // --- Event Listeners for Parallax & Tilt ---
    useEffect(() => {
        const handleScroll = () => setOffsetY(window.scrollY)
        const handleMouseMove = (e) => {
            setMousePos({
                x: (e.clientX / window.innerWidth - 0.5) * 20,
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
            setBannerProgress(0)

            const progressTimer = setInterval(() => {
                setBannerProgress(prev => {
                    if (prev >= 100) return 100
                    return prev + (100 / 60)
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
            const [statsData, postsData, bannersData, programsData, partnersData, settingsData, testimonialsData, galleryData, faqData, identityData] = await Promise.all([
                fetchPublic('/stats'),
                fetchPublic('/posts?limit=3'),
                fetchPublic('/banners'),
                fetchPublic('/programs'),
                fetchPublic('/partners'),
                fetchPublic('/settings'),
                fetchPublic('/testimonials'),
                fetchPublic('/gallery'),
                fetchPublic('/faq'),
                fetchPublic('/identity-logos')
            ])
            if (statsData) setStats(statsData)
            if (postsData) setPosts(postsData.data || [])
            if (bannersData) setBanners(bannersData)
            if (programsData) setPrograms(programsData)
            if (partnersData) setPartners(partnersData)
            if (settingsData) setSettings(settingsData)
            if (testimonialsData) setTestimonials(testimonialsData)
            if (galleryData) setGallery(galleryData)
            if (faqData) setFaq(faqData)
            if (identityData) setIdentityLogos(identityData)
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

    // Gallery filter helpers
    const galleryCategories = ['Semua', ...new Set(gallery.map(g => g.category).filter(Boolean))]
    const filteredGallery = galleryFilter === 'Semua' ? gallery : gallery.filter(g => g.category === galleryFilter)

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

            {/* ═══════════════════════════════════════════
                 1. HERO SECTION
               ═══════════════════════════════════════════ */}
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

            {/* ═══════════════════════════════════════════
                 2. LOGO IDENTITAS (Identity Cards - Dynamic Marquee)
               ═══════════════════════════════════════════ */}
            {identityLogos.length > 0 && (
                <section className="portal-identity-section">
                    <div className="marquee-container">
                        <div className="identity-cards-wrapper">
                            {/* Seamless Marquee: Double the items */}
                            {[...identityLogos, ...identityLogos].map((logo, idx) => {
                                const defaultEmoji = { yayasan: '🏛️', jurusan: '🎓', pramuka: '⚜️', osis: '🏅', ekskul: '🎭' }
                                return (
                                    <div key={`${logo.id}-${idx}`} className="identity-card stagger-item" style={{ animationDelay: `${idx * 0.2}s` }}>
                                        <div className={`identity-icon ${logo.color_class || 'yayasan'}`}>
                                            {logo.logo_url
                                                ? <img src={getDirectDriveUrl(logo.logo_url)} alt={logo.name} style={{ maxWidth: '80%', maxHeight: '80%', objectFit: 'contain' }} />
                                                : (defaultEmoji[logo.color_class] || '🏫')}
                                        </div>
                                        <div className="identity-text">
                                            <h5>{logo.label}</h5>
                                            <h4>{logo.name}</h4>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </section>
            )}

            {/* ═══════════════════════════════════════════
                 3. PROGRAM KEAHLIAN
               ═══════════════════════════════════════════ */}
            {programs.length > 0 && (
                <section className="portal-section portal-section-tight-top">
                    <div className="portal-container">
                        <div className="portal-section-header">
                            <span className="portal-section-label">{settings.programs_section_label || 'Program Keahlian'}</span>
                            <h2 className="portal-section-title">{settings.programs_section_title || 'Jurusan Unggulan Kami'}</h2>
                            <p className="portal-section-subtitle">
                                {settings.programs_section_subtitle || 'Pilih jalur kariermu dan kuasai keahlian yang dibutuhkan industri masa kini.'}
                            </p>
                        </div>
                        <div className="programs-grid">
                            {programs.map((program, idx) => {
                                const themeColor = program.color_theme || '#4f46e5'
                                const features = (() => {
                                    let f = program.features_json
                                    if (typeof f === 'string') { try { f = JSON.parse(f) } catch { f = [] } }
                                    return Array.isArray(f) ? f.filter(x => x.title).slice(0, 3) : []
                                })()
                                const statsJson = (() => {
                                    let s = program.stats_json
                                    if (typeof s === 'string') { try { s = JSON.parse(s) } catch { s = {} } }
                                    return s || {}
                                })()

                                return (
                                    <Link
                                        key={program.id}
                                        to={`/jurusan/${program.slug}`}
                                        className={`program-card stagger-item ${hoveredCard === program.id ? 'hovered' : ''}`}
                                        onMouseEnter={() => setHoveredCard(program.id)}
                                        onMouseLeave={() => setHoveredCard(null)}
                                        style={{ 
                                            textDecoration: 'none', 
                                            '--prog-color': themeColor, 
                                            animationDelay: `${idx * 0.2}s` 
                                        }}
                                    >
                                        <div className="program-card-header" style={{ background: `linear-gradient(135deg, ${themeColor} 0%, ${themeColor}dd 100%)` }}>
                                            {program.banner_image && (
                                                <img src={getDirectDriveUrl(program.banner_image)} alt="" className="program-card-banner" />
                                            )}
                                            <div className="program-card-icon-wrap">
                                                {program.icon && !program.icon.includes('/') ? (
                                                    <span className="program-card-emoji">{program.icon}</span>
                                                ) : program.logo_image || program.banner_image ? (
                                                    <img src={getDirectDriveUrl(program.logo_image || program.banner_image)} alt={program.title} className="program-card-logo-img" />
                                                ) : (
                                                    <span className="program-card-emoji">📚</span>
                                                )}
                                            </div>
                                            <div className="program-card-header-text">
                                                <span className="program-card-label">KOMPETENSI KEAHLIAN</span>
                                                <h3 className="program-card-title">{program.title}</h3>
                                            </div>
                                            <div className="program-card-deco" />
                                        </div>

                                        <div className="program-card-body">
                                            <p className="program-card-desc">
                                                {program.tagline || program.description || 'Program keahlian unggulan dengan kurikulum berbasis industri.'}
                                            </p>

                                            {features.length > 0 && (
                                                <div className="program-card-features">
                                                    {features.map((f, i) => (
                                                        <span key={i} className="program-feature-pill" style={{ background: `${themeColor}10`, color: themeColor }}>
                                                            <CheckCircle size={12} /> {f.title}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}

                                            <div className="program-card-stats">
                                                {statsJson.labor_absorption && (
                                                    <div className="program-mini-stat">
                                                        <Trophy size={14} />
                                                        <span>{statsJson.labor_absorption}</span>
                                                    </div>
                                                )}
                                                {statsJson.partners_count && (
                                                    <div className="program-mini-stat">
                                                        <Briefcase size={14} />
                                                        <span>{statsJson.partners_count} Mitra</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="program-card-footer">
                                            <span>Lihat Detail</span>
                                            <ArrowRight size={18} className="program-card-arrow" />
                                        </div>
                                    </Link>
                                )
                            })}
                        </div>
                    </div>
                </section>
            )}

            {/* ═══════════════════════════════════════════
                 4. STATISTIK SEKOLAH
               ═══════════════════════════════════════════ */}
            <section className="portal-stats-section">
                <div className="portal-container">
                    <div className="portal-section-header">
                        <span className="portal-section-label">Data & Fakta</span>
                        <h2 className="portal-section-title">Statistik Sekolah</h2>
                        <p className="portal-section-subtitle">
                            Angka-angka yang membuktikan komitmen kami terhadap pendidikan berkualitas.
                        </p>
                    </div>
                    <div className="portal-stats-grid">
                        {[
                            { icon: '👨‍🎓', value: stats?.total_siswa || 0, label: 'Siswa Aktif' },
                            { icon: '👨‍🏫', value: stats?.total_guru || 0, label: 'Tenaga Pengajar' },
                            { icon: '🏫', value: stats?.total_kelas || 0, label: 'Ruang Kelas' },
                            { icon: '🤝', value: stats?.total_partner || 0, label: 'Mitra Industri' }
                        ].map((stat, i) => (
                            <div key={i} className="portal-stat-card stagger-item" style={{ animationDelay: `${i * 0.2}s` }}>
                                <div className="portal-stat-icon">{stat.icon}</div>
                                <div className="portal-stat-number">{loading ? '...' : stat.value.toLocaleString('id-ID')}</div>
                                <div className="portal-stat-label">{stat.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ═══════════════════════════════════════════
                 5. BANNER PROMO SLIDER
               ═══════════════════════════════════════════ */}
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

            {/* ═══════════════════════════════════════════
                 6. PENGUMUMAN TERBARU
               ═══════════════════════════════════════════ */}
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
                            {posts.map((post, idx) => (
                                <Link key={post.id} to={`/pengumuman/${post.slug}`} className="stagger-item" style={{ textDecoration: 'none', animationDelay: `${idx * 0.2}s` }}>
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

            {/* ═══════════════════════════════════════════
                 7A. MITRA INDUSTRI (Partners CoverFlow)
               ═══════════════════════════════════════════ */}
            {partners.length > 0 && (
                <section className="portal-partners-section">
                    <div className="portal-container">
                        <div className="portal-section-header">
                            <span className="portal-section-label">Networking</span>
                            <h2 className="portal-section-title">Mitra Industri Khusus</h2>
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

                                    if (offset < -Math.floor(total / 2)) offset += total
                                    if (offset > Math.floor(total / 2)) offset -= total

                                    const isCenter = offset === 0
                                    const isHidden = Math.abs(offset) > 2

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

            {/* ═══════════════════════════════════════════
                 7B. JEJARING SEKOLAH AFILIASI (School Network)
               ═══════════════════════════════════════════ */}
            {(() => {
                try {
                    const json = settings.school_network_json;
                    if (!json) return null;
                    const schools = JSON.parse(json);
                    if (!schools || schools.length === 0) return null;

                    return (
                        <section className="portal-school-network-section">
                            <div className="portal-container">
                                <div className="portal-section-header">
                                    <span className="portal-section-label">Afiliasi</span>
                                    <h2 className="portal-section-title">Jejaring Sekolah Afiliasi</h2>
                                    <p className="portal-section-subtitle">
                                        Terhubung dengan jaringan sekolah-sekolah unggulan di bawah naungan yayasan yang sama.
                                    </p>
                                </div>
                                <div className="portal-school-grid">
                                    {schools.map(school => (
                                        <div key={school.id} className="portal-school-card">
                                            <div className="school-card-inner">
                                                <div className="school-logo-box">
                                                    {school.logo_url ? (
                                                        <img
                                                            src={getDirectDriveUrl(school.logo_url)}
                                                            alt={school.name}
                                                        />
                                                    ) : (
                                                        <span className="school-abbr">{school.short}</span>
                                                    )}
                                                </div>
                                                <div className="school-details">
                                                    <h4>{school.name}</h4>
                                                    {school.level && <span className="school-badge">{school.level}</span>}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </section>
                    );
                } catch (e) {
                    return null;
                }
            })()}

            {/* ═══════════════════════════════════════════
                 8A. TESTIMONI
               ═══════════════════════════════════════════ */}
            {testimonials.length > 0 && (
                <section className="portal-testimonials-section">
                    <div className="portal-container">
                        <div className="portal-section-header">
                            <span className="portal-section-label">Testimoni</span>
                            <h2 className="portal-section-title">Apa Kata Mereka?</h2>
                            <p className="portal-section-subtitle">
                                Dengarkan pengalaman langsung dari para siswa, alumni, dan orang tua.
                            </p>
                        </div>
                        <div className="portal-testimonials-grid">
                            {testimonials.map(t => (
                                <div key={t.id} className="portal-testimonial-card">
                                    <div className="portal-testimonial-quote-icon">❝</div>
                                    <div className="portal-testimonial-stars">
                                        {Array.from({ length: t.rating || 5 }).map((_, i) => (
                                            <span key={i}>⭐</span>
                                        ))}
                                    </div>
                                    <p className="portal-testimonial-text">"{t.quote}"</p>
                                    <div className="portal-testimonial-author">
                                        <div className="portal-testimonial-avatar">
                                            {t.photo_url ? (
                                                <img src={getDirectDriveUrl(t.photo_url)} alt={t.name} />
                                            ) : (
                                                t.name?.charAt(0)?.toUpperCase() || '?'
                                            )}
                                        </div>
                                        <div>
                                            <div className="portal-testimonial-name">{t.name}</div>
                                            <div className="portal-testimonial-role">{t.role}{t.company ? ` — ${t.company}` : ''}</div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* ═══════════════════════════════════════════
                 8B. GALERI
               ═══════════════════════════════════════════ */}
            {gallery.length > 0 && (
                <section className="portal-gallery-section">
                    <div className="portal-container">
                        <div className="portal-section-header">
                            <span className="portal-section-label">Galeri</span>
                            <h2 className="portal-section-title">Momen & Kegiatan</h2>
                            <p className="portal-section-subtitle">
                                Dokumentasi kegiatan sekolah, acara, dan prestasi yang membanggakan.
                            </p>
                        </div>

                        {galleryCategories.length > 1 && (
                            <div className="portal-gallery-filter">
                                {galleryCategories.map(cat => (
                                    <button
                                        key={cat}
                                        className={`portal-gallery-filter-btn ${galleryFilter === cat ? 'active' : ''}`}
                                        onClick={() => setGalleryFilter(cat)}
                                    >
                                        {cat}
                                    </button>
                                ))}
                            </div>
                        )}

                        <div className="portal-gallery-grid">
                            {filteredGallery.map(item => (
                                <div
                                    key={item.id}
                                    className="portal-gallery-item"
                                    onClick={() => setLightboxImg(item)}
                                >
                                    <img src={getDirectDriveUrl(item.image_url)} alt={item.title} loading="lazy" />
                                    <div className="portal-gallery-overlay">
                                        <div>
                                            {item.category && <div className="portal-gallery-overlay-cat">{item.category}</div>}
                                            <div className="portal-gallery-overlay-text">{item.title}</div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* Lightbox */}
            {lightboxImg && (
                <div className="portal-lightbox" onClick={() => setLightboxImg(null)}>
                    <button className="portal-lightbox-close" onClick={() => setLightboxImg(null)}>
                        <X size={24} />
                    </button>
                    <img src={getDirectDriveUrl(lightboxImg.image_url)} alt={lightboxImg.title} onClick={e => e.stopPropagation()} />
                    <div className="portal-lightbox-caption">{lightboxImg.title}</div>
                </div>
            )}

            {/* ═══════════════════════════════════════════
                 8C. FAQ
               ═══════════════════════════════════════════ */}
            {faq.length > 0 && (
                <section className="portal-faq-section">
                    <div className="portal-container">
                        <div className="portal-section-header">
                            <span className="portal-section-label">FAQ</span>
                            <h2 className="portal-section-title">Pertanyaan yang Sering Diajukan</h2>
                            <p className="portal-section-subtitle">
                                Temukan jawaban untuk pertanyaan umum seputar sekolah kami.
                            </p>
                        </div>
                        <div className="portal-faq-list">
                            {faq.map(item => (
                                <div
                                    key={item.id}
                                    className={`portal-faq-item ${activeFaq === item.id ? 'active' : ''}`}
                                >
                                    <div
                                        className="portal-faq-question"
                                        onClick={() => setActiveFaq(activeFaq === item.id ? null : item.id)}
                                    >
                                        <span>{item.question}</span>
                                        <div className="portal-faq-toggle">
                                            <ChevronDown size={18} />
                                        </div>
                                    </div>
                                    <div className="portal-faq-answer">
                                        <div className="portal-faq-answer-inner">
                                            {item.answer}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* ═══════════════════════════════════════════
                 8D. CTA SECTION
               ═══════════════════════════════════════════ */}
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

        </div>
    )
}
