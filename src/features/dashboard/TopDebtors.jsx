export default function TopDebtors({ topDebtors, formatRupiah }) {
    return (
        <div className="card">
            <div className="card-header">
                <h3>🔴 Tunggakan Terbesar</h3>
            </div>
            <div>
                {topDebtors.length === 0 ? (
                    <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 20 }}>
                        Tidak ada tunggakan 🎉
                    </p>
                ) : (
                    topDebtors.map((d, i) => (
                        <div key={i} style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '10px 0',
                            borderBottom: i < topDebtors.length - 1 ? '1px solid var(--border-color)' : 'none',
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <span style={{
                                    width: 24, height: 24, borderRadius: '50%',
                                    background: i === 0 ? 'var(--danger-500)' : i === 1 ? 'var(--warning-500)' : 'var(--gray-300)',
                                    color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: '0.7rem', fontWeight: 700,
                                }}>{i + 1}</span>
                                <span style={{ fontSize: '0.9rem' }}>{d.nama}</span>
                            </div>
                            <span className="mono" style={{ fontWeight: 600, color: 'var(--danger-500)' }}>
                                {formatRupiah(d.total)}
                            </span>
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}
