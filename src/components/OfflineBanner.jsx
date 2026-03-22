import { useState, useEffect } from 'react'
import { WifiOff, X } from 'lucide-react'

export default function OfflineBanner() {
    const [isOffline, setIsOffline] = useState(!navigator.onLine)
    const [dismissed, setDismissed] = useState(false)

    useEffect(() => {
        const handleOnline = () => {
            setIsOffline(false)
            setDismissed(false)
        }
        const handleOffline = () => setIsOffline(true)

        window.addEventListener('online', handleOnline)
        window.addEventListener('offline', handleOffline)

        return () => {
            window.removeEventListener('online', handleOnline)
            window.removeEventListener('offline', handleOffline)
        }
    }, [])

    if (!isOffline || dismissed) return null

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            backgroundColor: '#ef4444',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            padding: '12px 48px 12px 24px',
            zIndex: 99999,
            fontFamily: 'Inter, system-ui, sans-serif',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
            transition: 'all 0.3s ease'
        }}>
            <WifiOff size={20} />
            <span style={{ fontWeight: '500', fontSize: '0.95rem' }}>
                Anda sedang offline. Koneksi internet Anda terputus. Beberapa fitur mungkin tidak berfungsi.
            </span>
            <button
                onClick={() => setDismissed(true)}
                style={{
                    position: 'absolute',
                    right: '16px',
                    background: 'none',
                    border: 'none',
                    color: 'white',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '4px',
                    opacity: 0.8
                }}
                onMouseOver={(e) => e.currentTarget.style.opacity = '1'}
                onMouseOut={(e) => e.currentTarget.style.opacity = '0.8'}
            >
                <X size={18} />
            </button>
        </div>
    )
}
