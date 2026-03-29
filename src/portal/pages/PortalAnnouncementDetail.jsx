import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { Calendar, User, Tag, ArrowLeft, AlertCircle, Share2, Facebook, Twitter, Link as LinkIcon, Check, Eye, ChevronLeft, ChevronRight } from 'lucide-react'
import { usePortal } from '../context/PortalContext'
import { getDirectDriveUrl } from '../../utils/urlHelper'

export default function PortalAnnouncementDetail() {
    const { slug } = useParams()
    const { fetchPublic, postPublic } = usePortal()
    const [post, setPost] = useState(null)
    const [relatedPosts, setRelatedPosts] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [scrollProgress, setScrollProgress] = useState(0)
    const [copySuccess, setCopySuccess] = useState(false)

    // Scroll Progress Tracker
    useEffect(() => {
        const handleScroll = () => {
            const scrollTop = document.documentElement.scrollTop || document.body.scrollTop
            const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight
            const progress = (scrollTop / scrollHeight) * 100
            setScrollProgress(progress)
        }
        window.addEventListener('scroll', handleScroll)
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    useEffect(() => {
        // Scroll to top automatically when component unmounts/mounts with new slug
        window.scrollTo(0, 0)
        
        async function loadPost() {
            setLoading(true)
            setError(null)
            const data = await fetchPublic(`/posts/${slug}`)
            
            if (data && !data.error) {
                setPost(data)
                
                // Track view count implicitly bypassing cache context if needed
                postPublic(`/posts/${slug}/view`, {})

                // Fetch related posts (limit 4 so we can filter out the current one and keep 3)
                const relatedParams = `?limit=4${data.category ? `&category=${data.category}` : ''}`
                const relatedData = await fetchPublic(`/posts${relatedParams}`)
                if (relatedData && relatedData.data) {
                    const filtered = relatedData.data.filter(p => p.id !== data.id).slice(0, 3)
                    setRelatedPosts(filtered)
                }
            } else {
                setError('Artikel tidak ditemukan.')
            }
            setLoading(false)
        }
        loadPost()
    }, [slug, fetchPublic, postPublic])

    const formatDate = (dateStr) => {
        if (!dateStr) return ''
        return new Date(dateStr).toLocaleDateString('id-ID', {
            weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
        })
    }

    const handleCopyLink = () => {
        navigator.clipboard.writeText(window.location.href)
        setCopySuccess(true)
        setTimeout(() => setCopySuccess(false), 2000)
    }

    if (loading) {
        return (
            <div className="portal-page">
                {/* Skeleton Hero */}
                <div className="portal-article-hero">
                    <div className="portal-article-hero-content">
                        <div className="portal-skeleton-pulse animate-fade-in-up" style={{ height: '36px', width: '200px', margin: '0 auto 24px', borderRadius: '30px' }} />
                        <div className="portal-skeleton-pulse animate-fade-in-up delay-100" style={{ height: '48px', width: '80%', margin: '0 auto 24px' }} />
                        <div className="portal-skeleton-pulse animate-fade-in-up delay-200" style={{ height: '24px', width: '50%', margin: '0 auto' }} />
                    </div>
                </div>
                {/* Skeleton Content */}
                <div className="portal-article-body-wrapper animate-fade-in-up delay-300">
                    <div className="portal-skeleton-pulse" style={{ height: '20px', width: '100%', marginBottom: '16px' }} />
                    <div className="portal-skeleton-pulse" style={{ height: '20px', width: '100%', marginBottom: '16px' }} />
                    <div className="portal-skeleton-pulse" style={{ height: '20px', width: '90%', marginBottom: '32px' }} />
                    <div className="portal-skeleton-pulse" style={{ height: '20px', width: '100%', marginBottom: '16px' }} />
                    <div className="portal-skeleton-pulse" style={{ height: '20px', width: '85%' }} />
                </div>
            </div>
        )
    }

    if (error || !post) {
        return (
            <div className="portal-page">
                <div className="portal-article-hero">
                    <div className="portal-article-hero-content animate-fade-in-up">
                        <AlertCircle size={64} color="rgba(255,255,255,0.8)" style={{ margin: '0 auto 24px' }} />
                        <h1 className="portal-article-title">Artikel Tidak Ditemukan</h1>
                        <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '1.1rem', marginBottom: '32px' }}>
                            {error || 'Artikel yang Anda cari tidak ada atau sudah dihapus.'}
                        </p>
                        <Link to="/pengumuman" className="portal-btn portal-btn-primary">
                            <ArrowLeft size={18} /> Kembali ke Pengumuman
                        </Link>
                    </div>
                </div>
            </div>
        )
    }

    const hasImage = !!post.cover_image;
    const shareUrl = encodeURIComponent(window.location.href);
    const shareText = encodeURIComponent(post.title);

    return (
        <div className="portal-page relative">
            <Helmet>
                <title>{post.title} | Portal SMK PPRQ</title>
                <meta name="description" content={post.excerpt ? post.excerpt : post.title} />
                {hasImage && <meta property="og:image" content={getDirectDriveUrl(post.cover_image)} />}
            </Helmet>

            {/* Reading Progress Bar */}
            <div className="portal-reading-progress-container">
                <div className="portal-reading-progress-bar" style={{ width: `${scrollProgress}%` }}></div>
            </div>

            {/* Premium Hero Section */}
            <div className={`portal-article-hero ${hasImage ? 'has-image' : ''}`}>
                {hasImage && (
                    <>
                        <img 
                            src={getDirectDriveUrl(post.cover_image)} 
                            alt={post.title} 
                            className="portal-article-hero-bg" 
                        />
                        <div className="portal-article-hero-gradient" />
                    </>
                )}
                
                <div className="portal-article-hero-content">
                    <Link to="/pengumuman" className="portal-article-back-link animate-fade-in-up">
                        <ArrowLeft size={16} /> 
                        Kembali
                    </Link>
                    
                    <h1 className="portal-article-title animate-fade-in-up delay-100">
                        {post.title}
                    </h1>
                    
                    <div className="portal-article-meta animate-fade-in-up delay-200">
                        <span className="portal-category-chip">
                            <Tag size={12} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
                            {post.category}
                        </span>
                        
                        <div className="portal-article-meta-item">
                            <Calendar size={16} />
                            {formatDate(post.published_at || post.created_at)}
                        </div>
                        
                        {post.author_name && (
                            <div className="portal-article-meta-item">
                                <User size={16} />
                                {post.author_name}
                            </div>
                        )}
                        
                        {post.views !== undefined && (
                            <div className="portal-article-meta-item" title="Jumlah Dilihat">
                                <Eye size={16} />
                                {post.views}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Article Content Wrapper */}
            <div className="portal-article-body-wrapper animate-fade-in-up delay-300">
                <div 
                    className="portal-article-html"
                    dangerouslySetInnerHTML={{ __html: post.content }} 
                />

                {/* Share Section (Footer of Article) */}
                <div className="portal-article-footer">
                    <div className="portal-share-label">
                        <Share2 size={18} style={{ display: 'inline', marginRight: '8px', verticalAlign: 'middle' }} /> 
                        Bagikan Artikel Ini:
                    </div>
                    <div className="portal-share-container">
                        <a href={`https://wa.me/?text=${shareText}%20-%20${shareUrl}`} target="_blank" rel="noopener noreferrer" className="portal-share-btn wa" title="Share ke WhatsApp">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
                        </a>
                        <a href={`https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`} target="_blank" rel="noopener noreferrer" className="portal-share-btn fb" title="Share ke Facebook">
                            <Facebook size={18} />
                        </a>
                        <a href={`https://twitter.com/intent/tweet?text=${shareText}&url=${shareUrl}`} target="_blank" rel="noopener noreferrer" className="portal-share-btn tw" title="Share ke Twitter">
                            <Twitter size={18} />
                        </a>
                        <button onClick={handleCopyLink} className="portal-share-btn copy" title="Salin Tautan">
                            {copySuccess ? <Check size={18} /> : <LinkIcon size={18} />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Next/Prev Navigation */}
            {(post.prev_post || post.next_post) && (
                <div className="portal-article-navigation animate-fade-in-up delay-300">
                    {post.prev_post ? (
                        <Link to={`/pengumuman/${post.prev_post.slug}`} className="portal-nav-btn prev">
                            <ChevronLeft size={24} />
                            <div>
                                <span>Sebelumnya</span>
                                <h4>{post.prev_post.title}</h4>
                            </div>
                        </Link>
                    ) : <div />}
                    
                    {post.next_post ? (
                        <Link to={`/pengumuman/${post.next_post.slug}`} className="portal-nav-btn next">
                            <div>
                                <span>Selanjutnya</span>
                                <h4>{post.next_post.title}</h4>
                            </div>
                            <ChevronRight size={24} />
                        </Link>
                    ) : <div />}
                </div>
            )}

            {/* Related Posts Section */}
            {relatedPosts.length > 0 && (
                <div className="portal-related-posts-section animate-fade-in-up delay-400">
                    <h2 className="portal-related-title">Berita Terbaru Lainnya</h2>
                    <div className="portal-grid portal-grid-3">
                        {relatedPosts.map((relPost, idx) => (
                            <Link key={relPost.id} to={`/pengumuman/${relPost.slug}`} className="stagger-item" style={{ textDecoration: 'none', animationDelay: `${idx * 0.15}s` }}>
                                <div className="portal-card">
                                    {relPost.cover_image ? (
                                        <img src={getDirectDriveUrl(relPost.cover_image)} alt={relPost.title} className="portal-card-image" loading="lazy" />
                                    ) : (
                                        <div className="portal-card-image" style={{
                                            background: 'var(--portal-gradient-soft)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem'
                                        }}>📢</div>
                                    )}
                                    <div className="portal-card-body">
                                        <span className="portal-card-category" style={{ fontSize: '0.65rem' }}>{relPost.category}</span>
                                        <h3 className="portal-card-title" style={{ fontSize: '1rem' }}>{relPost.title}</h3>
                                        <div className="portal-card-meta" style={{ marginTop: '10px', paddingTop: '10px', display: 'flex', justifyContent: 'space-between' }}>
                                            <span>📅 {formatDate(relPost.published_at || relPost.created_at)}</span>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <Eye size={12} /> {relPost.views || 0}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}
