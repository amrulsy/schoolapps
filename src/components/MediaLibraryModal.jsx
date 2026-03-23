import { useState, useEffect, useRef } from 'react'
import { X, Upload, Check, Image as ImageIcon, Trash2 } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { API_BASE_CMS as API_BASE, getBearerHeader, getMediaUrl } from '../services/api'

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
                headers: getBearerHeader()
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
                headers: getBearerHeader(),
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
                headers: getBearerHeader()
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
            onSelect(getMediaUrl(selectedItem.path))
            onClose()
        }
    }

    const copyToClipboard = (e, path) => {
        e.stopPropagation()
        navigator.clipboard.writeText(getMediaUrl(path))
        addToast('success', 'Tersalin', 'URL gambar disalin ke clipboard')
    }

    if (!isOpen) return null

    return (
        <div className="media-library-overlay">
            <div className="media-library-container">
                <div className="media-library-header">
                    <div className="header-info">
                        <h2>Media Library</h2>
                        <p>Kelola dan pilih aset gambar untuk konten Anda</p>
                    </div>
                    <button className="btn-close-glass" onClick={onClose}><X size={20} /></button>
                </div>

                <div className="media-library-body">
                    <div className="toolbar">
                        <div className="upload-zone" onClick={handleUploadClick}>
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                style={{ display: 'none' }}
                                accept="image/jpeg, image/png, image/webp"
                            />
                            <div className="upload-icon-wrapper">
                                {uploading ? <div className="spinner-sm" /> : <Upload size={20} />}
                            </div>
                            <div className="upload-text">
                                <strong>{uploading ? 'Mengupload...' : 'Upload Baru'}</strong>
                                <span>Maksimal 5MB (JPG, PNG, WEBP)</span>
                            </div>
                        </div>

                        <div className="stats">
                            <span className="badge-glass">{media.length} Items</span>
                        </div>
                    </div>

                    <div className="media-grid-container">
                        {loading ? (
                            <div className="media-loading">
                                <div className="spinner-md" />
                                <p>Menyelaraskan media...</p>
                            </div>
                        ) : media.length === 0 ? (
                            <div className="media-empty">
                                <div className="empty-icon-circle">
                                    <ImageIcon size={40} />
                                </div>
                                <h3>Belum ada media</h3>
                                <p>Mulai dengan mengupload gambar pertama Anda</p>
                                <button className="btn btn-primary btn-sm mt-3" onClick={handleUploadClick}>
                                    Upload Sekarang
                                </button>
                            </div>
                        ) : (
                            <div className="media-grid">
                                {media.map(m => (
                                    <div
                                        key={m.id}
                                        className={`media-item ${selectedItem?.id === m.id ? 'active' : ''}`}
                                        onClick={() => setSelectedItem(m)}
                                    >
                                        <div className="media-preview">
                                            <img
                                                src={getMediaUrl(m.path)}
                                                alt={m.original_name}
                                                loading="lazy"
                                            />
                                            {selectedItem?.id === m.id && (
                                                <div className="select-badge">
                                                    <Check size={14} strokeWidth={3} />
                                                </div>
                                            )}
                                        </div>

                                        <div className="media-overlay">
                                            <div className="media-actions">
                                                <button
                                                    className="action-btn copy"
                                                    onClick={(e) => copyToClipboard(e, m.path)}
                                                    title="Copy URL"
                                                >
                                                    <Check size={14} />
                                                </button>
                                                <button
                                                    className="action-btn delete"
                                                    onClick={(e) => handleDelete(e, m.id)}
                                                    title="Hapus"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                            <div className="media-info">
                                                <span>{m.original_name}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="media-library-footer">
                    <div className="selected-info">
                        {selectedItem && (
                            <div className="selection-pill">
                                <div className="pill-thumb">
                                    <img src={getMediaUrl(selectedItem.path)} alt="" />
                                </div>
                                <span>{selectedItem.original_name}</span>
                            </div>
                        )}
                    </div>
                    <div className="footer-btns">
                        <button className="btn-glass-secondary" onClick={onClose}>Batal</button>
                        <button
                            className="btn btn-primary"
                            disabled={!selectedItem}
                            onClick={handleConfirmSelection}
                            style={{ minWidth: '160px' }}
                        >
                            Konfirmasi Pilihan
                        </button>
                    </div>
                </div>
            </div>

            <style>{`
                .media-library-overlay {
                    position: fixed;
                    top: 0; left: 0; right: 0; bottom: 0;
                    background: rgba(15, 23, 42, 0.8);
                    backdrop-filter: blur(8px);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 9999;
                    padding: 20px;
                    animation: fadeIn 0.3s ease;
                }

                .media-library-container {
                    background: #fff;
                    width: 100%;
                    max-width: 1000px;
                    height: 85vh;
                    border-radius: 24px;
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
                    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                }

                .media-library-header {
                    padding: 24px 32px;
                    border-bottom: 1px solid #f1f5f9;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    background: #fff;
                }

                .header-info h2 { margin: 0; font-size: 1.5rem; color: #0f172a; font-weight: 800; }
                .header-info p { margin: 4px 0 0; font-size: 0.875rem; color: #64748b; }

                .btn-close-glass {
                    width: 40px; height: 40px; border-radius: 12px;
                    border: none; background: #f1f5f9; color: #64748b;
                    display: flex; alignItems: center; justifyContent: center;
                    cursor: pointer; transition: all 0.2s;
                }
                .btn-close-glass:hover { background: #fee2e2; color: #ef4444; transform: rotate(90deg); }

                .media-library-body {
                    flex: 1; padding: 32px; overflow: hidden;
                    display: flex; flexDirection: column; gap: 24px;
                }

                .toolbar {
                    display: flex; justify-content: space-between; align-items: center;
                }

                .upload-zone {
                    display: flex; align-items: center; gap: 16px;
                    background: #f8fafc; padding: 12px 20px; border-radius: 16px;
                    border: 2px dashed #e2e8f0; cursor: pointer; transition: all 0.2s;
                }
                .upload-zone:hover { border-color: #3b82f6; background: #eff6ff; }

                .upload-icon-wrapper {
                    width: 44px; height: 44px; border-radius: 12px;
                    background: #fff; display: flex; align-items: center;
                    justify-content: center; color: #3b82f6;
                    box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
                }

                .upload-text { display: flex; flex-direction: column; }
                .upload-text strong { font-size: 0.9375rem; color: #1e293b; }
                .upload-text span { font-size: 0.75rem; color: #64748b; }

                .badge-glass {
                    background: #f1f5f9; padding: 6px 12px; border-radius: 20px;
                    font-size: 0.75rem; font-weight: 700; color: #64748b;
                    letter-spacing: 0.025em;
                }

                .media-grid-container {
                    flex: 1; overflow-y: auto; padding-right: 8px;
                }
                .media-grid-container::-webkit-scrollbar { width: 6px; }
                .media-grid-container::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }

                .media-grid {
                    display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
                    gap: 20px;
                }

                .media-item {
                    position: relative; border-radius: 16px; overflow: hidden;
                    aspect-ratio: 1; background: #f8fafc; cursor: pointer;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    border: 2px solid transparent;
                }

                .media-item:hover { transform: translateY(-4px); box-shadow: 0 12px 20px -8px rgba(0,0,0,0.2); }
                .media-item.active { border-color: #3b82f6; transform: scale(0.96); }

                .media-preview { width: 100%; height: 100%; position: relative; }
                .media-preview img { width: 100%; height: 100%; object-fit: cover; }

                .select-badge {
                    position: absolute; top: 12px; right: 12px;
                    width: 24px; height: 24px; background: #3b82f6;
                    color: #fff; border-radius: 50%; display: flex;
                    alignItems: center; justifyContent: center;
                    box-shadow: 0 4px 6px rgba(59, 130, 246, 0.4);
                    animation: scaleIn 0.2s ease; z-index: 10;
                }

                .media-overlay {
                    position: absolute; inset: 0; background: rgba(15, 23, 42, 0) ;
                    display: flex; flex-direction: column; justify-content: space-between;
                    padding: 12px; opacity: 0; transition: all 0.2s;
                }
                .media-item:hover .media-overlay { opacity: 1; background: linear-gradient(to top, rgba(15, 23, 42, 0.8), transparent 60%); }

                .media-actions { display: flex; gap: 8px; transform: translateY(-10px); transition: all 0.2s; }
                .media-item:hover .media-actions { transform: translateY(0); }

                .action-btn {
                    width: 32px; height: 32px; border-radius: 8px; border: none;
                    background: rgba(255,255,255,0.2); backdrop-filter: blur(4px);
                    color: white; display: flex; align-items: center; justify-content: center;
                    cursor: pointer; transition: all 0.2s;
                }
                .action-btn:hover { background: #fff; color: #1e293b; }
                .action-btn.delete:hover { background: #ef4444; color: #fff; }

                .media-info {
                    font-size: 0.7rem; color: #fff; font-weight: 500;
                    overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
                }

                .media-library-footer {
                    padding: 24px 32px; border-top: 1px solid #f1f5f9;
                    display: flex; justify-content: space-between; align-items: center;
                    background: #fff;
                }

                .selection-pill {
                    display: flex; align-items: center; gap: 10px;
                    background: #eff6ff; padding: 6px 16px 6px 6px; border-radius: 12px;
                    border: 1px solid #dbeafe; animation: slideInLeft 0.3s ease;
                }
                .pill-thumb { width: 32px; height: 32px; border-radius: 8px; overflow: hidden; }
                .pill-thumb img { width: 100%; height: 100%; object-fit: cover; }
                .selection-pill span { font-size: 0.8125rem; font-weight: 600; color: #1e40af; max-width: 150px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

                .footer-btns { display: flex; gap: 12px; }

                .btn-glass-secondary {
                    padding: 10px 24px; border-radius: 12px; border: 1px solid #e2e8f0;
                    background: #fff; color: #64748b; font-weight: 600; cursor: pointer;
                    transition: all 0.2s;
                }
                .btn-glass-secondary:hover { background: #f8fafc; border-color: #cbd5e1; color: #1e293b; }

                .media-loading, .media-empty {
                    height: 300px; display: flex; flex-direction: column;
                    align-items: center; justify-content: center; gap: 16px; color: #94a3b8;
                }

                .empty-icon-circle {
                    width: 80px; height: 80px; border-radius: 50%; background: #f8fafc;
                    display: flex; align-items: center; justify-content: center;
                }

                .spinner-sm { width: 18px; height: 18px; border: 2px solid rgba(59, 130, 246, 0.2); border-top-color: #3b82f6; border-radius: 50%; animation: spin 0.8s linear infinite; }
                .spinner-md { width: 40px; height: 40px; border: 3px solid rgba(59, 130, 246, 0.1); border-top-color: #3b82f6; border-radius: 50%; animation: spin 0.8s linear infinite; }

                @keyframes spin { to { transform: rotate(360deg); } }
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes scaleIn { from { transform: scale(0); } to { transform: scale(1); } }
                @keyframes slideInLeft { from { transform: translateX(-20px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
            `}</style>
        </div>
    )
}
