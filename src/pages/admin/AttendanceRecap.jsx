import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { useCustomAlert } from '../../hooks/useCustomAlert';
import { API_BASE, getAuthHeaders } from '../../services/api';
import {
    Calendar, Users, FileSpreadsheet, Printer, Search,
    Filter, Activity, UserCheck, Clock, AlertCircle, UserMinus,
    Download, PieChart, ChevronRight, School, TrendingUp, Award
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
    @page { margin: 12mm 10mm; size: landscape; }
    .no-print { display: none !important; }
    .print-only { display: block !important; }
    body { background: white !important; color: black !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    .glass-card { border: none !important; border-radius: 0; box-shadow: none; background: white; }

    /* Professional Print Layout */
    .print-wrapper { padding: 0; font-family: 'Segoe UI', 'Inter', Arial, sans-serif; }

    .print-kop { text-align: center; border-bottom: 3px double #1e293b; padding-bottom: 14px; margin-bottom: 24px; }
    .print-kop h2 { font-size: 18pt; letter-spacing: 2px; margin: 0; font-weight: 900; color: #0f172a; }
    .print-kop .print-sub { font-size: 9pt; color: #475569; margin: 2px 0 0 0; }
    .print-kop .print-doc-title { font-size: 11pt; font-weight: 700; margin: 8px 0 0 0; color: #1e3a8a; text-transform: uppercase; letter-spacing: 1.5px; }

    .print-meta-grid { display: flex; gap: 20px; margin-bottom: 16px; font-size: 8.5pt; }
    .print-meta-item { flex: 1; }
    .print-meta-label { color: #94a3b8; font-weight: 600; font-size: 7pt; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 2px; }
    .print-meta-value { font-weight: 700; color: #1e293b; }

    .print-stat-row { display: flex; gap: 8px; margin-bottom: 18px; }
    .print-stat-pill {
      flex: 1; padding: 8px 12px; border-radius: 10px; text-align: center;
      -webkit-print-color-adjust: exact; print-color-adjust: exact;
    }
    .print-stat-pill .psp-label { font-size: 6pt; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; }
    .print-stat-pill .psp-value { font-size: 14pt; font-weight: 900; }

    .print-table { border-collapse: collapse; width: 100%; margin-top: 0; }
    .print-table thead th {
      background-color: #0f172a !important; color: white !important;
      -webkit-print-color-adjust: exact; print-color-adjust: exact;
      padding: 6px 8px; font-size: 7pt; font-weight: 800; text-transform: uppercase;
      letter-spacing: 0.5px; text-align: center; border: 1px solid #334155;
    }
    .print-table tbody td {
      padding: 5px 8px; font-size: 8pt; border: 1px solid #e2e8f0;
      vertical-align: middle;
    }
    .print-table tbody tr:nth-child(even) { background-color: #f8fafc !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .print-table tfoot td {
      padding: 6px 8px; font-size: 8pt; font-weight: 800; border: 1px solid #cbd5e1;
      background-color: #f1f5f9 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact;
    }

    .pct-badge { padding: 2px 8px; border-radius: 6px; font-weight: 800; font-size: 7.5pt; display: inline-block; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .pct-high { background: #ecfdf5; color: #059669; }
    .pct-mid { background: #eff6ff; color: #2563eb; }
    .pct-low { background: #fff1f2; color: #e11d48; }

    .code-cell { font-weight: 800; font-size: 7pt; letter-spacing: 0.5px; }
    .code-H { color: #059669; } .code-T { color: #ea580c; } .code-S { color: #d97706; }
    .code-I { color: #2563eb; } .code-A { color: #e11d48; } .code-none { color: #cbd5e1; }

    .print-sig-area { margin-top: 40px; display: flex; justify-content: space-between; page-break-inside: avoid; }
    .print-sig-block { width: 200px; text-align: center; }
    .print-sig-block .sig-title { font-size: 8pt; margin-bottom: 60px; }
    .print-sig-line { border-bottom: 1px solid #1e293b; margin-bottom: 4px; }
    .print-sig-name { font-size: 7pt; color: #94a3b8; }

    .print-footer-note { margin-top: 20px; font-size: 7pt; color: #94a3b8; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 8px; }
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

    // ═══════════════════════════════════════════════
    // PREMIUM EXCEL EXPORT
    // ═══════════════════════════════════════════════
    const handleExportExcel = async () => {
        if (data.length === 0) return;

        try {
            const workbook = new ExcelJS.Workbook();
            workbook.creator = 'SIAS — Sistem Informasi Absensi Siswa';
            workbook.created = new Date();

            const kelasNama = allDetailKelas.find(k => k.id.toString() === kelasId)?.nama || '-';
            const unitNama = allDetailKelas.find(k => k.id.toString() === kelasId)?.unitNama || '-';
            const isDetail = viewMode === 'detail' && uiDateColumns.length > 0;
            const totalStudents = filteredData.length;
            const schoolName = schoolSettings?.nama?.toUpperCase() || 'SIAS SMK PPRQ';

            // Color Palette
            const C = {
                navy: 'FF0F172A', navyLight: 'FF1E3A8A', indigo: 'FF4F46E5',
                white: 'FFFFFFFF', offWhite: 'FFF8FAFC', slate50: 'FFF1F5F9',
                slate100: 'FFE2E8F0', slate200: 'FFCBD5E1', slate500: 'FF64748B',
                slate700: 'FF334155', slate900: 'FF0F172A',
                emerald: 'FF059669', emeraldBg: 'FFECFDF5',
                orange: 'FFF97316', orangeBg: 'FFFFF7ED',
                amber: 'FFD97706', amberBg: 'FFFFFBEB',
                blue: 'FF2563EB', blueBg: 'FFEFF6FF', blueLight: 'FFBFDBFE',
                rose: 'FFE11D48', roseBg: 'FFFFF1F2',
                thinBorder: { style: 'thin', color: { argb: 'FFE2E8F0' } },
            };

            const lastCol = 3 + (isDetail ? uiDateColumns.length : 0) + 7;
            const statsTotal = data.reduce((s, x) => s + x.total, 0);
            const avgPct = statsTotal ? (((summary.hadir + summary.terlambat) / statsTotal) * 100).toFixed(1) : '0.0';

            // ── WORKSHEET ──
            const ws = workbook.addWorksheet('Rekap Presensi', {
                views: [{ state: 'frozen', ySplit: 7 }],
                properties: { defaultRowHeight: 22 },
                pageSetup: { orientation: 'landscape', fitToPage: true, fitToWidth: 1, paperSize: 9 }
            });

            // Row 1: School Banner
            const r1 = ws.addRow([schoolName]);
            ws.mergeCells(1, 1, 1, lastCol);
            r1.height = 38; r1.getCell(1).font = { bold: true, size: 18, color: { argb: C.white } };
            r1.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: C.navy } };
            r1.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };

            // Row 2: Subtitle
            const r2 = ws.addRow(['LAPORAN REKAPITULASI PRESENSI SISWA']);
            ws.mergeCells(2, 1, 2, lastCol);
            r2.height = 26; r2.getCell(1).font = { bold: true, size: 11, color: { argb: C.white } };
            r2.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: C.navyLight } };
            r2.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };

            // Row 3: Metadata
            const metaText = `Kelas: ${unitNama} — ${kelasNama}   |   Periode: ${appliedRange.start} s/d ${appliedRange.end}   |   Dicetak: ${new Date().toLocaleDateString('id-ID', { dateStyle: 'long' })}   |   Jumlah Siswa: ${totalStudents}`;
            const r3 = ws.addRow([metaText]);
            ws.mergeCells(3, 1, 3, lastCol);
            r3.height = 22; r3.getCell(1).font = { italic: true, size: 9, color: { argb: C.slate500 } };
            r3.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: C.slate50 } };
            r3.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };

            // Row 4: Summary Stats Bar
            const statsBarText = `📊  Hadir: ${summary.hadir}   ⏰ Terlambat: ${summary.terlambat}   🤒 Sakit: ${summary.sakit}   📝 Izin: ${summary.izin}   ❌ Alpha: ${summary.alpha}   —   Rata-rata Kehadiran: ${avgPct}%`;
            const r4 = ws.addRow([statsBarText]);
            ws.mergeCells(4, 1, 4, lastCol);
            r4.height = 28; r4.getCell(1).font = { bold: true, size: 10, color: { argb: C.navyLight } };
            r4.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: C.blueBg } };
            r4.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
            r4.getCell(1).border = { bottom: { style: 'medium', color: { argb: C.blueLight } } };

            // Row 5: Spacer
            ws.addRow([]);

            // Row 6: Section label
            const r6 = ws.addRow(['DATA KEHADIRAN SISWA' + (isDetail ? ' — MATRIKS HARIAN' : ' — RINGKASAN')]);
            ws.mergeCells(6, 1, 6, lastCol);
            r6.height = 24; r6.getCell(1).font = { bold: true, size: 9, color: { argb: C.slate700 } };
            r6.getCell(1).alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };

            // Row 7: Table Header
            const headers = ['No', 'NISN', 'Nama Siswa'];
            if (isDetail) uiDateColumns.forEach(d => headers.push(parseInt(d.split('-')[2])));
            headers.push('H', 'T', 'S', 'I', 'A', 'Total', '%');

            const headerRow = ws.addRow(headers);
            headerRow.height = 28;
            headerRow.eachCell((cell, colNumber) => {
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: C.navy } };
                cell.font = { bold: true, size: 9, color: { argb: C.white } };
                cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
                cell.border = {
                    top: { style: 'thin', color: { argb: C.slate200 } },
                    bottom: { style: 'medium', color: { argb: C.navyLight } },
                    left: { style: 'hair', color: { argb: C.slate200 } },
                    right: { style: 'hair', color: { argb: C.slate200 } },
                };
                if (!isDetail && colNumber >= 4) {
                    const colors = [C.emerald, C.orange, C.amber, C.blue, C.rose, C.slate700, C.indigo];
                    const idx = colNumber - 4;
                    if (idx < colors.length) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: colors[idx] } };
                }
            });

            // Auto-Filter
            ws.autoFilter = { from: { row: 7, column: 1 }, to: { row: 7 + filteredData.length, column: lastCol } };

            // Status fill map
            const SF = {
                H: { font: C.emerald, bg: C.emeraldBg }, T: { font: C.orange, bg: C.orangeBg },
                S: { font: C.amber, bg: C.amberBg }, I: { font: C.blue, bg: C.blueBg }, A: { font: C.rose, bg: C.roseBg },
            };

            // Data Rows
            filteredData.forEach((s, idx) => {
                const rowData = [idx + 1, s.nisn, s.nama];
                if (isDetail) {
                    uiDateColumns.forEach(d => {
                        const st = s.details?.[d]?.status;
                        rowData.push(st === 'hadir' ? 'H' : st === 'terlambat' ? 'T' : st === 'sakit' ? 'S' : st === 'izin' ? 'I' : st === 'alpha' ? 'A' : '');
                    });
                }
                rowData.push(s.hadir, s.terlambat || 0, s.sakit, s.izin, s.alpha, s.total, s.persentase);

                const row = ws.addRow(rowData);
                row.height = 22;
                const isEven = idx % 2 === 0;
                const rowBg = isEven ? C.white : C.offWhite;
                const statsStart = 3 + (isDetail ? uiDateColumns.length : 0) + 1;

                row.eachCell((cell, cn) => {
                    cell.border = { top: C.thinBorder, bottom: C.thinBorder, left: { style: 'hair', color: { argb: 'FFF1F5F9' } }, right: { style: 'hair', color: { argb: 'FFF1F5F9' } } };
                    cell.font = { size: 9, color: { argb: C.slate700 } };
                    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: rowBg } };

                    if (cn === 1) { cell.alignment = { horizontal: 'center', vertical: 'middle' }; cell.font = { size: 8, color: { argb: C.slate500 }, bold: true }; }
                    if (cn === 2) { cell.alignment = { horizontal: 'center', vertical: 'middle' }; cell.font = { size: 8, color: { argb: C.slate500 } }; }
                    if (cn === 3) { cell.font = { size: 9, color: { argb: C.slate900 }, bold: true }; cell.alignment = { vertical: 'middle' }; }

                    if (cn >= statsStart) {
                        cell.alignment = { horizontal: 'center', vertical: 'middle' };
                        cell.font = { size: 9, bold: true, color: { argb: C.slate700 } };
                        const si = cn - statsStart;
                        const keys = ['H', 'T', 'S', 'I', 'A'];
                        if (si < keys.length && cell.value > 0) {
                            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: SF[keys[si]].bg } };
                            cell.font = { size: 9, bold: true, color: { argb: SF[keys[si]].font } };
                        }
                        if (si === 6) {
                            const pct = s.persentase || 0;
                            cell.numFmt = '0.0"%"';
                            const pctColor = pct >= 90 ? { bg: C.emeraldBg, f: C.emerald } : pct >= 75 ? { bg: C.blueBg, f: C.blue } : { bg: C.roseBg, f: C.rose };
                            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: pctColor.bg } };
                            cell.font = { size: 9, bold: true, color: { argb: pctColor.f } };
                        }
                    }

                    if (isDetail && cn > 3 && cn < statsStart) {
                        cell.alignment = { horizontal: 'center', vertical: 'middle' };
                        const val = String(cell.value || '');
                        if (SF[val]) {
                            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: SF[val].bg } };
                            cell.font = { size: 8, bold: true, color: { argb: SF[val].font } };
                        } else {
                            cell.font = { size: 8, color: { argb: C.slate200 } };
                        }
                    }
                });
            });

            // Footer Rows
            ws.addRow([]);
            const totalLabel = ['', '', 'TOTAL'];
            if (isDetail) uiDateColumns.forEach(() => totalLabel.push(''));
            totalLabel.push(summary.hadir, summary.terlambat, summary.sakit, summary.izin, summary.alpha, statsTotal, avgPct);
            const fRow = ws.addRow(totalLabel);
            fRow.height = 28;
            fRow.eachCell((cell, cn) => {
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: C.navy } };
                cell.font = { bold: true, size: 10, color: { argb: C.white } };
                cell.alignment = { horizontal: cn === 3 ? 'right' : 'center', vertical: 'middle' };
                cell.border = { top: { style: 'medium', color: { argb: C.navyLight } }, bottom: { style: 'medium', color: { argb: C.navyLight } } };
            });

            // Average Row
            const avgLabel = ['', '', 'RATA-RATA / SISWA'];
            if (isDetail) uiDateColumns.forEach(() => avgLabel.push(''));
            const cnt = totalStudents || 1;
            avgLabel.push((summary.hadir / cnt).toFixed(1), (summary.terlambat / cnt).toFixed(1), (summary.sakit / cnt).toFixed(1), (summary.izin / cnt).toFixed(1), (summary.alpha / cnt).toFixed(1), (statsTotal / cnt).toFixed(1), avgPct + '%');
            const aRow = ws.addRow(avgLabel);
            aRow.height = 24;
            aRow.eachCell((cell, cn) => {
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: C.slate50 } };
                cell.font = { italic: true, size: 9, color: { argb: C.slate700 } };
                cell.alignment = { horizontal: cn === 3 ? 'right' : 'center', vertical: 'middle' };
                cell.border = { bottom: C.thinBorder };
            });

            // Column Widths
            ws.getColumn(1).width = 5; ws.getColumn(2).width = 16; ws.getColumn(3).width = 32;
            if (isDetail) { for (let i = 4; i < 4 + uiDateColumns.length; i++) ws.getColumn(i).width = 4; }
            const sc = 4 + (isDetail ? uiDateColumns.length : 0);
            for (let i = sc; i < sc + 5; i++) ws.getColumn(i).width = 7;
            ws.getColumn(sc + 5).width = 8; ws.getColumn(sc + 6).width = 8;

            // Generate & Download
            const buffer = await workbook.xlsx.writeBuffer();
            const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            const url = window.URL.createObjectURL(blob);
            const cleanKelas = (kelasNama || 'Data').replace(/[^a-z0-9]/gi, '');
            const safeFileName = `Rekap_Presensi_${cleanKelas}_${(appliedRange.start || '').replace(/-/g, '')}.xlsx`;
            const anchor = document.createElement('a');
            anchor.style.display = 'none'; anchor.href = url; anchor.download = safeFileName;
            document.body.appendChild(anchor);
            showSuccess('📊 Export Berhasil!', `File "${safeFileName}" sedang diunduh...`);
            setTimeout(() => { anchor.click(); document.body.removeChild(anchor); window.URL.revokeObjectURL(url); }, 100);
        } catch (err) {
            console.error(err);
            showError('Kesalahan Export', 'Gagal membuat file Excel: ' + err.message);
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
        return { hadir: h, terlambat: tl, sakit: sl, izin: iz, alpha: al, avg: total ? (((h + tl) / total) * 100).toFixed(1) : 0 };
    }, [data]);

    const uiDateColumns = useMemo(() => {
        if (!appliedRange.start || !appliedRange.end) return [];
        const diff = (new Date(appliedRange.end) - new Date(appliedRange.start)) / 86400000;
        return diff <= 200 ? generateDateRange(appliedRange.start, appliedRange.end) : [];
    }, [appliedRange]);

    const filteredData = data.filter(s => s.nama.toLowerCase().includes(searchQuery.toLowerCase()) || s.nisn.includes(searchQuery));

    // Helper: format date range for display
    const formatPeriode = () => {
        if (!appliedRange.start || !appliedRange.end) return '-';
        const fDate = (d) => new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
        return `${fDate(appliedRange.start)} — ${fDate(appliedRange.end)}`;
    };

    // Helper: get status code
    const getCode = (status) => status === 'hadir' ? 'H' : status === 'terlambat' ? 'T' : status === 'sakit' ? 'S' : status === 'izin' ? 'I' : status === 'alpha' ? 'A' : '-';
    const getPctClass = (pct) => pct >= 90 ? 'pct-high' : pct >= 75 ? 'pct-mid' : 'pct-low';

    return (
        <div className="recap-container animate-fade">
            <style dangerouslySetInnerHTML={{ __html: styles }} />

            {/* ═══════════════════════════════════════ */}
            {/* PREMIUM PRINT AREA (hidden on screen) */}
            {/* ═══════════════════════════════════════ */}
            <div className="print-only">
                <div ref={printRef} className="print-wrapper">
                    {/* KOP SURAT */}
                    <div className="print-kop">
                        <h2>{schoolSettings?.nama?.toUpperCase() || 'SIAS SMK PPRQ'}</h2>
                        <p className="print-sub">{schoolSettings?.alamat || 'Alamat Sekolah'}</p>
                        <p className="print-doc-title">Laporan Rekapitulasi Presensi Siswa</p>
                    </div>

                    {/* METADATA GRID */}
                    <div className="print-meta-grid">
                        <div className="print-meta-item">
                            <div className="print-meta-label">Kelas / Program</div>
                            <div className="print-meta-value">{allDetailKelas.find(k => k.id.toString() === kelasId)?.unitNama} — {allDetailKelas.find(k => k.id.toString() === kelasId)?.nama}</div>
                        </div>
                        <div className="print-meta-item">
                            <div className="print-meta-label">Periode Laporan</div>
                            <div className="print-meta-value">{formatPeriode()}</div>
                        </div>
                        <div className="print-meta-item">
                            <div className="print-meta-label">Jumlah Siswa</div>
                            <div className="print-meta-value">{filteredData.length} siswa</div>
                        </div>
                        <div className="print-meta-item" style={{ textAlign: 'right' }}>
                            <div className="print-meta-label">Tanggal Cetak</div>
                            <div className="print-meta-value">{new Date().toLocaleDateString('id-ID', { dateStyle: 'long' })}</div>
                        </div>
                    </div>

                    {/* STAT PILLS */}
                    <div className="print-stat-row">
                        {[
                            { label: 'Hadir', value: summary.hadir, bg: '#ecfdf5', color: '#059669' },
                            { label: 'Terlambat', value: summary.terlambat, bg: '#fff7ed', color: '#ea580c' },
                            { label: 'Sakit', value: summary.sakit, bg: '#fffbeb', color: '#d97706' },
                            { label: 'Izin', value: summary.izin, bg: '#eff6ff', color: '#2563eb' },
                            { label: 'Alpha', value: summary.alpha, bg: '#fff1f2', color: '#e11d48' },
                            { label: 'Kehadiran', value: summary.avg + '%', bg: '#f0f9ff', color: '#0369a1' },
                        ].map((s, i) => (
                            <div key={i} className="print-stat-pill" style={{ background: s.bg, color: s.color, border: `1px solid ${s.color}22` }}>
                                <div className="psp-label">{s.label}</div>
                                <div className="psp-value">{s.value}</div>
                            </div>
                        ))}
                    </div>

                    {/* DATA TABLE */}
                    <table className="print-table">
                        <thead>
                            <tr>
                                <th style={{ width: 30 }}>No</th>
                                <th style={{ width: 90 }}>NISN</th>
                                <th style={{ textAlign: 'left' }}>Nama Siswa</th>
                                {viewMode === 'detail' && uiDateColumns.map(d => (
                                    <th key={d} style={{ width: 22, padding: '4px 2px' }}>{d.split('-')[2]}</th>
                                ))}
                                <th style={{ width: 32 }}>H</th>
                                <th style={{ width: 32 }}>T</th>
                                <th style={{ width: 32 }}>S</th>
                                <th style={{ width: 32 }}>I</th>
                                <th style={{ width: 32 }}>A</th>
                                <th style={{ width: 48 }}>%</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredData.map((s, idx) => (
                                <tr key={idx}>
                                    <td className="text-center">{idx + 1}</td>
                                    <td className="text-center" style={{ fontSize: '7pt', color: '#64748b' }}>{s.nisn}</td>
                                    <td style={{ fontWeight: 600 }}>{s.nama}</td>
                                    {viewMode === 'detail' && uiDateColumns.map(d => {
                                        const code = getCode(s.details?.[d]?.status);
                                        return (
                                            <td key={d} className={`text-center code-cell code-${code === '-' ? 'none' : code}`}>
                                                {code}
                                            </td>
                                        );
                                    })}
                                    <td className="text-center fw-bold" style={{ color: '#059669' }}>{s.hadir}</td>
                                    <td className="text-center fw-bold" style={{ color: '#ea580c' }}>{s.terlambat || 0}</td>
                                    <td className="text-center fw-bold" style={{ color: '#d97706' }}>{s.sakit}</td>
                                    <td className="text-center fw-bold" style={{ color: '#2563eb' }}>{s.izin}</td>
                                    <td className="text-center fw-bold" style={{ color: '#e11d48' }}>{s.alpha}</td>
                                    <td className="text-center">
                                        <span className={`pct-badge ${getPctClass(s.persentase)}`}>{s.persentase}%</span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                            <tr>
                                <td colSpan={3 + (viewMode === 'detail' ? uiDateColumns.length : 0)} style={{ textAlign: 'right', fontWeight: 800 }}>
                                    TOTAL
                                </td>
                                <td className="text-center" style={{ color: '#059669' }}>{summary.hadir}</td>
                                <td className="text-center" style={{ color: '#ea580c' }}>{summary.terlambat}</td>
                                <td className="text-center" style={{ color: '#d97706' }}>{summary.sakit}</td>
                                <td className="text-center" style={{ color: '#2563eb' }}>{summary.izin}</td>
                                <td className="text-center" style={{ color: '#e11d48' }}>{summary.alpha}</td>
                                <td className="text-center">
                                    <span className={`pct-badge ${getPctClass(parseFloat(summary.avg))}`}>{summary.avg}%</span>
                                </td>
                            </tr>
                        </tfoot>
                    </table>

                    {/* SIGNATURES */}
                    <div className="print-sig-area">
                        <div className="print-sig-block">
                            <div className="sig-title">Mengetahui,<br />Kepala Sekolah</div>
                            <div className="print-sig-line"></div>
                            <div className="print-sig-name">(Nama Terang & Cap Sekolah)</div>
                        </div>
                        <div className="print-sig-block">
                            <div className="sig-title">{schoolSettings?.kota || 'Demak'}, {new Date().toLocaleDateString('id-ID', { dateStyle: 'long' })}<br />Wali Kelas,</div>
                            <div className="print-sig-line"></div>
                            <div className="print-sig-name">(Nama Terang Wali Kelas)</div>
                        </div>
                    </div>

                    <div className="print-footer-note">
                        Dokumen ini dicetak secara otomatis oleh SIAS — Sistem Informasi Absensi Siswa · {new Date().toLocaleDateString('id-ID', { dateStyle: 'long' })}
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
                                                const code = getCode(status);
                                                return (
                                                    <td key={d} className="text-center">
                                                        {code !== '-' ? <div className={`status-badge mx-auto bg-${status}`}>{code}</div> : '-'}
                                                    </td>
                                                );
                                            })}
                                            {viewMode === 'rekap' && (
                                                <>
                                                    <td className="text-center fw-bold text-success">{s.hadir}</td>
                                                    <td className="text-center fw-bold" style={{ color: '#f97316' }}>{s.terlambat || 0}</td>
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
