import { useState, useEffect, useRef, useCallback } from 'react'
import { io } from 'socket.io-client'
import * as faceapi from '@vladmandic/face-api'
import { Package, AlertTriangle, Clock, ArrowRight, RotateCcw, Search } from 'lucide-react'
import api, { API_BASE } from '../../services/api'

export default function LabScanMonitor() {
    const [inventaris, setInventaris] = useState([])
    const [selectedItem, setSelectedItem] = useState(null)
    const [scanData, setScanData] = useState(null)
    const [scanInfo, setScanInfo] = useState(null)
    const [rfidInput, setRfidInput] = useState('')
    const [currentTime, setCurrentTime] = useState(new Date())
    const [schoolSettings, setSchoolSettings] = useState(null)
    const [searchItem, setSearchItem] = useState('')
    const [categories, setCategories] = useState([])
    const [selectedCategoryId, setSelectedCategoryId] = useState('all')
    const [kioskMode, setKioskMode] = useState('pinjam') // 'pinjam' | 'kembali'
    const [studentLoans, setStudentLoans] = useState(null) // { student, loans }
    const [isProcessing, setIsProcessing] = useState(false)
    const [isModelsLoaded, setIsModelsLoaded] = useState(false)

    const inputRef = useRef(null)
    const timerRef = useRef(null)
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

    // Load data
    useEffect(() => {
        api.get('/admin/school-settings').then(res => setSchoolSettings(res.data)).catch(console.error)
        api.get('/admin/lab/kategori').then(res => setCategories(res.data)).catch(console.error)
        fetchItems()
    }, [])

    const fetchItems = async () => {
        try {
            const { data } = await api.get('/admin/lab/inventaris')
            setInventaris(data)
        } catch (err) { console.error(err) }
    }

    // Clock
    useEffect(() => {
        const interval = setInterval(() => setCurrentTime(new Date()), 1000)
        return () => clearInterval(interval)
    }, [])

    // Auto-focus
    useEffect(() => {
        if (selectedItem || (kioskMode === 'kembali' && !studentLoans)) {
            const focusInput = () => inputRef.current?.focus()
            focusInput()
            document.addEventListener('click', focusInput)
            return () => document.removeEventListener('click', focusInput)
        }
    }, [selectedItem, kioskMode, studentLoans])

    // Audio
    const playBeep = () => {
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)()
            const osc = ctx.createOscillator()
            const gain = ctx.createGain()
            osc.connect(gain); gain.connect(ctx.destination)
            osc.type = 'sine'; osc.frequency.setValueAtTime(800, ctx.currentTime)
            osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.1)
            gain.gain.setValueAtTime(0.1, ctx.currentTime)
            osc.start(); osc.stop(ctx.currentTime + 0.1)
        } catch (e) { /* ignore audio error */ }
    }

    const playBuzzer = () => {
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)()
            const osc = ctx.createOscillator()
            const gain = ctx.createGain()
            osc.connect(gain); gain.connect(ctx.destination)
            osc.type = 'sawtooth'; osc.frequency.setValueAtTime(150, ctx.currentTime)
            gain.gain.setValueAtTime(0.1, ctx.currentTime)
            osc.start(); osc.stop(ctx.currentTime + 0.4)
        } catch (e) { /* ignore audio error */ }
    }

    const speakMessage = (text) => {
        if (!window.speechSynthesis) return
        window.speechSynthesis.cancel()
        const msg = new SpeechSynthesisUtterance(text.toLowerCase())
        msg.lang = 'id-ID'
        const voices = window.speechSynthesis.getVoices()
        const idnVoices = voices.filter(v => v.lang.includes('id') || v.lang.includes('ID'))
        if (idnVoices.length > 0) {
            msg.voice = idnVoices[Math.floor(Math.random() * idnVoices.length)]
            msg.pitch = Math.random() * 0.35 + 0.9
        }
        window.speechSynthesis.speak(msg)
    }

    const showScanResult = useCallback((data) => {
        if (timerRef.current) clearTimeout(timerRef.current)
        setScanInfo(null)
        setScanData(data)

        let speech = ''
        if (data.type === 'pinjam') {
            speech = `${data.student.nama}, peminjaman ${data.item.nama} berhasil. Kembalikan tepat waktu ya.`
            playBeep()
        } else {
            if (data.isLate) {
                speech = `${data.student.nama}, terima kasih sudah mengembalikan ${data.item.nama}, tetapi terlambat.`
                playBuzzer()
            } else {
                speech = `Terima kasih ${data.student.nama}, ${data.item.nama} berhasil dikembalikan.`
                playBeep()
            }
        }

        speakMessage(speech)

        timerRef.current = setTimeout(() => {
            setScanData(null)
            setSelectedItem(null)
            setStudentLoans(null)
            setKioskMode('pinjam')
            fetchItems()
        }, 6000)
    }, [timerRef])

    const showScanInfo = useCallback((data) => {
        if (timerRef.current) clearTimeout(timerRef.current)
        setScanData(null)
        setScanInfo(data)
        playBuzzer()
        speakMessage('Mohon maaf, ' + data.message)
        timerRef.current = setTimeout(() => setScanInfo(null), 5000)
    }, [timerRef])

    // Socket.io
    useEffect(() => {
        const socketOrigin = API_BASE.replace('/api', '')
        const socket = io(socketOrigin, {
            path: '/api/socket.io',
            transports: ['polling']
        })

        socket.on('connect', () => console.log('[Lab Socket] Connected'))
        socket.on('lab_scan_success', (data) => showScanResult(data))
        socket.on('lab_scan_info', (data) => showScanInfo(data))

        return () => socket.disconnect()
    }, [showScanResult, showScanInfo])

    // Since we need the RFID to finish the return even after selection, let's store it
    const [activeRfid, setActiveRfid] = useState('')
    const handleScanEnhanced = async (e) => {
        e.preventDefault()
        const input = rfidInput.trim()
        setRfidInput('')
        if (!input || isProcessing) return

        setIsProcessing(true)

        // Anti-Titip Absen: Face Check (Only for initial scan)
        if ((kioskMode === 'pinjam' || (kioskMode === 'kembali' && !studentLoans)) && schoolSettings?.face_recognition_enabled === 'true') {
            try {
                const checkRes = await api.get(`/attendance/check-rfid/${input}`)
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
                            message: 'Wajah Tidak Terlihat', 
                            type: 'warning', 
                            subMessage: 'Harap hadapkan wajah ke kamera (Tahan sebentar)' 
                        })
                        throw new Error('No face in camera')
                    }
                    
                    const savedDescriptor = new Float32Array(JSON.parse(student.face_descriptor))
                    const distance = faceapi.euclideanDistance(detection.descriptor, savedDescriptor)
                    if (distance > 0.48) {
                        showScanInfo({ 
                            message: 'Wajah Tidak Cocok!', 
                            subMessage: 'Akses Ditolak (Anti-Peminjaman Palsu)',
                            type: 'warning' 
                        })
                        throw new Error('Face mismatch')
                    } else {
                        showScanInfo({ 
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
                     setIsProcessing(false)
                     return; // abort tap
                }
            }
        }

        if (kioskMode === 'pinjam') {
            if (!selectedItem) {
                setIsProcessing(false)
                return
            }
            try {
                const { data } = await api.post('/lab/scan', { rfid_uid: input, inventaris_id: selectedItem.id })
                if (data.success) {
                    showScanResult(data)
                } else {
                    showScanInfo({ message: data.error || 'Terjadi kesalahan sistem' })
                }
            } catch (err) {
                const errMsg = err.response?.data?.error || err.message || 'Kesalahan Koneksi'
                showScanInfo({ message: errMsg })
            } finally {
                setIsProcessing(false)
            }
        } else {
            if (!studentLoans) {
                try {
                    const { data } = await api.get(`/lab/student-loans/${input}`)
                    if (data.loans.length === 0) {
                        showScanInfo({ message: `Halo ${data.student}, Anda tidak memiliki pinjaman aktif.` })
                    } else {
                        setStudentLoans(data)
                        setActiveRfid(input)
                    }
                } catch (err) {
                    const errMsg = err.response?.data?.error || 'Kesalahan sistem'
                    showScanInfo({ message: errMsg })
                } finally {
                    setIsProcessing(false)
                }
            } else {
                setIsProcessing(false)
            }
        }
    }

    const executeReturn = async (invId) => {
        try {
            const { data } = await api.post('/lab/scan', { rfid_uid: activeRfid, inventaris_id: invId })
            if (data.success) {
                showScanResult(data);
            } else {
                showScanInfo({ message: data.error || 'Gagal mengembalikan barang' });
            }
        } catch (err) {
            console.error(err);
            showScanInfo({ message: err.response?.data?.error || err.message || 'Kesalahan Koneksi' });
        }
    }

    const availableItems = inventaris.filter(i => {
        const matchSearch = !searchItem || i.nama.toLowerCase().includes(searchItem.toLowerCase()) || i.kode.toLowerCase().includes(searchItem.toLowerCase())
        const matchCategory = selectedCategoryId === 'all' || i.kategori_id === parseInt(selectedCategoryId)
        return matchSearch && matchCategory
    })

    const getBgColor = () => {
        if (scanData) {
            if (scanData.type === 'pinjam') return '#059669'
            return scanData.isLate ? '#b45309' : '#0369a1'
        }
        if (scanInfo) return '#b91c1c'
        if (selectedItem) return '#1e293b'
        return '#0f172a'
    }

    const formatBatas = (d) => {
        if (!d) return '-'
        return new Date(d).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    }

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: getBgColor(), color: '#fff', zIndex: 9999,
            display: 'flex', flexDirection: 'column', overflow: 'hidden',
            transition: 'background 0.5s ease'
        }}>
            
            {/* WEBCAM PIP */}
            {isModelsLoaded && schoolSettings?.face_recognition_enabled === 'true' && (
                <div style={{
                    position: 'absolute', bottom: 30, right: 30, width: 200, height: 150,
                    borderRadius: 16, overflow: 'hidden', boxShadow: '0 10px 40px rgba(0,0,0,0.5)', 
                    border: '4px solid rgba(255,255,255,0.15)', background: '#000'
                }}>
                    <video ref={el => {
                            videoRef.current = el;
                            if (el && stream && el.srcObject !== stream) {
                                el.srcObject = stream;
                            }
                        }} autoPlay muted playsInline style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }} />
                    <div style={{ position: 'absolute', top: 10, left: 10, background: 'rgba(0, 0, 0, 0.6)', padding: '4px 8px', borderRadius: 6, fontSize: '0.7rem', fontWeight: 600, color: 'white' }}>
                        <div className="animate-pulse" style={{ width: 8, height: 8, background: '#fff', borderRadius: '50%' }} /> REC
                    </div>
                </div>
            )}

            {/* Header */}
            <header style={{ padding: '16px 32px', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.2)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 50, height: 50, background: '#fff', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                        {schoolSettings?.logo_url ? (
                            <img src={`${API_BASE.replace('/api', '')}${schoolSettings.logo_url}`} alt="Logo" style={{ width: '80%', height: '80%', objectFit: 'contain' }} />
                        ) : (<span style={{ fontSize: '1.5rem' }}>📦</span>)}
                    </div>
                    <div>
                        <h1 style={{ fontSize: '1.4rem', fontWeight: 900, margin: 0 }}>LAB SCAN MONITOR</h1>
                        <p style={{ margin: 0, fontSize: '0.8rem', color: '#cbd5e1', fontWeight: 600 }}>
                            Sistem Peminjaman Inventaris Lab • {schoolSettings?.nama_sekolah || 'SIAS SMK PPRQ'}
                        </p>
                    </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1.8rem', fontWeight: 800, fontFamily: 'monospace' }}>
                        {currentTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </div>
                    <div style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>
                        {currentTime.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                    </div>
                </div>
            </header>

            {/* Mode Switcher */}
            {!scanData && !scanInfo && (
                <div style={{ background: 'rgba(255,255,255,0.05)', padding: '10px 0', display: 'flex', justifyContent: 'center', gap: 20 }}>
                    <button
                        onClick={() => { setKioskMode('pinjam'); setSelectedItem(null); setStudentLoans(null); }}
                        style={{
                            padding: '12px 30px', borderRadius: 15, border: 'none', fontSize: '1.1rem', fontWeight: 800, cursor: 'pointer',
                            background: kioskMode === 'pinjam' ? '#3b82f6' : 'transparent',
                            color: kioskMode === 'pinjam' ? '#fff' : '#94a3b8',
                            display: 'flex', alignItems: 'center', gap: 10
                        }}
                    >
                        <ArrowRight size={20} /> PINJAM BARANG
                    </button>
                    <button
                        onClick={() => { setKioskMode('kembali'); setSelectedItem(null); setStudentLoans(null); }}
                        style={{
                            padding: '12px 30px', borderRadius: 15, border: 'none', fontSize: '1.1rem', fontWeight: 800, cursor: 'pointer',
                            background: kioskMode === 'kembali' ? '#f59e0b' : 'transparent',
                            color: kioskMode === 'kembali' ? '#fff' : '#94a3b8',
                            display: 'flex', alignItems: 'center', gap: 10
                        }}
                    >
                        <RotateCcw size={20} /> KEMBALIKAN MANDIRI
                    </button>
                </div>
            )}

            {/* Main Content */}
            <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'auto', padding: 32 }}>
                {/* Hidden RFID input */}
                {(selectedItem || (kioskMode === 'kembali' && !studentLoans)) && (
                    <form onSubmit={handleScanEnhanced} style={{ position: 'absolute', opacity: 0, pointerEvents: 'none' }}>
                        <input ref={inputRef} type="text" value={rfidInput} onChange={e => setRfidInput(e.target.value)} autoFocus />
                    </form>
                )}

                {/* === ITEM SELECTION (Mode Pinjam) === */}
                {kioskMode === 'pinjam' && !selectedItem && !scanData && !scanInfo && (
                    <div style={{ width: '100%', maxWidth: 1200 }}>
                        <div style={{ textAlign: 'center', marginBottom: 32 }}>
                            <h2 style={{ fontSize: '2rem', fontWeight: 300, color: '#94a3b8' }}>Pilih Item untuk Dipinjam</h2>
                            <div style={{ maxWidth: 500, margin: '16px auto' }}>
                                <div style={{ position: 'relative' }}>
                                    <Search size={20} style={{ position: 'absolute', top: '50%', left: 16, transform: 'translateY(-50%)', color: '#64748b' }} />
                                    <input
                                        type="text" placeholder="Cari item..."
                                        value={searchItem} onChange={e => setSearchItem(e.target.value)}
                                        style={{ width: '100%', padding: '14px 16px 14px 48px', border: '2px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', borderRadius: 16, color: '#fff', fontSize: '1.1rem', outline: 'none' }}
                                    />
                                </div>
                            </div>

                            {/* Category Filter */}
                            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 24 }}>
                                <button
                                    onClick={() => setSelectedCategoryId('all')}
                                    style={{
                                        padding: '10px 20px', borderRadius: 12, border: 'none',
                                        background: selectedCategoryId === 'all' ? '#3b82f6' : 'rgba(255,255,255,0.05)',
                                        color: '#fff', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s'
                                    }}
                                >
                                    Semua
                                </button>
                                {categories.map(cat => (
                                    <button
                                        key={cat.id}
                                        onClick={() => setSelectedCategoryId(cat.id)}
                                        style={{
                                            padding: '10px 20px', borderRadius: 12, border: 'none',
                                            background: selectedCategoryId === cat.id ? '#3b82f6' : 'rgba(255,255,255,0.05)',
                                            color: '#fff', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s',
                                            display: 'flex', alignItems: 'center', gap: 8
                                        }}
                                    >
                                        <span>{cat.icon}</span> {cat.nama}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 16, maxHeight: 'calc(100vh - 300px)', overflowY: 'auto', padding: 4 }}>
                            {availableItems.map(item => {
                                const isAvailable = item.status === 'tersedia'
                                return (
                                    <div
                                        key={item.id}
                                        onClick={() => isAvailable && setSelectedItem(item)}
                                        style={{
                                            background: isAvailable ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.03)',
                                            border: `2px solid ${isAvailable ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.05)'}`,
                                            borderRadius: 20, padding: 20,
                                            cursor: isAvailable ? 'pointer' : 'not-allowed',
                                            opacity: isAvailable ? 1 : 0.4,
                                            transition: 'all 0.2s',
                                            ...(isAvailable ? {} : {})
                                        }}
                                        onMouseEnter={e => { if (isAvailable) { e.currentTarget.style.background = 'rgba(255,255,255,0.15)'; e.currentTarget.style.transform = 'translateY(-4px)' } }}
                                        onMouseLeave={e => { if (isAvailable) { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.transform = 'translateY(0)' } }}
                                    >
                                        <div style={{ fontSize: '2rem', marginBottom: 8 }}>{item.kategori_icon || '📦'}</div>
                                        <div style={{ fontWeight: 800, fontSize: '1.1rem', marginBottom: 4 }}>{item.nama}</div>
                                        <div style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: 8 }}>{item.kode} {item.merk ? `• ${item.merk}` : ''}</div>
                                        <div style={{
                                            display: 'inline-block', padding: '4px 12px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 700,
                                            background: isAvailable ? 'rgba(16,185,129,0.2)' : item.status === 'dipinjam' ? 'rgba(245,158,11,0.2)' : 'rgba(239,68,68,0.2)',
                                            color: isAvailable ? '#34d399' : item.status === 'dipinjam' ? '#fbbf24' : '#f87171'
                                        }}>
                                            {isAvailable ? '✅ Tersedia' : item.status === 'dipinjam' ? `⏳ Dipinjam: ${item.peminjam_nama || '-'}` : '🔧 Maintenance'}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                )}

                {/* === PINJAM MODE: WAITING SCAN === */}
                {kioskMode === 'pinjam' && selectedItem && !scanData && !scanInfo && (
                    <div className="animate-pulse" style={{ textAlign: 'center' }}>
                        <div style={{
                            width: 200, height: 200, border: '4px dashed rgba(255,255,255,0.2)',
                            borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            margin: '0 auto 32px', background: 'rgba(255,255,255,0.03)'
                        }}>
                            <Package size={80} strokeWidth={1} style={{ opacity: 0.5 }} />
                        </div>
                        <h2 style={{ fontSize: '2.5rem', fontWeight: 300, color: '#e2e8f0', margin: '0 0 8px' }}>
                            {isProcessing ? 'Sedang Memproses...' : 'Tempelkan Kartu RFID'}
                        </h2>

                        <div style={{
                            background: 'rgba(255,255,255,0.1)', borderRadius: 20, padding: '16px 32px',
                            display: 'inline-block', margin: '16px 0 24px'
                        }}>
                            <div style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: 4 }}>{selectedItem.kategori_icon} {selectedItem.nama}</div>
                            <div style={{ color: '#94a3b8', fontSize: '0.9rem' }}>{selectedItem.kode} {selectedItem.merk ? `• ${selectedItem.merk}` : ''}</div>
                        </div>
                        <div>
                            <button
                                onClick={() => setSelectedItem(null)}
                                style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 12, color: '#94a3b8', padding: '10px 24px', cursor: 'pointer', fontSize: '0.9rem' }}
                            >
                                ← Kembali Pilih Item
                            </button>
                        </div>
                        <div style={{ marginTop: 20, display: 'flex', gap: 12, justifyContent: 'center' }}>
                            <span style={{ padding: '6px 14px', background: 'rgba(255,255,255,0.05)', borderRadius: 10, fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>Scanner Ready 🟢</span>
                            {isProcessing && <span style={{ padding: '6px 14px', background: 'rgba(245,158,11,0.2)', borderRadius: 10, fontSize: '0.85rem', color: '#f59e0b', fontWeight: 600 }}>Processing... ⏳</span>}
                        </div>
                    </div>
                )}

                {/* === RETURN SELECTION (Mode Kembali) === */}
                {kioskMode === 'kembali' && !studentLoans && !scanData && !scanInfo && (
                    <div className="animate-pulse" style={{ textAlign: 'center' }}>
                        <div style={{
                            width: 200, height: 200, border: '4px dashed rgba(245,158,11,0.3)',
                            borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            margin: '0 auto 32px', background: 'rgba(245,158,11,0.05)'
                        }}>
                            <RotateCcw size={80} strokeWidth={1} style={{ opacity: 0.5, color: '#f59e0b' }} />
                        </div>
                        <h2 style={{ fontSize: '2.5rem', fontWeight: 300, color: '#e2e8f0', margin: '0 0 8px' }}>Tempelkan Kartu Siswa</h2>
                        <p style={{ color: '#94a3b8', fontSize: '1.2rem' }}>Scan kartu Anda untuk melihat daftar pinjaman aktif</p>
                    </div>
                )}

                {kioskMode === 'kembali' && studentLoans && !scanData && !scanInfo && (
                    <div style={{ width: '100%', maxWidth: 1000 }}>
                        <div style={{ textAlign: 'center', marginBottom: 40 }}>
                            <h3 style={{ fontSize: '1.5rem', color: '#94a3b8', fontWeight: 300, margin: 0 }}>Halo, {studentLoans.student}</h3>
                            <h2 style={{ fontSize: '2.5rem', fontWeight: 900, color: '#fff', margin: '8px 0' }}>Pilih Barang yang Dikembalikan</h2>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
                            {studentLoans.loans.map(loan => (
                                <div
                                    key={loan.id}
                                    onClick={() => executeReturn(loan.inventaris_id)}
                                    style={{
                                        background: 'rgba(255,255,255,0.08)', border: '2px solid rgba(255,255,255,0.1)',
                                        borderRadius: 24, padding: 24, cursor: 'pointer', transition: 'all 0.2s'
                                    }}
                                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(245,158,11,0.15)'; e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.borderColor = '#f59e0b' }}
                                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)' }}
                                >
                                    <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>{loan.kategori_icon}</div>
                                    <div style={{ fontWeight: 900, fontSize: '1.3rem', marginBottom: 4 }}>{loan.inventaris_nama}</div>
                                    <div style={{ color: '#94a3b8', fontSize: '1rem', marginBottom: 16 }}>{loan.inventaris_kode} • {loan.inventaris_merk}</div>
                                    <div style={{ fontSize: '0.85rem', color: '#f59e0b', fontWeight: 700, padding: '8px 16px', background: 'rgba(245,158,11,0.1)', borderRadius: 12, display: 'inline-block' }}>
                                        ⏰ Batas: {formatBatas(loan.batas_kembali)}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div style={{ textAlign: 'center', marginTop: 40 }}>
                            <button
                                onClick={() => { setStudentLoans(null); setKioskMode('pinjam') }}
                                style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 12, color: '#94a3b8', padding: '12px 30px', cursor: 'pointer' }}
                            >
                                ← Batal
                            </button>
                        </div>
                    </div>
                )}

                {/* === WARNING/ERROR === */}
                {scanInfo && (
                    <div className="animate-bounceIn" style={{
                        width: '90%', maxWidth: 600, background: '#fff', color: '#0f172a',
                        borderRadius: 30, padding: 50, textAlign: 'center',
                        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)'
                    }}>
                        <div style={{
                            width: 100, height: 100, background: '#fef3c7',
                            borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            margin: '0 auto 20px', color: '#d97706'
                        }}>
                            <AlertTriangle size={56} />
                        </div>
                        {scanInfo.student && <h2 style={{ fontSize: '1.3rem', color: '#64748b', margin: '0 0 8px' }}>{scanInfo.student.nama}</h2>}
                        <h1 style={{ fontSize: '2.5rem', fontWeight: 900, margin: '0 0 16px' }}>{scanInfo.message}</h1>
                        <p style={{ fontSize: '1.1rem', color: '#94a3b8' }}>Hubungi petugas lab untuk bantuan.</p>
                    </div>
                )}

                {/* === SCAN SUCCESS === */}
                {scanData && (
                    <div className="animate-bounceIn" style={{
                        width: '90%', maxWidth: 900, background: '#fff', color: '#0f172a',
                        borderRadius: 40, overflow: 'hidden', display: 'flex', gap: 40, padding: 40,
                        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)'
                    }}>
                        {/* Avatar */}
                        <div style={{ flexShrink: 0 }}>
                            <div style={{
                                width: 250, height: 300, background: '#f8fafc',
                                borderRadius: 24, border: '4px solid #e2e8f0',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '7rem', overflow: 'hidden'
                            }}>
                                {scanData.student.foto ? (
                                    <img src={`${API_BASE.replace('/api', '')}${scanData.student.foto}`} alt="Foto" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (scanData.student.jk === 'P' ? '👩‍🎓' : '👨‍🎓')}
                            </div>
                        </div>

                        {/* Info */}
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                            {/* Status Badge */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                                <div style={{
                                    padding: '8px 16px', borderRadius: 12,
                                    background: scanData.type === 'pinjam' ? '#dcfce7' : scanData.isLate ? '#fef2f2' : '#dbeafe',
                                    color: scanData.type === 'pinjam' ? '#166534' : scanData.isLate ? '#991b1b' : '#1e40af',
                                    fontWeight: 900, fontSize: '1rem',
                                    display: 'flex', alignItems: 'center', gap: 8
                                }}>
                                    {scanData.type === 'pinjam' ? <ArrowRight size={20} /> : <RotateCcw size={20} />}
                                    {scanData.message}
                                </div>
                                <div style={{ fontSize: '1.2rem', color: '#64748b', fontWeight: 700 }}>
                                    <Clock size={20} style={{ verticalAlign: 'middle', marginRight: 6 }} />{scanData.time}
                                </div>
                            </div>

                            {/* Name */}
                            <h1 style={{ fontSize: '3rem', fontWeight: 900, margin: '0 0 8px', letterSpacing: '-0.04em', lineHeight: 1 }}>
                                {scanData.student.nama}
                            </h1>
                            <div style={{ fontSize: '1.4rem', color: '#475569', fontWeight: 600, marginBottom: 24 }}>
                                {scanData.student.kelas} • <span style={{ fontFamily: 'monospace', background: '#f1f5f9', padding: '2px 8px', borderRadius: 6 }}>{scanData.student.nisn}</span>
                            </div>

                            {/* Item Info */}
                            <div style={{
                                padding: 20, borderRadius: 20,
                                background: scanData.type === 'pinjam' ? '#f0fdf4' : scanData.isLate ? '#fef2f2' : '#f0f9ff',
                                border: `2px solid ${scanData.type === 'pinjam' ? '#bbf7d0' : scanData.isLate ? '#fecaca' : '#bae6fd'}`,
                            }}>
                                <div style={{ fontWeight: 800, fontSize: '1.2rem', marginBottom: 6 }}>
                                    📦 {scanData.item.nama}
                                </div>
                                <div style={{ color: '#64748b', fontSize: '0.95rem' }}>
                                    Kode: {scanData.item.kode} {scanData.item.merk ? `• ${scanData.item.merk}` : ''}
                                </div>
                                {scanData.type === 'pinjam' && scanData.batasKembali && (
                                    <div style={{ marginTop: 8, color: '#b45309', fontWeight: 700, fontSize: '0.95rem' }}>
                                        ⏰ Batas Kembali: {formatBatas(scanData.batasKembali)}
                                    </div>
                                )}
                                {scanData.isLate && (
                                    <div style={{ marginTop: 8, color: '#dc2626', fontWeight: 800, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <AlertTriangle size={20} /> Pengembalian Terlambat!
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </main>

            {/* Footer */}
            <footer style={{ background: '#020617', padding: '12px 0', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', overflow: 'hidden' }}>
                <div style={{ whiteSpace: 'nowrap', animation: 'marquee 30s linear infinite', fontSize: '1rem', fontWeight: 600, color: '#94a3b8' }}>
                    <span style={{ margin: '0 50px' }}>📦 Sistem Peminjaman Inventaris Lab — {schoolSettings?.nama_sekolah || 'SIAS SMK PPRQ'}</span>
                    <span style={{ margin: '0 50px' }}>📌 Pilih item yang hendak dipinjam, lalu tempelkan kartu RFID Anda.</span>
                    <span style={{ margin: '0 50px' }}>🔔 Kembalikan peralatan tepat waktu. Jaga aset sekolah dengan baik!</span>
                </div>
            </footer>

            <style>{`
                @keyframes bounceIn {
                    0% { transform: scale(0.3); opacity: 0; }
                    50% { transform: scale(1.05); opacity: 1; }
                    70% { transform: scale(0.9); }
                    100% { transform: scale(1); }
                }
                .animate-bounceIn { animation: bounceIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
                .animate-pulse { animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
                @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: .7; } }
                @keyframes marquee { 0% { transform: translateX(100vw); } 100% { transform: translateX(-100%); } }
            `}</style>
        </div>
    )
}
