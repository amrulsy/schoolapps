import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

export default function TransactionChart({ chartData, formatRupiah }) {
    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 8,
                    padding: '12px 16px',
                    boxShadow: 'var(--shadow-md)',
                }}>
                    <p style={{ fontWeight: 600, marginBottom: 4, color: 'var(--text-primary)' }}>{label}</p>
                    {payload.map((p, i) => (
                        <p key={i} style={{ color: p.color, fontSize: '0.85rem' }}>
                            {p.name}: {formatRupiah(p.value)}
                        </p>
                    ))}
                </div>
            )
        }
        return null
    }

    return (
        <div className="card">
            <div className="card-header">
                <h3>📊 Grafik Transaksi Bulanan</h3>
            </div>
            <ResponsiveContainer width="100%" height={280}>
                <BarChart data={chartData} barGap={4}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                    <XAxis dataKey="bulan" tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} />
                    <YAxis
                        tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
                        tickFormatter={v => `${(v / 1000000).toFixed(1)}jt`}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="terbayar" name="Terbayar" fill="#22C55E" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="tunggakan" name="Tunggakan" fill="#EF4444" radius={[4, 4, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
        </div>
    )
}
