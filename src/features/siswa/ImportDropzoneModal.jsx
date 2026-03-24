import { useState, useCallback } from 'react'
import { createPortal } from 'react-dom'
import * as XLSX from 'xlsx'
import { useDropzone } from 'react-dropzone'
import { Upload, CheckCircle, X, AlertTriangle, FileSpreadsheet, List } from 'lucide-react'

const styles = /*css*/`
  .import-modal-overlay {
    position: fixed; top: 0; left: 0; width: 100%; height: 100%;
    background: rgba(15, 23, 42, 0.7);
    backdrop-filter: blur(12px); z-index: 9999;
    display: flex; align-items: center; justify-content: center; padding: 20px;
    animation: fade-in 0.3s ease;
  }
  .import-modal-container {
    background: var(--bg-card); width: 100%; max-width: 800px;
    max-height: 90vh; border-radius: 28px;
    display: flex; flex-direction: column; overflow: hidden;
    box-shadow: 0 40px 80px -20px rgba(0,0,0,0.3);
    border: 1px solid var(--border-color);
    animation: fade-scale-in 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  }
  .import-modal-header {
    padding: 24px 28px; background: var(--bg-card);
    border-bottom: 1px solid var(--border-color); display: flex;
    justify-content: space-between; align-items: center;
  }
  .header-content { display: flex; align-items: center; gap: 16px; }
  .header-icon { 
    width: 48px; height: 48px; border-radius: 14px;
    background: var(--primary-100); color: var(--primary-600);
    display: flex; align-items: center; justify-content: center;
  }
  .header-text h2 { margin: 0; font-size: 1.25rem; font-weight: 800; color: var(--text-primary); letter-spacing: -0.5px; }
  .header-text p { margin: 2px 0 0; font-size: 0.8125rem; color: var(--text-secondary); fw-bold; }

  .btn-close-circle {
    width: 36px; height: 36px; border-radius: 50%; border: none;
    background: var(--bg-stripe); color: var(--text-secondary); font-size: 20px;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; transition: all 0.2s;
  }
  .btn-close-circle:hover { background: var(--danger-100); color: var(--danger-600); transform: rotate(90deg); }

  .import-modal-body {
    flex: 1; overflow-y: auto; padding: 28px; background: var(--bg-stripe);
  }
  
  .premium-dropzone {
    border: 2px dashed var(--border-color);
    border-radius: 20px;
    padding: 48px 32px;
    text-align: center;
    cursor: pointer;
    background: var(--bg-card);
    transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    position: relative;
    overflow: hidden;
  }
  .premium-dropzone.active {
    border-color: var(--primary-500);
    background: var(--primary-50);
    transform: scale(1.02);
  }
  .premium-dropzone:hover {
    border-color: var(--primary-400);
    background: var(--bg-stripe);
    box-shadow: var(--shadow-md);
  }

  .preview-card {
    background: var(--bg-card); padding: 20px; border-radius: 20px;
    border: 1px solid var(--border-color); box-shadow: var(--shadow-sm);
    margin-top: 24px;
  }
  .preview-header { display: flex; align-items: center; gap: 10px; margin-bottom: 20px; }
  .preview-header h3 { margin: 0; font-size: 0.75rem; font-weight: 800; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.1em; }

  .import-modal-footer {
    padding: 20px 28px; background: var(--bg-card); border-top: 1px solid var(--border-color);
    display: flex; justify-content: flex-end; gap: 12px;
  }
  .btn-glass-secondary {
    padding: 12px 24px; border-radius: 14px; border: 1px solid var(--border-color);
    background: transparent; color: var(--text-secondary); font-weight: 700; cursor: pointer; transition: all 0.2s;
  }
  .btn-glass-secondary:hover { background: var(--bg-stripe); color: var(--text-primary); }

  .btn-modern-primary {
    padding: 12px 28px; border-radius: 14px; border: none;
    background: var(--primary-600); color: #fff; font-weight: 700;
    display: flex; align-items: center; gap: 10px; cursor: pointer;
    transition: all 0.2s; box-shadow: 0 4px 12px rgba(37, 99, 235, 0.2);
  }
  .btn-modern-primary:hover { background: var(--primary-700); transform: translateY(-1px); box-shadow: 0 6px 16px rgba(37, 99, 235, 0.3); }
  .btn-modern-primary:disabled { background: var(--text-muted); cursor: not-allowed; transform: none; box-shadow: none; }

  @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
  @keyframes fade-scale-in {
    from { opacity: 0; transform: scale(0.95) translateY(10px); }
    to { opacity: 1; transform: scale(1) translateY(0); }
  }
`;

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

    return createPortal(
        <div className="import-modal-overlay">
            <style dangerouslySetInnerHTML={{ __html: styles }} />
            <div className="import-modal-container">
                <div className="import-modal-header">
                    <div className="header-content">
                        <div className="header-icon">
                            <FileSpreadsheet size={24} />
                        </div>
                        <div className="header-text">
                            <h2>Import Data Siswa</h2>
                            <p>Unggah file Excel untuk mendaftarkan banyak siswa sekaligus</p>
                        </div>
                    </div>
                    <button className="btn-close-circle" onClick={onClose}><X size={20} /></button>
                </div>

                <div className="import-modal-body">
                    {/* Zone Drag-and-Drop */}
                    {!previewData && (
                        <div {...getRootProps()} className={`premium-dropzone ${isDragActive ? 'active' : ''}`}>
                            <input {...getInputProps()} />
                            <div className="mb-3 d-inline-flex p-4 rounded-circle bg-soft-primary" style={{ background: 'var(--primary-100)', color: 'var(--primary-600)' }}>
                                <Upload size={36} />
                            </div>
                            {isDragActive
                                ? <h4 className="fw-bold text-primary mt-3">Lepaskan file di sini...</h4>
                                : <h4 className="fw-bold mt-3">Drag & drop file <span className="text-primary">Excel</span> ke sini</h4>
                            }
                            <p className="text-secondary mt-2">Atau klik untuk memilih file dari komputer Anda</p>

                            <div className="mt-4 pt-3 border-top border-dashed" style={{ borderColor: 'var(--border-color)', fontSize: '0.85rem' }}>
                                <span className="badge bg-light text-dark px-3 py-2 rounded-pill me-2">Wajib: NISN, Nama, Kelas</span>
                                <span className="badge bg-light text-muted px-3 py-2 rounded-pill">Format: .xlsx</span>
                            </div>
                        </div>
                    )}

                    {parseError && (
                        <div className="alert alert-danger mt-4 d-flex align-items-center gap-3 border-0 py-3 rounded-4 shadow-sm">
                            <AlertTriangle size={20} /> <span className="fw-bold">{parseError}</span>
                        </div>
                    )}

                    {/* Preview Tabel Data */}
                    {previewData && previewData.length > 0 && (
                        <div className="preview-card">
                            <div className="preview-header">
                                <List size={16} />
                                <h3>Preview Data: <span className="text-primary">{fileName}</span></h3>
                                <button className="btn btn-sm btn-link ms-auto text-danger text-decoration-none" onClick={() => { setPreviewData(null); setFileName(''); setParseError(''); }}>
                                    <X size={14} className="me-1" /> Ganti File
                                </button>
                            </div>

                            <div className="table-responsive rounded-4 border overflow-hidden" style={{ maxHeight: 300 }}>
                                <table className="table table-hover mb-0">
                                    <thead style={{ background: 'var(--bg-stripe)' }}>
                                        <tr>
                                            <th className="small fw-bold text-muted text-uppercase py-3 ps-4">#</th>
                                            <th className="small fw-bold text-muted text-uppercase py-3">NISN</th>
                                            <th className="small fw-bold text-muted text-uppercase py-3">Nama</th>
                                            <th className="small fw-bold text-muted text-uppercase py-3 pe-4">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-card">
                                        {previewData.slice(0, 10).map((row, i) => {
                                            const isValid = row.Nama && row.NISN
                                            return (
                                                <tr key={i} style={{ opacity: isValid ? 1 : 0.45 }}>
                                                    <td className="ps-4 py-3">{i + 1}</td>
                                                    <td className="py-3 fw-medium">{String(row.NISN || '-')}</td>
                                                    <td className="py-3 fw-bold">{row.Nama || <em className="text-danger">Kosong</em>}</td>
                                                    <td className="pe-4 py-3">
                                                        {isValid
                                                            ? <span className="badge bg-success-soft text-success px-3 py-2 rounded-3 border-0">Valid</span>
                                                            : <span className="badge bg-danger-soft text-danger px-3 py-2 rounded-3 border-0">Dilewati</span>
                                                        }
                                                    </td>
                                                </tr>
                                            )
                                        })}
                                        {previewData.length > 10 && (
                                            <tr><td colSpan={4} className="text-center py-4 text-muted italic small bg-stripe">...dan {previewData.length - 10} baris lainnya</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>

                <div className="import-modal-footer">
                    <button type="button" className="btn-glass-secondary" onClick={onClose}>
                        Batal
                    </button>
                    <button
                        className="btn-modern-primary"
                        onClick={() => onConfirm(previewData || [])}
                        disabled={!previewData || validRows.length === 0}
                    >
                        <CheckCircle size={18} className="me-2" /> Konfirmasi Import ({validRows.length} Baris)
                    </button>
                </div>
            </div>
        </div>,
        document.body
    )
}
