import { useApp } from '../context/AppContext'
import { UserCog, Plus } from 'lucide-react'

export default function UsersPage() {
    const { users } = useApp()

    return (
        <div className="fade-in">
            <div className="page-header">
                <h1>Manajemen Pengguna</h1>
                <div className="actions">
                    <button className="btn btn-primary"><Plus size={16} /> Tambah User</button>
                </div>
            </div>

            <div className="table-container">
                <table>
                    <thead>
                        <tr>
                            <th style={{ width: 60 }}>No</th>
                            <th>Nama Lengkap</th>
                            <th>Username</th>
                            <th>Role</th>
                            <th style={{ width: 100 }}>Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map((u, i) => (
                            <tr key={u.id}>
                                <td>{i + 1}</td>
                                <td style={{ fontWeight: 500 }}>{u.nama}</td>
                                <td className="mono">{u.username}</td>
                                <td>
                                    <span className={`badge ${u.role === 'admin' ? 'badge-info' : 'badge-success'}`}>
                                        {u.role === 'admin' ? '🟣 Admin' : '🟢 Kasir'}
                                    </span>
                                </td>
                                <td>
                                    <button className="btn-icon" title="Edit"><UserCog size={16} /></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
