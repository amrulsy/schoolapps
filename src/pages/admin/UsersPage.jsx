import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../../context/AuthContext'
import { UserCog, Plus, Trash2, X, Save, Shield, Key } from 'lucide-react'
import { API_BASE, getAuthHeaders } from '../../services/api'
import Swal from 'sweetalert2' // Assuming Swal is available for premium UX

export default function UsersPage() {
    const { users, setUsers, currentUser } = useAuth()
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [isEditing, setIsEditing] = useState(false)
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        id: '',
        nama: '',
        username: '',
        password: '',
        role: 'staf_tu'
    })

    const fetchUsers = useCallback(async () => {
        try {
            const res = await fetch(`${API_BASE}/users`, { headers: getAuthHeaders() })
            const data = await res.json()
            if (Array.isArray(data)) setUsers(data)
        } catch (err) { console.error('Gagal fetch users:', err) }
    }, [setUsers])

    useEffect(() => {
        fetchUsers()
    }, [fetchUsers])

    const handleOpenModal = (user = null) => {
        if (user) {
            setFormData({
                id: user.id,
                nama: user.nama,
                username: user.username,
                password: '',
                role: user.role
            })
            setIsEditing(true)
        } else {
            setFormData({
                id: '',
                nama: '',
                username: '',
                password: '',
                role: 'staf_tu'
            })
            setIsEditing(false)
        }
        setIsModalOpen(true)
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        try {
            const url = isEditing ? `${API_BASE}/users/${formData.id}` : `${API_BASE}/users`
            const method = isEditing ? 'PUT' : 'POST'
            
            const res = await fetch(url, {
                method,
                headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            })
            
            const data = await res.json()
            if (res.ok) {
                Swal.fire('Berhasil', `User berhasil ${isEditing ? 'diperbarui' : 'ditambahkan'}`, 'success')
                setIsModalOpen(false)
                fetchUsers()
            } else {
                Swal.fire('Gagal', data.error || 'Terjadi kesalahan', 'error')
            }
        } catch (err) {
            Swal.fire('Error', 'Gagal menghubungi server', 'error')
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async (id, nama) => {
        if (id === currentUser.id) {
            return Swal.fire('Ditolak', 'Anda tidak bisa menghapus akun sendiri.', 'warning')
        }

        const result = await Swal.fire({
            title: 'Hapus User?',
            text: `Apakah Anda yakin ingin menghapus user ${nama}?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            confirmButtonText: 'Ya, Hapus!',
            cancelButtonText: 'Batal'
        })

        if (result.isConfirmed) {
            try {
                const res = await fetch(`${API_BASE}/users/${id}`, {
                    method: 'DELETE',
                    headers: getAuthHeaders()
                })
                if (res.ok) {
                    Swal.fire('Terhapus!', 'User berhasil dihapus.', 'success')
                    fetchUsers()
                } else {
                    const data = await res.json()
                    Swal.fire('Gagal', data.error || 'Gagal menghapus user', 'error')
                }
            } catch (err) {
                Swal.fire('Error', 'Gagal menghubungi server', 'error')
            }
        }
    }

    return (
        <div className="fade-in">
            <div className="page-header">
                <div>
                    <h1>Manajemen Pengguna</h1>
                    <p style={{ color: 'var(--text-secondary)' }}>Kelola hak akses staf dan admin sistem</p>
                </div>
                <div className="actions">
                    <button className="btn btn-primary" onClick={() => handleOpenModal()}>
                        <Plus size={16} /> Tambah User
                    </button>
                </div>
            </div>

            <div className="table-container">
                <table>
                    <thead>
                        <tr>
                            <th style={{ width: 60 }}>No</th>
                            <th>Nama Lengkap</th>
                            <th>Username</th>
                            <th>Peran / Role</th>
                            <th style={{ width: 120 }}>Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map((u, i) => (
                            <tr key={u.id}>
                                <td>{i + 1}</td>
                                <td style={{ fontWeight: 500 }}>{u.nama}</td>
                                <td className="mono">{u.username}</td>
                                <td>
                                    <span className={`badge ${
                                        u.role === 'admin' ? 'badge-info' : 
                                        u.role === 'guru' ? 'badge-primary' : 'badge-success'
                                    }`}>
                                        {u.role === 'admin' ? '🟣 Admin' : 
                                         u.role === 'staf_tu' ? '🟠 Staf TU' :
                                         u.role === 'staf_keuangan' ? '🟢 Keuangan' :
                                         u.role === 'staf_perbankan' ? '🏦 Perbankan' :
                                         u.role === 'staf_infaq' ? '🕌 Infaq' :
                                         u.role === 'guru' ? '🔵 Guru' : 'Staf'}
                                    </span>
                                </td>
                                <td>
                                    <div className="action-group">
                                        <button 
                                            className="btn-icon btn-edit" 
                                            title="Edit"
                                            onClick={() => handleOpenModal(u)}
                                        >
                                            <UserCog size={18} />
                                        </button>
                                        <button 
                                            className="btn-icon btn-delete" 
                                            title="Hapus"
                                            onClick={() => handleDelete(u.id, u.nama)}
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Modal Tambah/Edit */}
            {isModalOpen && (
                <div className="modal-backdrop px-3">
                    <div className="modal" style={{ maxWidth: 500 }}>
                        <div className="modal-header">
                            <h3>{isEditing ? 'Edit User' : 'Tambah User Baru'}</h3>
                            <button className="btn-icon" onClick={() => setIsModalOpen(false)}><X /></button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="modal-body">
                                <div className="form-group">
                                    <label>Nama Lengkap</label>
                                    <input 
                                        type="text" 
                                        className="form-control" 
                                        required 
                                        value={formData.nama}
                                        onChange={e => setFormData({...formData, nama: e.target.value})}
                                        placeholder="Contoh: Ahmad Subarjo, S.Kom"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Username (Login)</label>
                                    <input 
                                        type="text" 
                                        className="form-control" 
                                        required 
                                        value={formData.username}
                                        onChange={e => setFormData({...formData, username: e.target.value})}
                                        placeholder="username_staf"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>{isEditing ? 'Password Baru (Kosongkan jika tidak diubah)' : 'Password'}</label>
                                    <div style={{ position: 'relative' }}>
                                        <Key size={16} style={{ position: 'absolute', left: 12, top: 12, color: 'var(--text-secondary)' }} />
                                        <input 
                                            type="password" 
                                            className="form-control" 
                                            style={{ paddingLeft: 40 }}
                                            required={!isEditing}
                                            value={formData.password}
                                            onChange={e => setFormData({...formData, password: e.target.value})}
                                            placeholder="******"
                                        />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label>Peran / Role</label>
                                    <div style={{ position: 'relative' }}>
                                        <Shield size={16} style={{ position: 'absolute', left: 12, top: 12, color: 'var(--text-secondary)' }} />
                                        <select 
                                            className="form-control" 
                                            style={{ paddingLeft: 40 }}
                                            value={formData.role}
                                            onChange={e => setFormData({...formData, role: e.target.value})}
                                        >
                                            <option value="admin">Super Admin</option>
                                            <option value="staf_tu">Staf TU (Akademik & CMS)</option>
                                            <option value="staf_keuangan">Staf Keuangan (POS & Bill)</option>
                                            <option value="staf_perbankan">Staf Perbankan (Tabungan)</option>
                                            <option value="staf_infaq">Staf Infaq</option>
                                            <option value="guru">Guru / Wali Kelas</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Batal</button>
                                <button type="submit" className="btn btn-primary" disabled={loading}>
                                    <Save size={18} /> {loading ? 'Menyimpan...' : 'Simpan User'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
