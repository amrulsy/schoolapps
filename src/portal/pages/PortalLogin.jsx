import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { ArrowRight, GraduationCap, Briefcase } from 'lucide-react'
import '../styles/portal-login.css'

export default function PortalLogin() {
    return (
        <div className="login-selection-page">
            <Helmet>
                <title>Akses Masuk SIAS | SMK PPRQ</title>
                <meta name="description" content="Pilih jalur akses login untuk masuk ke SIAS SMK PPRQ sesuai peran Anda." />
            </Helmet>

            <div className="login-bg-decor">
                <div className="decor-blob blob-1" />
                <div className="decor-blob blob-2" />
                <div className="decor-blob blob-3" />
            </div>

            <div className="login-selection-container">
                <div className="login-selection-header">
                    <h1>Jalur Akses Masuk <span>SIAS</span></h1>
                    <p>Pilih peran Anda untuk melanjutkan ke sistem utama.</p>
                </div>

                <div className="login-selection-grid">
                    {/* --- Card 1: Siswa / Ortu --- */}
                    <Link to="/siswa-portal" className="login-role-card stagger-item" style={{ '--card-color': '#10b981', animationDelay: '0.1s' }}>
                        <div className="login-role-icon">
                            <GraduationCap size={60} />
                        </div>
                        <h2>Siswa</h2>
                        <p>Cek absensi, nilai rapor, riwayat tabungan, dan informasi pembayaran sekolah secara mudah.</p>
                        <div className="login-role-btn">
                            Masuk Portal <ArrowRight size={18} />
                        </div>
                    </Link>

                    {/* --- Card 2: Guru --- */}
                    <Link to="/guru" className="login-role-card stagger-item" style={{ '--card-color': '#4f46e5', animationDelay: '0.3s' }}>
                        <div className="login-role-icon">
                            <Briefcase size={60} />
                        </div>
                        <h2>Guru</h2>
                        <p>Akses manajemen kelas, absensi, jurnal mengajar, dan akademik harian.</p>
                        <div className="login-role-btn">
                            Mulai Mengajar <ArrowRight size={18} />
                        </div>
                    </Link>

                    {/* --- Card 3: Pendaftar PPDB --- */}
                    <Link to="/ppdb/login" className="login-role-card stagger-item" style={{ '--card-color': '#7c3aed', animationDelay: '0.5s' }}>
                        <div className="login-role-icon">
                            <GraduationCap size={60} />
                        </div>
                        <h2>PPDB</h2>
                        <p>Lengkapi biodata, unggah berkas pendaftaran, dan cek hasil seleksi secara mandiri.</p>
                        <div className="login-role-btn">
                            Masuk Dasbor <ArrowRight size={18} />
                        </div>
                    </Link>
                </div>
            </div>
        </div>
    )
}
