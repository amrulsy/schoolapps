import { useState } from 'react'
import { useApp } from '../context/AppContext'
import { Calendar, CheckCircle2, Plus } from 'lucide-react'
import Modal from '../components/Modal'

export default function TahunAjaranPage() {
    const { tahunAjaranList, addTahunAjaran, setTahunAjaranAktif } = useApp()
    const [showModal, setShowModal] = useState(false)
    const [newTA, setNewTA] = useState('')

    const handleAdd = () => {
        if (!newTA) return
        addTahunAjaran(newTA)
        setNewTA('')
        setShowModal(false)
    }

    return (
        <div className="fade-in">
            <div className="page-header">
                <h1>Tahun Ajaran</h1>
                <div className="actions">
                    <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                        <Plus size={16} /> Tambah Tahun Ajaran
                    </button>
                </div>
            </div>

            <div className="table-container">
                <table>
                    <thead>
                        <tr>
                            <th style={{ width: 60 }}>No</th>
                            <th>Tahun Ajaran</th>
                            <th>Status</th>
                            <th style={{ width: 150 }}>Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {tahunAjaranList.map((d, i) => (
                            <tr key={d.id}>
                                <td>{i + 1}</td>
                                <td style={{ fontWeight: 500 }}>
                                    <Calendar size={14} style={{ verticalAlign: 'middle', marginRight: 8, color: 'var(--primary-500)' }} />
                                    {d.tahun}
                                </td>
                                <td>
                                    <span className={`badge ${d.status === 'aktif' ? 'badge-success' : 'badge-secondary'}`}>
                                        {d.status === 'aktif' ? '🟢 Aktif' : 'Nonaktif'}
                                    </span>
                                </td>
                                <td>
                                    {d.status !== 'aktif' && (
                                        <button
                                            className="btn btn-ghost btn-sm"
                                            style={{ color: 'var(--success-600)', fontSize: '0.8rem' }}
                                            onClick={() => setTahunAjaranAktif(d.id)}
                                        >
                                            <CheckCircle2 size={14} /> Set Aktif
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {showModal && (
                <Modal title="Tambah Tahun Ajaran Baru" onClose={() => setShowModal(false)} footer={
                    <>
                        <button className="btn btn-ghost" onClick={() => setShowModal(false)}>Batal</button>
                        <button className="btn btn-primary" onClick={handleAdd}>Simpan</button>
                    </>
                }>
                    <div className="form-group">
                        <label>Nama Tahun Ajaran</label>
                        <input
                            className="form-control"
                            placeholder="Contoh: 2026/2027"
                            value={newTA}
                            onChange={e => setNewTA(e.target.value)}
                            autoFocus
                        />
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 8 }}>
                            Tahun ajaran baru akan otomatis diset sebagai <strong>nonaktif</strong>.
                        </p>
                    </div>
                </Modal>
            )}
        </div>
    )
}
