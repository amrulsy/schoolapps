import { useState, useEffect, useRef } from 'react'
import { X, Upload, Check, Image as ImageIcon, Trash2 } from 'lucide-react'
import { useApp } from '../context/AppContext'

const API_BASE = 'http://localhost:3000/api/admin/cms'

export default function MediaLibraryModal({ isOpen, onClose, onSelect }) {
    const { addToast } = useApp()
    const [media, setMedia] = useState([])
    const [loading, setLoading] = useState(false)
    const [uploading, setUploading] = useState(false)
    const [selectedItem, setSelectedItem] = useState(null)
    const fileInputRef = useRef(null)

    useEffect(() => {
        if (isOpen) {
            loadMedia()
            setSelectedItem(null)
        }
    }, [isOpen])

    const loadMedia = async () => {
        try {
            setLoading(true)
            const res = await fetch(`${API_BASE}/media`, {
                headers: { 'Authorization': 'Bearer dummy-token' }
            })
            if (res.ok) {
                const data = await res.json()
                setMedia(data)
            }
        } catch (err) {
            addToast('danger', 'Error', 'Gagal memuat media')
        } finally {
            setLoading(false)
        }
    }

    const handleUploadClick = () => {
        fileInputRef.current?.click()
    }

    const handleFileChange = async (e) => {
        const file = e.target.files?.[0]
        if (!file) return

        // Basic validation
        if (file.size > 5 * 1024 * 1024) {
            return addToast('danger', 'Gagal', 'Ukuran gambar maksimal 5MB')
        }

        const formData = new FormData()
        formData.append('file', file)

        try {
            setUploading(true)
            const res = await fetch(`${API_BASE}/media/upload`, {
                method: 'POST',
                headers: { 'Authorization': 'Bearer dummy-token' },
                body: formData
            })

            if (res.ok) {
                addToast('success', 'Berhasil', 'Gambar berhasil diupload')
                loadMedia()
            } else {
                const err = await res.json()
                addToast('danger', 'Gagal', err.error || 'Gagal mengupload gambar')
            }
        } catch (err) {
            addToast('danger', 'Error', 'Terjadi kesalahan saat upload')
        } finally {
            setUploading(false)
            if (fileInputRef.current) fileInputRef.current.value = ''
        }
    }

    const handleDelete = async (e, id) => {
        e.stopPropagation()
        if (!confirm('Hapus gambar ini secara permanen dari server?')) return

        try {
            const res = await fetch(`${API_BASE}/media/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': 'Bearer dummy-token' }
            })
            if (res.ok) {
                setMedia(prev => prev.filter(m => m.id !== id))
                if (selectedItem?.id === id) setSelectedItem(null)
                addToast('success', 'Berhasil', 'Gambar dihapus')
            }
        } catch (err) {
            addToast('danger', 'Error', 'Gagal menghapus gambar')
        }
    }

    const handleConfirmSelection = () => {
        if (selectedItem) {
            onSelect(`http://localhost:3000${selectedItem.path}`)
            onClose()
        }
    }

    const copyToClipboard = (e, path) => {
        e.stopPropagation()
        navigator.clipboard.writeText(`http://localhost:3000${path}`)
        addToast('success', 'Tersalin', 'URL gambar disalin ke clipboard')
    }

    if (!isOpen) return null

    return (
        <div className="modal-overlay" style={{ zIndex: 9999 }}>
            <div className="modal-content" style={{ maxWidth: 900, height: '80vh', display: 'flex', flexDirection: 'column' }}>
                <div className="modal-header">
                    <h2>Media Library</h2>
                    <button className="btn-close" onClick={onClose}><X size={20} /></button>
                </div>

                <div className="modal-body" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '20px', overflow: 'hidden' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                style={{ display: 'none' }}
                                accept="image/jpeg, image/png, image/webp"
                            />
                            <button
                                className="btn btn-primary"
                                onClick={handleUploadClick}
                                disabled={uploading}
                            >
                                <Upload size={16} /> {uploading ? 'Mengupload...' : 'Upload Gambar Baru'}
                            </button>
                        </div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                            Max file: 5MB (JPG, PNG, WEBP)
                        </div>
                    </div>

                    <div style={{
                        flex: 1,
                        overflowY: 'auto',
                        border: '1px solid var(--border-color)',
                        borderRadius: 'var(--radius-md)',
                        padding: '16px',
                        background: 'var(--bg-card)'
                    }}>
                        {loading ? (
                            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: 'var(--text-muted)' }}>
                                Memuat media...
                            </div>
                        ) : media.length === 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100%', color: 'var(--text-muted)' }}>
                                <ImageIcon size={48} style={{ opacity: 0.3, marginBottom: 16 }} />
                                <p>Belum ada gambar yang diupload</p>
                            </div>
                        ) : (
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                                gap: '16px'
                            }}>
                                {media.map(m => (
                                    <div
                                        key={m.id}
                                        onClick={() => setSelectedItem(m)}
                                        style={{
                                            position: 'relative',
                                            cursor: 'pointer',
                                            borderRadius: 'var(--radius-md)',
                                            border: selectedItem?.id === m.id ? '2px solid var(--primary-600)' : '1px solid var(--border-color)',
                                            overflow: 'hidden',
                                            aspectRatio: '1',
                                            background: '#f8fafc'
                                        }}
                                    >
                                        <img
                                            src={`http://localhost:3000${m.path}`}
                                            alt={m.original_name}
                                            style={{
                                                width: '100%',
                                                height: '100%',
                                                objectFit: 'cover',
                                                display: 'block'
                                            }}
                                            loading="lazy"
                                        />

                                        {/* Overlay for selection */}
                                        {selectedItem?.id === m.id && (
                                            <div style={{
                                                position: 'absolute',
                                                top: 8,
                                                right: 8,
                                                width: 24,
                                                height: 24,
                                                background: 'var(--primary-600)',
                                                color: 'white',
                                                borderRadius: '50%',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
                                            }}>
                                                <Check size={14} />
                                            </div>
                                        )}

                                        {/* Actions hover */}
                                        <div
                                            style={{
                                                position: 'absolute',
                                                bottom: 0,
                                                left: 0,
                                                right: 0,
                                                background: 'rgba(0,0,0,0.7)',
                                                padding: '8px',
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center'
                                            }}
                                        >
                                            <span
                                                style={{ color: 'white', fontSize: '0.7rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '80%' }}
                                                onClick={(e) => copyToClipboard(e, m.path)}
                                                title="Klik untuk copy URL"
                                            >
                                                {m.original_name}
                                            </span>
                                            <button
                                                onClick={(e) => handleDelete(e, m.id)}
                                                style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', padding: 0 }}
                                                title="Hapus gambar"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="modal-footer" style={{ borderTop: '1px solid var(--border-color)', padding: '16px 24px', display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                    <button className="btn btn-secondary" onClick={onClose}>Batal</button>
                    <button
                        className="btn btn-primary"
                        disabled={!selectedItem}
                        onClick={handleConfirmSelection}
                    >
                        Konfirmasi Pilihan
                    </button>
                </div>
            </div>
        </div>
    )
}
