import { useState, useEffect } from 'react'
import { 
    Save, Clock, MessageCircle, Bell, Loader2, Info, 
    CheckCircle2, LogIn, LogOut, Activity, AlertTriangle, 
    ChevronRight, Smartphone
} from 'lucide-react'
import api from '../../services/api'
import Swal from 'sweetalert2'

// --- SUPER PREMIUM STYLES ---
const styles = /*css*/`
  .settings-container {
    animation: fadeIn 0.4s ease-out;
    padding-bottom: 60px;
  }

  .glass-card {
    background: rgba(255, 255, 255, 0.75);
    backdrop-filter: blur(14px);
    -webkit-backdrop-filter: blur(14px);
    border: 1px solid rgba(255, 255, 255, 0.5);
    border-radius: 32px;
    box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.07);
    transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  }

  .glass-input, .glass-textarea {
    background: rgba(255,255,255,0.7);
    border: 1.5px solid rgba(255,255,255,0.9);
    border-radius: 18px;
    padding: 14px 20px;
    font-weight: 600;
    color: #1e293b;
    width: 100%;
    transition: all 0.2s;
  }

  .glass-textarea { min-height: 180px; resize: none; }

  .glass-input:focus, .glass-textarea:focus {
    background: white;
    border-color: #3b82f6;
    box-shadow: 0 0 0 5px rgba(59, 130, 246, 0.1);
    outline: none;
  }

  .settings-label {
    font-size: 0.75rem;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 1px;
    color: #64748b;
    margin-bottom: 10px;
    display: block;
  }

  .section-header {
    display: flex;
    align-items: center;
    gap: 14px;
    margin-bottom: 30px;
  }

  .icon-box {
    width: 44px;
    height: 44px;
    border-radius: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #eff6ff;
    color: #3b82f6;
  }

  /* Master-Detail Layout */
  .master-detail-row {
    display: grid;
    grid-template-columns: 280px minmax(0, 1fr);
    gap: 30px;
    height: 680px;
    overflow: hidden;
  }

  .template-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
    border-right: 1px solid rgba(0,0,0,0.06);
    padding-right: 15px;
    height: 100%;
    overflow-y: auto;
  }

  .template-detail {
    height: 100%;
    overflow-y: auto;
    overflow-x: hidden;
    padding-right: 15px;
    padding-left: 5px;
  }

  .template-detail::-webkit-scrollbar, .template-list::-webkit-scrollbar { width: 4px; }
  .template-detail::-webkit-scrollbar-thumb, .template-list::-webkit-scrollbar-thumb { 
    background: rgba(0,0,0,0.08); 
    border-radius: 10px; 
  }

  .template-item {
    padding: 14px 18px;
    border-radius: 16px;
    cursor: pointer;
    transition: all 0.2s;
    border: 1px solid transparent;
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-weight: 700;
    font-size: 0.9rem;
    color: #475569;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .template-item:hover {
    background: rgba(255,255,255,0.8);
    color: #3b82f6;
  }

  .template-item.active {
    background: white;
    color: #3b82f6;
    border-color: rgba(59, 130, 246, 0.2);
    box-shadow: 0 4px 12px rgba(0,0,0,0.03);
  }

  /* WhatsApp Preview */
  .wa-preview-container {
    background: #e5ddd5;
    background-image: url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png');
    border-radius: 20px;
    padding: 20px;
    position: relative;
    max-width: 100%;
    margin-top: 20px;
    border: 1px solid #d4d4d4;
  }

  .wa-bubble {
    background: white;
    padding: 10px 14px;
    border-radius: 12px 12px 12px 0;
    max-width: 85%;
    font-size: 0.9rem;
    position: relative;
    box-shadow: 0 1px 1px rgba(0,0,0,0.1);
    line-height: 1.4;
    white-space: pre-wrap;
  }

  .wa-bubble::before {
    content: "";
    position: absolute;
    bottom: 0;
    left: -8px;
    width: 0;
    height: 0;
    border-top: 8px solid transparent;
    border-right: 8px solid white;
  }

  .wa-time {
    display: block;
    text-align: right;
    font-size: 0.7rem;
    color: #999;
    margin-top: 4px;
  }

  .save-floating-bar {
    position: fixed;
    bottom: 30px;
    right: 30px;
    z-index: 1000;
  }

  .save-btn {
    background: linear-gradient(135deg, #2563eb 0%, #3b82f6 100%);
    color: white;
    padding: 16px 32px;
    border-radius: 100px;
    border: none;
    font-weight: 800;
    display: flex;
    align-items: center;
    gap: 10px;
    box-shadow: 0 10px 25px rgba(37, 99, 235, 0.3);
    transition: all 0.3s;
  }

  @media (max-width: 992px) {
    .master-detail-row { grid-template-columns: 1fr; }
  }
`;

