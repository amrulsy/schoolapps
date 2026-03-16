import { useState } from 'react'
import Modal from '../../components/Modal'

export default function ExpenseForm({ onSave, onClose }) {
    const [form, setForm] = useState({
        keterangan: '',
        nominal: '',
        tanggal: new Date().toISOString().slice(0, 10),
    })

    return (
        <Modal title="Tambah Pengeluaran" onClose={onClose} footer={
            <>
                <button className="btn btn-ghost" onClick={onClose}>Batal</button>
                <button className="btn btn-primary" onClick={() => form.keterangan && form.nominal && onSave(form)}>
                    💾 Simpan Pengeluaran
                </button>
            </>
        }>
            <div className="form-group">
                <label>Keterangan *</label>
                <input className="form-control" value={form.keterangan} onChange={e => setForm(prev => ({ ...prev, keterangan: e.target.value }))} placeholder="contoh: Beli Kertas A4" autoFocus />
            </div>
            <div className="form-row">
                <div className="form-group">
                    <label>Nominal (Rp) *</label>
                    <input type="number" className="form-control mono" value={form.nominal} onChange={e => setForm(prev => ({ ...prev, nominal: e.target.value }))} placeholder="250000" />
                </div>
                <div className="form-group">
                    <label>Tanggal *</label>
                    <input type="date" className="form-control" value={form.tanggal} onChange={e => setForm(prev => ({ ...prev, tanggal: e.target.value }))} />
                </div>
            </div>
        </Modal>
    )
}
