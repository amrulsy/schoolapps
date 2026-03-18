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

                    <div>
                        <h4>Navigasi</h4>
                        <ul className="portal-footer-links">
                            <li><Link to="/">Beranda</Link></li>
                            <li><Link to="/pengumuman">Pengumuman</Link></li>
                            <li><Link to="/informasi">Profil Sekolah</Link></li>
                            <li><Link to="/ppdb">PPDB</Link></li>
                            <li><Link to="/cek-tagihan">Cek Tagihan</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h4>Kontak</h4>
                        <ul className="portal-footer-links">
                            <li><a href={`tel:${settings.contact_phone?.replace(/\D/g, '') || ''}`}>📞 {settings.contact_phone || '021-XXXXXXX'}</a></li>
                            <li><a href={`mailto:${settings.contact_email || 'info@smkpprq.sch.id'}`}>✉️ {settings.contact_email || 'info@smkpprq.sch.id'}</a></li>
                            <li><span>📍 {settings.contact_address || 'Jl. Pendidikan No. 1, Jakarta'}</span></li>
                        </ul>
                    </div>
                </div>

                <div className="portal-footer-bottom">
                    &copy; {year} {settings.school_name || 'SMK PPRQ'} — Sistem Informasi Administrasi Sekolah. All rights reserved.
                </div>
            </div>
        </footer>
    )
}
