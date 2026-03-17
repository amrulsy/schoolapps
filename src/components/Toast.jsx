import { useApp } from '../context/AppContext'
import { X, CheckCircle, AlertTriangle, AlertCircle, Info } from 'lucide-react'

const icons = {
    success: CheckCircle,
    error: AlertCircle,
    warning: AlertTriangle,
    info: Info,
}

export default function Toast() {
    const { toasts, removeToast } = useApp()

    if (toasts.length === 0) return null

    return (
        <div className="toast-container">
            {toasts.map(toast => {
                const Icon = icons[toast.type] || Info
                return (
                    <div key={toast.id} className={`toast ${toast.type}`}>
                        <div className="toast-icon">
                            <Icon size={20} />
                        </div>
                        <div className="toast-message">
                            <strong>{toast.title}</strong>
                            <span>{toast.message}</span>
                        </div>
                        <button className="toast-close" onClick={() => removeToast(toast.id)}>
                            <X size={14} />
                        </button>
                        <div className="toast-progress"></div>
                    </div>
                )
            })}
        </div>
    )
}
