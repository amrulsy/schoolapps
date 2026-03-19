import { PiggyBank, ArrowUpCircle, ArrowDownCircle, TrendingUp } from 'lucide-react'

const mockTabungan = {
    saldo: 1250000,
    history: [
        { id: 1, date: '2026-03-15', type: 'setor', amount: 200000, note: 'Setoran mingguan' },
        { id: 2, date: '2026-03-08', type: 'setor', amount: 150000, note: 'Setoran mingguan' },
        { id: 3, date: '2026-03-01', type: 'tarik', amount: 100000, note: 'Penarikan keperluan sekolah' },
        { id: 4, date: '2026-02-22', type: 'setor', amount: 200000, note: 'Setoran mingguan' },
        { id: 5, date: '2026-02-15', type: 'setor', amount: 300000, note: 'Setoran bulanan' },
        { id: 6, date: '2026-02-01', type: 'setor', amount: 200000, note: 'Setoran mingguan' },
        { id: 7, date: '2026-01-25', type: 'tarik', amount: 50000, note: 'Penarikan snack' },
        { id: 8, date: '2026-01-15', type: 'setor', amount: 350000, note: 'Setoran awal semester' },
    ]
}

export default function TabunganPage() {
    const formatRupiah = (n) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n || 0)
    const { saldo, history } = mockTabungan

    const totalSetor = history.filter(h => h.type === 'setor').reduce((s, h) => s + h.amount, 0)
    const totalTarik = history.filter(h => h.type === 'tarik').reduce((s, h) => s + h.amount, 0)

    return (
        <div className="stu-page">
            <h2 className="stu-page-title">🐷 Tabungan</h2>

            {/* Balance Card */}
            <div className="stu-savings-card">
                <div className="stu-savings-icon"><PiggyBank size={28} /></div>
                <span className="stu-savings-label">Saldo Tabungan</span>
                <span className="stu-savings-amount">{formatRupiah(saldo)}</span>
                <div className="stu-savings-stats">
                    <div className="stu-savings-stat">
                        <ArrowUpCircle size={16} color="#10B981" />
                        <span>Setor: {formatRupiah(totalSetor)}</span>
                    </div>
                    <div className="stu-savings-stat">
                        <ArrowDownCircle size={16} color="#EF4444" />
                        <span>Tarik: {formatRupiah(totalTarik)}</span>
                    </div>
                </div>
            </div>

            {/* Transaction History */}
            <div className="stu-section">
                <h3 className="stu-section-title">Riwayat Transaksi</h3>
                <div className="stu-list">
                    {history.map(h => (
                        <div key={h.id} className="stu-savings-item">
                            <div className={`stu-savings-type-icon ${h.type}`}>
                                {h.type === 'setor' ? <ArrowUpCircle size={20} /> : <ArrowDownCircle size={20} />}
                            </div>
                            <div className="stu-savings-item-info">
                                <span className="stu-savings-item-note">{h.note}</span>
                                <span className="stu-savings-item-date">
                                    {new Date(h.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                                </span>
                            </div>
                            <span className={`stu-savings-item-amount ${h.type}`}>
                                {h.type === 'setor' ? '+' : '-'}{formatRupiah(h.amount)}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
