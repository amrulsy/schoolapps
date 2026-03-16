import { useState } from 'react'
import { useApp } from '../context/AppContext'
import Modal from '../components/Modal'
import { Plus, Edit2, Trash2 } from 'lucide-react'

export default function KategoriTagihanPage() {
    const { categories, addCategory, deleteCategory } = useApp()
    const { formatRupiah } = useApp()
    const [showModal, setShowModal] = useState(false)

    const handleAdd = (data) => {
        addCategory(data)
        setShowModal(false)
    }

    const handleDelete = (cat) => {
        if (confirm(`Hapus kategori "${cat.nama}"?`)) {
            deleteCategory(cat.id)
        }
    }

    return (
        <div className="fade-in">
            <div className="page-header">
                <h1>Kategori Tagihan</h1>
                <div className="actions">
                    <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                        <Plus size={16} /> Tambah Kategori
                    </button>
                </div>
            </div>

            <div className="table-container">
                <table>
                    <thead>
                        <tr>
                            <th style={{ width: 60 }}>No</th>
                            <th>Nama Kategori</th>
                            <th>Nominal Default</th>
                            <th>Tipe</th>
                            <th style={{ width: 100 }}>Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {categories.map((cat, i) => (
                            <tr key={cat.id}>
                                <td>{i + 1}</td>
                                <td style={{ fontWeight: 500 }}>{cat.nama}</td>
                                <td className="mono">{formatRupiah(cat.nominal)}</td>
                                <td><span className="badge badge-secondary">{cat.tipe}</span></td>
                                <td>
                                    <button className="btn-icon" title="Edit"><Edit2 size={16} /></button>
                                    <button className="btn-icon danger" onClick={() => handleDelete(cat)} title="Hapus"><Trash2 size={16} /></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {showModal && (
                <KategoriForm onSave={handleAdd} onClose={() => setShowModal(false)} />
            )}
        </div>
    )
}

function KategoriForm({ onSave, onClose }) {
    const [form, setForm] = useState({ nama: '', nominal: '', tipe: 'Bulanan' })

    return (
        <Modal title="Tambah Kategori Tagihan" onClose={onClose} footer={
            <>
                <button className="btn btn-ghost" onClick={onClose}>Batal</button>
                <button className="btn btn-primary" onClick={() => form.nama && form.nominal && onSave({ ...form, nominal: Number(form.nominal) })}>
                    💾 Simpan
                </button>
            </>
        }>
            <div className="form-group">
                <label>Nama Kategori *</label>
                <input className="form-control" value={form.nama} onChange={e => setForm(prev => ({ ...prev, nama: e.target.value }))} placeholder="contoh: SPP" autoFocus />
            </div>
            <div className="form-row">
                <div className="form-group">
                    <label>Nominal Default (Rp) *</label>
                    <input type="number" className="form-control mono" value={form.nominal} onChange={e => setForm(prev => ({ ...prev, nominal: e.target.value }))} placeholder="150000" />
                </div>
                <div className="form-group">
                    <label>Tipe *</label>
                    <select className="form-control" value={form.tipe} onChange={e => setForm(prev => ({ ...prev, tipe: e.target.value }))}>
                        <option>Bulanan</option>
                        <option>Semester</option>
                        <option>Tahunan</option>
                        <option>Insidentil</option>
                    </select>
                </div>
            </div>
        </Modal>
    )
}
