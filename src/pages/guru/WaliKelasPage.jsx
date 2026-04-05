import { useState, useEffect, useRef, useCallback } from 'react'
import { Users, FileText, ClipboardList, Printer, Loader2, AlertCircle, Save, CheckCircle2, Lock, Unlock, Download, X, ChevronLeft, ChevronRight, Eye, ZoomIn, ZoomOut, Activity } from 'lucide-react'
import api from '../../services/api'
import { useCustomAlert } from '../../hooks/useCustomAlert'
import RaporPrintTemplate from '../../components/RaporPrintTemplate'
import STSPrintTemplate from '../../components/STSPrintTemplate'

const STYLES = /*css*/`
  .wali-page { 
    animation: fadeIn 0.5s ease-out; 
    padding-bottom: 120px; /* space for floating dock */
  }
  @media print { 
    .no-print { display: none !important; } 
    .print-only { 
      display: block !important; 
      position: absolute !important; 
      left: 0 !important; 
      top: 0 !important; 
      width: 100% !important;
      background: white !important; 
    }
    body { background: white !important; margin: 0 !important; padding: 0 !important; }
    .wali-page { animation: none !important; transform: none !important; padding-bottom: 0 !important; }
    * { filter: none !important; box-shadow: none !important; }
  }
  .print-only { display: none; }
  
  @keyframes fadeIn { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
  @keyframes gradientShift { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
  @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-5px); } }

  /* ========================================================== */
  /*  HERO BANNER - Mesh Gradient                               */
  /* ========================================================== */
  .hero-banner {
    position: relative;
    background: linear-gradient(-45deg, #0f766e, #059669, #0ea5e9, #4338ca);
    background-size: 300% 300%;
    animation: gradientShift 15s ease infinite;
    border-radius: 28px;
    padding: 40px 48px;
    color: white;
    margin-bottom: 60px; /* space for overlapping stat cards */
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    box-shadow: 0 20px 40px -10px rgba(16,185,129,0.3);
    overflow: visible;
  }
  .hero-banner::before {
    content: ''; position: absolute; inset: 0;
    border-radius: 28px;
    background: radial-gradient(circle at top right, rgba(255,255,255,0.1), transparent 50%),
                radial-gradient(circle at bottom left, rgba(255,255,255,0.05), transparent 50%);
    pointer-events: none;
  }
  .hero-title { font-size: 2rem; font-weight: 800; margin: 0 0 8px 0; letter-spacing: -0.02em; text-shadow: 0 2px 10px rgba(0,0,0,0.1); }
  .hero-subtitle { font-size: 1.05rem; opacity: 0.9; margin: 0; font-weight: 500; display: flex; align-items: center; gap: 8px; }
  
  /* Quick Stat Cards Overlapping Banner */
  .hero-stats-container {
    position: absolute;
    bottom: -35px;
    left: 48px;
    display: flex;
    gap: 20px;
    z-index: 10;
  }
  .stat-card {
    background: rgba(255, 255, 255, 0.15);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.4);
    box-shadow: 0 10px 30px -10px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.2);
    padding: 16px 24px;
    border-radius: 20px;
    display: flex;
    align-items: center;
    gap: 16px;
    color: white;
    min-width: 180px;
    animation: float 6s ease-in-out infinite;
  }
  .stat-card:nth-child(2) { animation-delay: -2s; }
  .stat-card:nth-child(3) { animation-delay: -4s; }
  
  .stat-icon {
    width: 42px; height: 42px; border-radius: 12px;
    background: rgba(255,255,255,0.2);
    display: flex; align-items: center; justify-content: center;
    box-shadow: inset 0 2px 4px rgba(255,255,255,0.1);
  }
  .stat-info h4 { margin: 0; font-size: 1.25rem; font-weight: 800; line-height: 1.2; text-shadow: 0 2px 4px rgba(0,0,0,0.1); }
  .stat-info p { margin: 2px 0 0 0; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; opacity: 0.8; }

  /* ========================================================== */
  /*  PILL-SHAPED TAB NAVIGATION                                */
  /* ========================================================== */
  .segmented-nav {
    display: inline-flex; gap: 6px; background: var(--bg-card); padding: 6px;
    border-radius: 24px; border: 1px solid var(--border-color); margin-bottom: 24px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.03);
    overflow-x: auto; -webkit-overflow-scrolling: touch;
  }
  .tab-item {
    display: flex; align-items: center; gap: 8px; padding: 12px 24px;
    border-radius: 18px; border: none; background: transparent; cursor: pointer;
    font-weight: 700; font-size: 0.9rem; color: var(--text-secondary);
    transition: all 0.25s cubic-bezier(0.25, 1, 0.5, 1); white-space: nowrap;
    position: relative; overflow: hidden;
  }
  .tab-item:hover:not(.active) { color: var(--text-primary); background: var(--bg-hover); }
  .tab-item.active { background: linear-gradient(135deg, var(--success-500), var(--success-600)); color: white; box-shadow: 0 4px 15px rgba(16,185,129,0.3); }

  /* ========================================================== */
  /*  PREMIUM DATA TABLES                                       */
  /* ========================================================== */
  .premium-table-card {
    background: var(--bg-card); border: 1px solid var(--border-color);
    border-radius: 24px; overflow: hidden; box-shadow: 0 10px 40px -10px rgba(0,0,0,0.05);
    transition: all 0.3s ease;
  }
  .premium-table-wrapper { overflow-x: auto; -webkit-overflow-scrolling: touch; scrollbar-width: thin; }
  .premium-table { width: 100%; border-collapse: separate; border-spacing: 0; font-size: 0.875rem; }
  .premium-table th {
    background: var(--bg-base); padding: 16px 20px; text-align: left;
    font-weight: 700; color: var(--text-secondary); font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.05em;
    border-bottom: 1px solid var(--border-color); white-space: nowrap;
    position: sticky; top: 0; z-index: 5;
  }
  .premium-table td { padding: 16px 20px; border-bottom: 1px solid var(--border-color); vertical-align: middle; transition: background 0.2s; }
  .premium-table tr:last-child td { border-bottom: none; }
  .premium-table tr { transition: all 0.2s; }
  .premium-table tr:hover td { background: var(--bg-hover); }
  
  /* Sticky First Column for Student Names */
  .premium-table th:first-child, .premium-table td:first-child { 
    position: sticky; left: 0; z-index: 6; 
    background: var(--bg-card); 
    box-shadow: 4px 0 12px -4px rgba(0,0,0,0.05);
  }
  .premium-table th:first-child { z-index: 7; background: var(--bg-base); }
  .premium-table tr:hover td:first-child { background: var(--bg-hover); }

  .grade-badge {
    padding: 6px 12px; border-radius: 12px; font-weight: 700; font-size: 0.8rem;
    display: inline-flex; align-items: center; justify-content: center; min-width: 44px;
    background: var(--success-50); color: var(--success-700); border: 1px solid var(--success-200);
  }
  .grade-badge.danger { background: #fef2f2; color: #ef4444; border-color: #fca5a5; }
  
  .avg-cell { background: var(--success-50) !important; color: var(--success-700); font-weight: 800; font-size: 0.95rem; }

  /* Inputs & Textareas */
  .modern-textarea {
    width: 100%; min-height: 60px; padding: 12px 16px; border-radius: 14px;
    border: 1px solid var(--border-color); background: var(--bg-base);
    color: var(--text-primary); font-size: 0.875rem; resize: vertical; transition: all 0.2s cubic-bezier(0.25, 1, 0.5, 1);
    box-shadow: inset 0 2px 4px rgba(0,0,0,0.02);
  }
  .modern-textarea:focus { border-color: var(--success-500); outline: none; background: var(--bg-card); box-shadow: 0 0 0 4px rgba(16,185,129,0.1); }
  
  .modern-input {
    width: 100%; padding: 10px 16px; border-radius: 12px;
    border: 1px solid var(--border-color); background: var(--bg-base);
    color: var(--text-primary); font-size: 0.875rem; transition: all 0.2s;
  }
  .modern-input:focus { border-color: var(--success-500); outline: none; box-shadow: 0 0 0 4px rgba(16,185,129,0.1); }

  /* ========================================================== */
  /*  FLOATING ACTION BAR (Dock)                                */
  /* ========================================================== */
  .floating-action-bar {
    position: fixed; bottom: 32px; left: 50%; transform: translateX(-50%);
    background: rgba(255, 255, 255, 0.85); backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px);
    border: 1px solid rgba(0,0,0,0.08); border-radius: 30px;
    padding: 8px; display: flex; gap: 8px; align-items: center;
    box-shadow: 0 16px 40px -10px rgba(0,0,0,0.15), 0 0 0 1px rgba(255,255,255,0.5) inset;
    z-index: 100; transition: all 0.3s;
  }
  [data-theme="dark"] .floating-action-bar { background: rgba(30,30,40,0.85); border-color: rgba(255,255,255,0.1); box-shadow: 0 16px 40px -10px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05) inset; }
  
  .fab-btn {
    display: flex; align-items: center; gap: 8px; padding: 12px 24px;
    border-radius: 22px; border: none; font-weight: 700; font-size: 0.95rem;
    cursor: pointer; transition: all 0.2s cubic-bezier(0.25, 1, 0.5, 1);
  }
  .fab-btn.primary { background: linear-gradient(135deg, var(--success-500), var(--success-600)); color: white; box-shadow: 0 4px 15px rgba(16,185,129,0.3); }
  .fab-btn.primary:hover:not(:disabled) { transform: translateY(-2px) scale(1.02); box-shadow: 0 8px 25px rgba(16,185,129,0.4); }
  .fab-btn.secondary { background: var(--bg-card); color: var(--text-primary); border: 1px solid var(--border-color); }
  .fab-btn.secondary:hover { background: var(--bg-hover); transform: translateY(-2px); }
  
  /* Misc */
  .mini-action-btn {
    padding: 8px; border-radius: 12px; border: 1px solid var(--border-color);
    background: var(--bg-base); color: var(--text-secondary); cursor: pointer; transition: all 0.2s;
    display: inline-flex; align-items: center; justify-content: center;
  }
  .mini-action-btn:hover { background: var(--success-50); color: var(--success-600); border-color: var(--success-200); transform: translateY(-2px); }

  .empty-state { text-align: center; padding: 100px 20px; color: var(--text-muted); }
  .empty-state svg { margin-bottom: 24px; opacity: 0.2; }


  /* ========================================================== */
  /*  PRINT PREVIEW CENTER — Modern Overlay                     */
  /* ========================================================== */
  .print-preview-overlay {
    position: fixed; inset: 0; z-index: 9999;
    background: linear-gradient(135deg, rgba(15,23,42,0.95), rgba(30,41,59,0.92));
    backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);
    display: flex; flex-direction: column;
    animation: fadeIn 0.25s ease-out;
  }

  /* Top Toolbar */
  .pv-toolbar {
    display: flex; align-items: center; justify-content: space-between;
    padding: 12px 20px; gap: 16px;
    background: rgba(255,255,255,0.06);
    border-bottom: 1px solid rgba(255,255,255,0.08);
    backdrop-filter: blur(12px);
    flex-shrink: 0;
  }
  .pv-toolbar-left { display: flex; align-items: center; gap: 12px; }
  .pv-toolbar-center { display: flex; align-items: center; gap: 12px; }
  .pv-toolbar-right { display: flex; align-items: center; gap: 8px; }

  .pv-doc-badge {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 5px 14px; border-radius: 20px; font-size: 0.72rem;
    font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px;
  }
  .pv-doc-badge.rapor { background: rgba(16,185,129,0.2); color: #6ee7b7; }
  .pv-doc-badge.sts { background: rgba(59,130,246,0.2); color: #93c5fd; }

  .pv-title { color: white; font-weight: 700; font-size: 0.95rem; margin: 0; }
  .pv-subtitle { color: rgba(255,255,255,0.5); font-size: 0.78rem; margin: 0; font-weight: 500; }

  .pv-nav-btn {
    display: flex; align-items: center; justify-content: center;
    width: 34px; height: 34px; border-radius: 10px;
    background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.1);
    color: white; cursor: pointer; transition: all 0.2s;
  }
  .pv-nav-btn:hover:not(:disabled) { background: rgba(255,255,255,0.15); }
  .pv-nav-btn:disabled { opacity: 0.3; cursor: not-allowed; }

  .pv-counter {
    color: rgba(255,255,255,0.7); font-size: 0.8rem; font-weight: 600;
    min-width: 70px; text-align: center;
  }

  .pv-action-btn {
    display: flex; align-items: center; gap: 8px; padding: 8px 18px;
    border-radius: 10px; border: none; font-weight: 700; font-size: 0.82rem;
    cursor: pointer; transition: all 0.2s;
  }
  .pv-action-btn.print {
    background: linear-gradient(135deg, #10b981, #059669); color: white;
    box-shadow: 0 4px 15px rgba(16,185,129,0.3);
  }
  .pv-action-btn.print:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(16,185,129,0.4); }
  .pv-action-btn.close {
    background: rgba(255,255,255,0.08); color: rgba(255,255,255,0.8);
    border: 1px solid rgba(255,255,255,0.1);
  }
  .pv-action-btn.close:hover { background: rgba(255,255,255,0.15); color: white; }

  /* Body Layout (Sidebar + Canvas) */
  .pv-body { display: flex; flex: 1; overflow: hidden; }

  /* Sidebar */
  .pv-sidebar {
    width: 240px; flex-shrink: 0;
    background: rgba(255,255,255,0.04);
    border-right: 1px solid rgba(255,255,255,0.06);
    display: flex; flex-direction: column;
    overflow: hidden;
  }
  .pv-sidebar-header {
    padding: 14px 16px; font-size: 0.72rem; font-weight: 700;
    color: rgba(255,255,255,0.4); text-transform: uppercase; letter-spacing: 1px;
    border-bottom: 1px solid rgba(255,255,255,0.06);
  }
  .pv-sidebar-list {
    flex: 1; overflow-y: auto; padding: 8px;
    scrollbar-width: thin; scrollbar-color: rgba(255,255,255,0.1) transparent;
  }
  .pv-sidebar-item {
    display: flex; align-items: center; gap: 10px;
    padding: 10px 12px; border-radius: 10px;
    cursor: pointer; transition: all 0.15s;
    color: rgba(255,255,255,0.6); font-size: 0.82rem; font-weight: 500;
    margin-bottom: 2px; border: 1px solid transparent;
  }
  .pv-sidebar-item:hover { background: rgba(255,255,255,0.06); color: white; }
  .pv-sidebar-item.active {
    background: rgba(16,185,129,0.15); color: #6ee7b7;
    border-color: rgba(16,185,129,0.3); font-weight: 700;
  }
  .pv-sidebar-num {
    width: 24px; height: 24px; border-radius: 7px;
    display: flex; align-items: center; justify-content: center;
    font-size: 0.7rem; font-weight: 800;
    background: rgba(255,255,255,0.08); color: rgba(255,255,255,0.5);
    flex-shrink: 0;
  }
  .pv-sidebar-item.active .pv-sidebar-num {
    background: rgba(16,185,129,0.3); color: #6ee7b7;
  }
  .pv-sidebar-name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

  /* Canvas Area */
  .pv-canvas {
    flex: 1; overflow-y: auto; padding: 32px;
    display: flex; flex-direction: column; align-items: center; gap: 32px;
    scroll-behavior: smooth;
    background: radial-gradient(ellipse at center, rgba(30,41,59,0.3) 0%, transparent 70%);
  }
  .pv-canvas::-webkit-scrollbar { width: 8px; }
  .pv-canvas::-webkit-scrollbar-track { background: transparent; }
  .pv-canvas::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.12); border-radius: 4px; }

  .pv-page-wrapper {
    width: 210mm;
    background: white;
    border-radius: 8px;
    box-shadow: 0 25px 60px -12px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.05);
    overflow: hidden;
    position: relative;
    flex-shrink: 0;
    transition: transform 0.2s ease;
  }
  .pv-page-wrapper:hover { transform: scale(1.002); }

  .pv-page-label {
    position: absolute; top: -28px; left: 0;
    font-size: 0.72rem; font-weight: 700; color: rgba(255,255,255,0.3);
    display: flex; align-items: center; gap: 8px;
  }

  /* Loading Skeleton */
  .pv-skeleton {
    background: linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 75%);
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite;
    border-radius: 8px;
  }

  /* Zoom Controls */
  .pv-zoom-controls {
    position: fixed; bottom: 24px; right: 24px;
    display: flex; gap: 4px; z-index: 10001;
    background: rgba(30,41,59,0.9); border-radius: 12px;
    padding: 4px; border: 1px solid rgba(255,255,255,0.1);
    backdrop-filter: blur(12px);
  }
  .pv-zoom-btn {
    width: 36px; height: 36px; border-radius: 8px;
    display: flex; align-items: center; justify-content: center;
    background: transparent; border: none;
    color: rgba(255,255,255,0.7); cursor: pointer; transition: all 0.15s;
  }
  .pv-zoom-btn:hover { background: rgba(255,255,255,0.1); color: white; }
  .pv-zoom-label {
    display: flex; align-items: center; justify-content: center;
    min-width: 50px; font-size: 0.75rem; font-weight: 700;
    color: rgba(255,255,255,0.5);
  }

  /* Keyboard shortcut hint */
  .pv-kbd-hint {
    position: fixed; bottom: 24px; left: 24px;
    display: flex; gap: 12px; z-index: 10001;
    color: rgba(255,255,255,0.25); font-size: 0.7rem; font-weight: 500;
  }
  .pv-kbd { 
    display: inline-flex; align-items: center; gap: 4px;
    padding: 2px 7px; border-radius: 5px;
    background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.08);
    font-family: monospace; font-size: 0.65rem; font-weight: 700;
  }

  @media (max-width: 767px) {
    .wali-header { padding: 20px; }
    .action-footer { flex-direction: column; width: 100%; }
    .action-footer button { width: 100%; justify-content: center; }
    .pv-sidebar { display: none; }
    .pv-canvas { padding: 16px; }
    .pv-page-wrapper { width: 100%; min-width: 0; }
    .pv-toolbar { padding: 10px 12px; flex-wrap: wrap; }
    .pv-kbd-hint { display: none; }
  }
`

