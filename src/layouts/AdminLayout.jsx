import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import Sidebar from '../components/Sidebar'
import Header from '../components/Header'
import Toast from '../components/Toast'
import LoginPage from '../pages/LoginPage'

export default function AdminLayout() {
    const { sidebarCollapsed } = useApp()
    const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('token'))

    const handleLogin = (userData) => {
        if (userData && userData.token) {
            localStorage.setItem('token', userData.token)
            setIsLoggedIn(true)
        }
    }

    if (!isLoggedIn) {
        return <LoginPage onLogin={handleLogin} />
    }

    const marginLeft = sidebarCollapsed ? 'var(--sidebar-collapsed)' : 'var(--sidebar-width)'

    return (
        <div className="app-layout">
            <Sidebar />
            <div className="main-wrapper" style={{ marginLeft }}>
                <Header />
                <main className="page-content">
                    <Outlet />
                </main>
            </div>
            <Toast />
        </div>
    )
}
