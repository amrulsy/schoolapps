import { Outlet, Navigate, Link, useNavigate } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { useApp } from '../context/AppContext'
import { LogOut, BookOpen, Calendar, LayoutDashboard, Sun, Moon } from 'lucide-react'
import { useUi } from '../context/UiContext'

export default function GuruLayout() {
    const { currentUser, logout } = useApp()
    const { theme, toggleTheme } = useUi()
    const navigate = useNavigate()

    if (!currentUser || currentUser.role !== 'guru') {
        return <Navigate to="/admin" replace />
    }

    const handleLogout = () => {
        logout()
        navigate('/admin')
    }

    return (
        <div className="guru-layout" style={{ minHeight: '100vh', backgroundColor: 'var(--bg-body)', display: 'flex', flexDirection: 'column' }}>
            <Helmet>
                <meta name="robots" content="noindex, nofollow" />
            </Helmet>

            {/* Premium Top Navbar */}
            <header className="sticky-top" style={{
                background: 'var(--bg-header)',
                backdropFilter: 'blur(12px)',
                borderBottom: '1px solid var(--border-color)',
                zIndex: 1050,
                padding: '16px 32px'
            }}>
                <div className="container-fluid max-w-7xl mx-auto d-flex justify-content-between align-items-center">
                    <div className="d-flex align-items-center gap-3">
                        <div className="bg-primary text-white p-2 rounded-xl d-flex align-items-center justify-content-center shadow-sm" style={{ width: '42px', height: '42px' }}>
                            <BookOpen size={22} />
                        </div>
                        <div>
                            <h5 className="m-0 fw-black text-primary tracking-tight">Portal Guru</h5>
                            <div className="d-flex align-items-center gap-2">
                                <span className="text-muted" style={{ fontSize: '0.75rem', fontWeight: 600 }}>SMK PPRQ</span>
                                <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'var(--primary-300)' }}></div>
                                <span className="text-primary" style={{ fontSize: '0.75rem', fontWeight: 700 }}>Academic Center</span>
                            </div>
                        </div>
                    </div>

                    <div className="d-flex align-items-center gap-2">
                        {/* Theme Toggle Button */}
                        <button
                            onClick={toggleTheme}
                            className="btn-glass-sidebar p-2 rounded-xl border-0 shadow-sm"
                            style={{
                                width: '40px', height: '40px',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                background: theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                                color: theme === 'dark' ? '#fbbf24' : '#64748b'
                            }}
                            title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
                        >
                            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                        </button>

                        <div className="d-flex align-items-center gap-4 ms-2">
                            <div className="d-none d-md-flex align-items-center gap-3 pe-3 border-end border-light">
                                <div className="text-end">
                                    <div className="fw-bold text-primary lh-1 mb-1">{currentUser.nama}</div>
                                    <div className="text-primary fw-bold" style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em', opacity: 0.8 }}>Guru Pengajar</div>
                                </div>
                                <div className="user-avatar-sm">
                                    {currentUser.nama?.charAt(0)}
                                </div>
                            </div>
                            <button
                                onClick={handleLogout}
                                className="btn-glass-danger d-flex align-items-center gap-2 px-3 py-2 rounded-xl border-0"
                                title="Keluar Aplikasi"
                            >
                                <LogOut size={18} />
                                <span className="d-none d-md-inline fw-bold">Logout</span>
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content Area */}
            <main className="flex-grow-1 py-4">
                <style dangerouslySetInnerHTML={{
                    __html: `
                    .user-avatar-sm {
                        width: 38px; height: 38px; border-radius: 12px;
                        background: var(--brand-primary-light); color: var(--brand-primary);
                        display: flex; align-items: center; justify-content: center;
                        font-weight: 800; font-size: 0.9rem; border: 1px solid var(--brand-primary-light);
                    }
                    .btn-glass-danger {
                        background: var(--danger-50); color: var(--danger-500); transition: all 0.2s;
                    }
                    [data-theme="dark"] .btn-glass-danger {
                        background: rgba(239, 68, 68, 0.1); color: #f87171;
                    }
                    .btn-glass-danger:hover {
                        background: var(--danger-500); color: #fff; transform: translateY(-1px);
                        box-shadow: 0 4px 12px rgba(239, 68, 68, 0.2);
                    }
                    .max-w-7xl { max-width: 1280px; }
                ` }} />
                <div className="container-fluid max-w-7xl mx-auto px-4">
                    <Outlet />
                </div>
            </main>
        </div>
    )
}
