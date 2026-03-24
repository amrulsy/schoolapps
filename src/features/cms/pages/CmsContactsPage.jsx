import { useState, useEffect } from 'react'
import { useApp } from '../../../context/AppContext'
import { Mail, Trash2, Eye, User, Phone, Calendar, MessageSquare, Clock, ExternalLink, ArrowRight, RefreshCw } from 'lucide-react'
import EmptyState from '../../../components/EmptyState'
import { useCustomAlert } from '../../../hooks/useCustomAlert'

import { API_BASE_CMS as API_BASE, getAuthHeaders, getBearerHeader } from '../../../services/api'

export default function CmsContactsPage() {
    const { addToast } = useApp()
    const { confirmDelete } = useCustomAlert()
    const [messages, setMessages] = useState([])
    const [loading, setLoading] = useState(true)
    const [viewMessage, setViewMessage] = useState(null)

    useEffect(() => {
        loadMessages()
    }, [])

    const loadMessages = async () => {
        try {
            setLoading(true)
            const res = await fetch(`${API_BASE}/contacts`, {
                headers: getBearerHeader()
            })
            if (res.ok) {
                const data = await res.json()
                setMessages(data)
            }
        } catch (err) {
            addToast('danger', 'Error', 'Gagal memuat pesan kontak')
        } finally {
            setLoading(false)
        }
    }

    const handleRead = async (msg) => {
        setViewMessage(msg)
        if (msg.is_read === 0) {
            try {
                const res = await fetch(`${API_BASE}/contacts/${msg.id}/read`, {
                    method: 'PUT',
                    headers: getBearerHeader()
                })
                if (res.ok) {
                    setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, is_read: 1 } : m))
                }
            } catch (err) {
                console.error('Failed to mark as read', err)
            }
        }
    }

    const handleDelete = async (msg) => {
        const isConfirmed = await confirmDelete(
            `Hapus pesan dari ${msg.name}?`,
            "Pesan yang dihapus tidak dapat dikembalikan."
        )
        if (isConfirmed) {
            try {
                const res = await fetch(`${API_BASE}/contacts/${msg.id}`, {
                    method: 'DELETE',
                    headers: getBearerHeader()
                })
                if (res.ok) {
                    addToast('success', 'Berhasil', 'Pesan dihapus')
                    loadMessages()
                    if (viewMessage?.id === msg.id) setViewMessage(null)
                }
            } catch (err) {
                addToast('danger', 'Error', 'Gagal menghapus pesan')
            }
        }
    }

    const formatDate = (dateStr) => {
        if (!dateStr) return '-'
        return new Date(dateStr).toLocaleDateString('id-ID', {
            day: 'numeric', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        })
    }

    const getRelativeTime = (dateStr) => {
        if (!dateStr) return '-'
        const now = new Date()
        const date = new Date(dateStr)
        const diffInSeconds = Math.floor((now - date) / 1000)

        if (diffInSeconds < 60) return 'Tadi'
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} menit lalu`
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} jam lalu`
        if (diffInSeconds < 172800) return 'Kemarin'
        if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} hari lalu`
        if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 604800)} minggu lalu`

        return formatDate(dateStr)
    }

    return (
        <div className="cms-messages-container animate-fade-in">
            <div className="cms-page-header">
                <div className="cms-header-content">
                    <h1 className="cms-header-title">📬 Kontak Masuk</h1>
                    <p className="cms-header-subtitle">
                        Kelola semua pesan dan pertanyaan yang dikirimkan melalui portal.
                    </p>
                </div>
                <div className="cms-header-stats">
                    <div className="cms-stat-mini">
                        <span className="cms-stat-value">{messages.filter(m => !m.is_read).length}</span>
                        <span className="cms-stat-label">Belum Dibaca</span>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="cms-loading-container">
                    <RefreshCw size={24} className="animate-spin text-primary" />
                    <span>Memuat pesan...</span>
                </div>
            ) : messages.length === 0 ? (
                <div className="cms-section-card glass mt-4">
                    <EmptyState
                        icon={Mail}
                        title="Kotak Masuk Kosong"
                        message="Belum ada pesan yang masuk dari pengunjung portal."
                    />
                </div>
            ) : (
                <div className="cms-messages-list mt-4">
                    <div className="cms-list-header">
                        <div className="col-status">STATUS</div>
                        <div className="col-sender">PENGIRIM</div>
                        <div className="col-subject">SUBJEK PESAN</div>
                        <div className="col-time">WAKTU</div>
                        <div className="col-actions">AKSI</div>
                    </div>
                    {messages.map(m => (
                        <div
                            key={m.id}
                            className={`cms-message-row ${!m.is_read ? 'unread' : 'read'}`}
                            onClick={() => handleRead(m)}
                        >
                            <div className="col-status">
                                {!m.is_read ? (
                                    <span className="cms-status-badge new">Baru</span>
                                ) : (
                                    <span className="cms-status-badge read">Dibaca</span>
                                )}
                            </div>
                            <div className="col-sender">
                                <div className="cms-avatar">
                                    {m.name.charAt(0).toUpperCase()}
                                </div>
                                <div className="cms-sender-info">
                                    <span className="sender-name">{m.name}</span>
                                    <span className="sender-email">{m.email}</span>
                                </div>
                            </div>
                            <div className="col-subject">
                                <span className="subject-text">{m.subject}</span>
                                <p className="subject-preview">{m.message.substring(0, 80)}...</p>
                            </div>
                            <div className="col-time" title={formatDate(m.created_at)}>
                                <div className="time-display">
                                    <Clock size={12} />
                                    <span>{getRelativeTime(m.created_at)}</span>
                                </div>
                            </div>
                            <div className="col-actions" onClick={e => e.stopPropagation()}>
                                <button className="cms-btn-icon" onClick={() => handleRead(m)} title="Baca"><Eye size={18} /></button>
                                <button className="cms-btn-icon danger" onClick={() => handleDelete(m)} title="Hapus"><Trash2 size={18} /></button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* MESSAGE DETAIL MODAL */}
            {viewMessage && (
                <div className="modal-backdrop glass">
                    <div className="modal glass-modal animate-slide-up" style={{ maxWidth: 700 }}>
                        <div className="modal-header border-none">
                            <div className="d-flex align-items-center gap-3">
                                <div className="cms-avatar large">
                                    {viewMessage.name.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <h3 className="mb-0">{viewMessage.name}</h3>
                                    <p className="text-muted small mb-0">Informasi Pengirim</p>
                                </div>
                            </div>
                            <button className="btn-close-round" onClick={() => setViewMessage(null)}>×</button>
                        </div>
                        <div className="modal-body py-4">
                            <div className="cms-contact-details mb-5">
                                <div className="detail-item">
                                    <Mail size={16} />
                                    <span>{viewMessage.email}</span>
                                    <a href={`mailto:${viewMessage.email}`} className="btn-link" title="Kirim Email"><ExternalLink size={14} /></a>
                                </div>
                                <div className="detail-item">
                                    <Phone size={16} />
                                    <span>{viewMessage.phone || '-'}</span>
                                    {viewMessage.phone && (
                                        <a href={`https://wa.me/${viewMessage.phone.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="btn-link text-success" title="Chat WA"><ExternalLink size={14} /></a>
                                    )}
                                </div>
                                <div className="detail-item">
                                    <Calendar size={16} />
                                    <span>{formatDate(viewMessage.created_at)}</span>
                                </div>
                            </div>

                            <div className="cms-message-content">
                                <div className="message-subject-pill">
                                    <MessageSquare size={14} />
                                    {viewMessage.subject}
                                </div>
                                <div className="message-bubble">
                                    {viewMessage.message}
                                </div>
                            </div>
                        </div>
                        <div className="modal-footer border-none bg-lighter">
                            <button className="btn btn-secondary" onClick={() => setViewMessage(null)}>Tutup</button>
                            <div className="d-flex gap-2">
                                <button className="btn btn-danger-outline" onClick={() => handleDelete(viewMessage)}>
                                    <Trash2 size={16} /> Hapus Pesan
                                </button>
                                {viewMessage.phone && (
                                    <a
                                        href={`https://wa.me/${viewMessage.phone.replace(/\D/g, '')}`}
                                        target="_blank" rel="noreferrer"
                                        className="btn btn-success"
                                    >
                                        <MessageSquare size={16} className="mr-2" /> Balas via WhatsApp
                                    </a>
                                )}
                                {viewMessage.email && (
                                    <a href={`mailto:${viewMessage.email}`} className="btn btn-primary">
                                        Balas via Email <ArrowRight size={16} className="ml-2" />
                                    </a>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
