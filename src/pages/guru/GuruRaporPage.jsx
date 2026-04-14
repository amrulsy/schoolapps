import { useState, useEffect, useCallback, useRef } from 'react'
import { BookOpen, Plus, Trash2, Save, Wand2, FileSpreadsheet, ListChecks, Loader2, AlertCircle, CheckCircle2, Edit3, BarChart2 } from 'lucide-react'
import api from '../../services/api'
import { useCustomAlert } from '../../hooks/useCustomAlert'

const STYLES = /*css*/`
  .rapor-page { animation: fadeIn 0.4s ease-out; }
  @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

  .rapor-header {
    display: flex; align-items: center; justify-content: space-between;
    background: linear-gradient(135deg, var(--primary-600), var(--primary-800));
    padding: 24px 32px; border-radius: 24px; color: white; margin-bottom: 24px;
    flex-wrap: wrap; gap: 16px;
  }
  .rapor-header h2 { font-size: 1.4rem; font-weight: 700; margin: 0; }
  .rapor-header p { opacity: 0.85; margin: 4px 0 0 0; font-size: 0.9rem; }

  .selector-bar {
    display: flex; gap: 12px; margin-bottom: 24px; flex-wrap: wrap; align-items: center;
  }
  .selector-bar select {
    padding: 10px 16px; border-radius: 12px; border: 1px solid var(--border-color);
    background: var(--bg-card); color: var(--text-primary); font-size: 0.9rem;
    min-width: 0; flex: 1;
  }

  .tab-bar {
    display: flex; gap: 4px; background: var(--bg-card); padding: 4px;
    border-radius: 16px; border: 1px solid var(--border-color); margin-bottom: 24px;
    overflow-x: auto; -webkit-overflow-scrolling: touch;
  }
  .tab-btn {
    display: flex; align-items: center; gap: 8px; padding: 10px 20px;
    border-radius: 12px; border: none; background: transparent; cursor: pointer;
    font-weight: 600; font-size: 0.85rem; color: var(--text-secondary);
    transition: all 0.2s; white-space: nowrap;
  }
  .tab-btn.active { background: var(--primary-600); color: white; box-shadow: 0 2px 8px rgba(59,130,246,0.3); }

  /* TP Management */
  .tp-card {
    background: var(--bg-card); border: 1px solid var(--border-color);
    border-radius: 16px; padding: 16px 20px; margin-bottom: 12px;
    display: flex; align-items: center; gap: 16px; transition: all 0.2s;
  }
  .tp-card:hover { border-color: var(--primary-300); box-shadow: 0 2px 8px rgba(0,0,0,0.06); }
  .tp-code { font-weight: 700; font-size: 0.95rem; color: var(--primary-600); min-width: 60px; }
  .tp-desc { flex: 1; min-width: 0; color: var(--text-primary); }
  .tp-actions { display: flex; gap: 8px; }
  .tp-actions button { padding: 6px; border-radius: 8px; border: none; cursor: pointer; background: transparent; color: var(--text-muted); transition: all 0.2s; }
  .tp-actions button:hover { background: var(--bg-hover); color: var(--text-primary); }
  .tp-actions button.delete:hover { color: #ef4444; background: rgba(239,68,68,0.1); }

  .tp-form {
    background: var(--bg-card); border: 2px dashed var(--border-color);
    border-radius: 16px; padding: 20px; margin-bottom: 12px;
    display: grid; grid-template-columns: 120px 1fr auto; gap: 12px; align-items: end;
  }
  .tp-form input, .tp-form textarea {
    padding: 10px 14px; border-radius: 10px; border: 1px solid var(--border-color);
    background: var(--bg-base); color: var(--text-primary); font-size: 0.9rem;
  }
  .tp-form textarea { resize: vertical; min-height: 40px; }

  /* Spreadsheet */
  .spreadsheet-wrapper {
    overflow-x: auto; border-radius: 16px; border: 1px solid var(--border-color);
    background: var(--bg-card); -webkit-overflow-scrolling: touch;
  }
  .spreadsheet { width: 100%; border-collapse: collapse; font-size: 0.85rem; }
  .spreadsheet th {
    background: var(--bg-base); padding: 12px 14px; text-align: center;
    font-weight: 600; font-size: 0.75rem; color: var(--text-secondary);
    text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 2px solid var(--border-color);
    position: sticky; top: 0; z-index: 2; white-space: nowrap;
  }
  .spreadsheet th:first-child { text-align: left; position: sticky; left: 0; z-index: 3; background: var(--bg-base); }
  .spreadsheet td { padding: 8px 10px; border-bottom: 1px solid var(--border-color); text-align: center; }
  .spreadsheet td:first-child { text-align: left; position: sticky; left: 0; background: var(--bg-card); z-index: 1; font-weight: 500; }
  .spreadsheet tr:hover td { background: rgba(59,130,246,0.04); }
  .spreadsheet td:first-child:hover { background: var(--bg-card); }

  .score-input {
    width: 60px; padding: 6px 8px; border-radius: 8px; border: 1.5px solid var(--border-color);
    text-align: center; font-size: 0.85rem; background: var(--bg-base); color: var(--text-primary);
    transition: all 0.2s;
  }
  .score-input:focus { border-color: var(--primary-500); outline: none; box-shadow: 0 0 0 3px rgba(59,130,246,0.15); }
  .score-input.locked { background: var(--bg-base); color: var(--text-muted); cursor: not-allowed; }
  .score-input.score-high { border-color: rgba(34,197,94,0.5); background: rgba(34,197,94,0.05); }
  .score-input.score-mid { border-color: rgba(234,179,8,0.5); background: rgba(234,179,8,0.05); }
  .score-input.score-low { border-color: rgba(239,68,68,0.4); background: rgba(239,68,68,0.05); }

  /* Grade Distribution Chart */
  .grade-dist {
    display: flex; gap: 8px; align-items: flex-end;
    background: var(--bg-card); border-radius: 16px; padding: 16px 20px;
    border: 1px solid var(--border-color); margin-top: 16px;
  }
  .grade-bar-group {
    display: flex; flex-direction: column; align-items: center; gap: 4px; flex: 1;
  }
  .grade-bar-track {
    width: 100%; height: 60px; background: var(--bg-stripe);
    border-radius: 8px; position: relative; overflow: hidden; border: 1px solid var(--border-color);
  }
  .grade-bar-fill {
    position: absolute; bottom: 0; left: 0; right: 0;
    border-radius: 6px;
    transition: height 0.6s cubic-bezier(0.16, 1, 0.3, 1);
  }
  .grade-bar-label { font-size: 0.7rem; font-weight: 800; color: var(--text-muted); text-transform: uppercase; }
  .grade-bar-count { font-size: 0.85rem; font-weight: 800; }
  .auto-save-indicator {
    display: inline-flex; align-items: center; gap: 6px;
    font-size: 0.75rem; font-weight: 600; color: var(--text-muted);
    padding: 4px 10px; background: var(--bg-stripe); border-radius: 100px;
    border: 1px solid var(--border-color);
  }

  .score-final { font-weight: 700; font-size: 0.95rem; color: var(--primary-600); }
  .score-final.low { color: #ef4444; }

  .desc-cell { max-width: 200px; }
  .desc-cell textarea {
    width: 100%; min-height: 36px; padding: 6px 8px; border-radius: 8px;
    border: 1px solid var(--border-color); font-size: 0.8rem; resize: vertical;
    background: var(--bg-base); color: var(--text-primary);
  }

  .action-bar {
    display: flex; gap: 12px; margin-top: 20px; flex-wrap: wrap;
  }
  .btn-action {
    display: flex; align-items: center; gap: 8px; padding: 12px 24px;
    border-radius: 14px; border: none; font-weight: 600; font-size: 0.9rem;
    cursor: pointer; transition: all 0.2s;
  }
  .btn-action.primary { background: var(--primary-600); color: white; }
  .btn-action.primary:hover { background: var(--primary-700); transform: translateY(-1px); box-shadow: 0 4px 12px rgba(59,130,246,0.3); }
  .btn-action.secondary { background: var(--bg-base); color: var(--text-primary); border: 1px solid var(--border-color); }
  .btn-action.secondary:hover { background: var(--bg-hover); }
  .btn-action:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }

  .empty-state {
    text-align: center; padding: 60px 20px; color: var(--text-muted);
    background: var(--bg-card); border-radius: 16px; border: 1px solid var(--border-color);
  }
  .empty-state svg { margin-bottom: 12px; opacity: 0.4; }
  .empty-state p { font-size: 0.95rem; }

  .toast-save {
    position: fixed; bottom: 30px; right: 30px; background: #10b981; color: white;
    padding: 14px 24px; border-radius: 14px; display: flex; align-items: center; gap: 10px;
    font-weight: 600; box-shadow: 0 8px 24px rgba(16,185,129,0.3); z-index: 99;
    animation: slideUp 0.3s ease-out;
  }
  @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }

  @media (max-width: 767px) {
    .rapor-header { padding: 16px 20px; border-radius: 20px; flex-direction: column; align-items: flex-start; }
    .rapor-header h2 { font-size: 1.15rem; }
    .selector-bar select { flex: 1 1 100%; }
    .tp-form { grid-template-columns: 1fr; }
    .action-bar { flex-direction: column; }
    .action-bar .btn-action { width: 100%; justify-content: center; }
    .tab-btn { padding: 8px 14px; font-size: 0.8rem; }
  }
`

