import { NavLink } from 'react-router-dom'
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
            { to: '/admin/siswa', icon: Users, text: 'Siswa' },
            { to: '/admin/unit-kelas', icon: Building2, text: 'Unit & Kelas' },
            { to: '/admin/tahun-ajaran', icon: Calendar, text: 'Tahun Ajaran' },
            { to: '/admin/kategori-tagihan', icon: ClipboardList, text: 'Kategori Tagihan' },
            { to: '/admin/rekening', icon: Landmark, text: 'Rekening Bank' },
        ]
    },
    {
        label: 'KEUANGAN',
        items: [
            { to: '/admin/tagihan', icon: FileText, text: 'Tagihan' },
            { to: '/admin/riwayat-generate', icon: Zap, text: 'Riwayat Generate' },
            { to: '/admin/kartu-spp', icon: CreditCard, text: 'Kartu SPP' },
            { to: '/admin/pembayaran', icon: CreditCard, text: 'Pembayaran (POS)' },
            { to: '/admin/riwayat', icon: History, text: 'Riwayat Transaksi' },
            { to: '/admin/arus-kas', icon: BookOpen, text: 'Arus Kas' },
        ]
    },
    {
        label: 'LAPORAN',
        items: [
            { to: '/admin/laporan', icon: BarChart3, text: 'Laporan Keuangan' },
        ]
    },
    {
        label: 'SISTEM',
        items: [
            { to: '/admin/users', icon: UserCog, text: 'Manajemen User' },
            { to: '/admin/pengaturan', icon: Settings, text: 'Pengaturan' },
            { to: '/admin/backup', icon: Database, text: 'Backup & Restore' },
        ]
    },
    {
        label: 'KONTEN PORTAL (CMS)',
        items: [
            { to: '/admin/cms/home', icon: Layout, text: 'Konten Halaman Utama' },
            { to: '/admin/cms/banners', icon: FileText, text: 'Banners' },
            { to: '/admin/cms/posts', icon: FileText, text: 'Pengumuman & Berita' },
            { to: '/admin/cms/pages', icon: FileText, text: 'Halaman Statis' },
            { to: '/admin/cms/ppdb', icon: ClipboardList, text: 'Pendaftaran PPDB' },
            { to: '/admin/cms/ppdb-content', icon: ClipboardList, text: 'Konten PPDB' },
            { to: '/admin/cms/settings', icon: Settings, text: 'Pengaturan Portal' },
            { to: '/admin/cms/contacts', icon: Users, text: 'Pesan Kontak' },
        ]
    }
]

export default function Sidebar() {
    const { sidebarCollapsed, setSidebarCollapsed, currentUser } = useApp()

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
                <NavLink to="/admin" end className={({ isActive }) => `menu-item ${isActive ? 'active' : ''}`} title={sidebarCollapsed ? 'Dashboard' : ''}>
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
                                title={sidebarCollapsed ? item.text : ''}
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
