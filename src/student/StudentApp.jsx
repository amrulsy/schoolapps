import { useState, useEffect, createContext, useContext, useCallback } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
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
import './student.css'

const StudentContext = createContext()
export const useStudent = () => useContext(StudentContext)

export default function StudentApp() {
    const [student, setStudent] = useState(null)
    const [token, setToken] = useState(localStorage.getItem('student_token'))
    const [profile, setProfile] = useState(null)
    const [bills, setBills] = useState([])
    const [transactions, setTransactions] = useState([])
    const [announcements, setAnnouncements] = useState([])
    const [loading, setLoading] = useState(true)

    const authHeaders = useCallback(() => ({
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    }), [token])

    const fetchStudentData = useCallback(async () => {
        if (!token) { setLoading(false); return }
        try {
            const [profileRes, billsRes, txRes, announcementsRes] = await Promise.all([
                fetch(`${API_BASE}/student/profile`, { headers: authHeaders() }),
                fetch(`${API_BASE}/student/bills`, { headers: authHeaders() }),
                fetch(`${API_BASE}/student/transactions`, { headers: authHeaders() }),
                fetch(`${API_BASE}/student/announcements`, { headers: authHeaders() })
            ])
            if (!profileRes.ok) { handleLogout(); return }
            setProfile(await profileRes.json())
            setBills(await billsRes.json())
            setTransactions(await txRes.json())
            try { setAnnouncements(await announcementsRes.json()) } catch { setAnnouncements([]) }
        } catch (err) {
            console.error('Student data fetch error:', err)
        } finally {
            setLoading(false)
        }
    }, [token, authHeaders])

    useEffect(() => {
        const savedStudent = localStorage.getItem('student_data')
        if (savedStudent) setStudent(JSON.parse(savedStudent))
        fetchStudentData()
    }, [fetchStudentData])

    const handleLogin = (data) => {
        localStorage.setItem('student_token', data.token)
        localStorage.setItem('student_data', JSON.stringify(data.student))
        setToken(data.token)
        setStudent(data.student)
        setLoading(true)
        setTimeout(() => fetchStudentData(), 100)
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

    return (
        <StudentContext.Provider value={{ student, profile, bills, transactions, announcements, loading, formatRupiah, handleLogout, fetchStudentData }}>
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
