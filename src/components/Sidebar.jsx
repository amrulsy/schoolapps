import { useState, useEffect } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import {
    LayoutDashboard, Users, Building2, Calendar, ClipboardList, Landmark,
    FileText, CreditCard, BookOpen, BarChart3, UserCog, Settings,
    ChevronLeft, ChevronDown, History, Zap, Layout, Database, LayoutTemplate, Clock
} from 'lucide-react'

const menuSections = [
    {
        label: 'DATA MASTER',
        items: [
            { to: '/admin/siswa', icon: Users, text: 'Siswa' },
            { to: '/admin/guru', icon: Users, text: 'Guru' },
            { to: '/admin/unit-kelas', icon: Building2, text: 'Unit & Kelas' },
            { to: '/admin/tahun-ajaran', icon: Calendar, text: 'Tahun Ajaran' },
            { to: '/admin/waktu-pelajaran', icon: Clock, text: 'Waktu Pelajaran' },
            { to: '/admin/jadwal', icon: Calendar, text: 'Jadwal Pelajaran' },
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
        items: [
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
        items: [
            { to: '/admin/laporan', icon: BarChart3, text: 'Laporan Keuangan' },
        ]
    },
    {
        label: 'SISTEM',
        items: [
            { to: '/admin/users', icon: UserCog, text: 'Manajemen User' },
            { to: '/admin/student-menus', icon: LayoutTemplate, text: 'Menu Siswa' },
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
    const location = useLocation()
    const [openSection, setOpenSection] = useState('')

    useEffect(() => {
        const currentSection = menuSections.find(sec =>
            sec.items.some(item => location.pathname === item.to || location.pathname.startsWith(item.to + '/'))
        )
        if (currentSection) {
            setOpenSection(currentSection.label)
        }
    }, [location.pathname])

    const toggleSection = (label) => {
        setOpenSection(prev => prev === label ? '' : label)
    }

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

                {menuSections.map(section => {
                    const isOpen = openSection === section.label || sidebarCollapsed
                    return (
                        <div key={section.label} className="menu-category">
                            <div
                                className="menu-label d-flex justify-content-between align-items-center"
                                onClick={() => !sidebarCollapsed && toggleSection(section.label)}
                                style={{ cursor: sidebarCollapsed ? 'default' : 'pointer', userSelect: 'none' }}
                            >
                                <span>{section.label}</span>
                                {!sidebarCollapsed && (
                                    isOpen ? <ChevronDown size={14} /> : <ChevronLeft size={14} style={{ transform: 'rotate(-90deg)' }} />
                                )}
                            </div>
                            <div className="menu-items-container" style={{ display: isOpen ? 'block' : 'none' }}>
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
                        </div>
                    )
                })}
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