export default function GuruRaporPage() {
    const { showAlert, showConfirm } = useCustomAlert()
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [autoSaving, setAutoSaving] = useState(false)
    const [showSaveToast, setShowSaveToast] = useState(false)
    const autoSaveTimer = useRef(null)
    const latestSaveState = useRef({})


    const [classes, setClasses] = useState([])
    const [tahunAjaran, setTahunAjaran] = useState(null)

    // Selection
    const [selectedClass, setSelectedClass] = useState(null)
    const [activeTab, setActiveTab] = useState('tp') // tp | input

    // TP state
    const [tps, setTps] = useState([])
    const [newTp, setNewTp] = useState({ kode: '', deskripsi: '' })
    const [editingTp, setEditingTp] = useState(null)

    // Spreadsheet state
    const [students, setStudents] = useState([])
    const [bobot, setBobot] = useState({ tp: 50, sts: 25, sas: 25 })

    // Sync state into ref for stale-closure free auto-save
    useEffect(() => {
        latestSaveState.current = { students, bobot, selectedClass, tahunAjaran }
    }, [students, bobot, selectedClass, tahunAjaran])

    useEffect(() => {
        loadMyClasses()
    }, [loadMyClasses])

    const loadMyClasses = useCallback(async () => {
        try {
            setLoading(true)
            const res = await api.get('/guru/rapor/my-classes')
            setClasses(res.data.classes)
            setTahunAjaran(res.data.tahunAjaran)
            if (res.data.classes.length > 0) {
                setSelectedClass(res.data.classes[0])
            }
        } catch {
            showAlert('Error', 'Gagal memuat data kelas', 'error')
        } finally {
            setLoading(false)
        }
    }, [showAlert])

    // Load TPs when class changes
    useEffect(() => {
        if (selectedClass && tahunAjaran) {
            loadTPs()
            if (activeTab === 'input') loadGradeData()
        }
    }, [selectedClass, tahunAjaran, loadTPs, loadGradeData, activeTab])

    useEffect(() => {
        if (selectedClass && tahunAjaran && activeTab === 'input') {
            loadGradeData()
        }
    }, [activeTab, selectedClass, tahunAjaran, loadGradeData])

    const loadTPs = useCallback(async () => {
        if (!selectedClass || !tahunAjaran) return
        try {
            const res = await api.get('/guru/rapor/tp', {
                params: {
                    mapel_id: selectedClass.mapel_id,
                    kelas_id: selectedClass.kelas_id,
                    tahun_ajaran_id: tahunAjaran.id,
                    semester: tahunAjaran.semester_aktif
                }
            })
            setTps(res.data)
        } catch { /* silent */ }
    }, [selectedClass, tahunAjaran])

    const loadGradeData = useCallback(async () => {
        if (!selectedClass || !tahunAjaran) return
        try {
            const res = await api.get(`/guru/rapor/input/${selectedClass.kelas_id}/${selectedClass.mapel_id}`, {
                params: {
                    tahun_ajaran_id: tahunAjaran.id,
                    semester: tahunAjaran.semester_aktif
                }
            })
            setStudents(res.data.students)
            if (res.data.tps) setTps(res.data.tps)
            if (res.data.bobot) setBobot(res.data.bobot)
        } catch { /* silent */ }
    }, [selectedClass, tahunAjaran])

    // TP CRUD
    const handleAddTp = async () => {
        if (!newTp.kode || !newTp.deskripsi) return showAlert('Info', 'Kode dan deskripsi TP wajib diisi', 'warning')
        try {
            await api.post('/guru/rapor/tp', {
                mapel_id: selectedClass.mapel_id,
                kelas_id: selectedClass.kelas_id,
                tahun_ajaran_id: tahunAjaran.id,
                semester: tahunAjaran.semester_aktif,
                kode: newTp.kode,
                deskripsi: newTp.deskripsi,
                sort_order: tps.length + 1
            })
            setNewTp({ kode: '', deskripsi: '' })
            loadTPs()
        } catch (err) { showAlert('Error', err.response?.data?.error || 'Gagal menambah TP', 'error') }
    }

    const handleUpdateTp = async (tp) => {
        try {
            await api.put(`/guru/rapor/tp/${tp.id}`, tp)
            setEditingTp(null)
            loadTPs()
        } catch { showAlert('Error', 'Gagal mengupdate TP', 'error') }
    }

    const handleDeleteTp = async (id) => {
        const ok = await showConfirm('Hapus TP?', 'Semua nilai siswa untuk TP ini akan ikut terhapus.', 'warning')
        if (!ok) return
        try {
            await api.delete(`/guru/rapor/tp/${id}`)
            loadTPs()
        } catch { showAlert('Error', 'Gagal menghapus TP', 'error') }
    }

    // Spreadsheet handlers
    const handleScoreChange = (studentIdx, field, value) => {
        const val = Math.min(100, Math.max(0, Number(value) || 0))
        setStudents(prev => {
            const updated = [...prev]
            if (field.startsWith('tp_')) {
                const tpId = field.replace('tp_', '')
                updated[studentIdx] = { ...updated[studentIdx], tp_scores: { ...updated[studentIdx].tp_scores, [tpId]: val } }
            } else {
                updated[studentIdx] = { ...updated[studentIdx], [field]: val }
            }
            // Recalculate
            const s = updated[studentIdx]
            const tpValues = Object.values(s.tp_scores || {}).map(Number)
            const tpAvg = tpValues.length > 0 ? tpValues.reduce((a, b) => a + b, 0) / tpValues.length : 0
            const nilaiAkhir = (tpAvg * bobot.tp / 100) + (s.sts * bobot.sts / 100) + (s.sas * bobot.sas / 100)
            updated[studentIdx].nilai_tp_rata = Number(tpAvg.toFixed(2))
            updated[studentIdx].nilai_akhir = Number(nilaiAkhir.toFixed(2))
            return updated
        })
        // Auto-save debounce
        if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current)
        autoSaveTimer.current = setTimeout(async () => {
            setAutoSaving(true)
            try {
                const state = latestSaveState.current;
                await api.post('/guru/rapor/input/save', {
                    kelas_id: state.selectedClass.kelas_id,
                    mapel_id: state.selectedClass.mapel_id,
                    tahun_ajaran_id: state.tahunAjaran.id,
                    semester: state.tahunAjaran.semester_aktif,
                    grades: state.students,
                    bobot: state.bobot
                })
                setShowSaveToast(true)
                setTimeout(() => setShowSaveToast(false), 3000)
            } catch (err) {
                console.error("Auto-save failed", err)
            } finally {
                setAutoSaving(false)
            }
        }, 2000)
    }

    const handleSave = async () => {
        try {
            setSaving(true)
            await api.post('/guru/rapor/input/save', {
                kelas_id: selectedClass.kelas_id,
                mapel_id: selectedClass.mapel_id,
                tahun_ajaran_id: tahunAjaran.id,
                semester: tahunAjaran.semester_aktif,
                grades: students,
                bobot
            })
            setShowSaveToast(true)
            setTimeout(() => setShowSaveToast(false), 3000)
        } catch (err) {
            showAlert('Error', err.response?.data?.error || 'Gagal menyimpan nilai', 'error')
        } finally { setSaving(false) }
    }

    const handleGenerateDesc = async () => {
        try {
            setSaving(true)
            const res = await api.post('/guru/rapor/generate-desc', {
                kelas_id: selectedClass.kelas_id,
                mapel_id: selectedClass.mapel_id,
                tahun_ajaran_id: tahunAjaran.id,
                semester: tahunAjaran.semester_aktif
            })
            // Apply descriptions to students
            setStudents(prev => prev.map(s => {
                const desc = res.data.descriptions.find(d => d.siswa_id === s.siswa_id)
                return desc ? { ...s, deskripsi: desc.deskripsi } : s
            }))
            showAlert('Berhasil', 'Deskripsi capaian kompetensi telah di-generate', 'success')
        } catch { showAlert('Error', 'Gagal generate deskripsi', 'error') }
        finally { setSaving(false) }
    }

    const handleDescChange = (idx, value) => {
        setStudents(prev => {
            const updated = [...prev]
            updated[idx] = { ...updated[idx], deskripsi: value }
            return updated
        })
    }

    if (loading) {
        return (
            <div className="rapor-page">
                <style>{STYLES}</style>
                <div className="empty-state"><Loader2 size={40} className="spin" /><p>Memuat data...</p></div>
            </div>
        )
    }

    if (!tahunAjaran || Object.keys(tahunAjaran).length === 0) {
        return (
            <div className="rapor-page">
                <style>{STYLES}</style>
                <div className="empty-state">
                    <AlertCircle size={48} />
                    <p>Belum ada Tahun Ajaran yang aktif. Hubungi admin.</p>
                </div>
            </div>
        )
    }

    if (classes.length === 0) {
        return (
            <div className="rapor-page">
                <style>{STYLES}</style>
                <div className="rapor-header">
                    <div><h2>📝 Input Nilai Rapor</h2><p>{tahunAjaran.tahun} — Semester {tahunAjaran.semester_aktif}</p></div>
                </div>
                <div className="empty-state">
                    <BookOpen size={48} />
                    <p>Anda belum memiliki jadwal mengajar untuk semester ini.</p>
                </div>
            </div>
        )
    }

    return (
        <div className="rapor-page">
            <style>{STYLES}</style>

            {/* Header */}
            <div className="rapor-header">
                <div>
                    <h2>📝 Input Nilai Rapor</h2>
                    <p>{tahunAjaran.tahun} — Semester {tahunAjaran.semester_aktif}</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(255,255,255,0.15)', padding: '8px 16px', borderRadius: 12 }}>
                    <FileSpreadsheet size={18} />
                    <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{classes.length} Kelas/Mapel</span>
                </div>
            </div>

            {/* Class Selector */}
            <div className="selector-bar">
                <select
                    value={selectedClass ? `${selectedClass.kelas_id}_${selectedClass.mapel_id}` : ''}
                    onChange={(e) => {
                        const [kelasId, mapelId] = e.target.value.split('_')
                        const c = classes.find(c => c.kelas_id === Number(kelasId) && c.mapel_id === Number(mapelId))
                        setSelectedClass(c)
                    }}
                >
                    {classes.map(c => (
                        <option key={`${c.kelas_id}_${c.mapel_id}`} value={`${c.kelas_id}_${c.mapel_id}`}>
                            {c.kelas_nama} — {c.mapel_nama}
                        </option>
                    ))}
                </select>
            </div>

            {/* Tab Bar */}
            <div className="tab-bar">
                <button className={`tab-btn ${activeTab === 'tp' ? 'active' : ''}`} onClick={() => setActiveTab('tp')}>
                    <ListChecks size={18} /> Tujuan Pembelajaran
                </button>
                <button className={`tab-btn ${activeTab === 'input' ? 'active' : ''}`} onClick={() => setActiveTab('input')}>
                    <FileSpreadsheet size={18} /> Input Nilai
                </button>
            </div>

            {/* Tab Content */}
            {activeTab === 'tp' && (
                <div>
                    {/* Add TP Form */}
                    <div className="tp-form">
                        <div>
                            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4, display: 'block' }}>Kode TP</label>
                            <input placeholder="TP-1" value={newTp.kode} onChange={e => setNewTp({ ...newTp, kode: e.target.value })} />
                        </div>
                        <div>
                            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4, display: 'block' }}>Deskripsi</label>
                            <input placeholder="Deskripsi tujuan pembelajaran..." value={newTp.deskripsi} onChange={e => setNewTp({ ...newTp, deskripsi: e.target.value })} />
                        </div>
                        <button className="btn-action primary" onClick={handleAddTp} style={{ height: 42 }}>
                            <Plus size={18} /> Tambah
                        </button>
                    </div>

                    {/* TP List */}
                    {tps.length === 0 ? (
                        <div className="empty-state">
                            <ListChecks size={48} />
                            <p>Belum ada Tujuan Pembelajaran. Tambahkan TP di atas.</p>
                        </div>
                    ) : tps.map(tp => (
                        <div key={tp.id} className="tp-card">
                            {editingTp === tp.id ? (
                                <>
                                    <input className="score-input" value={tp.kode} style={{ width: 80 }}
                                        onChange={e => setTps(prev => prev.map(t => t.id === tp.id ? { ...t, kode: e.target.value } : t))} />
                                    <input style={{ flex: 1, padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border-color)' }}
                                        value={tp.deskripsi}
                                        onChange={e => setTps(prev => prev.map(t => t.id === tp.id ? { ...t, deskripsi: e.target.value } : t))} />
                                    <div className="tp-actions">
                                        <button onClick={() => handleUpdateTp(tp)}><CheckCircle2 size={18} /></button>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <span className="tp-code">{tp.kode}</span>
                                    <span className="tp-desc">{tp.deskripsi}</span>
                                    <div className="tp-actions">
                                        <button onClick={() => setEditingTp(tp.id)}><Edit3 size={16} /></button>
                                        <button className="delete" onClick={() => handleDeleteTp(tp.id)}><Trash2 size={16} /></button>
                                    </div>
                                </>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {activeTab === 'input' && (
                <div>
                    {tps.length === 0 ? (
                        <div className="empty-state">
                            <AlertCircle size={48} />
                            <p>Tambahkan Tujuan Pembelajaran terlebih dahulu di tab &quot;Tujuan Pembelajaran&quot;.</p>
                        </div>
                    ) : (
                        <>
                            <div className="spreadsheet-wrapper">
                                <table className="spreadsheet">
                                    <thead>
                                        <tr>
                                            <th style={{ minWidth: 160 }}>Nama Siswa</th>
                                            {tps.map(tp => <th key={tp.id} title={tp.deskripsi}>{tp.kode}</th>)}
                                            <th>Rata TP</th>
                                            <th>STS</th>
                                            <th>SAS</th>
                                            <th>NA</th>
                                            <th style={{ minWidth: 180 }}>Deskripsi</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {students.map((s, idx) => (
                                            <tr key={s.siswa_id}>
                                                <td>
                                                    <div style={{ fontWeight: 500 }}>{s.nama}</div>
                                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{s.nisn}</div>
                                                </td>
                                                {tps.map(tp => (
                                                    <td key={tp.id}>
                                                        <input className={`score-input ${s.is_locked ? 'locked' : ''}`}
                                                            type="number" min="0" max="100"
                                                            value={s.tp_scores?.[tp.id] || ''}
                                                            disabled={s.is_locked}
                                                            onChange={e => handleScoreChange(idx, `tp_${tp.id}`, e.target.value)} />
                                                    </td>
                                                ))}
                                                <td><span className="score-final">{s.nilai_tp_rata?.toFixed(1) || '0.0'}</span></td>
                                                <td>
                                                    <input className={`score-input ${s.is_locked ? 'locked' : ''}`}
                                                        type="number" min="0" max="100"
                                                        value={s.sts || ''}
                                                        disabled={s.is_locked}
                                                        onChange={e => handleScoreChange(idx, 'sts', e.target.value)} />
                                                </td>
                                                <td>
                                                    <input className={`score-input ${s.is_locked ? 'locked' : ''}`}
                                                        type="number" min="0" max="100"
                                                        value={s.sas || ''}
                                                        disabled={s.is_locked}
                                                        onChange={e => handleScoreChange(idx, 'sas', e.target.value)} />
                                                </td>
                                                <td>
                                                    <span className={`score-final ${s.nilai_akhir < 70 ? 'low' : ''}`}>
                                                        {s.nilai_akhir?.toFixed(1) || '0.0'}
                                                    </span>
                                                </td>
                                                <td className="desc-cell">
                                                    <textarea value={s.deskripsi || ''} disabled={s.is_locked}
                                                        onChange={e => handleDescChange(idx, e.target.value)}
                                                        placeholder="Deskripsi capaian..." />
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Action Bar */}
                            <div className="action-bar d-flex align-items-center justify-content-between flex-wrap">
                                <div className="d-flex gap-3">
                                    <button className="btn-action primary" onClick={handleSave} disabled={saving}>
                                        {saving ? <Loader2 size={18} className="spin" /> : <Save size={18} />}
                                        Simpan Semua Nilai
                                    </button>
                                    <button className="btn-action secondary" onClick={handleGenerateDesc} disabled={saving}>
                                        <Wand2 size={18} /> Generate Deskripsi
                                    </button>
                                </div>
                                {autoSaving && (
                                    <div className="auto-save-indicator">
                                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', animation: 'pulse 1s infinite' }} />
                                        Auto-save aktif...
                                    </div>
                                )}
                            </div>

                            {/* R11: Grade Distribution Chart */}
                            {students.length > 0 && <GradeDistChart students={students} />}

                            {/* Bobot info */}
                            <div style={{ marginTop: 16, fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                                <span>📊 Bobot: TP {bobot.tp}% • STS {bobot.sts}% • SAS {bobot.sas}%</span>
                            </div>
                        </>
                    )}
                </div>
            )}

            {showSaveToast && (
                <div className="toast-save">
                    <CheckCircle2 size={20} /> Nilai berhasil disimpan!
                </div>
            )}
        </div>
    )
}


// R11: Grade Distribution Chart
function GradeDistChart({ students }) {
    const grades = [
        { label: 'A (90+)', range: [90, 100], color: '#10b981', textColor: 'var(--success-700)' },
        { label: 'B (80-89)', range: [80, 89], color: '#3b82f6', textColor: 'var(--primary-700)' },
        { label: 'C (70-79)', range: [70, 79], color: '#f59e0b', textColor: '#b45309' },
        { label: 'D (<70)', range: [0, 69], color: '#ef4444', textColor: '#b91c1c' },
    ]
    const withGrades = students.filter(s => s.nilai_akhir > 0)
    if (withGrades.length === 0) return null
    const counts = grades.map(g => ({
        ...g, count: withGrades.filter(s => s.nilai_akhir >= g.range[0] && s.nilai_akhir <= g.range[1]).length
    }))
    const maxCount = Math.max(...counts.map(g => g.count), 1)
    const avg = (withGrades.reduce((a, s) => a + s.nilai_akhir, 0) / withGrades.length).toFixed(1)
    return (
        <div style={{ background: 'var(--bg-card)', borderRadius: 16, padding: '20px', border: '1px solid var(--border-color)', marginTop: 20 }}>
            <div className="d-flex align-items-center justify-content-between mb-3">
                <div className="d-flex align-items-center gap-2">
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--primary-50)', color: 'var(--primary-600)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <BarChart2 size={16} />
                    </div>
                    <h6 className="fw-bold mb-0 text-primary">Distribusi Nilai Akhir</h6>
                </div>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                    Rata-rata: <span className="text-primary fw-black">{avg}</span> &bull; {withGrades.length} siswa
                </div>
            </div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', height: 80 }}>
                {counts.map(g => (
                    <div key={g.label} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, height: '100%', justifyContent: 'flex-end' }}>
                        <div style={{ fontWeight: 800, fontSize: '0.95rem', color: g.textColor }}>{g.count}</div>
                        <div style={{ width: '100%', background: g.color, borderRadius: 6, opacity: g.count === 0 ? 0.15 : 0.85, height: String(Math.max(8, Math.round((g.count / maxCount) * 52))) + 'px', transition: 'height 0.6s cubic-bezier(0.16, 1, 0.3, 1)' }} />
                        <div style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-muted)', textAlign: 'center', whiteSpace: 'nowrap' }}>{g.label}</div>
                    </div>
                ))}
            </div>
        </div>
    )
}
