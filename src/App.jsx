import { useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import { useApp } from './context/AppContext'
import Sidebar from './components/Sidebar'
import Header from './components/Header'
import Toast from './components/Toast'

// Pages
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import SiswaPage from './pages/SiswaPage'
import UnitKelasPage from './pages/UnitKelasPage'
import TahunAjaranPage from './pages/TahunAjaranPage'
import KategoriTagihanPage from './pages/KategoriTagihanPage'
import RekeningPage from './pages/RekeningPage'
import TagihanPage from './pages/TagihanPage'
import PembayaranPage from './pages/PembayaranPage'
import RiwayatTransaksiPage from './pages/RiwayatTransaksiPage'
import ArusKasPage from './pages/ArusKasPage'
import LaporanPage from './pages/LaporanPage'
import KartuSppPage from './pages/KartuSppPage'
import UsersPage from './pages/UsersPage'
import PengaturanPage from './pages/PengaturanPage'

export default function App() {
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
            <Route path="/pembayaran" element={<PembayaranPage />} />
            <Route path="/riwayat" element={<RiwayatTransaksiPage />} />
            <Route path="/arus-kas" element={<ArusKasPage />} />
            <Route path="/laporan" element={<LaporanPage />} />
            <Route path="/kartu-spp" element={<KartuSppPage />} />
            <Route path="/users" element={<UsersPage />} />
            <Route path="/pengaturan" element={<PengaturanPage />} />
          </Routes>
        </main>
      </div>
      <Toast />
    </div>
  )
}
