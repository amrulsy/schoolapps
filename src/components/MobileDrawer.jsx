import { useState, useEffect } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { filterMenuSections, getRoleDisplay } from '../utils/permissions'
import {
    Users, Building2, Calendar, ClipboardList, Landmark,
    CreditCard, BookOpen, History, Zap,
    UserCog, Settings, Database, Layout, X, LogOut,
    ChevronDown, LayoutDashboard, Search, LayoutTemplate,
    Package, Wallet, ShieldCheck, Globe, MessageCircle, Monitor,
    HandHeart, CalendarOff
} from 'lucide-react'
import Swal from 'sweetalert2'

const drawerSections = [
    {
        label: 'DATA MASTER',
        icon: Package,
        color: 'var(--primary-500)',
        items: [
            { to: '/admin/siswa', icon: Users, text: 'Siswa' },
            { to: '/admin/guru', icon: Users, text: 'Guru' },
            { to: '/admin/unit-kelas', icon: Building2, text: 'Unit & Kelas' },
            { to: '/admin/tahun-ajaran', icon: Calendar, text: 'Tahun Ajaran' },
            { to: '/admin/jadwal', icon: Calendar, text: 'Manajemen Pelajaran' },
            { to: '/admin/kategori-tagihan', icon: ClipboardList, text: 'Kategori Tagihan' },
            { to: '/admin/rekening', icon: Landmark, text: 'Rekening Bank' },
            { to: '/admin/presensi', icon: ClipboardList, text: 'Presensi Siswa' },
            { to: '/admin/bk', icon: ClipboardList, text: 'Bimbingan Konseling' },
            { to: '/admin/akademik', icon: BookOpen, text: 'Nilai Akademik' },
            { to: '/admin/pesan', icon: MessageCircle, text: 'Manajemen Pesan' },
            { to: '/admin/gate-monitor', icon: Monitor, text: 'Gate Monitor' },
        ]
    },
    {
        label: 'KEUANGAN',
        icon: Wallet,
        color: '#10b981',
        items: [
            { to: '/admin/keuangan-dashboard', icon: LayoutDashboard, text: 'Dashboard Keuangan' },
            { to: '/admin/pembayaran', icon: CreditCard, text: 'Pembayaran (POS)' },
            { to: '/admin/riwayat', icon: History, text: 'Riwayat Transaksi' },
            { to: '/admin/generate-tagihan', icon: Zap, text: 'Generate Tagihan' },
            { to: '/admin/kartu-spp', icon: CreditCard, text: 'Kartu SPP' },
            { to: '/admin/arus-kas', icon: BookOpen, text: 'Arus Kas' },
            { to: '/admin/tabungan', icon: Landmark, text: 'Kasir Tabungan' },
            { to: '/admin/infaq', icon: HandHeart, text: 'Infaq Harian' },
            { to: '/admin/infaq-libur', icon: CalendarOff, text: 'Pengaturan Libur' },
        ]
    },
    {
        label: 'SISTEM',
        icon: ShieldCheck,
        color: '#8b5cf6',
        items: [
            { to: '/admin/users', icon: UserCog, text: 'Manajemen User' },
            { to: '/admin/student-menus', icon: LayoutTemplate, text: 'Menu Siswa' },
            { to: '/admin/pengaturan', icon: Settings, text: 'Pengaturan' },
            { to: '/admin/whatsapp', icon: MessageCircle, text: 'WhatsApp Gateway' },
            { to: '/admin/backup', icon: Database, text: 'Backup & Restore' },
        ]
    },
    {
        label: 'KONTEN PORTAL (CMS)',
        icon: Globe,
        color: '#f43f5e',
        items: [
            { to: '/admin/cms/home', icon: Layout, text: 'Konten Halaman Utama' },
            { to: '/admin/cms/ppdb', icon: ClipboardList, text: 'Manajemen PPDB' },
            { to: '/admin/cms/contacts', icon: Users, text: 'Pesan Kontak' },
        ]
    }
]

