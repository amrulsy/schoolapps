import { NavLink } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import {
    Users, Building2, Calendar, ClipboardList, Landmark,
    FileText, CreditCard, BookOpen, History, Zap,
    UserCog, Settings, Database, Layout, X, LogOut
} from 'lucide-react'

const drawerSections = [
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
            { to: '/admin/riwayat-generate', icon: Zap, text: 'Riwayat Generate' },
            { to: '/admin/kartu-spp', icon: CreditCard, text: 'Kartu SPP' },
            { to: '/admin/riwayat', icon: History, text: 'Riwayat Transaksi' },
            { to: '/admin/arus-kas', icon: BookOpen, text: 'Arus Kas' },
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

export default function MobileDrawer({ isOpen, onClose }) {
    const { currentUser } = useApp()

    const handleLogout = () => {
        localStorage.removeItem('token')
        window.location.reload()
    }

    return (
        <>
            {/* Backdrop overlay */}
            <div
                className={`drawer-overlay ${isOpen ? 'open' : ''}`}
                onClick={onClose}
            />

            {/* Drawer panel */}
            <aside className={`mobile-drawer ${isOpen ? 'open' : ''}`}>
                {/* Header with user info */}
                <div className="drawer-header">
                    <div className="drawer-user">
                        <div className="drawer-avatar">
                            {currentUser.nama.charAt(0)}
                        </div>
                        <div className="drawer-user-info">
                            <div className="drawer-user-name">{currentUser.nama}</div>
                            <div className="drawer-user-role">
                                {currentUser.role === 'admin' ? '🟣 Admin' : '🟢 Kasir'}
                            </div>
                        </div>
                    </div>
                    <button className="drawer-close" onClick={onClose} type="button">
                        <X size={20} />
                    </button>
                </div>

                {/* Menu sections */}
                <nav className="drawer-nav">
                    {drawerSections.map(section => (
                        <div key={section.label} className="drawer-section">
                            <div className="drawer-section-label">{section.label}</div>
                            {section.items.map(item => (
                                <NavLink
                                    key={item.to}
                                    to={item.to}
                                    className={({ isActive }) => `drawer-menu-item ${isActive ? 'active' : ''}`}
                                    onClick={onClose}
                                >
                                    <item.icon size={18} />
                                    <span>{item.text}</span>
                                </NavLink>
                            ))}
                        </div>
                    ))}
                </nav>

                {/* Footer with logout */}
                <div className="drawer-footer">
                    <button className="drawer-logout" onClick={handleLogout} type="button">
                        <LogOut size={18} />
                        <span>Keluar</span>
                    </button>
                </div>
            </aside>
        </>
    )
}
