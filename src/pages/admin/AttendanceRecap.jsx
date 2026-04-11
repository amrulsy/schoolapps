import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { useCustomAlert } from '../../hooks/useCustomAlert';
import { API_BASE, getAuthHeaders } from '../../services/api';
import { 
    Calendar, Users, FileSpreadsheet, Printer, Search, 
    Filter, Activity, UserCheck, Clock, AlertCircle, UserMinus,
    Download, PieChart, ChevronRight, School
} from 'lucide-react';
import ExcelJS from 'exceljs';
import { useReactToPrint } from 'react-to-print';

// --- SUPER PREMIUM STYLES ---
const styles = /*css*/`
  .recap-container {
    padding-bottom: 40px;
    font-family: 'Inter', sans-serif;
  }

  /* Glassmorphism Classes (Shared with AttendancePage) */
  .glass-card {
    background: rgba(255, 255, 255, 0.7);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border: 1px solid rgba(255, 255, 255, 0.4);
    border-radius: 24px;
    box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.07);
    transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  }

  .glass-input {
    background: rgba(255,255,255,0.6);
    border: 1.5px solid rgba(255,255,255,0.8);
    backdrop-filter: blur(4px);
    border-radius: 14px;
    padding: 10px 16px;
    transition: all 0.2s;
    font-weight: 600;
  }

  .glass-input:focus {
    background: white;
    border-color: var(--primary-300);
    box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.08);
    outline: none;
  }

  /* Premium Stat Cards */
  .vibrant-stat-card {
    padding: 24px;
    border-radius: 24px;
    background: white;
    border: 1px solid var(--border-color);
    display: flex;
    flex-direction: column;
    gap: 12px;
    flex: 1;
    min-width: 160px;
    transition: all 0.3s;
  }

  .vibrant-stat-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 10px 25px -5px rgba(0,0,0,0.05);
  }

  .icon-ring {
    width: 44px;
    height: 44px;
    border-radius: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 4px;
  }

  /* Premium Table Styling */
  .premium-table {
    width: 100%;
    border-collapse: separate;
    border-spacing: 0 8px;
  }

  .premium-table th {
    padding: 12px 16px;
    font-size: 0.7rem;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 1px;
    color: var(--text-muted);
  }

  .premium-table td {
    padding: 16px;
    background: white;
    border-top: 1px solid var(--border-color);
    border-bottom: 1px solid var(--border-color);
  }

  .premium-table td:first-child {
    border-left: 1px solid var(--border-color);
    border-top-left-radius: 16px;
    border-bottom-left-radius: 16px;
  }

  .premium-table td:last-child {
    border-right: 1px solid var(--border-color);
    border-top-right-radius: 16px;
    border-bottom-right-radius: 16px;
  }

  /* Status Badges */
  .status-badge {
    padding: 4px 10px;
    border-radius: 8px;
    font-weight: 800;
    font-size: 0.75rem;
    min-width: 30px;
    text-align: center;
  }
  .bg-hadir { background: #ecfdf5; color: #059669; }
  .bg-terlambat { background: #fff7ed; color: #c2410c; }
  .bg-sakit { background: #fffbeb; color: #d97706; }
  .bg-izin { background: #eff6ff; color: #3b82f6; }
  .bg-alpha { background: #fff1f2; color: #e11d48; }

  @media screen {
    .print-only { display: none !important; }
  }

  @media print {
    @page { margin: 1cm; size: landscape; }
    .no-print { display: none !important; }
    .print-only { display: block !important; }
    body { background: white !important; color: black !important; }
    .glass-card { border: none !important; border-radius: 0; box-shadow: none; background: white; }
    .print-table { border-collapse: collapse; width: 100%; margin-top: 15px; }
    .print-table th { background-color: #f1f5f9 !important; color: #1e293b !important; -webkit-print-color-adjust: exact; }
    .print-table th, .print-table td { border: 1px solid #cbd5e1; padding: 6px 8px; font-size: 8pt; vertical-align: middle; }
    .status-badge { border: 1px solid #ddd !important; -webkit-print-color-adjust: exact; }
    .print-header-line { border-bottom: 3px double #000; margin-bottom: 20px; padding-bottom: 10px; }
  }

  @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
  .animate-fade { animation: fadeIn 0.4s ease-out forwards; }
`;

