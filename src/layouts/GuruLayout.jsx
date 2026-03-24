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

                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                        {/* Theme Toggle Button */}
                        <div
                            onClick={toggleTheme}
                            style={{
                                width: 38, height: 38, borderRadius: 12, cursor: 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                background: theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'var(--bg-stripe)',
                                color: theme === 'dark' ? '#fbbf24' : 'var(--text-secondary)'
                            }}
                        >
                            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                        </div>

                        {/* User Profile (Only Desktop) */}
                        <div className="d-none d-md-flex" style={{ alignItems: 'center', gap: '16px', borderRight: '1px solid var(--border-color)', paddingRight: '20px' }}>
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--primary-600)', lineHeight: '1' }}>{currentUser.nama}</div>
                                <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '4px' }}>Guru Pengajar</div>
                            </div>
                            <div className="user-avatar-sm shadow-sm">
                                {currentUser.nama?.charAt(0)}
                            </div>
                        </div>

                        {/* Logout Button */}
                        <button
                            onClick={handleLogout}
                            className="btn-glass-danger border-0 d-flex align-items-center"
                            style={{ gap: '8px', padding: '10px 18px', borderRadius: '14px', fontWeight: 800, fontSize: '0.8125rem' }}
                        >
                            <LogOut size={16} />
                            <span className="d-none d-lg-inline">Logout</span>
                        </button>
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
