import { Link } from 'react-router-dom'

export default function PortalFooter() {
    const year = new Date().getFullYear()

    return (
        <footer className="portal-footer">
            <div className="portal-container">
                <div className="portal-footer-grid">
                    <div className="portal-footer-brand">
                        <h3>🎓 SMK PPRQ</h3>
                        <p>
                            Mencetak generasi unggul yang berakhlak mulia,
                            berkompetensi tinggi, dan siap menghadapi tantangan
                            dunia kerja global.
                        </p>
                    </div>

                    <div>
                        <h4>Navigasi</h4>
                        <ul className="portal-footer-links">
                            <li><Link to="/portal">Beranda</Link></li>
                            <li><Link to="/portal/pengumuman">Pengumuman</Link></li>
                            <li><Link to="/portal/informasi">Profil Sekolah</Link></li>
                            <li><Link to="/portal/ppdb">PPDB</Link></li>
                            <li><Link to="/portal/cek-tagihan">Cek Tagihan</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h4>Kontak</h4>
                        <ul className="portal-footer-links">
                            <li><a href="tel:021XXXXXXX">📞 021-XXXXXXX</a></li>
                            <li><a href="mailto:info@smkpprq.sch.id">✉️ info@smkpprq.sch.id</a></li>
                            <li><span>📍 Jl. Pendidikan No. 1, Jakarta</span></li>
                        </ul>
                    </div>
                </div>

                <div className="portal-footer-bottom">
                    © {year} SMK PPRQ — Sistem Informasi Administrasi Sekolah. All rights reserved.
                </div>
            </div>
        </footer>
    )
}
