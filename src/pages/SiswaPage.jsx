import { useState, useMemo, useCallback } from 'react'
import * as XLSX from 'xlsx'
import { useApp } from '../context/AppContext'
import EmptyState from '../components/EmptyState'
import { downloadFile } from '../utils/downloadHelper'
import { useDropzone } from 'react-dropzone'
import { Search, Plus, Upload, Download, Edit2, Trash2, Users, AlertTriangle, Eye } from 'lucide-react'
import { useCustomAlert } from '../hooks/useCustomAlert'

// Features
import SiswaForm from '../features/siswa/SiswaForm'
import SiswaProfile from '../features/siswa/SiswaProfile'
import ImportDropzoneModal from '../features/siswa/ImportDropzoneModal'

export default function SiswaPage() {
    const { students, addStudent, updateStudent, deleteStudent, units, formatRupiah, addToast } = useApp()
    const { confirmDelete } = useCustomAlert()
    const [search, setSearch] = useState('')
    const [filterKelas, setFilterKelas] = useState('')
    const [filterStatus, setFilterStatus] = useState('semua')
    const [showModal, setShowModal] = useState(false)
    const [editData, setEditData] = useState(null)
    const [viewData, setViewData] = useState(null)
    const [page, setPage] = useState(1)
    const PER_PAGE = 10

    const allKelas = units.flatMap(u => u.kelas)

    const filtered = (students || []).filter(s => {
        if (!s) return false;
        const matchSearch = String(s.nama || '').toLowerCase().includes((search || '').toLowerCase()) || String(s.nisn || '').includes(search || '')
        const matchKelas = !filterKelas || s.kelas === filterKelas
        const matchStatus = filterStatus === 'semua' || s.status === filterStatus
        return matchSearch && matchKelas && matchStatus
    })

    const totalPages = Math.ceil(filtered.length / PER_PAGE)
    const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE)

    const handleSave = (data) => {
        if (editData) {
            updateStudent(editData.id, data)
        } else {
            addStudent(data)
        }
        setShowModal(false)
        setEditData(null)
    }

    const handleEdit = (student) => {
        setEditData(student)
        setShowModal(true)
    }

    const handleDelete = async (student) => {
        const isConfirmed = await confirmDelete(
            `Hapus Siswa "${student.nama}"?`,
            "Data profil dan seluruh riwayat tagihan siswa ini akan dihapus secara permanen."
        )
        if (isConfirmed) {
            deleteStudent(student.id)
        }
    }

    const statusBadge = (status) => {
        const map = {
            aktif: { cls: 'badge-success', label: 'Aktif', dot: '🟢' },
            lulus: { cls: 'badge-info', label: 'Lulus', dot: '🔵' },
            pindah: { cls: 'badge-warning', label: 'Pindah', dot: '🟡' },
        }
        const st = map[status] || map.aktif
        return <span className={`badge ${st.cls}`}>{st.label}</span>
    }

    const [showImportModal, setShowImportModal] = useState(false)

    const doImportRows = useCallback((rows) => {
        let added = 0
        rows.forEach(row => {
            if (row.Nama && row.NISN) {
                addStudent({
                    nisn: String(row.NISN),
                    nama: row.Nama,
                    kelas: row.Kelas || allKelas[0]?.nama,
                    kelasId: allKelas.find(k => k.nama === String(row.Kelas))?.id || allKelas[0]?.id || 0,
                    jk: row.JK === 'P' ? 'P' : 'L',
                    status: 'aktif',
                    tempatLahir: row['Tempat Lahir'] || '',
                    tglLahir: row['Tgl Lahir'] || '',
                    telp: String(row.Telp || ''),
                    alamat: row.Alamat || '',
                    wali: row.Wali || ''
                })
                added++
            }
        })
        return added
    }, [addStudent, allKelas])

    const handleExportExcel = async () => {
        try {
            const sheetData = filtered.map((s, i) => ({
                No: i + 1,
                NISN: s.nisn,
                Nama: s.nama,
                Kelas: s.kelas,
                JK: s.jk,
                Status: s.status ? s.status.charAt(0).toUpperCase() + s.status.slice(1) : '-',
                'Tempat Lahir': s.tempatLahir,
                'Tgl Lahir': s.tglLahir,
                Wali: s.wali,
                Telp: s.telp,
                Alamat: s.alamat
            }))
            const ws = XLSX.utils.json_to_sheet(sheetData)
            // Set lebar kolom yang proporsional
            ws['!cols'] = [
                { wch: 5 },  // No
                { wch: 15 }, // NISN
                { wch: 25 }, // Nama
                { wch: 12 }, // Kelas
                { wch: 6 },  // JK
                { wch: 10 }, // Status
                { wch: 15 }, // Tempat Lahir
                { wch: 12 }, // Tgl Lahir
                { wch: 20 }, // Wali
                { wch: 15 }, // Telp
                { wch: 30 }, // Alamat
            ]
            const wb = XLSX.utils.book_new()
            XLSX.utils.book_append_sheet(wb, ws, 'Data Siswa')
            const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
            const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
            await downloadFile(blob, 'Data_Siswa_SIAS.xlsx')
            addToast('success', 'Export Berhasil', `${filtered.length} data siswa berhasil diekspor ke Excel`)
        } catch (err) {
            console.error('Export error:', err)
            addToast('danger', 'Export Gagal', 'Gagal melakukan export Excel.')
        }
    }

    if (viewData) {
        return <SiswaProfile data={viewData} onClose={() => setViewData(null)} />
    }

    return (
        <div className="fade-in">
            <div className="page-header">
                <h1>Data Siswa</h1>
                <div className="actions">
                    <button className="btn btn-ghost" onClick={() => setShowImportModal(true)}>
                        <Upload size={16} /> Import
                    </button>
                    <button className="btn btn-ghost" onClick={handleExportExcel}>
                        <Download size={16} /> Export
                    </button>
                    <button className="btn btn-primary" onClick={() => { setEditData(null); setShowModal(true) }}>
                        <Plus size={16} /> Tambah Siswa
                    </button>
                </div>
            </div>

            <div className="filter-bar">
                <div className="search-input">
                    <Search size={16} className="search-icon" />
                    <input
                        type="text"
                        className="form-control"
                        placeholder="Cari nama / NISN..."
                        value={search}
                        onChange={e => { setSearch(e.target.value); setPage(1) }}
                    />
                </div>
                <select className="form-control" value={filterKelas} onChange={e => { setFilterKelas(e.target.value); setPage(1) }}>
                    <option value="">Semua Kelas</option>
                    {allKelas.map(k => <option key={k.id} value={k.nama}>{k.nama}</option>)}
                </select>
                <select className="form-control" value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1) }}>
                    <option value="semua">Semua Status</option>
                    <option value="aktif">Aktif</option>
                    <option value="lulus">Lulus</option>
                    <option value="pindah">Pindah</option>
                </select>
            </div>

            {filtered.length === 0 ? (
                <EmptyState
                    icon={Users}
                    title="Belum Ada Data Siswa"
                    message="Data siswa belum tersedia. Mulai dengan menambahkan siswa baru atau import dari file Excel."
                    action={
                        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                            <Plus size={16} /> Tambah Siswa Pertama
                        </button>
                    }
                />
            ) : (
                <>
                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th style={{ width: 50 }}>#</th>
                                    <th>NISN</th>
                                    <th>Nama Lengkap</th>
                                    <th>Kelas</th>
                                    <th>J. Kel</th>
                                    <th>Status</th>
                                    <th style={{ width: 100 }}>Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginated.map((s, i) => (
                                    <tr key={s.id}>
                                        <td>{(page - 1) * PER_PAGE + i + 1}</td>
                                        <td className="mono">{s.nisn}</td>
                                        <td style={{ fontWeight: 500 }}>
                                            {s.nama}
                                        </td>
                                        <td>{s.kelas}</td>
                                        <td>{s.jk}</td>
                                        <td>{statusBadge(s.status)}</td>
                                        <td>
                                            <button className="btn-icon" onClick={() => setViewData(s)} title="Lihat Profil"><Eye size={16} /></button>
                                            <button className="btn-icon" onClick={() => handleEdit(s)} title="Edit"><Edit2 size={16} /></button>
                                            <button className="btn-icon danger" onClick={() => handleDelete(s)} title="Hapus"><Trash2 size={16} /></button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="pagination">
                        <span>Menampilkan {(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, filtered.length)} dari {filtered.length} siswa</span>
                        <div className="pagination-buttons">
                            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>◀</button>
                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                const p = Math.max(1, Math.min(page - 2, totalPages - 4)) + i
                                if (p > totalPages) return null
                                return <button key={p} className={page === p ? 'active' : ''} onClick={() => setPage(p)}>{p}</button>
                            })}
                            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>▶</button>
                        </div>
                    </div>
                </>
            )}

            {showModal && (
                <SiswaForm
                    data={editData}
                    allKelas={allKelas}
                    onSave={handleSave}
                    onClose={() => { setShowModal(false); setEditData(null) }}
                />
            )}

            {showImportModal && (
                <ImportDropzoneModal
                    onConfirm={(rows) => {
                        const added = doImportRows(rows)
                        if (added > 0) addToast('success', 'Import Berhasil', `${added} data siswa berhasil diimport dari Excel`)
                        else addToast('warning', 'Tidak Ada Data', 'Tidak ada baris valid. Pastikan kolom Nama dan NISN terisi.')
                        setShowImportModal(false)
                    }}
                    onClose={() => setShowImportModal(false)}
                />
            )}
        </div>
    )
}
