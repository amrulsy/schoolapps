import { useStudent } from '../StudentApp'
import { useState } from 'react'
import * as LucideIcons from 'lucide-react'
import { 
    Megaphone, Search, Calendar, Tag, Clock, 
    ArrowLeft, Share2, Bookmark, Sparkles, ChevronRight
} from 'lucide-react'

const categoryConfig = {
    umum: { color: '#3B82F6', label: 'Umum', icon: <Megaphone size={14} /> },
    akademik: { color: '#8B5CF6', label: 'Akademik', icon: <LucideIcons.BookOpen size={14} /> },
    kegiatan: { color: '#F59E0B', label: 'Kegiatan', icon: <LucideIcons.Trophy size={14} /> },
}

// Helper to estimate read time
const getReadTime = (content) => {
    const words = content?.split(' ').length || 0
    const minutes = Math.ceil(words / 200) || 1
    return `${minutes} menit baca`
}

export default function PengumumanPage() {
    const { announcements: serverAnnouncements, profile } = useStudent()
    const [search, setSearch] = useState('')
    const [filterCat, setFilterCat] = useState('semua')
    const [selectedAnnouncement, setSelectedAnnouncement] = useState(null)

    // Format announcements
    const allAnnouncements = serverAnnouncements.map(a => ({
        id: `s-${a.id}`,
        title: a.title,
        category: a.category || 'umum',
        date: a.created_at || a.tanggal,
        content: a.content || a.excerpt || ''
    }))

    const filtered = allAnnouncements.filter(a => {
        const matchSearch = a.title.toLowerCase().includes(search.toLowerCase())
        const matchCat = filterCat === 'semua' || a.category === filterCat
        return matchSearch && matchCat
    })

    if (selectedAnnouncement) {
        const a = selectedAnnouncement
        const cat = categoryConfig[a.category] || categoryConfig.umum
        return (
            <div className="stu-detail-drawer">
                <div className="stu-detail-hero" style={{ background: `linear-gradient(rgba(${cat.color === '#3B82F6' ? '59,130,246' : '139,92,246'}, 0.1), transparent)` }}>
                    <button className="stu-detail-close" onClick={() => setSelectedAnnouncement(null)}>
                        <ArrowLeft size={20} />
                    </button>
                    <div style={{ marginTop: '40px' }}>
                        <span className="stu-news-badge" style={{ background: `${cat.color}15`, color: cat.color, width: 'fit-content' }}>
                            {cat.icon} {cat.label}
                        </span>
                    </div>
                </div>
                <div className="stu-detail-body">
                    <div className="stu-news-time" style={{ marginBottom: '12px' }}>
                        <Calendar size={12} /> {new Date(a.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                        <span style={{ margin: '0 8px' }}>•</span>
                        <Clock size={12} /> {getReadTime(a.content)}
                    </div>
                    <h1>{a.title}</h1>
                    <div className="stu-detail-text">{a.content}</div>
                    
                    <div className="stu-action-row" style={{ marginTop: '40px', borderTop: '1px solid var(--stu-border)', paddingTop: '24px', display: 'flex', gap: '12px' }}>
                        <button className="stu-btn-action-sm secondary" style={{ flex: 1, justifyContent: 'center' }}>
                            <Share2 size={16} /> Bagikan
                        </button>
                        <button className="stu-btn-action-sm secondary" style={{ flex: 1, justifyContent: 'center' }}>
                            <Bookmark size={16} /> Simpan
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="stu-page">
            {/* Daily Brief Header */}
            <div className="stu-info-hero stu-fade-up">
                <div className="stu-info-brief">
                    <h3>Halo, {profile?.nama?.split(' ')[0] || 'Siswa'}! 👋</h3>
                    <p>Ada {allAnnouncements.length} informasi terbaru untuk Anda hari ini. Tetap update dan jangan sampai ketinggalan.</p>
                </div>
                <div style={{ marginTop: '16px' }}>
                    <div className="stu-search-bar" style={{ background: 'rgba(0,0,0,0.15)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}>
                        <Search size={18} style={{ opacity: 0.8 }} />
                        <input 
                            placeholder="Cari info..." 
                            value={search} 
                            onChange={e => setSearch(e.target.value)}
                            style={{ color: 'white' }}
                        />
                    </div>
                </div>
            </div>

            {/* Category Navigation */}
            <div className="stu-filter-scroll-container stu-fade-up delay-1">
                <div className="stu-filter-pills" style={{ padding: '4px 0 20px' }}>
                    <button className={`stu-pill ${filterCat === 'semua' ? 'active' : ''}`} onClick={() => setFilterCat('semua')}>Semua</button>
                    {Object.entries(categoryConfig).map(([key, cfg]) => (
                        <button 
                            key={key} 
                            className={`stu-pill ${filterCat === key ? 'active' : ''}`}
                            style={filterCat === key ? { background: cfg.color, color: '#fff', boxShadow: `0 4px 12px ${cfg.color}44` } : {}}
                            onClick={() => setFilterCat(key)}
                        >
                            {cfg.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* News Feed */}
            <div className="stu-news-feed">
                {filtered.length === 0 ? (
                    <div className="stu-empty-mini">Belum ada pengumuman yang sesuai pencarian Anda.</div>
                ) : filtered.map((a, idx) => {
                    const cat = categoryConfig[a.category] || categoryConfig.umum
                    const isUrgent = a.title.toLowerCase().includes('penting') || a.title.toLowerCase().includes('urgent')
                    
                    return (
                        <div 
                            key={a.id} 
                            className={`stu-news-card stu-news-glow-${a.category} stu-fade-up ${idx === 0 && !search ? 'featured' : ''}`}
                            style={{ animationDelay: `${idx * 0.1 + 0.2}s` }}
                            onClick={() => setSelectedAnnouncement(a)}
                        >
                            <div className="stu-news-meta">
                                <span className="stu-news-badge" style={{ background: `${cat.color}15`, color: cat.color }}>
                                    {isUrgent ? <Sparkles size={12} /> : cat.icon} {isUrgent ? 'Penting' : cat.label}
                                </span>
                                <div className="stu-news-time">
                                    <Clock size={12} /> {getReadTime(a.content)}
                                </div>
                            </div>
                            <h4 className="stu-news-title">{a.title}</h4>
                            <p className="stu-news-excerpt">{a.content}</p>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px' }}>
                                <span style={{ fontSize: '0.7rem', color: 'var(--stu-text-muted)', fontWeight: 600 }}>
                                    {new Date(a.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                                </span>
                                <div style={{ color: 'var(--stu-primary)', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', fontWeight: 700 }}>
                                    Baca Selengkapnya <ChevronRight size={14} />
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
