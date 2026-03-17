import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { usePortal } from '../context/PortalContext'

export default function PortalAnnouncements() {
    const { fetchPublic } = usePortal()
    const [posts, setPosts] = useState([])
    const [loading, setLoading] = useState(true)
    const [page, setPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [category, setCategory] = useState('')

    useEffect(() => {
        loadPosts()
    }, [page, category])

    async function loadPosts() {
        setLoading(true)
        const params = `?page=${page}&limit=9${category ? `&category=${category}` : ''}`
        const data = await fetchPublic(`/posts${params}`)
        if (data) {
            setPosts(data.data || [])
            setTotalPages(data.pagination?.totalPages || 1)
        }
        setLoading(false)
    }

    const formatDate = (dateStr) => {
        if (!dateStr) return ''
        return new Date(dateStr).toLocaleDateString('id-ID', {
            day: 'numeric', month: 'long', year: 'numeric'
        })
    }

    const categories = [
        { value: '', label: 'Semua' },
        { value: 'pengumuman', label: 'Pengumuman' },
        { value: 'berita', label: 'Berita' },
        { value: 'artikel', label: 'Artikel' },
    ]

    return (
        <div className="portal-page">
            <div className="portal-page-header">
                <div className="portal-container">
                    <h1>📢 Pengumuman</h1>
                    <p>Informasi dan pengumuman terbaru dari SMK PPRQ</p>
                </div>
            </div>

            <section className="portal-section">
                <div className="portal-container">
                    {/* Filter */}
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '32px', flexWrap: 'wrap' }}>
                        {categories.map(cat => (
                            <button
                                key={cat.value}
                                className={`portal-btn portal-btn-sm ${category === cat.value ? 'portal-btn-primary' : 'portal-btn-outline-dark'}`}
                                onClick={() => { setCategory(cat.value); setPage(1); }}
                            >
                                {cat.label}
                            </button>
                        ))}
                    </div>

                    {loading ? (
                        <div className="portal-grid portal-grid-3">
                            {[1, 2, 3, 4, 5, 6].map(i => (
                                <div key={i} className="portal-card">
                                    <div className="portal-skeleton portal-skeleton-card" />
                                    <div className="portal-card-body">
                                        <div className="portal-skeleton portal-skeleton-title" />
                                        <div className="portal-skeleton portal-skeleton-text" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : posts.length > 0 ? (
                        <>
                            <div className="portal-grid portal-grid-3">
                                {posts.map(post => (
                                    <Link key={post.id} to={`/portal/pengumuman/${post.slug}`} style={{ textDecoration: 'none' }}>
                                        <div className="portal-card">
                                            {post.cover_image ? (
                                                <img src={post.cover_image} alt={post.title} className="portal-card-image" loading="lazy" />
                                            ) : (
                                                <div className="portal-card-image" style={{
                                                    background: 'var(--portal-gradient-soft)',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem'
                                                }}>📢</div>
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

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '40px' }}>
                                    {page > 1 && (
                                        <button className="portal-btn portal-btn-sm portal-btn-outline-dark" onClick={() => setPage(p => p - 1)}>
                                            ← Sebelumnya
                                        </button>
                                    )}
                                    <span style={{ display: 'flex', alignItems: 'center', padding: '0 16px', color: 'var(--portal-text-secondary)', fontSize: '0.9rem' }}>
                                        Halaman {page} dari {totalPages}
                                    </span>
                                    {page < totalPages && (
                                        <button className="portal-btn portal-btn-sm portal-btn-outline-dark" onClick={() => setPage(p => p + 1)}>
                                            Selanjutnya →
                                        </button>
                                    )}
                                </div>
                            )}
                        </>
                    ) : (
                        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--portal-text-muted)' }}>
                            <div style={{ fontSize: '3rem', marginBottom: '16px' }}>📭</div>
                            <p>Belum ada pengumuman yang dipublikasikan.</p>
                        </div>
                    )}
                </div>
            </section>
        </div>
    )
}