function getSemesterDates(tahunAjaran, semester) {
    if (!tahunAjaran) return { start: '', end: '' };
    const [startYear, endYear] = tahunAjaran.split('/');
    if (semester === 'Ganjil') {
        return { start: `${startYear}-07-01`, end: `${startYear}-12-31` };
    } else {
        return { start: `${endYear}-01-01`, end: `${endYear}-06-30` };
    }
}

function getMonthDates(yearMonth) {
    const [year, month] = yearMonth.split('-');
    const startDate = `${year}-${month}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    return { start: startDate, end: `${year}-${month}-${lastDay}` };
}

function generateDateRange(start, end) {
    const dates = [];
    let current = new Date(start + 'T12:00:00');
    const last = new Date(end + 'T12:00:00');
    while (current <= last) {
        dates.push(current.toISOString().split('T')[0]);
        current.setDate(current.getDate() + 1);
    }
    return dates;
}

export default function AttendanceRecap() {
    const { units, tahunAjaranList, schoolSettings } = useApp();
    const { showError, showSuccess } = useCustomAlert();
    
    const [kelasId, setKelasId] = useState('');
    const [filterMode, setFilterMode] = useState('semester'); 
    const [selectedTA, setSelectedTA] = useState('');
    const [selectedSemester, setSelectedSemester] = useState('Ganjil');
    const [selectedBulan, setSelectedBulan] = useState(new Date().toISOString().slice(0, 7));
    const [customStart, setCustomStart] = useState('');
    const [customEnd, setCustomEnd] = useState('');
    
    const [data, setData] = useState([]);
    const [appliedRange, setAppliedRange] = useState({ start: '', end: '' });
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [viewMode, setViewMode] = useState('rekap'); 

    const printRef = useRef();
    const allDetailKelas = useMemo(() =>
        (units || []).flatMap(u => (u.kelas || []).map(k => ({ ...k, unitNama: u.nama }))),
    [units]);

    useEffect(() => {
        const activeTA = tahunAjaranList?.find(t => t.status === 'aktif')?.tahun;
        if (activeTA && !selectedTA) setSelectedTA(activeTA);
    }, [tahunAjaranList]);

    const handleFetchRecap = async () => {
        if (!kelasId) return showError('Peringatan', 'Silakan pilih kelas terlebih dahulu');

        let start = '', end = '';
        if (filterMode === 'semester') {
            const dates = getSemesterDates(selectedTA, selectedSemester);
            start = dates.start; end = dates.end;
        } else if (filterMode === 'bulan') {
            const dates = getMonthDates(selectedBulan);
            start = dates.start; end = dates.end;
        } else {
            start = customStart; end = customEnd;
        }

        if (!start || !end) return showError('Peringatan', 'Rentang tanggal tidak valid');

        setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/admin/presensi/rekap?kelasId=${kelasId}&startDate=${start}&endDate=${end}`, {
                headers: getAuthHeaders()
            });
            if (!res.ok) throw new Error('Gagal mengambil data rekap');
            const result = await res.json();
            setData(result);
            setAppliedRange({ start, end });
        } catch (err) {
            showError('Kesalahan', err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleExportExcel = async () => {
        if (data.length === 0) return;
        
        try {
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('Rekap Presensi');
            
            const kelasNama = allDetailKelas.find(k => k.id.toString() === kelasId)?.nama || '-';
            const unitNama = allDetailKelas.find(k => k.id.toString() === kelasId)?.unitNama || '-';

            // Title & Info
            worksheet.addRow(['REKAPITULASI PRESENSI SISWA']);
            worksheet.addRow([`${unitNama} - ${kelasNama}`]);
            worksheet.addRow([`Periode: ${appliedRange.start} s/d ${appliedRange.end}`]);
            worksheet.addRow([]);

            // Merge titles
            worksheet.mergeCells('A1:J1');
            worksheet.mergeCells('A2:J2');
            worksheet.mergeCells('A3:J3');
            
            worksheet.getRow(1).font = { bold: true, size: 16, color: { argb: 'FF1E293B' } };
            worksheet.getRow(1).alignment = { horizontal: 'center' };
            worksheet.getRow(2).font = { bold: true, size: 12, color: { argb: 'FF475569' } };
            worksheet.getRow(2).alignment = { horizontal: 'center' };
            worksheet.getRow(3).font = { italic: true, size: 10, color: { argb: 'FF64748B' } };
            worksheet.getRow(3).alignment = { horizontal: 'center' };

            // Header Row
            const headers = ['No', 'NISN', 'Nama Siswa'];
            
            // Add Daily Columns if in Detail View
            const isDetail = viewMode === 'detail' && uiDateColumns.length > 0;
            if (isDetail) {
                uiDateColumns.forEach(d => headers.push(d.split('-')[2]));
            }
            
            // H=Hadir, T=Terlambat, S=Sakit, I=Izin, A=Alpha
            headers.push('H', 'T', 'S', 'I', 'A', 'Total', '%');

            const headerRow = worksheet.addRow(headers);
            headerRow.height = 25;
            headerRow.eachCell((cell) => {
                cell.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'FF1E3A8A' } // Deep Blue
                };
                cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
                cell.alignment = { horizontal: 'center', vertical: 'middle' };
                cell.border = {
                    top: { style: 'thin' }, left: { style: 'thin' },
                    bottom: { style: 'thin' }, right: { style: 'thin' }
                };
            });

            // Data Rows
            filteredData.forEach((s, idx) => {
                const rowData = [idx + 1, s.nisn, s.nama];
                
                if (isDetail) {
                    uiDateColumns.forEach(d => {
                        const status = s.details?.[d]?.status;
                        const code = status === 'hadir' ? 'H' : status === 'terlambat' ? 'T' : status === 'sakit' ? 'S' : status === 'izin' ? 'I' : status === 'alpha' ? 'A' : '-';
                        rowData.push(code);
                    });
                }
                
                rowData.push(s.hadir, s.terlambat, s.sakit, s.izin, s.alpha, s.total, String(s.persentase) + '%');
                
                const row = worksheet.addRow(rowData);
                row.eachCell((cell, colNumber) => {
                    cell.border = {
                        top: { style: 'thin', color: { argb: 'FFE2E8F0' } }, 
                        left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
                        bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } }, 
                        right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
                    };
                    
                    // Center alignment for code/stats columns
                    if (colNumber >= 4) cell.alignment = { horizontal: 'center' };

                    // Conditional Formatting for Status Codes (In Detail View)
                    if (isDetail && colNumber > 3 && colNumber < 4 + uiDateColumns.length) {
                        const val = cell.value;
                        if (val === 'H') cell.font = { color: { argb: 'FF059669' }, bold: true };
                        if (val === 'T') cell.font = { color: { argb: 'FFF97316' }, bold: true };
                        if (val === 'S') cell.font = { color: { argb: 'FFD97706' }, bold: true };
                        if (val === 'I') cell.font = { color: { argb: 'FF2563EB' }, bold: true };
                        if (val === 'A') cell.font = { color: { argb: 'FFE11D48' }, bold: true };
                    }
                });
            });

            // Summary Footer
            const lastDataCol = 3 + (isDetail ? uiDateColumns.length : 0);
            const footerRow = worksheet.addRow([]);
            footerRow.getCell(3).value = 'TOTAL KESELURUHAN';
            footerRow.getCell(3).font = { bold: true };
            footerRow.getCell(3).alignment = { horizontal: 'right' };

            const metrics = ['hadir', 'terlambat', 'sakit', 'izin', 'alpha', 'total'];
            metrics.forEach((m, i) => {
                const colIdx = lastDataCol + i + 1;
                const totalVal = data.reduce((sum, x) => sum + (x[m] || 0), 0);
                footerRow.getCell(colIdx).value = totalVal;
                footerRow.getCell(colIdx).font = { bold: true };
                footerRow.getCell(colIdx).alignment = { horizontal: 'center' };
                footerRow.getCell(colIdx).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
                footerRow.getCell(colIdx).border = {
                    top: { style: 'thin' }, left: { style: 'thin' },
                    bottom: { style: 'thin' }, right: { style: 'thin' }
                };
            });

            // Column Widths
            worksheet.getColumn(1).width = 6;
            worksheet.getColumn(2).width = 18;
            worksheet.getColumn(3).width = 38;
            
            // Auto width for date columns
            if (isDetail) {
                for (let i = 4; i < 4 + uiDateColumns.length; i++) {
                    worksheet.getColumn(i).width = 4.5;
                }
            }

            // Generate File
            const buffer = await workbook.xlsx.writeBuffer();
            const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            const url = window.URL.createObjectURL(blob);
            
            const cleanKelas = (kelasNama || 'Data').replace(/[^a-z0-9]/gi, '');
            const safeFileName = `Rekap_${viewMode}_${cleanKelas}_${(appliedRange.start || '').replace(/-/g, '')}.xlsx`;
            
            const anchor = document.createElement('a');
            anchor.style.display = 'none';
            anchor.href = url;
            anchor.download = safeFileName;
            
            document.body.appendChild(anchor);
            
            // Show alert BEFORE trigger to avoid focus steal during download
            showSuccess('Berhasil', 'Hampir selesai! File Excel sedang diunduh...');
            
            setTimeout(() => {
                anchor.click();
                document.body.removeChild(anchor);
                window.URL.revokeObjectURL(url);
            }, 100);
        } catch (err) {
            console.error(err);
            showError('Kesalahan', 'Gagal membuat file Excel: ' + err.message);
        }
    };

    const handlePrint = useReactToPrint({
        contentRef: printRef,
        documentTitle: `Rekap_Presensi_${kelasId}`,
    });

    const summary = useMemo(() => {
        if (data.length === 0) return { hadir: 0, sakit: 0, izin: 0, alpha: 0, avg: 0 };
        const h = data.reduce((s, x) => s + x.hadir, 0);
        const tl = data.reduce((s, x) => s + (x.terlambat || 0), 0);
        const sl = data.reduce((s, x) => s + x.sakit, 0);
        const iz = data.reduce((s, x) => s + x.izin, 0);
        const al = data.reduce((s, x) => s + x.alpha, 0);
        const total = data.reduce((s, x) => s + x.total, 0);
        return { hadir: h, terlambat: tl, sakit: sl, izin: iz, alpha: al, avg: total ? ((h / total) * 100).toFixed(1) : 0 };
    }, [data]);

    const uiDateColumns = useMemo(() => {
        if (!appliedRange.start || !appliedRange.end) return [];
        const diff = (new Date(appliedRange.end) - new Date(appliedRange.start)) / 86400000;
        // Increase limit to 200 days to support full semester matrix
        return diff <= 200 ? generateDateRange(appliedRange.start, appliedRange.end) : [];
    }, [appliedRange]);

    const filteredData = data.filter(s => s.nama.toLowerCase().includes(searchQuery.toLowerCase()) || s.nisn.includes(searchQuery));

    return (
        <div className="recap-container animate-fade">
            <style dangerouslySetInnerHTML={{ __html: styles }} />

            {/* PRINT AREA (Hidden on screen, shown in PDF) */}
            <div className="print-only">
                <div ref={printRef} className="p-5" style={{ color: '#000', backgroundColor: '#fff' }}>
                    {/* KOP SURAT / PROFESSIONAL HEADER */}
                    <div className="print-header-line d-flex align-items-center gap-4">
                        <div style={{ width: 80, height: 80, background: '#f1f5f9', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #e2e8f0' }}>
                           <School size={40} className="text-muted" />
                        </div>
                        <div className="flex-grow-1 text-center pr-5">
                            <h2 className="fw-black mb-0" style={{ letterSpacing: '1px' }}>{schoolSettings?.nama?.toUpperCase() || 'SIAS SMK PPRQ'}</h2>
                            <p className="mb-0 text-muted small">{schoolSettings?.alamat || 'Alamat Sekolah Belum Diatur'}</p>
                            <p className="mb-0 fw-bold small">Laporan Rekapitulasi Presensi Siswa</p>
                        </div>
                    </div>

                    {/* REPORT METADATA */}
                    <div className="row mt-4 mb-2 small">
                        <div className="col-4">
                            <div className="mb-1 text-muted">Kelas / Program:</div>
                            <div className="fw-bold">{allDetailKelas.find(k => k.id.toString() === kelasId)?.unitNama} - {allDetailKelas.find(k => k.id.toString() === kelasId)?.nama}</div>
                        </div>
                        <div className="col-4 text-center">
                            <div className="mb-1 text-muted">Periode Laporan:</div>
                            <div className="fw-bold">{appliedRange.start} s/d {appliedRange.end}</div>
                        </div>
                        <div className="col-4 text-end">
                            <div className="mb-1 text-muted">Tanggal Cetak:</div>
                            <div className="fw-bold">{new Date().toLocaleDateString('id-ID', { dateStyle: 'long' })}</div>
                        </div>
                    </div>

                    {/* ATTENDANCE SNAPSHOT (Summary Cards for Print) */}
                    <div className="d-flex gap-3 mt-4 mb-4">
                        {[
                            { label: 'Hadir', value: summary.hadir, color: '#059669' },
                            { label: 'Terlambat', value: summary.terlambat, color: '#d97706' },
                            { label: 'Sakit', value: summary.sakit, color: '#b45309' },
                            { label: 'Izin', value: summary.izin, color: '#2563eb' },
                            { label: 'Alpha', value: summary.alpha, color: '#dc2626' },
                            { label: 'Avg %', value: summary.avg + '%', color: '#1e293b' }
                        ].map((stat, i) => (
                            <div key={i} className="p-2 flex-grow-1 border rounded" style={{ backgroundColor: '#f8fafc', borderColor: '#e2e8f0' }}>
                                <div className="small text-muted mb-0" style={{ fontSize: '0.65rem' }}>{stat.label.toUpperCase()}</div>
                                <div className="fw-bold" style={{ color: stat.color }}>{stat.value}</div>
                            </div>
                        ))}
                    </div>

                    <table className="print-table">
                        <thead>
                            <tr style={{ backgroundColor: '#f1f5f9' }}>
                                <th style={{ width: 30 }}>No</th>
                                <th style={{ width: 100 }}>NISN</th>
                                <th style={{ textAlign: 'left' }}>Nama Siswa</th>
                                {viewMode === 'detail' && uiDateColumns.map(d => (
                                    <th key={d} style={{ width: 25, textAlign: 'center' }}>{d.split('-')[2]}</th>
                                ))}
                                <th style={{ width: 35 }}>H</th>
                                <th style={{ width: 35 }}>T</th>
                                <th style={{ width: 35 }}>S</th>
                                <th style={{ width: 35 }}>I</th>
                                <th style={{ width: 35 }}>A</th>
                                <th style={{ width: 45 }}>%</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredData.map((s, idx) => (
                                <tr key={idx}>
                                    <td className="text-center">{idx + 1}</td>
                                    <td className="text-center">{s.nisn}</td>
                                    <td>{s.nama}</td>
                                    {viewMode === 'detail' && uiDateColumns.map(d => {
                                        const status = s.details?.[d]?.status;
                                        const code = status === 'hadir' ? 'H' : status === 'terlambat' ? 'T' : status === 'sakit' ? 'S' : status === 'izin' ? 'I' : status === 'alpha' ? 'A' : '-';
                                        return (
                                            <td key={d} className="text-center" style={{ 
                                                fontSize: '7pt', 
                                                color: code === 'A' ? 'red' : code === 'T' ? 'orange' : 'inherit',
                                                fontWeight: code !== '-' ? 'bold' : 'normal'
                                            }}>
                                                {code}
                                            </td>
                                        )
                                    })}
                                    <td className="text-center fw-bold">{s.hadir}</td>
                                    <td className="text-center fw-bold">{s.terlambat || 0}</td>
                                    <td className="text-center fw-bold">{s.sakit}</td>
                                    <td className="text-center fw-bold">{s.izin}</td>
                                    <td className="text-center fw-bold text-danger">{s.alpha}</td>
                                    <td className="text-center fw-bold">{s.persentase}%</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {/* SIGNATURE SECTION */}
                    <div className="mt-5 pt-3" style={{ pageBreakInside: 'avoid' }}>
                        <div className="row">
                            <div className="col-4">
                                <p className="mb-0">Mengetahui,</p>
                                <p className="mb-5 pb-3">Kepala Sekolah</p>
                                <div className="border-bottom w-75 mt-4" style={{ borderBottom: '1px solid black !important' }}></div>
                                <p className="small text-muted mt-1">(Nama Terang & Cap Sekolah)</p>
                            </div>
                            <div className="col-4"></div>
                            <div className="col-4 text-end">
                                <p className="mb-0">{schoolSettings?.kota || 'Demak'}, {new Date().toLocaleDateString('id-ID', { dateStyle: 'long' })}</p>
                                <p className="mb-5 pb-3">Wali Kelas,</p>
                                <div className="border-bottom w-75 ms-auto mt-4" style={{ borderBottom: '1px solid black !important' }}></div>
                                <p className="small text-muted mt-1">(Nama Terang Wali Kelas)</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* FILTER PANEL */}
            <div className="glass-card p-4 mb-4">
                <div className="d-flex align-items-center gap-2 mb-4">
                    <div className="icon-ring bg-primary text-white mb-0" style={{ width: 32, height: 32 }}>
                        <Filter size={18} />
                    </div>
                    <h5 className="fw-black mb-0">Parameter Rekapitulasi</h5>
                </div>
                
                <div className="row g-3">
                    <div className="col-md-3">
                        <label className="small fw-bold text-muted mb-2">Kelas</label>
                        <select className="glass-input w-100" value={kelasId} onChange={e => setKelasId(e.target.value)}>
                            <option value="">Pilih Kelas...</option>
                            {allDetailKelas.map(k => <option key={k.id} value={k.id}>{k.unitNama} - {k.nama}</option>)}
                        </select>
                    </div>
                    <div className="col-md-2">
                        <label className="small fw-bold text-muted mb-2">Mode</label>
                        <select className="glass-input w-100" value={filterMode} onChange={e => setFilterMode(e.target.value)}>
                            <option value="semester">Semester</option>
                            <option value="bulan">Bulan</option>
                            <option value="kustom">Kustom</option>
                        </select>
                    </div>

                    {filterMode === 'semester' && (
                        <>
                            <div className="col-md-2">
                                <label className="small fw-bold text-muted mb-2">Tahun Ajaran</label>
                                <select className="glass-input w-100" value={selectedTA} onChange={e => setSelectedTA(e.target.value)}>
                                    {tahunAjaranList?.map(t => <option key={t.id} value={t.tahun}>{t.tahun}</option>)}
                                </select>
                            </div>
                            <div className="col-md-3">
                                <label className="small fw-bold text-muted mb-2">Semester</label>
                                <select className="glass-input w-100" value={selectedSemester} onChange={e => setSelectedSemester(e.target.value)}>
                                    <option value="Ganjil">Ganjil (Jul - Des)</option>
                                    <option value="Genap">Genap (Jan - Jun)</option>
                                </select>
                            </div>
                        </>
                    )}

                    {filterMode === 'bulan' && (
                        <div className="col-md-5">
                            <label className="small fw-bold text-muted mb-2">Pilih Bulan</label>
                            <input type="month" className="glass-input w-100" value={selectedBulan} onChange={e => setSelectedBulan(e.target.value)} />
                        </div>
                    )}

                    {filterMode === 'kustom' && (
                        <>
                            {/* Bug #8 Fixed: col-md-2.5 is not a valid Bootstrap class, use col-md-3 */}
                            <div className="col-md-3">
                                <label className="small fw-bold text-muted mb-2">Mulai</label>
                                <input type="date" className="glass-input w-100" value={customStart} onChange={e => setCustomStart(e.target.value)} />
                            </div>
                            <div className="col-md-3">
                                <label className="small fw-bold text-muted mb-2">Sampai</label>
                                <input type="date" className="glass-input w-100" value={customEnd} onChange={e => setCustomEnd(e.target.value)} />
                            </div>
                        </>
                    )}

                    <div className="col-md-2 d-flex align-items-end">
                        <button className="btn btn-primary w-100 rounded-pill fw-bold py-2" onClick={handleFetchRecap} disabled={loading}>
                            {loading ? '...' : 'Terapkan'}
                        </button>
                    </div>
                </div>
            </div>

            {data.length > 0 && (
                <>
                {/* SUMMARY CARDS */}
                <div className="d-flex gap-3 mb-4 overflow-auto pb-2">
                    <SummaryCard label="Siswa" value={data.length} icon={<Users size={20} />} color="#6366f1" />
                    <SummaryCard label="Kehadiran" value={`${summary.avg}%`} icon={<Activity size={20} />} color="#3b82f6" />
                    <SummaryCard label="Hadir" value={summary.hadir} icon={<UserCheck size={20} />} color="#10b981" />
                    <SummaryCard label="Terlambat" value={summary.terlambat} icon={<Clock size={20} />} color="#f97316" />
                    <SummaryCard label="Sakit" value={summary.sakit} icon={<Clock size={20} />} color="#f59e0b" />
                    <SummaryCard label="Alpha" value={summary.alpha} icon={<UserMinus size={20} />} color="#f43f5e" />
                </div>

                {/* DATA PANEL */}
                <div className="glass-card p-4">
                    <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
                        <div className="d-flex align-items-center gap-3">
                            {viewMode === 'detail' && (
                                <div className="bg-primary bg-opacity-10 px-3 py-2 rounded-4 border border-primary border-opacity-10">
                                    <h6 className="fw-black text-primary mb-0" style={{ letterSpacing: '0.5px' }}>MATRIKS KEHADIRAN HARIAN SISWA</h6>
                                </div>
                            )}
                            <div className="position-relative" style={{ width: 300 }}>
                                <Search size={18} className="position-absolute text-muted" style={{ left: 16, top: 12 }} />
                                <input 
                                    type="text" className="form-control form-control-sm border-0 bg-light rounded-pill ps-5" 
                                    style={{ height: 42 }} placeholder="Cari NISN atau Nama..." 
                                    value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="d-flex gap-2">
                            {uiDateColumns.length > 0 && (
                                <div className="btn-group p-1 bg-light rounded-pill">
                                    <button className={`btn btn-sm rounded-pill px-3 fw-bold ${viewMode === 'rekap' ? 'btn-white shadow-sm' : 'btn-link text-muted'}`} onClick={() => setViewMode('rekap')}>Ringkasan</button>
                                    <button className={`btn btn-sm rounded-pill px-3 fw-bold ${viewMode === 'detail' ? 'btn-white shadow-sm' : 'btn-link text-muted'}`} onClick={() => setViewMode('detail')}>Detail</button>
                                </div>
                            )}
                            <button className="btn btn-success rounded-pill px-4 fw-bold border-0 d-flex align-items-center gap-2" onClick={handleExportExcel}>
                                <FileSpreadsheet size={16} /> Excel
                            </button>
                            <button className="btn btn-danger rounded-pill px-4 fw-bold border-0 d-flex align-items-center gap-2" onClick={handlePrint}>
                                <Printer size={16} /> PDF
                            </button>
                        </div>
                    </div>

                    <div className="table-responsive">
                        <table className="premium-table">
                            <thead>
                                <tr className="text-muted small fw-bold">
                                    <th className="ps-4">No</th>
                                    <th>Identitas Siswa</th>
                                    {viewMode === 'detail' && uiDateColumns.map(d => (
                                        <th key={d} className="text-center">{d.split('-')[2]}</th>
                                    ))}
                                    {viewMode === 'rekap' && (
                                        <>
                                            <th className="text-center">H</th><th className="text-center">T</th><th className="text-center">S</th><th className="text-center">I</th><th className="text-center">A</th><th className="text-center">%</th>
                                        </>
                                    )}
                                </tr>
                            </thead>
                            <tbody>
                                {filteredData.map((s, idx) => (
                                    <tr key={s.id}>
                                        <td className="ps-4 text-muted small">{idx + 1}</td>
                                        <td>
                                            <div className="fw-black text-dark">{s.nama}</div>
                                            <div className="small text-muted">NISN: {s.nisn}</div>
                                        </td>
                                        {viewMode === 'detail' && uiDateColumns.map(d => {
                                            const status = s.details?.[d]?.status;
                                            const code = status === 'hadir' ? 'H' : status === 'terlambat' ? 'T' : status === 'sakit' ? 'S' : status === 'izin' ? 'I' : status === 'alpha' ? 'A' : '-';
                                            return (
                                                <td key={d} className="text-center">
                                                    {code !== '-' ? <div className={`status-badge mx-auto bg-${status.toLowerCase()}`}>{code}</div> : '-'}
                                                </td>
                                            )
                                        })}
                                        {viewMode === 'rekap' && (
                                            <>
                                                <td className="text-center fw-bold text-success">{s.hadir}</td>
                                                <td className="text-center fw-bold" style={{color:'#f97316'}}>{s.terlambat || 0}</td>
                                                <td className="text-center fw-bold text-warning">{s.sakit}</td>
                                                <td className="text-center fw-bold text-primary">{s.izin}</td>
                                                <td className="text-center fw-bold text-danger">{s.alpha}</td>
                                                <td className="text-center"><span className="badge rounded-pill bg-primary px-3">{s.persentase}%</span></td>
                                            </>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
                </>
            )}

            {!loading && data.length === 0 && (
                <div className="glass-card p-5 text-center">
                    <PieChart size={64} className="text-muted opacity-20 mb-3 mx-auto" />
                    <h5 className="fw-black text-muted">Belum Ada Data Rekapitulasi</h5>
                    <p className="text-muted small">Pilih parameter di atas untuk melihat ringkasan kehadiran siswa.</p>
                </div>
            )}
        </div>
    );
}

function SummaryCard({ label, value, icon, color }) {
    return (
        <div className="vibrant-stat-card">
            <div className="icon-ring" style={{ background: `${color}15`, color: color }}>
                {icon}
            </div>
            <div>
                <div className="text-muted small fw-bold text-uppercase">{label}</div>
                <div className="fw-black h3 mb-0" style={{ color: '#1e293b' }}>{value}</div>
            </div>
        </div>
    )
}

