import { useState, useEffect } from 'react'
import { useApp } from '../../../context/AppContext'
import { Mail, Trash2, Eye } from 'lucide-react'
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

    return (
        <div className="fade-in">
            <div className="page-header">
                <h1>Pesan Masuk (Kontak)</h1>
            </div>

            {loading ? (
                <div style={{ padding: '40px', textAlign: 'center' }}>Memuat data...</div>
            ) : messages.length === 0 ? (
                <EmptyState
                    icon={Mail}
                    title="Kotak Masuk Kosong"
                    message="Belum ada pesan yang masuk dari pengunjung portal."
                />
            ) : (
                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Pengirim</th>
                                <th>Subjek</th>
                                <th>Waktu</th>
                                <th style={{ width: 100 }}>Status</th>
                                <th style={{ width: 100 }}>Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {messages.map(m => (
                                <tr key={m.id} style={{ background: m.is_read ? 'transparent' : 'rgba(59, 130, 246, 0.05)' }}>
                                    <td>
                                        <div style={{ fontWeight: m.is_read ? 500 : 700 }}>{m.name}</div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{m.email}</div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{m.phone}</div>
                                    </td>
                                    <td>
                                        <div style={{ fontWeight: m.is_read ? 500 : 700 }}>{m.subject}</div>
                                    </td>
                                    <td className="mono">{formatDate(m.created_at)}</td>
                                    <td>
                                        {m.is_read ? (
                                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Sudah dibaca</span>
                                        ) : (
                                            <span className="badge badge-info">Baru</span>
                                        )}
                                    </td>
                                    <td>
                                        <div className="action-group">
                                            <button className="btn-icon btn-view" onClick={() => handleRead(m)} title="Baca"><Eye size={20} /></button>
                                            <button className="btn-icon btn-delete danger" onClick={() => handleDelete(m)} title="Hapus"><Trash2 size={20} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {viewMessage && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: 600 }}>
                        <div className="modal-header">
                            <h2>Detail Pesan</h2>
                            <button className="btn-close" onClick={() => setViewMessage(null)}>×</button>
                        </div>
                        <div className="modal-body">
                            <div className="grid-2 mb-4">
                                <div>
                                    <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block' }}>Dari</label>
                                    <strong>{viewMessage.name}</strong>
                                    <div><a href={`mailto:${viewMessage.email}`}>{viewMessage.email}</a></div>
                                    <div>{viewMessage.phone || '-'}</div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block' }}>Waktu</label>
                                    <div className="mono">{formatDate(viewMessage.created_at)}</div>
                                </div>
                            </div>
                            <div className="mb-4" style={{ padding: '16px', background: 'var(--bg-card)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: 8 }}>Subjek</label>
                                <h3 style={{ margin: '0 0 16px 0' }}>{viewMessage.subject}</h3>
                                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: 8 }}>Pesan</label>
                                <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{viewMessage.message}</div>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-secondary" onClick={() => setViewMessage(null)}>Tutup</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
