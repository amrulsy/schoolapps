import { useState, useEffect } from 'react'
import { useApp } from '../../context/AppContext'
import {
    Save, Upload, AlertTriangle, Calendar, Clock,
    MessageSquare, Database, Shield, Layout,
    CheckCircle, XCircle, RefreshCw, Trash2, Plus, FileText, Printer, Scan
} from 'lucide-react'
import { Link } from 'react-router-dom'
import api, { API_BASE, getMediaUrl } from '../../services/api'

export default function PengaturanPage() {
    const {
        schoolSettings, updateSchoolSettings,
        tahunAjaranList, setTahunAjaranAktif,
        addToast
    } = useApp()

    const [activeTab, setActiveTab] = useState('profil')
    const [loading, setLoading] = useState(false)

    // Local states for different settings modules
    const [localProfile, setLocalProfile] = useState({
        nama: '', alamat: '', telepon: '', email: '', kepala_sekolah: '', nip_kepsek: '', school_logo: ''
    })
    const [attendanceSettings, setAttendanceSettings] = useState({})
    const [infaqSettings, setInfaqSettings] = useState({})
    const [holidays, setHolidays] = useState([])
    const [waStatus, setWaStatus] = useState(null)
    const [newHoliday, setNewHoliday] = useState({ tanggal: '', keterangan: '' })
    const [masterDokumen, setMasterDokumen] = useState([])
    const [newDokumen, setNewDokumen] = useState({ kode: '', nama: '', is_required: true, keterangan: '' })
    const [maintenanceMode, setMaintenanceMode] = useState(false)
    const [receiptConfig, setReceiptConfig] = useState({})
    const [previewSize, setPreviewSize] = useState('58mm')
    const [faceRecognitionEnabled, setFaceRecognitionEnabled] = useState(false)

    // Initialize local profile from context
    useEffect(() => {
        if (schoolSettings) {
            setMaintenanceMode(schoolSettings.maintenance_mode === 'true')
            setLocalProfile({
                nama: schoolSettings.school_name || '',
                alamat: schoolSettings.school_address || '',
                telepon: schoolSettings.school_phone || '',
                email: schoolSettings.school_email || '',
                kepala_sekolah: schoolSettings.school_principal || '',
                nip_kepsek: schoolSettings.school_principal_nip || '',
                school_logo: schoolSettings.school_logo || ''
            })
            setFaceRecognitionEnabled(schoolSettings.face_recognition_enabled === 'true')
            setReceiptConfig({
                header1: schoolSettings.receipt_header1 || schoolSettings.school_name || '',
                header2: schoolSettings.receipt_header2 || schoolSettings.school_address || '',
                header3: schoolSettings.receipt_header3 || schoolSettings.school_phone || '',
                footer: schoolSettings.receipt_footer || 'Terima kasih atas pembayarannya!'
            })
        }
    }, [schoolSettings])

    const handleToggleMaintenance = async (e) => {
        const isChecked = e.target.checked
        setMaintenanceMode(isChecked)
        await updateSchoolSettings({ maintenance_mode: isChecked ? 'true' : 'false' })
    }

    const handleToggleFaceRecongition = async (e) => {
        const isChecked = e.target.checked
        setFaceRecognitionEnabled(isChecked)
        await updateSchoolSettings({ face_recognition_enabled: isChecked ? 'true' : 'false' })
    }

    // Load other settings when tab changes
    useEffect(() => {
        if (activeTab === 'presensi') fetchAttendanceSettings()
        if (activeTab === 'infaq') fetchInfaqSettings()
        if (activeTab === 'libur') fetchHolidays()
        if (activeTab === 'sistem') fetchWaStatus()
        if (activeTab === 'berkas') fetchMasterDokumen()
    }, [activeTab])

    const fetchAttendanceSettings = async () => {
        try {
            const { data } = await api.get('/admin/attendance/settings')
            setAttendanceSettings(data)
        } catch (err) { console.error(err) }
    }

    const fetchInfaqSettings = async () => {
        try {
            const { data } = await api.get('/admin/infaq/settings')
            setInfaqSettings(data)
        } catch (err) { console.error(err) }
    }

    const fetchHolidays = async () => {
        try {
            const { data } = await api.get('/admin/infaq/holidays')
            setHolidays(data)
        } catch (err) { console.error(err) }
    }

    const fetchWaStatus = async () => {
        try {
            const { data } = await api.get('/admin/school-settings/whatsapp/status')
            setWaStatus(data)
        } catch (err) { console.error(err) }
    }

    const fetchMasterDokumen = async () => {
        try {
            const { data } = await api.get('/admin/master-dokumen')
            setMasterDokumen(data)
        } catch (err) { console.error(err) }
    }

    const handleSaveProfile = async () => {
        setLoading(true)
        await updateSchoolSettings({
            school_name: localProfile.nama,
            school_address: localProfile.alamat,
            school_phone: localProfile.telepon,
            school_email: localProfile.email,
            school_principal: localProfile.kepala_sekolah,
            school_principal_nip: localProfile.nip_kepsek
        })
        setLoading(false)
    }

    const handleUploadLogo = async (e) => {
        const file = e.target.files?.[0]
        if (!file) return

        const formData = new FormData()
        formData.append('logo', file)

        setLoading(true)
        try {
            const { data } = await api.post('/admin/school-settings/logo', formData)
            setLocalProfile(p => ({ ...p, school_logo: data.logo_url }))
            await updateSchoolSettings({ school_logo: data.logo_url })
            addToast('success', 'Berhasil', data.message)
        } catch (err) {
            addToast('danger', 'Error', 'Gagal mengunggah logo')
        } finally {
            setLoading(false)
            e.target.value = ''
        }
    }

    const handleSaveReceiptConfig = async () => {
        setLoading(true)
        await updateSchoolSettings({
            receipt_header1: receiptConfig.header1,
            receipt_header2: receiptConfig.header2,
            receipt_header3: receiptConfig.header3,
            receipt_footer: receiptConfig.footer
        })
        setLoading(false)
    }

    const handleSaveAttendance = async () => {
        try {
            await api.post('/admin/attendance/settings', attendanceSettings)
            addToast('success', 'Berhasil', 'Pengaturan presensi disimpan')
        } catch (err) { addToast('danger', 'Error', 'Gagal menyimpan pengaturan') }
    }

    const handleSaveInfaq = async () => {
        try {
            await api.post('/admin/infaq/settings', infaqSettings)
            addToast('success', 'Berhasil', 'Pengaturan infaq disimpan')
        } catch (err) { addToast('danger', 'Error', 'Gagal menyimpan pengaturan') }
    }

    const handleAddHoliday = async () => {
        if (!newHoliday.tanggal || !newHoliday.keterangan) return
        try {
            const { data } = await api.post('/admin/infaq/holidays', newHoliday)
            setHolidays(prev => [data, ...prev])
            setNewHoliday({ tanggal: '', keterangan: '' })
            addToast('success', 'Berhasil', 'Hari libur ditambahkan')
        } catch (err) { addToast('danger', 'Error', 'Gagal menambah hari libur') }
    }

    const handleDeleteHoliday = async (id) => {
        try {
            await api.delete(`/admin/infaq/holidays/${id}`)
            setHolidays(prev => prev.filter(h => h.id !== id))
            addToast('success', 'Berhasil', 'Hari libur dihapus')
        } catch (err) { addToast('danger', 'Error', 'Gagal menghapus hari libur') }
    }

    const handleAddDokumen = async () => {
        if (!newDokumen.kode || !newDokumen.nama) return
        try {
            await api.post('/admin/master-dokumen', newDokumen)
            setNewDokumen({ kode: '', nama: '', is_required: true, keterangan: '' })
            fetchMasterDokumen()
            addToast('success', 'Berhasil', 'Dokumen berhasil ditambahkan')
        } catch (err) { addToast('danger', 'Error', 'Gagal menambah dokumen') }
    }

    const handleDeleteDokumen = async (id) => {
        try {
            await api.delete(`/admin/master-dokumen/${id}`)
            setMasterDokumen(prev => prev.filter(d => d.id !== id))
            addToast('success', 'Berhasil', 'Dokumen berhasil dihapus')
        } catch (err) { addToast('danger', 'Error', 'Gagal menghapus dokumen') }
    }

    const handleBackup = async () => {
        try {
            const res = await fetch(`${API_BASE}/admin/backup/export`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            if (!res.ok) throw new Error('Download failed');

            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `backup-${new Date().toISOString().slice(0, 10)}.zip`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            addToast('success', 'Berhasil', 'Backup data berhasil diunduh');
        } catch (err) {
            addToast('danger', 'Error', 'Gagal mengunduh backup');
        }
    }

    const tabs = [
        { id: 'profil', label: 'Profil Sekolah', icon: <Layout size={18} /> },
        { id: 'akademik', label: 'Akademik', icon: <Calendar size={18} /> },
        { id: 'libur', label: 'Hari Libur', icon: <Calendar size={18} /> },
        { id: 'presensi', label: 'Presensi RFID', icon: <Clock size={18} /> },
        { id: 'infaq', label: 'Infaq Harian', icon: <MessageSquare size={18} /> },
        { id: 'berkas', label: 'Berkas Digital', icon: <FileText size={18} /> },
        { id: 'struk', label: 'Cetak Nota', icon: <Printer size={18} /> },
        { id: 'sistem', label: 'Sistem', icon: <Database size={18} /> },
    ]

    return (
        <div className="fade-in">
            <div className="page-header">
                <h1>Pengaturan Sistem</h1>
            </div>

            <div className="settings-container" style={{ display: 'grid', gridTemplateColumns: '250px 1fr', gap: 24 }}>
                {/* Sidebar Tabs */}
                <div className="settings-nav card" style={{ padding: '12px 0', alignSelf: 'start' }}>
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            className={`settings-nav-item ${activeTab === tab.id ? 'active' : ''}`}
                            onClick={() => setActiveTab(tab.id)}
                            style={{
                                display: 'flex', alignItems: 'center', gap: 12, width: '100%',
                                padding: '12px 20px', border: 'none', background: 'none',
                                cursor: 'pointer', textAlign: 'left', fontSize: '0.95rem',
                                color: activeTab === tab.id ? 'var(--primary-600)' : 'var(--slate-600)',
                                borderLeft: activeTab === tab.id ? '4px solid var(--primary-600)' : '4px solid transparent',
                                fontWeight: activeTab === tab.id ? '600' : '500',
                                transition: 'all 0.2s'
                            }}
                        >
                            {tab.icon}
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Content Area */}
                <div className="settings-content">
                    {activeTab === 'profil' && (
                        <div className="card fade-in">
                            <div className="card-header">
                                <h3>🏫 Profil Sekolah</h3>
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Nama Sekolah</label>
                                    <input className="form-control" value={localProfile.nama} onChange={e => setLocalProfile(p => ({ ...p, nama: e.target.value }))} />
                                </div>
                                <div className="form-group">
                                    <label>Telepon</label>
                                    <input className="form-control" value={localProfile.telepon} onChange={e => setLocalProfile(p => ({ ...p, telepon: e.target.value }))} />
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Alamat</label>
                                <textarea className="form-control" rows="3" value={localProfile.alamat} onChange={e => setLocalProfile(p => ({ ...p, alamat: e.target.value }))}></textarea>
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Email</label>
                                    <input className="form-control" value={localProfile.email} onChange={e => setLocalProfile(p => ({ ...p, email: e.target.value }))} />
                                </div>
                                <div className="form-group">
                                    <label>Logo Sekolah</label>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                                        {localProfile.school_logo && (
                                            <div style={{ width: 48, height: 48, borderRadius: 8, overflow: 'hidden', border: '1px solid var(--slate-200)', flexShrink: 0 }}>
                                                <img src={getMediaUrl(localProfile.school_logo)} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                            </div>
                                        )}
                                        <label className="btn btn-ghost" style={{ flex: 1, justifyContent: 'center', cursor: 'pointer', margin: 0 }}>
                                            <Upload size={16} /> Upload Logo Baru
                                            <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleUploadLogo} disabled={loading} />
                                        </label>
                                    </div>
                                    <small className="text-muted" style={{ display: 'block', marginTop: 8 }}>Format .png/.jpg maksimal 2MB. Logo juga akan digunakan sebagai favicon situs.</small>
                                </div>
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Kepala Sekolah</label>
                                    <input className="form-control" value={localProfile.kepala_sekolah} onChange={e => setLocalProfile(p => ({ ...p, kepala_sekolah: e.target.value }))} />
                                </div>
                                <div className="form-group">
                                    <label>NIP Kepala Sekolah</label>
                                    <input className="form-control" value={localProfile.nip_kepsek} onChange={e => setLocalProfile(p => ({ ...p, nip_kepsek: e.target.value }))} />
                                </div>
                            </div>
                            <div style={{ textAlign: 'right', marginTop: 20 }}>
                                <button className="btn btn-primary" onClick={handleSaveProfile} disabled={loading}>
                                    <Save size={18} /> {loading ? 'Menyimpan...' : 'Simpan Perubahan'}
                                </button>
                            </div>
                        </div>
                    )}

                    {activeTab === 'akademik' && (
                        <div className="card fade-in">
                            <div className="card-header">
                                <h3>📅 Manajemen Tahun Ajaran</h3>
                            </div>

                            <table className="table" style={{ marginTop: 16 }}>
                                <thead>
                                    <tr>
                                        <th>Tahun Ajaran</th>
                                        <th>Status</th>
                                        <th style={{ textAlign: 'right' }}>Aksi</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {tahunAjaranList.map(ta => (
                                        <tr key={ta.id}>
                                            <td style={{ fontWeight: '600' }}>{ta.tahun}</td>
                                            <td>
                                                <span className={`badge ${ta.status === 'aktif' ? 'badge-success' : 'badge-slate'}`}>
                                                    {ta.status === 'aktif' ? 'Aktif' : 'Non-Aktif'}
                                                </span>
                                            </td>
                                            <td style={{ textAlign: 'right' }}>
                                                {ta.status !== 'aktif' && (
                                                    <button className="btn btn-sm btn-ghost" onClick={() => setTahunAjaranAktif(ta.id)}>
                                                        Set Aktif
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            <div className="alert alert-warning" style={{ marginTop: 24, display: 'flex', gap: 12 }}>
                                <AlertTriangle size={20} />
                                <div>
                                    <strong>Perhatian!</strong>
                                    <p style={{ margin: 0, fontSize: '0.9rem' }}>Mengganti tahun ajaran aktif akan mengubah konteks seluruh data (Nilai, Infaq, Presensi) yang ditampilkan di sistem.</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'libur' && (
                        <div className="card fade-in">
                            <div className="card-header">
                                <h3>🏖️ Kalender Hari Libur</h3>
                            </div>

                            <div className="form-row" style={{ alignItems: 'flex-end', marginTop: 16 }}>
                                <div className="form-group">
                                    <label>Tanggal</label>
                                    <input type="date" className="form-control" value={newHoliday.tanggal} onChange={e => setNewHoliday(prev => ({ ...prev, tanggal: e.target.value }))} />
                                </div>
                                <div className="form-group" style={{ flex: 2 }}>
                                    <label>Keterangan</label>
                                    <input type="text" className="form-control" placeholder="Contoh: Libur Idul Fitri" value={newHoliday.keterangan} onChange={e => setNewHoliday(prev => ({ ...prev, keterangan: e.target.value }))} />
                                </div>
                                <div className="form-group">
                                    <button className="btn btn-primary" onClick={handleAddHoliday}>
                                        <Plus size={18} /> Tambah
                                    </button>
                                </div>
                            </div>

                            <div style={{ marginTop: 24, maxHeight: 400, overflowY: 'auto' }}>
                                <table className="table">
                                    <thead>
                                        <tr>
                                            <th>Tanggal</th>
                                            <th>Keterangan</th>
                                            <th style={{ textAlign: 'right' }}>Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {holidays.map(h => (
                                            <tr key={h.id}>
                                                <td>{new Date(h.tanggal).toLocaleDateString('id-ID', { dateStyle: 'long' })}</td>
                                                <td style={{ fontWeight: '500' }}>{h.keterangan}</td>
                                                <td style={{ textAlign: 'right' }}>
                                                    <button className="btn btn-sm btn-ghost text-danger" onClick={() => handleDeleteHoliday(h.id)}>
                                                        <Trash2 size={16} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                        {holidays.length === 0 && (
                                            <tr>
                                                <td colSpan="3" style={{ textAlign: 'center', padding: 40, color: 'var(--slate-400)' }}>
                                                    Belum ada data hari libur.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {activeTab === 'presensi' && (
                        <div className="card fade-in">
                            <div className="card-header">
                                <h3>⌚ Pengaturan Presensi RFID</h3>
                            </div>

                            <div className="form-row" style={{ marginTop: 16 }}>
                                <div className="form-group">
                                    <label>Batas Waktu Terlambat</label>
                                    <input type="time" className="form-control" value={attendanceSettings.late_threshold_time || ''} onChange={e => setAttendanceSettings(p => ({ ...p, late_threshold_time: e.target.value }))} />
                                    <small className="text-muted">Tap setelah jam ini akan dicatat sebagai &apos;Terlambat&apos;</small>
                                </div>
                                <div className="form-group">
                                    <label>Mulai Pulang</label>
                                    <input type="time" className="form-control" value={attendanceSettings.exit_start_time || ''} onChange={e => setAttendanceSettings(p => ({ ...p, exit_start_time: e.target.value }))} />
                                    <small className="text-muted">Tap pulang diperbolehkan setelah jam ini</small>
                                </div>
                            </div>

                            <div className="form-group">
                                <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <input type="checkbox" checked={attendanceSettings.wa_notification_enabled === 'true'} onChange={e => setAttendanceSettings(p => ({ ...p, wa_notification_enabled: e.target.checked ? 'true' : 'false' }))} />
                                    Aktifkan Notifikasi WhatsApp Otomatis
                                </label>
                            </div>

                            <div className="form-group">
                                <label>Template Pesan Masuk (Hadir)</label>
                                <textarea className="form-control" rows="2" value={attendanceSettings.wa_template_masuk || ''} onChange={e => setAttendanceSettings(p => ({ ...p, wa_template_masuk: e.target.value }))}></textarea>
                                <small className="text-muted">Tersedia placeholder: [nama], [jam]</small>
                            </div>

                            <div className="form-group">
                                <label>Template Pesan Masuk (Terlambat)</label>
                                <textarea className="form-control" rows="2" value={attendanceSettings.wa_template_terlambat || ''} onChange={e => setAttendanceSettings(p => ({ ...p, wa_template_terlambat: e.target.value }))}></textarea>
                            </div>

                            <div className="form-group">
                                <label>Template Pesan Pulang</label>
                                <textarea className="form-control" rows="2" value={attendanceSettings.wa_template_pulang || ''} onChange={e => setAttendanceSettings(p => ({ ...p, wa_template_pulang: e.target.value }))}></textarea>
                            </div>

                            <div style={{ textAlign: 'right', marginTop: 20 }}>
                                <button className="btn btn-primary" onClick={handleSaveAttendance}>
                                    <Save size={18} /> Simpan Pengaturan Presensi
                                </button>
                            </div>
                        </div>
                    )}

                    {activeTab === 'infaq' && (
                        <div className="card fade-in">
                            <div className="card-header">
                                <h3>💰 Pengaturan Infaq Harian</h3>
                            </div>

                            <div className="form-group" style={{ marginTop: 16 }}>
                                <label>Nominal Default (Rp)</label>
                                <input type="number" className="form-control" value={infaqSettings.nominal_default || ''} onChange={e => setInfaqSettings(p => ({ ...p, nominal_default: e.target.value }))} />
                            </div>

                            <div className="form-group">
                                <label>Hari Koleksi Infaq</label>
                                <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                                    {[1, 2, 3, 4, 5, 6].map(day => (
                                        <label key={day} style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}>
                                            <input
                                                type="checkbox"
                                                checked={infaqSettings.active_days?.includes(day)}
                                                onChange={e => {
                                                    const current = infaqSettings.active_days || []
                                                    const updated = e.target.checked
                                                        ? [...current, day]
                                                        : current.filter(d => d !== day)
                                                    setInfaqSettings(p => ({ ...p, active_days: updated }))
                                                }}
                                            />
                                            {['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'][day]}
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div style={{ textAlign: 'right', marginTop: 20 }}>
                                <button className="btn btn-primary" onClick={handleSaveInfaq}>
                                    <Save size={18} /> Simpan Pengaturan Infaq
                                </button>
                            </div>
                        </div>
                    )}

                    {activeTab === 'berkas' && (
                        <div className="card fade-in">
                            <div className="card-header">
                                <h3>📂 Konfigurasi Berkas Digital Siswa</h3>
                            </div>

                            <div className="form-row" style={{ alignItems: 'flex-end', marginTop: 16 }}>
                                <div className="form-group" style={{ flex: 1 }}>
                                    <label>Kode</label>
                                    <input type="text" className="form-control" placeholder="Cth: KK" value={newDokumen.kode} onChange={e => setNewDokumen(prev => ({ ...prev, kode: e.target.value.toUpperCase().replace(/\s+/g, '_') }))} />
                                </div>
                                <div className="form-group" style={{ flex: 2 }}>
                                    <label>Nama Dokumen</label>
                                    <input type="text" className="form-control" placeholder="Cth: Kartu Keluarga" value={newDokumen.nama} onChange={e => setNewDokumen(prev => ({ ...prev, nama: e.target.value }))} />
                                </div>
                                <div className="form-group" style={{ flex: 2 }}>
                                    <label>Keterangan (Opsional)</label>
                                    <input type="text" className="form-control" placeholder="Cth: FC KTP ortu gabung di dalam file" value={newDokumen.keterangan} onChange={e => setNewDokumen(prev => ({ ...prev, keterangan: e.target.value }))} />
                                </div>
                                <div className="form-group">
                                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, height: 38, cursor: 'pointer', marginBottom: 0 }}>
                                        <input type="checkbox" checked={newDokumen.is_required} onChange={e => setNewDokumen(prev => ({ ...prev, is_required: e.target.checked }))} />
                                        Wajib?
                                    </label>
                                </div>
                                <div className="form-group">
                                    <button className="btn btn-primary" onClick={handleAddDokumen} disabled={!newDokumen.kode || !newDokumen.nama}>
                                        <Plus size={18} /> Tambah
                                    </button>
                                </div>
                            </div>

                            <div style={{ marginTop: 24, maxHeight: 400, overflowY: 'auto' }}>
                                <table className="table">
                                    <thead>
                                        <tr>
                                            <th>Kode</th>
                                            <th>Nama Dokumen</th>
                                            <th>Wajib</th>
                                            <th>Keterangan</th>
                                            <th style={{ textAlign: 'right' }}>Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {masterDokumen.map(d => (
                                            <tr key={d.id}>
                                                <td className="mono fw-bold text-primary">{d.kode}</td>
                                                <td style={{ fontWeight: '600' }}>{d.nama}</td>
                                                <td>
                                                    {d.is_required ? <span className="badge badge-success">Wajib</span> : <span className="badge badge-slate">Opsional</span>}
                                                </td>
                                                <td className="text-muted">{d.keterangan || '-'}</td>
                                                <td style={{ textAlign: 'right' }}>
                                                    <button className="btn btn-sm btn-ghost text-danger" onClick={() => handleDeleteDokumen(d.id)}>
                                                        <Trash2 size={16} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                        {masterDokumen.length === 0 && (
                                            <tr>
                                                <td colSpan="5" style={{ textAlign: 'center', padding: 40, color: 'var(--slate-400)' }}>
                                                    Belum ada konfigurasi dokumen siswa.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {activeTab === 'struk' && (
                        <div className="card fade-in" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 300px', gap: '24px', alignItems: 'start', backgroundColor: 'transparent', boxShadow: 'none', padding: 0 }}>
                            <div className="card" style={{ height: '100%' }}>
                                <div className="card-header" style={{ marginBottom: 16 }}>
                                    <h3>🖨️ Pengaturan Cetak Nota</h3>
                                    <p className="text-muted" style={{ margin: 0, fontSize: '0.9rem' }}>Atur teks identitas toko/sekolah dan pesan khusus yang akan keluar pada kertas struk thermal Bluetooth maupun PDF.</p>
                                </div>
                                <div className="form-group">
                                    <label>Header Baris 1 (Nama Toko / Sekolah)</label>
                                    <input className="form-control" value={receiptConfig.header1} onChange={e => setReceiptConfig(p => ({ ...p, header1: e.target.value }))} placeholder="Contoh: SMK PPRQ" />
                                    <small className="text-muted">Ditampilkan dengan ukuran paling besar dan ditebalkan (bold).</small>
                                </div>
                                <div className="form-group">
                                    <label>Header Baris 2 (Alamat)</label>
                                    <input className="form-control" value={receiptConfig.header2} onChange={e => setReceiptConfig(p => ({ ...p, header2: e.target.value }))} placeholder="Contoh: Jl. Pesantren No.1, Kota" />
                                </div>
                                <div className="form-group">
                                    <label>Header Baris 3 (Telepon / Kontak)</label>
                                    <input className="form-control" value={receiptConfig.header3} onChange={e => setReceiptConfig(p => ({ ...p, header3: e.target.value }))} placeholder="Contoh: Telp: (021) 123-4567" />
                                </div>
                                <div className="form-group" style={{ marginTop: 24 }}>
                                    <label>Pesan Penutup (Footer)</label>
                                    <textarea className="form-control" rows="3" value={receiptConfig.footer} onChange={e => setReceiptConfig(p => ({ ...p, footer: e.target.value }))} placeholder="Contoh: Terima kasih atas pembayarannya!"></textarea>
                                    <small className="text-muted">Pesan ini akan tercetak di bagian paling bawah struk.</small>
                                </div>
                                <div style={{ textAlign: 'right', marginTop: 32 }}>
                                    <button className="btn btn-primary" onClick={handleSaveReceiptConfig} disabled={loading}>
                                        <Save size={18} /> {loading ? 'Menyimpan...' : 'Simpan Pengaturan Nota'}
                                    </button>
                                </div>
                            </div>

                            <div className="card" style={{ background: '#f1f5f9', display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'sticky', top: 20 }}>
                                <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                                    <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748b', display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <Printer size={16} /> Live Preview
                                    </div>
                                    <select
                                        className="form-control"
                                        style={{ width: 'auto', padding: '4px 8px', height: 'auto', fontSize: '0.8rem', borderRadius: 8 }}
                                        value={previewSize}
                                        onChange={(e) => setPreviewSize(e.target.value)}
                                    >
                                        <option value="58mm">58mm</option>
                                        <option value="80mm">80mm</option>
                                        <option value="A4">A4</option>
                                    </select>
                                </div>

                                <div style={{
                                    width: previewSize === 'A4' ? '100%' : (previewSize === '80mm' ? '280px' : '200px'),
                                    background: 'white',
                                    padding: previewSize === 'A4' ? '32px' : '24px 16px',
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                                    border: previewSize === 'A4' ? '1px solid #cbd5e1' : 'none',
                                    borderTop: previewSize === 'A4' ? '1px solid #cbd5e1' : '4px dashed #cbd5e1',
                                    borderBottom: previewSize === 'A4' ? '1px solid #cbd5e1' : '4px dashed #cbd5e1',
                                    fontFamily: '"Courier New", Courier, monospace',
                                    fontSize: previewSize === 'A4' ? '1rem' : (previewSize === '80mm' ? '0.9rem' : '0.8rem'),
                                    color: '#000',
                                    transition: 'all 0.3s ease'
                                }}>
                                    <div style={{ textAlign: 'center', marginBottom: 16 }}>
                                        <strong style={{ fontSize: '1.2rem', display: 'block' }}>{receiptConfig.header1 || 'NAMA TOKO'}</strong>
                                        <div style={{ marginTop: 4 }}>{receiptConfig.header2 || 'Alamat Toko'}</div>
                                        <div>{receiptConfig.header3 || 'Telp / Kontak'}</div>
                                    </div>
                                    <div style={{ borderTop: '1px dashed #94a3b8', borderBottom: '1px dashed #94a3b8', padding: '12px 0', marginBottom: 16 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}><span>Nota:</span> <span>INV-001</span></div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}><span>Tgl:</span> <span>{new Date().toLocaleString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span></div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}><span>Kasir:</span> <span>Admin</span></div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Siswa:</span> <span>Ahmad Fulan</span></div>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <span style={{ paddingRight: 8 }}>SPP Bulan Berjalan (10A)</span>
                                            <span>150.000</span>
                                        </div>
                                    </div>
                                    <div style={{ borderTop: '1px dashed #94a3b8', paddingTop: 12 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', marginBottom: 6 }}><span>TOTAL:</span> <span>150.000</span></div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}><span>Tunai:</span> <span>150.000</span></div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Kembali:</span> <span>0</span></div>
                                    </div>
                                    <div style={{ textAlign: 'center', marginTop: 24 }}>
                                        <div style={{ fontWeight: 700 }}>Metode: TUNAI</div>
                                        <div style={{ marginTop: 8, whiteSpace: 'pre-wrap', opacity: 0.8 }}>
                                            {receiptConfig.footer || 'Terima kasih atas pembayarannya!'}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'sistem' && (
                        <div className="settings-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                            
                            {/* Feature Toggles */}
                            <div className="card fade-in" style={{ gridColumn: '1 / -1' }}>
                                <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                                    <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <Scan size={20} color="var(--primary-600)" />
                                        Fitur Pengenalan Wajah AI (Face Recognition)
                                    </h3>
                                    <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <span style={{ fontWeight: 600, color: faceRecognitionEnabled ? 'var(--primary-600)' : 'var(--slate-500)', fontSize: '0.9rem' }}>
                                            {faceRecognitionEnabled ? 'Aktif' : 'Non-Aktif'}
                                        </span>
                                        <input
                                            type="checkbox"
                                            checked={faceRecognitionEnabled}
                                            onChange={handleToggleFaceRecongition}
                                            style={{ width: 44, height: 24, cursor: 'pointer', accentColor: 'var(--primary-500)' }}
                                        />
                                    </label>
                                </div>
                                <div>
                                    <p className="text-muted" style={{ margin: 0, fontSize: '0.9rem' }}>
                                        Aktifkan fitur deteksi wajah di gerbang (Gate Monitor) dan peminjaman inventaris lab. 
                                        Ini mencegah manipulasi (titip absen/titip pinjam). 
                                        Sistem akan otomatis mencocokkan wajah siswa di depan kamera dengan data referensi yang ada. 
                                    </p>
                                </div>
                            </div>
                            
                            <div className="card fade-in" style={{ gridColumn: '1 / -1' }}>
                                <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <AlertTriangle size={20} color={maintenanceMode ? "var(--warning-500)" : "var(--slate-400)"} />
                                        Mode Pemeliharaan (Maintenance)
                                    </h3>
                                    <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <span style={{ fontWeight: 600, color: maintenanceMode ? 'var(--danger-600)' : 'var(--slate-500)', fontSize: '0.9rem' }}>
                                            {maintenanceMode ? 'Sistem Terkunci' : 'Publik Terbuka'}
                                        </span>
                                        <input
                                            type="checkbox"
                                            checked={maintenanceMode}
                                            onChange={handleToggleMaintenance}
                                            style={{ width: 44, height: 24, cursor: 'pointer', accentColor: 'var(--danger-500)' }}
                                        />
                                    </label>
                                </div>
                                <div style={{ paddingTop: 16 }}>
                                    <p className="text-muted" style={{ margin: 0, fontSize: '0.9rem' }}>
                                        Nyalakan fitur ini sebelum Anda melakukan pembaruan struktur masif atau melakukan proses Restore (*rollback*) data. Mode pemeliharaan akan secara otomatis memblokir arus masuk data baru dari murid, pendaftar PPDB, maupun wali murid yang mengakses portal publik.
                                    </p>
                                    {maintenanceMode && (
                                        <div className="alert alert-warning" style={{ marginTop: 16, border: '1px solid var(--warning-200)', background: 'var(--warning-50)', color: 'var(--warning-800)', display: 'flex', gap: 12 }}>
                                            <AlertTriangle size={20} />
                                            <div>
                                                <strong>Mode Pemeliharaan Saat Ini Aktif!</strong>
                                                <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem' }}>Pengunjung publik hanya melihat halaman &quot;Sedang dalam Perbaikan&quot;, namun Anda tetap bisa beraktivitas penuh sebagai Admin di layar ini.</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="card fade-in">
                                <div className="card-header">
                                    <h3>📱 Koneksi WhatsApp</h3>
                                </div>
                                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                                    {waStatus?.isReady ? (
                                        <div style={{ color: 'var(--success-600)' }}>
                                            <CheckCircle size={48} style={{ marginBottom: 12 }} />
                                            <p style={{ fontWeight: 600, fontSize: '1.1rem' }}>WhatsApp Terhubung</p>
                                            <p className="text-muted">Status: {waStatus.statusMessage}</p>
                                        </div>
                                    ) : waStatus?.qrCode ? (
                                        <div>
                                            <img src={waStatus.qrCode} alt="QR Code" style={{ width: 200, height: 200, border: '1px solid var(--slate-200)', borderRadius: 8 }} />
                                            <p style={{ marginTop: 12, fontWeight: 500 }}>Silakan scan QR Code untuk menghubungkan WhatsApp</p>
                                        </div>
                                    ) : (
                                        <div style={{ color: 'var(--danger-600)' }}>
                                            <XCircle size={48} style={{ marginBottom: 12 }} />
                                            <p style={{ fontWeight: 600 }}>WhatsApp Terputus</p>
                                            <p className="text-muted">{waStatus?.statusMessage || 'Sedang memuat status...'}</p>
                                        </div>
                                    )}

                                    <button className="btn btn-ghost" style={{ marginTop: 20 }} onClick={fetchWaStatus}>
                                        <RefreshCw size={16} /> Refresh Status
                                    </button>
                                </div>
                            </div>

                            <div className="card fade-in">
                                <div className="card-header">
                                    <h3>💾 Backup & Pemulihan</h3>
                                </div>
                                <div style={{ padding: '20px 0' }}>
                                    <p className="text-muted" style={{ fontSize: '0.9rem', marginBottom: 20 }}>
                                        Backup data Anda secara berkala untuk mencegah kehilangan data. File backup akan mencakup seluruh database dan file unggahan.
                                    </p>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                        <button className="btn btn-ghost" style={{ justifyContent: 'center', padding: 12 }} onClick={handleBackup}>
                                            <Database size={18} /> Export Backup (.zip)
                                        </button>
                                        <div style={{ borderTop: '1px dashed var(--slate-200)', margin: '10px 0' }}></div>
                                        <Link to="/admin/backup" style={{ textDecoration: 'none' }}>
                                            <button className="btn btn-ghost text-danger" style={{ width: '100%', justifyContent: 'center', padding: 12 }}>
                                                <Shield size={18} /> Menu Restore Data
                                            </button>
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <style>{`
                .settings-nav-item:hover {
                    background: var(--slate-50) !important;
                }
                .settings-nav-item.active {
                    background: var(--primary-50) !important;
                }
                .form-group label {
                    font-weight: 500;
                    margin-bottom: 6px;
                    display: block;
                    color: var(--slate-700);
                    font-size: 0.9rem;
                }
                .alert-warning {
                    background: #fffbeb;
                    border: 1px solid #fef3c7;
                    color: #92400e;
                    padding: 16px;
                    border-radius: 8px;
                }
                .badge-slate {
                    background: var(--slate-100);
                    color: var(--slate-600);
                }
                .text-danger {
                    color: var(--danger-600);
                }
                .settings-grid .card {
                    height: 100%;
                }
            `}</style>
        </div>
    )
}
