import { useEffect } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import { PortalProvider } from './context/PortalContext'
import PortalNavbar from './components/PortalNavbar'
import PortalFooter from './components/PortalFooter'
import PortalBottomNav from './components/PortalBottomNav'
import PortalFloatingActions from './components/PortalFloatingActions'
import { useState } from 'react'
import { usePortal } from './context/PortalContext'

// Portal Styles
import './styles/portal-variables.css'
import './styles/portal-layout.css'
import './styles/portal-components.css'
import './styles/portal-home-new.css'

// Pages
import PortalHome from './pages/PortalHome'
import PortalPrograms from './pages/PortalPrograms'
import PortalAnnouncements from './pages/PortalAnnouncements'
import PortalAnnouncementDetail from './pages/PortalAnnouncementDetail'
import PortalProgramDetail from './pages/PortalProgramDetail'
import PortalInfo from './pages/PortalInfo'
import PortalPPDB from './pages/PortalPPDB'
import PortalBilling from './pages/PortalBilling'
import PortalContact from './pages/PortalContact'
import PortalLogin from './pages/PortalLogin'
import PortalNotFound from './pages/PortalNotFound'

function ScrollToTop() {
    const { pathname } = useLocation()
    useEffect(() => {
        window.scrollTo(0, 0)
    }, [pathname])
    return null
}

function PortalLayout() {
    const { fetchSettings } = usePortal()
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
    const toggleMobileOpen = () => setMobileMenuOpen(!mobileMenuOpen)

    useEffect(() => {
        fetchSettings()
    }, [fetchSettings])

    return (
        <div className="portal-root">
            <ScrollToTop />
            <PortalNavbar mobileOpen={mobileMenuOpen} setMobileOpen={setMobileMenuOpen} />
            <Routes>
                <Route index element={<PortalHome />} />
                <Route path="jurusan" element={<PortalPrograms />} />
                <Route path="pengumuman" element={<PortalAnnouncements />} />
                <Route path="pengumuman/:slug" element={<PortalAnnouncementDetail />} />
                <Route path="jurusan/:slug" element={<PortalProgramDetail />} />
                <Route path="informasi" element={<PortalInfo />} />
                <Route path="ppdb" element={<PortalPPDB />} />
                <Route path="cek-tagihan" element={<PortalBilling />} />
                <Route path="kontak" element={<PortalContact />} />
                <Route path="login" element={<PortalLogin />} />
                <Route path="*" element={<PortalNotFound />} />
            </Routes>
            <PortalFooter />
            <PortalBottomNav onShowMore={toggleMobileOpen} />
            <PortalFloatingActions />
        </div>
    )
}

export default function PortalApp() {
    return (
        <PortalProvider>
            <PortalLayout />
        </PortalProvider>
    )
}
