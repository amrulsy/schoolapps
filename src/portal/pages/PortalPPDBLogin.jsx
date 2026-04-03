import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { GraduationCap, Lock, User, ArrowRight, Loader2, AlertCircle } from "lucide-react";
import Swal from "sweetalert2";
import { API_BASE_PUBLIC } from "../../services/api";

export default function PortalPPDBLogin() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const redirect = searchParams.get("redirect") || "/ppdb/dashboard";

  const [username, setUsername] = useState("");
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!username || !pin) return setError("Username dan PIN wajib diisi");

    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${API_BASE_PUBLIC}/ppdb/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, pin }),
      });

      const data = await res.json();

      if (res.ok) {
        localStorage.setItem("ppdb_token", data.token);
        localStorage.setItem("ppdb_user", JSON.stringify(data.user));
        
        Swal.fire({
          icon: 'success',
          title: 'Login Berhasil',
          text: `Selamat datang, ${data.user.nama}!`,
          timer: 1500,
          showConfirmButton: false
        });

        navigate(redirect);
      } else {
        setError(data.error || "Username atau PIN salah");
      }
    } catch (err) {
      setError("Gagal menghubungkan ke server. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)', 
      padding: '20px',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <Helmet>
        <title>Login Pendaftar PPDB | SMK PPRQ</title>
      </Helmet>

      {/* Dynamic Background Elements */}
      <div style={{ position: 'absolute', top: '-10%', right: '-5%', width: '400px', height: '400px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(79, 70, 229, 0.08) 0%, transparent 70%)', zIndex: 0 }} />
      <div style={{ position: 'absolute', bottom: '-10%', left: '-5%', width: '400px', height: '400px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(124, 58, 237, 0.08) 0%, transparent 70%)', zIndex: 0 }} />

      <div className="login-container" style={{ 
        maxWidth: '480px', 
        width: '100%', 
        background: 'rgba(255, 255, 255, 0.9)', 
        backdropFilter: 'blur(20px)',
        borderRadius: '32px', 
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.1)', 
        overflow: 'hidden',
        border: '1px solid rgba(255, 255, 255, 0.5)',
        zIndex: 1,
        animation: 'slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1)'
      }}>
        <div style={{ 
          background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)', 
          padding: '48px 40px', 
          color: 'white', 
          textAlign: 'center',
          position: 'relative'
        }}>
          <div style={{ 
            background: 'rgba(255, 255, 255, 0.2)', 
            backdropFilter: 'blur(10px)',
            width: '72px', 
            height: '72px', 
            borderRadius: '22px', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            margin: '0 auto 24px',
            boxShadow: '0 8px 16px rgba(0,0,0,0.1)',
            transform: 'rotate(-5deg)'
          }}>
            <GraduationCap size={36} />
          </div>
          <h2 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 900, letterSpacing: '-0.03em' }}>Selamat Datang</h2>
          <p style={{ margin: '8px 0 0', opacity: 0.9, fontSize: '0.95rem', fontWeight: 500 }}>Masuk ke Dasbor Calon Siswa Baru</p>
        </div>

        <div style={{ padding: '40px' }}>
          {error && (
            <div style={{ 
              background: '#fef2f2', 
              border: '1px solid #fee2e2', 
              color: '#ef4444', 
              padding: '14px 18px', 
              borderRadius: '16px', 
              marginBottom: '28px', 
              display: 'flex', 
              gap: '12px', 
              alignItems: 'center', 
              fontSize: '0.9rem',
              fontWeight: 600,
              animation: 'shake 0.4s cubic-bezier(.36,.07,.19,.97) both'
            }}>
              <AlertCircle size={20} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 800, color: '#475569', marginBottom: '10px', marginLeft: '4px' }}>Username / No. Registrasi</label>
              <div style={{ position: 'relative' }}>
                <User size={20} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <input
                  type="text"
                  placeholder="Contoh: REG-2024-001"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  style={{ 
                    width: '100%', 
                    padding: '14px 14px 14px 48px', 
                    borderRadius: '16px', 
                    border: '2px solid #f1f5f9', 
                    fontSize: '1rem', 
                    outline: 'none', 
                    transition: 'all 0.3s',
                    background: '#f8fafc'
                  }}
                  className="login-input"
                />
              </div>
            </div>

            <div style={{ marginBottom: '32px' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 800, color: '#475569', marginBottom: '10px', marginLeft: '4px' }}>PIN Rahasia</label>
              <div style={{ position: 'relative' }}>
                <Lock size={20} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <input
                  type="password"
                  placeholder="Masukkan 6 digit PIN"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  style={{ 
                    width: '100%', 
                    padding: '14px 14px 14px 48px', 
                    borderRadius: '16px', 
                    border: '2px solid #f1f5f9', 
                    fontSize: '1rem', 
                    outline: 'none', 
                    transition: 'all 0.3s',
                    background: '#f8fafc'
                  }}
                  className="login-input"
                />
              </div>
              <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '12px', fontWeight: 500, lineHeight: 1.5 }}>
                PIN Rahasia dapat dilihat pada pesan WhatsApp saat melakukan pendaftaran online.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{ 
                width: '100%', 
                padding: '16px', 
                background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)', 
                color: 'white', 
                border: 'none', 
                borderRadius: '16px', 
                fontSize: '1.05rem', 
                fontWeight: 800, 
                cursor: 'pointer', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                gap: '10px', 
                boxShadow: '0 10px 20px -5px rgba(79, 70, 229, 0.4)',
                transition: 'all 0.3s'
              }}
              className="login-button"
            >
              {loading ? <Loader2 className="animate-spin" size={22} /> : <><ArrowRight size={22} /> Masuk Sekarang</>}
            </button>
          </form>

          <div style={{ marginTop: '40px', textAlign: 'center', borderTop: '1px solid #f1f5f9', paddingTop: '32px' }}>
            <p style={{ margin: 0, color: '#64748b', fontSize: '0.95rem', fontWeight: 500 }}>Belum punya akun pendaftaran?</p>
            <Link to="/ppdb" style={{ 
              display: 'inline-block',
              marginTop: '10px',
              color: '#4f46e5', 
              fontWeight: 800, 
              textDecoration: 'none', 
              fontSize: '1rem',
              transition: 'all 0.2s'
            }}
            onMouseOver={(e) => e.target.style.transform = 'translateX(4px)'}
            onMouseOut={(e) => e.target.style.transform = 'translateX(0)'}
            > Daftar PPDB Sekarang &rarr;</Link>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes shake {
          10%, 90% { transform: translate3d(-1px, 0, 0); }
          20%, 80% { transform: translate3d(2px, 0, 0); }
          30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
          40%, 60% { transform: translate3d(4px, 0, 0); }
        }
        .login-input:focus {
          border-color: #4f46e5 !important;
          background: white !important;
          box-shadow: 0 0 0 4px rgba(79, 70, 229, 0.1);
        }
        .login-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 15px 25px -5px rgba(79, 70, 229, 0.5);
          filter: brightness(1.1);
        }
        .login-button:active {
          transform: translateY(0);
        }
        @media (max-width: 480px) {
          .login-container { border-radius: 0; position: absolute; top: 0; bottom: 0; left: 0; right: 0; overflow-y: auto; }
        }
      `}</style>
    </div>
  );
}
