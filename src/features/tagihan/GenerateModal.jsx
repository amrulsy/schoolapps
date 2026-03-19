import { useState, useEffect } from 'react'
import Modal from '../../components/Modal'
import { AlertCircle } from 'lucide-react'

export default function GenerateModal({ allKelas, categories, MONTHS, formatRupiah, onGenerate, onClose, tahunAjaranList = [] }) {
    const activeTA = tahunAjaranList.find(ta => ta.status === 'aktif')
    const [selectedKelas, setSelectedKelas] = useState([])
    const [kategoriId, setKategoriId] = useState(categories[0]?.id || 0)
    const currentMonthIdx = (new Date().getMonth() + 6) % 12
    const [selectedMonths, setSelectedMonths] = useState([currentMonthIdx])
    const [fromMonth, setFromMonth] = useState(currentMonthIdx)
    const [toMonth, setToMonth] = useState(currentMonthIdx)
    const [tahunAjaranId, setTahunAjaranId] = useState(activeTA?.id || '')

    const selectedTA = tahunAjaranList.find(ta => ta.id === Number(tahunAjaranId)) || activeTA
    const [y1, y2] = (selectedTA?.tahun || "2025/2026").split('/').map(Number)

    const category = categories.find(c => c.id === Number(kategoriId))
    const isBulanan = category?.tipe === 'bulanan'

    const selectedClasses = allKelas.filter(k => selectedKelas.includes(k.id))
    const totalSiswa = selectedClasses.reduce((s, k) => s + k.siswaCount, 0)
    const totalMonths = selectedMonths.length
    const totalBills = totalSiswa * totalMonths
    const totalNominal = totalBills * (category?.nominal || 0)

    // Effect to auto-suggest months based on category type
    useEffect(() => {
        if (!category) return
        if (category.tipe === 'bulanan') {
            setSelectedMonths([currentMonthIdx])
            setFromMonth(currentMonthIdx)
            setToMonth(currentMonthIdx)
        } else if (category.tipe === '3bulanan') {
            setSelectedMonths([0, 3, 6, 9]) // Juli, Okt, Jan, Apr
        } else if (category.tipe === 'semesteran') {
            setSelectedMonths([0, 6]) // Juli, Jan
        } else if (category.tipe === 'tahunan') {
            setSelectedMonths([0]) // Juli
        }
    }, [kategoriId])

    // Sync from/to for bulanan
    useEffect(() => {
        if (isBulanan) {
            const start = Math.min(fromMonth, toMonth)
            const end = Math.max(fromMonth, toMonth)
            const range = []
            for (let i = start; i <= end; i++) range.push(i)
            setSelectedMonths(range)
        }
    }, [fromMonth, toMonth, isBulanan])

    const toggleMonth = (idx) => {
        setSelectedMonths(prev => prev.includes(idx) ? prev.filter(m => m !== idx) : [...prev, idx])
    }

    const toggleKelas = (id) => {
        setSelectedKelas(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
    }

    const handleGenerate = async () => {
        await onGenerate(selectedKelas, Number(kategoriId), selectedMonths, Number(tahunAjaranId))
        onClose()
    }

    const getYearForMonth = (mIdx) => {
        return mIdx <= 5 ? y1 : y2
    }

    return (
        <Modal title="⚡ Generate Tagihan Massal" size="lg" onClose={onClose} footer={
            <>
                <button className="btn btn-ghost" onClick={onClose}>Batal</button>
                <button className="btn btn-primary" onClick={handleGenerate} disabled={selectedKelas.length === 0 || !tahunAjaranId || selectedMonths.length === 0}>
                    ⚡ Generate Sekarang
                </button>
            </>
        }>
            <div className="form-group">
                <label>Tahun Pelajaran *</label>
                <select className="form-control" value={tahunAjaranId} onChange={e => setTahunAjaranId(e.target.value)}>
                    <option value="">-- Pilih Tahun Pelajaran --</option>
                    {tahunAjaranList.map(ta => (
                        <option key={ta.id} value={ta.id}>{ta.tahun} {ta.status === 'aktif' ? '(Aktif)' : ''}</option>
                    ))}
                </select>
            </div>

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
                        {categories.map(c => <option key={c.id} value={c.id}>[{c.kode}] {c.nama} — {formatRupiah(c.nominal)}</option>)}
                    </select>
                </div>
                <div className="form-group">
                    <label>Tipe / Nominal</label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <span className="badge badge-secondary" style={{ padding: '8px 12px', height: '100%', textTransform: 'capitalize' }}>{category?.tipe}</span>
                        <input className="form-control mono" value={category ? formatRupiah(category.nominal) : ''} readOnly />
                    </div>
                </div>
            </div>

            {isBulanan ? (
                <div className="form-row">
                    <div className="form-group">
                        <label>Dari Bulan *</label>
                        <select className="form-control" value={fromMonth} onChange={e => setFromMonth(Number(e.target.value))}>
                            {MONTHS.map((m, i) => <option key={i} value={i}>{m} {getYearForMonth(i)}</option>)}
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Sampai Bulan *</label>
                        <select className="form-control" value={toMonth} onChange={e => setToMonth(Number(e.target.value))}>
                            {MONTHS.map((m, i) => <option key={i} value={i}>{m} {getYearForMonth(i)}</option>)}
                        </select>
                    </div>
                </div>
            ) : (
                <div className="form-group">
                    <label>Pilih Bulan Tagihan (Generate di bulan apa saja?) *</label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', padding: '12px', background: 'var(--bg-light)', borderRadius: '8px' }}>
                        {MONTHS.map((m, i) => (
                            <label key={i} className="checkbox-wrapper" style={{ fontSize: '0.85rem' }}>
                                <input type="checkbox" checked={selectedMonths.includes(i)} onChange={() => toggleMonth(i)} />
                                {m}
                            </label>
                        ))}
                    </div>
                    <span className="form-hint">Sesuai standar sekolah untuk kategori {category?.tipe}. Anda tetap bisa menyesuaikannya.</span>
                </div>
            )}

            {selectedKelas.length > 0 && (
                <div className="preview-box">
                    <h4><AlertCircle size={16} /> PREVIEW</h4>
                    <ul>
                        <li>• {selectedClasses.length} Kelas × {totalSiswa} Siswa × {totalMonths} Bulan</li>
                        <li>• Periode: <strong>{selectedTA?.tahun}</strong></li>
                        <li>• = <strong>{totalBills} tagihan</strong> akan digenerate</li>
                        <li>• Total nilai: <strong className="mono">{formatRupiah(totalNominal)}</strong></li>
                    </ul>
                </div>
            )}
        </Modal>
    )
}
