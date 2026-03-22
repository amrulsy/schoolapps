import { useState, useEffect } from 'react'
import { Helmet } from 'react-helmet-async'
import { usePortal } from '../context/PortalContext'
import { Search, MapPin, Phone, GraduationCap, CheckCircle2, ClipboardCheck, ArrowRight, User, Calendar, BookOpen, MessageCircle, AlertCircle, Info, ChevronRight } from 'lucide-react'
import Swal from 'sweetalert2'

export default function PortalPPDB() {
    const { fetchPublic, postPublic } = usePortal()
    const [pageContent, setPageContent] = useState(null)
    const [settings, setSettings] = useState({})
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [activeTab, setActiveTab] = useState('register') // 'register' or 'check'
    const [searchQuery, setSearchQuery] = useState('')
    const [steps, setSteps] = useState([])
    const [requirements, setRequirements] = useState([])

    // Form State
    const [formData, setFormData] = useState({
        nisn: '',
        nama_lengkap: '',
        tempat_lahir: '',
        tgl_lahir: '',
        jenis_kelamin: 'L',
        agama: '',
        asal_sekolah: '',
        telepon_siswa: '',
        telepon_ortu: '',
        alamat_lengkap: ''
    })

    useEffect(() => {
        async function loadData() {
            setLoading(true)
            try {
                const [page, settingsData, stepsData, reqsData] = await Promise.all([
                    fetchPublic('/pages/syarat-pendaftaran'),
                    fetchPublic('/settings'),
                    fetchPublic('/ppdb-steps'),
                    fetchPublic('/ppdb-requirements')
                ])
                if (page && !page.error) setPageContent(page)
                if (settingsData) setSettings(settingsData)
                if (stepsData && !stepsData.error) setSteps(stepsData)
                if (reqsData && !reqsData.error) setRequirements(reqsData)
            } catch (err) {
                console.error("Failed to load PPDB data", err)
            } finally {
                setLoading(false)
            }
        }
        loadData()
    }, [fetchPublic])

    const isOpen = settings.registration_open === 'true' || settings.registration_open === '1'

    const handleInputChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        if (!formData.nisn || !formData.nama_lengkap || !formData.asal_sekolah || !formData.telepon_ortu || !formData.alamat_lengkap) {
            Swal.fire('Peringatan', 'Mohon lengkapi semua data wajib yang bertanda (*)', 'warning')
            return
        }

        setSubmitting(true)
        try {
            const data = await postPublic('/ppdb', formData)

            if (!data.error) {
                Swal.fire({
                    title: 'Pendaftaran Berhasil!',
                    html: `
                        <div style="text-align: center; background: rgba(99, 102, 241, 0.05); padding: 25px; border-radius: 20px; margin-top: 20px; border: 2px dashed var(--portal-primary);">
                            <p style="margin-bottom: 10px; font-weight: 500; color: #64748b;">Nomor Registrasi Anda:</p>
                            <h2 style="color: var(--portal-primary); margin: 5px 0; font-size: 2.2rem; letter-spacing: 2px; font-weight: 900;">${data.registration_number}</h2>
                            <p style="font-size: 0.85rem; color: #666; margin-top: 15px; line-height: 1.5;">Harap simpan nomor ini atau screenshot layar ini untuk verifikasi selanjutnya.<br/>Panitia akan menghubungi Anda melalui WhatsApp.</p>
                        </div>
                    `,
                    icon: 'success',
                    confirmButtonText: 'Selesai',
                    confirmButtonColor: 'var(--portal-primary)',
                    customClass: {
                        popup: 'portal-swal-popup'
                    }
                })
                setFormData({
                    nisn: '', nama_lengkap: '', tempat_lahir: '', tgl_lahir: '',
                    jenis_kelamin: 'L', agama: '', asal_sekolah: '',
                    telepon_siswa: '', telepon_ortu: '', alamat_lengkap: ''
                })
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
                    pending: '#f59e0b',
                    approved: '#10b981',
                    rejected: '#ef4444'
                }
                const statusText = {
                    pending: 'Menunggu Verifikasi',
                    approved: 'Diterima / Lolos Seleksi',
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
                                        <div style="font-weight: 700; color: #1e293b; font-size: 0.95rem;">${data.nisn}</div>
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

                        ${data.status === 'pending' ? `
                            <div style="margin-top: 20px; padding: 16px; background: rgba(245, 158, 11, 0.05); border-radius: 12px; border: 1px solid rgba(245, 158, 11, 0.1); text-align: left;">
                                <p style="margin: 0; font-size: 0.85rem; color: #854d0e; line-height: 1.5;">
                                    <strong>ℹ️ Informasi:</strong> Data Anda telah tersimpan. Silakan pastikan berkas fisik sudah diserahkan ke ruang panitia untuk proses verifikasi selanjutnya.
                                </p>
                            </div>
                        ` : ''}
                        
                        ${data.status === 'approved' ? `
                            <div style="margin-top: 20px; padding: 16px; background: rgba(16, 185, 129, 0.05); border-radius: 12px; border: 1px solid rgba(16, 185, 129, 0.1); text-align: left;">
                                <p style="margin: 0; font-size: 0.85rem; color: #065f46; line-height: 1.5;">
                                    <strong>✅ Selamat!</strong> Anda dinyatakan lolos seleksi berkas. Silakan pantau WhatsApp atau email untuk jadwal tahapan selanjutnya (Wawancara & Tes Akademik).
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
                        Masa Depanmu <br /> <span className="portal-text-gradient">Dimulai di Sini.</span>
                    </h1>
                    <p style={{ fontSize: '1.25rem', opacity: 0.8, maxWidth: '750px', margin: '0 auto', lineHeight: 1.6 }}>
                        Tahun Ajaran {settings.ppdb_year || '2026/2027'}. Bergabunglah bersama komunitas pembelajar kreatif dan inovatif di SMK PPRQ.
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
                                <div key={step.id} className="step-item-wrapper">
                                    <div className="step-card" style={{ animationDelay: `${idx * 0.1}s`, width: '100%' }}>
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
                                        <div key={req.id} className="requirement-item" style={{ animationDelay: `${i * 0.1}s` }}>
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

                            <a href={`https://wa.me/${settings.wa_number?.replace(/^0/, '62')}`} target="_blank" rel="noreferrer" className="wa-button-float">
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
                                        <form onSubmit={handleSubmit}>
                                            <div className="portal-form-title-group">
                                                <User size={22} strokeWidth={2.5} />
                                                <h3>Identitas Calon Siswa</h3>
                                            </div>

                                            <div className="portal-form-group">
                                                <label className="portal-form-label">NISN <span style={{ color: 'var(--portal-danger)' }}>*</span></label>
                                                <input type="text" name="nisn" className="portal-form-input" value={formData.nisn} onChange={handleInputChange} placeholder="10 Digit NISN Aktif" required />
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

                                            <div className="portal-form-title-group" style={{ color: 'var(--portal-accent)' }}>
                                                <BookOpen size={22} strokeWidth={2.5} />
                                                <h3>Informasi Akademik & Kontak</h3>
                                            </div>

                                            <div className="portal-form-group">
                                                <label className="portal-form-label">Nama Sekolah Asal <span style={{ color: 'var(--portal-danger)' }}>*</span></label>
                                                <input type="text" name="asal_sekolah" className="portal-form-input" value={formData.asal_sekolah} onChange={handleInputChange} placeholder="Contoh: SMP Negeri 1 Jakarta" required />
                                            </div>

                                            <div className="form-row form-row-2">
                                                <div className="portal-form-group">
                                                    <label className="portal-form-label">No. WhatsApp Siswa</label>
                                                    <input type="tel" name="telepon_siswa" className="portal-form-input" value={formData.telepon_siswa} onChange={handleInputChange} placeholder="08xxxx" />
                                                </div>
                                                <div className="portal-form-group">
                                                    <label className="portal-form-label">WhatsApp Orang Tua <span style={{ color: 'var(--portal-danger)' }}>*</span></label>
                                                    <input type="tel" name="telepon_ortu" className="portal-form-input" value={formData.telepon_ortu} onChange={handleInputChange} placeholder="Wajib untuk konfirmasi" required />
                                                </div>
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
                                                {submitting ? (
                                                    <><div className="portal-spinner" style={{ width: 20, height: 20, borderWidth: 2 }}></div> Memproses...</>
                                                ) : (
                                                    <>Submit Pendaftaran Online <ArrowRight size={20} /></>
                                                )}
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
                                                placeholder="Contoh: REG-2026123456"
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
        </div>
    )
}
