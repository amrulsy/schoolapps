import { useState, useEffect, useRef } from 'react'
import { io } from 'socket.io-client'
import { User, School, Clock, CheckCircle, ArrowRight, ArrowLeft, AlertTriangle, Volume2 } from 'lucide-react'
import api, { API_BASE } from '../../services/api'

export default function GateMonitor() {
    const [scanData, setScanData] = useState(null)
    const [scanInfo, setScanInfo] = useState(null)
    const [rfidInput, setRfidInput] = useState('')
    const [currentTime, setCurrentTime] = useState(new Date())
    const [schoolSettings, setSchoolSettings] = useState(null)
    const [isProcessing, setIsProcessing] = useState(false)
    const [lastError, setLastError] = useState(null)
    const [audioUnlocked, setAudioUnlocked] = useState(false)
    
    const inputRef = useRef(null)
    const timerRef = useRef(null)

    // Load Settings
    useEffect(() => {
        api.get('/admin/school-settings')
           .then(res => setSchoolSettings(res.data))
           .catch(console.error)
    }, [])

    // Socket.io Connection
    useEffect(() => {
        const socketOrigin = API_BASE.replace('/api', '')
        const socket = io(socketOrigin, {
            path: '/api/socket.io',
            transports: ['polling']
        })

        socket.on('connect', () => console.log('[Socket] Connected'))
        socket.on('scan_success', (data) => showScanResult(data))
        socket.on('scan_info', (data) => showScanInfo(data))

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

    // --- Audio Feedback Systems ---
    const playBeep = () => {
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gainNode = ctx.createGain();
            osc.connect(gainNode);
            gainNode.connect(ctx.destination);
            osc.type = 'sine';
            osc.frequency.setValueAtTime(800, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.1);
            gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
            osc.start();
            osc.stop(ctx.currentTime + 0.1);
        } catch(e) {}
    }

    const playBuzzer = () => {
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gainNode = ctx.createGain();
            osc.connect(gainNode);
            gainNode.connect(ctx.destination);
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(150, ctx.currentTime);
            gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
            osc.start();
            osc.stop(ctx.currentTime + 0.4);
        } catch(e) {}
    }

    const speakMessage = (text) => {
        if (!window.speechSynthesis) return;
        window.speechSynthesis.cancel();
        
        // Lowercase the text so the engine reads it as words instead of acronym letters (e.g. BUDI -> b-u-d-i)
        const msg = new SpeechSynthesisUtterance(text.toLowerCase());
        msg.lang = 'id-ID';
        
        // --- VARIASI SUARA ---
        // Cari semua suara bahasa Indonesia yang terinstall di PC/Browser
        const voices = window.speechSynthesis.getVoices();
        const idnVoices = voices.filter(v => v.lang.includes('id') || v.lang.includes('ID'));
        
        if (idnVoices.length > 0) {
            // Pilih satu suara Indonesia secara acak setiap kali absen
            const randomVoice = idnVoices[Math.floor(Math.random() * idnVoices.length)];
            msg.voice = randomVoice;
            
            // Variasikan nada (pitch) sedikit (antara 0.9 sampai 1.25) agar terdengar beda-beda orang
            msg.pitch = Math.random() * 0.35 + 0.9;
            msg.rate = 1.0;
        } else {
            // Jika tidak ada suara spesifik terdeteksi, hanya ubah nadanya saja
            msg.pitch = Math.random() * 0.35 + 0.9;
        }

        window.speechSynthesis.speak(msg);
    }

    // --- Core Logic ---
    const showScanResult = (data) => {
        if (timerRef.current) clearTimeout(timerRef.current)
        setScanInfo(null)
        setScanData(data)
        
        let speechText = '';
        if (data.status === 'masuk') {
            if (data.keterangan === 'Terlambat') {
                speechText = `Maaf ${data.student.nama}, Anda datang terlambat!`;
                playBuzzer();
            } else {
                speechText = `Terima kasih ${data.student.nama}, selamat belajar.`;
                playBeep();
            }
        } else {
            speechText = `Terima kasih ${data.student.nama}, hati-hati di jalan.`;
            playBeep();
        }
        
        // Timeout sedikit agar suara beep selesai dulu
        setTimeout(() => speakMessage(speechText), 200);
        
        timerRef.current = setTimeout(() => {
            setScanData(null)
        }, 5000)
    }

    const unlockAudio = () => {
        setAudioUnlocked(true)
        // Play a silent sound to "prime" the browser's audio engine
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)()
            const osc = ctx.createOscillator()
            const gain = ctx.createGain()
            gain.gain.value = 0
            osc.connect(gain); gain.connect(ctx.destination)
            osc.start(); osc.stop(0.1)
            
            // Speak a small welcome to confirm
            speakMessage("Audio diaktifkan. Selamat datang.")
        } catch(e) { console.error(e) }
    }

    const showScanInfo = (data) => {
        if (timerRef.current) clearTimeout(timerRef.current)
        setScanData(null)
        setScanInfo(data)
        
        if (audioUnlocked) {
            playBuzzer();
            setTimeout(() => speakMessage('Mohon maaf, ' + data.message), 300);
        }

        timerRef.current = setTimeout(() => {
            setScanInfo(null)
        }, 5000)
    }

    const handleManualScan = async (e) => {
        e.preventDefault()
        if (!rfidInput || isProcessing) return
        
        setIsProcessing(true)
        setLastError(null)
        // DONT clear state here immediately so the screen doesn't flicker unnecessarily 
        // until the response arrives

        try {
            const { data } = await api.post('/attendance/scan', { rfid_uid: rfidInput.trim() })
            if (data.success) {
                showScanResult(data);
            } else {
                setLastError(data.error || 'Server error');
                showScanInfo({ message: data.error || 'Terjadi kesalahan sistem', type: 'warning' });
            }
        } catch (err) {
            console.error('Scan error:', err)
            const errMsg = err.response?.data?.error || err.message || 'Kesalahan Koneksi';
            setLastError(errMsg);
            // Fallback display warning immediately
            showScanInfo({ 
                student: { nama: 'Peringatan' },
                message: errMsg,
                type: 'warning' 
            });
        } finally {
            setRfidInput('')
            setIsProcessing(false)
        }
    }

    // Colors logic
    const getBgColor = () => {
        if (scanData) {
            if (scanData.status === 'masuk') return scanData.keterangan === 'Terlambat' ? '#b45309' : '#059669';
            return '#0369a1'; // pulang
        }
        return '#0f172a'; // idle
    }

    return (
        <div className="gate-monitor-container" style={{ 
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
            background: getBgColor(), color: '#fff', zIndex: 9999,
            display: 'flex', flexDirection: 'column', overflow: 'hidden',
            transition: 'background 0.5s ease'
        }}>
            {/* HIDDEN RFID INPUT (Fixed for better focus/browser compatibility) */}
            <form onSubmit={handleManualScan} style={{ position: 'fixed', top: -100, left: -100 }}>
                <input 
                    ref={inputRef} 
                    type="text" 
                    value={rfidInput} 
                    onChange={e => setRfidInput(e.target.value)} 
                    onBlur={() => setTimeout(() => inputRef.current?.focus(), 100)}
                    autoFocus 
                />
            </form>

            {/* HEADER */}
            <header style={{ padding: '20px 40px', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.2)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
                    <div style={{ width: 60, height: 60, background: '#fff', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                        {schoolSettings?.logo_url ? (
                            <img src={`${API_BASE.replace('/api', '')}${schoolSettings.logo_url}`} alt="Logo" style={{ width: '80%', height: '80%', objectFit: 'contain' }} />
                        ) : '🏫'}
                    </div>
                    <div>
                        <h1 style={{ fontSize: '1.8rem', fontWeight: 900, margin: 0, letterSpacing: '-0.025em' }}>GATE MONITOR</h1>
                        <p style={{ margin: 0, fontSize: '0.9rem', color: '#cbd5e1', fontWeight: 600 }}>
                            {schoolSettings?.nama_sekolah || "SISTEM PRESENSI TERPADU"}
                        </p>
                    </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '2.2rem', fontWeight: 800, fontFamily: 'monospace', textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>
                        {currentTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </div>
                    <div style={{ fontSize: '1rem', color: '#cbd5e1', fontWeight: 500 }}>
                        {currentTime.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                    </div>
                </div>
            </header>

            <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                
                {/* AUDIO UNLOCK OVERLAY (For browser compatibility) */}
                {!audioUnlocked && (
                    <div style={{
                        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                        background: 'rgba(0,0,0,0.95)', zIndex: 10000,
                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                        color: '#fff', textAlign: 'center', padding: 20
                    }}>
                        <div className="animate-pulse" style={{ width: 150, height: 150, borderRadius: '50%', background: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 30 }}>
                            <Volume2 size={80} />
                        </div>
                        <h1 style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: 10 }}>AKTIFKAN SUARA</h1>
                        <p style={{ fontSize: '1.2rem', color: '#94a3b8', maxWidth: 500, marginBottom: 40 }}>
                            Klik tombol di bawah satu kali untuk mengaktifkan fitur suara otomatis (Text-to-Speech).
                        </p>
                        <button 
                            onClick={unlockAudio}
                            style={{ 
                                padding: '20px 60px', borderRadius: 20, background: '#3b82f6', color: '#fff', 
                                border: 'none', fontSize: '1.5rem', fontWeight: 900, cursor: 'pointer',
                                boxShadow: '0 10px 30px rgba(59, 130, 246, 0.5)'
                            }}
                        >
                            🚀 MULAI SEKARANG
                        </button>
                    </div>
                )}
                {/* IDLE SCREEN (with Marquee) */}
                {!scanData && !scanInfo && (
                    <div className="animate-pulse" style={{ width: '100%', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <div style={{ 
                            width: 200, height: 200, border: '4px dashed rgba(255,255,255,0.15)', 
                            borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            margin: '0 auto 40px', background: 'rgba(255,255,255,0.02)'
                        }}>
                            {schoolSettings?.logo_url ? (
                                <img src={`${API_BASE.replace('/api', '')}${schoolSettings.logo_url}`} alt="Logo" style={{ width: '50%', height: '50%', objectFit: 'contain', opacity: 0.5, filter: 'grayscale(100%) brightness(200%)' }} />
                            ) : (
                                <School size={80} strokeWidth={1} style={{ opacity: 0.3 }} />
                            )}
                        </div>
                        <h2 style={{ fontSize: '2.5rem', fontWeight: 300, color: '#94a3b8', margin: 0 }}>
                            Silakan Tempelkan Kartu RFID
                        </h2>
                        
                        <div style={{ marginTop: 30, display: 'flex', gap: 15, justifyContent: 'center' }}>
                            <span style={{ padding: '8px 16px', background: 'rgba(255,255,255,0.05)', borderRadius: 10, fontSize: '1rem', color: '#64748b', fontWeight: 600 }}>Scanner Ready 🟢</span>
                            <span style={{ padding: '8px 16px', background: 'rgba(59,130,246,0.15)', borderRadius: 10, fontSize: '1rem', color: '#60a5fa', fontWeight: 600 }}>Server Connected ⚡</span>
                        </div>
                    </div>
                )}

                {/* WARNING OVERLAY */}
                {scanInfo && (
                    <div className="card shadow-2xl p-4 animate-bounceIn text-center" style={{
                        width: '90%', maxWidth: 600, background: '#fff', color: '#0f172a',
                        borderRadius: 30, overflow: 'hidden', padding: '50px'
                    }}>
                        <div style={{ 
                            width: 120, height: 120, background: scanInfo.type === 'warning' ? '#fef3c7' : '#f1f5f9', 
                            borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            margin: '0 auto 20px', color: scanInfo.type === 'warning' ? '#d97706' : '#64748b'
                        }}>
                            <AlertTriangle size={64} />
                        </div>
                        <h2 style={{ fontSize: '1.5rem', color: '#64748b', margin: 0 }}>{scanInfo.student.nama}</h2>
                        <h1 style={{ fontSize: '3rem', fontWeight: 900, margin: '15px 0' }}>{scanInfo.message}</h1>
                        {scanInfo.subMessage && (
                            <p style={{ fontSize: '1.4rem', color: '#b45309', fontWeight: 700 }}>{scanInfo.subMessage}</p>
                        )}
                        <div style={{ marginTop: 30, paddingTop: 20, borderTop: '2px dashed #f1f5f9', fontSize: '1.1rem', color: '#94a3b8', fontWeight: 500 }}>
                            Mohon perhatikan instruksi di atas atau hubungi petugas piket.
                        </div>
                    </div>
                )}

                {/* SUCCESS SCREEN */}
                {scanData && (
                    <div className="card shadow-2xl p-5 animate-bounceIn" style={{
                        width: '90%', maxWidth: 900, background: '#fff', color: '#0f172a',
                        borderRadius: 40, overflow: 'hidden', display: 'flex', gap: 40,
                        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)'
                    }}>
                        {/* Avatar Section - PHOTO VERIFICATION */}
                        <div style={{ flexShrink: 0 }}>
                            <div style={{ 
                                width: 300, height: 350, background: '#f8fafc', 
                                borderRadius: 30, border: '4px solid #e2e8f0',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '8rem', color: '#94a3b8', overflow: 'hidden',
                                boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.05)'
                            }}>
                                {scanData.student.foto ? (
                                    <img src={`${API_BASE.replace('/api', '')}${scanData.student.foto}`} alt="Foto Siswa" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                    scanData.student.jk === 'P' ? '👩‍🎓' : '👨‍🎓'
                                )}
                            </div>
                        </div>

                        {/* Info Section */}
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                                <div style={{ 
                                    padding: '10px 20px', borderRadius: 12, 
                                    background: scanData.status === 'masuk' ? (scanData.keterangan === 'Terlambat' ? '#fef2f2' : '#dcfce7') : '#e0f2fe',
                                    color: scanData.status === 'masuk' ? (scanData.keterangan === 'Terlambat' ? '#991b1b' : '#166534') : '#075985', 
                                    fontWeight: 900, fontSize: '1.2rem',
                                    display: 'flex', alignItems: 'center', gap: 8
                                }}>
                                    {scanData.status === 'masuk' ? <ArrowRight size={24}/> : <ArrowLeft size={24}/>}
                                    {scanData.keterangan === 'Terlambat' ? 'TERLAMBAT' : `${scanData.status.toUpperCase()} PRESENSI`}
                                </div>
                                <div style={{ fontSize: '1.5rem', color: '#64748b', fontWeight: 700 }}>
                                    <Clock size={24} style={{ verticalAlign: 'middle', marginRight: 8, marginTop: -3 }} />
                                    {scanData.time}
                                </div>
                            </div>

                            <h1 style={{ fontSize: '3.8rem', fontWeight: 900, margin: '0 0 10px', letterSpacing: '-0.05em', lineHeight: 1 }}>
                                {scanData.student.nama}
                            </h1>
                            <div style={{ fontSize: '1.8rem', color: '#475569', fontWeight: 600, marginBottom: 35 }}>
                                {scanData.student.kelas} • <span className="mono">{scanData.student.nisn}</span>
                            </div>

                            <div style={{ 
                                padding: '24px', 
                                background: scanData.status === 'masuk' ? (scanData.keterangan === 'Terlambat' ? '#fef2f2' : '#f0fdf4') : '#f0f9ff', 
                                borderRadius: 24, 
                                border: `2px solid ${scanData.status === 'masuk' ? (scanData.keterangan === 'Terlambat' ? '#fecaca' : '#bbf7d0') : '#bae6fd'}`,
                                display: 'flex', alignItems: 'center', gap: 20
                            }}>
                                <div style={{ color: scanData.status === 'masuk' ? (scanData.keterangan === 'Terlambat' ? '#ef4444' : '#22c55e') : '#3b82f6' }}>
                                    {scanData.keterangan === 'Terlambat' ? <AlertTriangle size={48} /> : <CheckCircle size={48} />}
                                </div>
                                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: scanData.status === 'masuk' ? (scanData.keterangan === 'Terlambat' ? '#991b1b' : '#166534') : '#0369a1' }}>
                                    {scanData.status === 'masuk' 
                                        ? (scanData.keterangan === 'Terlambat' ? 'Maaf, Anda Datang Terlambat!' : 'Selamat Datang, Selamat Belajar!') 
                                        : 'Sampai Jumpa, Hati-hati di Jalan!'}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </main>

            {/* Scrolling Marquee Footer */}
            <footer style={{ background: '#020617', padding: '15px 0', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', overflow: 'hidden' }}>
                <div style={{ whiteSpace: 'nowrap', animation: 'marquee 25s linear infinite', fontSize: '1.2rem', fontWeight: 600, color: '#94a3b8' }}>
                    <span style={{ margin: '0 50px' }}>🌟 Selamat Datang di {schoolSettings?.nama_sekolah || 'Sistem Gate Terpadu'} 🌟</span>
                    <span style={{ margin: '0 50px' }}>📌 Harap siapkan kartu RFID Anda untuk discan sebelum melewati gerbang.</span>
                    <span style={{ margin: '0 50px' }}>🔔 Kedisiplinan adalah kunci kesuksesan! Jangan sampai terlambat!</span>
                </div>
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
                @keyframes marquee {
                    0% { transform: translateX(100vw); }
                    100% { transform: translateX(-100%); }
                }
                .mono {
                    font-family: monospace;
                    background: #f1f5f9;
                    padding: 4px 10px;
                    border-radius: 8px;
                }
            `}</style>
        </div>
    )
}
