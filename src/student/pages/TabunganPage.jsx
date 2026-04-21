import { TrendingUp, CreditCard, ShoppingBag, Coffee, Wallet } from 'lucide-react'
import { useStudent } from '../StudentContext'

// Static Mock Data for V4 'Digital Vault' Preview
const MOCK_SAVINGS_HISTORY = [
    { id: 1, type: 'setor', amount: 500000, note: 'Uang Saku Bulanan', date: '2026-04-01T08:00:00Z', category: 'income' },
    { id: 2, type: 'tarik', amount: 25000, note: 'Sarapan Kantin', date: '2026-04-01T10:30:00Z', category: 'food' },
    { id: 3, type: 'tarik', amount: 150000, note: 'Buku Paket Biologi', date: '2026-04-02T09:00:00Z', category: 'education' },
    { id: 4, type: 'setor', amount: 100000, note: 'Reward Prestasi Lomba', date: '2026-04-02T14:20:00Z', category: 'reward' },
    { id: 5, type: 'tarik', amount: 12000, note: 'Minuman Dingin', date: '2026-04-03T11:00:00Z', category: 'food' },
    { id: 6, type: 'tarik', amount: 50000, note: 'Iuran Kas Kelas', date: '2026-04-03T13:45:00Z', category: 'expense' }
]

const getCategoryIcon = (category) => {
    switch (category) {
        case 'food': return <Coffee size={20} />
        case 'education': return <CreditCard size={20} />
        case 'reward': return <TrendingUp size={20} />
        case 'income': return <Wallet size={20} />
        default: return <ShoppingBag size={20} />
    }
}

export default function TabunganPage() {
    const { formatRupiah } = useStudent()

    // Use Mock Data for V4 Preview
    const history = MOCK_SAVINGS_HISTORY
    const saldo = history.reduce((acc, curr) => acc + (curr.type === 'setor' ? curr.amount : -curr.amount), 350000)

    const totalSetor = history.filter(h => h.type === 'setor').reduce((s, h) => s + h.amount, 0)
    const totalTarik = history.filter(h => h.type === 'tarik').reduce((s, h) => s + h.amount, 0)

    return (
        <div className="stu-page" style={{ paddingBottom: '100px' }}>
            {/* V4 Immersive Digital Vault Banner */}
            <div className="stu-fade-up">
                <div className="stu-savings-v4-banner">
                    <div className="stu-savings-monument">
                        <span className="stu-savings-monument-val">{formatRupiah(saldo)}</span>
                        <span className="stu-savings-monument-label">Total Digital Balance</span>
                    </div>

                    <div className="stu-savings-stats-v4">
                        <div className="stu-savings-stat-glass">
                            <span className="stu-savings-stat-label-v4">Total Setor</span>
                            <span className="stu-savings-stat-val-v4" style={{ color: '#ffffff' }}>+{formatRupiah(totalSetor)}</span>
                        </div>
                        <div className="stu-savings-stat-glass">
                            <span className="stu-savings-stat-label-v4">Total Tarik</span>
                            <span className="stu-savings-stat-val-v4" style={{ color: '#ffffff' }}>-{formatRupiah(totalTarik)}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Transaction Matrix V4 */}
            <div className="stu-section stu-fade-up delay-1">
                <div className="stu-section-header">
                    <h3 className="stu-section-title">Transaction Matrix</h3>
                </div>

                <div className="stu-list">
                    {history.map((h, i) => (
                        <div
                            key={h.id}
                            className={`stu-transaction-card-v4 stu-fade-up stu-trans-glow-${h.type}`}
                            style={{ animationDelay: `${0.2 + (i * 0.1)}s` }}
                        >
                            <div className={`stu-trans-icon-v4 ${h.type}`}>
                                {getCategoryIcon(h.category)}
                            </div>

                            <div className="stu-trans-info-v4">
                                <span className="stu-trans-note-v4">{h.note}</span>
                                <span className="stu-trans-date-v4">
                                    {new Date(h.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>

                            <div className={`stu-trans-amount-v4 ${h.type}`}>
                                {h.type === 'setor' ? '+' : '-'}{formatRupiah(h.amount)}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Elite Action Footer can be added here if needed */}
        </div>
    )
}
