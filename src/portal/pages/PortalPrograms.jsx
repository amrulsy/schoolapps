import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { usePortal } from '../context/PortalContext'
import {
    ArrowRight, GraduationCap, Users, Trophy, Briefcase,
     Star, Target, BookOpen, CheckCircle, Layers
} from 'lucide-react'
import { getDirectDriveUrl } from '../../utils/urlHelper'
import '../styles/portal-programs.css'

export default function PortalPrograms() {
    const { fetchPublic } = usePortal()
    const [programs, setPrograms] = useState([])
    const [stats, setStats] = useState(null)
    const [settings, setSettings] = useState({})
    const [loading, setLoading] = useState(true)
    const [hoveredCard, setHoveredCard] = useState(null)

    useEffect(() => {
        async function loadData() {
            setLoading(true)
            const [programsData, statsData, settingsData] = await Promise.all([
                fetchPublic('/programs'),
                fetchPublic('/stats'),
                fetchPublic('/settings')
            ])
            if (programsData) setPrograms(programsData)
            if (statsData) setStats(statsData)
            if (settingsData) setSettings(settingsData)
            setLoading(false)
        }
        loadData()
    }, [fetchPublic])

    const activePrograms = programs.filter(p => p.is_active)

    if (loading) {
        return (
            <div className="portal-page programs-page">
                <div className="programs-hero-skeleton">
                    <div className="portal-skeleton" style={{ height: 48, width: 300, margin: '0 auto', borderRadius: 12 }} />
                    <div className="portal-skeleton" style={{ height: 20, width: 500, margin: '16px auto 0', borderRadius: 8 }} />
                </div>
                <div className="portal-container" style={{ paddingTop: 60 }}>
                    <div className="programs-grid">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="portal-skeleton" style={{ height: 380, borderRadius: 24 }} />
                        ))}
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="portal-page programs-page">
            <Helmet>
                <title>Program Keahlian | SMK PPRQ</title>
                <meta name="description" content="Jelajahi program keahlian unggulan SMK PPRQ — siap kerja, siap industri, siap masa depan." />
            </Helmet>

            {/* ====== HERO SECTION ====== */}
            <section className="programs-hero">
                <div className="programs-hero-bg">
                    <div className="programs-hero-orb orb-1" />
                    <div className="programs-hero-orb orb-2" />
                    <div className="programs-hero-orb orb-3" />
                </div>
                <div className="portal-container programs-hero-content">
                    <div className="programs-hero-badge">
                        <GraduationCap size={16} /> Kompetensi Keahlian
                    </div>
                    <h1 className="programs-hero-title">
                        {settings.programs_section_title || 'Program Keahlian Unggulan'}
                    </h1>
                    <p className="programs-hero-subtitle">
                        {settings.programs_section_subtitle || 'Pilih jurusan terbaik untuk masa depanmu. Setiap program dirancang untuk menyiapkan lulusan yang kompeten dan siap menghadapi era industri 4.0.'}
                    </p>

                    {/* Quick Stats */}
                    <div className="programs-hero-stats">
                        <div className="programs-stat-item">
                            <Layers size={20} />
                            <span className="programs-stat-val">{activePrograms.length}</span>
                            <span className="programs-stat-label">Jurusan</span>
                        </div>
                        <div className="programs-stat-item">
                            <Users size={20} />
                            <span className="programs-stat-val">{stats?.total_students || '0'}</span>
                            <span className="programs-stat-label">Siswa Aktif</span>
                        </div>
                        <div className="programs-stat-item">
                            <Trophy size={20} />
                            <span className="programs-stat-val">90%+</span>
                            <span className="programs-stat-label">Terserap Industri</span>
                        </div>
                        <div className="programs-stat-item">
                            <Briefcase size={20} />
                            <span className="programs-stat-val">{stats?.total_partners || '50+'}</span>
                            <span className="programs-stat-label">Mitra IDUKA</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* ====== PROGRAMS GRID ====== */}
            <section className="programs-listing-section">
                <div className="portal-container">
                    {activePrograms.length === 0 ? (
                        <div className="programs-empty">
                            <GraduationCap size={60} strokeWidth={1} />
                            <h3>Belum Ada Program</h3>
                            <p>Program keahlian sedang dalam proses persiapan.</p>
                        </div>
                    ) : (
                        <div className="programs-grid">
                            {activePrograms.map((program, idx) => {
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
                                        style={{ '--prog-color': themeColor, animationDelay: `${idx * 0.2}s` }}
                                    >
                                        {/* Card Header */}
                                        <div className="program-card-header" style={{ background: `linear-gradient(135deg, ${themeColor} 0%, ${themeColor}dd 100%)` }}>
                                            {/* Subtle background image if banner exists */}
                                            {program.banner_image && (
                                                <img src={getDirectDriveUrl(program.banner_image)} alt="" className="program-card-banner" />
                                            )}
                                            
                                            <div className="program-card-icon-wrap">
                                                {program.icon && !program.icon.includes('/') ? (
                                                    <span className="program-card-emoji">{program.icon}</span>
                                                ) : program.banner_image ? (
                                                    <img src={getDirectDriveUrl(program.banner_image)} alt={program.title} className="program-card-logo-img" />
                                                ) : (
                                                    <span className="program-card-emoji">📚</span>
                                                )}
                                            </div>
                                            <div className="program-card-header-text">
                                                <span className="program-card-label">{settings.programs_section_label || 'KOMPETENSI KEAHLIAN'}</span>
                                                <h3 className="program-card-title">{program.title}</h3>
                                            </div>
                                            {/* Decorative circle */}
                                            <div className="program-card-deco" />
                                        </div>

                                        {/* Card Body */}
                                        <div className="program-card-body">
                                            <p className="program-card-desc">
                                                {program.tagline || program.description || 'Program keahlian unggulan dengan kurikulum berbasis industri.'}
                                            </p>

                                            {/* Features pills */}
                                            {features.length > 0 && (
                                                <div className="program-card-features">
                                                    {features.map((f, i) => (
                                                        <span key={i} className="program-feature-pill" style={{ background: `${themeColor}10`, color: themeColor }}>
                                                            <CheckCircle size={12} /> {f.title}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}

                                            {/* Mini stats row */}
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

                                        {/* Card Footer */}
                                        <div className="program-card-footer">
                                            <span>Lihat Detail Jurusan</span>
                                            <ArrowRight size={18} className="program-card-arrow" />
                                        </div>
                                    </Link>
                                )
                            })}
                        </div>
                    )}
                </div>
            </section>

            {/* ====== WHY CHOOSE US ====== */}
            <section className="programs-why-section">
                <div className="portal-container">
                    <div className="programs-why-content">
                        <div className="programs-why-text">
                            <h2 className="programs-why-title">Mengapa Memilih <span>SMK PPRQ?</span></h2>
                            <p className="programs-why-subtitle">
                                Kami tidak hanya mengajarkan teori, tetapi juga mempersiapkan siswa untuk sukses di dunia nyata.
                            </p>

                            <div className="programs-why-grid">
                                {[
                                    { icon: <Target size={24} />, title: 'Kurikulum Industri', desc: 'Dirancang bersama mitra industri untuk relevansi maksimal' },
                                    { icon: <BookOpen size={24} />, title: 'Praktik 60%', desc: 'Porsi praktik lebih besar dari teori untuk keterampilan nyata' },
                                    { icon: <Star size={24} />, title: 'Sertifikasi Profesi', desc: 'Siswa mendapatkan sertifikasi kompetensi yang diakui industri' },
                                    { icon: <Briefcase size={24} />, title: 'Magang Industri', desc: 'Program magang langsung di perusahaan mitra terpercaya' },
                                ].map((item, idx) => (
                                    <div key={idx} className="programs-why-card">
                                        <div className="programs-why-icon">{item.icon}</div>
                                        <div>
                                            <h4>{item.title}</h4>
                                            <p>{item.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Visual side */}
                        <div className="programs-why-visual">
                            <div className="programs-why-blob" />
                            <div className="programs-why-stat-card">
                                <div className="pwsc-number">3</div>
                                <div className="pwsc-text">Tahun Perjalanan</div>
                                <div className="pwsc-sub">Dari Kelas X hingga Siap Kerja</div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ====== CTA ====== */}
            <section className="programs-cta-section">
                <div className="portal-container">
                    <div className="programs-cta-card">
                        <div className="programs-cta-orb" />
                        <h2>Siap Bergabung?</h2>
                        <p>Pilih jurusan impianmu dan mulai perjalanan menuju karir yang gemilang.</p>
                        <div className="programs-cta-btns">
                            <Link to="/ppdb" className="portal-btn portal-btn-primary portal-btn-lg">
                                Daftar PPDB Sekarang <ArrowRight size={18} />
                            </Link>
                            <Link to="/kontak" className="portal-btn portal-btn-outline portal-btn-lg">
                                Hubungi Kami
                            </Link>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    )
}
