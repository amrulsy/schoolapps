import { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, ArrowUp, ArrowDown } from 'lucide-react'
import * as Icons from 'lucide-react'
import Modal from '../../components/Modal'
import { useCustomAlert } from '../../hooks/useCustomAlert'
import { API_BASE } from '../../services/api'

export default function StudentMenuPage() {
    const [menus, setMenus] = useState([])
    const [loading, setLoading] = useState(true)
    const { confirmDelete, showError, showSuccess } = useCustomAlert()

    // Modal
    const [showModal, setShowModal] = useState(false)
    const [editMode, setEditMode] = useState(false)
    const [selectedId, setSelectedId] = useState(null)
    const [formData, setFormData] = useState({
        label: '', icon: 'Circle', path: '', color: '#3B82F6', bg: 'rgba(59, 130, 246, 0.15)', is_active: true, sort_order: 0
    })

    const fetchMenus = async () => {
        try {
            setLoading(true)
            const token = localStorage.getItem('token') || ''
            const res = await fetch(`${API_BASE}/admin/student-menus`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })
            if (!res.ok) throw new Error('Failed to fetch menus')
            const data = await res.json()
            setMenus(data)
        } catch (err) {
            console.error(err)
            showError('Gagal', 'Tidak dapat memuat data menu siswa.')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchMenus()
    }, [])

    const handleSave = async () => {
        try {
            const token = localStorage.getItem('token') || ''
            const url = editMode ? `${API_BASE}/admin/student-menus/${selectedId}` : `${API_BASE}/admin/student-menus`
            const method = editMode ? 'PUT' : 'POST'

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(formData)
            })

            if (!res.ok) throw new Error('Failed to save')
            await fetchMenus()
            setShowModal(false)
            showSuccess('Berhasil', 'Menu siswa berhasil disimpan.')
        } catch (err) {
            console.error(err)
            showError('Gagal', 'Gagal menyimpan menu.')
        }
    }

    const handleDelete = async (id, label) => {
        const isConfirmed = await confirmDelete('Hapus Menu?', `Apakah Anda yakin ingin menghapus menu "${label}"?`)
        if (isConfirmed) {
            try {
                const token = localStorage.getItem('token') || ''
                const res = await fetch(`${API_BASE}/admin/student-menus/${id}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${token}` }
                })
                if (!res.ok) throw new Error('Delete failed')
                await fetchMenus()
            } catch (err) {
                console.error(err)
                showError('Gagal', 'Gagal menghapus menu.')
            }
        }
    }

    const handleToggleActive = async (id, currentStatus) => {
        try {
            const token = localStorage.getItem('token') || ''
            const res = await fetch(`${API_BASE}/admin/student-menus/${id}/toggle`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ is_active: !currentStatus })
            })
            if (!res.ok) throw new Error('Toggle failed')
            await fetchMenus()
        } catch (err) {
            console.error(err)
            showError('Gagal', 'Gagal mengubah status menu.')
        }
    }

    const handleMove = async (index, direction) => {
        if ((direction === -1 && index === 0) || (direction === 1 && index === menus.length - 1)) return;

        const newMenus = [...menus]
        const temp = newMenus[index]
        newMenus[index] = newMenus[index + direction]
        newMenus[index + direction] = temp

        const orderedIds = newMenus.map(m => m.id)

        try {
            const token = localStorage.getItem('token') || ''
            const res = await fetch(`${API_BASE}/admin/student-menus/reorder`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ orderedIds })
            })
            if (!res.ok) throw new Error('Reorder failed')
            await fetchMenus()
        } catch (err) {
            showError('Gagal', 'Gagal mengubah urutan menu.')
        }
    }

    const openTambah = () => {
        setEditMode(false)
        setSelectedId(null)
        setFormData({ label: '', icon: 'LayoutTemplate', path: '/siswa-portal/', color: '#3B82F6', bg: 'rgba(59, 130, 246, 0.15)', is_active: true, sort_order: menus.length })
        setShowModal(true)
    }

    const openEdit = (menu) => {
        setEditMode(true)
        setSelectedId(menu.id)
        setFormData({ ...menu })
        setShowModal(true)
    }

    const DynamicIcon = ({ name, ...props }) => {
        const IconComponent = Icons[name] || Icons.Circle
        return <IconComponent {...props} />
    }

    return (
        <div className="fade-in">
            <div className="page-header">
                <div>
                    <h1>Menu Dashboard Siswa</h1>
                    <p style={{ color: 'var(--text-secondary)' }}>Kelola menu pada aplikasi portal siswa.</p>
                </div>
                <div className="actions">
                    <button className="btn btn-primary" onClick={openTambah}>
                        <Plus size={16} /> Tambah Menu
                    </button>
                </div>
            </div>

            <div className="table-container">
                <table>
                    <thead>
                        <tr>
                            <th style={{ width: '80px', textAlign: 'center' }}>Urutan</th>
                            <th>Icon</th>
                            <th>Nama Menu</th>
                            <th>Path (URL)</th>
                            <th style={{ textAlign: 'center' }}>Status</th>
                            <th style={{ textAlign: 'right' }}>Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="6" style={{ textAlign: 'center', padding: '20px' }}>Memuat data...</td></tr>
                        ) : menus.length === 0 ? (
                            <tr><td colSpan="6" style={{ textAlign: 'center', padding: '20px' }}>Belum ada menu siswa.</td></tr>
                        ) : (
                            menus.map((menu, index) => (
                                <tr key={menu.id}>
                                    <td style={{ textAlign: 'center' }}>
                                        <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                                            <button className="btn-icon" onClick={() => handleMove(index, -1)} disabled={index === 0}><ArrowUp size={16} /></button>
                                            <button className="btn-icon" onClick={() => handleMove(index, 1)} disabled={index === menus.length - 1}><ArrowDown size={16} /></button>
                                        </div>
                                    </td>
                                    <td>
                                        <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: menu.bg, color: menu.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <DynamicIcon name={menu.icon} size={20} />
                                        </div>
                                    </td>
                                    <td style={{ fontWeight: 500 }}>{menu.label}</td>
                                    <td className="mono" style={{ fontSize: '0.9em', color: 'var(--text-secondary)' }}>{menu.path}</td>
                                    <td style={{ textAlign: 'center' }}>
                                        <button
                                            className={`badge ${menu.is_active ? 'badge-success' : 'badge-danger'}`}
                                            onClick={() => handleToggleActive(menu.id, menu.is_active)}
                                            style={{ cursor: 'pointer', border: 'none', padding: '6px 12px' }}
                                        >
                                            {menu.is_active ? 'Aktif' : 'Nonaktif'}
                                        </button>
                                    </td>
                                    <td className="actions-cell">
                                        <div className="action-group" style={{ justifyContent: 'flex-end' }}>
                                            <button className="btn-icon btn-edit" title="Edit Menu" onClick={() => openEdit(menu)}>
                                                <Edit2 size={18} />
                                            </button>
                                            <button className="btn-icon btn-delete danger" title="Hapus Menu" onClick={() => handleDelete(menu.id, menu.label)}>
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {showModal && (
                <Modal title={editMode ? 'Edit Menu Siswa' : 'Tambah Menu Siswa'} onClose={() => setShowModal(false)} footer={
                    <>
                        <button className="btn btn-ghost" onClick={() => setShowModal(false)}>Batal</button>
                        <button className="btn btn-primary" onClick={handleSave}>💾 Simpan</button>
                    </>
                }>
                    <div className="form-group">
                        <label>Nama Menu (Label) *</label>
                        <input className="form-control" value={formData.label} onChange={e => setFormData({ ...formData, label: e.target.value })} placeholder="Contoh: Presensi" required />
                    </div>
                    <div className="form-group" style={{ marginTop: '15px' }}>
                        <label>Nama Icon (dari Lucide React) *</label>
                        <input className="form-control" value={formData.icon} onChange={e => setFormData({ ...formData, icon: e.target.value })} placeholder="Contoh: ClipboardCheck" required />
                        <small style={{ color: 'var(--text-secondary)', display: 'block', marginTop: '4px' }}>Gunakan nama komponen icon dari lucide.dev/icons</small>
                    </div>
                    <div className="form-group" style={{ marginTop: '15px' }}>
                        <label>Path URL *</label>
                        <input className="form-control" value={formData.path} onChange={e => setFormData({ ...formData, path: e.target.value })} placeholder="Contoh: /siswa-portal/presensi" required />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginTop: '15px' }}>
                        <div className="form-group">
                            <label>Warna Icon (Hex)</label>
                            <input type="color" className="form-control" value={formData.color} onChange={e => setFormData({ ...formData, color: e.target.value })} style={{ height: '40px', padding: '2px', width: '100%' }} />
                        </div>
                        <div className="form-group">
                            <label>Warna Background Icon</label>
                            <input className="form-control" value={formData.bg} onChange={e => setFormData({ ...formData, bg: e.target.value })} placeholder="Contoh: rgba(16, 185, 129, 0.15)" />
                        </div>
                    </div>
                    <div className="form-group" style={{ marginTop: '15px' }}>
                        <label style={{ display: 'flex', alignItems: 'center' }}>
                            <input type="checkbox" checked={formData.is_active} onChange={e => setFormData({ ...formData, is_active: e.target.checked })} style={{ marginRight: '8px', width: 'auto' }} />
                            <span>Tampilkan menu ini di Dashboard Siswa</span>
                        </label>
                    </div>
                </Modal>
            )}

        </div>
    )
}
