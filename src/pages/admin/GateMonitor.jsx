import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { io } from 'socket.io-client'
import * as faceapi from '@vladmandic/face-api'
import {
    School, Clock, CheckCircle, ArrowRight, ArrowLeft, AlertTriangle, Volume2, History,
    SortDesc, SortAsc, X, Download, Search, Scan
} from 'lucide-react'
import api, { API_BASE } from '../../services/api'

export default function GateMonitor() {
    const [scanData, setScanData] = useState(null)
    const [scanInfo, setScanInfo] = useState(null)
    const [rfidInput, setRfidInput] = useState('')
    const [currentTime, setCurrentTime] = useState(new Date())
    const [schoolSettings, setSchoolSettings] = useState(null)
    const [isProcessing, setIsProcessing] = useState(false)

    const [audioUnlocked, setAudioUnlocked] = useState(false)
    const [tapLog, setTapLog] = useState([])
    const [logSearch, setLogSearch] = useState('')
    const [sortOldest, setSortOldest] = useState(false)
    const [newEntryId, setNewEntryId] = useState(null)
    const [isShaking, setIsShaking] = useState(false)
    const [isModelsLoaded, setIsModelsLoaded] = useState(false)

    const inputRef = useRef(null)
    const timerRef = useRef({})
    const videoRef = useRef(null)
    const [stream, setStream] = useState(null)

    // Load FaceAPI Models
    useEffect(() => {
        const loadModels = async () => {
            try {
                await Promise.all([
                    faceapi.nets.ssdMobilenetv1.loadFromUri('/models'),
                    faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
                    faceapi.nets.faceRecognitionNet.loadFromUri('/models')
                ])
                setIsModelsLoaded(true)
            } catch (err) {
                console.error('FaceAPI Init Error', err)
            }
        }
        loadModels()
    }, [])

    // Start Webcam once models load
    useEffect(() => {
        if (!isModelsLoaded) return
        let mediaStream = null
        const startVideo = async () => {
            try {
                mediaStream = await navigator.mediaDevices.getUserMedia({ video: true })
                setStream(mediaStream)
            } catch (err) {
                console.error("Camera access denied", err)
            }
        }
        startVideo()
        return () => {
            if (mediaStream) mediaStream.getTracks().forEach(track => track.stop())
        }
    }, [isModelsLoaded])

    // Load Settings + initial tap log
    useEffect(() => {
        api.get('/admin/school-settings')
            .then(res => setSchoolSettings(res.data))
            .catch(console.error)

        // Load existing tap history for today
        api.get('/admin/presensi/tap-log')
            .then(res => setTapLog(res.data || []))
            .catch(console.error)
    }, [])



    // Clock — R-9: Explicitly use WIB (Asia/Jakarta) timezone
    useEffect(() => {
        const interval = setInterval(() => setCurrentTime(new Date()), 1000)
        return () => clearInterval(interval)
    }, [])

    const formatWIBTime = (date) => {
        return date.toLocaleTimeString('id-ID', { timeZone: 'Asia/Jakarta', hour: '2-digit', minute: '2-digit', second: '2-digit' })
    }
    const formatWIBDate = (date) => {
        return date.toLocaleDateString('id-ID', { timeZone: 'Asia/Jakarta', weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    }

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
        } catch (e) { /* ignore audio context error */ }
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
        } catch (e) { /* ignore audio context error */ }
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

    // --- Core Logic (useCallback so socket useEffect closes over stable refs) ---
    const showScanResult = useCallback((data) => {
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

        // Panggil langsung tanpa timeout
        speakMessage(speechText);

        timerRef.current = setTimeout(() => {
            setScanData(null)
        }, 5000)
    }, [timerRef])

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
        } catch (e) { console.error(e) }
    }

    const showScanInfo = useCallback((data) => {
        if (timerRef.current) clearTimeout(timerRef.current)
        setScanData(null)
        setScanInfo(data)

        if (audioUnlocked) {
            playBuzzer();
            speakMessage('Mohon maaf, ' + data.message);
        } else {
            // Bug 3 Fix: No audio available — shake the screen so operator notices visually
            setIsShaking(true)
            setTimeout(() => setIsShaking(false), 700)
        }

        timerRef.current = setTimeout(() => {
            setScanInfo(null)
        }, 5000)
    }, [audioUnlocked, timerRef])

    // Socket.io Connection
    useEffect(() => {
        const socketOrigin = API_BASE.replace('/api', '')
        const socket = io(socketOrigin, {
            path: '/api/socket.io',
            transports: ['polling']
        })

        socket.on('connect', () => console.log('[Socket] Connected'))
        socket.on('scan_success', (data) => {
            showScanResult(data)
            // Refresh tap log from server to get the latest persisted entry
            api.get('/admin/presensi/tap-log')
                .then(res => {
                    const logs = res.data || []
                    setTapLog(logs)
                    // Highlight the newest entry for 4 seconds
                    if (logs.length > 0) {
                        setNewEntryId(logs[0].id)
                        setTimeout(() => setNewEntryId(null), 4000)
                    }
                })
                .catch(() => { /* ignore refresh error */ })
        })
        socket.on('scan_info', (data) => showScanInfo(data))

        return () => socket.disconnect()
    }, [showScanResult, showScanInfo])

    const handleManualScan = async (e) => {
        e.preventDefault()
        if (!rfidInput || isProcessing) return

        setIsProcessing(true)
        let isFaceVerified = false;
        try {
            // Anti-Titip Absen: Face Check
            try {
                if (schoolSettings?.face_recognition_enabled === 'true') {
                    const checkRes = await api.get(`/attendance/check-rfid/${rfidInput.trim()}`)
                    const student = checkRes.data.student
                    
                    if (student.face_descriptor) {
                        if (!videoRef.current) {
                        showScanInfo({ message: 'Kamera tidak aktif', type: 'warning' })
                        throw new Error('Kamera mati')
                    }
                        // Face detection with retries to account for motion blur during tap
                        let detection = null;
                        const options = new faceapi.SsdMobilenetv1Options({ minConfidence: 0.35 });
                        for (let attempt = 1; attempt <= 5; attempt++) {
                            detection = await faceapi.detectSingleFace(videoRef.current, options).withFaceLandmarks().withFaceDescriptor();
                            if (detection) break;
                            if (attempt < 5) await new Promise(r => setTimeout(r, 200));
                        }

                        if (!detection) {
                            showScanInfo({ 
                                student: { nama: student.nama, kelas: student.kelas_nama, nisn: student.nisn },
                                message: 'Wajah Tidak Terlihat', 
                                type: 'warning', 
                                subMessage: 'Harap hadapkan wajah ke kamera (Tahan sebentar)' 
                            })
                            throw new Error('No face in camera')
                        }
                    
                    const savedDescriptor = new Float32Array(JSON.parse(student.face_descriptor))
                    const distance = faceapi.euclideanDistance(detection.descriptor, savedDescriptor)
                    // The lower the distance, the higher the accuracy. > 0.45 threshold.
                    if (distance > 0.48) {
                        showScanInfo({ 
                            student: { nama: student.nama, kelas: student.kelas_nama, nisn: student.nisn },
                            message: 'Wajah Tidak Cocok!', 
                            subMessage: 'Akses Ditolak (Anti-Titip Absen)',
                            type: 'warning' 
                        })
                        setIsShaking(true)
                        setTimeout(() => setIsShaking(false), 700)
                        throw new Error('Face mismatch')
                    }
                    isFaceVerified = true;
                    } else {
                        showScanInfo({ 
                            student: { nama: student.nama, kelas: student.kelas_nama, nisn: student.nisn },
                            message: 'Wajah Belum Diregistrasi', 
                            subMessage: 'Hubungi admin untuk mendaftarkan wajah Anda',
                            type: 'warning' 
                        })
                        throw new Error('Belum registrasi wajah')
                    }
                }
            } catch (checkErr) {
                const msg = checkErr.message;
                if (['No face in camera', 'Face mismatch', 'Kamera mati', 'Belum registrasi wajah'].includes(msg)) {
                     setRfidInput('')
                     setIsProcessing(false)
                     return; // Abort tap
                }
                // Other errors (like 404/429) proceed to api.post for standard handling
            }

            const { data } = await api.post('/attendance/scan', { rfid_uid: rfidInput.trim(), face_verified: isFaceVerified })
            if (data.success) {
                showScanResult(data)
            } else {
                showScanInfo({ message: data.error || 'Terjadi kesalahan sistem', type: 'warning' })
            }
        } catch (err) {
            console.error('Scan error:', err)
            const errMsg = err.response?.data?.error || err.message || 'Kesalahan Koneksi'
            showScanInfo({
                student: { nama: 'Peringatan' },
                message: errMsg,
                type: 'warning'
            })
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

    const getLogBadgeStyle = (entry) => {
        if (entry.last_event === 'pulang') return { bg: '#0369a1', label: 'Pulang', icon: '🔙' }
        if (entry.status === 'Terlambat') return { bg: '#b45309', label: 'Terlambat', icon: '⏰' }
        return { bg: '#059669', label: 'Masuk', icon: '✅' }
    }

    // Log stats computed
    // NOTE: hadir & terlambat count by *original attendance status* (not filtered by last_event),
    // so the counts don't drop when a student taps out (pulang). Pulang is a separate counter.
    const logStats = useMemo(() => ({
        hadir: tapLog.filter(e => e.status !== 'Terlambat').length,
        terlambat: tapLog.filter(e => e.status === 'Terlambat').length,
        pulang: tapLog.filter(e => e.last_event === 'pulang').length,
    }), [tapLog])

    // Filtered + sorted log entries
    const filteredLog = useMemo(() => {
        const q = logSearch.toLowerCase()
        const filtered = q
            ? tapLog.filter(e => e.nama?.toLowerCase().includes(q) || e.kelas?.toLowerCase().includes(q))
            : tapLog
        return sortOldest ? [...filtered].reverse() : filtered
    }, [tapLog, logSearch, sortOldest])

    // CSV Export
    const handleExportCSV = useCallback(() => {
        if (tapLog.length === 0) return
        const today = new Date().toLocaleDateString('id-ID', { timeZone: 'Asia/Jakarta' }).replace(/\//g, '-')
        const rows = [
            ['No', 'Nama', 'Kelas', 'Status', 'Jam Masuk', 'Jam Pulang'],
            ...tapLog.map((e, i) => [
                i + 1, e.nama || '-', e.kelas || '-',
                e.last_event === 'pulang' ? 'Pulang' : (e.status || 'Hadir'),
                e.jam_masuk || '-', e.jam_pulang || '-'
            ])
        ]
        const csv = rows.map(r => r.map(v => `"${v}"`).join(',')).join('\n')
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a'); a.href = url
        a.download = `Log_Tap_${today}.csv`
        document.body.appendChild(a); a.click()
        document.body.removeChild(a); URL.revokeObjectURL(url)
    }, [tapLog])

    return (
        <div className={`gate-monitor-container${isShaking ? ' gate-shake' : ''}`} style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: getBgColor(), color: '#fff', zIndex: 9999,
            display: 'flex', flexDirection: 'column', overflowY: 'auto', overflowX: 'hidden',
            transition: 'background 0.5s ease',
            outline: isShaking ? '6px solid #ef4444' : 'none'
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
            <header className="gate-header">
                <div className="gate-header-left">
                    <div className="gate-header-logo">
                        {schoolSettings?.logo_url ? (
                            <img src={`${API_BASE.replace('/api', '')}${schoolSettings.logo_url}`} alt="Logo" style={{ width: '80%', height: '80%', objectFit: 'contain' }} />
                        ) : '🏫'}
                    </div>
                    <div>
                        <h1 className="gate-title">GATE MONITOR</h1>
                        <p style={{ margin: 0, fontSize: '0.9rem', color: '#cbd5e1', fontWeight: 600 }}>
                            {schoolSettings?.nama_sekolah || "SISTEM PRESENSI TERPADU"}
                        </p>
                    </div>
                </div>
                <div className="gate-header-right">
                    <div className="gate-time">
                        {formatWIBTime(currentTime)}
                    </div>
                    <div className="gate-date">
                        {formatWIBDate(currentTime)}
                    </div>
                </div>
            </header>

            <main className="gate-main">
                {/* CENTER: Main scan area */}
                <div className="gate-center-area">

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
                            <h2 style={{ fontSize: '1.5rem', color: '#64748b', margin: 0 }}>{scanInfo.student?.nama || 'Peringatan'}</h2>
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
                        <div className="gate-success-card">
                            {/* Avatar Section - PHOTO VERIFICATION */}
                            <div style={{ flexShrink: 0, alignSelf: 'center' }}>
                                <div className="gate-avatar">
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
                                        {scanData.status === 'masuk' ? <ArrowRight size={24} /> : <ArrowLeft size={24} />}
                                        {scanData.keterangan === 'Terlambat' ? 'TERLAMBAT' : `${scanData.status.toUpperCase()} PRESENSI`}
                                    </div>
                                    <div style={{ fontSize: '1.5rem', color: '#64748b', fontWeight: 700 }}>
                                        <Clock size={24} style={{ verticalAlign: 'middle', marginRight: 8, marginTop: -3 }} />
                                        {scanData.time}
                                    </div>
                                </div>

                                <h1 className="gate-student-name">
                                    {scanData.student.nama}
                                </h1>
                                <div className="gate-student-info">
                                    <span>{scanData.student.kelas} • <span className="mono">{scanData.student.nisn}</span></span>
                                    {scanData.face_verified && (
                                        <div className="animate-bounceIn" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '1rem', padding: '6px 14px', background: '#ecfdf5', color: '#059669', borderRadius: 20, border: '2px solid #34d399', fontWeight: 700, boxShadow: '0 4px 10px rgba(52,211,153,0.2)' }}>
                                            <Scan size={18} /> Wajah Cocok
                                        </div>
                                    )}
                                </div>

                                <div className="gate-success-box" style={{
                                    background: scanData.status === 'masuk' ? (scanData.keterangan === 'Terlambat' ? '#fef2f2' : '#f0fdf4') : '#f0f9ff',
                                    border: `2px solid ${scanData.status === 'masuk' ? (scanData.keterangan === 'Terlambat' ? '#fecaca' : '#bbf7d0') : '#bae6fd'}`,
                                }}>
                                    <div style={{ color: scanData.status === 'masuk' ? (scanData.keterangan === 'Terlambat' ? '#ef4444' : '#22c55e') : '#3b82f6' }}>
                                        {scanData.keterangan === 'Terlambat' ? <AlertTriangle size={48} /> : <CheckCircle size={48} />}
                                    </div>
                                    <div className="gate-success-msg" style={{ color: scanData.status === 'masuk' ? (scanData.keterangan === 'Terlambat' ? '#991b1b' : '#166534') : '#0369a1' }}>
                                        {scanData.status === 'masuk'
                                            ? (scanData.keterangan === 'Terlambat' ? 'Maaf, Anda Datang Terlambat!' : 'Selamat Datang, Selamat Belajar!')
                                            : 'Sampai Jumpa, Hati-hati di Jalan!'}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>{/* end center area */}

                {/* WEBCAM PIP */}
                {isModelsLoaded && schoolSettings?.face_recognition_enabled === 'true' && (
                    <div className="gate-webcam-pip">
                        <video ref={el => {
                            videoRef.current = el;
                            if (el && stream && el.srcObject !== stream) {
                                el.srcObject = stream;
                            }
                        }} autoPlay muted playsInline style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }} />
                        <div style={{ position: 'absolute', bottom: 10, right: 10, background: 'rgba(239, 68, 68, 0.9)', padding: '4px 10px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 6 }}>
                            <div className="animate-pulse" style={{ width: 8, height: 8, background: '#fff', borderRadius: '50%' }} /> REC
                        </div>
                        <div style={{ position: 'absolute', top: 10, left: 10, background: 'rgba(0, 0, 0, 0.6)', padding: '4px 8px', borderRadius: 6, fontSize: '0.7rem', fontWeight: 600 }}>
                            <Scan size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} /> AI Aktif
                        </div>
                    </div>
                )}

                {/* RIGHT: Live Tap Log Panel — always visible */}
                <div className="gate-sidebar">
                    {/* Log Header */}
                    <div style={{
                        padding: '12px 14px',
                        borderBottom: '1px solid rgba(255,255,255,0.08)',
                        background: 'rgba(0,0,0,0.25)'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                            <History size={15} style={{ color: '#60a5fa', flexShrink: 0 }} />
                            <span style={{ fontWeight: 800, fontSize: '0.75rem', letterSpacing: '1px', color: '#94a3b8', textTransform: 'uppercase', flex: 1 }}>
                                Log Tap Hari Ini
                            </span>
                            <span style={{
                                background: '#3b82f6', color: '#fff',
                                borderRadius: 20, fontSize: '0.65rem', fontWeight: 800, padding: '2px 8px'
                            }}>{tapLog.length}</span>
                        </div>

                        {/* Mini Stats */}
                        <div style={{ display: 'flex', gap: 5, marginBottom: 10 }}>
                            {[
                                { label: 'Hadir', val: logStats.hadir, color: '#10b981', bg: 'rgba(16,185,129,0.15)' },
                                { label: 'Lambat', val: logStats.terlambat, color: '#f59e0b', bg: 'rgba(245,158,11,0.15)' },
                                { label: 'Pulang', val: logStats.pulang, color: '#60a5fa', bg: 'rgba(96,165,250,0.15)' },
                            ].map(s => (
                                <div key={s.label} style={{
                                    flex: 1, textAlign: 'center', padding: '5px 4px',
                                    background: s.bg, borderRadius: 8,
                                    border: `1px solid ${s.color}33`
                                }}>
                                    <div style={{ fontSize: '1rem', fontWeight: 900, color: s.color, lineHeight: 1 }}>{s.val}</div>
                                    <div style={{ fontSize: '0.55rem', color: s.color, opacity: 0.8, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: 2 }}>{s.label}</div>
                                </div>
                            ))}
                        </div>

                        {/* Search + Sort + Export controls */}
                        <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
                            <div style={{ flex: 1, position: 'relative' }}>
                                <Search size={12} style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                                <input
                                    value={logSearch}
                                    onChange={e => setLogSearch(e.target.value)}
                                    placeholder="Cari nama / kelas..."
                                    style={{
                                        width: '100%', paddingLeft: 26, paddingRight: logSearch ? 26 : 8,
                                        paddingTop: 6, paddingBottom: 6,
                                        background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: 8, color: '#e2e8f0', fontSize: '0.72rem',
                                        outline: 'none', boxSizing: 'border-box'
                                    }}
                                />
                                {logSearch && (
                                    <button onClick={() => setLogSearch('')} style={{ position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: 0, lineHeight: 1 }}>
                                        <X size={12} />
                                    </button>
                                )}
                            </div>
                            <button
                                onClick={() => setSortOldest(v => !v)}
                                title={sortOldest ? 'Tampilkan Terbaru' : 'Tampilkan Terlama'}
                                style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '6px 8px', color: '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                            >
                                {sortOldest ? <SortAsc size={13} /> : <SortDesc size={13} />}
                            </button>
                            <button
                                onClick={handleExportCSV}
                                title="Export CSV"
                                disabled={tapLog.length === 0}
                                style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 8, padding: '6px 8px', color: '#10b981', cursor: tapLog.length === 0 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', opacity: tapLog.length === 0 ? 0.5 : 1 }}
                            >
                                <Download size={13} />
                            </button>
                        </div>
                    </div>

                    {/* Log Entries */}
                    <div style={{ flex: 1, overflowY: 'auto', padding: '6px 0' }}>
                        {filteredLog.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '30px 16px', color: '#475569', fontSize: '0.82rem' }}>
                                {logSearch ? `Tidak ada hasil untuk "${logSearch}"` : 'Belum ada tap hari ini'}
                            </div>
                        ) : filteredLog.map((entry) => {
                            const badge = getLogBadgeStyle(entry)
                            const isNew = entry.id === newEntryId
                            return (
                                <div key={entry.id} style={{
                                    padding: '9px 12px',
                                    borderBottom: '1px solid rgba(255,255,255,0.04)',
                                    background: isNew ? 'rgba(59,130,246,0.18)' : 'transparent',
                                    borderLeft: isNew ? '3px solid #3b82f6' : '3px solid transparent',
                                    transition: 'background 1.5s ease, border-left 1.5s ease',
                                    display: 'flex', flexDirection: 'column', gap: 3
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 6 }}>
                                        <span style={{
                                            fontWeight: 800, fontSize: '0.82rem', color: '#e2e8f0',
                                            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1
                                        }}>
                                            {isNew && <span style={{ marginRight: 4 }}>🔵</span>}{entry.nama}
                                        </span>
                                        <span style={{
                                            fontSize: '0.6rem', fontWeight: 800,
                                            background: badge.bg, color: '#fff',
                                            borderRadius: 6, padding: '2px 6px', flexShrink: 0
                                        }}>{badge.icon} {badge.label}</span>
                                    </div>
                                    <div style={{ fontSize: '0.68rem', color: '#64748b', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ color: '#475569' }}>{entry.kelas || '—'}</span>
                                        <span style={{ fontFamily: 'monospace', color: '#94a3b8', fontSize: '0.7rem' }}>
                                            {entry.last_event === 'pulang'
                                                ? `↩ ${entry.jam_pulang}`
                                                : `→ ${entry.jam_masuk}`}
                                        </span>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
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

                /* Mobile Optimizations */
                .gate-header {
                    padding: 20px 40px;
                    border-bottom: 1px solid rgba(255,255,255,0.1);
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    background: rgba(0,0,0,0.2);
                }
                .gate-header-left {
                    display: flex;
                    align-items: center;
                    gap: 15px;
                }
                .gate-header-logo {
                    width: 60px;
                    height: 60px;
                    background: #fff;
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    overflow: hidden;
                }
                .gate-title {
                    font-size: clamp(1.2rem, 4vw, 1.8rem);
                    font-weight: 900;
                    margin: 0;
                    letter-spacing: -0.025em;
                }
                .gate-header-right {
                    text-align: right;
                }
                .gate-time {
                    font-size: clamp(1.4rem, 5vw, 2.2rem);
                    font-weight: 800;
                    font-family: monospace;
                    text-shadow: 0 2px 10px rgba(0,0,0,0.5);
                }
                .gate-date {
                    font-size: clamp(0.7rem, 2vw, 1rem);
                    color: #cbd5e1;
                    font-weight: 500;
                }
                
                .gate-main {
                    flex: 1;
                    display: flex;
                    position: relative;
                    overflow: hidden;
                }
                .gate-center-area {
                    flex: 1;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    position: relative;
                }

                .gate-success-card {
                    width: 90%;
                    max-width: 900px;
                    background: #fff;
                    color: #0f172a;
                    border-radius: 40px;
                    overflow: hidden;
                    display: flex;
                    gap: 40px;
                    padding: 20px;
                    box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5);
                    animation: bounceIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
                }
                .gate-avatar {
                    width: 300px;
                    height: 350px;
                    background: #f8fafc;
                    border-radius: 30px;
                    border: 4px solid #e2e8f0;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 8rem;
                    color: #94a3b8;
                    overflow: hidden;
                    box-shadow: inset 0 2px 10px rgba(0,0,0,0.05);
                }
                .gate-student-name {
                    font-size: clamp(1.8rem, 6vw, 3.8rem);
                    font-weight: 900;
                    margin: 0 0 10px;
                    letter-spacing: -0.05em;
                    line-height: 1;
                }
                .gate-student-info {
                    font-size: clamp(1rem, 3vw, 1.8rem);
                    color: #475569;
                    font-weight: 600;
                    margin-bottom: 35px;
                    display: flex;
                    align-items: center;
                    gap: 15px;
                    flex-wrap: wrap;
                }
                .gate-success-msg {
                    font-size: clamp(1.1rem, 3vw, 1.5rem);
                    font-weight: 800;
                }

                .gate-success-box {
                    padding: 24px;
                    border-radius: 24px;
                    display: flex;
                    align-items: center;
                    gap: 20px;
                }

                .gate-webcam-pip {
                    position: absolute;
                    bottom: 30px;
                    right: 320px;
                    width: 280px;
                    height: 210px;
                    border-radius: 16px;
                    overflow: hidden;
                    box-shadow: 0 10px 40px rgba(0,0,0,0.5);
                    border: 4px solid rgba(255,255,255,0.15);
                    background: #000;
                }

                .gate-sidebar {
                    width: 290px;
                    background: rgba(0,0,0,0.4);
                    backdrop-filter: blur(16px);
                    border-left: 1px solid rgba(255,255,255,0.08);
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
                    flex-shrink: 0;
                }

                @media (max-width: 1024px) {
                    .gate-main {
                        flex-direction: column;
                        overflow-y: auto;
                        overflow-x: hidden;
                    }
                    .gate-sidebar {
                        width: 100%;
                        max-height: 350px;
                        border-left: none;
                        border-top: 1px solid rgba(255,255,255,0.08);
                        flex-shrink: 0;
                    }
                    .gate-success-card {
                        flex-direction: column;
                        text-align: center;
                        gap: 20px;
                        border-radius: 20px;
                        margin: 20px 0;
                    }
                    .gate-student-info {
                        justify-content: center;
                        margin-bottom: 15px;
                    }
                    .gate-avatar {
                        width: 150px;
                        height: 150px;
                        border-radius: 20px;
                        font-size: 4rem;
                        margin: 0 auto;
                    }
                    .gate-webcam-pip {
                        right: 20px;
                        bottom: auto;
                        top: 20px;
                        width: 140px;
                        height: 105px;
                    }
                }

                @media (max-width: 768px) {
                    .gate-header {
                        padding: 15px 20px;
                        flex-direction: column;
                        gap: 10px;
                        text-align: center;
                    }
                    .gate-header-left {
                        flex-direction: column;
                        gap: 8px;
                    }
                    .gate-header-right {
                        text-align: center;
                    }
                    .gate-time {
                        font-size: 1.8rem;
                    }
                    .gate-center-area {
                        padding: 10px;
                    }
                    .gate-success-card {
                        padding: 15px;
                        margin: 10px 0;
                    }
                    .gate-success-card > div:last-child > div:last-child {
                        flex-direction: column;
                        text-align: center;
                        padding: 15px;
                    }
                }

                @keyframes gate-shake {
                    0%, 100% { transform: translateX(0); }
                    15% { transform: translateX(-10px); }
                    30% { transform: translateX(10px); }
                    45% { transform: translateX(-8px); }
                    60% { transform: translateX(8px); }
                    75% { transform: translateX(-4px); }
                    90% { transform: translateX(4px); }
                }
                .gate-shake {
                    animation: gate-shake 0.7s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
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
