import { Outlet, NavLink } from 'react-router-dom'
import { Home, GraduationCap, Wallet, MessageCircle, User } from 'lucide-react'
import { useStudent } from './StudentApp'

const tabs = [
    { to: '/siswa-portal', icon: Home, label: 'Beranda', end: true },
    { to: '/siswa-portal/nilai', icon: GraduationCap, label: 'Akademik' },
    { to: '/siswa-portal/keuangan', icon: Wallet, label: 'Keuangan' },
    { to: '/siswa-portal/pengumuman', icon: MessageCircle, label: 'Info' },
    { to: '/siswa-portal/profil', icon: User, label: 'Profil' },
]

export default function StudentLayout() {
    const { student } = useStudent()

    return (
        <div className="stu-app">
            {/* Status Bar */}
            <header className="stu-status-bar">
                <div className="stu-status-left">
                    <div className="stu-avatar-sm">
                        {student?.nama?.charAt(0) || 'S'}
                    </div>
                    <div>
                        <div className="stu-greeting">Halo, {student?.nama?.split(' ')[0]} 👋</div>
                        <div className="stu-class-badge">{student?.kelas || 'Siswa'}</div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="stu-main">
                <Outlet />
            </main>

            {/* Bottom Navigation */}
            <nav className="stu-bottom-nav">
                {tabs.map(tab => (
                    <NavLink
                        key={tab.to}
                        to={tab.to}
                        end={tab.end}
                        className={({ isActive }) => `stu-nav-item ${isActive ? 'active' : ''}`}
                    >
                        <tab.icon size={22} strokeWidth={1.8} />
                        <span>{tab.label}</span>
                    </NavLink>
                ))}
            </nav>
        </div>
    )
}