export default function WaliKelasPage() {
    const { showAlert, showConfirm } = useCustomAlert()
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [info, setInfo] = useState(null)
    const [activeTab, setActiveTab] = useState('leger')
    const [printData, setPrintData] = useState(null)
    const [showPreview, setShowPreview] = useState(false)
    const [printMode, setPrintMode] = useState('rapor') // 'rapor' or 'sts'
    const [previewLoading, setPreviewLoading] = useState(false)

    // Preview navigation state
    const [activeStudentIdx, setActiveStudentIdx] = useState(0)
    const [previewZoom, setPreviewZoom] = useState(100)
    const canvasRef = useRef(null)
    const pageRefs = useRef([])

    // Data state
    const [students, setStudents] = useState([])
    const [mapelList, setMapelList] = useState([])
    const [attendance, setAttendance] = useState([])
    const [catatanList, setCatatanList] = useState([])
    const [ekskulList, setEkskulList] = useState([])

    useEffect(() => {
        checkStatus()
    }, [])

    // Keyboard shortcuts
    useEffect(() => {
        if (!showPreview) return
        const handler = (e) => {
            if (e.key === 'Escape') { setShowPreview(false); return }
            if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
                e.preventDefault()
                window.print()
                return
            }
            if (Array.isArray(printData) && printData.length > 1) {
                if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
                    e.preventDefault()
                    setActiveStudentIdx(i => Math.max(0, i - 1))
                }
                if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
                    e.preventDefault()
                    setActiveStudentIdx(i => Math.min(printData.length - 1, i + 1))
                }
            }
        }
        window.addEventListener('keydown', handler)
        return () => window.removeEventListener('keydown', handler)
    }, [showPreview, printData])

    // Auto-scroll to active student
    useEffect(() => {
        if (showPreview && Array.isArray(printData) && pageRefs.current[activeStudentIdx]) {
            pageRefs.current[activeStudentIdx].scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
    }, [activeStudentIdx, showPreview])

    const checkStatus = async () => {
        try {
            setLoading(true)
            const res = await api.get('/guru/wali-kelas/check')
            if (res.data.isWaliKelas) {
                setInfo(res.data)
                loadLeger(res.data)
            } else {
                setLoading(false)
            }
        } catch {
            setLoading(false)
        }
    }

    const loadLeger = async (ctx) => {
        try {
            const res = await api.get('/guru/wali-kelas/leger', {
                params: {
                    kelas_id: ctx.kelas_id,
                    tahun_ajaran_id: ctx.tahun_ajaran_id,
                    semester: ctx.semester
                }
            })
            setStudents(res.data.students)
            setMapelList(res.data.mapelList)
            setCatatanList(res.data.students.map(s => ({ siswa_id: s.id, catatan: s.catatan || '' })))
            setLoading(false)
        } catch {
            setLoading(false)
        }
    }

    const loadAttendance = async () => {
        try {
            const res = await api.get('/guru/wali-kelas/attendance', {
                params: {
                    kelas_id: info.kelas_id,
                    tahun_ajaran_id: info.tahun_ajaran_id,
                    semester: info.semester
                }
            })
            setAttendance(res.data)
        } catch { /* silent */ }
    }

    const loadEkskul = async () => {
        if (!info) return
        try {
            const res = await api.get('/guru/wali-kelas/ekskul', {
                params: {
                    kelas_id: info.kelas_id,
                    tahun_ajaran_id: info.tahun_ajaran_id,
                    semester: info.semester
                }
            })
            const baseList = students.map(s => {
                const found = res.data.find(e => e.siswa_id === s.id)
                return { 
                    siswa_id: s.id, 
                    nama_siswa: s.nama,
                    nama_ekskul: found?.nama_ekskul || '',
                    keterangan: found?.keterangan || ''
                }
            })
            setEkskulList(baseList)
        } catch { /* silent */ }
    }

    useEffect(() => {
        if (activeTab === 'attendance' && info) loadAttendance()
        if (activeTab === 'ekskul' && info) loadEkskul()
    }, [activeTab])

    const handleSaveCatatan = async () => {
        try {
            setSaving(true)
            await api.post('/guru/wali-kelas/catatan', {
                kelas_id: info.kelas_id,
                tahun_ajaran_id: info.tahun_ajaran_id,
                semester: info.semester,
                catatanList
            })
            showAlert('Berhasil', 'Catatan wali kelas disimpan', 'success')
        } catch {
            showAlert('Error', 'Gagal menyimpan catatan', 'error')
        } finally { setSaving(false) }
    }

    const handleSaveEkskul = async () => {
        try {
            setSaving(true)
            await api.post('/guru/wali-kelas/ekskul', {
                kelas_id: info.kelas_id,
                tahun_ajaran_id: info.tahun_ajaran_id,
                semester: info.semester,
                ekskulList
            })
            showAlert('Berhasil', 'Data ekstrakurikuler disimpan', 'success')
        } catch {
            showAlert('Error', 'Gagal menyimpan data ekskul', 'error')
        } finally { setSaving(false) }
    }

    const handleLockGrades = async (lock) => {
        const title = lock ? 'Kunci Nilai?' : 'Buka Kunci Nilai?'
        const msg = lock
            ? 'Nilai yang dikunci tidak dapat diedit lagi oleh Guru Mapel.'
            : 'Buka kunci agar Guru Mapel dapat melakukan perbaikan nilai.'

        const ok = await showConfirm(title, msg, lock ? 'warning' : 'info')
        if (!ok) return

        try {
            setSaving(true)
            await api.post('/guru/wali-kelas/lock', {
                kelas_id: info.kelas_id,
                tahun_ajaran_id: info.tahun_ajaran_id,
                semester: info.semester,
                lock
            })
            showAlert('Berhasil', lock ? 'Nilai rombel telah dikunci' : 'Kunci nilai telah dibuka', 'success')
            checkStatus() // Refresh
        } catch {
            showAlert('Error', 'Gagal memproses permintaan', 'error')
        } finally { setSaving(false) }
    }

    const handlePrintRapor = async (siswaId, mode = 'rapor') => {
        setPreviewLoading(true)
        setShowPreview(true)
        setPrintMode(mode)
        setActiveStudentIdx(0)

        if (siswaId === 'all') {
            try {
                const res = await api.get('/guru/wali-kelas/rapor-batch', {
                    params: {
                        kelas_id: info.kelas_id,
                        tahun_ajaran_id: info.tahun_ajaran_id,
                        semester: info.semester
                    }
                })
                setPrintData(res.data)
            } catch {
                showAlert('Error', 'Gagal memuat data cetak masal', 'error')
                setShowPreview(false)
            } finally { setPreviewLoading(false) }
            return
        }

        try {
            const res = await api.get(`/guru/wali-kelas/rapor/${siswaId}`, {
                params: {
                    kelas_id: info.kelas_id,
                    tahun_ajaran_id: info.tahun_ajaran_id,
                    semester: info.semester
                }
            })
            setPrintData(res.data)
        } catch {
            showAlert('Error', `Gagal memuat data ${mode === 'sts' ? 'STS' : 'rapor'}`, 'error')
            setShowPreview(false)
        } finally {
            setPreviewLoading(false)
        }
    }

    const triggerPrint = () => { window.print() }
    const isBatch = Array.isArray(printData)
    const batchCount = isBatch ? printData.length : 1

    const closePreview = useCallback(() => {
        setShowPreview(false)
        setPrintData(null)
        setActiveStudentIdx(0)
        setPreviewZoom(100)
    }, [])

    if (loading) return <div className="wali-page"><style>{STYLES}</style><div className="empty-state"><Loader2 size={40} className="spin" /><p>Memverifikasi status Wali Kelas...</p></div></div>

    if (!info || !info.isWaliKelas) {
        return (
            <div className="wali-page">
                <style>{STYLES}</style>
                <div className="empty-state">
                    <AlertCircle size={64} />
                    <h3>Akses Terbatas</h3>
                    <p>Halaman ini hanya dapat diakses oleh Guru yang ditugaskan sebagai Wali Kelas pada tahun ajaran aktif.</p>
                </div>
            </div>
        )
    }

    const isAllLocked = students.every(s => Object.values(s.mapel_scores).every(n => n.is_locked))

    const renderPreviewTemplate = (data, isSingle = false) => {
        if (printMode === 'sts') {
            return <STSPrintTemplate 
                data={isSingle ? data : null} 
                batchData={!isSingle ? data : null} 
            />
        }
        return <RaporPrintTemplate 
            data={isSingle ? data : null} 
            batchData={!isSingle ? data : null} 
        />
    }

    // Compute stats for Hero Banner
    const avgClass = students.length > 0 
        ? (students.reduce((acc, s) => acc + (s.rata_rata || 0), 0) / students.length).toFixed(1) 
        : 0;
    
    const totalAlpha = attendance.reduce((acc, a) => acc + (a.alpha || 0), 0);

    return (
        <div className="wali-page">
            <style>{STYLES}</style>

            <div className="no-print">
                <div className="hero-banner">
                    <div>
                        <h2 className="hero-title">🏫 Panel Wali Kelas — {info.kelas_nama}</h2>
                        <p className="hero-subtitle">{info.tahun_ajaran} • Semester {info.semester}</p>
                    </div>
                    
                    <div className="hero-stats-container">
                        <div className="stat-card">
                            <div className="stat-icon"><Users size={20} color="#6ee7b7" /></div>
                            <div className="stat-info">
                                <h4>{students.length}</h4>
                                <p>Total Siswa</p>
                            </div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon"><Activity size={20} color="#93c5fd" /></div>
                            <div className="stat-info">
                                <h4>{avgClass}</h4>
                                <p>Rata-rata Kelas</p>
                            </div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon"><AlertCircle size={20} color="#fca5a5" /></div>
                            <div className="stat-info">
                                <h4>{totalAlpha}</h4>
                                <p>Total Kealpaan</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="segmented-nav">
                    <button className={`tab-item ${activeTab === 'leger' ? 'active' : ''}`} onClick={() => setActiveTab('leger')}>
                        <ClipboardList size={16} /> Data Leger
                    </button>
                    <button className={`tab-item ${activeTab === 'attendance' ? 'active' : ''}`} onClick={() => setActiveTab('attendance')}>
                        <Users size={16} /> Kehadiran
                    </button>
                    <button className={`tab-item ${activeTab === 'ekskul' ? 'active' : ''}`} onClick={() => setActiveTab('ekskul')}>
                        <CheckCircle2 size={16} /> Ekstrakurikuler
                    </button>
                    <button className={`tab-item ${activeTab === 'catatan' ? 'active' : ''}`} onClick={() => setActiveTab('catatan')}>
                        <FileText size={16} /> Catatan & Rapor
                    </button>
                </div>

                {activeTab === 'leger' && (
                    <div className="premium-table-card fade-in">
                        <div className="premium-table-wrapper">
                            <table className="premium-table">
                                <thead>
                                    <tr>
                                        <th>Siswa</th>
                                        {mapelList.map(m => <th key={m.id} style={{ writingMode: 'vertical-lr', transform: 'rotate(180deg)' }}>{m.nama}</th>)}
                                        <th style={{ background: 'var(--success-50)' }}>Rata-rata</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {students.map(s => (
                                        <tr key={s.id}>
                                            <td style={{ fontWeight: 600 }}>{s.nama}</td>
                                            {mapelList.map(m => {
                                                const score = s.mapel_scores[m.id]?.nilai_akhir || 0
                                                return (
                                                    <td key={m.id}>
                                                        <span className={`grade-badge ${score < 75 ? 'danger' : ''}`}>
                                                            {score || '-'}
                                                        </span>
                                                    </td>
                                                )
                                            })}
                                            <td className="avg-cell">
                                                {s.rata_rata || 0}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'attendance' && (
                    <div className="premium-table-card fade-in">
                        <div className="premium-table-wrapper">
                            <table className="premium-table">
                                <thead>
                                    <tr>
                                        <th>Siswa</th>
                                        <th>Sakit</th>
                                        <th>Izin</th>
                                        <th>Alpha</th>
                                        <th>Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {attendance.map(a => (
                                        <tr key={a.siswa_id}>
                                            <td style={{ fontWeight: 600 }}>{a.nama}</td>
                                            <td><span className="att-pill"><b>{a.sakit}</b> hari</span></td>
                                            <td><span className="att-pill"><b>{a.izin}</b> hari</span></td>
                                            <td><span className="att-pill"><b style={{ color: '#ef4444' }}>{a.alpha}</b> hari</span></td>
                                            <td><span className="grade-badge">{a.sakit + a.izin + a.alpha}</span></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div style={{ padding: '16px 20px', background: 'var(--bg-base)', display: 'flex', alignItems: 'center', gap: 10, borderTop: '1px solid var(--border-color)' }}>
                            <AlertCircle size={16} className="text-muted" />
                            <p className="small text-muted m-0">Data kehadiran ditarik otomatis dari jurnal harian guru pengajar.</p>
                        </div>
                    </div>
                )}

                {activeTab === 'ekskul' && (
                    <div className="premium-table-card fade-in">
                        <div className="premium-table-wrapper">
                            <table className="premium-table">
                                <thead>
                                    <tr>
                                        <th style={{ width: '25%' }}>Siswa</th>
                                        <th style={{ width: '30%' }}>Nama Ekstrakurikuler</th>
                                        <th>Keterangan / Predikat</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {students.map(s => {
                                        const rowEkskul = ekskulList.find(e => e.siswa_id === s.id)
                                        return (
                                            <tr key={s.id}>
                                                <td style={{ fontWeight: 600 }}>{s.nama}</td>
                                                <td>
                                                    <input
                                                        type="text"
                                                        className="modern-input"
                                                        placeholder="Contoh: Pramuka, OSIS..."
                                                        value={rowEkskul?.nama_ekskul || ''}
                                                        onChange={(e) => {
                                                            const newList = ekskulList.map(item => item.siswa_id === s.id ? { ...item, nama_ekskul: e.target.value } : item)
                                                            setEkskulList(newList)
                                                        }}
                                                    />
                                                </td>
                                                <td>
                                                    <textarea
                                                        className="modern-textarea"
                                                        style={{ minHeight: '40px' }}
                                                        placeholder="Contoh: Sangat aktif dalam kegiatan..."
                                                        value={rowEkskul?.keterangan || ''}
                                                        onChange={(e) => {
                                                            const newList = ekskulList.map(item => item.siswa_id === s.id ? { ...item, keterangan: e.target.value } : item)
                                                            setEkskulList(newList)
                                                        }}
                                                    />
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'catatan' && (
                    <div className="premium-table-card fade-in">
                        <div className="premium-table-wrapper">
                            <table className="premium-table">
                                <thead>
                                    <tr>
                                        <th style={{ width: '25%' }}>Siswa</th>
                                        <th>Catatan Wali Kelas</th>
                                        <th style={{ width: '10%' }}>Cetak</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {students.map(s => {
                                        const rowCatatan = catatanList.find(c => c.siswa_id === s.id)
                                        return (
                                            <tr key={s.id}>
                                                <td style={{ fontWeight: 600 }}>{s.nama}</td>
                                                <td>
                                                    <textarea
                                                        className="modern-textarea"
                                                        placeholder="Tulis catatan perkembangan siswa..."
                                                        value={rowCatatan?.catatan || ''}
                                                        onChange={(e) => {
                                                            const newList = catatanList.map(c => c.siswa_id === s.id ? { ...c, catatan: e.target.value } : c)
                                                            setCatatanList(newList)
                                                        }}
                                                    />
                                                </td>
                                                <td style={{ textAlign: 'center' }}>
                                                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                                        <button 
                                                            className="mini-action-btn" 
                                                            onClick={() => handlePrintRapor(s.id, 'sts')} 
                                                            title="Cetak STS"
                                                            style={{ color: 'var(--primary-600)' }}
                                                        >
                                                            <FileText size={18} />
                                                        </button>
                                                        <button 
                                                            className="mini-action-btn" 
                                                            onClick={() => handlePrintRapor(s.id, 'rapor')} 
                                                            title="Cetak Rapor"
                                                        >
                                                            <Printer size={18} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* ========================================================== */}
                {/*  FLOATING ACTION BAR (Dock)                                */}
                {/* ========================================================== */}
                <div className="floating-action-bar">
                    {activeTab === 'catatan' && (
                        <>
                            <button className="fab-btn primary" onClick={handleSaveCatatan} disabled={saving}>
                                {saving ? <Loader2 size={18} className="spin" /> : <Save size={18} />}
                                Simpan Catatan
                            </button>
                            <div style={{ width: '1px', height: '24px', background: 'var(--border-color)', margin: '0 4px' }} />
                            <button className="fab-btn secondary" onClick={() => handlePrintRapor('all', 'sts')} disabled={saving}>
                                <Printer size={16} /> Masal STS
                            </button>
                            <button className="fab-btn secondary" onClick={() => handlePrintRapor('all', 'rapor')} disabled={saving}>
                                <Printer size={16} /> Masal Rapor
                            </button>
                        </>
                    )}
                    {activeTab === 'ekskul' && (
                         <button className="fab-btn primary" onClick={handleSaveEkskul} disabled={saving}>
                            {saving ? <Loader2 size={18} className="spin" /> : <Save size={18} />}
                            Simpan Data Ekstrakurikuler
                        </button>
                    )}
                    {(activeTab === 'leger' || activeTab === 'attendance') && (
                        <>
                            {isAllLocked ? (
                                <button className="fab-btn secondary" onClick={() => handleLockGrades(false)} disabled={saving}>
                                    <Unlock size={18} /> Buka Kunci
                                </button>
                            ) : (
                                <button className="fab-btn secondary" style={{ color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.3)' }} onClick={() => handleLockGrades(true)} disabled={saving}>
                                    <Lock size={18} /> Kunci Semua Nilai
                                </button>
                            )}
                            <div style={{ width: '1px', height: '24px', background: 'var(--border-color)', margin: '0 4px' }} />
                            <button className="fab-btn secondary" onClick={() => showAlert('Info', 'Fitur export Excel sedang disiapkan.', 'info')}>
                                <Download size={18} /> Leger
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* ============================================ */}
            {/* MODERN PRINT PREVIEW CENTER                  */}
            {/* ============================================ */}
            {showPreview && (
                <div className="print-preview-overlay no-print">
                    {/* Toolbar */}
                    <div className="pv-toolbar">
                        <div className="pv-toolbar-left">
                            <div className={`pv-doc-badge ${printMode}`}>
                                <Eye size={12} />
                                {printMode === 'sts' ? 'STS' : 'Rapor Merdeka'}
                            </div>
                            <div>
                                <p className="pv-title">
                                    {isBatch 
                                        ? `Cetak Masal — ${info.kelas_nama}`
                                        : `Rapor — ${printData?.student?.nama || 'Siswa'}`
                                    }
                                </p>
                                <p className="pv-subtitle">
                                    {info.tahun_ajaran} • Semester {info.semester}
                                </p>
                            </div>
                        </div>

                        {/* Navigation (batch only) */}
                        {isBatch && printData.length > 1 && (
                            <div className="pv-toolbar-center">
                                <button 
                                    className="pv-nav-btn" 
                                    onClick={() => setActiveStudentIdx(i => Math.max(0, i - 1))}
                                    disabled={activeStudentIdx === 0}
                                    title="Siswa sebelumnya (←)"
                                >
                                    <ChevronLeft size={16} />
                                </button>
                                <span className="pv-counter">
                                    {activeStudentIdx + 1} / {printData.length}
                                </span>
                                <button 
                                    className="pv-nav-btn" 
                                    onClick={() => setActiveStudentIdx(i => Math.min(printData.length - 1, i + 1))}
                                    disabled={activeStudentIdx === printData.length - 1}
                                    title="Siswa berikutnya (→)"
                                >
                                    <ChevronRight size={16} />
                                </button>
                            </div>
                        )}

                        <div className="pv-toolbar-right">
                            <button className="pv-action-btn close" onClick={closePreview}>
                                <X size={16} /> Tutup
                            </button>
                            <button className="pv-action-btn print" onClick={triggerPrint} disabled={previewLoading}>
                                <Printer size={16} /> Cetak Sekarang
                            </button>
                        </div>
                    </div>

                    {/* Body */}
                    <div className="pv-body">
                        {/* Sidebar (batch only) */}
                        {isBatch && printData.length > 1 && (
                            <div className="pv-sidebar">
                                <div className="pv-sidebar-header">
                                    Daftar Siswa ({printData.length})
                                </div>
                                <div className="pv-sidebar-list">
                                    {printData.map((d, idx) => (
                                        <div
                                            key={idx}
                                            className={`pv-sidebar-item ${idx === activeStudentIdx ? 'active' : ''}`}
                                            onClick={() => setActiveStudentIdx(idx)}
                                            style={{ animationDelay: `${idx * 30}ms`, animation: 'slideInRight 0.3s ease-out forwards' }}
                                        >
                                            <span className="pv-sidebar-num">{idx + 1}</span>
                                            <span className="pv-sidebar-name">{d.student?.nama}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Canvas */}
                        <div className="pv-canvas" ref={canvasRef}>
                            {previewLoading ? (
                                <>
                                    <div className="pv-page-wrapper" style={{ height: '297mm' }}>
                                        <div className="pv-skeleton" style={{ width: '100%', height: '100%' }} />
                                    </div>
                                </>
                            ) : isBatch ? (
                                printData.map((d, idx) => (
                                    <div 
                                        key={idx} 
                                        ref={el => pageRefs.current[idx] = el}
                                        style={{ position: 'relative', transform: `scale(${previewZoom / 100})`, transformOrigin: 'top center' }}
                                    >
                                        <div className="pv-page-label">
                                            📄 {idx + 1}. {d.student?.nama}
                                        </div>
                                        <div className="pv-page-wrapper">
                                            {printMode === 'sts' 
                                                ? <STSPrintTemplate data={d} />
                                                : <RaporPrintTemplate data={d} />
                                            }
                                        </div>
                                    </div>
                                ))
                            ) : printData ? (
                                <div style={{ transform: `scale(${previewZoom / 100})`, transformOrigin: 'top center' }}>
                                    <div className="pv-page-wrapper">
                                        {printMode === 'sts' 
                                            ? <STSPrintTemplate data={printData} />
                                            : <RaporPrintTemplate data={printData} />
                                        }
                                    </div>
                                </div>
                            ) : null}
                        </div>
                    </div>

                    {/* Zoom Controls */}
                    <div className="pv-zoom-controls">
                        <button className="pv-zoom-btn" onClick={() => setPreviewZoom(z => Math.max(50, z - 10))} title="Zoom Out">
                            <ZoomOut size={16} />
                        </button>
                        <span className="pv-zoom-label">{previewZoom}%</span>
                        <button className="pv-zoom-btn" onClick={() => setPreviewZoom(z => Math.min(150, z + 10))} title="Zoom In">
                            <ZoomIn size={16} />
                        </button>
                    </div>

                    {/* Keyboard Hints */}
                    <div className="pv-kbd-hint">
                        <span><span className="pv-kbd">Esc</span> Tutup</span>
                        <span><span className="pv-kbd">Ctrl+P</span> Cetak</span>
                        {isBatch && <span><span className="pv-kbd">← →</span> Navigasi</span>}
                    </div>
                </div>
            )}

            <div className="print-only">
                {printData && (
                    printMode === 'sts' ? (
                        <STSPrintTemplate 
                            data={!Array.isArray(printData) ? printData : null} 
                            batchData={Array.isArray(printData) ? printData : null} 
                        />
                    ) : (
                        <RaporPrintTemplate 
                            data={!Array.isArray(printData) ? printData : null} 
                            batchData={Array.isArray(printData) ? printData : null} 
                        />
                    )
                )}
            </div>
        </div>
    )
}
