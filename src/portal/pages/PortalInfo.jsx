import { useState, useEffect } from 'react'
import { usePortal } from '../context/PortalContext'

export default function PortalInfo() {
    const { fetchPublic } = usePortal()
    const [activePage, setActivePage] = useState('profil')
    const [pageContent, setPageContent] = useState(null)
    const [programs, setPrograms] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadPage(activePage)
        loadPrograms()
    }, [activePage])

    async function loadPrograms() {
        const data = await fetchPublic('/programs')
        if (data && !data.error) setPrograms(data)
    }

    async function loadPage(slug) {
        setLoading(true)
        const settingsData = await fetchPublic('/settings')
        if (settingsData) {
            const keyMap = {
                'profil': 'school_profile_content',
                'visi-misi': 'school_vision_mission_content'
            }
            const settingKey = keyMap[slug]
            setPageContent({
                title: slug === 'profil' ? 'Profil Sekolah' : 'Visi & Misi',
                content: settingsData[settingKey] || '<p className="text-muted">Konten belum diatur di Pengaturan Portal.</p>'
            })
        }
        setLoading(false)
    }

    const tabs = [
        { slug: 'profil', label: '🏫 Profil Sekolah', icon: '🏫' },
        { slug: 'visi-misi', label: '🎯 Visi & Misi', icon: '🎯' },
    ]

    return (
        <div className="portal-page">
            <div className="portal-page-header">
                <div className="portal-container">
                    <h1>📖 Informasi Sekolah</h1>
                    <p>Kenali lebih dekat SMK PPRQ</p>
                </div>
            </div>

            <section className="portal-section">
                <div className="portal-container">
                    {/* Tab navigation */}
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '32px', flexWrap: 'wrap' }}>
                        {tabs.map(tab => (
                            <button
                                key={tab.slug}
                                className={`portal-btn portal-btn-sm ${activePage === tab.slug ? 'portal-btn-primary' : 'portal-btn-outline-dark'}`}
                                onClick={() => setActivePage(tab.slug)}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Content */}
                    {loading ? (
                        <div>
                            <div className="portal-skeleton portal-skeleton-title" style={{ width: '40%' }} />
                            <div className="portal-skeleton portal-skeleton-text" />
                            <div className="portal-skeleton portal-skeleton-text" />
                            <div className="portal-skeleton portal-skeleton-text" style={{ width: '70%' }} />
                        </div>
                    ) : pageContent ? (
                        <div className="portal-card" style={{ padding: '32px' }}>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '20px', color: 'var(--portal-text)' }}>
                                {pageContent.title}
                            </h2>
                            <div
                                className="portal-content"
                                style={{ padding: 0, maxWidth: 'none' }}
                                dangerouslySetInnerHTML={{ __html: pageContent.content }}
                            />
                        </div>
                    ) : (
                        <div className="portal-alert portal-alert-info">
                            ℹ️ Konten halaman ini belum tersedia.
                        </div>
                    )}

                    {/* Program Keahlian static section */}
                    <div style={{ marginTop: '60px' }}>
                        <div className="portal-section-header">
                            <span className="portal-section-label">Program Keahlian</span>
                            <h2 className="portal-section-title">Jurusan yang Tersedia</h2>
                        </div>

                        <div className="portal-grid portal-grid-3">
                            {programs.length > 0 ? (
                                programs.map(p => (
                                    <div key={p.id} className="portal-program-card">
                                        <div className="portal-program-icon">{p.icon}</div>
                                        <h3>{p.title}</h3>
                                        <p>{p.description}</p>
                                    </div>
                                ))
                            ) : (
                                <p style={{ color: 'var(--portal-text-muted)' }}>Belum ada data program keahlian.</p>
                            )}
                        </div>
                    </div>
                </div>
            </section>
        </div>
    )
}
