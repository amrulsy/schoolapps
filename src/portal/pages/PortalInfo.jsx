import { useState, useEffect } from 'react'
import { usePortal } from '../context/PortalContext'

export default function PortalInfo() {
    const { fetchPublic } = usePortal()
    const [activePage, setActivePage] = useState('profil')
    const [pageContent, setPageContent] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadPage(activePage)
    }, [activePage])

    async function loadPage(slug) {
        setLoading(true)
        const data = await fetchPublic(`/pages/${slug}`)
        if (data && !data.error) {
            setPageContent(data)
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
                            <div className="portal-program-card">
                                <div className="portal-program-icon">💻</div>
                                <h3>Teknik Komputer & Jaringan</h3>
                                <p>Menguasai instalasi, konfigurasi, dan troubleshooting jaringan komputer serta administrasi server.</p>
                            </div>
                            <div className="portal-program-card">
                                <div className="portal-program-icon">🏢</div>
                                <h3>Otomatisasi & Tata Kelola Perkantoran</h3>
                                <p>Mempelajari manajemen perkantoran modern, administrasi digital, dan komunikasi bisnis profesional.</p>
                            </div>
                            <div className="portal-program-card">
                                <div className="portal-program-icon">📊</div>
                                <h3>Akuntansi & Keuangan Lembaga</h3>
                                <p>Mendalami siklus akuntansi, perpajakan, dan pengelolaan keuangan menggunakan software MYOB & Zahir.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    )
}
