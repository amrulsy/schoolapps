import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Home, Megaphone, Info, GraduationCap, Receipt, Phone } from 'lucide-react'

const NAV_LINKS = [
    { to: '/portal', label: 'Beranda', icon: <Home size={20} />, exact: true },
    { to: '/portal/pengumuman', label: 'Pengumuman', icon: <Megaphone size={20} /> },
    { to: '/portal/informasi', label: 'Informasi', icon: <Info size={20} /> },
    { to: '/portal/ppdb', label: 'PPDB', icon: <GraduationCap size={20} /> },
    { to: '/portal/cek-tagihan', label: 'Cek Tagihan', icon: <Receipt size={20} /> },
    { to: '/portal/kontak', label: 'Kontak', icon: <Phone size={20} /> },
]

export default function PortalNavbar({ mobileOpen, setMobileOpen }) {
    const [scrolled, setScrolled] = useState(false)
    const location = useLocation()
    const isHome = location.pathname === '/portal'

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 50)
        window.addEventListener('scroll', handleScroll)
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    useEffect(() => {
        setMobileOpen(false)
    }, [location])

    const isActive = (link) => {
        if (link.exact) return location.pathname === link.to
        return location.pathname.startsWith(link.to)
    }

    const navClass = `portal-navbar ${isHome && !scrolled ? 'transparent' : 'scrolled'}`

    return (
        <>
            <nav className={navClass}>
                <div className="portal-navbar-inner">
                    <Link to="/portal" className="portal-navbar-logo">
                        <div className="portal-navbar-logo-icon">S</div>
                        <span className="portal-navbar-logo-text">SMK PPRQ</span>
                    </Link>

                    <ul className="portal-navbar-links">
                        {NAV_LINKS.map(link => (
                            <li key={link.to}>
                                <Link
                                    to={link.to}
                                    className={isActive(link) ? 'active' : ''}
                                >
                                    {link.label}
                                </Link>
                            </li>
                        ))}
                    </ul>

                    <button
                        className={`portal-hamburger ${mobileOpen ? 'open' : ''}`}
                        onClick={() => setMobileOpen(!mobileOpen)}
                        aria-label="Menu"
                    >
                        <span /><span /><span />
                    </button>
                </div>
            </nav>

            <div className={`portal-mobile-menu ${mobileOpen ? 'open' : ''}`}>
                <div className="mobile-menu-grid">
                    {NAV_LINKS.map(link => (
                        <Link
                            key={link.to}
                            to={link.to}
                            className={`mobile-menu-card ${isActive(link) ? 'active' : ''}`}
                        >
                            <div className="mobile-menu-icon">{link.icon}</div>
                            <span className="mobile-menu-label">{link.label}</span>
                        </Link>
                    ))}
                </div>
            </div>
        </>
    )
}
