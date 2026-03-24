import React from 'react'
import { useLocation, useNavigate, Link } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { Menu, Bell, Sun, Moon, LogOut, Search } from 'lucide-react'
import Swal from 'sweetalert2'

const pageTitles = {
    'admin': 'Dashboard',
    'siswa': 'Data Siswa',
    'guru': 'Data Guru',
    'unit-kelas': 'Unit & Kelas',
    'tahun-ajaran': 'Tahun Ajaran',
    'jadwal': 'Manajemen Pelajaran',
    'kategori-tagihan': 'Kategori Tagihan',
    'rekening': 'Rekening Bank',
    'presensi': 'Presensi Siswa',
    'bk': 'Bimbingan Konseling',
    'akademik': 'Nilai Akademik',
    'pesan': 'Manajemen Pesan',
    'tagihan': 'Tagihan',
    'riwayat-generate': 'Riwayat Generate',
    'kartu-spp': 'Kartu SPP',
    'pembayaran': 'Pembayaran (POS)',
    'tabungan': 'Kasir Tabungan',
    'riwayat': 'Riwayat Transaksi',
    'arus-kas': 'Arus Kas',
    'laporan': 'Laporan Keuangan',
    'keuangan-dashboard': 'Dashboard Keuangan',
    'users': 'Manajemen User',
    'student-menus': 'Menu Siswa',
    'pengaturan': 'Pengaturan',
    'backup': 'Backup & Restore',
    'cms': 'Portal CMS',
    'home': 'Beranda',
    'ppdb': 'PPDB',
    'contacts': 'Kontak',
}

export default function Header({ isMobile }) {
    const { theme, toggleTheme, setSidebarCollapsed, sidebarCollapsed, logout } = useApp()
    const location = useLocation()
    const navigate = useNavigate()

    // Generate Dynamic Breadcrumbs
    const pathSegments = location.pathname.split('/').filter(Boolean)
    const breadcrumbs = pathSegments.map((segment, index) => {
        const title = pageTitles[segment] || segment.charAt(0).toUpperCase() + segment.slice(1)
        const path = '/' + pathSegments.slice(0, index + 1).join('/')
        const isLast = index === pathSegments.length - 1
        return { title, path, isLast }
    })

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
            }
        })
    }

    return (
        <header className={`header-bar ${isMobile ? 'header-mobile' : ''}`}>
            {!isMobile && (
                <button className="header-toggle" onClick={() => setSidebarCollapsed(!sidebarCollapsed)}>
                    <Menu size={20} />
                </button>
            )}

            <div className="header-breadcrumb">
                {!isMobile && (
                    <>
                        <Link to="/admin" className="breadcrumb-root">SIAS</Link>
                        <span className="breadcrumb-separator">/</span>
                    </>
                )}
                {breadcrumbs.map((bc, i) => (
                    <React.Fragment key={i}>
                        {bc.isLast ? (
                            <span className="breadcrumb-current">{bc.title}</span>
                        ) : (
                            <Link to={bc.path} className="breadcrumb-item">
                                {bc.title}
                            </Link>
                        )}
                        {!bc.isLast && <span className="breadcrumb-separator">/</span>}
                    </React.Fragment>
                ))}
            </div>

            <div className="header-actions">
                {!isMobile && (
                    <button
                        className="quick-search-trigger"
                        onClick={() => window.dispatchEvent(new CustomEvent('open-command-palette'))}
                        title="Quick Find (Ctrl+K)"
                    >
                        <Search size={16} />
                        <span>Quick Find</span>
                        <kbd>⌘K</kbd>
                    </button>
                )}

                <button className="theme-toggle" onClick={toggleTheme} title="Toggle Theme">
                    {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
                    {!isMobile && <span>{theme === 'light' ? 'Dark' : 'Light'}</span>}
                </button>

                <button className="header-btn" title="Notifikasi" style={{ marginRight: '8px' }}>
                    <Bell size={20} />
                    <span className="badge-dot" />
                </button>

                <button className="header-btn" title="Keluar / Logout" onClick={handleLogout} style={{ color: '#ef4444' }}>
                    <LogOut size={20} />
                </button>
            </div>
        </header>
    )
}
