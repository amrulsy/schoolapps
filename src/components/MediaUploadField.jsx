import { useState } from 'react';
import { X, Edit, Upload, Image, Trash2 } from 'lucide-react';
import MediaLibraryModal from './MediaLibraryModal';

/**
 * Reusable field for image uploads/selection in CMS.
 * @param {string} value - Current image URL
 * @param {function} onChange - Callback when image changes (returns URL)
 * @param {string} label - Field label
 * @param {string} helperText - Optional helper text
 * @param {object} previewStyle - Custom styles for the preview container
 * @param {boolean} compact - Whether to show a compact, space-saving version
 */
export default function MediaUploadField({
    value,
    onChange,
    label,
    helperText,
    previewStyle = {},
    compact = false
}) {
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleClear = (e) => {
        e.stopPropagation();
        onChange('');
    };

    if (compact) {
        return (
            <div className="media-compact-container">
                {label && <label className="media-compact-label">{label}</label>}
                <div className="media-compact-box">
                    <div className="compact-preview">
                        {value ? (
                            <img src={value} alt="Thumb" />
                        ) : (
                            <Image size={16} strokeWidth={2.5} />
                        )}
                    </div>

                    <div className="compact-info">
                        <strong>{value ? 'Gambar Terpilih' : 'Belum ada media'}</strong>
                        {value && <span>Klik ubah untuk mengganti</span>}
                    </div>

                    <div className="compact-actions">
                        {value && (
                            <button type="button" onClick={handleClear} className="btn-compact-danger" title="Hapus">
                                <Trash2 size={14} />
                            </button>
                        )}
                        <button type="button" onClick={() => setIsModalOpen(true)} className="btn-compact-primary">
                            {value ? 'Ubah' : 'Pilih'}
                        </button>
                    </div>
                </div>
                {helperText && <p className="media-field-hint">{helperText}</p>}

                <MediaLibraryModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onSelect={(url) => {
                        onChange(url);
                        setIsModalOpen(false);
                    }}
                />

                <style>{`
                    .media-compact-container { margin-bottom: 16px; }
                    .media-compact-label { display: block; margin-bottom: 6px; font-weight: 700; font-size: 0.75rem; color: #64748b; text-transform: uppercase; letter-spacing: 0.025em; }
                    
                    .media-compact-box {
                        display: flex; align-items: center; gap: 12px;
                        background: #fff; padding: 10px 12px; border-radius: 12px;
                        border: 1px solid #e2e8f0; transition: all 0.2s;
                    }
                    .media-compact-box:hover { border-color: #3b82f6; box-shadow: 0 4px 12px rgba(59, 130, 246, 0.05); }

                    .compact-preview {
                        width: 44px; height: 44px; border-radius: 8px;
                        background: #f1f5f9; overflow: hidden; display: flex;
                        align-items: center; justify-content: center;
                        border: 1px solid #f1f5f9; flex-shrink: 0;
                        color: #94a3b8;
                    }
                    .compact-preview img { width: 100%; height: 100%; object-fit: cover; }

                    .compact-info { flex: 1; min-width: 0; }
                    .compact-info strong { display: block; font-size: 0.8125rem; color: #1e293b; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
                    .compact-info span { font-size: 0.6875rem; color: #64748b; }

                    .compact-actions { display: flex; gap: 8px; }
                    
                    .btn-compact-danger {
                        width: 32px; height: 32px; border-radius: 8px; border: none;
                        background: #fee2e2; color: #ef4444; display: flex;
                        align-items: center; justify-content: center; cursor: pointer;
                        transition: all 0.2s;
                    }
                    .btn-compact-danger:hover { background: #ef4444; color: #fff; transform: scale(1.05); }

                    .btn-compact-primary {
                        padding: 0 12px; height: 32px; border-radius: 8px; border: 1px solid #cbd5e1;
                        background: #fff; color: #475569; font-size: 0.75rem; font-weight: 700;
                        cursor: pointer; transition: all 0.2s;
                    }
                    .btn-compact-primary:hover { border-color: #3b82f6; color: #3b82f6; background: #eff6ff; }
                `}</style>
            </div>
        );
    }

    return (
        <div className="media-field-container">
            {label && <label className="media-field-label">{label}</label>}

            <div
                className="media-preview-box"
                onClick={() => setIsModalOpen(true)}
                style={previewStyle}
            >
                {value ? (
                    <div className="preview-inner">
                        <img
                            src={value}
                            alt="Preview"
                            className="preview-img"
                        />
                        <div className="preview-overlay">
                            <div className="overlay-content">
                                <div className="icon-circle">
                                    <Edit size={20} />
                                </div>
                                <span>Ganti Gambar</span>
                            </div>
                        </div>
                        <button
                            type="button"
                            className="btn-clear"
                            onClick={handleClear}
                            title="Hapus gambar"
                        >
                            <X size={14} />
                        </button>
                    </div>
                ) : (
                    <div className="placeholder-content">
                        <div className="placeholder-icon">
                            <Upload size={28} />
                        </div>
                        <div className="placeholder-text">
                            <strong>Pilih Gambar</strong>
                            <span>JPG, PNG, atau WEBP</span>
                        </div>
                    </div>
                )}
            </div>

            {helperText && <p className="media-field-hint">{helperText}</p>}

            <MediaLibraryModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSelect={(url) => {
                    onChange(url);
                    setIsModalOpen(false);
                }}
            />

            <style>{`
                .media-field-container { margin-bottom: 24px; }
                .media-field-label { display: block; margin-bottom: 8px; font-weight: 700; font-size: 0.875rem; color: #1e293b; }
                
                .media-preview-box {
                    width: 100%; height: 180px; background: #f8fafc;
                    border: 2px dashed #e2e8f0; border-radius: 16px;
                    cursor: pointer; overflow: hidden; position: relative;
                    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
                }
                .media-preview-box:hover { border-color: #3b82f6; background: #eff6ff; }

                .preview-inner { width: 100%; height: 100%; position: relative; }
                .preview-img { width: 100%; height: 100%; object-fit: contain; }
                
                .preview-overlay {
                    position: absolute; inset: 0; background: rgba(15, 23, 42, 0.6);
                    backdrop-filter: blur(4px); display: flex; align-items: center;
                    justify-content: center; opacity: 0; transition: all 0.2s;
                }
                .media-preview-box:hover .preview-overlay { opacity: 1; }

                .overlay-content { text-align: center; color: white; transform: translateY(10px); transition: all 0.2s; }
                .media-preview-box:hover .overlay-content { transform: translateY(0); }

                .icon-circle {
                    width: 44px; height: 44px; background: rgba(255,255,255,0.2);
                    border-radius: 50%; display: flex; align-items: center; justify-content: center;
                    margin: 0 auto 8px; border: 1px solid rgba(255,255,255,0.3);
                }
                
                .btn-clear {
                    position: absolute; top: 12px; right: 12px;
                    width: 32px; height: 32px; border-radius: 50%;
                    border: none; background: white; color: #ef4444;
                    display: flex; align-items: center; justify-content: center;
                    box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
                    cursor: pointer; z-index: 10; transition: all 0.2s;
                }
                .btn-clear:hover { transform: scale(1.1); background: #fee2e2; }

                .placeholder-content {
                    height: 100%; display: flex; flex-direction: column;
                    align-items: center; justify-content: center; gap: 12px;
                    color: #94a3b8;
                }
                .placeholder-icon {
                    width: 56px; height: 56px; border-radius: 16px;
                    background: white; border: 1px solid #e2e8f0;
                    display: flex; align-items: center; justify-content: center;
                    color: #3b82f6; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
                }
                .placeholder-text { text-align: center; }
                .placeholder-text strong { display: block; color: #475569; font-size: 0.9375rem; }
                .placeholder-text span { font-size: 0.75rem; }

                .media-field-hint { margin-top: 8px; font-size: 0.75rem; color: #64748b; }
            `}</style>
        </div>
    );
}
