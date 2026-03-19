import { useState, useEffect } from 'react'
import { useApp } from '../../../context/AppContext'
import { Plus, Edit2, Trash2, Image as ImageIcon } from 'lucide-react'
import EmptyState from '../../../components/EmptyState'
import { useCustomAlert } from '../../../hooks/useCustomAlert'
import MediaLibraryModal from '../../../components/MediaLibraryModal'
import { API_BASE_CMS as API_BASE, getAuthHeaders, getBearerHeader } from '../../../services/api'

export default function CmsBannersPage() {
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
            <div className="page-header">
                <h1>Manajemen Banner</h1>
                <div className="actions">
                    <button className="btn btn-primary" onClick={() => handleOpenModal()}>
                        <Plus size={16} /> Tambah Banner
                    </button>
                </div>
            </div>

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
                                            <img src={b.image_url} alt={b.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
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
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: 500 }}>
                        <div className="modal-header">
                            <h2>{editData ? 'Edit Banner' : 'Tambah Banner'}</h2>
                            <button className="btn-close" onClick={() => setShowModal(false)}>×</button>
                        </div>
                        <div className="modal-body">
                            <form id="bannerForm" onSubmit={handleSave}>
                                <div className="form-group mb-4">
                                    <label>Judul / Teks Banner <span className="text-danger">*</span></label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={form.title}
                                        onChange={e => setForm({ ...form, title: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="form-group mb-4">
                                    <label>URL Gambar <span className="text-danger">*</span></label>
                                    <div style={{ display: 'flex', gap: 8 }}>
                                        <input
                                            type="url"
                                            className="form-control"
                                            value={form.image_url}
                                            onChange={e => setForm({ ...form, image_url: e.target.value })}
                                            placeholder="https://..."
                                            required
                                        />
                                        <button
                                            type="button"
                                            className="btn btn-secondary"
                                            onClick={() => setShowMediaModal(true)}
                                            style={{ whiteSpace: 'nowrap' }}
                                        >
                                            <ImageIcon size={16} /> Pilih Media
                                        </button>
                                    </div>
                                    {form.image_url && (
                                        <div style={{ marginTop: 10, height: 100, background: '#f8f9fa', borderRadius: 6, overflow: 'hidden' }}>
                                            <img src={form.image_url} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                        </div>
                                    )}
                                </div>
                                <div className="form-group mb-4">
                                    <label>URL Link (Opsional)</label>
                                    <input
                                        type="url"
                                        className="form-control"
                                        value={form.link_url}
                                        onChange={e => setForm({ ...form, link_url: e.target.value })}
                                        placeholder="https://..."
                                    />
                                </div>
                                <div className="grid-2 mb-4">
                                    <div className="form-group">
                                        <label>Urutan Tampil (0 = Pertama)</label>
                                        <input
                                            type="number"
                                            className="form-control"
                                            value={form.display_order}
                                            onChange={e => setForm({ ...form, display_order: parseInt(e.target.value) || 0 })}
                                        />
                                    </div>
                                    <div className="form-group" style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: 10 }}>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', margin: 0 }}>
                                            <input
                                                type="checkbox"
                                                checked={form.is_active}
                                                onChange={e => setForm({ ...form, is_active: e.target.checked })}
                                                style={{ width: 18, height: 18 }}
                                            />
                                            <span style={{ fontWeight: 600 }}>Tampilkan Banner</span>
                                        </label>
                                    </div>
                                </div>
                            </form>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-secondary" onClick={() => setShowModal(false)} disabled={saving}>Batal</button>
                            <button type="submit" form="bannerForm" className="btn btn-primary" disabled={saving}>
                                {saving ? 'Menyimpan...' : 'Simpan Banner'}
                            </button>
                        </div>
                    </div>
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
