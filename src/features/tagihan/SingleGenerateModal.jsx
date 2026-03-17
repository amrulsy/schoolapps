import { useState, useEffect } from 'react'
import Modal from '../../components/Modal'
import { AlertCircle } from 'lucide-react'
import { useCustomAlert } from '../../hooks/useCustomAlert'

export default function SingleGenerateModal({ students, categories, MONTHS, formatRupiah, addToast, onGenerate, onClose, tahunAjaranList = [] }) {
    const { showError } = useCustomAlert()
    const activeTA = tahunAjaranList.find(ta => ta.status === 'aktif')
    const activeStudents = students.filter(s => s.status === 'aktif')
    const [siswaId, setSiswaId] = useState(activeStudents[0]?.id || '')
    const [kategoriId, setKategoriId] = useState(categories[0]?.id || 0)
    const currentMonthIdx = (new Date().getMonth() + 6) % 12
    const [fromMonth, setFromMonth] = useState(currentMonthIdx)
    const [toMonth, setToMonth] = useState(currentMonthIdx)
    const [selectedMonths, setSelectedMonths] = useState([currentMonthIdx])
    const [tahunAjaranId, setTahunAjaranId] = useState(activeTA?.id || '')

    const selectedTA = tahunAjaranList.find(ta => ta.id === Number(tahunAjaranId)) || activeTA
    const [y1, y2] = (selectedTA?.tahun || "2025/2026").split('/').map(Number)

    const [isCustom, setIsCustom] = useState(false)
    const [customName, setCustomName] = useState('')
    const [customNominal, setCustomNominal] = useState('')

    const category = categories.find(c => c.id === Number(kategoriId))
    const isBulanan = isCustom || category?.tipe === 'bulanan'
    const totalMonths = selectedMonths.length

    const finalNominal = isCustom ? Number(customNominal) : (category?.nominal || 0)
    const totalNominal = totalMonths * finalNominal

    // Effect to auto-suggest months based on category type
    useEffect(() => {
        if (isCustom || !category) return
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
    }, [kategoriId, isCustom])

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

    const handleGenerate = () => {
        if (!siswaId) return
        if (isCustom && (!customName || Number(customNominal) <= 0)) {
            showError('Validasi Gagal', 'Nama kategori kustom dan nominal harus diisi dengan benar.')
            return
        }
        if (selectedMonths.length === 0) {
            showError('Validasi Gagal', 'Pilih minimal satu bulan tagihan.')
            return
        }

        const inputKategori = isCustom ? customName : Number(kategoriId)
        const count = onGenerate(Number(siswaId), inputKategori, finalNominal, selectedMonths, Number(tahunAjaranId))
        if (count > 0) {
            addToast('success', 'Berhasil', `Berhasil membuat ${count} tagihan untuk siswa tersebut.`)
        } else {
            addToast('warning', 'Info', 'Tidak ada tagihan yang dibuat. Mungkin tagihan pada kategori dan periode tersebut sudah ada.')
        }
        onClose()
    }

    const getYearForMonth = (mIdx) => {
        return mIdx <= 5 ? y1 : y2
    }

    return (
        <Modal title="📄 Buat Tagihan Tunggal" size="md" onClose={onClose} footer={
            <>
                <button className="btn btn-ghost" onClick={onClose}>Batal</button>
                <button className="btn btn-primary" onClick={handleGenerate} disabled={!siswaId || !tahunAjaranId || selectedMonths.length === 0}>
                    Buat Tagihan
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
                <label>Pilih Siswa *</label>
                <select className="form-control" value={siswaId} onChange={e => setSiswaId(e.target.value)}>
                    <option value="">-- Pilih Siswa --</option>
                    {activeStudents.map(s => <option key={s.id} value={s.id}>{s.nama} ({s.kelas})</option>)}
                </select>
                <span className="form-hint">Hanya siswa dengan status aktif yang ditampilkan</span>
            </div>

            <div className="form-row">
                <div className="form-group">
                    <label>Kategori Tagihan *</label>
                    <select className="form-control" value={isCustom ? 'custom' : kategoriId} onChange={e => {
                        const val = e.target.value
                        if (val === 'custom') {
                            setIsCustom(true)
                        } else {
                            setIsCustom(false)
                            setKategoriId(val)
                        }
                    }}>
                        {categories.map(c => <option key={c.id} value={c.id}>[{c.kode}] {c.nama} — {formatRupiah(c.nominal)}</option>)}
                        <option value="custom">+ Input Kustom</option>
                    </select>
                </div>
                <div className="form-group">
                    <label>Tipe / Nominal</label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        {!isCustom && <span className="badge badge-secondary" style={{ padding: '8px 12px', height: '100%', textTransform: 'capitalize' }}>{category?.tipe}</span>}
                        <input
                            type={isCustom ? 'number' : 'text'}
                            className="form-control mono"
                            value={isCustom ? customNominal : (category ? formatRupiah(category.nominal) : '')}
                            onChange={e => isCustom && setCustomNominal(e.target.value)}
                            readOnly={!isCustom}
                            placeholder={isCustom ? 'Misal: 150000' : ''}
                        />
                    </div>
                </div>
            </div>

            {isCustom && (
                <div className="form-group">
                    <label>Nama Tagihan Kustom *</label>
                    <input
                        type="text"
                        className="form-control"
                        value={customName}
                        onChange={e => setCustomName(e.target.value)}
                        placeholder="Misal: Denda Keterlambatan, Studi Tour..."
                    />
                </div>
            )}

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

            {siswaId && (
                <div className="preview-box">
                    <h4><AlertCircle size={16} /> PREVIEW</h4>
                    <ul>
                        <li>• Membuat manual tagihan untuk 1 siswa.</li>
                        <li>• Periode: <strong>{selectedTA?.tahun}</strong></li>
                        <li>• Total bulan dicover: {totalMonths} Bulan</li>
                        <li>• Total nilai kewajiban: <strong className="mono">{formatRupiah(totalNominal)}</strong></li>
                    </ul>
                </div>
            )}
        </Modal>
    )
}