export default function MobileDrawer({ isOpen, onClose }) {
    const { currentUser, logout, theme } = useApp()
    const location = useLocation()
    const [openSection, setOpenSection] = useState('')
    const [searchTerm, setSearchTerm] = useState('')

    useEffect(() => {
        if (isOpen) {
            const currentSection = drawerSections.find(sec =>
                sec.items.some(item => location.pathname === item.to || location.pathname.startsWith(item.to + '/'))
            )
            if (currentSection) {
                setOpenSection(currentSection.label)
            }
        }
    }, [location.pathname, isOpen])

    // Lock body scroll when drawer is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden'
        } else {
            document.body.style.overflow = ''
        }
        return () => { document.body.style.overflow = '' }
    }, [isOpen])

    const toggleSection = (label) => {
        setOpenSection(prev => prev === label ? '' : label)
    }

    const handleLogout = () => {
        Swal.fire({
            title: 'Yakin ingin keluar?',
            text: "Anda akan diarahkan kembali ke halaman login.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3B82F6',
            cancelButtonColor: '#ef4444',
            confirmButtonText: 'Ya, Keluar!',
            cancelButtonText: 'Batal',
            background: theme === 'dark' ? '#1E293B' : '#FFFFFF',
            color: theme === 'dark' ? '#F1F5F9' : '#1E293B'
        }).then((result) => {
            if (result.isConfirmed) {
                logout()
                onClose()
            }
        })
    }

    // RBAC filtering + search filtering
    const rbacSections = filterMenuSections(currentUser.role, drawerSections)
    const filteredSections = rbacSections.map(section => ({
        ...section,
        items: section.items.filter(item =>
            item.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
            section.label.toLowerCase().includes(searchTerm.toLowerCase())
        )
    })).filter(section => section.items.length > 0)

    return (
        <>
            <div
                className={`drawer-overlay ${isOpen ? 'open' : ''}`}
                onClick={onClose}
            />

            <aside className={`mobile-drawer ${isOpen ? 'open' : ''}`}>
                <div className="drawer-header">
                    <div className="drawer-user">
                        <div className="drawer-avatar">
                            {currentUser.nama.charAt(0)}
                        </div>
                        <div className="drawer-user-info">
                            <div className="drawer-user-name">{currentUser.nama}</div>
                            <div className="drawer-user-role">
                                {getRoleDisplay(currentUser.role)}
                            </div>
                        </div>
                    </div>
                    <button className="drawer-close" onClick={onClose} type="button">
                        <X size={20} />
                    </button>
                </div>

                <div className="drawer-search">
                    <Search size={18} />
                    <input
                        type="text"
                        placeholder="Cari menu..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <nav className="drawer-nav">
                    <NavLink
                        to="/admin"
                        end
                        className={({ isActive }) => `drawer-menu-item ${isActive ? 'active' : ''}`}
                        onClick={onClose}
                    >
                        <LayoutDashboard size={20} />
                        <span>Dashboard</span>
                    </NavLink>

                    {filteredSections.map(section => {
                        const isExpanded = openSection === section.label || searchTerm !== '';
                        return (
                            <div key={section.label} className={`drawer-section ${isExpanded ? 'is-open' : ''}`} style={{ '--cat-color': section.color }}>
                                <div
                                    className="drawer-section-label d-flex justify-content-between align-items-center"
                                    onClick={() => toggleSection(section.label)}
                                >
                                    <div className="label-content">
                                        {section.icon && <section.icon size={16} className="cat-icon" />}
                                        <span>{section.label}</span>
                                    </div>
                                    <ChevronDown size={14} className="category-arrow" />
                                </div>
                                <div className="drawer-items-container">
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
                            </div>
                        )
                    })}
                </nav>

                <div className="drawer-footer">
                    <button className="drawer-logout" onClick={handleLogout} type="button">
                        <LogOut size={18} />
                        <span>Keluar App</span>
                    </button>
                </div>
            </aside>
        </>
    )
}
