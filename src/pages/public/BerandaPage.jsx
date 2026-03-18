export default function BerandaPage() {
    return (
        <div style={{ maxWidth: 800 }}>
            <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: 16, color: '#1e293b' }}>
                Selamat Datang di SMK PPRQ
            </h1>
            <p style={{ fontSize: '1.1rem', color: '#64748b', lineHeight: 1.7, marginBottom: 24 }}>
                SMK Pondok Pesantren Raudhatul Qur'an — Sistem Informasi Administrasi Sekolah.
            </p>
            <div style={{ display: 'flex', gap: 12 }}>
                <a href="/berita" style={{ padding: '10px 20px', background: '#6366f1', color: 'white', borderRadius: 8, textDecoration: 'none', fontWeight: 600 }}>
                    Lihat Berita
                </a>
                <a href="/tentang" style={{ padding: '10px 20px', border: '1px solid #e2e8f0', color: '#475569', borderRadius: 8, textDecoration: 'none' }}>
                    Tentang Kami
                </a>
            </div>
        </div>
    )
}
