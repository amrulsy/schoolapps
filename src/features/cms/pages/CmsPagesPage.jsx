import { useState, useEffect } from 'react'
import { useApp } from '../../../context/AppContext'
import { Edit2, Eye, Layout } from 'lucide-react'
import EmptyState from '../../../components/EmptyState'
import RichTextEditor from '../../../components/RichTextEditor'

import { API_BASE_CMS as API_BASE, getAuthHeaders, getBearerHeader } from '../../../services/api'

export default function CmsPagesPage() {
    const { addToast } = useApp()
    const [pages, setPages] = useState([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [editData, setEditData] = useState(null)
    const [saving, setSaving] = useState(false)

    const [form, setForm] = useState({
        title: '', content: '', meta_description: ''
    })

    useEffect(() => {
        loadPages()
    }, [])

    const loadPages = async () => {
        try {
            setLoading(true)
            const res = await fetch(`${API_BASE}/pages`, {
                headers: getBearerHeader()
            })
            if (res.ok) {
                const data = await res.json()
                setPages(data)
            }
        } catch (err) {
            addToast('danger', 'Error', 'Gagal memuat daftar halaman statis')
        } finally {
            setLoading(false)
        }
    }

    const handleOpenModal = (page) => {
        setEditData(page)
        setForm({
            title: page.title,
            content: page.content || '',
            meta_description: page.meta_description || ''
        })
        setShowModal(true)
    }

    const handleSave = async (e) => {
        e.preventDefault()
        if (!editData) return

        setSaving(true)
        try {
            const res = await fetch(`${API_BASE}/pages/${editData.slug}`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify(form)
            })

            if (res.ok) {
                addToast('success', 'Berhasil', 'Halaman berhasil diperbarui')
                setShowModal(false)
                loadPages()
            } else {
                const err = await res.json()
                addToast('danger', 'Gagal', err.error || 'Terjadi kesalahan')
            }
        } catch (err) {
            addToast('danger', 'Error', 'Gagal menyimpan halaman')
        } finally {
            setSaving(false)
        }
    }

    const formatDate = (dateStr) => {
        if (!dateStr) return '-'
        return new Date(dateStr).toLocaleDateString('id-ID', {
            day: 'numeric', month: 'short', year: 'numeric'
        })
    }

    return (
        <div className="fade-in">
            <div className="page-header">
                <h1>Halaman Statis</h1>
                <div className="actions">
                    <button className="btn btn-primary" onClick={() => addToast('info', 'Info', 'Fitur tambah halaman kustom segera hadir')}>
                        Buat Halaman Baru
                    </button>
                </div>
            </div>

            {loading ? (
                <div style={{ padding: '40px', textAlign: 'center' }}>Memuat data...</div>
            ) : pages.length === 0 ? (
                <EmptyState
                    icon={Layout}
                    title="Tidak Ada Halaman"
                    message="Belum ada halaman statis yang terdaftar."
                />
            ) : (
                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Judul Halaman</th>
                                <th>Slug / URL</th>
                                <th>Status Terakhir Diubah</th>
                                <th style={{ width: 120 }}>Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {pages.map(p => (
                                <tr key={p.id}>
                                    <td>
                                        <div style={{ fontWeight: 600 }}>{p.title}</div>
                                    </td>
                                    <td>
                                        <span className="mono" style={{ fontSize: '0.85rem', color: 'var(--primary-600)' }}>/informasi</span>
                                    </td>
                                    <td>{formatDate(p.updated_at || p.created_at)}</td>
                                    <td>
                                        <div className="action-group">
                                            <a href={`http://localhost:5174/informasi?tab=${p.slug}`} target="_blank" rel="noreferrer" className="btn-icon btn-view" title="Lihat"><Eye size={20} /></a>
                                            <button className="btn-icon btn-edit" title="Edit Konten" onClick={() => handleOpenModal(p)}><Edit2 size={20} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {showModal && (
                <div className="modal-overlay" style={{ zIndex: 1000 }}>
                    <div className="modal-content" style={{ maxWidth: 1000, maxHeight: '95vh', overflowY: 'auto' }}>
                        <div className="modal-header" style={{ position: 'sticky', top: 0, background: 'var(--bg-card)', zIndex: 10 }}>
                            <h2>Edit Halaman: {editData?.title}</h2>
                            <button className="btn-close" onClick={() => setShowModal(false)}>×</button>
                        </div>
                        <div className="modal-body">
                            <form id="pageForm" onSubmit={handleSave}>
                                <div className="form-group mb-4">
                                    <label>Judul Halaman <span className="text-danger">*</span></label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={form.title}
                                        onChange={e => setForm({ ...form, title: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="form-group mb-4">
                                    <label>Meta Description (SEO)</label>
                                    <textarea
                                        className="form-control"
                                        value={form.meta_description}
                                        onChange={e => setForm({ ...form, meta_description: e.target.value })}
                                        placeholder="Deskripsi singkat untuk mesin pencari..."
                                        rows={2}
                                    />
                                </div>
                                <div className="form-group mb-4">
                                    <label>Konten Halaman <span className="text-danger">*</span></label>
                                    <RichTextEditor
                                        value={form.content}
                                        onChange={content => setForm({ ...form, content })}
                                    />
                                </div>
                            </form>
                        </div>
                        <div className="modal-footer" style={{ position: 'sticky', bottom: 0, background: 'var(--bg-card)', zIndex: 10 }}>
                            <button className="btn btn-secondary" onClick={() => setShowModal(false)} disabled={saving}>Batal</button>
                            <button type="submit" form="pageForm" className="btn btn-primary" disabled={saving || !form.content}>
                                {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
