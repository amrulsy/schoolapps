import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { usePortal } from '../context/PortalContext'

export default function PortalAnnouncementDetail() {
    const { slug } = useParams()
    const { fetchPublic } = usePortal()
    const [post, setPost] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        async function loadPost() {
            setLoading(true)
            setError(null)
            const data = await fetchPublic(`/posts/${slug}`)
            if (data && !data.error) {
                setPost(data)
            } else {
                setError('Artikel tidak ditemukan.')
            }
            setLoading(false)
        }
        loadPost()
    }, [slug, fetchPublic])

    const formatDate = (dateStr) => {
        if (!dateStr) return ''
        return new Date(dateStr).toLocaleDateString('id-ID', {
            weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
        })
    }

    if (loading) {
        return (
            <div className="portal-page">
                <div className="portal-page-header">
                    <div className="portal-container">
                        <div className="portal-skeleton" style={{ height: '32px', width: '60%', marginBottom: '12px' }} />
                        <div className="portal-skeleton" style={{ height: '16px', width: '30%' }} />
                    </div>
                </div>
                <div className="portal-content">
                    <div className="portal-skeleton" style={{ height: '16px', width: '100%', marginBottom: '12px' }} />
                    <div className="portal-skeleton" style={{ height: '16px', width: '90%', marginBottom: '12px' }} />
                    <div className="portal-skeleton" style={{ height: '16px', width: '80%', marginBottom: '12px' }} />
                </div>
            </div>
        )
    }

    if (error || !post) {
        return (
            <div className="portal-page">
                <div className="portal-page-header">
                    <div className="portal-container">
                        <h1>Artikel Tidak Ditemukan</h1>
                    </div>
                </div>
                <div className="portal-content" style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '4rem', marginBottom: '16px' }}>😔</div>
                    <p>{error || 'Artikel yang Anda cari tidak ada atau sudah dihapus.'}</p>
                    <Link to="/pengumuman" className="portal-btn portal-btn-primary" style={{ marginTop: '16px' }}>
                        ← Kembali ke Pengumuman
                    </Link>
                </div>
            </div>
        )
    }

    return (
        <div className="portal-page">
            <div className="portal-page-header">
                <div className="portal-container">
                    <Link to="/pengumuman" style={{ color: 'rgba(255,255,255,0.6)', textDecoration: 'none', fontSize: '0.9rem', display: 'inline-block', marginBottom: '12px' }}>
                        ← Kembali ke Pengumuman
                    </Link>
                    <h1>{post.title}</h1>
                    <p>
                        <span className="portal-chip" style={{ background: 'rgba(255,255,255,0.1)', color: '#fff' }}>
                            {post.category}
                        </span>
                        {' '}
                        📅 {formatDate(post.published_at || post.created_at)}
                        {post.author_name && ` • ✍️ ${post.author_name}`}
                    </p>
                </div>
            </div>

            <div className="portal-content">
                {post.cover_image && (
                    <img src={post.cover_image} alt={post.title} style={{ width: '100%', borderRadius: 'var(--portal-radius-lg)', marginBottom: '32px' }} />
                )}
                <div dangerouslySetInnerHTML={{ __html: post.content }} />
            </div>
        </div>
    )
}
