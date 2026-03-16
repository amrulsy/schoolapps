export default function RecentActivity({ activityLog }) {
    return (
        <div className="card">
            <div className="card-header">
                <h3>📋 Aktivitas Terbaru</h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {activityLog.map((act, i) => (
                    <div key={i} style={{
                        padding: '12px 0',
                        borderBottom: i < activityLog.length - 1 ? '1px solid var(--border-color)' : 'none',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        gap: 12,
                    }}>
                        <span style={{ fontSize: '0.85rem' }}>{act.text}</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{act.time}</span>
                    </div>
                ))}
            </div>
        </div>
    )
}
