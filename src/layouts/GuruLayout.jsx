import React, {  useEffect } from 'react'
import { Outlet, Navigate, Link, useNavigate, useLocation } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { useApp } from '../context/AppContext'
import { LogOut, BookOpen, Sun, Moon, History, FileSpreadsheet, Users, Layout } from 'lucide-react'
import { useUi } from '../context/UiContext'
import CommandPalette from '../components/CommandPalette'
import LoginPage from '../pages/admin/LoginPage'
import LoadingSpinner from '../components/LoadingSpinner'
import api from '../services/api'

import { GuruSessionContext } from './GuruSessionContext'

export default function GuruLayout() {
    const { guruUser, isLoaded, login, logout } = useApp()
    const { theme, toggleTheme } = useUi()
    const navigate = useNavigate()
    const location = useLocation()

    // ALL hooks MUST be declared before any conditional returns (Rules of Hooks)
    const [isWaliKelas, setIsWaliKelas] = React.useState(false)
    const [sessionBadge, setSessionBadge] = React.useState(null)

    React.useEffect(() => {
        if (!guruUser || guruUser.role !== 'guru') return
        const checkWali = async () => {
            try {
                const res = await api.get('/guru/wali-kelas/check')
                setIsWaliKelas(res.data.isWaliKelas)
            } catch (err) { console.error('Gagal mengecek status wali kelas:', err) }
        }
        checkWali()
    }, [guruUser])

    // Ninja Mode Global Shortcuts
    useEffect(() => {
        const handleKeyDown = (e) => {
            // Alt + 1 : Beranda
            if (e.altKey && e.key === '1') {
                e.preventDefault(); navigate('/guru')
            }
            // Alt + 2 : Riwayat
            if (e.altKey && e.key === '2') {
                e.preventDefault(); navigate('/guru/history')
            }
            // Alt + 3 : Rapor
            if (e.altKey && e.key === '3') {
                e.preventDefault(); navigate('/guru/rapor')
            }
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [navigate])

    const handleLogout = () => {
        logout()
        navigate('/guru')
    }

    const isActive = (path) => {
        if (path === '/guru') return location.pathname === '/guru'
        return location.pathname.startsWith(path)
    }

    // --- Conditional returns AFTER all hooks ---

    // Wait for auth verification to complete before deciding
    if (!isLoaded) {
        return <LoadingSpinner fullScreen message="Memverifikasi Sesi Guru..." />
    }

    // No guru logged in — show login page within guru portal
    if (!guruUser) {
        return <LoginPage onLogin={(data) => login(data.token, data.user)} />
    }

    // If the user who logged in is not a guru, redirect to admin
    if (guruUser.role !== 'guru') {
        return <Navigate to="/admin" replace />
    }



    const dockItemStyle = (path) => ({
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        width: '56px',
        height: '56px',
        borderRadius: '16px',
        color: isActive(path) ? 'var(--primary-600)' : 'var(--text-secondary)',
        textDecoration: 'none',
        position: 'relative',
        transition: 'all 0.25s cubic-bezier(0.25, 1, 0.5, 1)'
    })

    return (
        <GuruSessionContext.Provider value={{ sessionBadge, setSessionBadge }}>
        <div className="guru-layout" style={{ minHeight: '100vh', backgroundColor: 'var(--bg-body)', display: 'flex', flexDirection: 'column' }}>
            <Helmet>
                <meta name="robots" content="noindex, nofollow" />
            </Helmet>

            {/* Premium Top Navbar */}
            <header className="sticky-top no-print px-3 px-md-4 py-2 py-md-3" style={{
                background: 'var(--bg-header)',
                backdropFilter: 'blur(12px)',
                borderBottom: '1px solid var(--border-color)',
                zIndex: 1050
            }}>
                <div className="container-fluid max-w-7xl mx-auto d-flex justify-content-between align-items-center p-0">
                    <div className="d-flex align-items-center gap-4">
                        <div className="d-flex align-items-center gap-3">
                            <div className="bg-primary text-white p-2 rounded-xl d-flex align-items-center justify-content-center shadow-sm" style={{ width: '42px', height: '42px' }}>
                                <BookOpen size={22} />
                            </div>
                            <div className="d-none d-lg-block">
                                <h5 className="m-0 fw-black text-primary tracking-tight">Portal Guru</h5>
                                <div className="d-flex align-items-center gap-2">
                                    <span className="text-muted" style={{ fontSize: '0.75rem', fontWeight: 600 }}>SMK PPRQ</span>
                                </div>
                            </div>
                        </div>


                    </div>

                    {/* Live Session Badge */}
                    {sessionBadge && (
                        <div className="d-none d-sm-flex" style={{
                            alignItems: 'center', gap: 6,
                            padding: '6px 14px', borderRadius: 100,
                            background: sessionBadge.type === 'running' ? 'rgba(16,185,129,0.1)' : sessionBadge.type === 'remaining' ? 'rgba(251,191,36,0.1)' : 'rgba(16,185,129,0.1)',
                            color: sessionBadge.type === 'running' ? 'var(--success-600)' : sessionBadge.type === 'remaining' ? '#b45309' : 'var(--success-600)',
                            border: `1px solid ${sessionBadge.type === 'running' ? 'var(--success-200)' : sessionBadge.type === 'remaining' ? 'rgba(251,191,36,0.3)' : 'var(--success-200)'}`,
                            fontSize: '0.72rem', fontWeight: 800, whiteSpace: 'nowrap'
                        }}>
                            <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'currentColor', animation: sessionBadge.type === 'running' ? 'pulse-dot 1.5s infinite' : 'none' }} />
                            {sessionBadge.label}
                        </div>
                    )}

                    {/* Right Section: Theme + Profile + Logout */}
                    <div className="d-flex align-items-center gap-2 gap-md-4">
                        {/* Theme Toggle Wrapper */}
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                            <div
                                onClick={toggleTheme}
                                className="shadow-sm"
                                style={{
                                    width: 38, height: 38, borderRadius: 12, cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    background: theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'var(--bg-stripe)',
                                    color: theme === 'dark' ? '#fbbf24' : 'var(--text-secondary)',
                                    border: '1px solid var(--border-color)'
                                }}
                            >
                                {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                            </div>
                        </div>

                        {/* User Profile Wrapper (Desktop Only) */}
                        <div className="d-none d-md-flex" style={{ display: 'flex', alignItems: 'center', gap: '16px', paddingRight: '24px', position: 'relative' }}>
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: '0.875rem', fontWeight: 800, color: 'var(--primary-600)', lineHeight: '1.2' }}>{guruUser.nama}</div>
                                <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '2px' }}>Guru Pengajar</div>
                            </div>
                            <div className="user-avatar-sm shadow-sm" style={{ flexShrink: 0 }}>
                                {guruUser.nama?.charAt(0)}
                            </div>
                            {/* Vertical Separator */}
                            <div style={{ position: 'absolute', right: 0, height: '32px', width: '1px', background: 'var(--border-color)', top: '50%', transform: 'translateY(-50%)' }}></div>
                        </div>

                        {/* Logout Button */}
                        <button
                            onClick={handleLogout}
                            className="btn-glass-danger border-0"
                            style={{
                                display: 'flex', alignItems: 'center', gap: '8px',
                                padding: '10px 20px', borderRadius: '14px',
                                fontWeight: 810, fontSize: '0.8125rem'
                            }}
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
                    @media (max-width: 767px) {
                        .guru-layout header { padding: 12px 16px !important; }
                        .guru-layout header .container-fluid { gap: 12px; }
                        .guru-layout header h5 { font-size: 0.9rem; }
                        .guru-layout header .d-flex[style*="gap: '24px'"],
                        .guru-layout header > .container-fluid > .d-flex:last-child { gap: 10px !important; }
                        .guru-layout main .container-fluid { padding-left: 12px !important; padding-right: 12px !important; }
                    }
                    @keyframes pulse-dot { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(1.3)} }

                    @keyframes pulse-dot { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(1.3)} }

                    /* macOS Floating Dock Styling */
                    .mac-floating-dock {
                        position: fixed;
                        bottom: 24px;
                        left: 50%;
                        transform: translateX(-50%);
                        display: flex;
                        align-items: center;
                        gap: 8px;
                        padding: 10px 16px;
                        background: rgba(255, 255, 255, 0.45);
                        backdrop-filter: blur(24px);
                        -webkit-backdrop-filter: blur(24px);
                        border: 1px solid rgba(255, 255, 255, 0.6);
                        border-radius: 32px;
                        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1), inset 0 0 0 1px rgba(255, 255, 255, 0.3);
                        z-index: 1050;
                        transition: all 0.3s cubic-bezier(0.25, 1, 0.5, 1);
                    }
                    [data-bs-theme="dark"] .mac-floating-dock {
                        background: rgba(30, 41, 59, 0.65);
                        border: 1px solid rgba(255, 255, 255, 0.1);
                        box-shadow: 0 10px 40px rgba(0,0,0,0.4), inset 0 0 0 1px rgba(255, 255, 255, 0.05);
                    }
                    .dock-item:hover {
                        color: var(--primary-600) !important;
                        transform: translateY(-8px) scale(1.15);
                    }
                    .dock-item-active {
                        background: var(--primary-50);
                    }
                    .dock-item-active::after {
                        content: '';
                        position: absolute;
                        bottom: -6px;
                        width: 6px;
                        height: 6px;
                        background: var(--primary-500);
                        border-radius: 50%;
                    }
                    .guru-layout main { padding-bottom: calc(100px + env(safe-area-inset-bottom)) !important; }

                ` }} />
                <div className="container-fluid max-w-7xl mx-auto px-4">
                    <Outlet />
                </div>
            </main>

            {/* macOS Floating Dock */}
            <nav className="mac-floating-dock">
                <Link to="/guru" className={`dock-item ${isActive('/guru') ? 'dock-item-active' : ''}`} style={dockItemStyle('/guru')}>
                    <Layout size={24} />
                    <span style={{ fontSize: '0.65rem', fontWeight: 700, marginTop: '4px' }}>Beranda</span>
                </Link>
                <Link to="/guru/history" className={`dock-item ${isActive('/guru/history') ? 'dock-item-active' : ''}`} style={dockItemStyle('/guru/history')}>
                    <History size={24} />
                    <span style={{ fontSize: '0.65rem', fontWeight: 700, marginTop: '4px' }}>Riwayat</span>
                </Link>
                <Link to="/guru/rapor" className={`dock-item ${isActive('/guru/rapor') ? 'dock-item-active' : ''}`} style={dockItemStyle('/guru/rapor')}>
                    <FileSpreadsheet size={24} />
                    <span style={{ fontSize: '0.65rem', fontWeight: 700, marginTop: '4px' }}>Rapor</span>
                </Link>
                {isWaliKelas && (
                    <Link to="/guru/wali-kelas" className={`dock-item ${isActive('/guru/wali-kelas') ? 'dock-item-active' : ''}`} style={dockItemStyle('/guru/wali-kelas')}>
                        <Users size={24} />
                        <span style={{ fontSize: '0.65rem', fontWeight: 700, marginTop: '4px' }}>Wali Kelas</span>
                    </Link>
                )}
            </nav>
            <CommandPalette />
        </div>
        </GuruSessionContext.Provider>
    )
}
