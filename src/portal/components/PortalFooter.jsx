import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { usePortal } from '../context/PortalContext'

export default function PortalFooter() {
    const { fetchPublic } = usePortal()
    const [settings, setSettings] = useState({})
    const year = new Date().getFullYear()

    useEffect(() => {
        async function loadSettings() {
            const data = await fetchPublic('/settings')
            if (data) setSettings(data)
        }
        loadSettings()
    }, [fetchPublic])

    return (
        <footer className="portal-footer">
            <div className="portal-container">
                <div className="portal-footer-grid">
                    <div className="portal-footer-brand">
                        <h3>🎓 {settings.school_name || 'SMK PPRQ'}</h3>
                        <p>
                            {settings.footer_description || settings.school_tagline || 'Mencetak generasi unggul yang berakhlak mulia, berkompetensi tinggi, dan siap menghadapi tantangan dunia kerja global.'}
                        </p>
                    </div>

                    <div className="portal-footer-nav-col">
                        <h4>Navigasi</h4>
                        <ul className={`portal-footer-links ${[
                            { to: '/', label: 'Beranda' },
                            { to: '/jurusan', label: 'Jurusan' },
                            { to: '/pengumuman', label: 'Pengumuman' },
                            { to: '/informasi', label: 'Informasi' },
                            { to: '/ppdb', label: 'PPDB' },
                            { to: '/cek-tagihan', label: 'Cek Tagihan' },
                            { to: '/kontak', label: 'Kontak' }
                        ].length > 3 ? 'grid-cols-split' : ''}`}>
                            {[
                                { to: '/', label: 'Beranda' },
                                { to: '/jurusan', label: 'Jurusan' },
                                { to: '/pengumuman', label: 'Pengumuman' },
                                { to: '/informasi', label: 'Informasi' },
                                { to: '/ppdb', label: 'PPDB' },
                                { to: '/cek-tagihan', label: 'Cek Tagihan' },
                                { to: '/kontak', label: 'Kontak' }
                            ].map((link, idx) => (
                                <li key={idx}><Link to={link.to}>{link.label}</Link></li>
                            ))}
                        </ul>
                    </div>

                    <div className="portal-footer-contact-col">
                        <h4>Kontak</h4>
                        <ul className="portal-footer-links">
                            <li>
                                <a href={`tel:${settings.contact_phone?.replace(/\D/g, '') || ''}`}>
                                    <span className="contact-icon">📞</span>
                                    <span>{settings.contact_phone || '021-XXXXXXX'}</span>
                                </a>
                            </li>
                            <li>
                                <a href={`mailto:${settings.contact_email || 'info@smkpprq.sch.id'}`}>
                                    <span className="contact-icon">✉️</span>
                                    <span>{settings.contact_email || 'info@smkpprq.sch.id'}</span>
                                </a>
                            </li>
                            <li>
                                <span className="contact-item">
                                    <span className="contact-icon">📍</span>
                                    <span>{settings.contact_address || 'Jl. Pendidikan No. 1, Jakarta'}</span>
                                </span>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="portal-footer-bottom" style={{
                    marginTop: '40px',
                    padding: '24px',
                    background: 'rgba(0, 0, 0, 0.3)',
                    backdropFilter: 'blur(10px)',
                    WebkitBackdropFilter: 'blur(10px)',
                    borderRadius: '20px',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                    color: 'rgba(255, 255, 255, 0.5)'
                }}>
                    &copy; {year} {settings.school_name || 'SMK PPRQ'} — Sistem Informasi Administrasi Sekolah. All rights reserved.
                    <br />
                    <span style={{ fontSize: '0.85rem', marginTop: '8px', display: 'inline-block' }}>
                        Developed with ❤️ by <a href="https://www.linkedin.com/in/muhamad-amrul-syaifulloh-35019a242/" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--portal-primary)', fontWeight: '700', textDecoration: 'none' }}>Amrul Al Syaif&apos;Fu</a>
                    </span>
                </div>
            </div>
        </footer>
    )
}
