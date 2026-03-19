import { useState } from 'react'
import { useApp } from '../../context/AppContext'
import { useCustomAlert } from '../../hooks/useCustomAlert'
import Modal from '../../components/Modal'
import { Plus, Edit2, Trash2, Info } from 'lucide-react'

export default function KategoriTagihanPage() {
    const { categories, addCategory, deleteCategory } = useApp()
    const { formatRupiah } = useApp()
    const { confirmDelete } = useCustomAlert()
    const [showModal, setShowModal] = useState(false)

    const handleAdd = (data) => {
        addCategory(data)
        setShowModal(false)
    }

    const handleDelete = async (cat) => {
        const isConfirmed = await confirmDelete(
            `Hapus Kategori "${cat.nama}"?`,
            "Tagihan yang sudah dibuat dengan kategori ini mungkin akan terpengaruh."
        )
        if (isConfirmed) {
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
                            <th>Kode</th>
                            <th>Nama Kategori</th>
                            <th>Nominal Default</th>
                            <th>Tipe</th>
                            <th>Keterangan</th>
                            <th style={{ width: 100 }}>Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {categories.map((cat, i) => (
                            <tr key={cat.id}>
                                <td>{i + 1}</td>
                                <td className="mono" style={{ fontSize: '0.8rem', fontWeight: 600 }}>{cat.kode || '-'}</td>
                                <td style={{ fontWeight: 600 }}>{cat.nama}</td>
                                <td className="mono">{formatRupiah(cat.nominal)}</td>
                                <td><span className="badge badge-secondary" style={{ textTransform: 'capitalize' }}>{cat.tipe}</span></td>
                                <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{cat.keterangan || '-'}</td>
                                <td>
                                    <div className="action-group">
                                        <button className="btn-icon btn-edit" title="Edit"><Edit2 size={20} /></button>
                                        <button className="btn-icon btn-delete danger" onClick={() => handleDelete(cat)} title="Hapus"><Trash2 size={20} /></button>
                                    </div>
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
    const [form, setForm] = useState({ kode: '', nama: '', nominal: '', tipe: 'bulanan', keterangan: '' })

    return (
        <Modal title="Tambah Kategori Tagihan" onClose={onClose} footer={
            <>
                <button className="btn btn-ghost" onClick={onClose}>Batal</button>
                <button className="btn btn-primary" onClick={() => form.kode && form.nama && form.nominal && onSave({ ...form, nominal: Number(form.nominal) })}>
                    💾 Simpan
                </button>
            </>
        }>
            <div className="form-row">
                <div className="form-group">
                    <label>Kode Kategori *</label>
                    <input className="form-control mono" value={form.kode} onChange={e => setForm(prev => ({ ...prev, kode: e.target.value.toUpperCase() }))} placeholder="contoh: SPP-01" autoFocus />
                </div>
                <div className="form-group">
                    <label>Nama Kategori *</label>
                    <input className="form-control" value={form.nama} onChange={e => setForm(prev => ({ ...prev, nama: e.target.value }))} placeholder="contoh: SPP" />
                </div>
            </div>

            <div className="form-row">
                <div className="form-group">
                    <label>Nominal Default (Rp) *</label>
                    <input type="number" className="form-control mono" value={form.nominal} onChange={e => setForm(prev => ({ ...prev, nominal: e.target.value }))} placeholder="150000" />
                </div>
                <div className="form-group">
                    <label>Tipe Tagihan *</label>
                    <select className="form-control" value={form.tipe} onChange={e => setForm(prev => ({ ...prev, tipe: e.target.value }))}>
                        <option value="bulanan">1 Bulanan sekali</option>
                        <option value="3bulanan">3 Bulanan sekali (Triwulan)</option>
                        <option value="semesteran">Semesteran sekali</option>
                        <option value="tahunan">Tahunan sekali</option>
                    </select>
                </div>
            </div>

            <div className="form-group">
                <label>Keterangan</label>
                <textarea className="form-control" rows={2} value={form.keterangan} onChange={e => setForm(prev => ({ ...prev, keterangan: e.target.value }))} placeholder="Opsional, deskripsi atau catatan untuk kategori ini" />
            </div>
        </Modal>
    )
}
