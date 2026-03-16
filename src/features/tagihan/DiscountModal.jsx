import { useState } from 'react'
import Modal from '../../components/Modal'

export default function DiscountModal({ count, onClose, onApply }) {
    const [type, setType] = useState('Persentase')
    const [value, setValue] = useState('')

    const handleApply = () => {
        const val = Number(value)
        if (val > 0) {
            onApply(type, val)
        }
    }

    return (
        <Modal title="🏷️ Pilihan Diskon" size="sm" onClose={onClose} footer={
            <>
                <button className="btn btn-ghost" onClick={onClose}>Batal</button>
                <button className="btn btn-primary" onClick={handleApply} disabled={!value || Number(value) <= 0}>
                    Terapkan Diskon
                </button>
            </>
        }>
            <div className="form-group">
                <p style={{ margin: '0 0 16px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                    Akan menerapkan potongan harga pada <strong>{count}</strong> tagihan terpilih.
                </p>
            </div>
            <div className="form-group">
                <label>Tipe Potongan</label>
                <select className="form-control" value={type} onChange={e => setType(e.target.value)}>
                    <option value="Persentase">Persentase (%)</option>
                    <option value="Nominal">Nominal (Rp)</option>
                </select>
            </div>
            <div className="form-group">
                <label>Nilai Potongan</label>
                <input
                    type="number"
                    className="form-control"
                    value={value}
                    onChange={e => setValue(e.target.value)}
                    placeholder={type === 'Persentase' ? '50' : '50000'}
                />
            </div>
        </Modal>
    )
}
