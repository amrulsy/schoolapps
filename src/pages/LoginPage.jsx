import { useState } from 'react'
import { Eye, EyeOff, LogIn } from 'lucide-react'

export default function LoginPage({ onLogin }) {
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [showPw, setShowPw] = useState(false)
    const [remember, setRemember] = useState(false)

    const handleSubmit = (e) => {
        e.preventDefault()
        if (username && password) {
            onLogin()
        }
    }

    return (
        <div className="login-page">
            <div className="login-card fade-in">
                <div className="brand">
                    <div className="logo">🏫</div>
                    <h1>SIAS</h1>
                    <p>Sistem Informasi Administrasi Sekolah<br />SMK PPRQ</p>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Username</label>
                        <input
                            type="text"
                            className="form-control"
                            placeholder="contoh: ahmad@pprq"
                            value={username}
                            onChange={e => setUsername(e.target.value)}
                            autoFocus
                        />
                    </div>

                    <div className="form-group">
                        <label>Password</label>
                        <div className="password-field">
                            <input
                                type={showPw ? 'text' : 'password'}
                                className="form-control"
                                placeholder="Masukkan password"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                            />
                            <button type="button" className="toggle-pw" onClick={() => setShowPw(!showPw)}>
                                {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <input
                            type="checkbox"
                            id="remember"
                            checked={remember}
                            onChange={e => setRemember(e.target.checked)}
                            style={{ accentColor: 'var(--primary-500)' }}
                        />
                        <label htmlFor="remember" style={{ margin: 0, cursor: 'pointer', color: 'rgba(255,255,255,0.6)' }}>
                            Ingat saya
                        </label>
                    </div>

                    <button type="submit" className="btn btn-primary" style={{ marginTop: 8 }}>
                        <LogIn size={18} />
                        MASUK
                    </button>
                </form>

                <div className="footer">© 2026 SIAS SMK PPRQ v1.0</div>
            </div>
        </div>
    )
}
