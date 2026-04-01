import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { useCustomAlert } from '../../hooks/useCustomAlert';
import { API_BASE, getAuthHeaders } from '../../services/api';
import { 
    Calendar, Users, FileSpreadsheet, Printer, Search, 
    Filter, Activity, UserCheck, Clock, AlertCircle, UserMinus 
} from 'lucide-react';
import ExcelJS from 'exceljs';
import { useReactToPrint } from 'react-to-print';

// --- STYLES ---
const styles = /*css*/`
  .recap-bento-grid {
    display: grid;
    grid-template-columns: repeat(12, 1fr);
    gap: 24px;
    margin-bottom: 24px;
  }
  .recap-bento-card {
    background: var(--bg-card);
    border-radius: 28px;
    padding: 24px;
    border: 1px solid var(--border-color);
    box-shadow: var(--shadow-sm);
    transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  }
  .recap-filter-panel { grid-column: span 12; }
  .recap-summary-panel { grid-column: span 12; display: flex; gap: 16px; overflow-x: auto; padding-bottom: 8px;}
  
  .recap-stat-card {
    flex: 1;
    min-width: 180px;
    background: var(--bg-stripe);
    border-radius: 20px;
    padding: 20px;
    border: 1px solid var(--border-color);
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .modern-select, .modern-input {
    background: var(--bg-input); 
    border: 1.5px solid var(--border-color);
    border-radius: 12px; 
    padding: 0.75rem 1rem; 
    color: var(--text-primary);
    font-weight: 600; 
    transition: all 0.2s; 
    width: 100%;
    font-size: 0.9rem;
  }
  .modern-select:focus, .modern-input:focus { 
    border-color: var(--primary-500); 
    box-shadow: 0 0 0 4px var(--primary-50); 
    outline: none; 
    background: var(--bg-card); 
  }

  .export-btn {
    border: none;
    padding: 10px 20px;
    border-radius: 14px;
    font-weight: 700;
    font-size: 0.85rem;
    display: flex;
    align-items: center;
    gap: 8px;
    transition: all 0.2s;
    cursor: pointer;
  }
  .export-btn.excel {
    background: #10b981;
    color: white;
    box-shadow: 0 4px 12px rgba(16, 185, 129, 0.2);
  }
  .export-btn.excel:hover { background: #059669; transform: translateY(-2px); }
  
  .export-btn.pdf {
    background: #ef4444;
    color: white;
    box-shadow: 0 4px 12px rgba(239, 68, 68, 0.2);
  }
  .export-btn.pdf:hover { background: #dc2626; transform: translateY(-2px); }

  .recap-table th {
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: var(--text-secondary);
    font-weight: 800;
    padding: 16px;
    background: var(--bg-stripe);
    border-bottom: 2px solid var(--border-color);
  }
  
  .recap-table td {
    padding: 16px;
    vertical-align: middle;
    font-weight: 600;
    color: var(--text-primary);
    border-bottom: 1px solid var(--border-color);
  }

  .badge-stat {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border-radius: 10px;
    font-weight: 800;
    font-size: 0.85rem;
  }
  .badge-hadir { background: var(--success-50); color: var(--success-600); }
  .badge-sakit { background: var(--warning-50); color: var(--warning-600); }
  .badge-izin { background: #eff6ff; color: #3b82f6; }
  .badge-alpha { background: var(--danger-50); color: var(--danger-600); }
  
  /* Print Styles */
  @media print {
    @page { size: A4 landscape; margin: 15mm; }
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .no-print { display: none !important; }
    .print-container { padding: 0; margin: 0; background: white; }
    .print-header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #000; padding-bottom: 10px; }
    .print-table { width: 100%; border-collapse: collapse; font-size: 10pt; }
    .print-table th, .print-table td { border: 1px solid #000; padding: 6px; text-align: center; }
    .print-table th { background-color: #f3f4f6 !important; font-weight: bold; }
    .print-table td.text-left { text-align: left; }
  }

  @media (max-width: 768px) {
    .recap-summary-panel { flex-wrap: wrap; }
    .recap-stat-card { min-width: calc(50% - 8px); }
    .filter-row { flex-direction: column; gap: 12px; }
  }

  .table-container {
    overflow-x: auto;
    width: 100%;
    border-radius: 12px;
    border: 1px solid var(--border-color);
  }
  
  .recap-table th.sunday-col {
    color: var(--danger-500);
    background: var(--danger-50);
  }
  .recap-table td.sunday-col {
    background: var(--bg-stripe);
  }
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
    const endDate = `${year}-${month}-${lastDay}`;
    return { start: startDate, end: endDate };
}

function generateDateRange(start, end) {
    const dates = [];
    const [sY, sM, sD] = start.split('-');
    const [eY, eM, eD] = end.split('-');
    // Gunakan jam 12 siang untuk mencegah pergeseran timezone
    let current = new Date(parseInt(sY), parseInt(sM) - 1, parseInt(sD), 12, 0, 0); 
    const last = new Date(parseInt(eY), parseInt(eM) - 1, parseInt(eD), 12, 0, 0);
    while (current <= last) {
        const y = current.getFullYear();
        const m = String(current.getMonth() + 1).padStart(2, '0');
        const d = String(current.getDate()).padStart(2, '0');
        dates.push(`${y}-${m}-${d}`);
        current.setDate(current.getDate() + 1);
    }
    return dates;
}

export default function AttendanceRecap() {
    const { units, tahunAjaranList, schoolSettings } = useApp();
    const { showError, showSuccess } = useCustomAlert();
    
    // Filters
    const [kelasId, setKelasId] = useState('');
    const [filterMode, setFilterMode] = useState('semester'); // 'semester', 'bulan', 'kustom'
    const [selectedTA, setSelectedTA] = useState('');
    const [selectedSemester, setSelectedSemester] = useState('Ganjil');
    const [selectedBulan, setSelectedBulan] = useState(new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' }).slice(0, 7));
    const [customStart, setCustomStart] = useState('');
    const [customEnd, setCustomEnd] = useState('');
    
    // Data
    const [data, setData] = useState([]);
    const [appliedRange, setAppliedRange] = useState({ start: '', end: '' });
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [viewMode, setViewMode] = useState('rekap'); // 'rekap' | 'detail'

    const printRef = useRef();

    const allDetailKelas = useMemo(() =>
        (units || []).flatMap(u => (u.kelas || []).map(k => ({ ...k, unitNama: u.nama }))),
    [units]);

    useEffect(() => {
        const activeTA = tahunAjaranList?.find(t => t.status === 'aktif')?.tahun;
        if (activeTA && !selectedTA) setSelectedTA(activeTA);
    }, [tahunAjaranList]);

    const handleFetchRecap = async () => {
        if (!kelasId) {
            showError('Peringatan', 'Silakan pilih kelas terlebih dahulu');
            return;
        }

        let startDate = '';
        let endDate = '';

        if (filterMode === 'semester') {
            const dates = getSemesterDates(selectedTA, selectedSemester);
            startDate = dates.start;
            endDate = dates.end;
        } else if (filterMode === 'bulan') {
            const dates = getMonthDates(selectedBulan);
            startDate = dates.start;
            endDate = dates.end;
        } else {
            startDate = customStart;
            endDate = customEnd;
        }

        if (!startDate || !endDate) {
            showError('Peringatan', 'Rentang tanggal tidak valid');
            return;
        }

        if (new Date(startDate) > new Date(endDate)) {
            showError('Peringatan', 'Tanggal awal tidak boleh lebih dari tanggal akhir');
            return;
        }

        setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/admin/presensi/rekap?kelasId=${kelasId}&startDate=${startDate}&endDate=${endDate}`, {
                headers: getAuthHeaders()
            });
            if (!res.ok) {
                const errObj = await res.json().catch(() => ({}));
                throw new Error(errObj.error || 'Gagal mengambil data rekap');
            }
            const result = await res.json();
            setData(result);
            if (result.length === 0) {
                showSuccess('Info', 'Tidak ada data siswa untuk kelas ini');
            }
            setAppliedRange({ start: startDate, end: endDate });
            if (filterMode === 'bulan') setViewMode('rekap'); // Reset to rekap mode after fetch
        } catch (err) {
            showError('Kesalahan', err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleExportExcel = async () => {
        if (data.length === 0) return showError('Perhatian', 'Tidak ada data untuk diekspor');
        
        // Calculate uiDateColumns here just for the Excel file logic parity, though the excel exports all days.
        const dateColumns = generateDateRange(appliedRange.start, appliedRange.end);
        if (filterMode === 'semester') periodeText = `Semester ${selectedSemester} ${selectedTA}`;
        else if (filterMode === 'bulan') periodeText = `Bulan ${selectedBulan}`;
        else periodeText = `Tgl ${customStart} sd ${customEnd}`;
        
        const kelasNama = allDetailKelas.find(k => k.id.toString() === kelasId)?.nama || 'Unknown';
        
        try {
            const workbook = new ExcelJS.Workbook();
            workbook.creator = 'School Portal SIAS';
            workbook.created = new Date();

            // ==========================================
            // SHEET 1: REKAP TOTAL
            // ==========================================
            const ws1 = workbook.addWorksheet('Rekap Total', { views: [{ state: 'frozen', xSplit: 3, ySplit: 3 }] });
            
            // Title
            ws1.mergeCells('A1', 'J1');
            ws1.getCell('A1').value = 'LAPORAN REKAPITULASI ABSENSI SISWA';
            ws1.getCell('A1').font = { size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
            ws1.getCell('A1').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A8A' } };
            ws1.getCell('A1').alignment = { vertical: 'middle', horizontal: 'center' };

            ws1.mergeCells('A2', 'J2');
            ws1.getCell('A2').value = `Kelas: ${kelasNama}  |  Periode: ${periodeText}`;
            ws1.getCell('A2').font = { size: 11, bold: true, color: { argb: 'FF1E3A8A' } };
            ws1.getCell('A2').alignment = { vertical: 'middle', horizontal: 'center' };

            // Headers
            const headers1 = ['No', 'NISN', 'Nama Siswa', 'Hadir', 'Sakit', 'Izin', 'Alpha', 'Total Efektif', 'Total Hadir', 'Persentase (%)'];
            const headerRow1 = ws1.addRow(headers1);
            
            // Style headers
            headerRow1.eachCell((cell) => {
                cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF3B82F6' } };
                cell.alignment = { vertical: 'middle', horizontal: 'center' };
                cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
            });

            // Columns width
            ws1.columns = [
                { width: 5 }, { width: 15 }, { width: 35 },
                { width: 10 }, { width: 10 }, { width: 10 }, { width: 10 },
                { width: 15 }, { width: 15 }, { width: 15 }
            ];

            // Data Rows
            data.forEach((s, idx) => {
                const row = ws1.addRow([
                    idx + 1, s.nisn, s.nama, s.hadir, s.sakit, s.izin, s.alpha, s.total, s.hadir, s.persentase + '%'
                ]);
                row.eachCell((cell, colNumber) => {
                    cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
                    if (colNumber > 3) cell.alignment = { horizontal: 'center' };
                    
                    // Highlight low attendance (<80%)
                    if (colNumber === 10 && s.persentase < 80) {
                        cell.font = { color: { argb: 'FFDC2626' }, bold: true };
                        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEE2E2' } };
                    }
                });
            });

            // ==========================================
            // SHEET 2: DETAIL HARIAN (MATRIKS)
            // ==========================================
            const dateColumns = generateDateRange(appliedRange.start, appliedRange.end);
            const ws2 = workbook.addWorksheet('Detail Harian', { views: [{ state: 'frozen', xSplit: 3, ySplit: 3 }] });

            // Title
            const lastColLetter = ws2.getColumn(3 + dateColumns.length + 1).letter; 
            ws2.mergeCells(`A1:${lastColLetter}1`);
            ws2.getCell('A1').value = 'MATRIKS KEHADIRAN HARIAN SISWA';
            ws2.getCell('A1').font = { size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
            ws2.getCell('A1').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A8A' } };
            ws2.getCell('A1').alignment = { vertical: 'middle', horizontal: 'center' };

            ws2.mergeCells(`A2:${lastColLetter}2`);
            ws2.getCell('A2').value = `Kelas: ${kelasNama}  |  Periode: ${periodeText}`;
            ws2.getCell('A2').font = { size: 11, bold: true, color: { argb: 'FF1E3A8A' } };
            ws2.getCell('A2').alignment = { vertical: 'middle', horizontal: 'center' };

            // Headers
            const headers2 = ['No', 'NISN', 'Nama Siswa'];
            dateColumns.forEach(d => headers2.push(dateRangeLabel(d, appliedRange.start, appliedRange.end)));
            headers2.push('Total H');

            const headerRow2 = ws2.addRow(headers2);
            headerRow2.eachCell((cell) => {
                const isDateHeader = cell.col > 3 && cell.col <= 3 + dateColumns.length;
                let bgArgb = 'FF3B82F6'; // Default Blue
                
                if (isDateHeader) {
                    const dateStr = dateColumns[cell.col - 4];
                    if (new Date(dateStr).getDay() === 0) bgArgb = 'FFEF4444'; // Red for Sundays
                }

                cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgArgb } };
                cell.alignment = { vertical: 'middle', horizontal: 'center', textRotation: isDateHeader ? 90 : 0 };
                cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
            });

            // Columns width
            const ws2Cols = [{ width: 5 }, { width: 15 }, { width: 35 }];
            dateColumns.forEach(() => ws2Cols.push({ width: 6 }));
            ws2Cols.push({ width: 10 });
            ws2.columns = ws2Cols;

            // Row Height for vertical text
            headerRow2.height = 40;

            // Data Rows
            data.forEach((s, idx) => {
                const rowData = [idx + 1, s.nisn, s.nama];
                dateColumns.forEach(date => {
                    const rawStatusObj = s.details && s.details[date];
                    rowData.push(rawStatusObj ? parseStatus(rawStatusObj.status) : '');
                });
                rowData.push(s.hadir);
                
                const row = ws2.addRow(rowData);
                row.eachCell((cell, colNumber) => {
                    cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
                    if (colNumber > 3) cell.alignment = { horizontal: 'center', vertical: 'middle' };
                    
                    // Status Color Coding
                    if (colNumber > 3 && colNumber <= 3 + dateColumns.length) {
                        const dateStr = dateColumns[colNumber - 4];
                        const isSunday = new Date(dateStr).getDay() === 0;

                        const val = cell.value;
                        if (val === 'H') { cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE6F4EA' } }; cell.font = { color: { argb: 'FF16A34A' }, bold: true }; }
                        else if (val === 'S') { cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEF9C3' } }; cell.font = { color: { argb: 'FFCA8A04' }, bold: true }; }
                        else if (val === 'I') { cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDBEAFE' } }; cell.font = { color: { argb: 'FF2563EB' }, bold: true }; }
                        else if (val === 'A') { cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEE2E2' } }; cell.font = { color: { argb: 'FFDC2626' }, bold: true }; }
                        else if (isSunday) { cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3F4F6' } }; } // Light Gray for Empty Sundays
                        
                        // Set comment Note for timing
                        const rawStatusObj = s.details && s.details[dateStr];
                        if (rawStatusObj && rawStatusObj.jam && rawStatusObj.jam !== '-') {
                            cell.note = `Waktu: ${rawStatusObj.jam}`;
                        }
                    }
                });
            });

            // Trigger Download
            const buffer = await workbook.xlsx.writeBuffer();
            const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Rekap_Absensi_Kelas_${kelasNama}_${periodeText.replace(/\//g, '-')}.xlsx`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            showSuccess('Berhasil', 'File Excel berhasil diunduh');
        } catch (error) {
            console.error(error);
            showError('Gagal Export', 'Terjadi kesalahan saat membuat file Excel');
        }
    };

    const dateRangeLabel = (dateStr, start, end) => {
        const spanDays = (new Date(end) - new Date(start)) / (1000 * 60 * 60 * 24);
        if (spanDays <= 31) {
            return parseInt(dateStr.split('-')[2], 10).toString(); // Hanya tanggal (1-31)
        }
        return `${dateStr.split('-')[2]}/${dateStr.split('-')[1]}`; // DD/MM (contoh: 01/07)
    };

    const parseStatus = (str) => {
        if (!str) return '';
        switch(str.toLowerCase()) {
            case 'hadir': return 'H';
            case 'sakit': return 'S';
            case 'izin': return 'I';
            case 'alpha': return 'A';
            default: return '';
        }
    };

    const handlePrint = useReactToPrint({
        content: () => printRef.current,
        documentTitle: 'Rekap Absensi Siswa',
    });

    const filteredData = useMemo(() => 
        data.filter(s => s.nama.toLowerCase().includes(searchQuery.toLowerCase()) || s.nisn.includes(searchQuery)),
    [data, searchQuery]);

    const summary = useMemo(() => {
        if (data.length === 0) return { hadir: 0, sakit: 0, izin: 0, alpha: 0, avg: 0 };
        const totalSakit = data.reduce((sum, s) => sum + s.sakit, 0);
        const totalIzin = data.reduce((sum, s) => sum + s.izin, 0);
        const totalAlpha = data.reduce((sum, s) => sum + s.alpha, 0);
        const totalHadir = data.reduce((sum, s) => sum + s.hadir, 0);
        const totalDays = data.reduce((sum, s) => sum + s.total, 0);
        const avg = totalDays > 0 ? ((totalHadir / totalDays) * 100).toFixed(1) : 0;
        return { hadir: totalHadir, sakit: totalSakit, izin: totalIzin, alpha: totalAlpha, avg };
    }, [data]);

    const getFilterLabel = () => {
        if (filterMode === 'semester') return `Semester ${selectedSemester} TA ${selectedTA}`;
        if (filterMode === 'bulan') return `Bulan ${selectedBulan}`;
        return `${customStart} s/d ${customEnd}`;
    };

    const uiDateColumns = useMemo(() => {
        if (!appliedRange.start || !appliedRange.end) return [];
        const spanDays = (new Date(appliedRange.end) - new Date(appliedRange.start)) / (1000 * 60 * 60 * 24);
        if (spanDays > 31) return []; // Terlalu lebar untuk web UI, sembunyikan matriks
        return generateDateRange(appliedRange.start, appliedRange.end);
    }, [appliedRange]);

    const kelasObj = allDetailKelas.find(k => k.id.toString() === kelasId);

    return (
        <div className="recap-container animate-fadeIn">
            <style dangerouslySetInnerHTML={{ __html: styles }} />

            {/* Hidden Print Container */}
            <div style={{ display: 'none' }}>
                <div ref={printRef} className="print-container">
                    <div className="print-header">
                        <h2>{schoolSettings?.namaSekolah || 'REKAPITULASI ABSENSI SISWA'}</h2>
                        <p>{schoolSettings?.alamat || ''}</p>
                        <h3 style={{ marginTop: '10px' }}>REKAP KEHADIRAN SISWA</h3>
                        <p>Kelas: {kelasObj ? `${kelasObj.unitNama} - ${kelasObj.nama}` : '-'}</p>
                        <p>Periode: {getFilterLabel()}</p>
                    </div>
                    <table className="print-table">
                        <thead>
                            <tr>
                                <th>No</th>
                                <th>NISN</th>
                                <th className="text-left">Nama Siswa</th>
                                <th>Hadir</th>
                                <th>Sakit</th>
                                <th>Izin</th>
                                <th>Alpha</th>
                                <th>Total Efektif</th>
                                <th>Persentase</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.map((s, idx) => (
                                <tr key={s.id}>
                                    <td>{idx + 1}</td>
                                    <td>{s.nisn}</td>
                                    <td className="text-left">{s.nama}</td>
                                    <td>{s.hadir}</td>
                                    <td>{s.sakit}</td>
                                    <td>{s.izin}</td>
                                    <td>{s.alpha}</td>
                                    <td>{s.total}</td>
                                    <td>{s.persentase}%</td>
                                </tr>
                            ))}
                            {data.length === 0 && (
                                <tr>
                                    <td colSpan="9">Tidak ada data</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="recap-bento-grid">
                {/* Filter Panel */}
                <div className="recap-bento-card recap-filter-panel">
                    <div className="d-flex align-items-center gap-2 mb-4">
                        <Filter size={20} className="text-primary" />
                        <h5 className="fw-black mb-0">Filter Rekapitulasi</h5>
                    </div>
                    <div className="d-flex gap-3 filter-row">
                        <div style={{ flex: 1 }}>
                            <label className="small fw-bold text-muted mb-2">Kelas</label>
                            <select className="modern-select" value={kelasId} onChange={e => setKelasId(e.target.value)}>
                                <option value="">-- Pilih Kelas --</option>
                                {allDetailKelas.map(k => (
                                    <option key={k.id} value={k.id}>{k.unitNama} - {k.nama}</option>
                                ))}
                            </select>
                        </div>
                        <div style={{ flex: 1 }}>
                            <label className="small fw-bold text-muted mb-2">Mode Rentang Waktu</label>
                            <select className="modern-select" value={filterMode} onChange={e => setFilterMode(e.target.value)}>
                                <option value="semester">Per Semester</option>
                                <option value="bulan">Per Bulan</option>
                                <option value="kustom">Kustom Tanggal</option>
                            </select>
                        </div>
                        
                        {/* Dynamic Inputs based on filterMode */}
                        {filterMode === 'semester' && (
                            <>
                                <div style={{ flex: 1 }}>
                                    <label className="small fw-bold text-muted mb-2">Tahun Ajaran</label>
                                    <select className="modern-select" value={selectedTA} onChange={e => setSelectedTA(e.target.value)}>
                                        <option value="">-- Pilih TA --</option>
                                        {tahunAjaranList?.map(t => (
                                            <option key={t.id} value={t.tahun}>{t.tahun}</option>
                                        ))}
                                    </select>
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label className="small fw-bold text-muted mb-2">Semester</label>
                                    <select className="modern-select" value={selectedSemester} onChange={e => setSelectedSemester(e.target.value)}>
                                        <option value="Ganjil">Ganjil (Jul - Des)</option>
                                        <option value="Genap">Genap (Jan - Jun)</option>
                                    </select>
                                </div>
                            </>
                        )}

                        {filterMode === 'bulan' && (
                            <div style={{ flex: 2 }}>
                                <label className="small fw-bold text-muted mb-2">Pilih Bulan</label>
                                <input type="month" className="modern-input" value={selectedBulan} onChange={e => setSelectedBulan(e.target.value)} />
                            </div>
                        )}

                        {filterMode === 'kustom' && (
                            <>
                                <div style={{ flex: 1 }}>
                                    <label className="small fw-bold text-muted mb-2">Dari Tanggal</label>
                                    <input type="date" className="modern-input" value={customStart} onChange={e => setCustomStart(e.target.value)} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label className="small fw-bold text-muted mb-2">Sampai Tanggal</label>
                                    <input type="date" className="modern-input" value={customEnd} onChange={e => setCustomEnd(e.target.value)} />
                                </div>
                            </>
                        )}

                        <div className="d-flex align-items-end">
                            <button className="btn btn-primary" style={{ padding: '0.75rem 1.5rem', borderRadius: '12px', fontWeight: 700 }} onClick={handleFetchRecap} disabled={loading}>
                                {loading ? 'Memuat...' : 'Terapkan'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Summary Panel */}
                {data.length > 0 && (
                    <div className="recap-summary-panel">
                        <div className="recap-stat-card">
                            <div className="d-flex align-items-center gap-2 text-muted fw-bold small text-uppercase">
                                <Users size={16} /> Total Siswa
                            </div>
                            <h2 className="fw-black mb-0">{data.length}</h2>
                        </div>
                        <div className="recap-stat-card">
                            <div className="d-flex align-items-center gap-2 text-muted fw-bold small text-uppercase">
                                <Activity size={16} /> Rata-Rata Kehadiran
                            </div>
                            <h2 className="fw-black mb-0 text-primary">{summary.avg}%</h2>
                        </div>
                        <div className="recap-stat-card">
                            <div className="d-flex align-items-center gap-2 text-muted fw-bold small text-uppercase">
                                <UserCheck size={16} className="text-success" /> Total Hadir (Hari)
                            </div>
                            <h2 className="fw-black mb-0 text-success">{summary.hadir}</h2>
                        </div>
                        <div className="recap-stat-card">
                            <div className="d-flex align-items-center gap-2 text-muted fw-bold small text-uppercase">
                                <Clock size={16} className="text-warning" /> Total Sakit (Hari)
                            </div>
                            <h2 className="fw-black mb-0 text-warning">{summary.sakit}</h2>
                        </div>
                        <div className="recap-stat-card">
                            <div className="d-flex align-items-center gap-2 text-muted fw-bold small text-uppercase">
                                <AlertCircle size={16} className="text-info" /> Total Izin (Hari)
                            </div>
                            <h2 className="fw-black mb-0 text-info">{summary.izin}</h2>
                        </div>
                        <div className="recap-stat-card">
                            <div className="d-flex align-items-center gap-2 text-muted fw-bold small text-uppercase">
                                <UserMinus size={16} className="text-danger" /> Total Alpha (Hari)
                            </div>
                            <h2 className="fw-black mb-0 text-danger">{summary.alpha}</h2>
                        </div>
                    </div>
                )}
            </div>

            {/* Data Table Panel */}
            <div className="recap-bento-card pb-0" style={{ overflow: 'hidden' }}>
                <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
                    <div style={{ position: 'relative', minWidth: '250px' }}>
                        <Search size={18} style={{ position: 'absolute', left: '16px', top: '12px', color: 'var(--text-muted)' }} />
                        <input
                            type="text" placeholder="Cari NISN atau Nama..." 
                            className="form-control border-0 shadow-none ps-5"
                            style={{ height: '42px', borderRadius: '12px', background: 'var(--bg-stripe)', fontWeight: 600 }}
                            value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div className="d-flex gap-2 align-items-center">
                        {uiDateColumns.length > 0 && (
                            <div className="btn-group me-2 shadow-sm rounded-3" role="group">
                                <button 
                                    className={`btn btn-sm ${viewMode === 'rekap' ? 'btn-primary' : 'btn-light border'}`} 
                                    onClick={() => setViewMode('rekap')}
                                    style={{ fontWeight: 600, padding: '0.4rem 1rem' }}
                                >
                                    Ringkasan
                                </button>
                                <button 
                                    className={`btn btn-sm ${viewMode === 'detail' ? 'btn-primary' : 'btn-light border'}`} 
                                    onClick={() => setViewMode('detail')}
                                    style={{ fontWeight: 600, padding: '0.4rem 1rem' }}
                                >
                                    Detail Harian
                                </button>
                            </div>
                        )}
                        <button className="export-btn excel" onClick={handleExportExcel} disabled={data.length === 0}>
                            <FileSpreadsheet size={16} /> Excel
                        </button>
                        <button className="export-btn pdf" onClick={handlePrint} disabled={data.length === 0}>
                            <Printer size={16} /> Print/PDF
                        </button>
                    </div>
                </div>

                <div className="table-responsive" style={{ margin: '0 -24px' }}>
                    <table className="table mb-0 recap-table align-middle">
                        <thead>
                            <tr>
                                <th className="ps-4">No</th>
                                <th style={{ minWidth: '180px' }}>NISN / Nama Siswa</th>
                                {viewMode === 'detail' && uiDateColumns.map(d => {
                                    const isSunday = new Date(d).getDay() === 0;
                                    return <th key={d} className={`text-center ${isSunday ? 'sunday-col' : ''}`}>{parseInt(d.split('-')[2], 10)}</th>
                                })}
                                {viewMode === 'detail' && <th className="text-center">Total H</th>}
                                
                                {viewMode === 'rekap' && (
                                    <>
                                        <th className="text-center">Hadir</th>
                                        <th className="text-center">Sakit</th>
                                        <th className="text-center">Izin</th>
                                        <th className="text-center">Alpha</th>
                                        <th className="text-center">Total Efektif</th>
                                        <th className="text-center">Kehadiran</th>
                                    </>
                                )}
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={7 + uiDateColumns.length} className="text-center py-5">
                                        <div className="spinner-border text-primary mb-3" role="status" /><br/>
                                        <span className="fw-bold text-muted">Menghitung rekapitulasi...</span>
                                    </td>
                                </tr>
                            ) : filteredData.length === 0 ? (
                                <tr>
                                    <td colSpan={viewMode === 'detail' ? 3 + uiDateColumns.length : 8} className="text-center py-5 text-muted fw-bold">
                                        Data rekapitulasi belum tersedia. Silakan terapkan filter terlebih dahulu.
                                    </td>
                                </tr>
                            ) : (
                                filteredData.map((s, idx) => (
                                    <tr key={s.id}>
                                        <td className="ps-4 text-muted">{idx + 1}</td>
                                        <td>
                                            <div className="fw-bold">{s.nama}</div>
                                            <div className="small text-muted">{s.nisn}</div>
                                        </td>
                                        
                                        {viewMode === 'detail' && uiDateColumns.map(d => {
                                            const isSunday = new Date(d).getDay() === 0;
                                            const rawObj = s.details && s.details[d];
                                            const rawStatus = rawObj ? rawObj.status : null;
                                            const jam = rawObj ? rawObj.jam : '-';
                                            const st = rawStatus ? parseStatus(rawStatus) : '';
                                            
                                            // Make title for hover
                                            let tooltip = '';
                                            if (rawStatus) tooltip = `Status: ${rawStatus.toUpperCase()}\nWaktu: ${jam !== '-' ? jam : 'Tidak tercatat'}`;
                                            else if (isSunday) tooltip = 'Hari Libur (Minggu)';

                                            return (
                                                <td key={d} className={`text-center ${isSunday ? 'sunday-col' : ''}`} title={tooltip}>
                                                    {st ? (
                                                        <div className={`badge-stat badge-${rawStatus.toLowerCase()}`} style={{ cursor: 'help' }}>{st}</div>
                                                    ) : (
                                                        <span style={{ color: 'var(--text-tertiary)', fontSize: '0.8em', cursor: isSunday ? 'help' : 'default' }}>-</span>
                                                    )}
                                                </td>
                                            )
                                        })}
                                        {viewMode === 'detail' && <td className="text-center fw-bold">{s.hadir}</td>}

                                        {viewMode === 'rekap' && (
                                            <>
                                                <td className="text-center">
                                                    <div className="badge-stat badge-hadir">{s.hadir}</div>
                                                </td>
                                                <td className="text-center">
                                                    <div className="badge-stat badge-sakit">{s.sakit}</div>
                                                </td>
                                                <td className="text-center">
                                                    <div className="badge-stat badge-izin">{s.izin}</div>
                                                </td>
                                                <td className="text-center">
                                                    <div className="badge-stat badge-alpha">{s.alpha}</div>
                                                </td>
                                                <td className="text-center">
                                                    <span className="fw-bold text-muted">{s.total}</span>
                                                </td>
                                                <td>
                                                    <div className="d-flex align-items-center gap-2 justify-content-center">
                                                        <div className="progress flex-grow-1" style={{ height: '8px', borderRadius: '10px', background: 'var(--border-color)', maxWidth: '100px' }}>
                                                            <div className="progress-bar bg-primary" style={{ width: `${s.persentase}%` }} />
                                                        </div>
                                                        <span className="fw-black text-primary small" style={{ minWidth: '40px' }}>{s.persentase}%</span>
                                                    </div>
                                                </td>
                                            </>
                                        )}
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
