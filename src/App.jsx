import { lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'

// Layouts
import AdminLayout from './layouts/AdminLayout'

// Portal (separate chunk — no auth needed)
const PortalApp = lazy(() => import('./portal/PortalApp'))

// Student Portal (separate chunk — student auth)
const StudentApp = lazy(() => import('./student/StudentApp'))



// Admin Pages
import DashboardPage from './pages/admin/DashboardPage'
import SiswaPage from './pages/admin/SiswaPage'
import UnitKelasPage from './pages/admin/UnitKelasPage'
import TahunAjaranPage from './pages/admin/TahunAjaranPage'
import KategoriTagihanPage from './pages/admin/KategoriTagihanPage'
import RekeningPage from './pages/admin/RekeningPage'
import TagihanPage from './pages/admin/TagihanPage'
import RiwayatGeneratePage from './pages/admin/RiwayatGeneratePage'
import PembayaranPage from './pages/admin/PembayaranPage'
import RiwayatTransaksiPage from './pages/admin/RiwayatTransaksiPage'
import ArusKasPage from './pages/admin/ArusKasPage'
import LaporanPage from './pages/admin/LaporanPage'
import KartuSppPage from './pages/admin/KartuSppPage'
import UsersPage from './pages/admin/UsersPage'
import PengaturanPage from './pages/admin/PengaturanPage'
import BackupPage from './pages/admin/BackupPage'

// CMS Pages
import CmsBannersPage from './features/cms/pages/CmsBannersPage'
import CmsPostsPage from './features/cms/pages/CmsPostsPage'
import CmsPagesPage from './features/cms/pages/CmsPagesPage'
import CmsSettingsPage from './features/cms/pages/CmsSettingsPage'
import CmsContactsPage from './features/cms/pages/CmsContactsPage'
import CmsPpdbPage from './features/cms/pages/CmsPpdbPage'
import CmsHomePage from './features/cms/pages/CmsHomePage'
import CmsPpdbContentPage from './features/cms/pages/CmsPpdbContentPage'

import LoadingSpinner from './components/LoadingSpinner';

export default function App() {
  return (
    <Suspense fallback={<LoadingSpinner fullScreen message="Membuka Aplikasi..." />}>
      <Routes>
        {/* ======= ADMIN BACK-OFFICE (/admin/...) ======= */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="siswa" element={<SiswaPage />} />
          <Route path="unit-kelas" element={<UnitKelasPage />} />
          <Route path="tahun-ajaran" element={<TahunAjaranPage />} />
          <Route path="kategori-tagihan" element={<KategoriTagihanPage />} />
          <Route path="rekening" element={<RekeningPage />} />
          <Route path="tagihan" element={<TagihanPage />} />
          <Route path="riwayat-generate" element={<RiwayatGeneratePage />} />
          <Route path="pembayaran" element={<PembayaranPage />} />
          <Route path="riwayat" element={<RiwayatTransaksiPage />} />
          <Route path="arus-kas" element={<ArusKasPage />} />
          <Route path="laporan" element={<LaporanPage />} />
          <Route path="kartu-spp" element={<KartuSppPage />} />
          <Route path="users" element={<UsersPage />} />
          <Route path="pengaturan" element={<PengaturanPage />} />
          <Route path="backup" element={<BackupPage />} />

          {/* CMS Routes */}
          <Route path="cms/home" element={<CmsHomePage />} />
          <Route path="cms/banners" element={<CmsBannersPage />} />
          <Route path="cms/posts" element={<CmsPostsPage />} />
          <Route path="cms/pages" element={<CmsPagesPage />} />
          <Route path="cms/settings" element={<CmsSettingsPage />} />
          <Route path="cms/contacts" element={<CmsContactsPage />} />
          <Route path="cms/ppdb" element={<CmsPpdbPage />} />
          <Route path="cms/ppdb-content" element={<CmsPpdbContentPage />} />
        </Route>

        {/* ======= STUDENT PORTAL (/siswa-portal/...) ======= */}
        <Route path="/siswa-portal/*" element={<StudentApp />} />

        {/* ======= PUBLIC PORTAL (/) ======= */}
        <Route path="/*" element={<PortalApp />} />
      </Routes>
    </Suspense>
  )
}
