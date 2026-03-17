import { Link, useLocation } from 'react-router-dom'
import { Home, ClipboardList, Receipt, Phone, Menu } from 'lucide-react'

const BOTTOM_NAV_LINKS = [
    { to: '/portal', label: 'Beranda', icon: Home, exact: true },
    { to: '/portal/ppdb', label: 'PPDB', icon: ClipboardList },
    { to: '/portal/cek-tagihan', label: 'Tagihan', icon: Receipt },
    { to: '/portal/kontak', label: 'Kontak', icon: Phone },
]

export default function PortalBottomNav({ onShowMore }) {
    const location = useLocation()

    const isActive = (link) => {
        if (link.exact) return location.pathname === link.to
        return location.pathname.startsWith(link.to)
    }

    return (
        <div className="portal-bottom-nav">
            <div className="portal-bottom-nav-inner">
                {BOTTOM_NAV_LINKS.map(link => (
                    <Link
                        key={link.to}
                        to={link.to}
                        className={`bottom-nav-item ${isActive(link) ? 'active' : ''}`}
                    >
                        <div className="bottom-nav-icon">
                            <link.icon size={22} strokeWidth={isActive(link) ? 2.5 : 2} />
                        </div>
                        <span className="bottom-nav-label">{link.label}</span>
                        {isActive(link) && <div className="bottom-nav-indicator" />}
                    </Link>
                ))}

                <button
                    className="bottom-nav-item"
                    onClick={onShowMore}
                >
                    <div className="bottom-nav-icon">
                        <Menu size={22} />
                    </div>
                    <span className="bottom-nav-label">Lainnya</span>
                </button>
            </div>
        </div>
    )
}
