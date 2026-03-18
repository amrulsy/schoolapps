import { Outlet, NavLink } from 'react-router-dom'

const navStyle = ({ isActive }) => ({
    color: isActive ? '#818cf8' : 'rgba(255,255,255,0.75)',
    textDecoration: 'none',
    padding: '6px 14px',
    borderRadius: 6,
    background: isActive ? 'rgba(129,140,248,0.15)' : 'transparent',
    fontWeight: isActive ? 600 : 400,
    transition: 'all 0.2s'
})

export default function PublicLayout() {
    return (
        <div>
            <nav style={{
                padding: '12px 24px',
                background: '#1e293b',
                display: 'flex',
                alignItems: 'center',
                gap: 24,
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
            }}>
                <div style={{ fontWeight: 700, color: 'white', fontSize: '1.1rem', whiteSpace: 'nowrap' }}>
                    🏫 SMK PPRQ
                </div>
                <div style={{ display: 'flex', gap: 4, flex: 1 }}>
                    <NavLink to="/" end style={navStyle}>Beranda</NavLink>
                    <NavLink to="/berita" style={navStyle}>Berita</NavLink>
                    <NavLink to="/tentang" style={navStyle}>Tentang</NavLink>
                </div>
                <NavLink
                    to="/admin"
                    style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem', textDecoration: 'none' }}
                >
                    Login Admin →
                </NavLink>
            </nav>
            <main style={{ padding: 32 }}>
                <Outlet />
            </main>
        </div>
    )
}
