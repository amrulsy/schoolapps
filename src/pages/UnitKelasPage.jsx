import { useState, useEffect } from 'react'
import { useApp } from '../context/AppContext'
import { useCustomAlert } from '../hooks/useCustomAlert'
import Modal from '../components/Modal'
import { ChevronDown, ChevronRight, FolderOpen, Plus, Edit2, Trash2, Eye } from 'lucide-react'

export default function UnitKelasPage() {
    const { units, addUnit, updateUnit, deleteUnit, addKelas, updateKelas, deleteKelas, tahunAjaran, students } = useApp()
    const { confirmDelete, showError } = useCustomAlert()

    // Modal states
    const [showModalUnit, setShowModalUnit] = useState(false)
    const [showModalKelas, setShowModalKelas] = useState(false)
    const [editMode, setEditMode] = useState(false)

    const [selectedUnit, setSelectedUnit] = useState(null)
    const [selectedKelas, setSelectedKelas] = useState(null)
    const [showModalSiswa, setShowModalSiswa] = useState(false)
    const [viewingKelas, setViewingKelas] = useState(null)
    const [expanded, setExpanded] = useState([])

    const toggleExpand = (id) => {
        setExpanded(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
    }

    const handleSaveUnit = (nama) => {
        if (editMode && selectedUnit) {
            updateUnit(selectedUnit.id, nama)
        } else {
            addUnit(nama)
        }
        setShowModalUnit(false)
    }

    const handleSaveKelas = (nama) => {
        if (editMode && selectedKelas) {
            updateKelas(selectedUnit.id, selectedKelas.id, nama)
        } else if (selectedUnit) {
            addKelas(selectedUnit.id, nama)
        }
        setShowModalKelas(false)
    }

    const handleDeleteUnit = async (unit) => {
        if (unit.kelas.length > 0) {
            showError('Tidak dapat dihapus', 'Unit ini masih memiliki Kelas di dalamnya.')
            return
        }
        const isConfirmed = await confirmDelete(
            `Hapus Unit "${unit.nama}"?`,
            "Tindakan ini akan menghapus unit secara permanen."
        )
        if (isConfirmed) {
            deleteUnit(unit.id)
        }
    }

    const handleDeleteKelas = async (unit, kelas) => {
        if (kelas.siswaCount > 0) {
            showError('Tidak dapat dihapus', 'Kelas ini masih memiliki Siswa yang terdaftar.')
            return
        }
        const isConfirmed = await confirmDelete(
            `Hapus Kelas "${kelas.nama}"?`,
            "Tindakan ini akan menghapus kelas secara permanen."
        )
        if (isConfirmed) {
            deleteKelas(unit.id, kelas.id)
        }
    }

    const openTambahUnit = () => {
        setEditMode(false)
        setSelectedUnit(null)
        setShowModalUnit(true)
    }

    const openEditUnit = (unit) => {
        setEditMode(true)
        setSelectedUnit(unit)
        setShowModalUnit(true)
    }

    const openTambahKelas = (unit) => {
        setEditMode(false)
        setSelectedUnit(unit)
        setSelectedKelas(null)
        setShowModalKelas(true)
    }

    const openEditKelas = (unit, kelas) => {
        setEditMode(true)
        setSelectedUnit(unit)
        setSelectedKelas(kelas)
        setShowModalKelas(true)
    }

    const openLihatSiswa = (kelas) => {
        setViewingKelas(kelas)
        setShowModalSiswa(true)
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
                    <button className="btn btn-primary" onClick={openTambahUnit}>
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
                        <button className="btn-icon" onClick={e => { e.stopPropagation(); openEditUnit(unit) }} title="Edit"><Edit2 size={14} /></button>
                        <button className="btn-icon danger" onClick={e => { e.stopPropagation(); handleDeleteUnit(unit) }} title="Hapus"><Trash2 size={14} /></button>
                    </div>
                    {expanded.includes(unit.id) && (
                        <div className="tree-children">
                            {unit.kelas.map(kelas => (
                                <div key={kelas.id} className="tree-child">
                                    <span className="child-name">{kelas.nama}</span>
                                    <span className="child-count">{kelas.siswaCount} siswa</span>
                                    <button className="btn-icon" onClick={() => openEditKelas(unit, kelas)} title="Edit"><Edit2 size={14} /></button>
                                    <button className="btn-icon danger" onClick={() => handleDeleteKelas(unit, kelas)} title="Hapus"><Trash2 size={14} /></button>
                                    <button className="btn-icon" onClick={() => openLihatSiswa(kelas)} title="Lihat Siswa"><Eye size={14} /></button>
                                </div>
                            ))}
                            <div style={{ padding: '8px 20px 8px 52px' }}>
                                <button className="btn btn-secondary" style={{ fontSize: '0.8rem' }}
                                    onClick={() => openTambahKelas(unit)}>
                                    <Plus size={14} /> Tambah Kelas
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            ))}

            {showModalUnit && (
                <SimpleFormModal
                    title={editMode ? "Edit Unit" : "Tambah Unit Baru"}
                    label="Nama Unit"
                    initialValue={selectedUnit?.nama || ''}
                    placeholder="contoh: SMK, SMA"
                    onSave={handleSaveUnit}
                    onClose={() => setShowModalUnit(false)}
                />
            )}

            {showModalKelas && (
                <SimpleFormModal
                    title={editMode ? `Edit Kelas` : `Tambah Kelas ke ${selectedUnit?.nama}`}
                    label="Nama Kelas"
                    initialValue={selectedKelas?.nama || ''}
                    placeholder="contoh: X IPA 1"
                    onSave={handleSaveKelas}
                    onClose={() => setShowModalKelas(false)}
                />
            )}

            {showModalSiswa && viewingKelas && (
                <StudentListModal
                    kelas={viewingKelas}
                    students={students.filter(s => s.kelasId === viewingKelas.id)}
                    onClose={() => setShowModalSiswa(false)}
                />
            )}
        </div>
    )
}

function StudentListModal({ kelas, students, onClose }) {
    return (
        <Modal title={`Daftar Siswa: ${kelas.nama}`} onClose={onClose} footer={
            <button className="btn btn-primary" onClick={onClose}>Tutup</button>
        }>
            <div className="table-container" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                <table style={{ fontSize: '0.85rem' }}>
                    <thead>
                        <tr>
                            <th style={{ width: 50 }}>No</th>
                            <th>NISN</th>
                            <th>Nama Siswa</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {students.length === 0 ? (
                            <tr>
                                <td colSpan="4" style={{ textAlign: 'center', padding: '20px', color: 'var(--text-secondary)' }}>
                                    Tidak ada siswa di kelas ini.
                                </td>
                            </tr>
                        ) : (
                            students.map((s, i) => (
                                <tr key={s.id}>
                                    <td>{i + 1}</td>
                                    <td className="mono">{s.nisn}</td>
                                    <td style={{ fontWeight: 500 }}>{s.nama}</td>
                                    <td>
                                        <span className={`badge ${s.status === 'aktif' ? 'badge-success' : 'badge-warning'}`}>
                                            {s.status?.toUpperCase()}
                                        </span>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </Modal>
    )
}

function SimpleFormModal({ title, label, placeholder, initialValue = '', onSave, onClose }) {
    const [value, setValue] = useState(initialValue)

    useEffect(() => {
        setValue(initialValue)
    }, [initialValue])

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
