import { useState, useEffect } from 'react'
import { useApp } from '../../../context/AppContext'
import { Plus, Edit2, Trash2, Image as ImageIcon } from 'lucide-react'
import EmptyState from '../../../components/EmptyState'
import { useCustomAlert } from '../../../hooks/useCustomAlert'
import { getDirectDriveUrl } from '../../../utils/urlHelper'
import MediaLibraryModal from '../../../components/MediaLibraryModal'
import MediaUploadField from '../../../components/MediaUploadField'
import { API_BASE_CMS as API_BASE, getAuthHeaders, getBearerHeader } from '../../../services/api'

export default function CmsBannersPage({ hideHeader = false }) {
    const { addToast } = useApp()
    const { confirmDelete } = useCustomAlert()
    const [banners, setBanners] = useState([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [showMediaModal, setShowMediaModal] = useState(false)
    const [editData, setEditData] = useState(null)

    // Form state
    const [form, setForm] = useState({ title: '', image_url: '', link_url: '', is_active: true, display_order: 0 })
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        loadBanners()
    }, [])

    const loadBanners = async () => {
        try {
            setLoading(true)
            const res = await fetch(`${API_BASE}/banners`, {
                headers: getBearerHeader()
            })
            if (res.ok) {
                const data = await res.json()
                setBanners(data)
            }
        } catch (err) {
            addToast('danger', 'Error', 'Gagal memuat banners')
        } finally {
            setLoading(false)
        }
    }

    const handleOpenModal = (banner = null) => {
        setEditData(banner)
        if (banner) {
            setForm({
                title: banner.title,
                image_url: banner.image_url,
                link_url: banner.link_url || '',
                is_active: banner.is_active === 1,
                display_order: banner.display_order
            })
        } else {
            setForm({ title: '', image_url: '', link_url: '', is_active: true, display_order: 0 })
        }
        setShowModal(true)
    }

    const handleSave = async (e) => {
        e.preventDefault()
        setSaving(true)
        try {
            const url = editData ? `${API_BASE}/banners/${editData.id}` : `${API_BASE}/banners`
            const method = editData ? 'PUT' : 'POST'

            const payload = {
                ...form,
                is_active: form.is_active ? 1 : 0
            }

            const res = await fetch(url, {
                method,
                headers: getAuthHeaders(),
                body: JSON.stringify(payload)
            })

            if (res.ok) {
                addToast('success', 'Berhasil', `Banner berhasil ${editData ? 'diperbarui' : 'ditambahkan'}`)
                setShowModal(false)
                loadBanners()
            } else {
                const err = await res.json()
                addToast('danger', 'Gagal', err.error || 'Terjadi kesalahan')
            }
        } catch (err) {
            addToast('danger', 'Error', 'Gagal menyimpan banner')
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async (banner) => {
        const isConfirmed = await confirmDelete(
            `Hapus Banner "${banner.title}"?`,
            "Banner yang dihapus tidak dapat dikembalikan."
        )
        if (isConfirmed) {
            try {
                const res = await fetch(`${API_BASE}/banners/${banner.id}`, {
                    method: 'DELETE',
                    headers: getBearerHeader()
                })
                if (res.ok) {
                    addToast('success', 'Berhasil', 'Banner dihapus')
                    loadBanners()
                }
            } catch (err) {
                addToast('danger', 'Error', 'Gagal menghapus banner')
            }
        }
    }

    return (
        <div className="fade-in">
            <div className={hideHeader ? "page-toolbar mb-4" : "page-header"}>
                {!hideHeader && <h1>Manajemen Banner</h1>}
                <div className="actions">
                    <button className="btn btn-primary" onClick={() => handleOpenModal()}>
                        <Plus size={16} /> Tambah Banner
                    </button>
                </div>
            </div>

            {hideHeader && (
                <style>{`
                    .page-toolbar { display: flex; justify-content: flex-end; align-items: center; gap: 12px; }
                `}</style>
            )}

            {loading ? (
                <div style={{ padding: '40px', textAlign: 'center' }}>Memuat data...</div>
            ) : banners.length === 0 ? (
                <EmptyState
                    icon={ImageIcon}
                    title="Belum Ada Banner"
                    message="Tambahkan banner untuk ditampilkan di halaman depan portal publik."
                    action={
                        <button className="btn btn-primary" onClick={() => handleOpenModal()}>
                            <Plus size={16} /> Tambah Banner
                        </button>
                    }
                />
            ) : (
                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th style={{ width: 60 }}>Urutan</th>
                                <th style={{ width: 120 }}>Preview</th>
                                <th>Judul / Teks</th>
                                <th>Status</th>
                                <th style={{ width: 100 }}>Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {banners.map(b => (
                                <tr key={b.id}>
                                    <td className="text-center"><strong>{b.display_order}</strong></td>
                                    <td>
                                        <div style={{ width: 100, height: 50, background: '#eee', borderRadius: 4, overflow: 'hidden' }}>
                                            <img src={getDirectDriveUrl(b.image_url)} alt={b.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        </div>
                                    </td>
                                    <td>
                                        <div style={{ fontWeight: 600 }}>{b.title}</div>
                                        {b.link_url && <a href={b.link_url} target="_blank" rel="noreferrer" style={{ fontSize: '0.8rem', color: 'var(--primary-600)' }}>{b.link_url}</a>}
                                    </td>
                                    <td>
                                        <span className={`badge ${b.is_active ? 'badge-success' : 'badge-secondary'}`}>
                                            {b.is_active ? 'Aktif' : 'Nonaktif'}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="action-group">
                                            <button className="btn-icon btn-edit" onClick={() => handleOpenModal(b)} title="Edit"><Edit2 size={20} /></button>
                                            <button className="btn-icon btn-delete danger" onClick={() => handleDelete(b)} title="Hapus"><Trash2 size={20} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {showModal && (
                <div className="banner-modal-overlay">
                    <div className="banner-modal-container fade-scale-in">
                        <div className="banner-modal-header">
                            <div className="header-content">
                                <div className="header-icon">
                                    <Plus size={24} />
                                </div>
                                <div className="header-text">
                                    <h2>{editData ? 'Edit Banner' : 'Tambah Banner Baru'}</h2>
                                    <p>{editData ? 'Perbarui informasi dan tampilan banner' : 'Tambahkan visual menarik untuk beranda portal'}</p>
                                </div>
                            </div>
                            <button className="btn-close-circle" onClick={() => setShowModal(false)}>×</button>
                        </div>

                        <div className="banner-modal-body">
                            <form id="bannerForm" onSubmit={handleSave} className="banner-form-content">
                                <div className="form-section-card mb-4">
                                    <div className="section-title">
                                        <ImageIcon size={18} />
                                        <h3>Informasi Dasar</h3>
                                    </div>
                                    <div className="form-group mb-4">
                                        <label className="input-label">Judul / Teks Banner <span className="text-danger">*</span></label>
                                        <input
                                            type="text"
                                            className="form-control modern-input"
                                            placeholder="Contoh: Pendaftaran Siswa Baru TA 2024/2025"
                                            value={form.title}
                                            onChange={e => setForm({ ...form, title: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="input-label">URL Link (Opsional)</label>
                                        <input
                                            type="url"
                                            className="form-control modern-input"
                                            value={form.link_url}
                                            onChange={e => setForm({ ...form, link_url: e.target.value })}
                                            placeholder="https://sekolah.sch.id/ppdb"
                                        />
                                        <small className="input-hint text-muted">Aksi saat banner diklik</small>
                                    </div>
                                </div>

                                <div className="form-section-card mb-4">
                                    <div className="section-title">
                                        <ImageIcon size={18} />
                                        <h3>Visual & Pengaturan</h3>
                                    </div>
                                    <div className="mb-4">
                                        <MediaUploadField
                                            label="Desktop Banner Image"
                                            value={form.image_url}
                                            onChange={(url) => setForm({ ...form, image_url: url })}
                                            helperText="Rekomendasi ukuran: 1920x600px"
                                        />
                                    </div>

                                    <div className="grid-2-custom">
                                        <div className="form-group">
                                            <label className="input-label">Urutan Tampil</label>
                                            <input
                                                type="number"
                                                className="form-control modern-input"
                                                value={form.display_order}
                                                onChange={e => setForm({ ...form, display_order: parseInt(e.target.value) || 0 })}
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label className="input-label">Status Visibilitas</label>
                                            <div className="toggle-container">
                                                <label className="modern-toggle">
                                                    <input
                                                        type="checkbox"
                                                        checked={form.is_active}
                                                        onChange={e => setForm({ ...form, is_active: e.target.checked })}
                                                    />
                                                    <span className="toggle-slider"></span>
                                                    <span className="toggle-text">{form.is_active ? 'Aktif' : 'Nonaktif'}</span>
                                                </label>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </form>
                        </div>

                        <div className="banner-modal-footer">
                            <button className="btn-glass-secondary" onClick={() => setShowModal(false)} disabled={saving}>Batal</button>
                            <button type="submit" form="bannerForm" className="btn-modern-primary" disabled={saving || !form.image_url || !form.title}>
                                {saving ? (
                                    <><div className="spinner-xs" /> Menyimpan...</>
                                ) : (
                                    <><ImageIcon size={18} /> {editData ? 'Simpan Perubahan' : 'Tambahkan Banner'}</>
                                )}
                            </button>
                        </div>
                    </div>

                    <style>{`
                        .banner-modal-overlay {
                            position: fixed; inset: 0; background: rgba(15, 23, 42, 0.7);
                            backdrop-filter: blur(12px); z-index: 1000;
                            display: flex; align-items: center; justify-content: center; padding: 20px;
                        }

                        .banner-modal-container {
                            background: #fff; width: 100%; max-width: 580px;
                            max-height: 90vh; border-radius: 24px;
                            display: flex; flex-direction: column; overflow: hidden;
                            box-shadow: 0 40px 80px -20px rgba(0,0,0,0.3);
                        }

                        .banner-modal-header {
                            padding: 24px 28px; background: #fff;
                            border-bottom: 1px solid #f1f5f9; display: flex;
                            justify-content: space-between; align-items: center;
                        }

                        .header-content { display: flex; align-items: center; gap: 16px; }
                        .header-icon { 
                            width: 48px; height: 48px; border-radius: 14px;
                            background: #f0f9ff; color: #0ea5e9;
                            display: flex; align-items: center; justify-content: center;
                        }
                        .header-text h2 { margin: 0; font-size: 1.25rem; font-weight: 800; color: #0f172a; }
                        .header-text p { margin: 2px 0 0; font-size: 0.8125rem; color: #64748b; }

                        .btn-close-circle {
                            width: 32px; height: 32px; border-radius: 50%; border: none;
                            background: #f1f5f9; color: #64748b; font-size: 18px;
                            display: flex; align-items: center; justify-content: center;
                            cursor: pointer; transition: all 0.2s;
                        }
                        .btn-close-circle:hover { background: #fee2e2; color: #ef4444; }

                        .banner-modal-body {
                            flex: 1; overflow-y: auto; padding: 28px; background: #f8fafc;
                        }

                        .form-section-card {
                            background: #fff; padding: 20px; border-radius: 16px;
                            border: 1px solid #f1f5f9; box-shadow: 0 2px 4px rgba(0,0,0,0.02);
                        }

                        .section-title { display: flex; align-items: center; gap: 8px; margin-bottom: 20px; color: #3b82f6; }
                        .section-title h3 { margin: 0; font-size: 0.875rem; font-weight: 700; color: #475569; text-transform: uppercase; letter-spacing: 0.05em; }

                        .input-label { display: block; margin-bottom: 8px; font-weight: 600; font-size: 0.875rem; color: #334155; }
                        .modern-input {
                            padding: 12px 16px; border-radius: 12px; border: 1.5px solid #e2e8f0;
                            transition: all 0.2s; font-size: 0.9375rem;
                        }
                        .modern-input:focus { border-color: #3b82f6; box-shadow: 0 0 0 4px rgba(59,130,246,0.1); outline: none; }

                        .grid-2-custom { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }

                        .toggle-container { padding: 4px 0; }
                        .modern-toggle { display: flex; align-items: center; gap: 12px; cursor: pointer; }
                        .modern-toggle input { display: none; }
                        .toggle-slider {
                            width: 44px; height: 24px; background: #e2e8f0; border-radius: 12px;
                            position: relative; transition: all 0.3s;
                        }
                        .toggle-slider::before {
                            content: ''; position: absolute; left: 4px; top: 4px;
                            width: 16px; height: 16px; background: #fff; border-radius: 50%;
                            transition: all 0.3s;
                        }
                        .modern-toggle input:checked + .toggle-slider { background: #10b981; }
                        .modern-toggle input:checked + .toggle-slider::before { transform: translateX(20px); }
                        .toggle-text { font-size: 0.875rem; font-weight: 700; color: #475569; }

                        .banner-modal-footer {
                            padding: 20px 28px; background: #fff; border-top: 1px solid #f1f5f9;
                            display: flex; justify-content: flex-end; gap: 12px;
                        }

                        .btn-glass-secondary {
                            padding: 10px 24px; border-radius: 12px; border: 1px solid #e2e8f0;
                            background: transparent; color: #64748b; font-weight: 600; cursor: pointer;
                        }
                        .btn-glass-secondary:hover { background: #f8fafc; color: #1e293b; }

                        .btn-modern-primary {
                            padding: 10px 28px; border-radius: 12px; border: none;
                            background: #3b82f6; color: #fff; font-weight: 700;
                            display: flex; align-items: center; gap: 10px; cursor: pointer;
                            transition: all 0.2s; box-shadow: 0 4px 12px rgba(59, 130, 246, 0.2);
                        }
                        .btn-modern-primary:hover { background: #2563eb; transform: translateY(-1px); box-shadow: 0 6px 16px rgba(59, 130, 246, 0.3); }

                        .fade-scale-in { animation: fade-scale-in 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
                        @keyframes fade-scale-in {
                            from { opacity: 0; transform: scale(0.95); }
                            to { opacity: 1; transform: scale(1); }
                        }
                    `}</style>
                </div>
            )}

            <MediaLibraryModal
                isOpen={showMediaModal}
                onClose={() => setShowMediaModal(false)}
                onSelect={(url) => setForm({ ...form, image_url: url })}
            />
        </div>
    )
}
