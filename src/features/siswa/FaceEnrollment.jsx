import { useState, useEffect, useRef } from 'react';
import * as faceapi from '@vladmandic/face-api';
import { Camera, CheckCircle2, AlertCircle, Loader2, Save, Trash2 } from 'lucide-react';
import { API_BASE } from '../../services/api';

export default function FaceEnrollment({ siswa, addToast, onComplete }) {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const [modelsLoaded, setModelsLoaded] = useState(false);
    const [stream, setStream] = useState(null);
    const [isDetecting, setIsDetecting] = useState(false);
    const [faceData, setFaceData] = useState(siswa.face_descriptor ? JSON.parse(siswa.face_descriptor) : null);
    const [previewImg, setPreviewImg] = useState(null);
    const [loadingMessage, setLoadingMessage] = useState('Memuat model AI...');
    const detectIntervalRef = useRef(null);

    // Load Models on Mount
    useEffect(() => {
        const loadModels = async () => {
            try {
                await Promise.all([
                    faceapi.nets.ssdMobilenetv1.loadFromUri('/models'),
                    faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
                    faceapi.nets.faceRecognitionNet.loadFromUri('/models')
                ]);
                setModelsLoaded(true);
                setLoadingMessage('');
            } catch (err) {
                console.error("Gagal memuat model face-api", err);
                setLoadingMessage('Gagal memuat model AI. Pastikan folder /models tersedia.');
            }
        };
        loadModels();
        return () => stopWebcam(); // Cleanup
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Start Webcam
    const startWebcam = async () => {
        setIsDetecting(true);
        setPreviewImg(null); // Clear previous preview when starting over
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
            setStream(mediaStream);
            setIsDetecting(true);
        } catch (err) {
            addToast('danger', 'Error', 'Tidak dapat mengakses webcam. Pastikan memberikan izin.');
        }
    };

    useEffect(() => {
        if (isDetecting && stream && videoRef.current) {
            videoRef.current.srcObject = stream;
        }
    }, [isDetecting, stream]);

    // Stop Webcam
    const stopWebcam = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
        setIsDetecting(false);
        if (detectIntervalRef.current) clearInterval(detectIntervalRef.current);
    };

    // Handle Video Play inside Canvas
    const handleVideoPlay = () => {
        if (!videoRef.current || !canvasRef.current) return;
        
        const displaySize = { 
            width: videoRef.current.videoWidth, 
            height: videoRef.current.videoHeight 
        };
        faceapi.matchDimensions(canvasRef.current, displaySize);

        if (detectIntervalRef.current) clearInterval(detectIntervalRef.current);

        detectIntervalRef.current = setInterval(async () => {
            if (!videoRef.current || videoRef.current.paused || videoRef.current.ended) {
                return clearInterval(detectIntervalRef.current);
            }

            const options = new faceapi.SsdMobilenetv1Options({ minConfidence: 0.35 });
            const detections = await faceapi.detectAllFaces(videoRef.current, options).withFaceLandmarks().withFaceDescriptors();
            
            if (canvasRef.current) {
                const resizedDetections = faceapi.resizeResults(detections, displaySize);
                const ctx = canvasRef.current.getContext('2d');
                ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
                faceapi.draw.drawDetections(canvasRef.current, resizedDetections);
                faceapi.draw.drawFaceLandmarks(canvasRef.current, resizedDetections);
            }
        }, 100);
    };

    // Capture Face
    const captureFace = async () => {
        if (!videoRef.current) return;
        
        setLoadingMessage('Menganalisis wajah...');
        const options = new faceapi.SsdMobilenetv1Options({ minConfidence: 0.35 });
        const detection = await faceapi.detectSingleFace(videoRef.current, options).withFaceLandmarks().withFaceDescriptor();
        
        if (!detection) {
            setLoadingMessage('');
            addToast('warning', 'Peringatan', 'Wajah tidak terdeteksi. Pastikan wajah terlihat jelas.');
            return;
        }

        const descriptor = Array.from(detection.descriptor);
        setFaceData(descriptor);
        
        // Capture snapshot before stopping webcam
        if (videoRef.current) {
            const snapCanvas = document.createElement('canvas');
            snapCanvas.width = videoRef.current.videoWidth;
            snapCanvas.height = videoRef.current.videoHeight;
            const ctx = snapCanvas.getContext('2d');
            ctx.drawImage(videoRef.current, 0, 0);
            setPreviewImg(snapCanvas.toDataURL('image/jpeg', 0.8));
        }

        setLoadingMessage('');
        stopWebcam();
    };

    // Save Face
    const saveFace = async () => {
        setLoadingMessage('Menyimpan data wajah...');
        try {
            const res = await fetch(`${API_BASE}/students/${siswa.id}/face`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
                body: JSON.stringify({ face_descriptor: faceData })
            });
            const data = await res.json();
            if (res.ok) {
                addToast('success', 'Berhasil', 'Wajah berhasil didaftarkan');
                if (onComplete) onComplete({ ...siswa, face_descriptor: JSON.stringify(faceData) });
            } else {
                throw new Error(data.error || 'Gagal menyimpan wajah');
            }
        } catch (err) {
            addToast('danger', 'Error', err.message);
        } finally {
            setLoadingMessage('');
        }
    };

    // Delete Face
    const deleteFace = async () => {
        setLoadingMessage('Menghapus data wajah...');
        try {
            const res = await fetch(`${API_BASE}/students/${siswa.id}/face`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
                body: JSON.stringify({ face_descriptor: null })
            });
            if (res.ok) {
                setFaceData(null);
                setPreviewImg(null);
                addToast('success', 'Berhasil', 'Data wajah dihapus');
                if (onComplete) onComplete({ ...siswa, face_descriptor: null });
            } else {
                throw new Error('Gagal menghapus wajah');
            }
        } catch (err) {
            addToast('danger', 'Error', err.message);
        } finally {
            setLoadingMessage('');
        }
    };

    return (
        <div className="section-card" style={{ padding: 24, borderRadius: 12, background: 'var(--bg-card)', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
            <h4 style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 0, marginBottom: 20 }}>
                <Camera size={20} /> Registrasi Wajah Anti-Titip Absen
            </h4>

            {loadingMessage && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 16, background: 'var(--primary-50)', color: 'var(--primary-700)', borderRadius: 8, marginBottom: 20 }}>
                    <Loader2 size={18} className="spin" /> {loadingMessage}
                </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) 300px', gap: 24 }}>
                {/* Kamera Wrapper */}
                <div style={{ position: 'relative', width: '100%', aspectRatio: '4/3', background: '#000', borderRadius: 12, overflow: 'hidden' }}>
                    {isDetecting ? (
                        <>
                            <video 
                                ref={videoRef} 
                                autoPlay 
                                muted 
                                playsInline
                                onPlay={handleVideoPlay}
                                style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }} 
                            />
                            <canvas 
                                ref={canvasRef} 
                                style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100%', transform: 'scaleX(-1)' }} 
                            />
                        </>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#666' }}>
                            {previewImg ? (
                                <>
                                    <img src={previewImg} alt="Preview Capture" style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }} />
                                    <div style={{ position: 'absolute', bottom: 10, right: 10, background: 'rgba(0,0,0,0.6)', padding: '5px 12px', borderRadius: 20, color: '#4ade80', fontSize: '0.8rem', fontWeight: 600 }}>
                                        <CheckCircle2 size={14} style={{ display: 'inline', verticalAlign: 'text-bottom', marginRight: 4 }} /> Captured
                                    </div>
                                </>
                            ) : (
                                <>
                                    <Camera size={48} style={{ opacity: 0.5, marginBottom: 16 }} />
                                    {faceData ? (
                                        <span style={{ color: '#4ade80', display: 'flex', alignItems: 'center', gap: 8 }}><CheckCircle2 size={18}/> Wajah Sudah Terdaftar</span>
                                    ) : (
                                        <span>Kamera Nonaktif</span>
                                    )}
                                </>
                            )}
                        </div>
                    )}
                </div>

                {/* Kontrol UI */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div style={{ padding: 16, background: faceData ? 'var(--success-50)' : 'var(--warning-50)', borderRadius: 8, border: `1px solid ${faceData ? 'var(--success-200)' : 'var(--warning-200)'}` }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: faceData ? 'var(--success-700)' : 'var(--warning-700)', fontWeight: 600, marginBottom: 8 }}>
                            {faceData ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                            Status: {faceData ? 'Terdaftar' : 'Belum Terdaftar'}
                        </div>
                        <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                            {faceData 
                                ? 'Siswa sudah dapat menggunakan fitur Face Recognition saat absen.' 
                                : 'Siswa belum memiliki data wajah untuk Face Recognition.'}
                        </p>
                    </div>

                    {!modelsLoaded ? (
                        <button className="btn btn-secondary" disabled>Memuat Model AI...</button>
                    ) : (
                        <>
                            {isDetecting ? (
                                <>
                                    <button className="btn btn-primary" onClick={captureFace} style={{ width: '100%', padding: '12px 16px' }}>
                                        <Camera size={18} /> Ambil Foto Wajah
                                    </button>
                                    <button className="btn btn-outline" onClick={stopWebcam} style={{ width: '100%' }}>
                                        Batal / Matikan Kamera
                                    </button>
                                </>
                            ) : (
                                <button className="btn btn-primary" onClick={startWebcam} style={{ width: '100%', padding: '12px 16px' }}>
                                    <Camera size={18} /> {faceData ? 'Perbarui Wajah' : 'Daftar Wajah Baru'}
                                </button>
                            )}

                            {faceData && !isDetecting && (
                                <>
                                    <button className="btn btn-success" onClick={saveFace} style={{ width: '100%', padding: '12px 16px' }}>
                                        <Save size={18} /> Simpan Data Wajah
                                    </button>
                                    <button className="btn btn-danger" onClick={deleteFace} style={{ width: '100%', padding: '12px 16px', background: 'var(--danger-50)', color: 'var(--danger-600)', borderColor: 'var(--danger-200)' }}>
                                        <Trash2 size={18} /> Hapus Data Wajah
                                    </button>
                                </>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
