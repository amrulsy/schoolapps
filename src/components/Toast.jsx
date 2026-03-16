import { useApp } from '../context/AppContext'
import { X, CheckCircle, AlertTriangle, AlertCircle, Info } from 'lucide-react'

const icons = {
    success: CheckCircle,
    error: AlertCircle,
    warning: AlertTriangle,
    info: Info,
}

export default function Toast() {
    const { toasts } = useApp()

    if (toasts.length === 0) return null

    return (
        <div className="toast-container">
            {toasts.map(toast => {
                const Icon = icons[toast.type] || Info
                return (
                    <div key={toast.id} className={`toast ${toast.type}`}>
                        <Icon size={20} />
                        <div className="toast-message">
                            <strong>{toast.title}</strong>
                            {toast.message}
                        </div>
                    </div>
                )
            })}
        </div>
    )
}
