import { Users, Building2, AlertTriangle, CheckCircle2, TrendingUp, ArrowUpRight, ArrowDownRight } from 'lucide-react'

export default function StatCards({ stats, formatRupiah }) {
    const { activeStudents, graduatedStudents, totalKelas, unitsCount, totalUnpaid, unpaidCount, totalPaid, paidCount } = stats

    return (
        <div className="stats-grid">
            <div className="stat-card">
                <div className="stat-icon blue"><Users size={24} /></div>
                <div className="stat-info">
                    <h4>Siswa Aktif</h4>
                    <div className="value">{activeStudents}</div>
                    <div className="change up"><TrendingUp size={14} /> {graduatedStudents} lulus</div>
                </div>
            </div>
            <div className="stat-card">
                <div className="stat-icon teal"><Building2 size={24} /></div>
                <div className="stat-info">
                    <h4>Total Kelas</h4>
                    <div className="value">{totalKelas}</div>
                    <div className="change up"><ArrowUpRight size={14} /> {unitsCount} unit</div>
                </div>
            </div>
            <div className="stat-card">
                <div className="stat-icon red"><AlertTriangle size={24} /></div>
                <div className="stat-info">
                    <h4>Tunggakan</h4>
                    <div className="value mono" style={{ fontSize: '1.2rem' }}>{formatRupiah(totalUnpaid)}</div>
                    <div className="change down"><ArrowDownRight size={14} /> {unpaidCount} tagihan</div>
                </div>
            </div>
            <div className="stat-card">
                <div className="stat-icon green"><CheckCircle2 size={24} /></div>
                <div className="stat-info">
                    <h4>Terkumpul</h4>
                    <div className="value mono" style={{ fontSize: '1.2rem' }}>{formatRupiah(totalPaid)}</div>
                    <div className="change up"><TrendingUp size={14} /> {paidCount} lunas</div>
                </div>
            </div>
        </div>
    )
}
