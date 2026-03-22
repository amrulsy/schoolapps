import { Shield, Award, AlertTriangle, Calendar, Star, TrendingUp, TrendingDown } from 'lucide-react'
import { useStudent } from '../StudentApp'

export default function BKPage() {
    const { bkData } = useStudent()
    const { poin, pelanggaran, prestasi, tatatertib } = bkData || { poin: { pelanggaran: 0, prestasi: 0, netPoin: 0 }, pelanggaran: [], prestasi: [], tatatertib: [] }

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
