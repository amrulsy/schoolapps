import { Helmet } from 'react-helmet-async'
import { useNavigate, Link } from 'react-router-dom'
import { Home, ArrowLeft, AlertTriangle } from 'lucide-react'

export default function PortalNotFound() {
    const navigate = useNavigate()

    return (
        <div className="portal-page" style={{
            minHeight: '60vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '40px 20px',
            textAlign: 'center'
        }}>
            <Helmet>
                <title>404 Halaman Tidak Ditemukan | Portal SMK PPRQ</title>
                <meta name="description" content="Halaman yang Anda cari tidak ditemukan." />
                <meta name="robots" content="noindex, nofollow" />
            </Helmet>

            <div className="portal-container" style={{
                maxWidth: '600px',
                backgroundColor: 'var(--portal-bg)',
                padding: '40px',
                borderRadius: '16px',
                boxShadow: '0 10px 30px rgba(0,0,0,0.05)',
                border: '1px solid var(--portal-border)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '24px'
            }}>
                <div style={{
                    width: '100px',
                    height: '100px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ef4444',
                    marginBottom: '10px'
                }}>
                    <AlertTriangle size={48} />
                </div>

                <h1 style={{
                    fontSize: '4.5rem',
                    fontWeight: '800',
                    color: 'var(--portal-primary)',
                    margin: '0',
                    lineHeight: '1'
                }}>
                    404
                </h1>

                <div>
                    <h2 style={{
                        fontSize: '1.75rem',
                        fontWeight: '700',
                        color: 'var(--portal-text)',
                        marginBottom: '12px'
                    }}>
                        Halaman Tidak Ditemukan
                    </h2>
                    <p style={{
                        color: 'var(--portal-text-muted)',
                        fontSize: '1.1rem',
                        margin: '0',
                        maxWidth: '400px',
                        lineHeight: '1.5'
                    }}>
                        Maaf, halaman yang Anda tuju mungkin telah dipindahkan, dihapus, atau tidak pernah ada.
                    </p>
                </div>

                <div style={{
                    display: 'flex',
                    gap: '16px',
                    marginTop: '20px',
                    flexWrap: 'wrap',
                    justifyContent: 'center'
                }}>
                    <button
                        onClick={() => navigate(-1)}
                        className="portal-btn portal-btn-outline-dark"
                        style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                    >
                        <ArrowLeft size={18} />
                        Kembali
                    </button>
                    <Link
                        to="/"
                        className="portal-btn portal-btn-primary"
                        style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}
                    >
                        <Home size={18} />
                        Halaman Utama
                    </Link>
                </div>
            </div>
        </div>
    )
}
