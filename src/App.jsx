import { lazy, Suspense, useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import { useApp } from './context/AppContext'

// ---- LAZY LOADED CHUNKS ----
// Portal (separate chunk — no auth needed)
const PortalApp = lazy(() => import('./portal/PortalApp'))

// Admin UI components (loaded only when authenticated)
import Sidebar from './components/Sidebar'
import Header from './components/Header'
import Toast from './components/Toast'

// Admin Pages (eagerly loaded within admin shell)
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import SiswaPage from './pages/SiswaPage'
import UnitKelasPage from './pages/UnitKelasPage'
import TahunAjaranPage from './pages/TahunAjaranPage'
import KategoriTagihanPage from './pages/KategoriTagihanPage'
import RekeningPage from './pages/RekeningPage'
import TagihanPage from './pages/TagihanPage'
import RiwayatGeneratePage from './pages/RiwayatGeneratePage'
import PembayaranPage from './pages/PembayaranPage'
import RiwayatTransaksiPage from './pages/RiwayatTransaksiPage'
import ArusKasPage from './pages/ArusKasPage'
import LaporanPage from './pages/LaporanPage'
import KartuSppPage from './pages/KartuSppPage'
import UsersPage from './pages/UsersPage'
import PengaturanPage from './pages/PengaturanPage'

// CMS Pages
import CmsBannersPage from './pages/CmsBannersPage'
import CmsPostsPage from './pages/CmsPostsPage'
import CmsPagesPage from './pages/CmsPagesPage'
import CmsSettingsPage from './pages/CmsSettingsPage'
import CmsContactsPage from './pages/CmsContactsPage'
import CmsPpdbPage from './pages/CmsPpdbPage'

// Page loader for suspense fallback
function PageLoader() {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      minHeight: '100vh', background: '#FAFBFF'
    }}>
      <div style={{
        width: '48px', height: '48px',
        border: '4px solid #E2E8F0', borderTopColor: '#6366F1',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite'
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

// Admin shell component
function AdminShell() {
  const { sidebarCollapsed } = useApp()
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  if (!isLoggedIn) {
    return <LoginPage onLogin={() => setIsLoggedIn(true)} />
  }

  const marginLeft = sidebarCollapsed ? 'var(--sidebar-collapsed)' : 'var(--sidebar-width)'

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-wrapper" style={{ marginLeft }}>
        <Header />
        <main className="page-content">
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/siswa" element={<SiswaPage />} />
            <Route path="/unit-kelas" element={<UnitKelasPage />} />
            <Route path="/tahun-ajaran" element={<TahunAjaranPage />} />
            <Route path="/kategori-tagihan" element={<KategoriTagihanPage />} />
            <Route path="/rekening" element={<RekeningPage />} />
            <Route path="/tagihan" element={<TagihanPage />} />
            <Route path="/riwayat-generate" element={<RiwayatGeneratePage />} />
            <Route path="/pembayaran" element={<PembayaranPage />} />
            <Route path="/riwayat" element={<RiwayatTransaksiPage />} />
            <Route path="/arus-kas" element={<ArusKasPage />} />
            <Route path="/laporan" element={<LaporanPage />} />
            <Route path="/kartu-spp" element={<KartuSppPage />} />
            <Route path="/users" element={<UsersPage />} />
            <Route path="/pengaturan" element={<PengaturanPage />} />

            {/* CMS Routes */}
            <Route path="/cms/banners" element={<CmsBannersPage />} />
            <Route path="/cms/posts" element={<CmsPostsPage />} />
            <Route path="/cms/pages" element={<CmsPagesPage />} />
            <Route path="/cms/settings" element={<CmsSettingsPage />} />
            <Route path="/cms/contacts" element={<CmsContactsPage />} />
            <Route path="/cms/ppdb" element={<CmsPpdbPage />} />
          </Routes>
        </main>
      </div>
      <Toast />
    </div>
  )
}

export default function App() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Portal Publik — NO AUTH, separate bundle */}
        <Route path="/portal/*" element={<PortalApp />} />

        {/* Admin Back-Office — AUTH REQUIRED */}
        <Route path="/*" element={<AdminShell />} />
      </Routes>
    </Suspense>
  )
}
