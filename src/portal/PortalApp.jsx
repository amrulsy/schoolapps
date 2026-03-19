import { useEffect } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import { PortalProvider } from './context/PortalContext'
import PortalNavbar from './components/PortalNavbar'
import PortalFooter from './components/PortalFooter'
import PortalBottomNav from './components/PortalBottomNav'
import { useState } from 'react'

// Portal Styles
import './styles/portal-variables.css'
import './styles/portal-layout.css'
import './styles/portal-components.css'

// Pages
import PortalHome from './pages/PortalHome'
import PortalAnnouncements from './pages/PortalAnnouncements'
import PortalAnnouncementDetail from './pages/PortalAnnouncementDetail'
import PortalProgramDetail from './pages/PortalProgramDetail'
import PortalInfo from './pages/PortalInfo'
import PortalPPDB from './pages/PortalPPDB'
import PortalBilling from './pages/PortalBilling'
import PortalContact from './pages/PortalContact'

function ScrollToTop() {
    const { pathname } = useLocation()
    useEffect(() => {
        window.scrollTo(0, 0)
    }, [pathname])
    return null
}

export default function PortalApp() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
    const toggleMobileMenu = () => setMobileMenuOpen(!mobileMenuOpen)

    return (
        <PortalProvider>
            <div className="portal-root">
                <ScrollToTop />
                <PortalNavbar mobileOpen={mobileMenuOpen} setMobileOpen={setMobileMenuOpen} />
                <Routes>
                    <Route index element={<PortalHome />} />
                    <Route path="pengumuman" element={<PortalAnnouncements />} />
                    <Route path="/pengumuman/:slug" element={<PortalAnnouncementDetail />} />
                    <Route path="/jurusan/:slug" element={<PortalProgramDetail />} />
                    <Route path="/informasi" element={<PortalInfo />} />
                    <Route path="/ppdb" element={<PortalPPDB />} />
                    <Route path="cek-tagihan" element={<PortalBilling />} />
                    <Route path="kontak" element={<PortalContact />} />
                </Routes>
                <PortalFooter />
                <PortalBottomNav onShowMore={toggleMobileMenu} />
            </div>
        </PortalProvider>
    )
}
