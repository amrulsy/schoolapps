import { useState, useEffect } from 'react'
import { useApp } from '../../../context/AppContext'
import { Plus, Edit2, Trash2, FileText, Search, ExternalLink } from 'lucide-react'
import EmptyState from '../../../components/EmptyState'
import { useCustomAlert } from '../../../hooks/useCustomAlert'
import RichTextEditor from '../../../components/RichTextEditor'
import MediaLibraryModal from '../../../components/MediaLibraryModal'

import { API_BASE_CMS as API_BASE, getAuthHeaders, getBearerHeader } from '../../../services/api'

export default function CmsPostsPage() {
    const { addToast } = useApp()
    const { confirmDelete } = useCustomAlert()
    const [posts, setPosts] = useState([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [filterCategory, setFilterCategory] = useState('')
    const [showModal, setShowModal] = useState(false)
    const [showCoverModal, setShowCoverModal] = useState(false)
    const [editData, setEditData] = useState(null)
    const [saving, setSaving] = useState(false)

    const [form, setForm] = useState({
        title: '', slug: '', excerpt: '', content: '', cover_image: '',
        category: 'pengumuman', status: 'draft', is_pinned: false
    })

    useEffect(() => {
        loadPosts()
    }, [])

    const loadPosts = async () => {
        try {
            setLoading(true)
            const res = await fetch(`${API_BASE}/posts`, {
                headers: getBearerHeader()
            })
            if (res.ok) {
                const data = await res.json()
                setPosts(data)
            }
        } catch (err) {
            addToast('danger', 'Error', 'Gagal memuat artikel/pengumuman')
        } finally {
            setLoading(false)
        }
    }

    const handleOpenModal = (post = null) => {
        setEditData(post)
        if (post) {
            setForm({
                title: post.title,
                slug: post.slug,
                excerpt: post.excerpt || '',
                content: post.content,
                cover_image: post.cover_image || '',
                category: post.category,
                status: post.status,
                is_pinned: post.is_pinned === 1
            })
        } else {
            setForm({
                title: '', slug: '', excerpt: '', content: '', cover_image: '',
                category: 'pengumuman', status: 'draft', is_pinned: false
            })
        }
        setShowModal(true)
    }

    const handleSave = async (e) => {
        e.preventDefault()
        setSaving(true)
        try {
            const url = editData ? `${API_BASE}/posts/${editData.id}` : `${API_BASE}/posts`
            const method = editData ? 'PUT' : 'POST'

            const payload = { ...form, is_pinned: form.is_pinned ? 1 : 0 }

            const res = await fetch(url, {
                method,
                headers: getAuthHeaders(),
                body: JSON.stringify(payload)
            })

            if (res.ok) {
                addToast('success', 'Berhasil', `Artikel berhasil ${editData ? 'diperbarui' : 'disimpan'}`)
                setShowModal(false)
                loadPosts()
            } else {
                const err = await res.json()
                addToast('danger', 'Gagal', err.error || 'Terjadi kesalahan')
            }
        } catch (err) {
            addToast('danger', 'Error', 'Gagal menyimpan artikel')
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async (post) => {
        const isConfirmed = await confirmDelete(
            `Hapus "${post.title}"?`,
            "Artikel/pengumuman yang dihapus tidak dapat dikembalikan."
        )
        if (isConfirmed) {
            try {
                const res = await fetch(`${API_BASE}/posts/${post.id}`, {
                    method: 'DELETE',
                    headers: getBearerHeader()
                })
                if (res.ok) {
                    addToast('success', 'Berhasil', 'Artikel dihapus')
                    loadPosts()
                }
            } catch (err) {
                addToast('danger', 'Error', 'Gagal menghapus artikel')
            }
        }
    }

    const filtered = posts.filter(p => {
        const matchSearch = String(p.title || '').toLowerCase().includes((search || '').toLowerCase())
        const matchCategory = !filterCategory || p.category === filterCategory
        return matchSearch && matchCategory
    })

    const formatDate = (dateStr) => {
        if (!dateStr) return '-'
        return new Date(dateStr).toLocaleDateString('id-ID', {
            day: 'numeric', month: 'short', year: 'numeric'
        })
    }

    return (
        <div className="fade-in">
            <div className="page-header">
                <h1>Pengumuman & Berita</h1>
                <div className="actions">
                    <button className="btn btn-primary" onClick={() => handleOpenModal()}>
                        <Plus size={16} /> Buat Baru
                    </button>
                </div>
            </div>

            <div className="filter-bar">
                <div className="search-input">
                    <Search size={16} className="search-icon" />
                    <input
                        type="text"
                        className="form-control"
                        placeholder="Cari judul artikel..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>
                <select className="form-control" value={filterCategory} onChange={e => setFilterCategory(e.target.value)}>
                    <option value="">Semua Kategori</option>
                    <option value="pengumuman">Pengumuman</option>
                    <option value="berita">Berita</option>
                    <option value="artikel">Artikel</option>
                </select>
            </div>

            {loading ? (
                <div style={{ padding: '40px', textAlign: 'center' }}>Memuat data...</div>
            ) : posts.length === 0 ? (
                <EmptyState
                    icon={FileText}
                    title="Belum Ada Konten"
                    message="Mulai publikasikan pengumuman atau berita untuk pengunjung portal."
                    action={
                        <button className="btn btn-primary" onClick={() => handleOpenModal()}>
                            <Plus size={16} /> Buat Baru
                        </button>
                    }
                />
            ) : (
                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th style={{ width: 100 }}>Kategori</th>
                                <th>Judul Artikel</th>
                                <th>Status</th>
                                <th>Tanggal Publikasi</th>
                                <th style={{ width: 120 }}>Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map(p => (
                                <tr key={p.id}>
                                    <td>
                                        <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', fontWeight: 700, color: 'var(--primary-600)' }}>
                                            {p.category}
                                        </span>
                                    </td>
                                    <td>
                                        <div style={{ fontWeight: 600 }}>{p.title}</div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 4 }}>
                                            /{p.slug}
                                        </div>
                                    </td>
                                    <td>
                                        <span className={`badge ${p.status === 'published' ? 'badge-success' : 'badge-warning'}`}>
                                            {p.status === 'published' ? 'Publik' : 'Draft'}
                                        </span>
                                        {p.is_pinned === 1 && (
                                            <span className="badge badge-info" style={{ marginLeft: 6 }}>📌 Pinned</span>
                                        )}
                                    </td>
                                    <td className="mono">{formatDate(p.published_at || p.created_at)}</td>
                                    <td>
                                        <div className="action-group">
                                            {p.status === 'published' && (
                                                <a href={`http://localhost:5174/pengumuman/${p.slug}`} target="_blank" rel="noreferrer" className="btn-icon" style={{ color: 'var(--primary-500)' }} title="Lihat di Portal">
                                                    <ExternalLink size={20} />
                                                </a>
                                            )}
                                            <button className="btn-icon btn-edit" title="Edit" onClick={() => handleOpenModal(p)}><Edit2 size={20} /></button>
                                            <button className="btn-icon btn-delete danger" onClick={() => handleDelete(p)} title="Hapus"><Trash2 size={20} /></button>
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
                            <h2>{editData ? 'Edit Artikel' : 'Tulis Artikel Baru'}</h2>
                            <button className="btn-close" onClick={() => setShowModal(false)}>×</button>
                        </div>
                        <div className="modal-body">
                            <form id="postForm" onSubmit={handleSave}>
                                <div className="grid-2 mb-4">
                                    <div className="form-group">
                                        <label>Judul Artikel <span className="text-danger">*</span></label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            value={form.title}
                                            onChange={e => setForm({
                                                ...form,
                                                title: e.target.value,
                                                // auto generate slug if new
                                                slug: editData ? form.slug : e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
                                            })}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Kategori</label>
                                        <select
                                            className="form-control"
                                            value={form.category}
                                            onChange={e => setForm({ ...form, category: e.target.value })}
                                        >
                                            <option value="pengumuman">Pengumuman</option>
                                            <option value="berita">Berita</option>
                                            <option value="artikel">Artikel Bebas</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="grid-2 mb-4">
                                    <div className="form-group">
                                        <label>URL Slug</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            value={form.slug}
                                            onChange={e => setForm({ ...form, slug: e.target.value })}
                                            placeholder="contoh-judul-artikel"
                                        />
                                        <small style={{ color: 'var(--text-muted)' }}>Biarkan kosong untuk auto-generate dari judul</small>
                                    </div>
                                    <div className="form-group">
                                        <label>Status Publikasi</label>
                                        <select
                                            className="form-control"
                                            value={form.status}
                                            onChange={e => setForm({ ...form, status: e.target.value })}
                                        >
                                            <option value="draft">Draft (Disembunyikan)</option>
                                            <option value="published">Published (Tayang)</option>
                                            <option value="archived">Archived (Arsip)</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="form-group mb-4">
                                    <label>Gambar Cover Utama</label>
                                    <div style={{ display: 'flex', gap: 8 }}>
                                        <input
                                            type="url"
                                            className="form-control"
                                            value={form.cover_image}
                                            onChange={e => setForm({ ...form, cover_image: e.target.value })}
                                            placeholder="https://..."
                                        />
                                        <button
                                            type="button"
                                            className="btn btn-secondary"
                                            onClick={() => setShowCoverModal(true)}
                                            style={{ whiteSpace: 'nowrap' }}
                                        >
                                            Pilih Media
                                        </button>
                                    </div>
                                    {form.cover_image && (
                                        <div style={{ marginTop: 10, height: 120, width: 200, background: '#f8f9fa', borderRadius: 6, overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                                            <img src={form.cover_image} alt="Cover Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        </div>
                                    )}
                                </div>

                                <div className="form-group mb-4">
                                    <label>Ringkasan (Excerpt)</label>
                                    <textarea
                                        className="form-control"
                                        value={form.excerpt}
                                        onChange={e => setForm({ ...form, excerpt: e.target.value })}
                                        placeholder="Teks singkat yang muncul di kartu pratinjau..."
                                        rows={2}
                                    />
                                </div>

                                <div className="form-group mb-4">
                                    <label>Konten Lengkap <span className="text-danger">*</span></label>
                                    <RichTextEditor
                                        value={form.content}
                                        onChange={content => setForm({ ...form, content })}
                                    />
                                </div>

                                <div className="form-group" style={{ marginBottom: 40 }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', margin: 0 }}>
                                        <input
                                            type="checkbox"
                                            checked={form.is_pinned}
                                            onChange={e => setForm({ ...form, is_pinned: e.target.checked })}
                                            style={{ width: 18, height: 18 }}
                                        />
                                        <span style={{ fontWeight: 600 }}>Pin artikel ini di urutan teratas</span>
                                    </label>
                                </div>
                            </form>
                        </div>
                        <div className="modal-footer" style={{ position: 'sticky', bottom: 0, background: 'var(--bg-card)', zIndex: 10 }}>
                            <button className="btn btn-secondary" onClick={() => setShowModal(false)} disabled={saving}>Batal</button>
                            <button type="submit" form="postForm" className="btn btn-primary" disabled={saving || !form.content}>
                                {saving ? 'Menyimpan...' : 'Simpan Artikel'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <MediaLibraryModal
                isOpen={showCoverModal}
                onClose={() => setShowCoverModal(false)}
                onSelect={(url) => setForm({ ...form, cover_image: url })}
            />
        </div>
    )
}
