import { useState, useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import Sidebar from '../components/Sidebar'
import Header from '../components/Header'
import Toast from '../components/Toast'
import BottomNav from '../components/BottomNav'
import MobileDrawer from '../components/MobileDrawer'
import LoginPage from '../pages/admin/LoginPage'
import LoadingSpinner from '../components/LoadingSpinner'

const MOBILE_BREAKPOINT = 768

export default function AdminLayout() {
    const { sidebarCollapsed, currentUser, isLoaded, login } = useApp()
    const [isMobile, setIsMobile] = useState(window.innerWidth <= MOBILE_BREAKPOINT)
    const [drawerOpen, setDrawerOpen] = useState(false)

    useEffect(() => {
        const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT}px)`)
        const handler = (e) => {
            setIsMobile(e.matches)
            if (!e.matches) setDrawerOpen(false)
        }
        mql.addEventListener('change', handler)
        return () => mql.removeEventListener('change', handler)
    }, [])

    if (!isLoaded) {
        return <LoadingSpinner fullScreen message="Memverifikasi Sesi Keamanan..." />
    }

    if (!currentUser) {
        return <LoginPage onLogin={(data) => login(data.token, data.user)} />
    }

    const marginLeft = isMobile ? '0' : (sidebarCollapsed ? 'calc(var(--sidebar-collapsed) + 32px)' : 'calc(var(--sidebar-width) + 32px)')

    return (
        <div className={`app-layout ${isMobile ? 'mobile' : ''}`}>
            {!isMobile && <Sidebar />}
            <div className="main-wrapper" style={{ marginLeft }}>
                <Header isMobile={isMobile} />
                <main className="page-content">
                    <Outlet />
                </main>
            </div>
            {isMobile && (
                <>
                    <BottomNav onMorePress={() => setDrawerOpen(true)} />
                    <MobileDrawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} />
                </>
            )}
            <Toast />
        </div>
    )
}
