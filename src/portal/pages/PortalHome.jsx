import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Play, X, ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react'
import { usePortal } from '../context/PortalContext'
import '../styles/portal-banners.css'

export default function PortalHome() {
    const { fetchPublic } = usePortal()
    const [stats, setStats] = useState(null)
    const [posts, setPosts] = useState([])
    const [banners, setBanners] = useState([])
    const [programs, setPrograms] = useState([])
    const [partners, setPartners] = useState([])
    const [settings, setSettings] = useState({})
    const [loading, setLoading] = useState(true)
    const [isVideoOpen, setIsVideoOpen] = useState(false)
    const [currentBanner, setCurrentBanner] = useState(0)

    useEffect(() => {
        if (banners.length > 0) {
            const timer = setInterval(() => {
                setCurrentBanner((prev) => (prev + 1) % banners.length)
            }, 6000)
            return () => clearInterval(timer)
        }
    }, [banners])

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
            <div className="portal-bg-shapes">
                <div className="portal-shape-blur portal-shape-1" />
                <div className="portal-shape-blur portal-shape-2" />
            </div>
            {/* ====== HERO SECTION ====== */}
            <section className="portal-hero">
                <div className="portal-hero-shapes">
                    <div className="portal-hero-shape" />
                    <div className="portal-hero-shape" />
                    <div className="portal-hero-shape" />
                </div>

                <div className="portal-hero-content hero-centered">
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
                            <div className="portal-video-frame-wrapper">
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

            {/* ====== PARTNER LOGOS SECTION ====== */}
            {partners.length > 0 && (
                <section className="portal-section" style={{ paddingTop: 0, paddingBottom: 0, overflow: 'visible', zIndex: 30 }}>
                    <div className="portal-container">
                        <div className="portal-partner-logos-row">
                            {partners.map(partner => (
                                <div key={partner.id} className="portal-partner-logo-container">
                                    {partner.website_url ? (
                                        <a href={partner.website_url} target="_blank" rel="noreferrer" title={partner.name}>
                                            <img src={partner.logo_url} alt={partner.name} />
                                        </a>
                                    ) : (
                                        <img src={partner.logo_url} alt={partner.name} />
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* ====== PROGRAM KEAHLIAN ====== */}
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
                            {settings.programs_section_subtitle || 'Pilih jalur kariermu dan kuasai keahlian yang dibutuhkan industri masa kini.'}
                        </p>
                    </div>

                    <div className="portal-grid portal-grid-3">
                        {programs.length > 0 ? programs.map(program => (
                            <Link key={program.id} to={`/jurusan/${program.slug || '#'}`} className="portal-program-card-link" style={{ textDecoration: 'none', color: 'inherit' }}>
                                <div className="portal-program-card">
                                    <div className="portal-program-icon">{program.icon}</div>
                                    <h3>{program.title}</h3>
                                    <p>{program.description}</p>
                                    <div className="portal-program-more" style={{
                                        marginTop: 'auto',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '4px',
                                        fontSize: '0.85rem',
                                        fontWeight: 700,
                                        color: 'var(--portal-primary)'
                                    }}>
                                        Detail Jurusan <ArrowRight size={14} />
                                    </div>
                                </div>
                            </Link>
                        )) : (
                            <>
                                <div className="portal-program-card">
                                    <div className="portal-program-icon">💻</div>
                                    <h3>Teknik Komputer & Jaringan</h3>
                                    <p>Kuasai jaringan, server, dan infrastruktur IT modern untuk dunia industri digital.</p>
                                </div>
                                <div className="portal-program-card">
                                    <div className="portal-program-icon">🏢</div>
                                    <h3>Otomatisasi & Tata Kelola Perkantoran</h3>
                                    <p>Pelajari manajemen perkantoran digital, administrasi, dan komunikasi profesional.</p>
                                </div>
                                <div className="portal-program-card">
                                    <div className="portal-program-icon">📊</div>
                                    <h3>Akuntansi & Keuangan</h3>
                                    <p>Dalami akuntansi, perpajakan, dan pengelolaan keuangan perusahaan secara digital.</p>
                                </div>
                            </>
                        )}
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
                                            src={banner.image_url}
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
                                        <div className="portal-banner-dots">
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
                                                src={post.cover_image}
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
        </div>
    )
}
