import { useState } from 'react'
import { API_BASE } from '../../services/api'
import { GraduationCap, Eye, EyeOff, LogIn, ArrowRight } from 'lucide-react'

export default function StudentLoginPage({ onLogin }) {
    const [nisn, setNisn] = useState('')
    const [tglLahir, setTglLahir] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const [showDate, setShowDate] = useState(false)

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!nisn || !tglLahir) { setError('NISN dan Tanggal Lahir wajib diisi'); return }
        setLoading(true)
        setError('')
        try {
            const res = await fetch(`${API_BASE}/student/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nisn, tglLahir })
            })
            const data = await res.json()
            if (!res.ok) { setError(data.error || 'Login gagal'); return }
            onLogin(data)
        } catch (err) {
            setError('Tidak dapat terhubung ke server')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="stu-login-page">
            {/* Decorative background elements */}
            <div className="stu-login-bg">
                <div className="stu-login-circle c1"></div>
                <div className="stu-login-circle c2"></div>
                <div className="stu-login-circle c3"></div>
            </div>

            <div className="stu-login-container">
                {/* Logo & Branding */}
                <div className="stu-login-brand">
                    <div className="stu-login-logo">
                        <GraduationCap size={36} strokeWidth={1.5} />
                    </div>
                    <h1>Portal Siswa</h1>
                    <p>SMK PPRQ</p>
                </div>

                {/* Login Card */}
                <form className="stu-login-card" onSubmit={handleSubmit}>
                    <h2>Masuk ke Akunmu</h2>
                    <p className="stu-login-subtitle">Gunakan NISN dan tanggal lahir</p>

                    {error && (
                        <div className="stu-login-error">
                            <span>⚠️</span> {error}
                        </div>
                    )}

                    <div className="stu-login-field">
                        <label>NISN</label>
                        <input
                            type="text"
                            inputMode="numeric"
                            placeholder="Masukkan NISN kamu"
                            value={nisn}
                            onChange={e => setNisn(e.target.value)}
                            autoFocus
                        />
                    </div>

                    <div className="stu-login-field">
                        <label>Tanggal Lahir</label>
                        <div className="stu-date-input-wrap">
                            <input
                                type={showDate ? 'date' : 'text'}
                                placeholder="Pilih tanggal lahir"
                                value={tglLahir}
                                onChange={e => setTglLahir(e.target.value)}
                                onFocus={() => setShowDate(true)}
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="stu-login-btn"
                        disabled={loading}
                    >
                        {loading ? (
                            <span className="stu-login-spinner" />
                        ) : (
                            <>
                                Masuk
                                <ArrowRight size={18} />
                            </>
                        )}
                    </button>

                    <div className="stu-login-footer">
                        <p>Lupa NISN? Hubungi administrator sekolah</p>
                    </div>
                </form>
            </div>
        </div>
    )
}
