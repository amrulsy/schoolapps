import { NavLink } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import {
    LayoutDashboard, CreditCard, History, Users, ClipboardList,
    Landmark, HandHeart, Menu
} from 'lucide-react'

/**
 * Role-specific bottom nav tabs.
 * Each role gets 3 quick-access tabs + "Lainnya" drawer.
 */
const roleTabs = {
    admin: [
        { to: '/admin', icon: LayoutDashboard, label: 'Home', end: true },
        { to: '/admin/pembayaran', icon: CreditCard, label: 'Transaksi' },
        { to: '/admin/riwayat', icon: History, label: 'Riwayat' },
    ],
    staf_tu: [
        { to: '/admin', icon: LayoutDashboard, label: 'Home', end: true },
        { to: '/admin/siswa', icon: Users, label: 'Siswa' },
        { to: '/admin/presensi', icon: ClipboardList, label: 'Presensi' },
    ],
    staf_keuangan: [
        { to: '/admin', icon: LayoutDashboard, label: 'Home', end: true },
        { to: '/admin/pembayaran', icon: CreditCard, label: 'Transaksi' },
        { to: '/admin/riwayat', icon: History, label: 'Riwayat' },
    ],
    staf_perbankan: [
        { to: '/admin', icon: LayoutDashboard, label: 'Home', end: true },
        { to: '/admin/tabungan', icon: Landmark, label: 'Tabungan' },
    ],
    staf_infaq: [
        { to: '/admin', icon: LayoutDashboard, label: 'Home', end: true },
        { to: '/admin/infaq', icon: HandHeart, label: 'Infaq' },
    ],
}

export default function BottomNav({ onMorePress }) {
    const { currentUser } = useApp()
    const tabs = roleTabs[currentUser?.role] || roleTabs.admin

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
