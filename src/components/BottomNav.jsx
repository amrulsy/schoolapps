import { NavLink } from 'react-router-dom'
import { LayoutDashboard, CreditCard, FileText, BarChart3, Menu } from 'lucide-react'

const tabs = [
    { to: '/admin', icon: LayoutDashboard, label: 'Home', end: true },
    { to: '/admin/pembayaran', icon: CreditCard, label: 'Transaksi' },
    { to: '/admin/tagihan', icon: FileText, label: 'Tagihan' },
    { to: '/admin/laporan', icon: BarChart3, label: 'Laporan' },
]

export default function BottomNav({ onMorePress }) {
    return (
        <nav className="bottom-nav">
            {tabs.map(tab => (
                <NavLink
                    key={tab.to}
                    to={tab.to}
                    end={tab.end}
                    className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}
                >
                    <tab.icon size={22} strokeWidth={2} />
                    <span>{tab.label}</span>
                </NavLink>
            ))}
            <button className="bottom-nav-item" onClick={onMorePress} type="button">
                <Menu size={22} strokeWidth={2} />
                <span>Lainnya</span>
            </button>
        </nav>
    )
}
