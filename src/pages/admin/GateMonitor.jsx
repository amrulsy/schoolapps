import { useState, useEffect, useRef } from 'react'
import { io } from 'socket.io-client'
import { User, School, Clock, CheckCircle, ArrowRight, ArrowLeft } from 'lucide-react'
import api, { API_BASE } from '../../services/api'

export default function GateMonitor() {
    const [scanData, setScanData] = useState(null)
    const [scanInfo, setScanInfo] = useState(null)
    const [rfidInput, setRfidInput] = useState('')
    const [currentTime, setCurrentTime] = useState(new Date())
    const inputRef = useRef(null)
    const timerRef = useRef(null)

    // Socket.io Connection
    useEffect(() => {
        // Gunakan origin dari API_BASE (buang /api di ujungnya)
        const socketOrigin = API_BASE.replace('/api', '')
        const socket = io(socketOrigin)

        socket.on('connect', () => console.log('[Socket] Connected'))
        socket.on('scan_success', (data) => {
            showScanResult(data)
        })

        socket.on('scan_info', (data) => {
            showScanInfo(data)
        })

        return () => socket.disconnect()
    }, [])

    // Clock
    useEffect(() => {
        const interval = setInterval(() => setCurrentTime(new Date()), 1000)
        return () => clearInterval(interval)
    }, [])

    // Auto-focus input
    useEffect(() => {
        const focusInput = () => inputRef.current?.focus()
        focusInput()
        document.addEventListener('click', focusInput)
        return () => document.removeEventListener('click', focusInput)
    }, [])

    const showScanResult = (data) => {
        if (timerRef.current) clearTimeout(timerRef.current)
        setScanInfo(null)
        setScanData(data)
        
        timerRef.current = setTimeout(() => {
            setScanData(null)
        }, 4000) // 4 seconds display
    }

    const showScanInfo = (data) => {
        if (timerRef.current) clearTimeout(timerRef.current)
        setScanData(null)
        setScanInfo(data)
        
        timerRef.current = setTimeout(() => {
            setScanInfo(null)
        }, 4000)
    }

    const handleManualScan = async (e) => {
        e.preventDefault()
        if (!rfidInput) return

        try {
            const { data } = await api.post('/attendance/scan', { rfid_uid: rfidInput })
            if (!data.success) {
                // Handle error (optional UI)
                console.error(data.error)
            }
        } catch (err) {
            console.error('Scan error:', err)
        } finally {
            setRfidInput('')
        }
    }

    return (
        <div className="gate-monitor-container" style={{ 
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
            background: '#0f172a', color: '#fff', zIndex: 9999,
            display: 'flex', flexDirection: 'column', overflow: 'hidden'
        }}>
            {/* Hidden Input for Keyboard-based Scanners */}
            <form onSubmit={handleManualScan} style={{ position: 'absolute', opacity: 0, pointerEvents: 'none' }}>
                <input
                    ref={inputRef}
                    type="text"
                    value={rfidInput}
                    onChange={e => setRfidInput(e.target.value)}
                    autoFocus
                />
            </form>

            <header style={{ padding: '20px 40px', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
                    <div style={{ width: 50, height: 50, background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)', borderRadius: 12, display: 'flex', alignItems: 'center', justifySelf: 'center', justifyContent: 'center', fontSize: 24 }}>🏫</div>
                    <div>
                        <h1 style={{ fontSize: '1.5rem', fontWeight: 900, margin: 0, letterSpacing: '-0.025em' }}>GATE MONITOR</h1>
                        <p style={{ margin: 0, fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600 }}>SMK PEMBANGUNAN PERTANIAN RAUDLATUL QUR'AN</p>
                    </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1.8rem', fontWeight: 800, fontFamily: 'monospace' }}>
                        {currentTime.toLocaleTimeString('id-ID')}
                    </div>
                    <div style={{ fontSize: '0.9rem', color: '#94a3b8' }}>
                        {currentTime.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                    </div>
                </div>
            </header>

            <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                
                {/* Default Screen */}
                {!scanData && !scanInfo && (
                    <div className="animate-pulse" style={{ textAlign: 'center' }}>
                        <div style={{ 
                            width: 200, height: 200, border: '4px dashed rgba(255,255,255,0.1)', 
                            borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            margin: '0 auto 30px'
                        }}>
                            <School size={80} strokeWidth={1} style={{ opacity: 0.2 }} />
                        </div>
                        <h2 style={{ fontSize: '2rem', fontWeight: 300, color: '#64748b' }}>Silakan Tempelkan Kartu RFID Anda</h2>
                        <div style={{ marginTop: 20, display: 'flex', gap: 10, justifyContent: 'center' }}>
                            <span style={{ padding: '6px 12px', background: 'rgba(255,255,255,0.05)', borderRadius: 8, fontSize: '0.8rem', color: '#475569' }}>Scanner Ready</span>
                            <span style={{ padding: '6px 12px', background: 'rgba(59,130,246,0.1)', borderRadius: 8, fontSize: '0.8rem', color: '#3b82f6' }}>Server Connected</span>
                        </div>
                    </div>
                )}

                {/* Scan Info/Warning (Duplicate Tap) */}
                {scanInfo && (
                    <div className="scan-result-overlay" style={{
                        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                        background: scanInfo.type === 'warning' ? '#b45309' : '#334155',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        zIndex: 10, transition: 'all 0.5s'
                    }}>
                        <div className="card shadow-2xl p-4 animate-bounceIn text-center" style={{
                            width: '90%', maxWidth: 500, background: '#fff', color: '#0f172a',
                            borderRadius: 30, overflow: 'hidden', padding: '40px'
                        }}>
                             <div style={{ 
                                width: 100, height: 100, background: scanInfo.type === 'warning' ? '#fef3c7' : '#f1f5f9', 
                                borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                margin: '0 auto 20px', color: scanInfo.type === 'warning' ? '#d97706' : '#64748b'
                            }}>
                                <Clock size={48} />
                            </div>
                            <h2 style={{ fontSize: '1.2rem', color: '#64748b', margin: 0 }}>{scanInfo.student.nama}</h2>
                            <h1 style={{ fontSize: '2.5rem', fontWeight: 900, margin: '10px 0' }}>{scanInfo.message}</h1>
                            {scanInfo.subMessage && (
                                <p style={{ fontSize: '1.2rem', color: '#d97706', fontWeight: 600 }}>{scanInfo.subMessage}</p>
                            )}
                            <div style={{ marginTop: 20, paddingTop: 20, borderTop: '1px solid #f1f5f9', fontSize: '0.9rem', color: '#94a3b8' }}>
                                Mohon tap kartu kembali untuk absen pulang saat sekolah usai.
                            </div>
                        </div>
                    </div>
                )}

                {/* Scan Success Card */}
                {scanData && (
                    <div className="scan-result-overlay" style={{
                        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                        background: scanData.status === 'masuk' ? '#059669' : '#0369a1',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        zIndex: 10, transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)'
                    }}>
                        <div className="card shadow-2xl p-5 animate-bounceIn" style={{
                            width: '90%', maxWidth: 800, background: '#fff', color: '#0f172a',
                            borderRadius: 40, overflow: 'hidden', display: 'flex', gap: 40,
                            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)'
                        }}>
                            {/* Avatar Section */}
                            <div style={{ flexShrink: 0 }}>
                                <div style={{ 
                                    width: 250, height: 300, background: '#f8fafc', 
                                    borderRadius: 30, border: '1px solid #e2e8f0',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: '8rem', fontWeight: 900, color: '#3b82f6'
                                }}>
                                    {scanData.student.nama.charAt(0)}
                                </div>
                            </div>

                            {/* Info Section */}
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 15 }}>
                                    <div style={{ 
                                        padding: '8px 16px', borderRadius: 12, background: scanData.status === 'masuk' ? '#dcfce7' : '#e0f2fe',
                                        color: scanData.status === 'masuk' ? '#166534' : '#075985', fontWeight: 900, fontSize: '1rem',
                                        display: 'flex', alignItems: 'center', gap: 8
                                    }}>
                                        {scanData.status === 'masuk' ? <ArrowRight size={20}/> : <ArrowLeft size={20}/>}
                                        {scanData.status.toUpperCase()} PRESENSI
                                    </div>
                                    <div style={{ fontSize: '1.2rem', color: '#64748b', fontWeight: 600 }}>
                                        <Clock size={20} style={{ verticalAlign: 'middle', marginRight: 5 }} />
                                        {scanData.time}
                                    </div>
                                </div>

                                <h1 style={{ fontSize: '3.5rem', fontWeight: 900, margin: '0 0 10px', letterSpacing: '-0.05em', lineHeight: 1 }}>
                                    {scanData.student.nama}
                                </h1>
                                <div style={{ fontSize: '1.5rem', color: '#475569', fontWeight: 600, marginBottom: 30 }}>
                                    {scanData.student.kelas} • <span className="mono">{scanData.student.nisn}</span>
                                </div>

                                <div style={{ 
                                    padding: '24px', background: scanData.status === 'masuk' ? '#f0fdf4' : '#f0f9ff', 
                                    borderRadius: 24, border: `2px solid ${scanData.status === 'masuk' ? '#bbf7d0' : '#bae6fd'}`,
                                    display: 'flex', alignItems: 'center', gap: 20
                                }}>
                                    <div style={{ color: scanData.status === 'masuk' ? '#22c55e' : '#3b82f6' }}>
                                        <CheckCircle size={48} />
                                    </div>
                                    <div style={{ fontSize: '1.4rem', fontWeight: 700, color: scanData.status === 'masuk' ? '#166534' : '#0369a1' }}>
                                        {scanData.status === 'masuk' ? 'Selamat Datang, Selamat Belajar!' : 'Sampai Jumpa, Hati-hati di Jalan!'}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </main>

            <footer style={{ padding: '20px', textAlign: 'center', fontSize: '0.8rem', color: '#475569', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                SIAS &copy; 2026 • SMK Pembangunan Pertanian Raudlatul Qur'an • Automated Gate System v1.0
            </footer>

            <style>{`
                @keyframes bounceIn {
                    0% { transform: scale(0.3); opacity: 0; }
                    50% { transform: scale(1.05); opacity: 1; }
                    70% { transform: scale(0.9); }
                    100% { transform: scale(1); }
                }
                .animate-bounceIn {
                    animation: bounceIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
                }
                .animate-pulse {
                    animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
                }
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: .7; }
                }
            `}</style>
        </div>
    )
}
