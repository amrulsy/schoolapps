import { useState } from 'react'
import Modal from '../../components/Modal'
import { AlertCircle } from 'lucide-react'

export default function GenerateModal({ allKelas, categories, MONTHS, formatRupiah, onGenerate, onClose }) {
    const [selectedKelas, setSelectedKelas] = useState([])
    const [kategoriId, setKategoriId] = useState(categories[0]?.id || 0)
    const [fromMonth, setFromMonth] = useState(0)
    const [toMonth, setToMonth] = useState(5)

    const category = categories.find(c => c.id === Number(kategoriId))
    const selectedClasses = allKelas.filter(k => selectedKelas.includes(k.id))
    const totalSiswa = selectedClasses.reduce((s, k) => s + k.siswaCount, 0)
    const totalMonths = toMonth - fromMonth + 1
    const totalBills = totalSiswa * totalMonths
    const totalNominal = totalBills * (category?.nominal || 0)

    const toggleKelas = (id) => {
        setSelectedKelas(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
    }

    const handleGenerate = () => {
        onGenerate(selectedKelas, Number(kategoriId), fromMonth, toMonth)
        onClose()
    }

    return (
        <Modal title="⚡ Generate Tagihan Massal" size="lg" onClose={onClose} footer={
            <>
                <button className="btn btn-ghost" onClick={onClose}>Batal</button>
                <button className="btn btn-primary" onClick={handleGenerate} disabled={selectedKelas.length === 0}>
                    ⚡ Generate Sekarang
                </button>
            </>
        }>
            <div className="form-group">
                <label>Target Kelas *</label>
                <div style={{
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                    padding: 12,
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 8,
                }}>
                    {allKelas.map(k => (
                        <label key={k.id} className="checkbox-wrapper" style={{ minWidth: 120 }}>
                            <input type="checkbox" checked={selectedKelas.includes(k.id)} onChange={() => toggleKelas(k.id)} />
                            <span style={{ fontSize: '0.85rem' }}>{k.nama}</span>
                        </label>
                    ))}
                    <button
                        type="button"
                        className="btn btn-ghost"
                        style={{ fontSize: '0.75rem', padding: '4px 8px' }}
                        onClick={() => setSelectedKelas(selectedKelas.length === allKelas.length ? [] : allKelas.map(k => k.id))}
                    >
                        {selectedKelas.length === allKelas.length ? 'Hapus Semua' : 'Pilih Semua'}
                    </button>
                </div>
            </div>

            <div className="form-row">
                <div className="form-group">
                    <label>Kategori Tagihan *</label>
                    <select className="form-control" value={kategoriId} onChange={e => setKategoriId(e.target.value)}>
                        {categories.map(c => <option key={c.id} value={c.id}>{c.nama} — {formatRupiah(c.nominal)}</option>)}
                    </select>
                </div>
                <div className="form-group">
                    <label>Nominal</label>
                    <input className="form-control mono" value={category ? formatRupiah(category.nominal) : ''} readOnly />
                    <span className="form-hint">Auto-fill dari kategori</span>
                </div>
            </div>

            <div className="form-row">
                <div className="form-group">
                    <label>Dari Bulan *</label>
                    <select className="form-control" value={fromMonth} onChange={e => setFromMonth(Number(e.target.value))}>
                        {MONTHS.map((m, i) => <option key={i} value={i}>{m} 2026</option>)}
                    </select>
                </div>
                <div className="form-group">
                    <label>Sampai Bulan *</label>
                    <select className="form-control" value={toMonth} onChange={e => setToMonth(Number(e.target.value))}>
                        {MONTHS.map((m, i) => <option key={i} value={i}>{m} 2026</option>)}
                    </select>
                </div>
            </div>

            {selectedKelas.length > 0 && (
                <div className="preview-box">
                    <h4><AlertCircle size={16} /> PREVIEW</h4>
                    <ul>
                        <li>• {selectedClasses.length} Kelas × {totalSiswa} Siswa × {totalMonths} Bulan</li>
                        <li>• = <strong>{totalBills} tagihan</strong> akan digenerate</li>
                        <li>• Total nilai: <strong className="mono">{formatRupiah(totalNominal)}</strong></li>
                    </ul>
                </div>
            )}
        </Modal>
    )
}
