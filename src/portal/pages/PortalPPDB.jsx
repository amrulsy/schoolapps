import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { usePortal } from '../context/PortalContext'
import { Search, MapPin, Phone, GraduationCap, CheckCircle2, ClipboardCheck, ArrowRight, User, Calendar, BookOpen, MessageCircle, AlertCircle, Info, ChevronRight, Palette, Scissors, Landmark, Eye, X } from 'lucide-react'
import Swal from 'sweetalert2'

export default function PortalPPDB() {
    const navigate = useNavigate()
    const { fetchPublic, postPublic } = usePortal()
    const [pageContent, setPageContent] = useState(null)
    const [settings, setSettings] = useState({})
    const [loading, setLoading] = useState(true)
    const [showPreview, setShowPreview] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [activeTab, setActiveTab] = useState('register') // 'register' or 'check'
    const [searchQuery, setSearchQuery] = useState('')
    const [steps, setSteps] = useState([])
    const [requirements, setRequirements] = useState([])
    const [gelombangList, setGelombangList] = useState([])
    const [selectedGelombang, setSelectedGelombang] = useState(null)

    // Form State
    const [formData, setFormData] = useState({
        nama_lengkap: '',
        tempat_lahir: '',
        tgl_lahir: '',
        jenis_kelamin: 'L',
        agama: '',
        jurusan_pilihan: '',
        asal_sekolah: '',
        no_whatsapp: '',
        alamat_lengkap: ''
    })

    const JURUSAN_OPTIONS = [
        { id: 'DKV', label: 'Desain Komunikasi Visual', abbr: 'DKV', icon: Palette, color: '#8b5cf6', desc: 'Kreativitas visual, desain grafis, & multimedia' },
        { id: 'DPBSN', label: 'Desain dan Produksi Busana', abbr: 'DPBSN', icon: Scissors, color: '#ec4899', desc: 'Fashion design, tata busana, & produksi garmen' },
        { id: 'LPBS', label: 'Layanan Perbankan Syariah', abbr: 'LPBS', icon: Landmark, color: '#10b981', desc: 'Keuangan syariah, perbankan, & akuntansi' }
    ]
    const [printData, setPrintData] = useState(null)

    useEffect(() => {
        async function loadData() {
            setLoading(true)
            try {
                const [page, settingsData, stepsData, reqsData, gelData] = await Promise.all([
                    fetchPublic('/pages/syarat-pendaftaran'),
                    fetchPublic('/settings'),
                    fetchPublic('/ppdb-steps'),
                    fetchPublic('/ppdb-requirements'),
                    fetchPublic('/ppdb/gelombang')
                ])
                if (page && !page.error) setPageContent(page)
                if (settingsData) setSettings(settingsData)
                if (stepsData && !stepsData.error) setSteps(stepsData)
                if (reqsData && !reqsData.error) setRequirements(reqsData)
                if (Array.isArray(gelData)) setGelombangList(gelData)
            } catch (err) {
                console.error("Failed to load PPDB data", err)
            } finally {
                setLoading(false)
            }
        }
        loadData()
    }, [fetchPublic])

    const isOpen = settings.ppdb_is_open === '1' || settings.ppdb_is_open === 'true'
    const heroTitle = settings.ppdb_hero_title || 'Masa Depanmu Dimulai di Sini.'
    const heroSubtitle = settings.ppdb_hero_subtitle || 'Bergabunglah bersama komunitas pembelajar kreatif dan inovatif di SMK PPRQ.'
    const handleInputChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
    }

    const handlePreview = (e) => {
        e.preventDefault()
        if (!formData.nama_lengkap || !formData.asal_sekolah || !formData.no_whatsapp || !formData.alamat_lengkap) {
            Swal.fire('Peringatan', 'Mohon lengkapi semua data wajib yang bertanda (*)', 'warning')
            return
        }
        if (!formData.jurusan_pilihan) {
            Swal.fire('Peringatan', 'Mohon pilih Kompetensi Keahlian yang diminati', 'warning')
            return
        }
        setShowPreview(true)
    }

    const handleSubmit = async () => {

        setSubmitting(true)
        try {
            const data = await postPublic('/ppdb', { ...formData, gelombang_id: selectedGelombang })

            if (!data.error) {
                // Show Confetti
                try {
                    const confetti = (await import('canvas-confetti')).default;
                    confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
                } catch(e) {}

                setPrintData(data.data);
                setShowPreview(false);

                // Auto-login: save token and redirect to dashboard
                if (data.data.token) {
                    localStorage.setItem('ppdb_token', data.data.token);
                    localStorage.setItem('ppdb_user', JSON.stringify({ nama: data.data.nama_lengkap, status: 'draft' }));
                }

                const result = await Swal.fire({
                    title: 'Pendaftaran Berhasil! 🎉',
                    html: `
                        <div style="text-align: center; background: rgba(99, 102, 241, 0.05); padding: 25px; border-radius: 20px; margin-top: 20px; border: 2px dashed var(--portal-primary);">
                            <p style="margin-bottom: 10px; font-weight: 500; color: #64748b;">Nomor Registrasi Anda:</p>
                            <h2 style="color: var(--portal-primary); margin: 5px 0; font-size: 2.2rem; letter-spacing: 2px; font-weight: 900;">${data.data.registration_number}</h2>
                            <div style="margin: 15px 0; background: #fff; padding: 15px; border-radius: 12px; display: inline-block; border: 1px solid #e2e8f0; width: 100%; max-width: 250px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
                                 <p style="margin: 0 0 5px 0; font-size: 0.8rem; color: #64748b; font-weight: 700; text-transform: uppercase;">🔑 PIN LOGIN ANDA</p>
                                 <div style="font-size: 2rem; font-weight: 900; color: #1e293b; letter-spacing: 6px;">${data.data.pin}</div>
                            </div>
                            <p style="font-size: 0.85rem; color: #b45309; margin-top: 10px; line-height: 1.5; font-weight: 700; background: #fef3c7; padding: 12px; border-radius: 10px;">
                                📸 HARAP SCREENSHOT & SIMPAN DATA INI SECARA RAHASIA!<br/>Akan digunakan untuk akses Login kembali.
                            </p>
                        </div>
                    `,
                    icon: 'success',
                    confirmButtonText: 'Lanjutkan Pengisian Biodata →',
                    showDenyButton: false,
                    confirmButtonColor: '#4f46e5',
                    customClass: { popup: 'portal-swal-popup' },
                    allowOutsideClick: false
                });

                if (result.isConfirmed) {
                    navigate('/ppdb/dashboard');
                }

                setFormData({
                    nama_lengkap: '', tempat_lahir: '', tgl_lahir: '',
                    jenis_kelamin: 'L', agama: '', jurusan_pilihan: '', asal_sekolah: '',
                    no_whatsapp: '', alamat_lengkap: ''
                })
                setSelectedGelombang(null)
            } else {
                Swal.fire('Gagal', data.error || 'Terjadi kesalahan saat mengirim data.', 'error')
            }
        } catch (err) {
            Swal.fire('Error', 'Gagal menghubungi server.', 'error')
        } finally {
            setSubmitting(false)
        }
    }

    const handleCheckStatus = async (e) => {
        e.preventDefault()
        if (!searchQuery) {
            Swal.fire('Peringatan', 'Masukkan nomor registrasi atau NISN Anda.', 'warning')
            return
        }

        setLoading(true)
        try {
            const data = await postPublic('/ppdb/check', { identifier: searchQuery })

            if (!data.error) {
                const statusColors = {
                    draft: '#94a3b8',
                    pending_verification: '#f59e0b',
                    wawancara: '#3b82f6',
                    accepted: '#10b981',
                    rejected: '#ef4444'
                }
                const statusText = {
                    draft: 'Draft Berkas',
                    pending_verification: 'Menunggu Verifikasi',
                    wawancara: 'Tahap Wawancara',
                    accepted: 'Diterima / Lolos Seleksi',
                    rejected: 'Ditolak / Tidak Lolos'
                }

                Swal.fire({
                    title: 'Status Pendaftaran',
                    html: `
                        <div style="text-align: left; background: #f8fafc; padding: 24px; border-radius: 20px; border: 1px solid #e2e8f0; margin-top: 10px;">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
                                <span style="font-size: 0.8rem; color: #64748b; font-weight: 700; letter-spacing: 0.05em;">STATUS SAAT INI</span>
                                <span style="background: ${statusColors[data.status] || '#64748b'}; color: white; padding: 6px 14px; border-radius: 50px; font-size: 0.75rem; font-weight: 800; text-transform: uppercase; box-shadow: 0 4px 12px ${statusColors[data.status]}44;">
                                    ${statusText[data.status] || data.status}
                                </span>
                            </div>
                            
                            <div style="display: grid; gap: 16px;">
                                <div>
                                    <label style="display: block; font-size: 0.7rem; color: #94a3b8; font-weight: 700; text-transform: uppercase; margin-bottom: 4px;">Nomor Registrasi</label>
                                    <div style="font-weight: 800; color: var(--portal-primary); font-size: 1.2rem; letter-spacing: 1px;">${data.registration_number}</div>
                                </div>
                                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                                    <div>
                                        <label style="display: block; font-size: 0.7rem; color: #94a3b8; font-weight: 700; text-transform: uppercase; margin-bottom: 4px;">Nama Lengkap</label>
                                        <div style="font-weight: 700; color: #1e293b; font-size: 0.95rem;">${data.nama_lengkap}</div>
                                    </div>
                                    <div>
                                        <label style="display: block; font-size: 0.7rem; color: #94a3b8; font-weight: 700; text-transform: uppercase; margin-bottom: 4px;">NISN</label>
                                        <div style="font-weight: 700; color: #1e293b; font-size: 0.95rem;">${data.nisn || '-'}</div>
                                    </div>
                                </div>
                                <div>
                                    <label style="display: block; font-size: 0.7rem; color: #94a3b8; font-weight: 700; text-transform: uppercase; margin-bottom: 4px;">Sekolah Asal</label>
                                    <div style="font-weight: 600; color: #475569; font-size: 0.95rem;">${data.asal_sekolah}</div>
                                </div>
                            </div>
                            
                            <div style="margin-top: 24px; padding-top: 16px; border-top: 1px dashed #e2e8f0; font-size: 0.75rem; color: #94a3b8;">
                                📅 Terdaftar pada ${new Date(data.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                            </div>
                        </div>

                        ${data.status === 'pending_verification' ? `
                            <div style="margin-top: 20px; padding: 16px; background: rgba(245, 158, 11, 0.05); border-radius: 12px; border: 1px solid rgba(245, 158, 11, 0.1); text-align: left;">
                                <p style="margin: 0; font-size: 0.85rem; color: #854d0e; line-height: 1.5;">
                                    <strong>ℹ️ Informasi:</strong> Data Anda telah tersimpan dan sedang diverifikasi oleh tim panitia. Silakan tunggu pengumuman selanjutnya.
                                </p>
                            </div>
                        ` : ''}
                        
                        ${data.status === 'accepted' ? `
                            <div style="margin-top: 20px; padding: 16px; background: rgba(16, 185, 129, 0.05); border-radius: 12px; border: 1px solid rgba(16, 185, 129, 0.1); text-align: left;">
                                <p style="margin: 0; font-size: 0.85rem; color: #065f46; line-height: 1.5;">
                                    <strong>✅ Selamat!</strong> Anda dinyatakan DITERIMA. Silakan login ke Dashboard Pendaftar untuk melihat kelas penempatan dan langkah selanjutnya.
                                </p>
                            </div>
                        ` : ''}
                    `,
                    confirmButtonText: 'Selesai',
                    confirmButtonColor: 'var(--portal-primary)',
                    customClass: {
                        popup: 'portal-swal-popup'
                    }
                })
            } else {
                Swal.fire({
                    title: 'Data Tidak Ditemukan',
                    text: data.error || 'Mohon periksa kembali nomor registrasi atau NISN Anda.',
                    icon: 'error',
                    confirmButtonText: 'Coba Lagi',
                    confirmButtonColor: 'var(--portal-primary)',
                    customClass: {
                        popup: 'portal-swal-popup'
                    }
                })
            }
        } catch (err) {
            Swal.fire('Error', 'Gagal memproses permintaan. Pastikan koneksi internet stabil.', 'error')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="portal-page">
            <Helmet>
                <title>Pendaftaran PPDB | Portal SMK PPRQ</title>
                <meta name="description" content="Penerimaan Peserta Didik Baru (PPDB) SMK PPRQ. Segera daftarkan diri Anda dan raih masa depan yang gemilang bersama kami." />
            </Helmet>
            <style>{`
                @media print {
                    body * { visibility: hidden; }
                    .print-card-container, .print-card-container * {
                        visibility: visible;
                    }
                    .print-card-container {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                    }
                    .no-print { display: none !important; }
                }
                .hero-glass {
                    background: var(--portal-gradient-hero);
                    padding: 100px 0 120px;
                    color: white;
                    text-align: center;
                    position: relative;
                    overflow: hidden;
                }
                .hero-glass::before {
                    content: '';
                    position: absolute;
                    top: -50%;
                    left: -50%;
                    width: 200%;
                    height: 200%;
                    background: radial-gradient(circle, rgba(99, 102, 241, 0.1) 0%, transparent 60%);
                    animation: rotate 30s linear infinite;
                }
                @keyframes rotate { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                
                .ppdb-status-badge {
                    padding: 8px 18px;
                    border-radius: 50px;
                    font-weight: 700;
                    font-size: 0.8rem;
                    text-transform: uppercase;
                    display: inline-flex;
                    align-items: center;
                    gap: 10px;
                    margin-bottom: 24px;
                    backdrop-filter: blur(10px);
                    animation: fadeInUp 0.6s ease both;
                }
                .badge-open { background: rgba(34, 197, 94, 0.15); color: #4ade80; border: 1px solid rgba(34, 197, 94, 0.2); }
                .badge-closed { background: rgba(239, 68, 68, 0.15); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.2); }

                .form-container-glass {
                    background: rgba(255, 255, 255, 0.9);
                    backdrop-filter: blur(30px);
                    border: 1px solid rgba(255, 255, 255, 0.8);
                    border-radius: 28px;
                    box-shadow: 0 25px 50px -12px rgba(0,0,0,0.08);
                    padding: 48px;
                    transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
                }
                
                .portal-form-title-group {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    margin-bottom: 28px;
                    padding-bottom: 12px;
                    border-bottom: 1px solid #f1f5f9;
                    color: var(--portal-primary);
                }
                .portal-form-title-group h3 {
                    font-size: 1.15rem;
                    font-weight: 800;
                    margin: 0;
                    letter-spacing: -0.01em;
                }
                
                .form-section-divider {
                    height: 1px;
                    background: #f1f5f9;
                    margin: 40px 0;
                }

                .step-card {
                    background: white;
                    padding: 24px 16px;
                    border-radius: 20px;
                    text-align: center;
                    transition: all 0.4s var(--portal-ease);
                    border: 1px solid #f1f5f9;
                    height: 100%;
                }
                .step-card:hover { transform: translateY(-5px); box-shadow: var(--portal-shadow-lg); border-color: var(--portal-primary-light); }
                .step-icon {
                    width: 48px;
                    height: 48px;
                    background: var(--portal-gradient-soft);
                    border-radius: 14px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin: 0 auto 16px;
                    color: var(--portal-primary);
                    transition: all 0.4s var(--portal-ease);
                }
                .step-icon svg { width: 22px; height: 22px; }
                .step-card:hover .step-icon { background: var(--portal-primary); color: white; transform: scale(1.1); }

                .steps-flow-container {
                    display: flex;
                    align-items: stretch;
                    justify-content: center;
                    gap: 0;
                    margin: 0 -10px;
                }

                .step-item-wrapper {
                    flex: 1;
                    display: flex;
                    align-items: center;
                    padding: 0 10px;
                }

                .step-arrow-connector {
                    color: var(--portal-primary);
                    opacity: 0.5;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 0 5px;
                    animation: pulse-glow 3s infinite ease-in-out;
                }

                @media (max-width: 1024px) {
                    .steps-flow-container {
                        flex-direction: column;
                        gap: 24px;
                        margin: 0;
                    }
                    .step-item-wrapper {
                        width: 100%;
                        flex-direction: column;
                        padding: 0;
                    }
                    .step-arrow-connector {
                        transform: rotate(90deg);
                        margin: -10px 0;
                        opacity: 0.4;
                    }
                }

                .tab-switch {
                    display: flex;
                    background: #f1f5f9;
                    padding: 7px;
                    border-radius: 16px;
                    margin-bottom: 32px;
                }
                .tab-btn {
                    flex: 1;
                    padding: 12px;
                    border-radius: 12px;
                    border: none;
                    font-weight: 700;
                    cursor: pointer;
                    transition: all 0.3s var(--portal-ease);
                    color: #64748b;
                    font-size: 0.95rem;
                }
                .tab-btn.active { background: white; color: var(--portal-primary); box-shadow: 0 10px 15px -3px rgba(0,0,0,0.05); }

                .closed-state {
                    padding: 80px 40px;
                    text-align: center;
                    background: #f8fafc;
                    border-radius: 28px;
                    border: 2px dashed #e2e8f0;
                    animation: scaleIn 0.5s ease both;
                }

                .portal-swal-popup {
                    border-radius: 24px !important;
                }
                
                /* Helper classes for neat form */
                .form-row { display: grid; gap: 24px; margin-bottom: 24px; }
                @media (min-width: 768px) { .form-row-2 { grid-template-columns: repeat(2, 1fr); } }
                
                .info-panel {
                    background: white;
                    border: 1px solid #f1f5f9;
                    border-radius: 28px;
                    padding: 40px;
                    height: 100%;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    text-align: center;
                }

                .requirement-list {
                    width: 100%;
                    max-width: 450px;
                    margin: 0 auto 24px;
                }

                .requirement-item {
                    display: flex;
                    align-items: center;
                    justify-content: flex-start;
                    gap: 12px;
                    padding: 12px 20px;
                    background: #f8fafc;
                    border-radius: 12px;
                    border: 1px solid #f1f5f9;
                    margin-bottom: 12px;
                    transition: all 0.3s ease;
                    text-align: left;
                }
                .requirement-item:hover {
                    border-color: var(--portal-primary-light);
                    background: white;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.03);
                    transform: translateX(4px);
                }
                .requirement-check {
                    color: var(--portal-primary);
                    flex-shrink: 0;
                    margin-top: 2px;
                }
                .requirement-text {
                    font-size: 0.9rem;
                    color: #475569;
                    font-weight: 500;
                    line-height: 1.4;
                }

                .note-box-premium {
                    margin-top: 32px;
                    padding: 24px;
                    background: linear-gradient(to right, #fffdfa, #fffbeb);
                    border-radius: 20px;
                    border: 1px solid #fef3c7;
                    border-top: 4px solid #f59e0b;
                    position: relative;
                    overflow: hidden;
                    text-align: center;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    width: 100%;
                }
                .note-box-premium::after {
                    content: 'i';
                    position: absolute;
                    right: -10px;
                    bottom: -20px;
                    font-size: 100px;
                    font-weight: 900;
                    color: rgba(245, 158, 11, 0.05);
                    font-family: serif;
                    font-style: italic;
                }
                
                .wa-button-float {
                    background: var(--portal-primary);
                    color: white;
                    padding: 24px;
                    border-radius: 24px;
                    display: flex;
                    align-items: center;
                    gap: 18px;
                    text-decoration: none;
                    transition: all 0.3s;
                    margin-top: 32px;
                    box-shadow: 0 10px 25px rgba(99, 102, 241, 0.2);
                }
                .wa-button-float:hover { transform: scale(1.02); box-shadow: 0 15px 35px rgba(99, 102, 241, 0.3); }
            `}</style>

            <div className="hero-glass">
                <div className="portal-container" style={{ position: 'relative', zIndex: 1 }}>
                    <div className={isOpen ? 'ppdb-status-badge badge-open' : 'ppdb-status-badge badge-closed'}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'currentColor', boxShadow: '0 0 10px currentColor' }}></div>
                        {isOpen ? 'Pendaftaran Dibuka' : 'Pendaftaran Online Ditutup'}
                    </div>
                    <h1 style={{ fontSize: '3.5rem', fontWeight: 900, marginBottom: '20px', letterSpacing: '-0.04em', lineHeight: 1.1 }}>
                        {heroTitle}
                    </h1>
                    <p style={{ fontSize: '1.25rem', opacity: 0.8, maxWidth: '750px', margin: '0 auto', lineHeight: 1.6 }}>
                        Tahun Ajaran {settings.ppdb_year || '2025/2026'}. {heroSubtitle}
                    </p>
                </div>
            </div>

            <section className="portal-section" style={{ marginTop: '-60px', position: 'relative', zIndex: 2 }}>
                <div className="portal-container">
                    {/* Steps Container */}
                    <div className="portal-section-header">
                        <span className="portal-section-label">Langkah Pendaftaran</span>
                        <h2 className="portal-section-title">Alur Penerimaan Peserta Didik</h2>
                    </div>

                    <div style={{ maxWidth: '1140px', margin: '0 auto 80px' }}>
                        <div className="steps-flow-container">
                            {steps.length > 0 ? steps.map((step, idx) => (
                                <div key={step.id} className="step-item-wrapper stagger-item" style={{ animationDelay: `${idx * 0.2}s` }}>
                                    <div className="step-card" style={{ width: '100%' }}>
                                        <div className="step-icon">
                                            <span style={{ fontSize: '1.5rem' }}>{step.icon || '📌'}</span>
                                        </div>
                                        <h3 style={{ fontSize: '0.92rem', fontWeight: 800, marginBottom: '8px', color: '#1e293b' }}>{step.title}</h3>
                                        <p style={{ fontSize: '0.78rem', color: '#64748b', lineHeight: 1.5, margin: 0 }}>{step.description}</p>
                                    </div>
                                    {idx < steps.length - 1 && (
                                        <div className="step-arrow-connector">
                                            <ChevronRight size={28} strokeWidth={1.5} />
                                        </div>
                                    )}
                                </div>
                            )) : (
                                <div style={{ textAlign: 'center', width: '100%', padding: '20px', color: '#64748b' }}>Belum ada langkah pendaftaran.</div>
                            )}
                        </div>
                    </div>

                    <div className="portal-grid-2" style={{ gap: '48px', alignItems: 'start' }}>
                        {/* Info Section */}
                        <div className="portal-animate-in">
                            <div className="portal-section-header" style={{ textAlign: 'center', alignItems: 'center', marginBottom: 32 }}>
                                <span className="portal-section-label">Panduan Siswa</span>
                                <h2 className="portal-section-title">Syarat & Ketentuan</h2>
                            </div>

                            <div className="info-panel">
                                <div className="requirement-list">
                                    {requirements.length > 0 ? requirements.map((req, i) => (
                                        <div key={req.id} className="requirement-item stagger-item" style={{ animationDelay: `${i * 0.2}s` }}>
                                            <div className="requirement-check">
                                                <CheckCircle2 size={18} strokeWidth={2.5} />
                                            </div>
                                            <span className="requirement-text">{req.text}</span>
                                        </div>
                                    )) : (
                                        <div style={{ textAlign: 'center', padding: '10px', color: '#64748b' }}>Belum ada syarat dokumen.</div>
                                    )}
                                </div>

                                <div className="note-box-premium">
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: '10px', color: '#b45309' }}>
                                        <AlertCircle size={20} strokeWidth={2.5} />
                                        <span style={{ fontWeight: 800, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Catatan Penting</span>
                                    </div>
                                    <p style={{ fontSize: '0.88rem', color: '#92400e', lineHeight: 1.6, margin: 0, fontWeight: 500 }}>
                                        Setelah mengisi formulir online, harap segera melakukan verifikasi berkas ke sekolah pada hari kerja dengan membawa dokumen fisik yang tertera di atas untuk proses validasi.
                                    </p>
                                </div>
                            </div>

                            <a href={`https://wa.me/${(settings.ppdb_contact_wa || settings.wa_number || '').replace(/^0/, '62')}`} target="_blank" rel="noreferrer" className="wa-button-float">
                                <div style={{ background: 'white', color: 'var(--portal-primary)', width: 44, height: 44, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Phone size={20} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>Konsultasi Via WhatsApp</h4>
                                    <p style={{ margin: 0, fontSize: '0.85rem', opacity: 0.9 }}>Tanya seputar jurusan & pendaftaran</p>
                                </div>
                                <ArrowRight size={24} />
                            </a>
                        </div>

                        {/* Form Section */}
                        <div className="portal-animate-in portal-animate-delay-1">
                            <div className="tab-switch">
                                <button className={`tab-btn ${activeTab === 'register' ? 'active' : ''}`} onClick={() => setActiveTab('register')}>
                                    Formulir Pendaftaran
                                </button>
                                <button className={`tab-btn ${activeTab === 'check' ? 'active' : ''}`} onClick={() => setActiveTab('check')}>
                                    Cek Status
                                </button>
                            </div>

                            <div style={{ textAlign: 'center', marginBottom: '32px', padding: '16px', background: 'rgba(99, 102, 241, 0.03)', borderRadius: '20px', border: '1px solid rgba(99, 102, 241, 0.1)' }}>
                                <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0 0 10px 0', fontWeight: 600 }}>Sudah terdaftar? Silakan masuk ke dashboard untuk melengkapi data.</p>
                                <Link to="/ppdb/login" className="portal-btn" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'var(--portal-primary)', color: 'white', padding: '10px 24px', fontSize: '0.9rem', borderRadius: '14px', textDecoration: 'none', fontWeight: 700, transition: 'all 0.3s' }}>
                                    Login Dashboard Siswa <ArrowRight size={18} />
                                </Link>
                            </div>

                            {activeTab === 'register' ? (
                                !isOpen ? (
                                    <div className="closed-state">
                                        <div style={{ padding: 20, background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', borderRadius: '50%', width: 80, height: 80, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                                            <Calendar size={40} />
                                        </div>
                                        <h3 style={{ fontSize: '1.6rem', fontWeight: 900, marginBottom: '12px', color: '#1e293b' }}>Pendaftaran Belum Dibuka</h3>
                                        <p style={{ color: '#64748b', lineHeight: 1.6, maxWidth: '350px', margin: '0 auto' }}>Mohon maaf, saat ini pendaftaran online sedang ditutup. Pantau terus sosial media kami untuk info pembukaan.</p>
                                    </div>
                                ) : (
                                    <div className="form-container-glass">
                                        <form onSubmit={handlePreview}>
                                            {/* Gelombang Selection */}
                                            {gelombangList.length > 0 && (
                                                <div style={{ marginBottom: '24px' }}>
                                                    <div className="portal-form-title-group" style={{ marginBottom: '14px' }}>
                                                        <GraduationCap size={22} strokeWidth={2.5} />
                                                        <h3>Pilih Gelombang Pendaftaran</h3>
                                                    </div>
                                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
                                                        {gelombangList.map(g => {
                                                            const pct = g.kuota > 0 ? Math.min(((g.terisi || 0) / g.kuota) * 100, 100) : 0
                                                            const isFull = (g.terisi || 0) >= g.kuota
                                                            const isEnded = g.date_status === 'ended'
                                                            const isNotOpen = g.date_status === 'not_yet_open'
                                                            const isDisabled = isFull || isEnded || isNotOpen
                                                            const isSelected = selectedGelombang === g.id
                                                            
                                                            let statusLabel = 'SEDANG BERJALAN'
                                                            let statusColor = '#22c55e'
                                                            if (isFull) { statusLabel = 'KUOTA PENUH'; statusColor = '#ef4444'; }
                                                            else if (isEnded) { statusLabel = 'SUDAH BERAKHIR'; statusColor = '#64748b'; }
                                                            else if (isNotOpen) { statusLabel = 'BELUM DIBUKA'; statusColor = '#f59e0b'; }

                                                            return (
                                                                <button type="button" key={g.id} disabled={isDisabled} onClick={() => setSelectedGelombang(isSelected ? null : g.id)}
                                                                    style={{ padding: '16px', borderRadius: '14px', border: isSelected ? '2px solid var(--portal-primary)' : '1px solid #e2e8f0', background: isSelected ? 'var(--portal-gradient-soft)' : 'white', cursor: isDisabled ? 'not-allowed' : 'pointer', textAlign: 'left', opacity: isDisabled ? 0.6 : 1, transition: 'all 0.2s', position: 'relative', overflow: 'hidden' }}>
                                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                                                        <div style={{ fontWeight: 800, fontSize: '0.88rem', color: isSelected ? 'var(--portal-primary)' : '#1e293b' }}>{g.nama}</div>
                                                                        <div style={{ fontSize: '0.6rem', fontWeight: 900, padding: '2px 8px', borderRadius: '20px', background: `${statusColor}15`, color: statusColor, border: `1px solid ${statusColor}30`, whiteSpace: 'nowrap' }}>
                                                                            {statusLabel}
                                                                        </div>
                                                                    </div>
                                                                    <div style={{ height: '6px', background: '#e2e8f0', borderRadius: '3px', overflow: 'hidden', marginBottom: '10px' }}>
                                                                        <div style={{ height: '100%', width: `${pct}%`, background: isFull ? '#ef4444' : (isSelected ? 'var(--portal-primary)' : statusColor), borderRadius: '3px' }} />
                                                                    </div>
                                                                    <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600, display: 'flex', justifyContent: 'space-between' }}>
                                                                        <span>{isFull ? 'PENUH' : `${g.terisi || 0}/${g.kuota} terisi`}</span>
                                                                        {g.tanggal_buka && g.tanggal_tutup && (
                                                                            <span>
                                                                                {new Date(g.tanggal_buka).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} - {new Date(g.tanggal_tutup).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </button>
                                                            )
                                                        })}
                                                    </div>
                                                </div>
                                            )}

                                            <div className="portal-form-title-group">
                                                <User size={22} strokeWidth={2.5} />
                                                <h3>Identitas Calon Siswa</h3>
                                            </div>

                                            <div className="portal-form-group">
                                                <label className="portal-form-label">Nama Lengkap <span style={{ color: 'var(--portal-danger)' }}>*</span></label>
                                                <input type="text" name="nama_lengkap" className="portal-form-input" value={formData.nama_lengkap} onChange={handleInputChange} placeholder="Sesuai Akta Kelahiran" required />
                                            </div>

                                            <div className="form-row form-row-2">
                                                <div className="portal-form-group">
                                                    <label className="portal-form-label">Tempat Lahir</label>
                                                    <input type="text" name="tempat_lahir" className="portal-form-input" value={formData.tempat_lahir} onChange={handleInputChange} placeholder="Kota Kelahiran" />
                                                </div>
                                                <div className="portal-form-group">
                                                    <label className="portal-form-label">Tanggal Lahir</label>
                                                    <input type="date" name="tgl_lahir" className="portal-form-input" value={formData.tgl_lahir} onChange={handleInputChange} />
                                                </div>
                                            </div>

                                            <div className="form-row form-row-2">
                                                <div className="portal-form-group">
                                                    <label className="portal-form-label">Jenis Kelamin</label>
                                                    <select name="jenis_kelamin" className="portal-form-input" value={formData.jenis_kelamin} onChange={handleInputChange}>
                                                        <option value="L">Laki-laki</option>
                                                        <option value="P">Perempuan</option>
                                                    </select>
                                                </div>
                                                <div className="portal-form-group">
                                                    <label className="portal-form-label">Agama</label>
                                                    <select name="agama" className="portal-form-input" value={formData.agama} onChange={handleInputChange}>
                                                        <option value="">Pilih Agama</option>
                                                        <option value="Islam">Islam</option>
                                                        <option value="Kristen">Kristen</option>
                                                        <option value="Katholik">Katholik</option>
                                                        <option value="Hindu">Hindu</option>
                                                        <option value="Budha">Budha</option>
                                                    </select>
                                                </div>
                                            </div>

                                            <div className="form-section-divider"></div>

                                            <div className="portal-form-title-group" style={{ color: '#8b5cf6' }}>
                                                <GraduationCap size={22} strokeWidth={2.5} />
                                                <h3>Pilih Kompetensi Keahlian <span style={{ color: 'var(--portal-danger)' }}>*</span></h3>
                                            </div>

                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '14px', marginBottom: '32px' }}>
                                                {JURUSAN_OPTIONS.map(j => {
                                                    const Icon = j.icon;
                                                    const isSelected = formData.jurusan_pilihan === j.id;
                                                    return (
                                                        <button type="button" key={j.id}
                                                            onClick={() => setFormData(p => ({ ...p, jurusan_pilihan: isSelected ? '' : j.id }))}
                                                            style={{
                                                                padding: '20px 16px', borderRadius: '18px', cursor: 'pointer', textAlign: 'left',
                                                                border: isSelected ? `2px solid ${j.color}` : '2px solid #f1f5f9',
                                                                background: isSelected ? `${j.color}08` : 'white',
                                                                transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                                                                transform: isSelected ? 'scale(1.02)' : 'scale(1)',
                                                                boxShadow: isSelected ? `0 8px 25px ${j.color}20` : '0 2px 8px rgba(0,0,0,0.03)',
                                                                position: 'relative', overflow: 'hidden'
                                                            }}
                                                        >
                                                            {isSelected && <div style={{ position: 'absolute', top: 10, right: 10, width: 22, height: 22, borderRadius: '50%', background: j.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><CheckCircle2 size={14} style={{ color: 'white' }} /></div>}
                                                            <div style={{ width: 44, height: 44, borderRadius: '14px', background: `${j.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12, color: j.color, transition: 'all 0.3s' }}>
                                                                <Icon size={22} />
                                                            </div>
                                                            <div style={{ fontSize: '0.75rem', fontWeight: 900, color: j.color, letterSpacing: '0.05em', marginBottom: 4 }}>{j.abbr}</div>
                                                            <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#1e293b', lineHeight: 1.3, marginBottom: 6 }}>{j.label}</div>
                                                            <div style={{ fontSize: '0.75rem', color: '#94a3b8', lineHeight: 1.4 }}>{j.desc}</div>
                                                        </button>
                                                    );
                                                })}
                                            </div>

                                            <div className="form-section-divider"></div>

                                            <div className="portal-form-title-group" style={{ color: 'var(--portal-accent)' }}>
                                                <BookOpen size={22} strokeWidth={2.5} />
                                                <h3>Informasi Akademik & Kontak</h3>
                                            </div>

                                            <div className="portal-form-group">
                                                <label className="portal-form-label">Nama Sekolah Asal <span style={{ color: 'var(--portal-danger)' }}>*</span></label>
                                                <input type="text" name="asal_sekolah" className="portal-form-input" value={formData.asal_sekolah} onChange={handleInputChange} placeholder="Contoh: SMP Negeri 1 Jakarta" required />
                                            </div>

                                            <div className="portal-form-group">
                                                <label className="portal-form-label">No. WhatsApp <span style={{ color: 'var(--portal-danger)' }}>*</span></label>
                                                <input type="tel" name="no_whatsapp" className="portal-form-input" value={formData.no_whatsapp} onChange={handleInputChange} placeholder="08xxxxxxxxxx (Wajib ada WA Aktif)" required />
                                            </div>

                                            <div className="portal-form-group">
                                                <label className="portal-form-label">Alamat Lengkap <span style={{ color: 'var(--portal-danger)' }}>*</span></label>
                                                <textarea name="alamat_lengkap" className="portal-form-textarea" value={formData.alamat_lengkap} onChange={handleInputChange} rows="3" placeholder="Jl. Contoh No. 123, RT/RW, Kelurahan, Kecamatan" required></textarea>
                                            </div>

                                            <button
                                                type="submit"
                                                className="portal-btn portal-btn-primary"
                                                style={{ width: '100%', height: '60px', borderRadius: '18px', fontSize: '1.05rem', marginTop: '16px', boxShadow: '0 15px 30px rgba(99, 102, 241, 0.3)' }}
                                                disabled={submitting}
                                            >
                                                <Eye size={20} /> Preview & Kirim Pendaftaran
                                            </button>
                                        </form>
                                    </div>
                                )
                            ) : (
                                <div className="form-container-glass">
                                    <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                                        <div style={{ width: 70, height: 70, background: 'var(--portal-gradient-soft)', borderRadius: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', color: 'var(--portal-primary)' }}>
                                            <Search size={32} />
                                        </div>
                                        <h3 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#1e293b' }}>Lacak Status Pendaftaran</h3>
                                        <p style={{ color: '#64748b', fontSize: '0.95rem' }}>Gunakan Nomor Registrasi atau NISN Anda.</p>
                                    </div>

                                    <form onSubmit={handleCheckStatus}>
                                        <div className="portal-form-group">
                                            <input
                                                type="text"
                                                className="portal-form-input"
                                                placeholder="Contoh: PPDB-2026-001"
                                                value={searchQuery}
                                                onChange={e => setSearchQuery(e.target.value)}
                                                style={{ textAlign: 'center', fontSize: '1.15rem', height: '64px', borderRadius: '18px', background: '#f8fafc' }}
                                            />
                                        </div>
                                        <button className="portal-btn portal-btn-primary" style={{ width: '100%', height: '60px', borderRadius: '18px' }}>
                                            Cek Sekarang <ArrowRight size={20} />
                                        </button>

                                        <div style={{ marginTop: 24, padding: 16, background: 'rgba(59, 130, 246, 0.05)', borderRadius: 12, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                                            <Info size={18} style={{ color: 'var(--portal-info)', marginTop: 2 }} />
                                            <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b', lineHeight: 1.5 }}>Data pendaftaran biasanya muncul di sistem dalam 1x24 jam setelah pengisian formulir online.</p>
                                        </div>
                                    </form>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            <section className="portal-section" style={{ background: '#f8fafc', borderTop: '1px solid #f1f5f9' }}>
                <div className="portal-container">
                    <div className="portal-grid-3" style={{ gap: '32px' }}>
                        <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
                            <div style={{ width: 60, height: 60, background: 'white', borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--portal-primary)', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}><MapPin size={28} /></div>
                            <div>
                                <h4 style={{ fontWeight: 800, marginBottom: 4, fontSize: '1rem' }}>Kampus Utama</h4>
                                <p style={{ color: '#64748b', fontSize: '0.85rem', margin: 0 }}>{settings.contact_address || 'Jl. Pendidikan No. 123, Kota Pendidikan'}</p>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
                            <div style={{ width: 60, height: 60, background: 'white', borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--portal-primary)', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}><Calendar size={28} /></div>
                            <div>
                                <h4 style={{ fontWeight: 800, marginBottom: 4, fontSize: '1rem' }}>Jam Layanan</h4>
                                <p style={{ color: '#64748b', fontSize: '0.85rem', margin: 0 }}>{settings.opening_hours || 'Senin - Jumat | 08.00 - 15.00 WIB'}</p>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
                            <div style={{ width: 60, height: 60, background: 'white', borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--portal-primary)', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}><CheckCircle2 size={28} /></div>
                            <div>
                                <h4 style={{ fontWeight: 800, marginBottom: 4, fontSize: '1rem' }}>Kuota Terbatas</h4>
                                <p style={{ color: '#64748b', fontSize: '0.85rem', margin: 0 }}>Segera daftar sebelum kuota jurusan terpenuhi.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Hidden Print Container */}
            {printData && (
                <div className="print-card-container" style={{ display: 'none' }}>
                    <div style={{ display: 'block', padding: '40px', fontFamily: 'sans-serif', maxWidth: '800px', margin: '0 auto', border: '5px solid #1e293b', borderRadius: '20px', background: 'white' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #e2e8f0', paddingBottom: '20px', marginBottom: '20px' }}>
                            <div>
                                <h1 style={{ margin: 0, fontSize: '28px', color: '#1e293b' }}>KARTU PENDAFTARAN PPDB</h1>
                                <p style={{ margin: '5px 0 0 0', color: '#64748b' }}>Tahun Ajaran {settings.ppdb_year || '2025/2026'}</p>
                            </div>
                            <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${printData.username}`} alt="QR Code" style={{ width: '80px', height: '80px' }} />
                        </div>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '30px' }}>
                            <div>
                                <p style={{ fontWeight: 600, color: '#94a3b8', margin: '0 0 5px 0', fontSize: '14px', textTransform: 'uppercase' }}>Nomor Registrasi</p>
                                <p style={{ margin: 0, fontWeight: 800, fontSize: '20px', color: '#1e293b' }}>{printData.registration_number}</p>
                            </div>
                            <div>
                                <p style={{ fontWeight: 600, color: '#94a3b8', margin: '0 0 5px 0', fontSize: '14px', textTransform: 'uppercase' }}>Nama Lengkap</p>
                                <p style={{ margin: 0, fontWeight: 700, fontSize: '18px', color: '#334155' }}>{printData.nama_lengkap}</p>
                            </div>
                            <div>
                                <p style={{ fontWeight: 600, color: '#94a3b8', margin: '0 0 5px 0', fontSize: '14px', textTransform: 'uppercase' }}>Asal Sekolah</p>
                                <p style={{ margin: 0, fontWeight: 700, fontSize: '18px', color: '#334155' }}>{printData.asal_sekolah}</p>
                            </div>
                        </div>

                        <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '15px', border: '1px solid #e2e8f0' }}>
                            <h3 style={{ margin: '0 0 15px 0', color: '#1e293b' }}>KREDENSIAL LOGIN DASBOR PPDB</h3>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
                                <div>
                                    <p style={{ margin: '0 0 5px 0', color: '#64748b', fontSize: '14px' }}>Username:</p>
                                    <p style={{ margin: 0, fontWeight: 800, fontSize: '18px', color: '#4f46e5' }}>{printData.username}</p>
                                </div>
                                <div>
                                    <p style={{ margin: '0 0 5px 0', color: '#64748b', fontSize: '14px' }}>PIN Rahasia:</p>
                                    <p style={{ margin: 0, fontWeight: 800, fontSize: '18px', color: '#ef4444' }}>{printData.pin}</p>
                                </div>
                            </div>
                            <p style={{ margin: '20px 0 0 0', fontSize: '13px', color: '#ef4444' }}>* PENTING: Gunakan akun di atas untuk login ke Dasbor PPDB dan melengkapi berkas. Jangan berikan PIN kepada orang lain.</p>
                        </div>
                    </div>
                </div>
            )}
            {/* ── Preview Confirmation Modal ── */}
            {showPreview && (
                <div style={{
                    position: 'fixed', inset: 0, zIndex: 9999,
                    background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(8px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: '20px', animation: 'fadeIn 0.3s ease'
                }}>
                    <div style={{
                        background: 'white', borderRadius: '28px', width: '100%', maxWidth: '580px',
                        maxHeight: '85vh', overflowY: 'auto',
                        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
                        animation: 'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
                    }}>
                        {/* Header */}
                        <div style={{ padding: '28px 32px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 900, color: '#1e293b' }}>Konfirmasi Data</h2>
                                <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '0.85rem' }}>Pastikan data berikut sudah benar</p>
                            </div>
                            <button onClick={() => setShowPreview(false)} style={{ background: '#f1f5f9', border: 'none', borderRadius: '12px', width: 40, height: 40, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}><X size={20} /></button>
                        </div>

                        {/* Content */}
                        <div style={{ padding: '24px 32px' }}>
                            {/* Jurusan Badge */}
                            {formData.jurusan_pilihan && (() => {
                                const j = JURUSAN_OPTIONS.find(o => o.id === formData.jurusan_pilihan);
                                if (!j) return null;
                                const Icon = j.icon;
                                return (
                                    <div style={{ background: `${j.color}08`, border: `2px solid ${j.color}25`, borderRadius: '18px', padding: '16px 20px', marginBottom: '20px', display: 'flex', gap: 14, alignItems: 'center' }}>
                                        <div style={{ width: 42, height: 42, borderRadius: '12px', background: `${j.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: j.color }}><Icon size={20} /></div>
                                        <div>
                                            <div style={{ fontSize: '0.7rem', fontWeight: 900, color: j.color, letterSpacing: '0.05em' }}>{j.abbr}</div>
                                            <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#1e293b' }}>{j.label}</div>
                                        </div>
                                    </div>
                                );
                            })()}

                            {/* Data Grid */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                {[
                                    { label: 'Nama Lengkap', value: formData.nama_lengkap },
                                    { label: 'Jenis Kelamin', value: formData.jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan' },
                                    { label: 'Tempat Lahir', value: formData.tempat_lahir || '-' },
                                    { label: 'Tanggal Lahir', value: formData.tgl_lahir ? new Date(formData.tgl_lahir).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-' },
                                    { label: 'Agama', value: formData.agama || '-' },
                                    { label: 'Asal Sekolah', value: formData.asal_sekolah },
                                    { label: 'No. WhatsApp', value: formData.no_whatsapp },
                                ].map((item, i) => (
                                    <div key={i} style={{ padding: '12px', background: '#f8fafc', borderRadius: '12px' }}>
                                        <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 4 }}>{item.label}</div>
                                        <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#1e293b' }}>{item.value}</div>
                                    </div>
                                ))}
                            </div>
                            <div style={{ marginTop: 16, padding: '12px', background: '#f8fafc', borderRadius: '12px' }}>
                                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 4 }}>Alamat Lengkap</div>
                                <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#1e293b', lineHeight: 1.5 }}>{formData.alamat_lengkap}</div>
                            </div>

                            {/* Warning */}
                            <div style={{ marginTop: 20, padding: '14px 18px', background: '#fffbeb', borderRadius: '14px', border: '1px solid #fef3c7', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                                <AlertCircle size={18} style={{ color: '#f59e0b', marginTop: 2, flexShrink: 0 }} />
                                <p style={{ margin: 0, fontSize: '0.8rem', color: '#92400e', lineHeight: 1.5, fontWeight: 500 }}>Setelah dikirim, Anda akan otomatis masuk ke Dashboard untuk melengkapi berkas & foto.</p>
                            </div>
                        </div>

                        {/* Actions */}
                        <div style={{ padding: '0 32px 28px', display: 'flex', gap: 12 }}>
                            <button
                                onClick={() => setShowPreview(false)}
                                style={{ flex: 1, padding: '14px', borderRadius: '14px', border: '2px solid #e2e8f0', background: 'white', fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer', color: '#64748b' }}
                            >
                                Kembali
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={submitting}
                                style={{ flex: 2, padding: '14px', borderRadius: '14px', border: 'none', background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', color: 'white', fontWeight: 800, fontSize: '0.95rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: '0 10px 25px rgba(79,70,229,0.3)' }}
                            >
                                {submitting ? <><div className="portal-spinner" style={{ width: 18, height: 18, borderWidth: 2 }}></div> Memproses...</> : <>Kirim Pendaftaran <ArrowRight size={18} /></>}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes slideUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
            `}</style>
        </div>
    )
}
