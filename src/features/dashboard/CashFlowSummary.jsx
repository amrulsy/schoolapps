import { TrendingUp } from 'lucide-react'

export default function CashFlowSummary({ totalIncome, totalExpense, saldo, formatRupiah }) {
    return (
        <div className="card">
            <div className="card-header">
                <h3>🏦 Ringkasan Arus Kas</h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Pemasukan</span>
                    <span className="mono" style={{ fontWeight: 700, color: 'var(--success-600)' }}>{formatRupiah(totalIncome)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Pengeluaran</span>
                    <span className="mono" style={{ fontWeight: 700, color: 'var(--danger-500)' }}>{formatRupiah(totalExpense)}</span>
                </div>
                <hr style={{ border: 'none', borderTop: '2px solid var(--border-color)' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0' }}>
                    <span style={{ fontWeight: 600 }}>Saldo</span>
                    <span className="mono" style={{ fontWeight: 700, color: 'var(--primary-600)', fontSize: '1.2rem' }}>{formatRupiah(saldo)}</span>
                </div>
                <span className="badge badge-success" style={{ alignSelf: 'flex-end' }}>
                    <TrendingUp size={12} /> Surplus
                </span>
            </div>
        </div>
    )
}
