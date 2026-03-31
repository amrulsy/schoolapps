import { useState, useEffect } from 'react'
import { Save, Settings, Clock, MessageCircle, Bell, Loader2 } from 'lucide-react'
import api from '../../services/api'
import { useCustomAlert } from '../../hooks/useCustomAlert'

export default function AttendanceSettings() {
    const { addToast } = useCustomAlert()
    const [settings, setSettings] = useState({})
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        fetchSettings()
    }, [])

    const fetchSettings = async () => {
        try {
            const { data } = await api.get('/admin/presensi/settings')
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
        e.preventDefault()
        setSaving(true)
        try {
            await api.post('/admin/presensi/settings', settings)
            addToast('success', 'Berhasil', 'Pengaturan presensi telah diperbarui.')
        } catch (err) {
            addToast('danger', 'Gagal', err.response?.data?.error || 'Gagal menyimpan pengaturan')
        } finally {
            setSaving(false)
        }
    }

    if (loading) return (
        <div className="text-center py-5">
            <Loader2 className="animate-spin text-primary mx-auto mb-2" size={32} />
            <p className="text-muted fw-bold">Memuat pengaturan...</p>
        </div>
    )

    if (!settings) return (
        <div className="text-center py-5 card border-0 shadow-sm rounded-4">
            <div className="card-body">
                <p className="text-danger fw-bold mb-3">Gagal memuat pengaturan.</p>
                <button className="btn btn-primary rounded-3" onClick={fetchSettings}>Coba Lagi</button>
            </div>
        </div>
    )

    return (
        <div className="animate-fadeIn">
            <form onSubmit={handleSave}>
                <div className="row g-4">
                    {/* JAM OPERASIONAL */}
                    <div className="col-md-6">
                        <div className="card border-0 shadow-sm rounded-4 h-100">
                            <div className="card-header bg-white border-0 py-4 px-4">
                                <h5 className="fw-black mb-0 d-flex align-items-center gap-2">
                                    <Clock size={20} className="text-primary" /> Jam Operasional RFID
                                </h5>
                            </div>
                            <div className="card-body px-4 pb-4 pt-0">
                                <div className="mb-3">
                                    <label className="form-label small fw-bold text-muted text-uppercase">Jam Mulai Absen</label>
                                    <input 
                                        type="time" className="form-control form-control-lg rounded-3 border-light bg-light"
                                        value={settings.entry_start_time || ''} onChange={e => handleChange('entry_start_time', e.target.value)}
                                    />
                                    <div className="form-text small">Siswa diperbolehkan tap kartu mulai jam ini.</div>
                                </div>
                                <div className="mb-3">
                                    <label className="form-label small fw-bold text-muted text-uppercase">Batas Jam Terlambat</label>
                                    <input 
                                        type="time" className="form-control form-control-lg rounded-3 border-light bg-light"
                                        value={settings.late_threshold_time || ''} onChange={e => handleChange('late_threshold_time', e.target.value)}
                                    />
                                    <div className="form-text small">Lewat dari jam ini siswa dicatat sebagai "Terlambat".</div>
                                </div>
                                <div className="mb-3">
                                    <label className="form-label small fw-bold text-muted text-uppercase">Minimal Jeda Tap Pulang (Menit)</label>
                                    <div className="input-group">
                                        <input 
                                            type="number" className="form-control form-control-lg rounded-start-3 border-light bg-light"
                                            value={settings.exit_min_gap_minutes || ''} onChange={e => handleChange('exit_min_gap_minutes', e.target.value)}
                                        />
                                        <span className="input-group-text border-light bg-light font-bold">Menit</span>
                                    </div>
                                    <div className="form-text small">Mencegah absen pulang sesaat setelah absen masuk.</div>
                                </div>
                                <div className="mb-3">
                                    <label className="form-label small fw-bold text-muted text-uppercase">Jam Mulai Pulang Aktif</label>
                                    <input 
                                        type="time" className="form-control form-control-lg rounded-3 border-light bg-light"
                                        value={settings.exit_start_time || ''} onChange={e => handleChange('exit_start_time', e.target.value)}
                                    />
                                    <div className="form-text small">Jam dimana siswa diperbolehkan mulai absen pulang.</div>
                                </div>
                                <div className="mb-0">
                                    <label className="form-label small fw-bold text-muted text-uppercase">Mode Validasi Pulang</label>
                                    <select 
                                        className="form-select form-control-lg rounded-3 border-light bg-light"
                                        value={settings.exit_rule_type || 'gap_only'} onChange={e => handleChange('exit_rule_type', e.target.value)}
                                    >
                                        <option value="gap_only">Berdasarkan Jeda Menit Saja</option>
                                        <option value="time_only">Berdasarkan Jadwal Jam Saja</option>
                                        <option value="both">Keduanya Harus Terpenuhi (DAN)</option>
                                        <option value="either">Salah Satu Terpenuhi (ATAU)</option>
                                    </select>
                                    <div className="form-text small">Tentukan aturan mana yang digunakan untuk validasi pulang.</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* NOTIFIKASI */}
                    <div className="col-md-6">
                        <div className="card border-0 shadow-sm rounded-4 h-100">
                            <div className="card-header bg-white border-0 py-4 px-4 d-flex justify-content-between align-items-center">
                                <h5 className="fw-black mb-0 d-flex align-items-center gap-2">
                                    <Bell size={20} className="text-primary" /> Notifikasi WhatsApp
                                </h5>
                                <div className="form-check form-switch cursor-pointer">
                                    <input 
                                        className="form-check-input" type="checkbox" role="switch" style={{ width: 40, height: 20 }}
                                        checked={settings.wa_notification_enabled === 'true'} 
                                        onChange={e => handleChange('wa_notification_enabled', e.target.checked ? 'true' : 'false')}
                                    />
                                </div>
                            </div>
                            <div className="card-body px-4 pb-4 pt-0">
                                <div className="mb-3">
                                    <label className="form-label small fw-bold text-muted text-uppercase">Template WA Masuk</label>
                                    <textarea 
                                        className="form-control rounded-3 border-light bg-light" rows="3"
                                        value={settings.wa_template_masuk || ''} onChange={e => handleChange('wa_template_masuk', e.target.value)}
                                        placeholder="Gunakan [nama] dan [jam] sebagai variabel..."
                                    />
                                </div>
                                <div className="mb-3">
                                    <label className="form-label small fw-bold text-muted text-uppercase">Template WA Terlambat</label>
                                    <textarea 
                                        className="form-control rounded-3 border-light bg-light" rows="3"
                                        value={settings.wa_template_terlambat || ''} onChange={e => handleChange('wa_template_terlambat', e.target.value)}
                                        placeholder="Gunakan [nama] dan [jam] sebagai variabel..."
                                    />
                                </div>
                                <div className="mb-0">
                                    <label className="form-label small fw-bold text-muted text-uppercase">Template WA Pulang</label>
                                    <textarea 
                                        className="form-control rounded-3 border-light bg-light" rows="3"
                                        value={settings.wa_template_pulang || ''} onChange={e => handleChange('wa_template_pulang', e.target.value)}
                                        placeholder="Gunakan [nama] dan [jam] sebagai variabel..."
                                    />
                                </div>
                                <div className="mt-3 p-3 rounded-3 bg-primary-50 text-primary-700 small">
                                    <strong>Tip:</strong> Gunakan variabel <code>[nama]</code> untuk nama siswa dan <code>[jam]</code> untuk waktu kejadian.
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ACTIONS */}
                    <div className="col-12 text-end">
                        <button 
                            type="submit" className="btn btn-primary px-5 py-3 rounded-4 shadow-sm fw-black d-inline-flex align-items-center gap-2"
                            disabled={saving}
                        >
                            {saving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                            SIMPAN SEMUA PENGATURAN
                        </button>
                    </div>
                </div>
            </form>
        </div>
    )
}
