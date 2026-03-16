import { useRef } from 'react'
import { useApp } from '../../context/AppContext'
import { useReactToPrint } from 'react-to-print'
import { ArrowLeft, Printer } from 'lucide-react'

export default function SiswaSppDetail({ data, onClose, year }) {
    const { bills, formatRupiah, MONTHS, tahunAjaran: activeTahunAjaran } = useApp()
    const targetTahun = year || activeTahunAjaran
    const kartuRef = useRef(null)

    // react-to-print: mencetak HANYA area kartu SPP (div .printable-spp)
    const handlePrintKartu = useReactToPrint({
        contentRef: kartuRef,
        documentTitle: `Kartu SPP - ${data.nama}`,
        pageStyle: `
            @page { size: A4 portrait; margin: 10px 10px; }
            @media print {
                html, body { margin: 0; padding: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                .no-print { display: none !important; }
                .printable-spp { 
                    display: block; 
                    width: 100%; 
                    padding: 12mm 15mm; 
                    box-sizing: border-box;
                    font-family: 'Inter', system-ui, -apple-system, sans-serif;
                }
                tr { 
                    page-break-inside: avoid;
                    page-break-after: auto; }
                table { border-collapse: collapse; width: 100%; margin-bottom: 10px; }
                th, td { border: none; border-bottom: 1px solid #e2e8f0; padding: 5px 8px !important; font-size: 11px !important; }
                th { background: #f8fafc !important; color: #475569 !important; font-weight: 700 !important; text-transform: uppercase; }
            }
        `,
    })

    // Filter bills for this student and the target academic year
    const studentBills = bills.filter(b => b.siswaId === data.id && b.tahunAjaran === targetTahun)
    const totalTunggakan = studentBills.filter(b => b.status === 'belum').reduce((s, b) => s + b.nominal, 0)
    const totalBayar = studentBills.filter(b => b.status === 'lunas').reduce((s, b) => s + b.nominal, 0)
    const totalSemua = studentBills.reduce((s, b) => s + b.nominal, 0)

    // Agrupasi by Category
    const categoriesMap = {}
    studentBills.forEach(b => {
        if (!categoriesMap[b.kategori]) categoriesMap[b.kategori] = []
        categoriesMap[b.kategori].push(b)
    })

    return (
        <div className="fade-in">
            <div className="page-header no-print">
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <button className="btn-icon" onClick={onClose}><ArrowLeft size={20} /></button>
                    <h1>Detail Kartu SPP</h1>
                </div>
                <div className="actions">
                    <button className="btn btn-primary" onClick={handlePrintKartu}>
                        <Printer size={16} /> Cetak Kartu SPP
                    </button>
                </div>
            </div>

            <div className="profile-card no-print" style={{ padding: 0, overflow: 'hidden', marginBottom: '20px' }}>
                <div className="profile-banner" style={{ height: '100px', background: 'linear-gradient(135deg, var(--primary-600), var(--primary-800))' }} />
                <div style={{ padding: '0 32px 32px 32px', marginTop: '-40px' }}>
                    <div className="profile-header" style={{ marginBottom: '24px', position: 'relative' }}>
                        <div className="profile-avatar" style={{
                            width: '80px', height: '80px', fontSize: '2rem',
                            background: 'white', color: 'var(--primary-600)',
                            boxShadow: 'var(--shadow-md)', border: '4px solid white',
                            marginBottom: '16px'
                        }}>
                            {data.nama.charAt(0)}
                        </div>
                        <div className="profile-info">
                            <h2 style={{ fontSize: '1.5rem', marginBottom: 4 }}>
                                {data.nama} <span className="badge badge-info">{data.kelas}</span>
                            </h2>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>NISN: {data.nisn}</p>
                        </div>
                        <div className="profile-tunggakan" style={{ marginLeft: 'auto', textAlign: 'right', background: 'var(--bg-card)', padding: '12px 20px', borderRadius: ' var(--radius-lg)', border: '1px solid var(--border-color)' }}>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                Tunggakan ({targetTahun})
                            </span>
                            <h3 className="mono" style={{ margin: '4px 0 0 0', color: totalTunggakan > 0 ? 'var(--danger-500)' : 'var(--success-500)', fontSize: '1.4rem' }}>
                                {formatRupiah(totalTunggakan)}
                            </h3>
                        </div>
                    </div>

                    <div className="profile-details" style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                        gap: '24px',
                        background: 'var(--gray-50)',
                        padding: '24px',
                        borderRadius: 'var(--radius-lg)'
                    }}>
                        <div className="detail-item">
                            <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: 6 }}>Gender</label>
                            <strong>{data.jk === 'L' ? 'Laki-laki' : 'Perempuan'}</strong>
                        </div>
                        <div className="detail-item">
                            <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: 6 }}>Kelahiran</label>
                            <strong>{data.tempatLahir}, {data.tglLahir ? new Date(data.tglLahir).toLocaleDateString('id-ID') : '-'}</strong>
                        </div>
                        <div className="detail-item">
                            <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: 6 }}>Wali Siswa</label>
                            <strong>{data.wali || '-'}</strong>
                        </div>
                        <div className="detail-item">
                            <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: 6 }}>Telepon Wali</label>
                            <strong>{data.telp || '-'}</strong>
                        </div>
                        <div className="detail-item">
                            <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: 6 }}>Status</label>
                            <span className={`badge ${data.status === 'aktif' ? 'badge-success' : 'badge-secondary'}`}>{data.status?.toUpperCase()}</span>
                        </div>
                        <div className="detail-item" style={{ gridColumn: '1 / -1' }}>
                            <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: 6 }}>Alamat</label>
                            <strong>{data.alamat || '-'}</strong>
                        </div>
                    </div>
                </div>
            </div>

            {/* Print Section (Kartu SPP) — ref ini yang ditarget react-to-print */}
            <div ref={kartuRef} className="printable-spp" style={{ padding: '3mm 10mm', background: 'white', color: '#1e293b' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px', borderBottom: '2px solid #1e293b', paddingBottom: '10px', marginBottom: '15px' }}>
                    <div style={{ fontSize: '32px' }}>🏫</div>
                    <div style={{ textAlign: 'left' }}>
                        <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 800, textTransform: 'uppercase', color: '#0f172a' }}>SMK PPRQ</h2>
                        <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: '#64748b', fontWeight: 500 }}>Sistem Informasi Administrasi Sekolah</p>
                        <p style={{ margin: 0, fontSize: '11px', color: '#64748b' }}>Jl. Pesantren No.1, Kota | Telp: (021) 123-4567</p>
                    </div>
                    <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                        <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#1e293b' }}>KARTU PEMBAYARAN</h3>
                        <p style={{ margin: 0, fontSize: '10px', color: '#64748b' }}>Tahun Pelajaran: {targetTahun}</p>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '30px', marginBottom: '15px', fontSize: '12px', background: '#f8fafc', padding: '10px 18px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                    <div style={{ flex: 1 }}><strong>Nama:</strong> {data.nama}</div>
                    <div style={{ flex: 1 }}><strong>Kelas/NISN:</strong> {data.kelas} / {data.nisn}</div>
                    <div style={{ flex: 1, textAlign: 'right' }}><strong>Tahun:</strong> {targetTahun}</div>
                </div>

                {Object.keys(categoriesMap).length === 0 && (
                    <div style={{ padding: 40, textAlign: 'center', color: '#64748b', background: '#f8fafc', borderRadius: 8 }}>
                        Tidak ada catatan tagihan untuk tahun ajaran aktif.
                    </div>
                )}

                {Object.keys(categoriesMap).map(kategori => (
                    <div key={kategori} style={{ marginBottom: '15px' }}>
                        <h4 style={{ margin: '0 0 6px 0', fontSize: '12px', fontWeight: 700, color: '#1e293b', borderLeft: '4px solid #3b82f6', paddingLeft: '10px' }}>{kategori}</h4>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                            <thead>
                                <tr style={{ borderBottom: '1.5px solid #334155' }}>
                                    <th style={{ textAlign: 'left', width: '30px' }}>No</th>
                                    <th style={{ textAlign: 'left' }}>Bulan / Deskripsi</th>
                                    <th style={{ textAlign: 'right' }}>Nominal</th>
                                    <th style={{ textAlign: 'right' }}>Diskon</th>
                                    <th style={{ textAlign: 'right' }}>Bayar</th>
                                    <th style={{ textAlign: 'center' }}>Status</th>
                                    <th style={{ textAlign: 'left' }}>Tanggal</th>
                                </tr>
                            </thead>
                            <tbody>
                                {categoriesMap[kategori].map((b, i) => {
                                    const nominalAsliDec = b.nominalAsli || 0
                                    const diskon = nominalAsliDec - (b.nominal || 0)
                                    return (
                                        <tr key={b.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                            <td>{i + 1}</td>
                                            <td style={{ fontWeight: 500 }}>{b.bulan} {b.tahun}</td>
                                            <td style={{ textAlign: 'right' }}>{formatRupiah(nominalAsliDec)}</td>
                                            <td style={{ textAlign: 'right', color: diskon > 0 ? '#dc2626' : 'inherit' }}>{diskon > 0 ? `-${formatRupiah(diskon)}` : '-'}</td>
                                            <td style={{ textAlign: 'right', fontWeight: 700 }}>{formatRupiah(b.nominal)}</td>
                                            <td style={{ textAlign: 'center' }}>
                                                <span style={{ color: b.status === 'lunas' ? '#16a34a' : '#dc2626', fontWeight: 700, fontSize: '9px' }}>
                                                    {b.status?.toUpperCase()}
                                                </span>
                                            </td>
                                            <td style={{ fontSize: '10px', color: '#64748b' }}>{b.status === 'lunas' ? b.paidAt : '-'}</td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                ))}

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: '20px', padding: '0 5px' }}>
                    <div style={{ textAlign: 'center', width: '160px' }}>
                        <p style={{ margin: 0, fontSize: '11px', color: '#475569' }}>Orang Tua / Wali</p>
                        <div style={{ height: '50px' }}></div>
                        <p style={{ margin: 0, fontSize: '11px', fontWeight: 600 }}>( ............................ )</p>
                    </div>
                    <div style={{ textAlign: 'center', width: '160px' }}>
                        <p style={{ margin: 0, fontSize: '11px', color: '#475569' }}>Bendahara Sekolah</p>
                        <div style={{ height: '50px' }}></div>
                        <p style={{ margin: 0, fontSize: '11px', fontWeight: 600 }}>( ............................ )</p>
                    </div>
                    <div style={{ width: '220px', background: '#f8fafc', padding: '10px 15px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '11px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                            <span style={{ color: '#64748b' }}>Total Sudah Bayar:</span>
                            <strong style={{ color: '#16a34a' }}>{formatRupiah(totalBayar)}</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                            <span style={{ color: '#64748b' }}>Total Tunggakan:</span>
                            <strong style={{ color: '#dc2626' }}>{formatRupiah(totalTunggakan)}</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '2px dashed #cbd5e1', paddingTop: '6px', marginTop: '6px' }}>
                            <strong style={{ color: '#0f172a' }}>TOTAL BIAYA:</strong>
                            <strong style={{ color: '#0f172a', fontSize: '12px' }}>{formatRupiah(totalSemua)}</strong>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
