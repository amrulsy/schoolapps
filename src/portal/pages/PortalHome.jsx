import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { usePortal } from '../context/PortalContext'

export default function PortalHome() {
    const { fetchPublic } = usePortal()
    const [stats, setStats] = useState(null)
    const [posts, setPosts] = useState([])
    const [banners, setBanners] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function loadData() {
            setLoading(true)
            const [statsData, postsData, bannersData] = await Promise.all([
                fetchPublic('/stats'),
                fetchPublic('/posts?limit=3'),
                fetchPublic('/banners')
            ])
            if (statsData) setStats(statsData)
            if (postsData) setPosts(postsData.data || [])
            if (bannersData) setBanners(bannersData)
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
                    <div className="portal-hero-badge">
                        🎓 Penerimaan Peserta Didik Baru {loading ? '...' : (stats?.ppdb_year || '2026/2027')}
                    </div>
                    <h1 className="hero-majestic">
                        Raih Masa Depan <br />
                        <span className="portal-text-gradient">Cemerlang Bersama</span> <br />
                        SMK PPRQ
                    </h1>
                    <p className="portal-hero-subtitle subtitle-majestic">
                        Sekolah Menengah Kejuruan yang mencetak lulusan siap kerja,
                        berkompetensi tinggi, dan berakhlak mulia. Bergabunglah bersama kami!
                    </p>
                    <div className="portal-hero-actions actions-centered">
                        <Link to="/portal/ppdb" className="portal-btn portal-btn-primary portal-btn-lg">
                            ✨ Daftar Sekarang
                        </Link>
                        <Link to="/portal/informasi" className="portal-btn portal-btn-outline portal-btn-lg">
                            📖 Pelajari Lebih Lanjut
                        </Link>
                    </div>
                </div>
            </section>

            {/* ====== PARTNER LOGOS SECTION ====== */}
            <section className="portal-section" style={{ paddingTop: 0, paddingBottom: 0, overflow: 'visible', zIndex: 30 }}>
                <div className="portal-container">
                    <div className="portal-partner-logos-row">
                        <div className="portal-partner-logo-container">
                            <img src="https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/cisco.svg" alt="Cisco" />
                        </div>
                        <div className="portal-partner-logo-container">
                            <img src="https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/microsoft.svg" alt="Microsoft" />
                        </div>
                        <div className="portal-partner-logo-container">
                            <img src="https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/oracle.svg" alt="Oracle" />
                        </div>
                        <div className="portal-partner-logo-container">
                            <img src="https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/google.svg" alt="Google" />
                        </div>
                        <div className="portal-partner-logo-container">
                            <img src="https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/intel.svg" alt="Intel" />
                        </div>
                    </div>
                </div>
            </section>

            {/* ====== PROGRAM KEAHLIAN ====== */}
            <section className="portal-section">
                <div className="portal-container">
                    <div className="portal-section-header">
                        <span className="portal-section-label">Program Keahlian</span>
                        <h2 className="portal-section-title">Jurusan Unggulan Kami</h2>
                        <p className="portal-section-subtitle">
                            Pilih jalur kariermu dan kuasai keahlian yang dibutuhkan industri masa kini.
                        </p>
                    </div>

                    <div className="portal-grid portal-grid-3">
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
                    </div>
                </div>
            </section>

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
                                <Link key={post.id} to={`/portal/pengumuman/${post.slug}`} style={{ textDecoration: 'none' }}>
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
                            <Link to="/portal/pengumuman" className="portal-btn portal-btn-outline-dark">
                                Lihat Semua Pengumuman →
                            </Link>
                        </div>
                    )}
                </div>
            </section>

            {/* ====== CTA SECTION ====== */}
            <section className="portal-cta">
                <div className="portal-container">
                    <h2>Siap Bergabung Bersama Kami?</h2>
                    <p>
                        Jangan lewatkan kesempatan emas untuk meraih masa depan yang cemerlang.
                        Daftarkan dirimu sekarang juga!
                    </p>
                    <Link to="/portal/ppdb" className="portal-btn portal-btn-primary portal-btn-lg">
                        ✨ Daftar PPDB Sekarang
                    </Link>
                </div>
            </section>
        </div>
    )
}
