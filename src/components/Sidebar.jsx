import { NavLink, useLocation } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import {
    LayoutDashboard, Users, Building2, Calendar, ClipboardList, Landmark,
    FileText, CreditCard, BookOpen, BarChart3, UserCog, Settings,
    ChevronLeft, History, Zap, Layout, Database
} from 'lucide-react'

const menuSections = [
    {
        label: 'DATA MASTER',
        items: [
            { to: '/siswa', icon: Users, text: 'Siswa' },
            { to: '/unit-kelas', icon: Building2, text: 'Unit & Kelas' },
            { to: '/tahun-ajaran', icon: Calendar, text: 'Tahun Ajaran' },
            { to: '/kategori-tagihan', icon: ClipboardList, text: 'Kategori Tagihan' },
            { to: '/rekening', icon: Landmark, text: 'Rekening Bank' },
        ]
    },
    {
        label: 'KEUANGAN',
        items: [
            { to: '/tagihan', icon: FileText, text: 'Tagihan' },
            { to: '/riwayat-generate', icon: Zap, text: 'Riwayat Generate' },
            { to: '/kartu-spp', icon: CreditCard, text: 'Kartu SPP' },
            { to: '/pembayaran', icon: CreditCard, text: 'Pembayaran (POS)' },
            { to: '/riwayat', icon: History, text: 'Riwayat Transaksi' },
            { to: '/arus-kas', icon: BookOpen, text: 'Arus Kas' },
        ]
    },
    {
        label: 'LAPORAN',
        items: [
            { to: '/laporan', icon: BarChart3, text: 'Laporan Keuangan' },
        ]
    },
    {
        label: 'SISTEM',
        items: [
            { to: '/users', icon: UserCog, text: 'Manajemen User' },
            { to: '/pengaturan', icon: Settings, text: 'Pengaturan' },
            { to: '/backup', icon: Database, text: 'Backup & Restore' },
        ]
    },
    {
        label: 'KONTEN PORTAL (CMS)',
        items: [
            { to: '/cms/home', icon: Layout, text: 'Konten Halaman Utama' },
            { to: '/cms/banners', icon: FileText, text: 'Banners' },
            { to: '/cms/posts', icon: FileText, text: 'Pengumuman & Berita' },
            { to: '/cms/pages', icon: FileText, text: 'Halaman Statis' },
            { to: '/cms/ppdb', icon: ClipboardList, text: 'Pendaftaran PPDB' },
            { to: '/cms/ppdb-content', icon: ClipboardList, text: 'Konten PPDB' },
            { to: '/cms/settings', icon: Settings, text: 'Pengaturan Portal' },
            { to: '/cms/contacts', icon: Users, text: 'Pesan Kontak' },
        ]
    }
]

export default function Sidebar() {
    const { sidebarCollapsed, setSidebarCollapsed, currentUser } = useApp()
    const location = useLocation()

    return (
        <aside className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
            <div className="sidebar-brand">
                <div className="brand-icon">🏫</div>
                <div className="brand-text">
                    <h2>SIAS</h2>
                    <p>SMK PPRQ</p>
                </div>
            </div>

            <nav className="sidebar-nav">
                <NavLink to="/" className={({ isActive }) => `menu-item ${isActive && location.pathname === '/' ? 'active' : ''}`}>
                    <span className="icon"><LayoutDashboard size={20} /></span>
                    <span>Dashboard</span>
                </NavLink>

                {menuSections.map(section => (
                    <div key={section.label}>
                        <div className="menu-label">{section.label}</div>
                        {section.items.map(item => (
                            <NavLink
                                key={item.to}
                                to={item.to}
                                className={({ isActive }) => `menu-item ${isActive ? 'active' : ''}`}
                            >
                                <span className="icon"><item.icon size={20} /></span>
                                <span>{item.text}</span>
                            </NavLink>
                        ))}
                    </div>
                ))}
            </nav>

            <div className="sidebar-footer">
                <div className="avatar">{currentUser.nama.charAt(0)}</div>
                <div className="user-info">
                    <div className="name">{currentUser.nama}</div>
                    <div className="role">{currentUser.role === 'admin' ? '🟣 Admin' : '🟢 Kasir'}</div>
                </div>
                <button
                    className="btn-icon"
                    onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                    title={sidebarCollapsed ? 'Expand' : 'Collapse'}
                    style={{ color: 'rgba(255,255,255,0.5)' }}
                >
                    <ChevronLeft size={18} style={{ transform: sidebarCollapsed ? 'rotate(180deg)' : 'none', transition: 'transform 0.3s' }} />
                </button>
            </div>
        </aside>
    )
}
