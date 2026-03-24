import { lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'

// Layouts
import AdminLayout from './layouts/AdminLayout'
import GuruLayout from './layouts/GuruLayout'

// Portal (separate chunk — no auth needed)
const PortalApp = lazy(() => import('./portal/PortalApp'))

// Student Portal (separate chunk — student auth)
const StudentApp = lazy(() => import('./student/StudentApp'))

// Guru Pages (lazy — only load when user navigates to /guru)
const GuruDashboard = lazy(() => import('./pages/guru/GuruDashboard'))
const ClassSession = lazy(() => import('./pages/guru/ClassSession'))
const GuruHistory = lazy(() => import('./pages/guru/GuruHistory'))

// Admin Pages (lazy — only load when user navigates to /admin/...)
const DashboardPage = lazy(() => import('./pages/admin/DashboardPage'))
const SiswaPage = lazy(() => import('./pages/admin/SiswaPage'))
const UnitKelasPage = lazy(() => import('./pages/admin/UnitKelasPage'))
const TahunAjaranPage = lazy(() => import('./pages/admin/TahunAjaranPage'))
const DataGuruPage = lazy(() => import('./pages/admin/DataGuruPage'))
const JadwalPelajaranPage = lazy(() => import('./pages/admin/JadwalPelajaranPage'))
const KategoriTagihanPage = lazy(() => import('./pages/admin/KategoriTagihanPage'))
const RekeningPage = lazy(() => import('./pages/admin/RekeningPage'))
const TagihanPage = lazy(() => import('./pages/admin/TagihanPage'))
const RiwayatGeneratePage = lazy(() => import('./pages/admin/RiwayatGeneratePage'))
const PembayaranPage = lazy(() => import('./pages/admin/PembayaranPage'))
const RiwayatTransaksiPage = lazy(() => import('./pages/admin/RiwayatTransaksiPage'))
const ArusKasPage = lazy(() => import('./pages/admin/ArusKasPage'))
const LaporanPage = lazy(() => import('./pages/admin/LaporanPage'))
const KartuSppPage = lazy(() => import('./pages/admin/KartuSppPage'))
const UsersPage = lazy(() => import('./pages/admin/UsersPage'))
const PengaturanPage = lazy(() => import('./pages/admin/PengaturanPage'))
const BackupPage = lazy(() => import('./pages/admin/BackupPage'))
const StudentMenuPage = lazy(() => import('./pages/admin/StudentMenuPage'))
const AttendancePage = lazy(() => import('./pages/admin/AttendancePage'))
const TabunganPage = lazy(() => import('./pages/admin/TabunganPage'))
const BimbinganKonselingPage = lazy(() => import('./pages/admin/BimbinganKonselingPage'))
const NilaiAkademikPage = lazy(() => import('./pages/admin/NilaiAkademikPage'))
const ManajemenPesanPage = lazy(() => import('./pages/admin/ManajemenPesanPage'))
// CMS Pages (lazy)
const CmsBannersPage = lazy(() => import('./features/cms/pages/CmsBannersPage'))
const CmsPostsPage = lazy(() => import('./features/cms/pages/CmsPostsPage'))
const CmsPagesPage = lazy(() => import('./features/cms/pages/CmsPagesPage'))
const CmsContactsPage = lazy(() => import('./features/cms/pages/CmsContactsPage'))
const CmsPpdbPage = lazy(() => import('./features/cms/pages/CmsPpdbPage'))
const CmsHomePage = lazy(() => import('./features/cms/pages/CmsHomePage'))


import LoadingSpinner from './components/LoadingSpinner';
import OfflineBanner from './components/OfflineBanner';

export default function App() {
  return (
    <Suspense fallback={<LoadingSpinner fullScreen message="Membuka Aplikasi..." />}>
      <OfflineBanner />
      <Routes>
        {/* ======= ADMIN BACK-OFFICE (/admin/...) ======= */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="siswa" element={<SiswaPage />} />
          <Route path="guru" element={<DataGuruPage />} />
          <Route path="jadwal" element={<JadwalPelajaranPage />} />
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
          <Route path="student-menus" element={<StudentMenuPage />} />
          <Route path="presensi" element={<AttendancePage />} />
          <Route path="tabungan" element={<TabunganPage />} />
          <Route path="bk" element={<BimbinganKonselingPage />} />
          <Route path="akademik" element={<NilaiAkademikPage />} />
          <Route path="pesan" element={<ManajemenPesanPage />} />
          <Route path="backup" element={<BackupPage />} />

          {/* CMS Routes */}
          <Route path="cms/home" element={<CmsHomePage />} />
          <Route path="cms/banners" element={<CmsBannersPage />} />
          <Route path="cms/posts" element={<CmsPostsPage />} />
          <Route path="cms/pages" element={<CmsPagesPage />} />
          <Route path="cms/contacts" element={<CmsContactsPage />} />
          <Route path="cms/ppdb" element={<CmsPpdbPage />} />
        </Route>

        {/* ======= GURU PORTAL (/guru/...) ======= */}
        <Route path="/guru" element={<GuruLayout />}>
          <Route index element={<GuruDashboard />} />
          <Route path="session/:id" element={<ClassSession />} />
          <Route path="history" element={<GuruHistory />} />
        </Route>

        {/* ======= STUDENT PORTAL (/siswa-portal/...) ======= */}
        <Route path="/siswa-portal/*" element={<StudentApp />} />

        {/* ======= PUBLIC PORTAL (/) ======= */}
        <Route path="/*" element={<PortalApp />} />
      </Routes>
    </Suspense>
  )
}
