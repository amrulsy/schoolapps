import React from 'react'
import { AlertCircle, RefreshCcw } from 'lucide-react'

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props)
        this.state = { hasError: false, error: null }
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error }
    }

    componentDidCatch(error, errorInfo) {
        console.error("ErrorBoundary caught an error", error, errorInfo)
    }

    handleRefresh = () => {
        window.location.reload()
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{
                    minHeight: '100vh',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#f8fafc',
                    fontFamily: 'Inter, system-ui, sans-serif',
                    padding: '24px',
                    textAlign: 'center',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    zIndex: 99999
                }}>
                    <div style={{
                        maxWidth: '500px',
                        backgroundColor: 'white',
                        padding: '40px',
                        borderRadius: '16px',
                        boxShadow: '0 10px 25px rgba(0,0,0,0.05)',
                        border: '1px solid #e2e8f0'
                    }}>
                        <div style={{
                            width: '80px',
                            height: '80px',
                            borderRadius: '50%',
                            backgroundColor: '#fee2e2',
                            color: '#ef4444',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 20px auto'
                        }}>
                            <AlertCircle size={40} />
                        </div>
                        <h1 style={{ margin: '0 0 16px 0', fontSize: '1.5rem', color: '#0f172a' }}>Oops, Terjadi Kesalahan!</h1>
                        <p style={{ margin: '0 0 32px 0', color: '#64748b', lineHeight: '1.6' }}>
                            Aplikasi mengalami masalah tak terduga. Kami telah mencatat error ini. Silakan muat ulang halaman untuk mencoba lagi.
                        </p>
                        <button
                            onClick={this.handleRefresh}
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '8px',
                                backgroundColor: '#2563eb',
                                color: 'white',
                                border: 'none',
                                padding: '12px 24px',
                                borderRadius: '8px',
                                fontSize: '1rem',
                                fontWeight: '500',
                                cursor: 'pointer',
                                transition: 'background-color 0.2s'
                            }}
                            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#1d4ed8'}
                            onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
                        >
                            <RefreshCcw size={18} />
                            Muat Ulang Halaman
                        </button>
                    </div>
                </div>
            )
        }

        return this.props.children
    }
}

export default ErrorBoundary
