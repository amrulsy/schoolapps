import { useLocation } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { Menu, Bell, Sun, Moon, LogOut } from 'lucide-react'

const pageTitles = {
    '/': 'Dashboard',
    '/siswa': 'Data Siswa',
    '/unit-kelas': 'Unit & Kelas',
    '/tahun-ajaran': 'Tahun Ajaran',
    '/kategori-tagihan': 'Kategori Tagihan',
    '/rekening': 'Rekening Bank',
    '/tagihan': 'Tagihan',
    '/pembayaran': 'Pembayaran (POS)',
    '/arus-kas': 'Arus Kas',
    '/laporan': 'Laporan Keuangan',
    '/users': 'Manajemen User',
    '/pengaturan': 'Pengaturan',
}

export default function Header({ isMobile }) {
    const { theme, toggleTheme, setSidebarCollapsed, sidebarCollapsed, logout } = useApp()
    const location = useLocation()
    const pageTitle = pageTitles[location.pathname] || 'Halaman'

    return (
        <header className={`header-bar ${isMobile ? 'header-mobile' : ''}`}>
            {!isMobile && (
                <button className="header-toggle" onClick={() => setSidebarCollapsed(!sidebarCollapsed)}>
                    <Menu size={20} />
                </button>
            )}

            <div className="header-breadcrumb">
                {!isMobile && <><span>SIAS</span><span>/</span></>}
                <strong>{pageTitle}</strong>
            </div>

            <div className="header-actions">
                <button className="theme-toggle" onClick={toggleTheme} title="Toggle Theme">
                    {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
                    {!isMobile && <span>{theme === 'light' ? 'Dark' : 'Light'}</span>}
                </button>

                <button className="header-btn" title="Notifikasi" style={{ marginRight: '8px' }}>
                    <Bell size={20} />
                    <span className="badge-dot" />
                </button>

                <button className="header-btn" title="Keluar / Logout" onClick={logout} style={{ color: '#ef4444' }}>
                    <LogOut size={20} />
                </button>
            </div>
        </header>
    )
}
