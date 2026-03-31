import { useState, useCallback } from 'react'
import { createPortal } from 'react-dom'
import * as XLSX from 'xlsx'
import { useDropzone } from 'react-dropzone'
import { Upload, CheckCircle, X, AlertTriangle, FileSpreadsheet, List, Download } from 'lucide-react'
import { downloadFile } from '../../utils/downloadHelper'

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

export default function ImportDropzoneModal({ onConfirm, onClose, isUploading }) {
    const [previewData, setPreviewData] = useState(null)
    const [fileName, setFileName] = useState('')
    const [parseError, setParseError] = useState('')
    const [selectedFile, setSelectedFile] = useState(null)

    const parseFile = useCallback((file) => {
        setParseError('')
        setPreviewData(null)
        setFileName(file.name)
        setSelectedFile(file)
        const reader = new FileReader()
        reader.onload = (evt) => {
            try {
                const data = new Uint8Array(evt.target.result)
                const workbook = XLSX.read(data, { type: 'array' })
                const worksheet = workbook.Sheets[workbook.SheetNames.includes('Data Siswa') ? 'Data Siswa' : workbook.SheetNames[0]]
                
                let headerRowIndex = 0;
                const a1Val = worksheet['A1'] ? worksheet['A1'].v : '';
                if (typeof a1Val === 'string' && a1Val.includes('APLIKASI SISTEM INFORMASI')) {
                    headerRowIndex = 2;
                }

                const jsonData = XLSX.utils.sheet_to_json(worksheet, { range: headerRowIndex })
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

    const downloadTemplate = async () => {
        try {
            const ExcelJS = (await import('exceljs')).default;
            const wb = new ExcelJS.Workbook();
            
            wb.creator = 'Admin SIAS';
            wb.created = new Date();

            // ==========================================
            // SHEET 1: PETUNJUK
            // ==========================================
            const wsPetunjuk = wb.addWorksheet('Petunjuk Pengisian', { properties: { tabColor: { argb: 'FFF59E0B' } } });
            wsPetunjuk.columns = [{ width: 4 }, { width: 4 }, { width: 70 }, { width: 30 }];
            
            // Background color for the whole sheet (optional, but let's just make the banner look good)
            wsPetunjuk.mergeCells('B2:D3');
            const titleCell = wsPetunjuk.getCell('B2');
            titleCell.value = '📚 PANDUAN PENGISIAN DATA IMPORT SISWA';
            titleCell.font = { size: 18, bold: true, color: { argb: 'FFFFFFFF' } };
            titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F172A' } }; // Slate 900
            titleCell.alignment = { vertical: 'middle', horizontal: 'center' };

            wsPetunjuk.mergeCells('B4:D4');
            const subTitle = wsPetunjuk.getCell('B4');
            subTitle.value = 'Harap membaca instruksi di bawah ini dengan saksama sebelum mengisi data pada Sheet "Data Siswa".';
            subTitle.font = { size: 11, italic: true, color: { argb: 'FF475569' } };
            subTitle.alignment = { vertical: 'middle', horizontal: 'center' };

            const instructions = [
                ['🔴', 'Kolom dengan Atap Merah Wajib Diisi', 'Nama & Rombel mutlak diperlukan oleh sistem.'],
                ['🏢', 'Penulisan Rombel / Kelas', 'Harus SAMA PERSIS dengan di sistem (cth: X DKV 1).'],
                ['📅', 'Format Tanggal Lahir', 'Direkomendasikan YYYY-MM-DD (cth: 2010-05-15).'],
                ['⚠️', 'Jangan Mengubah Struktur Header', 'Dilarang keras mengubah, menggeser, atau menghapus baris 1, 2, dan 3.'],
                ['🖱️', 'Dropdown Otomatis', 'Beberapa kolom seperti Jenis Kelamin dan Agama memiliki Dropdown.'],
                ['💼', 'Data Orang Tua', 'Bila tidak ada data ayah/ibu, boleh dikosongkan.']
            ];
            
            let rowIdx = 6;
            for (const [icon, title, desc] of instructions) {
                wsPetunjuk.getCell(`B${rowIdx}`).value = icon;
                wsPetunjuk.getCell(`B${rowIdx}`).font = { size: 14 };
                wsPetunjuk.getCell(`B${rowIdx}`).alignment = { horizontal: 'center', vertical: 'middle' };
                
                wsPetunjuk.getCell(`C${rowIdx}`).value = title;
                wsPetunjuk.getCell(`C${rowIdx}`).font = { size: 12, bold: true, color: { argb: 'FF1E293B' } };
                
                wsPetunjuk.getCell(`D${rowIdx}`).value = desc;
                wsPetunjuk.getCell(`D${rowIdx}`).font = { size: 11, color: { argb: 'FF64748B' } };
                
                // Add a subtle border below each instruction
                wsPetunjuk.getCell(`B${rowIdx}`).border = { bottom: { style: 'dotted', color: { argb: 'FFCBD5E1' } } };
                wsPetunjuk.getCell(`C${rowIdx}`).border = { bottom: { style: 'dotted', color: { argb: 'FFCBD5E1' } } };
                wsPetunjuk.getCell(`D${rowIdx}`).border = { bottom: { style: 'dotted', color: { argb: 'FFCBD5E1' } } };
                
                wsPetunjuk.getRow(rowIdx).height = 30;
                rowIdx++;
            }

            // ==========================================
            // SHEET 2: DATA SISWA
            // ==========================================
            const ws = wb.addWorksheet('Data Siswa', { 
                properties: { tabColor: { argb: 'FF10B981' } }, 
                views: [{ state: 'frozen', ySplit: 3, xSplit: 2 }] // Freeze top 3 rows & first 2 cols
            });
            
            const columns = [
                { key: 'no', width: 6 },            // A
                { key: 'nama', width: 28 },         // B
                { key: 'nis', width: 15 },          // C
                { key: 'rombel', width: 22 },       // D
                { key: 'jk', width: 16 },           // E
                { key: 'nisn', width: 20 },         // F
                { key: 'tmp_lahir', width: 20 },    // G
                { key: 'tgl_lahir', width: 16 },    // H
                { key: 'nik', width: 22 },          // I
                { key: 'agama', width: 16 },        // J
                { key: 'alamat', width: 40 },       // K
                { key: 'rt', width: 8 },            // L
                { key: 'rw', width: 8 },            // M
                { key: 'dusun', width: 22 },        // N
                { key: 'kelurahan', width: 22 },    // O
                { key: 'kecamatan', width: 22 },    // P
                { key: 'kodepos', width: 12 },      // Q
                { key: 'jnstinggal', width: 25 },   // R
                { key: 'ayah_nama', width: 28 },    // S
                { key: 'ayah_thn', width: 15 },     // T
                { key: 'ayah_pddk', width: 25 },    // U
                { key: 'ayah_pkj', width: 25 },     // V
                { key: 'ayah_hsl', width: 25 },     // W
                { key: 'ayah_nik', width: 22 },     // X
                { key: 'ibu_nama', width: 28 },     // Y
                { key: 'ibu_thn', width: 15 },      // Z
                { key: 'ibu_pddk', width: 25 },     // AA
                { key: 'ibu_pkj', width: 25 },      // AB
                { key: 'ibu_hsl', width: 25 },      // AC
                { key: 'ibu_nik', width: 22 }       // AD
            ];

            ws.columns = columns;

            // Row 1: Main App Banner
            ws.mergeCells('A1:AD1');
            const mainBanner = ws.getCell('A1');
            mainBanner.value = '📋 APLIKASI SISTEM INFORMASI AKADEMIK SEKOLAH - TEMPLATE IMPORT SISWA';
            mainBanner.font = { size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
            mainBanner.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F172A' } };
            mainBanner.alignment = { vertical: 'middle', horizontal: 'center' };
            ws.getRow(1).height = 40;

            // Row 2: Category Headers (Merged)
            ws.mergeCells('A2:D2'); // Akademik (Merah/Oranye) -> No, Nama, NIS, Rombel
            ws.mergeCells('E2:J2'); // Identitas (Biru) -> JK, NISN, Lahir, NIK, Agama
            ws.mergeCells('K2:R2'); // Alamat (Hijau) -> Alamat s.d Tinggal
            ws.mergeCells('S2:X2'); // Data Ayah (Ungu) -> Ayah
            ws.mergeCells('Y2:AD2'); // Data Ibu (Pink/Ungu Tua) -> Ibu

            const categoryStyle = (cellRef, title, colorHex) => {
                const cell = ws.getCell(cellRef);
                cell.value = title;
                cell.font = { size: 12, bold: true, color: { argb: 'FFFFFFFF' } };
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: colorHex } };
                cell.alignment = { vertical: 'middle', horizontal: 'center' };
                cell.border = { top: {style:'thick', color:{argb:'FFFFFFFF'}}, left: {style:'thick', color:{argb:'FFFFFFFF'}}, bottom: {style:'thick', color:{argb:'FFFFFFFF'}}, right: {style:'thick', color:{argb:'FFFFFFFF'}} };
            };

            categoryStyle('A2', 'INFORMASI AKADEMIK (WAJIB)', 'FFDC2626'); // Red 600
            categoryStyle('E2', 'DEMOGRAFI & IDENTITAS', 'FF2563EB');      // Blue 600
            categoryStyle('K2', 'INFORMASI DOMISILI / ALAMAT', 'FF059669'); // Emerald 600
            categoryStyle('S2', 'DATA AYAH', 'FF7C3AED');                   // Violet 600
            categoryStyle('Y2', 'DATA IBU', 'FFC026D3');                    // Fuchsia 600
            ws.getRow(2).height = 30;

            // Row 3: Actual Column Headers
            const headers = [
                'No', 'Nama', 'NIS', 'Rombel Saat Ini', 
                'Jenis Kelamin', 'NISN', 'Tempat Lahir', 'Tanggal Lahir', 'NIK', 'Agama',
                'Alamat', 'RT', 'RW', 'Dusun', 'Kelurahan', 'Kecamatan', 'Kode Pos', 'Jenis Tinggal',
                'Nama Ayah', 'Tahun Lahir Ayah', 'Jenjang Pendidikan Ayah', 'Pekerjaan Ayah', 'Penghasilan Ayah', 'NIK Ayah',
                'Nama Ibu', 'Tahun Lahir Ibu', 'Jenjang Pendidikan Ibu', 'Pekerjaan Ibu', 'Penghasilan Ibu', 'NIK Ibu'
            ];

            const headerRow = ws.getRow(3);
            headers.forEach((h, idx) => {
                const cell = headerRow.getCell(idx + 1);
                cell.value = h;
                cell.font = { size: 11, bold: true, color: { argb: 'FF1E293B' } }; // Slate 800
                
                // Lighter tint for the row 3 headers based on category
                if (idx <= 3) {
                    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEE2E2' } }; // Red 50
                } else if (idx >= 4 && idx <= 9) {
                    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDBEAFE' } }; // Blue 50
                } else if (idx >= 10 && idx <= 17) {
                    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD1FAE5' } }; // Emerald 50
                } else if (idx >= 18 && idx <= 23) {
                    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEDE9FE' } }; // Violet 50
                } else {
                    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFAE8FF' } }; // Fuchsia 50
                }
                
                cell.border = { top: {style:'thin'}, left: {style:'thin'}, bottom: {style:'thin'}, right: {style:'thin'} };
                cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
            });
            headerRow.height = 35;

            // Add Dummy Row Guidelines
            ws.addRow({
                no: 1, nama: 'Ahmad Fauzi (Hapus baris ini)', nis: '25001', rombel: 'X DKV 1', jk: 'Laki-Laki', nisn: '0012345678', tmp_lahir: 'Jakarta', tgl_lahir: '2010-05-15', nik: '3201234567890001', agama: 'Islam', alamat: 'Jl. Merdeka No. 123', rt: '01', rw: '02', dusun: 'Dusun Makmur', kelurahan: 'Sukasari', kecamatan: 'Bogor Timur', kodepos: '16142', jnstinggal: 'Bersama Orang Tua',
                ayah_nama: 'Bpk. Hendra', ayah_thn: '1975', ayah_pddk: 'S1', ayah_pkj: 'Wiraswasta', ayah_hsl: '2 Juta - 5 Juta', ayah_nik: '3201234567890002',
                ibu_nama: 'Ibu Siti', ibu_thn: '1980', ibu_pddk: 'SMA', ibu_pkj: 'Ibu Rumah Tangga', ibu_hsl: 'Kurang dari 1 Juta', ibu_nik: '3201234567890003'
            });
            ws.getRow(4).font = { italic: true, color: { argb: 'FF94A3B8' } }; // Dull gray for dummy

            // Data Validation (Dropdowns) loop for 100 rows
            for (let i = 4; i <= 104; i++) {
                ws.getCell(`E${i}`).dataValidation = { type: 'list', allowBlank: true, formulae: ['"Laki-Laki,Perempuan"'] };
                ws.getCell(`J${i}`).dataValidation = { type: 'list', allowBlank: true, formulae: ['"Islam,Kristen,Katolik,Hindu,Buddha,Konghucu,Lainnya"'] };
                ws.getCell(`R${i}`).dataValidation = { type: 'list', allowBlank: true, formulae: ['"Bersama Orang Tua,Wali,Kos,Asrama,Panti Asuhan,Lainnya"'] };
                
                // Thin borders for the data cells to look neat
                for (let c = 1; c <= 30; c++) {
                    ws.getCell(i, c).border = { top: {style:'hair'}, left: {style:'hair'}, bottom: {style:'hair'}, right: {style:'hair'}, color: {argb: 'FFE2E8F0'} };
                }
            }

            const buffer = await wb.xlsx.writeBuffer();
            const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            await downloadFile(blob, 'Template_Import_Siswa_Sangat_Indah.xlsx');
        } catch (err) {
            console.error('Template Download Error:', err);
            setParseError('Gagal mengunduh template terbaru.');
        }
    }

    const validRows = previewData?.filter(r => r.Nama) || []

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
                                <span className="badge bg-light text-dark px-3 py-2 rounded-pill me-2">Wajib: Nama, Kelas / ID Kelas</span>
                                <span className="badge bg-light text-muted px-3 py-2 rounded-pill me-2">NISN: Opsional</span>
                                <span className="badge bg-light text-muted px-3 py-2 rounded-pill">Format: .xlsx</span>
                            </div>

                            <button 
                                type="button" 
                                className="btn btn-outline-primary btn-sm mt-4 rounded-pill px-4 fw-bold"
                                onClick={(e) => { e.stopPropagation(); downloadTemplate() }}
                            >
                                <Download size={14} className="me-2" /> Unduh Format Import
                            </button>
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
                                            <th className="small fw-bold text-muted text-uppercase py-3">Rombel</th>
                                            <th className="small fw-bold text-muted text-uppercase py-3">Nama</th>
                                            <th className="small fw-bold text-muted text-uppercase py-3">NISN</th>
                                            <th className="small fw-bold text-muted text-uppercase py-3 pe-4">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-card">
                                        {previewData.slice(0, 10).map((row, i) => {
                                            const isValid = !!row.Nama
                                            return (
                                                <tr key={i} style={{ opacity: isValid ? 1 : 0.45 }}>
                                                    <td className="ps-4 py-3">{i + 1}</td>
                                                    <td className="py-3 fw-medium">{row['Rombel Saat Ini'] || '-'}</td>
                                                    <td className="py-3 fw-bold">{row.Nama || <em className="text-danger">Kosong</em>}</td>
                                                    <td className="py-3">{String(row.NISN || '-')}</td>
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
                        onClick={() => onConfirm(selectedFile)}
                        disabled={!selectedFile || validRows.length === 0 || isUploading}
                    >
                        {isUploading ? (
                            <><span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span> Mengirim...</>
                        ) : (
                            <><CheckCircle size={18} className="me-2" /> Konfirmasi Import ({validRows.length} Baris)</>
                        )}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    )
}
