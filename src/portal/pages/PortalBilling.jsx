import { useState } from 'react'
import { usePortal } from '../context/PortalContext'

export default function PortalBilling() {
    const { postPublic } = usePortal()
    const [identifier, setIdentifier] = useState('')
    const [result, setResult] = useState(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)

    async function handleSearch(e) {
        e.preventDefault()
        if (!identifier.trim()) return

        setLoading(true)
        setError(null)
        setResult(null)

        const data = await postPublic('/cek-tagihan', { identifier: identifier.trim() })

        if (data.error) {
            setError(data.error)
        } else {
            setResult(data)
        }
        setLoading(false)
    }

    const formatCurrency = (num) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num || 0)
    }

    return (
        <div className="portal-page">
            <div className="portal-page-header">
                <div className="portal-container">
                    <h1>💳 Cek Tagihan</h1>
                    <p>Cek status pembayaran SPP dan tagihan lainnya</p>
                </div>
            </div>

            <section className="portal-section">
                <div className="portal-container">
                    <div className="portal-bill-checker">
                        <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🔍</div>
                        <h2 className="portal-section-title" style={{ fontSize: '1.5rem' }}>Masukkan NISN atau NIS</h2>
                        <p className="portal-section-subtitle" style={{ marginBottom: '8px' }}>
                            Ketik Nomor Induk Siswa Nasional (NISN) atau Nomor Induk Siswa (NIS) untuk melihat tagihan.
                        </p>

                        <form className="portal-bill-form" onSubmit={handleSearch}>
                            <input
                                className="portal-input"
                                type="text"
                                placeholder="Contoh: 0012345678"
                                value={identifier}
                                onChange={e => setIdentifier(e.target.value)}
                            />
                            <button
                                type="submit"
                                className="portal-btn portal-btn-primary"
                                disabled={loading}
                            >
                                {loading ? '⏳' : '🔎 Cari'}
                            </button>
                        </form>

                        {error && (
                            <div className="portal-alert portal-alert-error" style={{ marginTop: '20px' }}>
                                ❌ {error}
                            </div>
                        )}
                    </div>

                    {/* Result */}
                    {result && (
                        <div className="portal-bill-result portal-animate-in" style={{ maxWidth: '800px', margin: '40px auto 0' }}>
                            {/* Student Info */}
                            <div className="portal-bill-student-info">
                                <div className="portal-bill-student-name">{result.siswa.nama}</div>
                                <div className="portal-bill-student-meta">
                                    NISN: {result.siswa.nisn || '-'} &nbsp;|&nbsp;
                                    NIS: {result.siswa.nis || '-'} &nbsp;|&nbsp;
                                    Kelas: {result.siswa.kelas || '-'} &nbsp;|&nbsp;
                                    Status: <span className={`portal-badge ${result.siswa.status === 'aktif' ? 'portal-badge-success' : 'portal-badge-warning'}`}>
                                        {result.siswa.status}
                                    </span>
                                </div>
                            </div>

                            {/* Summary */}
                            <div className="portal-bill-summary">
                                <div className="portal-bill-summary-item">
                                    <div className="portal-bill-summary-number">{result.ringkasan.total_tagihan}</div>
                                    <div className="portal-bill-summary-label">Total Tagihan</div>
                                </div>
                                <div className="portal-bill-summary-item">
                                    <div className="portal-bill-summary-number" style={{ color: 'var(--portal-danger)' }}>
                                        {result.ringkasan.belum_bayar}
                                    </div>
                                    <div className="portal-bill-summary-label">Belum Bayar</div>
                                </div>
                                <div className="portal-bill-summary-item">
                                    <div className="portal-bill-summary-number" style={{ color: 'var(--portal-success)' }}>
                                        {result.ringkasan.sudah_bayar}
                                    </div>
                                    <div className="portal-bill-summary-label">Lunas</div>
                                </div>
                            </div>

                            {/* Total Outstanding */}
                            <div className="portal-card" style={{
                                padding: '20px', marginBottom: '24px', textAlign: 'center',
                                background: 'rgba(239, 68, 68, 0.05)', borderColor: 'rgba(239, 68, 68, 0.2)'
                            }}>
                                <div style={{ fontSize: '0.8rem', color: 'var(--portal-text-muted)', marginBottom: '4px' }}>
                                    Total Tagihan Belum Bayar
                                </div>
                                <div style={{ fontSize: '1.8rem', fontWeight: '800', color: 'var(--portal-danger)' }}>
                                    {formatCurrency(result.ringkasan.total_belum_bayar)}
                                </div>
                            </div>

                            {/* Table */}
                            {result.tagihan.length > 0 && (
                                <div style={{ overflowX: 'auto' }}>
                                    <table className="portal-bill-table">
                                        <thead>
                                            <tr>
                                                <th>Kategori</th>
                                                <th>Bulan/Tahun</th>
                                                <th>Nominal</th>
                                                <th>Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {result.tagihan.map(tag => (
                                                <tr key={tag.id}>
                                                    <td style={{ fontWeight: '500' }}>
                                                        {tag.kategori_nama}
                                                        {tag.tahun_ajaran && (
                                                            <div style={{ fontSize: '0.75rem', color: 'var(--portal-text-muted)' }}>
                                                                TA: {tag.tahun_ajaran}
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td>{tag.bulan || '-'} / {tag.tahun || '-'}</td>
                                                    <td style={{ fontWeight: '600' }}>{formatCurrency(tag.nominal)}</td>
                                                    <td>
                                                        <span className={`portal-badge ${tag.status === 'lunas' ? 'portal-badge-success' : 'portal-badge-warning'}`}>
                                                            {tag.status === 'lunas' ? '✅ Lunas' : '⏳ Belum'}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            <div className="portal-alert portal-alert-info" style={{ marginTop: '24px' }}>
                                ℹ️ Untuk melakukan pembayaran, silakan hubungi bagian administrasi sekolah atau datang langsung ke loket kasir.
                            </div>
                        </div>
                    )}
                </div>
            </section>
        </div>
    )
}
