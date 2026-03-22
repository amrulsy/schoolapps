import { Outlet, Navigate, Link, useNavigate } from 'react'
import { Helmet } from 'react-helmet-async'
import { useApp } from '../context/AppContext'
import { LogOut, BookOpen, Calendar, LayoutDashboard } from 'lucide-react'

export default function GuruLayout() {
    const { currentUser, logout } = useApp()
    const navigate = useNavigate()

    if (!currentUser || currentUser.role !== 'guru') {
        return <Navigate to="/admin/login" replace />
    }

    const handleLogout = () => {
        logout()
        navigate('/admin/login')
    }

    return (
        <div className="guru-layout" style={{ minHeight: '100vh', backgroundColor: '#f8fafc', display: 'flex', flexDirection: 'column' }}>
            <Helmet>
                <meta name="robots" content="noindex, nofollow" />
            </Helmet>
            {/* Minimalist Top Navbar */}
            <header className="bg-white shadow-sm border-bottom py-3 px-4 d-flex justify-content-between align-items-center sticky-top">
                <div className="d-flex align-items-center gap-3">
                    <div className="bg-primary text-white p-2 rounded-lg d-flex align-items-center justify-content-center">
                        <BookOpen size={24} />
                    </div>
                    <div>
                        <h4 className="m-0 fw-bold text-dark">Portal Guru</h4>
                        <span className="text-muted small">SMK PPRQ</span>
                    </div>
                </div>

                <div className="d-flex align-items-center gap-4">
                    <div className="d-none d-md-flex flex-column align-items-end">
                        <span className="fw-bold text-dark">{currentUser.nama}</span>
                        <span className="badge bg-primary bg-opacity-10 text-primary">Guru Pengajar</span>
                    </div>
                    <button onClick={handleLogout} className="btn btn-light text-danger d-flex align-items-center gap-2">
                        <LogOut size={18} /> <span className="d-none d-md-inline">Logout</span>
                    </button>
                </div>
            </header>

            {/* Main Content Area */}
            <main className="flex-grow-1 p-3 p-md-4">
                <div className="container-fluid max-w-7xl mx-auto">
                    <Outlet />
                </div>
            </main>
        </div>
    )
}
