import { useState, useEffect } from 'react'
import { useApp } from '../../context/AppContext'
import { 
    Settings, Save, ArrowLeft, Calendar, MessageSquare, 
    DollarSign, CheckCircle2, CalendarOff, Trash2, Plus, 
     Info, 
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import api from '../../services/api'
import LoadingSpinner from '../../components/LoadingSpinner'
import Swal from 'sweetalert2'

const styles = /*css*/`
  .settings-container {
    max-width: 1000px;
    margin: 0 auto;
    padding: 20px;
  }
  .settings-card {
    background: var(--bg-card);
    border-radius: 24px;
    border: 1px solid var(--border-color);
    box-shadow: var(--shadow-sm);
    overflow: hidden;
    margin-bottom: 24px;
  }
  .settings-header {
    padding: 32px;
    background: linear-gradient(to right, var(--primary-600), var(--primary-700));
    color: white;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .settings-tabs {
    display: flex;
    padding: 0 32px;
    background: var(--bg-card);
    border-bottom: 1px solid var(--border-color);
  }
  .tab-item {
    padding: 16px 24px;
    font-weight: 700;
    color: var(--text-secondary);
    cursor: pointer;
    border-bottom: 3px solid transparent;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 0.9rem;
  }
  .tab-item:hover {
    color: var(--primary-600);
  }
  .tab-item.active {
    color: var(--primary-600);
    border-bottom-color: var(--primary-600);
  }
  .settings-body {
    padding: 32px;
  }
  .form-section {
    margin-bottom: 40px;
  }
  .section-title {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 24px;
    color: var(--text-primary);
  }
  .section-title h3 {
    margin: 0;
    font-size: 1.1rem;
    font-weight: 700;
  }
  .form-group {
    margin-bottom: 20px;
  }
  .form-group label {
    display: block;
    font-size: 0.85rem;
    font-weight: 600;
    color: var(--text-secondary);
    margin-bottom: 8px;
    text-transform: uppercase;
    letter-spacing: 0.025em;
  }
  .modern-input {
    width: 100%;
    padding: 12px 16px;
    border-radius: 12px;
    border: 1.5px solid var(--border-color);
    background: var(--bg-input);
    color: var(--text-primary);
    font-size: 1rem;
    transition: all 0.2s;
  }
  .modern-input:focus {
    border-color: var(--primary-500);
    outline: none;
    box-shadow: 0 0 0 4px var(--primary-50);
  }
  .days-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
    gap: 12px;
  }
  .day-checkbox {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 12px 16px;
    background: var(--bg-stripe);
    border: 1px solid var(--border-color);
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.2s;
  }
  .day-checkbox:hover { background: var(--bg-hover); }
  .day-checkbox.active {
    background: var(--primary-50);
    border-color: var(--primary-200);
    color: var(--primary-700);
  }
  .day-checkbox input { display: none; }
  .save-bar {
    position: sticky;
    bottom: 20px;
    background: rgba(255, 255, 255, 0.8);
    backdrop-filter: blur(12px);
    padding: 16px 32px;
    border-radius: 20px;
    border: 1px solid var(--border-color);
    display: flex;
    justify-content: flex-end;
    box-shadow: var(--shadow-md);
    z-index: 100;
  }
  .btn-save {
    background: var(--primary-600);
    color: white;
    border: none;
    padding: 12px 32px;
    border-radius: 12px;
    font-weight: 700;
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    transition: all 0.2s;
  }
  .btn-save:hover {
    background: var(--primary-700);
    transform: translateY(-1px);
  }
  .btn-back {
    background: rgba(255,255,255,0.2);
    border: none;
    color: white;
    width: 40px;
    height: 40px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s;
  }
  .btn-back:hover { background: rgba(255,255,255,0.3); }

  /* Holiday specific styles */
  .holiday-form {
    padding: 24px;
    background: var(--bg-stripe);
    border-radius: 16px;
    border: 1px solid var(--border-color);
  }
  .holiday-table {
    width: 100%;
    margin-top: 24px;
  }
  .holiday-table th {
    padding: 12px;
    font-size: 0.75rem;
    color: var(--text-secondary);
    text-transform: uppercase;
  }
  .holiday-table td {
    padding: 16px 12px;
    border-bottom: 1px solid var(--border-color);
  }
  .btn-delete-holiday {
    color: var(--danger-500);
    background: transparent;
    border: none;
    padding: 8px;
    border-radius: 8px;
    transition: all 0.2s;
  }
  .btn-delete-holiday:hover {
    background: var(--danger-50);
  }
  .template-hint {
    font-size: 0.75rem;
    color: var(--text-muted);
    margin-top: 8px;
  }
  .template-hint code {
    background: var(--bg-stripe);
    padding: 2px 4px;
    border-radius: 4px;
    color: var(--primary-600);
  }
`;

const DAYS = [
    { id: 1, label: 'Senin' }, { id: 2, label: 'Selasa' }, { id: 3, label: 'Rabu' },
    { id: 4, label: 'Kamis' }, { id: 5, label: 'Jumat' }, { id: 6, label: 'Sabtu' },
    { id: 0, label: 'Minggu' }
];

export default function InfaqSettingsPage() {
    const { addToast } = useApp()
    const navigate = useNavigate()
    const [activeTab, setActiveTab] = useState('general') // 'general' or 'holidays'
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [settings, setSettings] = useState({
        nominal_default: '2000',
        active_days: [1, 2, 3, 4, 5, 6],
        wa_template: ''
    })

    // Holidays state
    const [holidays, setHolidays] = useState([])
    const [newHoliday, setNewHoliday] = useState({ tanggal: '', keterangan: '' })

    useEffect(() => {
        initPage()
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const initPage = async () => {
        setLoading(true)
        await Promise.all([fetchSettings(), fetchHolidays()])
        setLoading(false)
    }

    const fetchSettings = async () => {
        try {
            const res = await api.get('/admin/infaq/settings')
            if (res.data) {
                setSettings({
                    nominal_default: res.data.nominal_default || '2000',
                    active_days: res.data.active_days || [1, 2, 3, 4, 5, 6],
                    wa_template: res.data.wa_template || ''
                })
            }
        } catch (err) {
            console.error(err)
            addToast('danger', 'Gagal memuat pengaturan')
        }
    }

    const fetchHolidays = async () => {
        try {
            const res = await api.get('/admin/infaq/holidays')
            setHolidays(res.data)
        } catch (err) {
            console.error(err)
        }
    }

    const toggleDay = (dayId) => {
        setSettings(prev => {
            const current = [...prev.active_days]
            if (current.includes(dayId)) {
                return { ...prev, active_days: current.filter(id => id !== dayId) }
            } else {
                return { ...prev, active_days: [...current, dayId] }
            }
        })
    }

    const handleSaveGeneral = async () => {
        setSaving(true)
        try {
            await api.post('/admin/infaq/settings', settings)
            addToast('success', 'Pengaturan disimpan', 'Konfigurasi Infaq Harian berhasil diperbarui')
        } catch (err) {
            console.error(err)
            addToast('danger', 'Gagal menyimpan pengaturan')
        } finally {
            setSaving(false)
        }
    }

    const handleAddHoliday = async (e) => {
        e.preventDefault()
        if (!newHoliday.tanggal || !newHoliday.keterangan) return
        setSaving(true)
        try {
            await api.post('/admin/infaq/holidays', newHoliday)
            setNewHoliday({ tanggal: '', keterangan: '' })
            await fetchHolidays()
            addToast('success', 'Hari libur ditambahkan')
        } catch (err) {
            addToast('danger', 'Gagal menambahkan hari libur')
        } finally {
            setSaving(false)
        }
    }

    const handleDeleteHoliday = async (id) => {
        const result = await Swal.fire({
            title: 'Hapus Hari Libur?',
            text: "Data ini akan dihapus permanen.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            confirmButtonText: 'Ya, Hapus'
        })
        if (result.isConfirmed) {
            try {
                await api.delete(`/admin/infaq/holidays/${id}`)
                await fetchHolidays()
                addToast('success', 'Hari libur dihapus')
            } catch (err) {
                addToast('danger', 'Gagal menghapus data')
            }
        }
    }

    if (loading) return (
        <div className="d-flex justify-content-center align-items-center" style={{ height: '80vh' }}>
            <LoadingSpinner message="Menyiapkan pengaturan..." />
        </div>
    )

    return (
        <div className="settings-container animate-fadeIn">
            <style dangerouslySetInnerHTML={{ __html: styles }} />
            
            <div className="settings-card">
                <div className="settings-header">
                    <div className="d-flex align-items-center gap-3">
                        <button className="btn-back" onClick={() => navigate('/admin/infaq')}>
                            <ArrowLeft size={20} />
                        </button>
                        <div>
                            <h2 className="m-0 fw-bold" style={{ fontSize: '1.25rem' }}>Pengaturan Infaq Harian</h2>
                            <p className="m-0 small opacity-75">Konfigurasi pusat layanan infaq</p>
                        </div>
                    </div>
                    <Settings size={32} strokeWidth={1.5} className="opacity-50" />
                </div>

                <div className="settings-tabs">
                    <div 
                        className={`tab-item ${activeTab === 'general' ? 'active' : ''}`}
                        onClick={() => setActiveTab('general')}
                    >
                        <Settings size={18} /> Umum & Nominal
                    </div>
                    <div 
                        className={`tab-item ${activeTab === 'holidays' ? 'active' : ''}`}
                        onClick={() => setActiveTab('holidays')}
                    >
                        <CalendarOff size={18} /> Hari Libur
                    </div>
                </div>

                <div className="settings-body">
                    {activeTab === 'general' ? (
                        <div className="animate-slideIn">
                            <div className="form-section">
                                <div className="section-title">
                                    <DollarSign size={20} className="text-primary" />
                                    <h3>Nominal Default</h3>
                                </div>
                                <div className="form-group" style={{ maxWidth: '300px' }}>
                                    <label>Jumlah Infaq per Hari (Rp)</label>
                                    <input 
                                        type="number" className="modern-input"
                                        value={settings.nominal_default}
                                        onChange={e => setSettings({...settings, nominal_default: e.target.value})}
                                    />
                                </div>
                                </div>

                            <hr className="my-5 opacity-25" />

                            <div className="form-section">
                                <div className="section-title">
                                    <Calendar size={20} className="text-primary" />
                                    <h3>Hari Aktif Koleksi</h3>
                                </div>
                                <div className="days-grid">
                                    {DAYS.map(day => (
                                        <div 
                                            key={day.id} 
                                            className={`day-checkbox ${settings.active_days.includes(day.id) ? 'active' : ''}`}
                                            onClick={() => toggleDay(day.id)}
                                        >
                                            <div className={`check-box ${settings.active_days.includes(day.id) ? 'checked' : ''}`}>
                                                {settings.active_days.includes(day.id) && <CheckCircle2 size={16} />}
                                            </div>
                                            <span className="fw-bold small text-uppercase">{day.label}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <hr className="my-5 opacity-25" />

                            <div className="form-section">
                                <div className="section-title">
                                    <MessageSquare size={20} className="text-primary" />
                                    <h3>Template WhatsApp</h3>
                                </div>
                                <div className="form-group">
                                    <label>Pesan Notifikasi</label>
                                    <textarea 
                                        className="modern-input" rows={4}
                                        value={settings.wa_template}
                                        onChange={e => setSettings({...settings, wa_template: e.target.value})}
                                    />
                                    <div className="template-hint"> Variabel: <code>[nama]</code>, <code>[nominal]</code>, <code>[tanggal]</code></div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="animate-slideIn">
                            <div className="row g-4">
                                <div className="col-lg-4">
                                    <div className="holiday-form">
                                        <div className="section-title">
                                            <Plus size={20} className="text-primary" />
                                            <h3>Tambah Libur</h3>
                                        </div>
                                        <form onSubmit={handleAddHoliday}>
                                            <div className="form-group">
                                                <label>Tanggal</label>
                                                <input 
                                                    type="date" className="modern-input"
                                                    value={newHoliday.tanggal}
                                                    onChange={e => setNewHoliday({...newHoliday, tanggal: e.target.value})}
                                                    required
                                                />
                                            </div>
                                            <div className="form-group">
                                                <label>Keterangan</label>
                                                <input 
                                                    type="text" className="modern-input" placeholder="Libur Idul Fitri"
                                                    value={newHoliday.keterangan}
                                                    onChange={e => setNewHoliday({...newHoliday, keterangan: e.target.value})}
                                                    required
                                                />
                                            </div>
                                            <button className="btn btn-primary w-100 rounded-3 py-2 fw-bold mt-2" disabled={saving}>
                                                <Plus size={18} /> Simpan Libur
                                            </button>
                                        </form>
                                        <div className="alert alert-info mt-4 border-0 rounded-4 glass d-flex gap-2" style={{ fontSize: '0.8rem' }}>
                                            <Info size={16} className="text-primary flex-shrink-0" />
                                            <span>Hari Minggu dan hari non-aktif otomatis dianggap libur.</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="col-lg-8">
                                    <div className="section-title">
                                        <CalendarOff size={20} className="text-primary" />
                                        <h3>Daftar Libur Tambahan</h3>
                                    </div>
                                    <div className="table-responsive">
                                        <table className="holiday-table">
                                            <thead>
                                                <tr>
                                                    <th>TANGGAL</th>
                                                    <th>KETERANGAN</th>
                                                    <th className="text-end">AKSI</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {holidays.length === 0 ? (
                                                    <tr><td colSpan="3" className="text-center py-5 text-muted fst-italic">Belum ada hari libur tambahan</td></tr>
                                                ) : holidays.map(h => (
                                                    <tr key={h.id}>
                                                        <td className="fw-bold small">
                                                            {new Date(h.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                                                        </td>
                                                        <td className="small">{h.keterangan}</td>
                                                        <td className="text-end">
                                                            <button 
                                                                className="btn-delete-holiday"
                                                                onClick={() => handleDeleteHoliday(h.id)}
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {activeTab === 'general' && (
                <div className="save-bar animate-slideUp">
                    <button className="btn-save" onClick={handleSaveGeneral} disabled={saving}>
                        {saving ? <div className="spinner-border spinner-border-sm"></div> : <><Save size={18} /> Simpan Pengaturan Umum</>}
                    </button>
                </div>
            )}
        </div>
    )
}
