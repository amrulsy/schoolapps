import { useState, useEffect, useCallback } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { API_BASE } from '../services/api'
import StudentLayout from './StudentLayout'
import StudentLoginPage from './pages/StudentLoginPage'
import StudentDashboard from './pages/StudentDashboard'
import StudentProfilePage from './pages/StudentProfilePage'
import PresensiPage from './pages/PresensiPage'
import NilaiRaporPage from './pages/NilaiRaporPage'
import KeuanganPage from './pages/KeuanganPage'
import TabunganPage from './pages/TabunganPage'
import PengumumanPage from './pages/PengumumanPage'
import BKPage from './pages/BKPage'
import PesanPage from './pages/PesanPage'
import MaintenancePage from '../pages/public/MaintenancePage'
import './student.css'

import { StudentContext, useStudent } from './StudentContext'

export { useStudent }

export default function StudentApp() {
    const [student, setStudent] = useState(null)
    const [token, setToken] = useState(localStorage.getItem('student_token'))
    const [profile, setProfile] = useState(null)
    const [bills, setBills] = useState([])
    const [transactions, setTransactions] = useState([])
    const [announcements, setAnnouncements] = useState([])
    const [menuItems, setMenuItems] = useState([])
    const [attendanceSummary, setAttendanceSummary] = useState({ presentCount: 0 })
    const [attendanceDocs, setAttendanceDocs] = useState([])
    const [tabunganData, setTabunganData] = useState({ saldo: 0, history: [] })
    const [bkData, setBkData] = useState({ poin: { pelanggaran: 0, prestasi: 0, netPoin: 0 }, pelanggaran: [], prestasi: [], tatatertib: [] })
    const [nilaiData, setNilaiData] = useState({ currentSemester: {}, subjects: { muatanNasional: [], muatanKewilayahan: [], muatanPeminatan: [] } })
    const [pesanList, setPesanList] = useState([])
    const [unreadNotifs, setUnreadNotifs] = useState(0)
    const [stuTheme, setStuTheme] = useState(localStorage.getItem('student_theme') || 'blue')
    const [xpStats, setXpStats] = useState({ level: 1, xp: 0, nextXp: 100, progress: 0 })
    const [maintenanceMode, setMaintenanceMode] = useState(false)
    const [loading, setLoading] = useState(true)
    const [secondaryLoading, setSecondaryLoading] = useState(false)

    const authHeaders = useCallback(() => ({
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    }), [token])

    const fetchStudentData = useCallback(async () => {
        if (!token) { setLoading(false); return }
        try {
            // TIER 1: Essential Dashboard & Layout Data
            const [profileRes, announcementsRes, menusRes, attendanceSummaryRes, bkRes, settingsRes, billsRes, txRes] = await Promise.all([
                fetch(`${API_BASE}/student/profile`, { headers: authHeaders() }),
                fetch(`${API_BASE}/student/announcements`, { headers: authHeaders() }),
                fetch(`${API_BASE}/student/menus`, { headers: authHeaders() }),
                fetch(`${API_BASE}/student/attendance/summary`, { headers: authHeaders() }),
                fetch(`${API_BASE}/student/bk`, { headers: authHeaders() }),
                fetch(`${API_BASE}/public/settings`),
                fetch(`${API_BASE}/student/bills`, { headers: authHeaders() }),
                fetch(`${API_BASE}/student/transactions`, { headers: authHeaders() })
            ])

            if (!profileRes.ok) { handleLogout(); return }

            const [prof, ann, menu, attSum, bk, sett, bll, tx] = await Promise.all([
                profileRes.json(),
                announcementsRes.json().catch(() => []),
                menusRes.json().catch(() => []),
                attendanceSummaryRes.json().catch(() => ({ presentCount: 0 })),
                bkRes.json().catch(() => ({ poin: { pelanggaran: 0, prestasi: 0, netPoin: 0 } })),
                settingsRes.json().catch(() => ({})),
                billsRes.json().catch(() => []),
                txRes.json().catch(() => [])
            ])

            setProfile(prof)
            const mockAnnouncements = [
                { id: 1, title: '📢 Pelaksanaan Ujian Akhir Semester Ganjil', category: 'akademik', content: 'Ujian Akhir Semester (UAS) Ganjil akan dilaksanakan pada tanggal 10-20 Desember 2026. Mohon persiapkan diri sebaik mungkin dan pastikan semua administrasi telah selesai.', created_at: '2026-04-01T08:00:00Z' },
                { id: 2, title: '🚨 PENTING: Perubahan Jadwal Libur Semester', category: 'umum', content: 'Terdapat perubahan jadwal libur semester ganjil menjadi tanggal 21 Desember hingga 5 Januari 2027. Informasi detail dapat dilihat di lampiran papan pengumuman sekolah.', created_at: '2026-04-02T10:30:00Z' },
                { id: 3, title: '🏆 Selamat! Tim Basket Sekolah Juara Provincial Cup', category: 'kegiatan', content: 'Kami bangga mengumumkan bahwa tim basket sekolah kita berhasil meraih juara 1 dalam ajang Provincial Cup 2026. Terima kasih atas dukungan dan doa seluruh warga sekolah!', created_at: '2026-04-03T14:15:00Z' }
            ]
            setAnnouncements(ann.length > 0 ? ann : mockAnnouncements)
            setMenuItems(menu)
            setAttendanceSummary(attSum)
            setBkData(bk)
            setBills(bll)
            setTransactions(tx)
            if (sett?.maintenance_mode === 'true') setMaintenanceMode(true)

            // Hitung notif belum dibaca (dummy logic, assumes 'read' field or comparable)
            // setUnreadNotifs(ann.filter(a => !a.read).length) 
            setUnreadNotifs(ann.length > 0 ? 1 : 0) // Placeholder logic

            setLoading(false)

            // TIER 2: Secondary Data (Background Load)
            setSecondaryLoading(true)
            const [attendanceDocsRes, tabunganRes, nilaiRes, pesanRes] = await Promise.all([
                fetch(`${API_BASE}/student/attendance`, { headers: authHeaders() }),
                fetch(`${API_BASE}/student/tabungan`, { headers: authHeaders() }),
                fetch(`${API_BASE}/student/nilai`, { headers: authHeaders() }),
                fetch(`${API_BASE}/student/pesan`, { headers: authHeaders() })
            ])

            try { setAttendanceDocs(await attendanceDocsRes.json()) } catch { setAttendanceDocs([]) }
            try { setTabunganData(await tabunganRes.json()) } catch { setTabunganData({ saldo: 0, history: [] }) }
            try { setNilaiData(await nilaiRes.json()) } catch { setNilaiData({ currentSemester: {}, subjects: { muatanNasional: [], muatanKewilayahan: [], muatanPeminatan: [] } }) }
            try { setPesanList(await pesanRes.json()) } catch { setPesanList([]) }

        } catch (err) {
            console.error('Student data fetch error:', err)
        } finally {
            setLoading(false)
            setSecondaryLoading(false)
        }
    }, [token, authHeaders])

    const sendMessage = async (text) => {
        try {
            const res = await fetch(`${API_BASE}/student/pesan`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...authHeaders() },
                body: JSON.stringify({ text })
            })
            if (res.ok) fetchStudentData() // Refresh chat
            return res.ok
        } catch (err) { return false }
    }

    useEffect(() => {
        const savedStudent = localStorage.getItem('student_data')
        if (savedStudent) setStudent(JSON.parse(savedStudent))
        fetchStudentData()
    }, [fetchStudentData])

    // XP & Leveling Engine
    useEffect(() => {
        if (!student) return
        
        // Simple formula: XP = (Attendance * 10) + (Prestasi * 20) - (Pelanggaran * 5)
        const attendanceXP = (attendanceSummary?.presentCount || 0) * 10
        const prestasiXP = (bkData?.poin?.prestasi || 0) * 20
        const pelanggaranPenalty = (bkData?.poin?.pelanggaran || 0) * 5
        
        const totalXP = Math.max(0, attendanceXP + prestasiXP - pelanggaranPenalty)
        const level = Math.floor(Math.sqrt(totalXP / 10)) + 1
        const nextLevelXP = Math.pow(level, 2) * 10
        const prevLevelXP = Math.pow(level - 1, 2) * 10
        const progress = ((totalXP - prevLevelXP) / (nextLevelXP - prevLevelXP)) * 100

        setXpStats({ level, xp: totalXP, nextXp: nextLevelXP, progress })
    }, [student, attendanceSummary, bkData])

    const handleLogin = (data) => {
        localStorage.setItem('student_token', data.token)
        localStorage.setItem('student_data', JSON.stringify(data.student))
        setToken(data.token)
        setStudent(data.student)
        setLoading(true)
        setTimeout(() => fetchStudentData(), 100)
    }

    const changeTheme = (theme) => {
        localStorage.setItem('student_theme', theme)
        setStuTheme(theme)
    }

    const handleLogout = () => {
        localStorage.removeItem('student_token')
        localStorage.removeItem('student_data')
        setToken(null)
        setStudent(null)
        setProfile(null)
        setBills([])
        setTransactions([])
    }

    const formatRupiah = (n) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n || 0)

    if (!token || !student) {
        return <StudentLoginPage onLogin={handleLogin} />
    }

    if (maintenanceMode) {
        return <MaintenancePage />
    }

    return (
        <StudentContext.Provider value={{ student, profile, bills, transactions, announcements, menuItems, attendanceSummary, attendanceDocs, tabunganData, bkData, nilaiData, pesanList, unreadNotifs, stuTheme, xpStats, changeTheme, loading, secondaryLoading, formatRupiah, handleLogout, fetchStudentData, sendMessage }}>
            <Helmet>
                <meta name="robots" content="noindex, nofollow" />
            </Helmet>
            <Routes>
                <Route element={<StudentLayout />}>
                    <Route index element={<StudentDashboard />} />
                    <Route path="profil" element={<StudentProfilePage />} />
                    <Route path="presensi" element={<PresensiPage />} />
                    <Route path="nilai" element={<NilaiRaporPage />} />
                    <Route path="keuangan" element={<KeuanganPage />} />
                    <Route path="tabungan" element={<TabunganPage />} />
                    <Route path="pengumuman" element={<PengumumanPage />} />
                    <Route path="bk" element={<BKPage />} />
                    <Route path="pesan" element={<PesanPage />} />
                </Route>
                <Route path="*" element={<Navigate to="/siswa-portal" replace />} />
            </Routes>
        </StudentContext.Provider>
    )
}
