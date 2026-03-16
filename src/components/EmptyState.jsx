import { Package } from 'lucide-react'

export default function EmptyState({ icon: Icon = Package, title, message, action }) {
    return (
        <div className="empty-state fade-in">
            <div className="empty-icon">
                <Icon size={36} />
            </div>
            <h3>{title || 'Belum Ada Data'}</h3>
            <p>{message || 'Data belum tersedia. Mulai dengan menambahkan data baru.'}</p>
            {action && action}
        </div>
    )
}
