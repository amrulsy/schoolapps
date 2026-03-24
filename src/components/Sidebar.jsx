import { useState, useEffect, useRef } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import {
    LayoutDashboard, Users, Building2, Calendar, ClipboardList, Landmark,
    FileText, CreditCard, BookOpen, BarChart3, UserCog, Settings,
    ChevronLeft, ChevronDown, History, Zap, Layout, Database, LayoutTemplate, Clock,
    Package, Wallet, ShieldCheck, Globe
} from 'lucide-react'

const menuSections = [
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
            { to: '/admin/pesan', icon: BookOpen, text: 'Manajemen Pesan' },
        ]
    },
    {
        label: 'KEUANGAN',
        icon: Wallet,
        color: '#10b981', // green
        items: [
            { to: '/admin/keuangan-dashboard', icon: LayoutDashboard, text: 'Dashboard Keuangan' },
            { to: '/admin/tagihan', icon: FileText, text: 'Tagihan' },
            { to: '/admin/riwayat-generate', icon: Zap, text: 'Riwayat Generate' },
            { to: '/admin/kartu-spp', icon: CreditCard, text: 'Kartu SPP' },
            { to: '/admin/pembayaran', icon: CreditCard, text: 'Pembayaran (POS)' },
            { to: '/admin/tabungan', icon: Landmark, text: 'Kasir Tabungan' },
            { to: '/admin/riwayat', icon: History, text: 'Riwayat Transaksi' },
            { to: '/admin/arus-kas', icon: BookOpen, text: 'Arus Kas' },
        ]
    },
    {
        label: 'LAPORAN',
        icon: BarChart3,
        color: '#f59e0b', // amber
        items: [
            { to: '/admin/laporan', icon: BarChart3, text: 'Laporan Keuangan' },
        ]
    },
    {
        label: 'SISTEM',
        icon: ShieldCheck,
        color: '#8b5cf6', // purple
        items: [
            { to: '/admin/users', icon: UserCog, text: 'Manajemen User' },
            { to: '/admin/student-menus', icon: LayoutTemplate, text: 'Menu Siswa' },
            { to: '/admin/pengaturan', icon: Settings, text: 'Pengaturan' },
            { to: '/admin/backup', icon: Database, text: 'Backup & Restore' },
        ]
    },
    {
        label: 'KONTEN PORTAL (CMS)',
        icon: Globe,
        color: '#f43f5e', // rose
        items: [
            { to: '/admin/cms/home', icon: Layout, text: 'Konten Halaman Utama' },
            { to: '/admin/cms/ppdb', icon: ClipboardList, text: 'Manajemen PPDB' },
            { to: '/admin/cms/contacts', icon: Users, text: 'Pesan Kontak' },
        ]
    }
]

export default function Sidebar() {
    const { sidebarCollapsed, setSidebarCollapsed, currentUser } = useApp()
    const location = useLocation()
    const [searchTerm, setSearchTerm] = useState('')
    const [openSection, setOpenSection] = useState('')
    const activeLinkRef = useRef(null)

    useEffect(() => {
        const currentSection = menuSections.find(sec =>
            sec.items.some(item => location.pathname === item.to || location.pathname.startsWith(item.to + '/'))
        )
        if (currentSection) {
            setOpenSection(currentSection.label)
        }
    }, [location.pathname])

    // Auto-scroll to active link
    useEffect(() => {
        if (activeLinkRef.current) {
            activeLinkRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
        }
    }, [location.pathname])

    const toggleSection = (label) => {
        setOpenSection(prev => prev === label ? '' : label)
    }

    const filteredSections = menuSections.map(section => ({
        ...section,
        items: section.items.filter(item =>
            item.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
            section.label.toLowerCase().includes(searchTerm.toLowerCase())
        )
    })).filter(section => section.items.length > 0)

    return (
        <aside className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
            <div className="sidebar-brand">
                <div className="brand-icon">🏫</div>
                <div className="brand-text">
                    <h2>SIAS</h2>
                    <p>SMK PPRQ</p>
                </div>
            </div>

            {!sidebarCollapsed && (
                <div className="sidebar-search">
                    <input
                        type="text"
                        placeholder="Search menu..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            )}

            <nav className="sidebar-nav">
                <NavLink
                    to="/admin"
                    end
                    className={({ isActive }) => `menu-item ${isActive ? 'active' : ''}`}
                    title={sidebarCollapsed ? 'Dashboard' : ''}
                    ref={location.pathname === '/admin' ? activeLinkRef : null}
                >
                    <span className="icon"><LayoutDashboard size={20} /></span>
                    <span>Dashboard</span>
                </NavLink>

                {filteredSections.map(section => {
                    const isOpen = openSection === section.label || sidebarCollapsed || searchTerm !== ''
                    return (
                        <div key={section.label} className={`menu-category ${isOpen ? 'is-open' : ''}`} style={{ '--cat-color': section.color }}>
                            <div
                                className="menu-label d-flex justify-content-between align-items-center"
                                onClick={() => !sidebarCollapsed && toggleSection(section.label)}
                                style={{ cursor: sidebarCollapsed ? 'default' : 'pointer', userSelect: 'none' }}
                            >
                                <div className="label-content">
                                    {section.icon && <section.icon size={16} className="cat-icon" />}
                                    <span>{section.label}</span>
                                </div>
                                {!sidebarCollapsed && (
                                    <ChevronDown size={12} className="category-arrow" />
                                )}
                            </div>
                            <div className="menu-items-container">
                                {section.items.map(item => (
                                    <NavLink
                                        key={item.to}
                                        to={item.to}
                                        className={({ isActive }) => `menu-item ${isActive ? 'active' : ''}`}
                                        title={sidebarCollapsed ? item.text : ''}
                                        ref={location.pathname === item.to || location.pathname.startsWith(item.to + '/') ? activeLinkRef : null}
                                    >
                                        <span className="icon"><item.icon size={20} /></span>
                                        <span>{item.text}</span>
                                    </NavLink>
                                ))}
                            </div>
                        </div>
                    )
                })}
            </nav>

            <div className="sidebar-footer">
                {!sidebarCollapsed && (
                    <div className="sidebar-hint" onClick={() => window.dispatchEvent(new CustomEvent('open-command-palette'))}>
                        <kbd>Ctrl + K</kbd> to search
                    </div>
                )}
                <div className="avatar">{currentUser.nama.charAt(0)}</div>
                <div className="user-info">
                    <div className="name">{currentUser.nama}</div>
                    <div className="role">{currentUser.role === 'admin' ? '🟣 Admin' : currentUser.role === 'guru' ? '🔵 Guru' : 'Kasir'}</div>
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
