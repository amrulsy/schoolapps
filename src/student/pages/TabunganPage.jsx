import { PiggyBank, ArrowUpCircle, ArrowDownCircle, TrendingUp } from 'lucide-react'
import { useStudent } from '../StudentApp'

export default function TabunganPage() {
    const { formatRupiah, tabunganData } = useStudent()
    const saldo = tabunganData?.saldo || 0
    const history = tabunganData?.history || []

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
