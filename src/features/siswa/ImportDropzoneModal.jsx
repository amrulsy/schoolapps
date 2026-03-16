import { useState, useCallback } from 'react'
import * as XLSX from 'xlsx'
import { useDropzone } from 'react-dropzone'
import { Upload, CheckCircle, X, AlertTriangle } from 'lucide-react'
import Modal from '../../components/Modal'

/**
 * ImportDropzoneModal — Modal drag-and-drop Import Excel menggunakan react-dropzone + xlsx
 */
export default function ImportDropzoneModal({ onConfirm, onClose }) {
    const [previewData, setPreviewData] = useState(null)
    const [fileName, setFileName] = useState('')
    const [parseError, setParseError] = useState('')

    const parseFile = useCallback((file) => {
        setParseError('')
        setPreviewData(null)
        setFileName(file.name)
        const reader = new FileReader()
        reader.onload = (evt) => {
            try {
                const data = new Uint8Array(evt.target.result)
                const workbook = XLSX.read(data, { type: 'array' })
                const worksheet = workbook.Sheets[workbook.SheetNames[0]]
                const jsonData = XLSX.utils.sheet_to_json(worksheet)
                if (jsonData.length === 0) {
                    setParseError('File kosong atau tidak ada data yang dapat dibaca.')
                    return
                }
                setPreviewData(jsonData)
            } catch (err) {
                console.error('Parse error:', err)
                setParseError('Gagal membaca file. Pastikan file berformat .xlsx atau .xls yang valid.')
            }
        }
        reader.readAsArrayBuffer(file)
    }, [])

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        accept: { 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'], 'application/vnd.ms-excel': ['.xls'] },
        multiple: false,
        onDrop: (accepted) => {
            if (accepted[0]) parseFile(accepted[0])
        },
    })

    const validRows = previewData?.filter(r => r.Nama && r.NISN) || []

    return (
        <Modal title="📥 Import Data Siswa" size="lg" onClose={onClose} footer={
            <>
                <button className="btn btn-ghost" onClick={onClose}>Batal</button>
                <button
                    className="btn btn-primary"
                    onClick={() => onConfirm(previewData || [])}
                    disabled={!previewData || validRows.length === 0}
                >
                    <CheckCircle size={16} /> Konfirmasi Import ({validRows.length} baris valid)
                </button>
            </>
        }>
            {/* Zone Drag-and-Drop */}
            <div
                {...getRootProps()}
                style={{
                    border: `2px dashed ${isDragActive ? 'var(--primary-500)' : 'var(--border-color)'}`,
                    borderRadius: 12,
                    padding: '32px 24px',
                    textAlign: 'center',
                    cursor: 'pointer',
                    background: isDragActive ? 'rgba(var(--primary-500-rgb, 99,102,241),0.05)' : 'var(--bg-secondary)',
                    transition: 'all 0.2s',
                    marginBottom: 16,
                }}
            >
                <input {...getInputProps()} />
                <Upload size={36} style={{ color: 'var(--text-secondary)', marginBottom: 8 }} />
                {isDragActive
                    ? <p style={{ color: 'var(--primary-500)', fontWeight: 600 }}>Lepaskan file di sini...</p>
                    : <p>Drag & drop file <strong>.xlsx</strong> ke sini, atau <span style={{ color: 'var(--primary-500)', textDecoration: 'underline' }}>klik untuk pilih file</span></p>
                }
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: 4 }}>
                    Kolom wajib: <code>NISN</code>, <code>Nama</code>, <code>Kelas</code>, <code>JK</code> (L/P)<br />
                    Kolom opsional: <code>Tempat Lahir</code>, <code>Tgl Lahir</code>, <code>Wali</code>, <code>Telp</code>, <code>Alamat</code>
                </p>
            </div>

            {parseError && (
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '10px 14px', borderRadius: 8, background: 'var(--danger-50)', color: 'var(--danger-600)', marginBottom: 12 }}>
                    <AlertTriangle size={16} /> {parseError}
                </div>
            )}

            {/* Preview Tabel Data */}
            {previewData && previewData.length > 0 && (
                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <p style={{ fontWeight: 600 }}>
                            Preview: <code>{fileName}</code> — {previewData.length} baris ditemukan
                            <span style={{ marginLeft: 8, color: validRows.length === previewData.length ? 'var(--success-600)' : 'var(--warning-600)' }}>
                                ({validRows.length} valid, {previewData.length - validRows.length} dilewati)
                            </span>
                        </p>
                        <button className="btn-icon" title="Ganti file" onClick={() => { setPreviewData(null); setFileName('') }}>
                            <X size={16} />
                        </button>
                    </div>
                    <div className="table-container" style={{ maxHeight: 240, overflowY: 'auto' }}>
                        <table>
                            <thead>
                                <tr>
                                    <th style={{ width: 30 }}>#</th>
                                    <th>NISN</th>
                                    <th>Nama</th>
                                    <th>Kelas</th>
                                    <th>JK</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {previewData.slice(0, 10).map((row, i) => {
                                    const isValid = row.Nama && row.NISN
                                    return (
                                        <tr key={i} style={{ opacity: isValid ? 1 : 0.45 }}>
                                            <td>{i + 1}</td>
                                            <td className="mono">{String(row.NISN || '-')}</td>
                                            <td>{row.Nama || <em style={{ color: 'var(--danger-500)' }}>Kosong</em>}</td>
                                            <td>{row.Kelas || '-'}</td>
                                            <td>{row.JK || '-'}</td>
                                            <td>
                                                {isValid
                                                    ? <span className="badge badge-success">✓ Valid</span>
                                                    : <span className="badge badge-danger">✗ Dilewati</span>
                                                }
                                            </td>
                                        </tr>
                                    )
                                })}
                                {previewData.length > 10 && (
                                    <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-secondary)', fontStyle: 'italic' }}>...dan {previewData.length - 10} baris lainnya</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </Modal>
    )
}
