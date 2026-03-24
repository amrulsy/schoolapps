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
            {toasts.map((toast, index) => {
                const Icon = icons[toast.type] || Info
                return (
                    <div
                        key={toast.id}
                        className={`toast ${toast.type}`}
                        style={{ '--index': index }}
                    >
                        <div className="toast-icon">
                            <Icon size={22} strokeWidth={2.5} />
                        </div>
                        <div className="toast-message">
                            <strong>{toast.title}</strong>
                            <span>{toast.message}</span>
                        </div>
                        <button className="toast-close" onClick={() => removeToast(toast.id)}>
                            <X size={16} strokeWidth={3} />
                        </button>
                        <div className="toast-progress"></div>
                    </div>
                )
            })}
        </div>
    )
}
