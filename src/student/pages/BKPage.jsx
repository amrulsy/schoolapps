import { Shield, Award, AlertTriangle, Calendar, Star, TrendingUp, TrendingDown } from 'lucide-react'

const mockBK = {
    poin: { pelanggaran: 15, prestasi: 45, netPoin: 30 },
    pelanggaran: [
        { id: 1, date: '2026-02-10', keterangan: 'Terlambat masuk kelas', poin: 5, kategori: 'Kedisiplinan' },
        { id: 2, date: '2026-01-15', keterangan: 'Tidak membawa buku pelajaran', poin: 5, kategori: 'Akademik' },
        { id: 3, date: '2025-12-05', keterangan: 'Seragam tidak lengkap', poin: 5, kategori: 'Kedisiplinan' },
    ],
    prestasi: [
        { id: 1, date: '2026-03-01', keterangan: 'Juara 2 Lomba Web Design Tingkat Kota', poin: 20, kategori: 'Akademik' },
        { id: 2, date: '2026-02-15', keterangan: 'Ketua Panitia Maulid Nabi', poin: 15, kategori: 'Organisasi' },
        { id: 3, date: '2025-11-20', keterangan: 'Penghargaan Siswa Teladan Bulanan', poin: 10, kategori: 'Kepribadian' },
    ],
    tatatertib: [
        'Hadir di sekolah paling lambat 15 menit sebelum jam pelajaran dimulai',
        'Mengenakan seragam lengkap dan rapi sesuai jadwal',
        'Menjaga kebersihan kelas dan lingkungan sekolah',
        'Dilarang membawa gadget selama jam pelajaran',
        'Menghormati guru dan sesama siswa',
        'Mengikuti kegiatan upacara bendera setiap Senin',
    ]
}

export default function BKPage() {
    const { poin, pelanggaran, prestasi, tatatertib } = mockBK

    return (
        <div className="stu-page">
            <h2 className="stu-page-title">🛡️ Bimbingan Konseling</h2>

            {/* Points Summary */}
            <div className="stu-bk-summary">
                <div className="stu-bk-stat danger">
                    <TrendingDown size={18} />
                    <span className="stu-bk-stat-val">{poin.pelanggaran}</span>
                    <span className="stu-bk-stat-label">Poin Pelanggaran</span>
                </div>
                <div className="stu-bk-stat success">
                    <TrendingUp size={18} />
                    <span className="stu-bk-stat-val">{poin.prestasi}</span>
                    <span className="stu-bk-stat-label">Poin Prestasi</span>
                </div>
                <div className="stu-bk-stat primary">
                    <Star size={18} />
                    <span className="stu-bk-stat-val">{poin.netPoin}</span>
                    <span className="stu-bk-stat-label">Poin Bersih</span>
                </div>
            </div>

            {/* Achievements */}
            <div className="stu-section">
                <h3 className="stu-section-title">🏆 Prestasi</h3>
                <div className="stu-list">
                    {prestasi.map(p => (
                        <div key={p.id} className="stu-bk-item achievement">
                            <div className="stu-bk-icon achievement"><Award size={18} /></div>
                            <div className="stu-bk-info">
                                <span className="stu-bk-desc">{p.keterangan}</span>
                                <span className="stu-bk-meta">
                                    <Calendar size={12} /> {new Date(p.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                                    • {p.kategori}
                                </span>
                            </div>
                            <span className="stu-bk-poin positive">+{p.poin}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Violations */}
            <div className="stu-section">
                <h3 className="stu-section-title">⚠️ Pelanggaran</h3>
                <div className="stu-list">
                    {pelanggaran.map(p => (
                        <div key={p.id} className="stu-bk-item violation">
                            <div className="stu-bk-icon violation"><AlertTriangle size={18} /></div>
                            <div className="stu-bk-info">
                                <span className="stu-bk-desc">{p.keterangan}</span>
                                <span className="stu-bk-meta">
                                    <Calendar size={12} /> {new Date(p.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                                    • {p.kategori}
                                </span>
                            </div>
                            <span className="stu-bk-poin negative">-{p.poin}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Rules */}
            <div className="stu-section">
                <h3 className="stu-section-title">📜 Tata Tertib</h3>
                <div className="stu-card">
                    {tatatertib.map((tt, i) => (
                        <div key={i} className="stu-rule-item">
                            <span className="stu-rule-num">{i + 1}</span>
                            <span>{tt}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Schedule Counseling */}
            <button className="stu-download-btn">
                <Calendar size={18} />
                Jadwalkan Sesi Konseling
            </button>
        </div>
    )
}
