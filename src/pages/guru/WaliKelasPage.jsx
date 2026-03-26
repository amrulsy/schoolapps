import { useState, useEffect } from 'react'
import { Users, FileText, ClipboardList, Printer, Loader2, AlertCircle, Save, CheckCircle2, Lock, Unlock, Search, Download } from 'lucide-react'
import api from '../../services/api'
import { useCustomAlert } from '../../hooks/useCustomAlert'
import RaporPrintTemplate from '../../components/RaporPrintTemplate'
import STSPrintTemplate from '../../components/STSPrintTemplate'

const STYLES = /*css*/`
  .wali-page { animation: fadeIn 0.4s ease-out; }
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
    .wali-page { animation: none !important; transform: none !important; }
    * { filter: none !important; box-shadow: none !important; }
  }
  .print-only { display: none; }
  @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

  .wali-header {
    background: linear-gradient(135deg, var(--success-600), var(--success-800));
    padding: 24px 32px; border-radius: 24px; color: white; margin-bottom: 24px;
    display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px;
  }
  .wali-header h2 { font-size: 1.4rem; font-weight: 700; margin: 0; }
  .wali-header p { opacity: 0.85; margin: 4px 0 0 0; font-size: 0.9rem; }

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
  .tab-btn.active { background: var(--success-600); color: white; box-shadow: 0 2px 8px rgba(16,185,129,0.3); }

  .table-card {
    background: var(--bg-card); border: 1px solid var(--border-color);
    border-radius: 20px; overflow: hidden; box-shadow: var(--shadow-sm);
  }
  .table-container { overflow-x: auto; -webkit-overflow-scrolling: touch; }
  .wali-table { width: 100%; border-collapse: collapse; font-size: 0.85rem; }
  .wali-table th {
    background: var(--bg-base); padding: 14px 16px; text-align: left;
    font-weight: 700; color: var(--text-secondary); border-bottom: 2px solid var(--border-color);
    white-space: nowrap;
  }
  .wali-table td { padding: 12px 16px; border-bottom: 1px solid var(--border-color); vertical-align: middle; }
  .wali-table tr:hover td { background: rgba(16,185,129,0.03); }

  .badge-nilai {
    padding: 4px 10px; border-radius: 8px; font-weight: 700; font-size: 0.75rem;
    background: var(--primary-50); color: var(--primary-600); display: inline-block;
  }
  .badge-nilai.low { background: #fee2e2; color: #ef4444; }

  .catatan-input {
    width: 100%; min-height: 80px; padding: 12px; border-radius: 12px;
    border: 1px solid var(--border-color); background: var(--bg-base);
    color: var(--text-primary); font-size: 0.85rem; resize: vertical; transition: all 0.2s;
  }
  .catatan-input:focus { border-color: var(--success-500); outline: none; box-shadow: 0 0 0 3px rgba(16,185,129,0.1); }

  .att-pill {
    display: flex; align-items: center; gap: 8px; padding: 6px 12px; border-radius: 10px;
    font-weight: 600; font-size: 0.8rem; border: 1px solid var(--border-color); background: var(--bg-base);
  }
  .att-pill b { color: var(--text-primary); }

  .action-footer {
    display: flex; gap: 12px; margin-top: 24px; justify-content: flex-end; flex-wrap: wrap;
  }
  .btn-bali {
    display: flex; align-items: center; gap: 8px; padding: 12px 24px;
    border-radius: 14px; border: none; font-weight: 700; font-size: 0.9rem;
    cursor: pointer; transition: all 0.2s;
  }
  .btn-bali.primary { background: var(--success-600); color: white; }
  .btn-bali.primary:hover { background: var(--success-700); transform: translateY(-1px); box-shadow: 0 4px 12px rgba(16,185,129,0.3); }
  .btn-bali.secondary { background: var(--bg-card); color: var(--text-primary); border: 1px solid var(--border-color); }
  .btn-bali.secondary:hover { background: var(--bg-hover); }
  .btn-bali.outline-danger { background: transparent; color: #ef4444; border: 1px solid #ef4444; }
  .btn-bali.outline-danger:hover { background: #fee2e2; }

  .empty-state { text-align: center; padding: 80px 20px; color: var(--text-muted); }
  .empty-state svg { margin-bottom: 20px; opacity: 0.3; }

  .print-btn {
    padding: 8px; border-radius: 10px; border: 1px solid var(--border-color);
    background: var(--bg-base); color: var(--success-600); cursor: pointer; transition: all 0.2s;
  }
  .print-btn:hover { background: var(--success-50); border-color: var(--success-200); }

  @media (max-width: 767px) {
    .wali-header { padding: 20px; }
    .action-footer { flex-direction: column; width: 100%; }
    .action-footer button { width: 100%; justify-content: center; }
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

    // Data state
    const [students, setStudents] = useState([])
    const [mapelList, setMapelList] = useState([])
    const [attendance, setAttendance] = useState([])
    const [catatanList, setCatatanList] = useState([])

    useEffect(() => {
        checkStatus()
    }, [])

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

    useEffect(() => {
        if (activeTab === 'attendance' && info) loadAttendance()
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
        if (siswaId === 'all') return showAlert('Info', 'Cetak masal sedang disiapkan.', 'info')
        try {
            setSaving(true)
            const res = await api.get(`/guru/wali-kelas/rapor/${siswaId}`, {
                params: {
                    kelas_id: info.kelas_id,
                    tahun_ajaran_id: info.tahun_ajaran_id,
                    semester: info.semester
                }
            })
            setPrintData(res.data)
            setPrintMode(mode)
            setShowPreview(true)
        } catch {
            showAlert('Error', `Gagal memuat data ${mode === 'sts' ? 'STS' : 'rapor'}`, 'error')
        } finally {
            setSaving(false)
        }
    }

    const triggerPrint = () => {
        window.print()
    }

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

    return (
        <div className="wali-page">
            <style>{STYLES}</style>

            <div className="no-print">
                <div className="wali-header">
                    <div>
                        <h2>🏫 Panel Wali Kelas — {info.kelas_nama}</h2>
                        <p>{info.tahun_ajaran} • Semester {info.semester}</p>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.15)', padding: '10px 20px', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <Users size={20} />
                        <span style={{ fontWeight: 700 }}>{students.length} Siswa</span>
                    </div>
                </div>

                <div className="tab-bar">
                    <button className={`tab-btn ${activeTab === 'leger' ? 'active' : ''}`} onClick={() => setActiveTab('leger')}>
                        <ClipboardList size={16} /> Data Leger
                    </button>
                    <button className={`tab-btn ${activeTab === 'attendance' ? 'active' : ''}`} onClick={() => setActiveTab('attendance')}>
                        <Users size={16} /> Kehadiran
                    </button>
                    <button className={`tab-btn ${activeTab === 'catatan' ? 'active' : ''}`} onClick={() => setActiveTab('catatan')}>
                        <FileText size={16} /> Catatan & Rapor
                    </button>
                </div>

                {activeTab === 'leger' && (
                    <div className="table-card">
                        <div className="table-container">
                            <table className="wali-table">
                                <thead>
                                    <tr>
                                        <th>Siswa</th>
                                        {mapelList.map(m => <th key={m.id} style={{ fontSize: '0.7rem', writingMode: 'vertical-lr', transform: 'rotate(180deg)' }}>{m.nama}</th>)}
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
                                                        <span className={`badge-nilai ${score < 75 ? 'low' : ''}`}>
                                                            {score || '-'}
                                                        </span>
                                                    </td>
                                                )
                                            })}
                                            <td style={{ fontWeight: 800, background: 'var(--success-50)', color: 'var(--success-700)' }}>
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
                    <div className="table-card">
                        <div className="table-container">
                            <table className="wali-table">
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
                                            <td><b>{a.sakit}</b> hari</td>
                                            <td><b>{a.izin}</b> hari</td>
                                            <td><b style={{ color: '#ef4444' }}>{a.alpha}</b> hari</td>
                                            <td><span className="badge-nilai">{a.sakit + a.izin + a.alpha}</span></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div style={{ padding: 20, background: 'var(--bg-base)', display: 'flex', alignItems: 'center', gap: 10 }}>
                            <AlertCircle size={16} className="text-muted" />
                            <p className="small text-muted m-0">Data kehadiran ditarik otomatis dari jurnal harian guru pengajar.</p>
                        </div>
                    </div>
                )}

                {activeTab === 'catatan' && (
                    <div className="table-card">
                        <div className="table-container">
                            <table className="wali-table">
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
                                                        className="catatan-input"
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
                                                            className="print-btn" 
                                                            onClick={() => handlePrintRapor(s.id, 'sts')} 
                                                            title="Cetak STS"
                                                            style={{ color: 'var(--primary-600)' }}
                                                        >
                                                            <FileText size={18} />
                                                        </button>
                                                        <button 
                                                            className="print-btn" 
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

                <div className="action-footer">
                    {activeTab === 'catatan' && (
                        <button className="btn-bali primary" onClick={handleSaveCatatan} disabled={saving}>
                            {saving ? <Loader2 size={18} className="spin" /> : <Save size={18} />}
                            Simpan Semua Catatan
                        </button>
                    )}
                    {isAllLocked ? (
                        <button className="btn-bali secondary" onClick={() => handleLockGrades(false)} disabled={saving}>
                            <Unlock size={18} /> Buka Kunci Nilai
                        </button>
                    ) : (
                        <button className="btn-bali outline-danger" onClick={() => handleLockGrades(true)} disabled={saving}>
                            <Lock size={18} /> Kunci Semua Nilai
                        </button>
                    )}
                    <button className="btn-bali secondary" onClick={() => handlePrintRapor('all')}>
                        <Download size={18} /> Download Leger (PDF)
                    </button>
                </div>
            </div>

            {/* Preview Modal */}
            {showPreview && (
                <div className="no-print" style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(15, 23, 42, 0.9)', zIndex: 9999,
                    display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px',
                    backdropFilter: 'blur(8px)'
                }}>
                    <div style={{
                        display: 'flex', gap: '12px', marginBottom: '20px', width: '210mm', justifyContent: 'flex-end'
                    }}>
                        <button className="btn-bali secondary" onClick={() => setShowPreview(false)}>Tutup Preview</button>
                        <button className="btn-bali primary" onClick={triggerPrint}>
                            <Printer size={18} /> Cetak Sekarang
                        </button>
                    </div>
                    <div style={{
                        background: 'white', width: '210mm', minHeight: '297mm', overflowY: 'auto',
                        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
                        position: 'relative', border: '1px solid #e2e8f0'
                    }}>
                        {printMode === 'sts' ? (
                            <STSPrintTemplate data={printData} />
                        ) : (
                            <RaporPrintTemplate data={printData} />
                        )}
                    </div>
                </div>
            )}

            <div className="print-only">
                {printMode === 'sts' ? (
                    <STSPrintTemplate data={printData} />
                ) : (
                    <RaporPrintTemplate data={printData} />
                )}
            </div>
        </div>
    )
}
