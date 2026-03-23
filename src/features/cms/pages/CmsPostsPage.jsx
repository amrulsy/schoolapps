import { useState, useEffect } from 'react'
import { useApp } from '../../../context/AppContext'
import { Plus, Edit2, Trash2, FileText, Search, ExternalLink } from 'lucide-react'
import EmptyState from '../../../components/EmptyState'
import { useCustomAlert } from '../../../hooks/useCustomAlert'
import { getDirectDriveUrl } from '../../../utils/urlHelper'
import RichTextEditor from '../../../components/RichTextEditor'
import MediaLibraryModal from '../../../components/MediaLibraryModal'
import MediaUploadField from '../../../components/MediaUploadField'
import { API_BASE_CMS as API_BASE, getAuthHeaders, getBearerHeader } from '../../../services/api'

export default function CmsPostsPage({ hideHeader = false }) {
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
            <div className={hideHeader ? "page-toolbar mb-4" : "page-header"}>
                {!hideHeader && <h1>Pengumuman & Berita</h1>}
                <div className="actions">
                    <button className="btn btn-primary" onClick={() => handleOpenModal()}>
                        <Plus size={16} /> Buat Baru
                    </button>
                </div>
            </div>

            {hideHeader && (
                <style>{`
                    .page-toolbar { display: flex; justify-content: flex-end; align-items: center; gap: 12px; }
                `}</style>
            )}

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
                <div className="article-modal-overlay">
                    <div className="article-modal-container fade-scale-in">
                        <div className="article-modal-header">
                            <div className="header-content">
                                <div className="header-icon">
                                    <FileText size={24} />
                                </div>
                                <div className="header-text">
                                    <h2>{editData ? 'Edit Artikel' : 'Tulis Artikel Baru'}</h2>
                                    <p>{editData ? 'Perbarui konten dan pengaturan publikasi' : 'Buat konten berkualitas untuk pembaca portal'}</p>
                                </div>
                            </div>
                            <button className="btn-close-circle" onClick={() => setShowModal(false)}>×</button>
                        </div>

                        <div className="article-modal-body">
                            <form id="postForm" onSubmit={handleSave} className="article-form-layout">
                                {/* MAIN CONTENT COLUMN */}
                                <div className="form-main">
                                    <div className="form-section">
                                        <div className="section-header">
                                            <span className="section-dot"></span>
                                            <h3>Konten Utama</h3>
                                        </div>

                                        <div className="form-group mb-4">
                                            <label className="rich-label">Judul Artikel <span className="text-danger">*</span></label>
                                            <input
                                                type="text"
                                                className="form-control form-control-lg title-input"
                                                placeholder="Masukkan judul yang menarik..."
                                                value={form.title}
                                                onChange={e => setForm({
                                                    ...form,
                                                    title: e.target.value,
                                                    slug: editData ? form.slug : e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
                                                })}
                                                required
                                            />
                                        </div>

                                        <div className="form-group mb-4">
                                            <label className="rich-label">Ringkasan Singkat</label>
                                            <textarea
                                                className="form-control excerpt-input"
                                                value={form.excerpt}
                                                onChange={e => setForm({ ...form, excerpt: e.target.value })}
                                                placeholder="Gambarkan isi artikel dalam 1-2 kalimat..."
                                                rows={2}
                                            />
                                        </div>

                                        <div className="form-group">
                                            <label className="rich-label">Isi Konten <span className="text-danger">*</span></label>
                                            <div className="editor-wrapper">
                                                <RichTextEditor
                                                    value={form.content}
                                                    onChange={content => setForm({ ...form, content })}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* SIDEBAR COLUMN */}
                                <div className="form-sidebar">
                                    <div className="sidebar-section">
                                        <div className="section-header">
                                            <span className="section-dot"></span>
                                            <h3>Pengaturan & Media</h3>
                                        </div>

                                        <div className="form-group mb-4">
                                            <label className="rich-label">Status & Visibilitas</label>
                                            <div className="status-selector">
                                                <select
                                                    className="form-control"
                                                    value={form.status}
                                                    onChange={e => setForm({ ...form, status: e.target.value })}
                                                >
                                                    <option value="draft">📁 Simpan sebagai Draft</option>
                                                    <option value="published">🚀 Publikasikan (Tayang)</option>
                                                    <option value="archived">📦 Pindahkan ke Arsip</option>
                                                </select>
                                            </div>
                                        </div>

                                        <div className="form-group mb-4">
                                            <label className="rich-label">Kategori</label>
                                            <select
                                                className="form-control"
                                                value={form.category}
                                                onChange={e => setForm({ ...form, category: e.target.value })}
                                            >
                                                <option value="pengumuman">📢 Pengumuman</option>
                                                <option value="berita">📰 Berita Terbaru</option>
                                                <option value="artikel">📝 Artikel Bebas</option>
                                            </select>
                                        </div>

                                        <div className="form-group mb-4">
                                            <label className="rich-label">URL Slug</label>
                                            <div className="slug-input-wrapper">
                                                <span className="slug-prefix">/</span>
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    value={form.slug}
                                                    onChange={e => setForm({ ...form, slug: e.target.value })}
                                                    placeholder="slug-url"
                                                />
                                            </div>
                                        </div>

                                        <div className="mb-4">
                                            <MediaUploadField
                                                label="Gambar Cover"
                                                value={form.cover_image}
                                                onChange={(url) => setForm({ ...form, cover_image: url })}
                                                previewStyle={{ height: '140px' }}
                                                compact={true}
                                            />
                                        </div>

                                        <div className="pin-toggle">
                                            <label className="toggle-label">
                                                <input
                                                    type="checkbox"
                                                    checked={form.is_pinned}
                                                    onChange={e => setForm({ ...form, is_pinned: e.target.checked })}
                                                />
                                                <span className="toggle-text">
                                                    <strong>Sematkan di Atas</strong>
                                                    <span>Tampilkan prioritas utama</span>
                                                </span>
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            </form>
                        </div>

                        <div className="article-modal-footer">
                            <div className="footer-info">
                                {form.content.length > 0 && (
                                    <span className="word-count">
                                        {form.content.replace(/<[^>]*>/g, '').split(/\s+/).filter(x => x.length > 0).length} kata
                                    </span>
                                )}
                            </div>
                            <div className="footer-actions">
                                <button className="btn-cancel" onClick={() => setShowModal(false)} disabled={saving}>Batal</button>
                                <button
                                    type="submit"
                                    form="postForm"
                                    className="btn-save-article"
                                    disabled={saving || !form.content || !form.title}
                                >
                                    {saving ? (
                                        <><div className="spinner-xs" /> Menyimpan...</>
                                    ) : (
                                        <><FileText size={18} /> {editData ? 'Simpan Perubahan' : 'Terbitkan Artikel'}</>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>

                    <style>{`
                        .article-modal-overlay {
                            position: fixed; inset: 0; background: rgba(15, 23, 42, 0.7);
                            backdrop-filter: blur(10px); z-index: 1000;
                            display: flex; align-items: center; justify-content: center; padding: 20px;
                        }

                        .article-modal-container {
                            background: #fff; width: 100%; max-width: 1200px;
                            max-height: 92vh; border-radius: 28px;
                            display: flex; flex-direction: column; overflow: hidden;
                            box-shadow: 0 40px 80px -20px rgba(0,0,0,0.4);
                            border: 1px solid rgba(255,255,255,0.1);
                        }

                        .article-modal-header {
                            padding: 24px 32px; background: #fff;
                            border-bottom: 1px solid #f1f5f9; display: flex;
                            justify-content: space-between; align-items: center;
                        }

                        .header-content { display: flex; align-items: center; gap: 20px; }
                        .header-icon { 
                            width: 52px; height: 52px; border-radius: 16px;
                            background: #eff6ff; color: #3b82f6;
                            display: flex; align-items: center; justify-content: center;
                        }
                        .header-text h2 { margin: 0; font-size: 1.4rem; font-weight: 800; color: #0f172a; }
                        .header-text p { margin: 4px 0 0; font-size: 0.875rem; color: #64748b; }

                        .btn-close-circle {
                            width: 36px; height: 36px; border-radius: 50%; border: none;
                            background: #f1f5f9; color: #64748b; font-size: 20px;
                            display: flex; align-items: center; justify-content: center;
                            cursor: pointer; transition: all 0.2s;
                        }
                        .btn-close-circle:hover { background: #fee2e2; color: #ef4444; transform: rotate(90deg); }

                        .article-modal-body {
                            flex: 1; overflow-y: auto; padding: 32px; background: #f8fafc;
                        }

                        .article-form-layout { display: grid; grid-template-columns: 1fr 340px; gap: 32px; align-items: start; }

                        .form-section, .sidebar-section {
                            background: #fff; padding: 24px; border-radius: 20px;
                            box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02), 0 2px 4px -1px rgba(0,0,0,0.01);
                            border: 1px solid #f1f5f9;
                        }

                        .section-header { display: flex; align-items: center; gap: 10px; margin-bottom: 24px; }
                        .section-dot { width: 8px; height: 8px; border-radius: 50%; background: #3b82f6; }
                        .section-header h3 { margin: 0; font-size: 0.9375rem; font-weight: 700; color: #1e293b; text-transform: uppercase; letter-spacing: 0.05em; }

                        .rich-label { display: block; margin-bottom: 10px; font-weight: 700; font-size: 0.875rem; color: #334155; }
                        
                        .title-input { 
                            font-size: 1.25rem !important; font-weight: 700 !important;
                            padding: 14px 18px !important; border-radius: 12px !important;
                            border: 2px solid #e2e8f0 !important; transition: all 0.2s !important;
                        }
                        .title-input:focus { border-color: #3b82f6 !important; background: #fff !important; }

                        .excerpt-input { border-radius: 12px !important; padding: 12px !important; resize: none; font-size: 0.9rem; }

                        .editor-wrapper { 
                            border: 1px solid #e2e8f0; border-radius: 14px; overflow: hidden;
                            background: #fff;
                        }

                        .slug-input-wrapper { position: relative; display: flex; align-items: center; }
                        .slug-prefix { 
                            position: absolute; left: 14px; font-weight: 700; color: #94a3b8;
                            pointer-events: none;
                        }
                        .slug-input-wrapper input { padding-left: 30px; border-radius: 10px; font-family: monospace; font-size: 0.85rem; }

                        .pin-toggle {
                            padding: 16px; background: #f8fafc; border-radius: 14px;
                            border: 1px solid #e2e8f0;
                        }
                        .toggle-label { display: flex; align-items: center; gap: 12px; cursor: pointer; }
                        .toggle-label input { width: 20px; height: 20px; cursor: pointer; }
                        .toggle-text { display: flex; flex-direction: column; }
                        .toggle-text strong { font-size: 0.875rem; color: #1e293b; }
                        .toggle-text span { font-size: 0.75rem; color: #64748b; }

                        .article-modal-footer {
                            padding: 20px 32px; background: #fff; border-top: 1px solid #f1f5f9;
                            display: flex; justify-content: space-between; align-items: center;
                        }

                        .footer-info { font-size: 0.8125rem; color: #94a3b8; font-weight: 500; }
                        
                        .footer-actions { display: flex; gap: 12px; }
                        .btn-cancel {
                            padding: 10px 24px; border-radius: 12px; border: 1px solid #e2e8f0;
                            background: transparent; color: #64748b; font-weight: 600; cursor: pointer;
                        }
                        .btn-cancel:hover { background: #f8fafc; color: #1e293b; }

                        .btn-save-article {
                            padding: 10px 28px; border-radius: 12px; border: none;
                            background: #3b82f6; color: #fff; font-weight: 700;
                            display: flex; align-items: center; gap: 10px; cursor: pointer;
                            transition: all 0.2s; box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
                        }
                        .btn-save-article:hover { background: #2563eb; transform: translateY(-2px); box-shadow: 0 6px 16px rgba(59, 130, 246, 0.4); }
                        .btn-save-article:disabled { background: #94a3b8; cursor: not-allowed; box-shadow: none; transform: none; }

                        .spinner-xs { width: 14px; height: 14px; border: 2px solid rgba(255,255,255,0.3); border-top-color: #fff; border-radius: 50%; animation: spin 0.8s linear infinite; }
                        @keyframes spin { to { transform: rotate(360deg); } }
                        @keyframes fade-scale-in {
                            from { opacity: 0; transform: scale(0.95) translateY(10px); }
                            to { opacity: 1; transform: scale(1) translateY(0); }
                        }
                        .fade-scale-in { animation: fade-scale-in 0.3s cubic-bezier(0.16, 1, 0.3, 1); }

                        @media (max-width: 992px) {
                            .article-form-layout { grid-template-columns: 1fr; }
                            .form-sidebar { order: -1; }
                        }
                    `}</style>
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
