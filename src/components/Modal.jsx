import { X } from 'lucide-react'

export default function Modal({ title, children, onClose, footer, size = '' }) {
    return (
        <div className="modal-backdrop" onClick={onClose}>
            <div className={`modal ${size ? `modal-${size}` : ''}`} onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>{title}</h3>
                    <button className="btn-icon" onClick={onClose}><X size={20} /></button>
                </div>
                <div className="modal-body">
                    {children}
                </div>
                {footer && (
                    <div className="modal-footer">
                        {footer}
                    </div>
                )}
            </div>
        </div>
    )
}
