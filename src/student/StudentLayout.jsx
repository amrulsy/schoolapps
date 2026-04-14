import { Outlet, NavLink, useLocation } from 'react-router-dom'
import { Home, GraduationCap, Wallet, MessageCircle, User, Bell, Sun, Sunrise, Sunset, Moon,  X, Info } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useStudent } from './StudentApp'

const tabs = [
    { to: '/siswa-portal', icon: Home, label: 'Beranda', end: true },
    { to: '/siswa-portal/nilai', icon: GraduationCap, label: 'Akademik' },
    { to: '/siswa-portal/keuangan', icon: Wallet, label: 'Keuangan' },
    { to: '/siswa-portal/pengumuman', icon: MessageCircle, label: 'Info' },
    { to: '/siswa-portal/profil', icon: User, label: 'Profil' },
]

export default function StudentLayout() {
    const { student, announcements, stuTheme, unreadNotifs } = useStudent()
    const [showNotifs, setShowNotifs] = useState(false)
    const [greeting, setGreeting] = useState({ text: 'Halo', icon: Sun })
    const location = useLocation()

    // Calculate active index for the sliding pill
    const activeIndex = tabs.findIndex(tab => 
        tab.end ? location.pathname === tab.to : location.pathname.startsWith(tab.to)
    )

    useEffect(() => {
        const hour = new Date().getHours()
        if (hour < 10) setGreeting({ text: 'Selamat Pagi', icon: Sunrise })
        else if (hour < 15) setGreeting({ text: 'Selamat Siang', icon: Sun })
        else if (hour < 18) setGreeting({ text: 'Selamat Sore', icon: Sunset })
        else setGreeting({ text: 'Selamat Malam', icon: Moon })
    }, [])

    return (
        <div className={`stu-app mobile-app-container theme-${stuTheme}`}>
            {/* Status Bar */}
            <header className="stu-status-bar">
                <div className="stu-status-left">
                    <div className="stu-avatar-sm">
                        {student?.nama?.charAt(0) || 'S'}
                    </div>
                    <div>
                        <div className="stu-greeting">{greeting.text}, {student?.nama?.split(' ')[0]} <greeting.icon size={16} className="stu-greet-icon" /></div>
                        <div className="stu-class-badge">{student?.kelas || 'Siswa'}</div>
                    </div>
                </div>
                <button className="stu-bell-btn" onClick={() => setShowNotifs(true)}>
                    <Bell size={20} strokeWidth={2} />
                    {unreadNotifs > 0 && <span className="stu-bell-badge">{unreadNotifs}</span>}
                </button>
            </header>

            {/* Notification Modal */}
            {showNotifs && (
                <div className="stu-qr-modal" onClick={() => setShowNotifs(false)}> {/* Reusing qr-modal class for overlay */}
                    <div className="stu-qr-content" onClick={e => e.stopPropagation()} style={{ maxHeight: '80vh', overflowY: 'auto' }}>
                        <button className="stu-qr-close" onClick={() => setShowNotifs(false)}>
                            <X size={24} />
                        </button>
                        <h3>Notifikasi</h3>
                        <div className="stu-notif-list" style={{ marginTop: '20px' }}>
                            {announcements.length > 0 ? announcements.map((a, i) => (
                                <div key={i} className="stu-notif-item" style={{ padding: '12px 0', borderBottom: '1px solid var(--stu-border)' }}>
                                    <div style={{ display: 'flex', gap: '12px' }}>
                                        <div style={{ background: 'var(--stu-primary-light)', padding: '8px', borderRadius: '50%', color: 'white' }}>
                                            <Info size={18} />
                                        </div>
                                        <div>
                                            <strong style={{ display: 'block', fontSize: '0.9rem' }}>{a.title}</strong>
                                            <span style={{ fontSize: '0.75rem', color: 'var(--stu-text-sec)' }}>
                                                {new Date(a.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )) : (
                                <div style={{ textAlign: 'center', padding: '40px' }}>Belum ada notifikasi</div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Main Content */}
            <main className="stu-main">
                <Outlet />
            </main>

            {/* Floating Island Navigation */}
            <nav className="stu-nav-island" style={{ '--active-index': activeIndex }}>
                <div className="stu-nav-bg-pill" />
                {tabs.map((tab) => {
                    const Icon = tab.icon
                    return (
                        <NavLink
                            key={tab.to}
                            to={tab.to}
                            end={tab.end}
                            className={({ isActive }) => `stu-nav-item ${isActive ? 'active' : ''}`}
                        >
                            {({ isActive }) => (
                                <>
                                    <Icon size={22} strokeWidth={isActive ? 2.5 : 1.8} />
                                    <span>{tab.label}</span>
                                </>
                            )}
                        </NavLink>
                    )
                })}
            </nav>
        </div>
    )
}
