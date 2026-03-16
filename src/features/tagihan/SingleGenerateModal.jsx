import { useState } from 'react'
import Modal from '../../components/Modal'
import { AlertCircle } from 'lucide-react'

export default function SingleGenerateModal({ students, categories, MONTHS, formatRupiah, addToast, onGenerate, onClose }) {
    const activeStudents = students.filter(s => s.status === 'aktif')
    const [siswaId, setSiswaId] = useState(activeStudents[0]?.id || '')
    const [kategoriId, setKategoriId] = useState(categories[0]?.id || 0)
    const [fromMonth, setFromMonth] = useState(0)
    const [toMonth, setToMonth] = useState(0)

    const [isCustom, setIsCustom] = useState(false)
    const [customName, setCustomName] = useState('')
    const [customNominal, setCustomNominal] = useState('')

    const category = categories.find(c => c.id === Number(kategoriId))
    const totalMonths = toMonth - fromMonth + 1

    const finalNominal = isCustom ? Number(customNominal) : (category?.nominal || 0)
    const totalNominal = totalMonths * finalNominal

    const handleGenerate = () => {
        if (!siswaId) return
        if (isCustom && (!customName || Number(customNominal) <= 0)) {
            addToast('warning', 'Validasi Gagal', 'Nama kategori kustom dan nominal harus diisi dengan benar.')
            return
        }

        const inputKategori = isCustom ? customName : Number(kategoriId)
        const count = onGenerate(Number(siswaId), inputKategori, finalNominal, fromMonth, toMonth)
        if (count > 0) {
            addToast('success', 'Berhasil', `Berhasil membuat ${count} tagihan untuk siswa tersebut.`)
        } else {
            addToast('warning', 'Info', 'Tidak ada tagihan yang dibuat. Mungkin tagihan pada kategori dan periode tersebut sudah ada.')
        }
        onClose()
    }

    return (
        <Modal title="📄 Buat Tagihan Tunggal" size="md" onClose={onClose} footer={
            <>
                <button className="btn btn-ghost" onClick={onClose}>Batal</button>
                <button className="btn btn-primary" onClick={handleGenerate} disabled={!siswaId}>
                    Buat Tagihan
                </button>
            </>
        }>
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
                    <label>Nominal</label>
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

            {siswaId && (
                <div className="preview-box">
                    <h4><AlertCircle size={16} /> PREVIEW</h4>
                    <ul>
                        <li>• Membuat manual tagihan untuk 1 siswa.</li>
                        <li>• Total bulan dicover: {totalMonths} Bulan</li>
                        <li>• Total nilai kewajiban: <strong className="mono">{formatRupiah(totalNominal)}</strong></li>
                    </ul>
                </div>
            )}
        </Modal>
    )
}