export default function AttendanceSettings() {
    const [settings, setSettings] = useState({})
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [activeTemplate, setActiveTemplate] = useState('wa_template_masuk')

    const templateTypes = [
        { key: 'wa_template_masuk', label: 'Tap Masuk', icon: <LogIn size={18} /> },
        { key: 'wa_template_terlambat', label: 'Terlambat', icon: <Clock size={18} /> },
        { key: 'wa_template_pulang', label: 'Tap Pulang', icon: <LogOut size={18} /> },
        { key: 'wa_template_sakit', label: 'Sakit (Admin)', icon: <Activity size={18} /> },
        { key: 'wa_template_izin', label: 'Izin (Admin)', icon: <Info size={18} /> },
        { key: 'wa_template_alfa', label: 'Alpha (Auto)', icon: <AlertTriangle size={18} /> },
    ]

    useEffect(() => {
        fetchSettings()
    }, [])

    const fetchSettings = async () => {
        try {
            const { data } = await api.get('/admin/attendance/settings')
            setSettings(data)
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    const handleChange = (key, value) => {
        setSettings(prev => ({ ...prev, [key]: value }))
    }

    const handleSave = async (e) => {
        if (e) e.preventDefault()
        const confirm = await Swal.fire({
            icon: 'question',
            title: 'Simpan Pengaturan?',
            text: 'Pastikan semua template WhatsApp dan jadwal waktu sudah sesuai.',
            showCancelButton: true,
            confirmButtonText: 'Ya, Simpan',
            cancelButtonText: 'Cek Dulu',
            confirmButtonColor: '#3b82f6',
            background: 'rgba(255,255,255,0.97)',
            backdrop: 'blur(4px)'
        })
        if (!confirm.isConfirmed) return

        setSaving(true)
        try {
            await api.post('/admin/attendance/settings', settings)
            Swal.fire({
                icon: 'success',
                title: 'Konfigurasi Diperbarui',
                text: 'Semua perubahan telah disimpan dengan aman.',
                timer: 2000,
                showConfirmButton: false,
                background: 'rgba(255,255,255,0.95)',
                backdrop: 'blur(4px)'
            })
        } catch (err) {
            Swal.fire({ icon: 'error', title: 'Gagal', text: 'Terjadi kesalahan saat menyimpan.' })
        } finally {
            setSaving(false)
        }
    }

    const renderPreview = (text) => {
        if (!text) return "Pesan akan muncul di sini..."
        return text
            .replace(/\[nama\]/g, '<b>Ahmad Ridwan</b>')
            .replace(/\[jam\]/g, '<b>07:15</b>')
            .replace(/\[tanggal\]/g, '<b>11/04/2026</b>')
            .replace(/\[keterangan\]/g, '<b>Alasan Sakit...</b>')
            .replace(/\[status\]/g, '<b>Terlambat</b>')
    }

    if (loading) return (
        <div className="d-flex flex-column align-items-center justify-content-center py-5">
            <Loader2 className="animate-spin text-primary mb-3" size={40} />
            <h5 className="fw-black text-muted">Sinkronisasi...</h5>
        </div>
    )

    return (
        <div className="settings-container">
            <style dangerouslySetInnerHTML={{ __html: styles }} />
            
            <div className="row g-4 justify-content-center">
                {/* JAM OPERASIONAL RFID */}
                <div className="col-lg-10">
                    <div className="glass-card p-4">
                        <div className="section-header">
                            <div className="icon-box">
                                <Clock size={22} />
                            </div>
                            <div>
                                <h5 className="fw-black mb-0">Aturan Waktu Presensi</h5>
                                <p className="text-muted small mb-0">Konfigurasi jadwal aktif mesin RFID</p>
                            </div>
                        </div>

                        <div className="row g-3">
                            <div className="col-md-3">
                                <label className="settings-label">Mulai Masuk</label>
                                <input type="time" className="glass-input" value={settings.entry_start_time || ''} onChange={e => handleChange('entry_start_time', e.target.value)} />
                            </div>
                            <div className="col-md-3">
                                <label className="settings-label">Batas Terlambat</label>
                                <input type="time" className="glass-input" value={settings.late_threshold_time || ''} onChange={e => handleChange('late_threshold_time', e.target.value)} />
                            </div>
                            <div className="col-md-3">
                                <label className="settings-label">Mulai Pulang</label>
                                <input type="time" className="glass-input" value={settings.exit_start_time || ''} onChange={e => handleChange('exit_start_time', e.target.value)} />
                            </div>
                            <div className="col-md-3">
                                <label className="settings-label">Min. Jeda (Menit)</label>
                                <input type="number" className="glass-input" value={settings.exit_min_gap_minutes || ''} onChange={e => handleChange('exit_min_gap_minutes', e.target.value)} />
                            </div>
                            <div className="col-12">
                                <label className="settings-label">Logika Validasi Check-Out</label>
                                <select className="glass-input" value={settings.exit_rule_type || 'gap_only'} onChange={e => handleChange('exit_rule_type', e.target.value)}>
                                    <option value="gap_only">Berdasarkan Jeda Menit Saja</option>
                                    <option value="time_only">Berdasarkan Jadwal Jam Saja</option>
                                    <option value="both">Keduanya Harus Terpenuhi (AND)</option>
                                    <option value="either">Salah Satu Terpenuhi (OR)</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                {/* MASTER-DETAIL WHATSAPP */}
                <div className="col-lg-10">
                    <div className="glass-card p-4">
                        <div className="section-header d-flex justify-content-between align-items-center mb-4">
                            <div className="d-flex align-items-center gap-3">
                                <div className="icon-box" style={{ background: '#ecfdf5', color: '#10b981' }}>
                                    <MessageCircle size={22} />
                                </div>
                                <div>
                                    <h5 className="fw-black mb-0">WhatsApp Template Manager</h5>
                                    <p className="text-muted small mb-0">Kelola dan tinjau pesan otomatis dengan fitur Live Preview</p>
                                </div>
                            </div>
                            <div className="form-check form-switch p-0 m-0">
                                <input 
                                    className="form-check-input premium-switch ms-0" type="checkbox" role="switch"
                                    checked={settings.wa_notification_enabled === 'true'} 
                                    onChange={e => handleChange('wa_notification_enabled', e.target.checked ? 'true' : 'false')}
                                />
                            </div>
                        </div>

                        <div className="master-detail-row">
                            {/* MASTER: List of Templates */}
                            <div className="template-list">
                                {templateTypes.map(t => (
                                    <div 
                                        key={t.key} 
                                        className={`template-item ${activeTemplate === t.key ? 'active' : ''}`}
                                        onClick={() => setActiveTemplate(t.key)}
                                    >
                                        <div className="d-flex align-items-center gap-3">
                                            {t.icon} {t.label}
                                        </div>
                                        {activeTemplate === t.key && <ChevronRight size={16} />}
                                    </div>
                                ))}
                            </div>

                            {/* DETAIL: Editor & Preview */}
                            <div className="template-detail px-2">
                                <div className="mb-4">
                                    <label className="settings-label">Edit Template: {templateTypes.find(t => t.key === activeTemplate)?.label}</label>
                                    <textarea 
                                        className="glass-textarea"
                                        placeholder="Ketik pesan di sini..."
                                        value={settings[activeTemplate] || ''}
                                        onChange={e => handleChange(activeTemplate, e.target.value)}
                                    />
                                </div>

                                <label className="settings-label d-flex align-items-center gap-2">
                                    <Smartphone size={16} /> WhatsApp Live Preview
                                </label>
                                <div className="wa-preview-container">
                                    <div className="wa-bubble">
                                        <div dangerouslySetInnerHTML={{ __html: renderPreview(settings[activeTemplate]) }} />
                                        <span className="wa-time">07:15</span>
                                    </div>
                                </div>

                                <div className="mt-4 p-3 rounded-4 bg-light d-flex gap-3 border border-white">
                                    <Info size={18} className="text-primary flex-shrink-0 mt-1" />
                                    <p className="small text-muted mb-0">
                                        <strong>Smart Labels:</strong> Sisipkan variabel <code>[nama]</code>, <code>[jam]</code>, <code>[tanggal]</code>, <code>[keterangan]</code>, <code>[status]</code>, <code>[kelas]</code>, dan <code>[nisn]</code> ke dalam template.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* FLOATING ACTION */}
            <div className="save-floating-bar">
                <button className="save-btn" onClick={handleSave} disabled={saving}>
                    {saving ? <Loader2 className="animate-spin" size={20} /> : <CheckCircle2 size={20} />}
                    {saving ? 'PROSES...' : 'SIMPAN PERUBAHAN'}
                </button>
            </div>
        </div>
    )
}
