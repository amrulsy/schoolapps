import { useState } from 'react'
import { Eye, EyeOff, LogIn } from 'lucide-react'
import { API_BASE } from '../services/api'

export default function LoginPage({ onLogin }) {
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [showPw, setShowPw] = useState(false)
    const handleSubmit = async (e) => {
        e.preventDefault()
        if (username && password) {
            try {
                const res = await fetch(`${API_BASE}/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, password })
                });

                if (res.ok) {
                    const data = await res.json();
                    onLogin(data);
                } else {
                    const error = await res.json();
                    alert(error.error || 'Username atau password salah');
                }
            } catch (err) {
                console.error('Login error:', err);
                alert('Tidak dapat terhubung ke server. Pastikan server backend aktif dan coba lagi.');
            }
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
