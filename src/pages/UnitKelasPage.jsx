import { useState } from 'react'
import { useApp } from '../context/AppContext'
import Modal from '../components/Modal'
import { ChevronDown, ChevronRight, FolderOpen, Plus, Edit2, Trash2, Eye } from 'lucide-react'

export default function UnitKelasPage() {
    const { units, setUnits, addToast, tahunAjaran } = useApp()
    const [showModalUnit, setShowModalUnit] = useState(false)
    const [showModalKelas, setShowModalKelas] = useState(false)
    const [selectedUnit, setSelectedUnit] = useState(null)
    const [expanded, setExpanded] = useState(units.map(u => u.id))

    const toggleExpand = (id) => {
        setExpanded(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
    }

    const handleAddUnit = (nama) => {
        const newUnit = { id: Date.now(), nama, kelas: [] }
        setUnits(prev => [...prev, newUnit])
        addToast('success', 'Berhasil', `Unit "${nama}" berhasil ditambahkan`)
        setShowModalUnit(false)
    }

    const handleAddKelas = (nama) => {
        if (!selectedUnit) return
        setUnits(prev => prev.map(u => u.id === selectedUnit.id
            ? { ...u, kelas: [...u.kelas, { id: Date.now(), nama, siswaCount: 0 }] }
            : u
        ))
        addToast('success', 'Berhasil', `Kelas "${nama}" berhasil ditambahkan ke ${selectedUnit.nama}`)
        setShowModalKelas(false)
    }

    const handleDeleteUnit = (unit) => {
        if (confirm(`Hapus unit "${unit.nama}" beserta semua kelasnya?`)) {
            setUnits(prev => prev.filter(u => u.id !== unit.id))
            addToast('success', 'Berhasil', `Unit "${unit.nama}" berhasil dihapus`)
        }
    }

    return (
        <div className="fade-in">
            <div className="page-header">
                <div>
                    <h1>Unit & Kelas</h1>
                    <p style={{ color: 'var(--text-secondary)', marginTop: 4, fontSize: '0.85rem' }}>
                        Tahun Ajaran: <strong>{tahunAjaran}</strong>
                    </p>
                </div>
                <div className="actions">
                    <button className="btn btn-primary" onClick={() => setShowModalUnit(true)}>
                        <Plus size={16} /> Tambah Unit
                    </button>
                </div>
            </div>

            {units.map(unit => (
                <div key={unit.id} className="tree-item">
                    <div className="tree-header" onClick={() => toggleExpand(unit.id)}>
                        {expanded.includes(unit.id) ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                        <FolderOpen size={20} className="tree-icon" />
                        <span className="tree-name">{unit.nama}</span>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                            {unit.kelas.length} kelas
                        </span>
                        <button className="btn-icon" onClick={e => { e.stopPropagation() }} title="Edit"><Edit2 size={14} /></button>
                        <button className="btn-icon danger" onClick={e => { e.stopPropagation(); handleDeleteUnit(unit) }} title="Hapus"><Trash2 size={14} /></button>
                    </div>
                    {expanded.includes(unit.id) && (
                        <div className="tree-children">
                            {unit.kelas.map(kelas => (
                                <div key={kelas.id} className="tree-child">
                                    <span className="child-name">{kelas.nama}</span>
                                    <span className="child-count">{kelas.siswaCount} siswa</span>
                                    <button className="btn-icon" title="Edit"><Edit2 size={14} /></button>
                                    <button className="btn-icon danger" title="Hapus"><Trash2 size={14} /></button>
                                    <button className="btn-icon" title="Lihat Siswa"><Eye size={14} /></button>
                                </div>
                            ))}
                            <div style={{ padding: '8px 20px 8px 52px' }}>
                                <button className="btn btn-secondary" style={{ fontSize: '0.8rem' }}
                                    onClick={() => { setSelectedUnit(unit); setShowModalKelas(true) }}>
                                    <Plus size={14} /> Tambah Kelas
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            ))}

            {showModalUnit && (
                <SimpleFormModal title="Tambah Unit Baru" label="Nama Unit" placeholder="contoh: SMK, SMA" onSave={handleAddUnit} onClose={() => setShowModalUnit(false)} />
            )}

            {showModalKelas && (
                <SimpleFormModal title={`Tambah Kelas ke ${selectedUnit?.nama}`} label="Nama Kelas" placeholder="contoh: X IPA 1" onSave={handleAddKelas} onClose={() => setShowModalKelas(false)} />
            )}
        </div>
    )
}

function SimpleFormModal({ title, label, placeholder, onSave, onClose }) {
    const [value, setValue] = useState('')

    return (
        <Modal title={title} onClose={onClose} footer={
            <>
                <button className="btn btn-ghost" onClick={onClose}>Batal</button>
                <button className="btn btn-primary" onClick={() => value && onSave(value)}>💾 Simpan</button>
            </>
        }>
            <div className="form-group">
                <label>{label} *</label>
                <input className="form-control" value={value} onChange={e => setValue(e.target.value)} placeholder={placeholder} autoFocus />
            </div>
        </Modal>
    )
}
