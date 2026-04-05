import { useState, useEffect } from 'react'
import { useApp } from '../../../context/AppContext'
import { Search, Filter, Trash2, CheckCircle, XCircle, Clock, Eye, Download, UserPlus, Users, GraduationCap, X, MapPin, Phone, Calendar, Send, RefreshCw, ListOrdered, CheckCircle2, Edit2, Plus, Layers, Save, Settings, BarChart3, Megaphone, Waves, Image, FileText, AlertCircle, ExternalLink, FolderOpen, RotateCcw, LayoutGrid, List, CheckSquare, Square } from 'lucide-react'
import Swal from 'sweetalert2'
import { useCustomAlert } from '../../../hooks/useCustomAlert'
import { LineChart, Line, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import React from 'react'

class ChartErrorBoundary extends React.Component {
    constructor(props) { super(props); this.state = { hasError: false, errorStr: '' }; }
    static getDerivedStateFromError(error) { return { hasError: true, errorStr: error.toString() }; }
    render() {
        if (this.state.hasError) return <div style={{ color: '#ef4444', fontSize:'0.75rem', padding: 20 }}>Chart Error: {this.state.errorStr}</div>;
        return this.props.children;
    }
}

import { API_BASE_CMS as API_BASE, getAuthHeaders, getBearerHeader } from '../../../services/api'

export default function CmsPpdbPage() {
    const { addToast } = useApp()
    const { confirmDelete } = useCustomAlert()
    const [activeMainTab, setActiveMainTab] = useState('registrations')
    const [registrations, setRegistrations] = useState([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [filterStatus, setFilterStatus] = useState('all')
    const [selectedReg, setSelectedReg] = useState(null)
    const [classes, setClasses] = useState([])
    const [viewMode, setViewMode] = useState('table') // 'table' or 'kanban'
    const [selectedIds, setSelectedIds] = useState(new Set())
    const [bulkProcessing, setBulkProcessing] = useState(false)

    // Steps state
    const [steps, setSteps] = useState([])
    const [showStepModal, setShowStepModal] = useState(false)
    const [editStep, setEditStep] = useState(null)
    const [stepForm, setStepForm] = useState({ step_number: '01', icon: '📋', title: '', description: '', sort_order: 0, is_active: 1 })
    const [savingStep, setSavingStep] = useState(false)

    // Requirements state
    const [requirements, setRequirements] = useState([])
    const [showReqModal, setShowReqModal] = useState(false)
    const [editReq, setEditReq] = useState(null)
    const [reqForm, setReqForm] = useState({ text: '', sort_order: 0, is_active: 1 })
    const [savingReq, setSavingReq] = useState(false)

    // Settings state
    const [settings, setSettings] = useState({
        ppdb_is_open: '0',
        ppdb_year: '2025/2026',
        ppdb_quota: '100',
        ppdb_contact_wa: '',
        ppdb_hero_title: 'Penerimaan Siswa Baru',
        ppdb_hero_subtitle: 'Pusat kontrol strategis manajemen pendaftaran peserta didik baru.'
    })
    const [savingSettings, setSavingSettings] = useState(false)

    // Analytics
    const [analytics, setAnalytics] = useState(null)

    // Gelombang
    const [gelombang, setGelombang] = useState([])
    const [showGelModal, setShowGelModal] = useState(false)
    const [editGel, setEditGel] = useState(null)
    const [gelForm, setGelForm] = useState({ nama: '', kuota: 50, biaya_daftar_ulang: 1500000, tanggal_buka: '', tanggal_tutup: '', is_active: 1 })
    const [savingGel, setSavingGel] = useState(false)

    // Announcements
    const [ppdbAnnouncements, setPpdbAnnouncements] = useState([])
    const [showAnnModal, setShowAnnModal] = useState(false)
    const [editAnn, setEditAnn] = useState(null)
    const [annForm, setAnnForm] = useState({ judul: '', isi: '', tipe: 'info', is_active: 1 })
    const [savingAnn, setSavingAnn] = useState(false)

    const styles = `
        @media (max-width: 768px) {
            .cms-hero-header {
                flex-direction: column !important;
                align-items: flex-start !important;
                padding: 30px 20px !important;
                gap: 20px !important;
            }
            .cms-hero-header h1 {
                font-size: 1.8rem !important;
            }
            .cms-hero-actions {
                width: 100%;
                flex-direction: row !important;
            }
            .cms-hero-actions button, .cms-hero-actions a {
                flex: 1;
                justify-content: center;
                font-size: 0.85rem !important;
            }
            .cms-tab-nav {
                width: 100% !important;
                max-width: 100% !important;
                overflow-x: auto;
                white-space: nowrap;
                padding: 4px !important;
                display: flex !important;
                gap: 4px !important;
                scrollbar-width: none;
            }
            .cms-tab-nav::-webkit-scrollbar { display: none; }
            .cms-tab-btn {
                padding: 10px 16px !important;
                font-size: 0.85rem !important;
                flex-shrink: 0;
            }
            .cms-tab-btn span {
                display: inline-block !important;
            }
            .cms-section-card {
                padding: 1.25rem !important;
                border-radius: 20px !important;
            }
            .grid-2 {
                grid-template-columns: 1fr !important;
            }
            .table-responsive thead {
                display: none;
            }
            .table-responsive tr {
                display: block;
                padding: 1.5rem 0;
                border-bottom: 1px solid var(--border-color);
            }
            .table-responsive tr td {
                display: block !important;
                width: 100% !important;
                padding: 0.5rem 24px !important;
                border: none !important;
                text-align: left !important;
            }
            .table-responsive tr td:last-child {
                text-align: left !important;
                padding-top: 1rem !important;
            }
            .table-responsive tr td:last-child .d-flex {
                justify-content: flex-start !important;
            }
        }
    `;

    useEffect(() => {
        loadAll()
    }, [])

    const loadAll = async () => {
        setLoading(true)
        await Promise.all([loadData(), loadSteps(), loadRequirements(), loadSettings(), loadClasses(), loadAnalytics(), loadGelombang(), loadPpdbAnnouncements()])
        setLoading(false)
    }

    const loadAnalytics = async () => {
        try { const res = await fetch(`${API_BASE}/ppdb/analytics`, { headers: getAuthHeaders() }); if (res.ok) setAnalytics(await res.json()); } catch {}
    }
    const loadGelombang = async () => {
        try { const res = await fetch(`${API_BASE}/ppdb/gelombang`, { headers: getAuthHeaders() }); if (res.ok) setGelombang(await res.json()); } catch {}
    }
    const loadPpdbAnnouncements = async () => {
        try { const res = await fetch(`${API_BASE}/ppdb/announcements`, { headers: getAuthHeaders() }); if (res.ok) setPpdbAnnouncements(await res.json()); } catch {}
    }

    const saveGel = async (e) => {
        e.preventDefault(); setSavingGel(true)
        try {
            const method = editGel ? 'PUT' : 'POST'
            const url = editGel ? `${API_BASE}/ppdb/gelombang/${editGel.id}` : `${API_BASE}/ppdb/gelombang`
            const res = await fetch(url, { method, headers: getAuthHeaders(), body: JSON.stringify(gelForm) })
            if (res.ok) { addToast('success', 'Berhasil', 'Gelombang tersimpan'); setShowGelModal(false); loadGelombang() }
        } catch { addToast('danger', 'Error', 'Gagal menyimpan') }
        finally { setSavingGel(false) }
    }
    const deleteGel = async (g) => {
        if (await confirmDelete('Hapus gelombang?', 'Data akan dihapus permanen.')) {
            try { await fetch(`${API_BASE}/ppdb/gelombang/${g.id}`, { method: 'DELETE', headers: getAuthHeaders() }); loadGelombang() } catch {}
        }
    }
    const openGelModal = (g) => { setEditGel(g || null); setGelForm(g ? { nama: g.nama, kuota: g.kuota, biaya_daftar_ulang: g.biaya_daftar_ulang, tanggal_buka: g.tanggal_buka?.split('T')[0] || '', tanggal_tutup: g.tanggal_tutup?.split('T')[0] || '', is_active: g.is_active } : { nama: '', kuota: 50, biaya_daftar_ulang: 1500000, tanggal_buka: '', tanggal_tutup: '', is_active: 1 }); setShowGelModal(true) }

    const saveAnn = async (e) => {
        e.preventDefault(); setSavingAnn(true)
        try {
            const method = editAnn ? 'PUT' : 'POST'
            const url = editAnn ? `${API_BASE}/ppdb/announcements/${editAnn.id}` : `${API_BASE}/ppdb/announcements`
            const res = await fetch(url, { method, headers: getAuthHeaders(), body: JSON.stringify(annForm) })
            if (res.ok) { addToast('success', 'Berhasil', 'Pengumuman tersimpan'); setShowAnnModal(false); loadPpdbAnnouncements() }
        } catch { addToast('danger', 'Error', 'Gagal menyimpan') }
        finally { setSavingAnn(false) }
    }
    const deleteAnn = async (a) => {
        if (await confirmDelete('Hapus pengumuman?', '')) {
            try { await fetch(`${API_BASE}/ppdb/announcements/${a.id}`, { method: 'DELETE', headers: getAuthHeaders() }); loadPpdbAnnouncements() } catch {}
        }
    }
    const openAnnModal = (a) => { setEditAnn(a || null); setAnnForm(a ? { judul: a.judul, isi: a.isi || '', tipe: a.tipe, is_active: a.is_active } : { judul: '', isi: '', tipe: 'info', is_active: 1 }); setShowAnnModal(true) }

    const loadClasses = async () => {
        try {
            const res = await fetch(`${API_BASE.replace('/admin/cms', '')}/kelas`, {
                headers: getBearerHeader()
            })
            if (res.ok) {
                const data = await res.json()
                setClasses(data)
            }
        } catch (err) {
            console.error('Failed to load classes:', err)
        }
    }

    const loadData = async () => {
        try {
            setLoading(true)
            const res = await fetch(`${API_BASE}/ppdb`, {
                headers: getBearerHeader()
            })
            if (res.ok) {
                const data = await res.json()
                setRegistrations(data)
            }
        } catch (err) {
            addToast('danger', 'Error', 'Gagal memuat data PPDB')
        } finally {
            setLoading(false)
        }
    }

    const handleUpdateStatus = async (id, newStatus) => {
        const { isConfirmed } = await Swal.fire({
            title: 'Konfirmasi',
            text: `Ubah status pendaftaran menjadi ${newStatus.toUpperCase()}?`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Ya, Ubah',
            confirmButtonColor: newStatus === 'accepted' ? '#10b981' : '#ef4444',
            cancelButtonText: 'Batal'
        })

        if (!isConfirmed) return

        try {
            const res = await fetch(`${API_BASE}/ppdb/${id}/status`, {
                method: 'PATCH',
                headers: getAuthHeaders(),
                body: JSON.stringify({ status: newStatus })
            })

            if (res.ok) {
                addToast('success', 'Berhasil', 'Status pendaftaran diperbarui')
                setRegistrations(prev => prev.map(r => r.id === id ? { ...r, status: newStatus } : r))
                if (selectedReg && selectedReg.id === id) {
                    setSelectedReg(prev => ({ ...prev, status: newStatus }))
                }
            }
        } catch (err) {
            addToast('danger', 'Error', 'Gagal memperbarui status')
        }
    }

    const handleAccept = async (id) => {
        const { value: kelasId, isConfirmed: isAccepted } = await Swal.fire({
            title: 'Terima & Pilih Kelas',
            html: `
                <div style="text-align: left; margin-top: 10px;">
                    <p style="margin-bottom: 10px; font-size: 0.9rem; color: #64748b;">Pilih kelas penempatan awal untuk <b>${registrations.find(r => r.id === id)?.nama_lengkap}</b>:</p>
                    <select id="swal-input-kelas" class="swal2-select" style="width: 100%; margin: 0;">
                        <option value="">-- Pilih Kelas --</option>
                        ${classes.map(k => `<option value="${k.id}">${k.nama}</option>`).join('')}
                    </select>
                    <p style="margin-top: 15px; font-size: 0.8rem; color: #94a3b8; line-height: 1.4;">
                        * Sistem akan memindahkan data ke tabel Siswa Aktif, menyimpan relasi Ortu, dan membuat Tagihan Daftar Ulang otomatis.
                    </p>
                </div>
            `,
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Terima Siswa',
            confirmButtonColor: '#10b981',
            cancelButtonText: 'Batal',
            preConfirm: () => {
                const val = document.getElementById('swal-input-kelas').value
                if (!val) {
                    Swal.showValidationMessage('Anda harus memilih kelas!')
                }
                return val
            }
        })

        if (!isAccepted) return

        try {
            const res = await fetch(`${API_BASE}/ppdb/${id}/accept`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({ kelas_id: kelasId })
            })

            const json = await res.json()
            if (res.ok && json.success) {
                addToast('success', 'Berhasil', json.message || 'Siswa diterima dan disinkronisasi')
                setRegistrations(prev => prev.map(r => r.id === id ? { ...r, status: 'accepted' } : r))
                if (selectedReg && selectedReg.id === id) {
                    setSelectedReg(prev => ({ ...prev, status: 'accepted' }))
                }
            } else {
                addToast('danger', 'Gagal', json.error || 'Gagal memproses sinkronisasi')
            }
        } catch (err) {
            addToast('danger', 'Error', 'Terjadi kesalahan sistem')
        }
    }

    const handleRollback = async (id) => {
        const reg = registrations.find(r => r.id === id)
        const { isConfirmed } = await Swal.fire({
            title: 'Batalkan Penerimaan?',
            html: `<div style="text-align:left;font-size:0.9rem;color:#64748b;line-height:1.6">
                <p>Anda akan membatalkan penerimaan <b>${reg?.nama_lengkap || ''}</b>.</p>
                <p style="color:#ef4444;font-weight:700">⚠️ Data siswa, orang tua, dan dokumen yang sudah disinkronisasi akan <u>dihapus permanen</u> dari sistem akademik.</p>
                <p>Status akan dikembalikan ke <b>Menunggu Verifikasi</b>.</p>
            </div>`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Ya, Batalkan Penerimaan',
            cancelButtonText: 'Tidak Jadi',
            confirmButtonColor: '#ef4444'
        })

        if (!isConfirmed) return

        try {
            const res = await fetch(`${API_BASE}/ppdb/${id}/rollback`, {
                method: 'POST',
                headers: getAuthHeaders()
            })
            const json = await res.json()
            if (res.ok && json.success) {
                addToast('success', 'Berhasil', json.message || 'Penerimaan dibatalkan')
                setRegistrations(prev => prev.map(r => r.id === id ? { ...r, status: 'pending_verification', siswa_id: null } : r))
                if (selectedReg && selectedReg.id === id) {
                    setSelectedReg(prev => ({ ...prev, status: 'pending_verification', siswa_id: null }))
                }
            } else {
                addToast('danger', 'Gagal', json.error || 'Gagal membatalkan penerimaan')
            }
        } catch (err) {
            addToast('danger', 'Error', 'Terjadi kesalahan sistem')
        }
    }

    const handleDelete = async (id) => {
        const { isConfirmed } = await Swal.fire({
            title: 'Hapus Data?',
            text: "Data yang dihapus tidak dapat dikembalikan!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            confirmButtonText: 'Ya, Hapus',
            cancelButtonText: 'Batal'
        })

        if (!isConfirmed) return

        try {
            const res = await fetch(`${API_BASE}/ppdb/${id}`, {
                method: 'DELETE',
                headers: getBearerHeader()
            })

            if (res.ok) {
                addToast('success', 'Berhasil', 'Data berhasil dihapus')
                setRegistrations(prev => prev.filter(r => r.id !== id))
                if (selectedReg && selectedReg.id === id) setSelectedReg(null)
            }
        } catch (err) {
            addToast('danger', 'Error', 'Gagal menghapus data')
        }
    }

    const filteredData = registrations.filter(r => {
        const matchSearch = r.nama_lengkap.toLowerCase().includes(search.toLowerCase()) ||
            r.registration_number.toLowerCase().includes(search.toLowerCase()) ||
            r.nisn.includes(search)
        const matchStatus = filterStatus === 'all' || r.status === filterStatus
        return matchSearch && matchStatus
    })

    // Bulk selection helpers
    const toggleSelect = (id) => {
        setSelectedIds(prev => {
            const next = new Set(prev)
            if (next.has(id)) next.delete(id); else next.add(id)
            return next
        })
    }
    const toggleSelectAll = () => {
        if (selectedIds.size === filteredData.length) setSelectedIds(new Set())
        else setSelectedIds(new Set(filteredData.map(r => r.id)))
    }
    const handleBulkAccept = async () => {
        if (selectedIds.size === 0) return
        const { value: kelasId, isConfirmed } = await Swal.fire({
            title: `Terima ${selectedIds.size} Pendaftar`,
            html: `<div style="text-align:left"><p style="margin-bottom:10px;color:#64748b">Pilih kelas penempatan:</p><select id="swal-bulk-kelas" class="swal2-select" style="width:100%"><option value="">-- Pilih Kelas --</option>${classes.map(k => `<option value="${k.id}">${k.nama}</option>`).join('')}</select></div>`,
            icon: 'question', showCancelButton: true, confirmButtonText: 'Terima Semua', confirmButtonColor: '#10b981', cancelButtonText: 'Batal',
            preConfirm: () => { const v = document.getElementById('swal-bulk-kelas').value; if (!v) Swal.showValidationMessage('Pilih kelas!'); return v }
        })
        if (!isConfirmed) return
        setBulkProcessing(true)
        let success = 0, failed = 0
        for (const id of selectedIds) {
            try {
                const res = await fetch(`${API_BASE}/ppdb/${id}/accept`, { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify({ kelas_id: kelasId }) })
                const json = await res.json()
                if (res.ok && json.success) success++; else failed++
            } catch { failed++ }
        }
        setBulkProcessing(false)
        setSelectedIds(new Set())
        addToast('success', 'Selesai', `${success} diterima, ${failed} gagal`)
        loadData()
    }
    const handleBulkReject = async () => {
        if (selectedIds.size === 0) return
        const { isConfirmed } = await Swal.fire({ title: `Tolak ${selectedIds.size} Pendaftar?`, icon: 'warning', showCancelButton: true, confirmButtonText: 'Tolak Semua', confirmButtonColor: '#ef4444', cancelButtonText: 'Batal' })
        if (!isConfirmed) return
        setBulkProcessing(true)
        for (const id of selectedIds) {
            try { await fetch(`${API_BASE}/ppdb/${id}/status`, { method: 'PATCH', headers: getAuthHeaders(), body: JSON.stringify({ status: 'rejected' }) }) } catch {}
        }
        setBulkProcessing(false)
        setSelectedIds(new Set())
        addToast('success', 'Selesai', 'Pendaftar terpilih telah ditolak')
        loadData()
    }

    // Kanban columns
    const KANBAN_COLUMNS = [
        { key: 'draft', label: 'Draft', color: '#94a3b8', icon: '📝' },
        { key: 'locked', label: 'Terkirim', color: '#3b82f6', icon: '📨' },
        { key: 'pending_verification', label: 'Verifikasi', color: '#f59e0b', icon: '🔍' },
        { key: 'accepted', label: 'Diterima', color: '#10b981', icon: '✅' },
        { key: 'rejected', label: 'Ditolak', color: '#ef4444', icon: '❌' }
    ]

    const stats = {
        total: registrations.length,
        pending: registrations.filter(r => r.status === 'pending_verification' || r.status === 'wawancara').length,
        approved: registrations.filter(r => r.status === 'accepted').length,
        rejected: registrations.filter(r => r.status === 'rejected').length
    }

    // ==================== SETTINGS LOGIC ====================
    const loadSettings = async () => {
        try {
            const res = await fetch(`${API_BASE}/settings`, { headers: getAuthHeaders() })
            if (res.ok) {
                const data = await res.json()
                const map = { ...settings }
                data.forEach(s => {
                    if (s.setting_key.startsWith('ppdb_')) {
                        map[s.setting_key] = s.setting_value
                    }
                })
                setSettings(map)
            }
        } catch { /* silent */ }
    }

    const saveSettings = async (keys) => {
        setSavingSettings(true)
        try {
            const updates = keys.map(k => ({ setting_key: k, setting_value: String(settings[k] || '') }))
            const res = await fetch(`${API_BASE}/settings`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify({ updates })
            })
            if (res.ok) {
                addToast('success', 'Berhasil', 'Pengaturan PPDB disimpan')
            } else {
                addToast('danger', 'Gagal', 'Gagal menyimpan pengaturan')
            }
        } catch { addToast('danger', 'Error', 'Terjadi kesalahan') }
        finally { setSavingSettings(false) }
    }

    const handleSettingChange = (key, value) => {
        setSettings(prev => ({ ...prev, [key]: value }))
    }

    // ==================== STEPS LOGIC ====================
    const loadSteps = async () => {
        try {
            const res = await fetch(`${API_BASE}/ppdb-steps`, { headers: getAuthHeaders() })
            if (res.ok) setSteps(await res.json())
        } catch { /* silent */ }
    }

    const openStepModal = (s = null) => {
        setEditStep(s)
        setStepForm(s
            ? { step_number: s.step_number, icon: s.icon, title: s.title, description: s.description || '', sort_order: s.sort_order, is_active: s.is_active }
            : { step_number: `0${steps.length + 1}`.slice(-2), icon: '📋', title: '', description: '', sort_order: steps.length, is_active: 1 }
        )
        setShowStepModal(true)
    }

    const saveStep = async (e) => {
        e.preventDefault()
        setSavingStep(true)
        try {
            const url = editStep ? `${API_BASE}/ppdb-steps/${editStep.id}` : `${API_BASE}/ppdb-steps`
            const method = editStep ? 'PUT' : 'POST'
            const res = await fetch(url, { method, headers: getAuthHeaders(), body: JSON.stringify(stepForm) })
            if (res.ok) {
                addToast('success', 'Berhasil', `Langkah ${editStep ? 'diperbarui' : 'ditambahkan'}`)
                setShowStepModal(false)
                loadSteps()
            } else {
                const err = await res.json()
                addToast('danger', 'Gagal', err.error || 'Terjadi kesalahan')
            }
        } catch { addToast('danger', 'Error', 'Gagal menyimpan langkah') }
        finally { setSavingStep(false) }
    }

    const deleteStep = async (s) => {
        if (await confirmDelete(`Hapus langkah "${s.title}"?`, 'Data akan dihapus permanen.')) {
            try {
                const res = await fetch(`${API_BASE}/ppdb-steps/${s.id}`, { method: 'DELETE', headers: getAuthHeaders() })
                if (res.ok) { addToast('success', 'Berhasil', 'Langkah dihapus'); loadSteps() }
            } catch { addToast('danger', 'Error', 'Gagal menghapus') }
        }
    }

    // ==================== REQUIREMENTS LOGIC ====================
    const loadRequirements = async () => {
        try {
            const res = await fetch(`${API_BASE}/ppdb-requirements`, { headers: getAuthHeaders() })
            if (res.ok) setRequirements(await res.json())
        } catch { /* silent */ }
    }

    const openReqModal = (r = null) => {
        setEditReq(r)
        setReqForm(r
            ? { text: r.text, sort_order: r.sort_order, is_active: r.is_active }
            : { text: '', sort_order: requirements.length, is_active: 1 }
        )
        setShowReqModal(true)
    }

    const saveReq = async (e) => {
        e.preventDefault()
        setSavingReq(true)
        try {
            const url = editReq ? `${API_BASE}/ppdb-requirements/${editReq.id}` : `${API_BASE}/ppdb-requirements`
            const method = editReq ? 'PUT' : 'POST'
            const res = await fetch(url, { method, headers: getAuthHeaders(), body: JSON.stringify(reqForm) })
            if (res.ok) {
                addToast('success', 'Berhasil', `Syarat ${editReq ? 'diperbarui' : 'ditambahkan'}`)
                setShowReqModal(false)
                loadRequirements()
            } else {
                const err = await res.json()
                addToast('danger', 'Gagal', err.error || 'Terjadi kesalahan')
            }
        } catch { addToast('danger', 'Error', 'Gagal menyimpan syarat') }
        finally { setSavingReq(false) }
    }

    const deleteReq = async (r) => {
        if (await confirmDelete(`Hapus syarat ini?`, 'Data akan dihapus permanen.')) {
            try {
                const res = await fetch(`${API_BASE}/ppdb-requirements/${r.id}`, { method: 'DELETE', headers: getAuthHeaders() })
                if (res.ok) { addToast('success', 'Berhasil', 'Syarat dihapus'); loadRequirements() }
            } catch { addToast('danger', 'Error', 'Gagal menghapus') }
        }
    }

    const getStatusBadge = (status) => {
        switch (status) {
            case 'accepted': return <span className="badge" style={{ background: '#dcfce7', color: '#166534', border: '1px solid #bbf7d0' }}>Diterima</span>
            case 'rejected': return <span className="badge" style={{ background: '#fee2e2', color: '#991b1b', border: '1px solid #fecaca' }}>Ditolak</span>
            case 'draft': return <span className="badge" style={{ background: '#f8fafc', color: '#64748b', border: '1px solid #cbd5e1' }}>Draft Berkas</span>
            case 'locked': return <span className="badge" style={{ background: '#e0f2fe', color: '#0369a1', border: '1px solid #bae6fd' }}>Terkirim</span>
            case 'pending_verification': return <span className="badge" style={{ background: '#fef9c3', color: '#854d0e', border: '1px solid #fef08a' }}>Menunggu</span>
            default: return <span className="badge" style={{ background: '#e0f2fe', color: '#0369a1', border: '1px solid #bae6fd' }}>{status}</span>
        }
    }

    return (
        <div className="fade-in">
            <style dangerouslySetInnerHTML={{ __html: styles }} />
            <div className="page-header cms-hero-header">
                <div className="cms-hero-overlay"></div>

                <div style={{ flex: 1, minWidth: '300px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: '16px' }}>
                        <div className="cms-hero-badge">Manajemen PPDB</div>
                        <div className="cms-hero-badge-outline">
                            <Calendar size={14} className="text-primary" strokeWidth={3} /> T.A 2025/2026
                        </div>
                    </div>

                    <h1 style={{ fontSize: '2.5rem', fontWeight: 900, letterSpacing: '-1px', marginBottom: '8px', color: 'var(--text-color)', lineHeight: 1.2 }}>
                        Penerimaan Siswa Baru
                    </h1>
                    <p style={{ fontSize: '1.1rem', margin: 0, color: 'var(--text-color)', opacity: 1, fontWeight: 500, maxWidth: '600px', lineHeight: 1.6 }}>
                        Pusat kontrol strategis manajemen pendaftaran dan konfigurasi alur PPDB.
                    </p>
                </div>

                <div className="cms-hero-actions">
                    <button className="btn btn-outline" style={{ height: 48, borderRadius: 14 }} onClick={loadAll}>
                        <RefreshCw size={18} className="mr-2" /> Refresh
                    </button>
                    <a href="/ppdb" target="_blank" rel="noreferrer" className="btn btn-primary" style={{ height: 48, borderRadius: 14 }}>
                        <Eye size={18} className="mr-2" /> Lihat Portal
                    </a>
                </div>
            </div>

            {/* Top-level Tab Navigation */}
            <div className="cms-tab-nav mb-4" style={{ maxWidth: 'fit-content' }}>
                <button
                    className={`cms-tab-btn ${activeMainTab === 'registrations' ? 'active' : ''}`}
                    onClick={() => setActiveMainTab('registrations')}
                >
                    <Users size={18} /> <span>Data Pendaftar</span>
                </button>
                <button
                    className={`cms-tab-btn ${activeMainTab === 'steps' ? 'active' : ''}`}
                    onClick={() => setActiveMainTab('steps')}
                >
                    <ListOrdered size={18} /> <span>Alur Pendaftaran</span>
                </button>
                <button
                    className={`cms-tab-btn ${activeMainTab === 'requirements' ? 'active' : ''}`}
                    onClick={() => setActiveMainTab('requirements')}
                >
                    <CheckCircle2 size={18} /> <span>Syarat Dokumen</span>
                </button>
                <button
                    className={`cms-tab-btn ${activeMainTab === 'settings' ? 'active' : ''}`}
                    onClick={() => setActiveMainTab('settings')}
                >
                    <Settings size={18} /> <span>Pengaturan</span>
                </button>
                <button
                    className={`cms-tab-btn ${activeMainTab === 'analytics' ? 'active' : ''}`}
                    onClick={() => setActiveMainTab('analytics')}
                >
                    <BarChart3 size={18} /> <span>Analytics</span>
                </button>
                <button
                    className={`cms-tab-btn ${activeMainTab === 'gelombang' ? 'active' : ''}`}
                    onClick={() => setActiveMainTab('gelombang')}
                >
                    <Waves size={18} /> <span>Gelombang</span>
                </button>
                <button
                    className={`cms-tab-btn ${activeMainTab === 'pengumuman' ? 'active' : ''}`}
                    onClick={() => setActiveMainTab('pengumuman')}
                >
                    <Megaphone size={18} /> <span>Pengumuman</span>
                </button>
            </div>

            {/* Tab Content Area */}
            {activeMainTab === 'registrations' && (
                <div className="animate-fade-in">
                    {/* Stats Section */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '32px' }}>
                        <div className="card" style={{ padding: '20px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '16px', position: 'relative', overflow: 'hidden' }}>
                            <div style={{ padding: '12px', background: 'rgba(99, 102, 241, 0.08)', color: 'var(--primary-color)', borderRadius: '12px' }}>
                                <Users size={22} />
                            </div>
                            <div>
                                <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Total Pendaftar</div>
                                <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-color)', lineHeight: 1 }}>{stats.total}</div>
                            </div>
                        </div>

                        <div className="card" style={{ padding: '20px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '16px', position: 'relative', overflow: 'hidden' }}>
                            <div style={{ padding: '12px', background: 'rgba(245, 158, 11, 0.08)', color: '#f59e0b', borderRadius: '12px' }}>
                                <Clock size={22} />
                            </div>
                            <div>
                                <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Verifikasi</div>
                                <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#d97706', lineHeight: 1 }}>{stats.pending}</div>
                            </div>
                        </div>

                        <div className="card" style={{ padding: '20px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '16px', position: 'relative', overflow: 'hidden' }}>
                            <div style={{ padding: '12px', background: 'rgba(16, 185, 129, 0.08)', color: '#10b981', borderRadius: '12px' }}>
                                <CheckCircle size={22} />
                            </div>
                            <div>
                                <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Diterima</div>
                                <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#059669', lineHeight: 1 }}>{stats.approved}</div>
                            </div>
                        </div>

                        <div className="card" style={{ padding: '20px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', borderRadius: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '12px', position: 'relative', overflow: 'hidden' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <div style={{ padding: '8px', background: 'var(--primary-color)', color: 'white', borderRadius: '8px' }}>
                                        <GraduationCap size={16} />
                                    </div>
                                    <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Sisa Kuota</div>
                                </div>
                                <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-color)' }}>{Math.max(0, (parseInt(settings.ppdb_quota) || 100) - stats.approved)} / {settings.ppdb_quota}</div>
                            </div>
                            <div style={{ width: '100%', height: '6px', background: 'var(--bg-hover)', borderRadius: '10px', overflow: 'hidden' }}>
                                <div style={{ height: '100%', width: `${Math.min(100, ((stats.approved / (parseInt(settings.ppdb_quota) || 100)) * 100))}%`, background: 'var(--primary-color)', borderRadius: '10px' }}></div>
                            </div>
                        </div>
                    </div>

                    {/* Registration List Card */}
                    <div className="card cms-section-card" style={{ padding: 0 }}>
                        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)', display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ flex: 1, minWidth: 0, position: 'relative' }}>
                                <Search style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} size={18} />
                                <input
                                    type="text"
                                    className="form-control"
                                    placeholder="Cari nama, NISN, atau No. Registrasi..."
                                    style={{ paddingLeft: '48px', height: '44px', borderRadius: 12, background: 'var(--bg-hover)', border: '1px solid var(--border-color)' }}
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                />
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                {/* View Toggle */}
                                <div style={{ display: 'flex', background: 'var(--bg-hover)', borderRadius: 10, padding: 3, border: '1px solid var(--border-color)' }}>
                                    <button onClick={() => setViewMode('table')} style={{ padding: '6px 10px', borderRadius: 8, border: 'none', cursor: 'pointer', background: viewMode === 'table' ? 'var(--bg-card)' : 'transparent', color: viewMode === 'table' ? 'var(--primary-color)' : 'var(--text-muted)', boxShadow: viewMode === 'table' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', display: 'flex', alignItems: 'center', gap: 4, fontWeight: 700, fontSize: '0.8rem' }}>
                                        <List size={15} /> Tabel
                                    </button>
                                    <button onClick={() => setViewMode('kanban')} style={{ padding: '6px 10px', borderRadius: 8, border: 'none', cursor: 'pointer', background: viewMode === 'kanban' ? 'var(--bg-card)' : 'transparent', color: viewMode === 'kanban' ? 'var(--primary-color)' : 'var(--text-muted)', boxShadow: viewMode === 'kanban' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', display: 'flex', alignItems: 'center', gap: 4, fontWeight: 700, fontSize: '0.8rem' }}>
                                        <LayoutGrid size={15} /> Kanban
                                    </button>
                                </div>

                                <div style={{ padding: '8px 16px', background: 'var(--bg-hover)', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 10, border: '1px solid var(--border-color)' }}>
                                    <Filter size={16} color="var(--text-muted)" />
                                    <select style={{ border: 'none', background: 'transparent', fontWeight: 600, color: 'var(--text-color)', cursor: 'pointer', outline: 'none' }} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                                        <option value="all">Semua Status</option>
                                        <option value="draft">Draft Berkas</option>
                                        <option value="locked">Terkirim</option>
                                        <option value="pending_verification">Menunggu Verifikasi</option>
                                        <option value="accepted">Diterima</option>
                                        <option value="rejected">Ditolak</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Bulk Action Toolbar */}
                        {selectedIds.size > 0 && viewMode === 'table' && (
                            <div style={{ padding: '12px 24px', background: 'linear-gradient(90deg, rgba(79,70,229,0.08), rgba(124,58,237,0.05))', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: 12, animation: 'fadeIn 0.3s' }}>
                                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--primary-color)' }}>{selectedIds.size} dipilih</span>
                                <button disabled={bulkProcessing} onClick={handleBulkAccept} style={{ padding: '7px 16px', borderRadius: 10, border: 'none', background: '#10b981', color: 'white', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <CheckCircle size={14} /> Terima Semua
                                </button>
                                <button disabled={bulkProcessing} onClick={handleBulkReject} style={{ padding: '7px 16px', borderRadius: 10, border: 'none', background: '#ef4444', color: 'white', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <XCircle size={14} /> Tolak Semua
                                </button>
                                <button onClick={() => setSelectedIds(new Set())} style={{ padding: '7px 12px', borderRadius: 10, border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-muted)', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer' }}>Batal</button>
                            </div>
                        )}

                        {/* TABLE VIEW */}
                        {viewMode === 'table' && (
                        <div className="table-responsive" style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                            <table className="table" style={{ margin: 0, minWidth: '800px' }}>
                                <thead style={{ background: 'var(--bg-hover)' }}>
                                    <tr>
                                        <th style={{ padding: '16px 12px 16px 24px', width: 40 }}>
                                            <button onClick={toggleSelectAll} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: selectedIds.size === filteredData.length && filteredData.length > 0 ? 'var(--primary-color)' : 'var(--text-muted)', display: 'flex' }}>
                                                {selectedIds.size === filteredData.length && filteredData.length > 0 ? <CheckSquare size={18} /> : <Square size={18} />}
                                            </button>
                                        </th>
                                        <th style={{ padding: '16px 24px', color: 'var(--text-muted)', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase' }}>Waktu Daftar</th>
                                        <th style={{ padding: '16px 24px', color: 'var(--text-muted)', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase' }}>No. Registrasi</th>
                                        <th style={{ padding: '16px 24px', color: 'var(--text-muted)', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase' }}>Calon Siswa</th>
                                        <th style={{ padding: '16px 24px', color: 'var(--text-muted)', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase' }}>Asal Sekolah</th>
                                        <th style={{ padding: '16px 24px', color: 'var(--text-muted)', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase' }}>Status</th>
                                        <th style={{ padding: '16px 24px', color: 'var(--text-muted)', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', textAlign: 'right' }}>Aksi</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        <tr><td colSpan="7" style={{ textAlign: 'center', padding: '100px 0', color: 'var(--text-muted)' }}>Memuat data pendaftaran...</td></tr>
                                    ) : filteredData.length === 0 ? (
                                        <tr><td colSpan="7" style={{ textAlign: 'center', padding: '100px 0' }}>
                                            <div style={{ opacity: 0.3, marginBottom: 15, color: 'var(--text-muted)' }}><UserPlus size={48} style={{ margin: '0 auto' }} /></div>
                                            <div style={{ color: 'var(--text-muted)', fontWeight: 500 }}>Tidak ada data pendaftaran ditemukan.</div>
                                        </td></tr>
                                    ) : filteredData.map(r => (
                                        <tr key={r.id} style={{ transition: 'all 0.2s', background: selectedIds.has(r.id) ? 'rgba(79,70,229,0.04)' : 'transparent' }}>
                                            <td style={{ padding: '20px 12px 20px 24px', borderBottom: '1px solid var(--border-color)', width: 40 }}>
                                                <button onClick={() => toggleSelect(r.id)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: selectedIds.has(r.id) ? 'var(--primary-color)' : 'var(--text-muted)', display: 'flex' }}>
                                                    {selectedIds.has(r.id) ? <CheckSquare size={18} /> : <Square size={18} />}
                                                </button>
                                            </td>
                                            <td style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)' }}>
                                                <div style={{ fontWeight: 600 }}>{new Date(r.created_at).toLocaleDateString('id-ID')}</div>
                                                <div className="text-secondary" style={{ fontSize: '0.8rem' }}>{new Date(r.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</div>
                                            </td>
                                            <td style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)' }}>
                                                <span style={{ padding: '6px 12px', background: 'var(--bg-hover)', borderRadius: 8, fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-color)' }}>{r.registration_number}</span>
                                            </td>
                                            <td style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)' }}>
                                                <div style={{ fontWeight: 700, color: 'var(--text-color)' }}>{r.nama_lengkap}</div>
                                                <div className="text-secondary" style={{ fontSize: '0.85rem' }}>NISN: {r.nisn}</div>
                                            </td>
                                            <td style={{ padding: '20px 24px', color: 'var(--text-muted)', borderBottom: '1px solid var(--border-color)' }}>{r.asal_sekolah}</td>
                                            <td style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)' }}>{getStatusBadge(r.status)}</td>
                                            <td style={{ padding: '20px 24px', textAlign: 'right', borderBottom: '1px solid var(--border-color)' }}>
                                                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                                                    <button className="btn-icon text-primary" onClick={() => setSelectedReg(r)} title="Lihat Detail">
                                                        <Eye size={18} />
                                                    </button>

                                                    {(r.status === 'pending_verification' || r.status === 'locked' || r.status === 'wawancara') && (
                                                        <>
                                                            <button className="btn-icon text-success" onClick={() => handleAccept(r.id)} title="Terima & Sinkronisasi">
                                                                <CheckCircle size={18} />
                                                            </button>
                                                            <button className="btn-icon text-danger" onClick={() => handleUpdateStatus(r.id, 'rejected')} title="Tolak">
                                                                <XCircle size={18} />
                                                            </button>
                                                        </>
                                                    )}

                                                    {r.status === 'accepted' && (
                                                        <button className="btn-icon" style={{ color: '#f59e0b' }} onClick={() => handleRollback(r.id)} title="Batalkan Penerimaan">
                                                            <RotateCcw size={18} />
                                                        </button>
                                                    )}

                                                    <button className="btn-icon text-danger" onClick={() => handleDelete(r.id)} title="Hapus">
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        )}

                        {/* KANBAN VIEW */}
                        {viewMode === 'kanban' && (
                            <div style={{ padding: '24px', overflowX: 'auto' }}>
                                <div style={{ display: 'flex', gap: 16, minWidth: '1200px' }}>
                                    {KANBAN_COLUMNS.map(col => {
                                        const items = registrations.filter(r => {
                                            const matchSearch = !search || r.nama_lengkap.toLowerCase().includes(search.toLowerCase()) || r.registration_number.toLowerCase().includes(search.toLowerCase())
                                            return r.status === col.key && matchSearch
                                        })
                                        return (
                                            <div key={col.key} style={{ flex: 1, minWidth: '220px' }}>
                                                <div style={{ padding: '12px 16px', background: `${col.color}10`, borderRadius: '14px 14px 0 0', borderBottom: `3px solid ${col.color}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                        <span>{col.icon}</span>
                                                        <span style={{ fontWeight: 800, fontSize: '0.85rem', color: col.color }}>{col.label}</span>
                                                    </div>
                                                    <span style={{ background: col.color, color: 'white', borderRadius: '50%', width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 800 }}>{items.length}</span>
                                                </div>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: '60vh', overflowY: 'auto', paddingRight: 4 }}>
                                                    {items.length === 0 ? (
                                                        <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem', background: 'var(--bg-hover)', borderRadius: 12, border: '2px dashed var(--border-color)' }}>Kosong</div>
                                                    ) : items.map(r => (
                                                        <div key={r.id} onClick={() => setSelectedReg(r)} style={{ padding: '14px', background: 'var(--bg-card)', borderRadius: 14, border: '1px solid var(--border-color)', cursor: 'pointer', transition: 'all 0.2s' }}
                                                            onMouseOver={e => { e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
                                                            onMouseOut={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'none' }}
                                                        >
                                                            <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-color)', marginBottom: 6 }}>{r.nama_lengkap}</div>
                                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 4, display: 'flex', justifyContent: 'space-between' }}>
                                                                <span>{r.registration_number}</span>
                                                                <span style={{ fontWeight: 800, color: 'var(--primary-color)' }}>{r.jurusan_pilihan || '-'}</span>
                                                            </div>
                                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{r.asal_sekolah}</div>
                                                            <div style={{ marginTop: 10, display: 'flex', gap: 6 }}>
                                                                {(r.status === 'pending_verification' || r.status === 'locked') && (
                                                                    <>
                                                                        <button onClick={e => { e.stopPropagation(); handleAccept(r.id) }} style={{ flex: 1, padding: '6px', borderRadius: 8, border: 'none', background: '#10b98120', color: '#10b981', fontWeight: 700, fontSize: '0.7rem', cursor: 'pointer' }}>✓ Terima</button>
                                                                        <button onClick={e => { e.stopPropagation(); handleUpdateStatus(r.id, 'rejected') }} style={{ flex: 1, padding: '6px', borderRadius: 8, border: 'none', background: '#ef444420', color: '#ef4444', fontWeight: 700, fontSize: '0.7rem', cursor: 'pointer' }}>✗ Tolak</button>
                                                                    </>
                                                                )}
                                                                {r.status === 'accepted' && (
                                                                    <button onClick={e => { e.stopPropagation(); handleRollback(r.id) }} style={{ flex: 1, padding: '6px', borderRadius: 8, border: 'none', background: '#f59e0b20', color: '#f59e0b', fontWeight: 700, fontSize: '0.7rem', cursor: 'pointer' }}>↺ Rollback</button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {activeMainTab === 'steps' && (
                <div className="cms-section-card animate-fade-in" style={{ padding: 32 }}>
                    {renderStepsTab()}
                </div>
            )}

            {activeMainTab === 'requirements' && (
                <div className="cms-section-card animate-fade-in" style={{ padding: 32 }}>
                    {renderRequirementsTab()}
                </div>
            )}

            {activeMainTab === 'settings' && (
                <div className="cms-section-card animate-fade-in" style={{ padding: 32 }}>
                    {renderSettingsTab()}
                </div>
            )}

            {/* Detail Modal (Candidate) */}
            {selectedReg && (
                <div className="modal-backdrop">
                    <div className="modal" style={{ maxWidth: 650 }}>
                        <div className="modal-header">
                            <h3 style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <UserPlus size={20} className="text-primary" />
                                Detail Pendaftar
                            </h3>
                            <button className="btn-icon" onClick={() => setSelectedReg(null)}>×</button>
                        </div>

                        <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                            <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                                <div style={{ width: 80, height: 80, background: 'var(--bg-hover)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 15px', color: 'var(--text-muted)' }}>
                                    <UserPlus size={40} />
                                </div>
                                <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: '0 0 5px 0' }}>{selectedReg.nama_lengkap}</h2>
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', margin: 0, marginBottom: 5 }}>{selectedReg.registration_number}</p>
                                <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--primary-color)', marginBottom: 15 }}>Jurusan Pilihan: {selectedReg.jurusan_pilihan || '-'}</div>
                                <div>{getStatusBadge(selectedReg.status)}</div>
                            </div>

                            <div className="grid-2" style={{ gap: '20px' }}>
                                <div className="card" style={{ padding: 16, border: '1px solid var(--border-color)', boxShadow: 'none' }}>
                                    <div style={{ display: 'flex', gap: 12 }}>
                                        <div style={{ color: 'var(--primary)', opacity: 0.8 }}><GraduationCap size={20} /></div>
                                        <div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1, fontWeight: 700 }}>Akademik</div>
                                            <div style={{ marginTop: 4, fontWeight: 600, fontSize: '0.95rem' }}>NISN: {selectedReg.nisn}</div>
                                            <div style={{ fontSize: '0.85rem', color: 'var(--text-color)', marginTop: 2 }}>Asal: {selectedReg.asal_sekolah}</div>
                                        </div>
                                    </div>
                                </div>

                                <div className="card" style={{ padding: 16, border: '1px solid var(--border-color)', boxShadow: 'none' }}>
                                    <div style={{ display: 'flex', gap: 12 }}>
                                        <div style={{ color: 'var(--primary)', opacity: 0.8 }}><Calendar size={20} /></div>
                                        <div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1, fontWeight: 700 }}>Identitas & Lahir</div>
                                            <div style={{ marginTop: 4, fontWeight: 600, fontSize: '0.95rem' }}>
                                                {selectedReg.tempat_lahir || '-'}, {selectedReg.tgl_lahir ? new Date(selectedReg.tgl_lahir).toLocaleDateString('id-ID') : '-'}
                                            </div>
                                            <div style={{ fontSize: '0.85rem', color: 'var(--text-color)', marginTop: 2 }}>
                                                {selectedReg.jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan'} • Agama: {selectedReg.agama || '-'}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="card" style={{ padding: 16, border: '1px solid var(--border-color)', boxShadow: 'none' }}>
                                    <div style={{ display: 'flex', gap: 12 }}>
                                        <div style={{ color: 'var(--primary)', opacity: 0.8 }}><Phone size={20} /></div>
                                        <div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1, fontWeight: 700 }}>Kontak Darurat</div>
                                            <div style={{ marginTop: 4, fontWeight: 600, fontSize: '0.95rem' }}>Ortu: {selectedReg.telepon_ortu}</div>
                                            <div style={{ fontSize: '0.85rem', color: 'var(--text-color)', marginTop: 2 }}>Siswa: {selectedReg.telepon_siswa || '-'}</div>
                                        </div>
                                    </div>
                                </div>

                                <div className="card" style={{ padding: 16, border: '1px solid var(--border-color)', boxShadow: 'none' }}>
                                    <div style={{ display: 'flex', gap: 12 }}>
                                        <div style={{ color: 'var(--primary)', opacity: 0.8 }}><MapPin size={20} /></div>
                                        <div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1, fontWeight: 700 }}>Alamat Tinggal</div>
                                            <div style={{ marginTop: 4, fontWeight: 500, lineHeight: 1.5, fontSize: '0.85rem', color: 'var(--text-color)' }}>
                                                {selectedReg.alamat_lengkap}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {(() => {
                                let berkas = {}
                                try {
                                    berkas = typeof selectedReg.berkas_json === 'string' ? JSON.parse(selectedReg.berkas_json) : (selectedReg.berkas_json || {})
                                } catch (e) { }

                                const getFileUrl = (path) => path ? `${API_BASE.replace('/admin/cms', '').replace('/api', '')}${path}` : null;

                                return (
                                    <div className="card mt-4" style={{ padding: 20, border: '1px solid var(--border-color)', boxShadow: 'none' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, paddingBottom: 12, borderBottom: '1px dashed var(--border-color)' }}>
                                            <FolderOpen size={20} className="text-primary" />
                                            <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-color)' }}>Dokumen & Berkas Digital</h4>
                                        </div>

                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
                                            {/* Foto */}
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'var(--bg-hover)', borderRadius: 12 }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                                    <div style={{ padding: 8, background: 'rgba(99, 102, 241, 0.1)', color: '#6366f1', borderRadius: 8 }}><Image size={18} /></div>
                                                    <div>
                                                        <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>Pas Foto</div>
                                                        <div style={{ fontSize: '0.75rem', color: selectedReg.foto_path ? '#10b981' : '#ef4444', fontWeight: 600 }}>
                                                            {selectedReg.foto_path ? '✅ Terunggah' : '❌ Belum Ada'}
                                                        </div>
                                                    </div>
                                                </div>
                                                {selectedReg.foto_path && (
                                                    <a href={getFileUrl(selectedReg.foto_path)} target="_blank" rel="noreferrer" className="btn btn-sm" style={{ padding: '6px 12px', fontSize: '0.75rem', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(99, 102, 241, 0.1)', color: '#6366f1', fontWeight: 700 }}>
                                                        <ExternalLink size={14} /> Lihat
                                                    </a>
                                                )}
                                            </div>

                                            {/* KK */}
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'var(--bg-hover)', borderRadius: 12 }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                                    <div style={{ padding: 8, background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', borderRadius: 8 }}><FileText size={18} /></div>
                                                    <div>
                                                        <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>Kartu Keluarga</div>
                                                        <div style={{ fontSize: '0.75rem', color: berkas.kk ? '#10b981' : '#ef4444', fontWeight: 600 }}>
                                                            {berkas.kk ? '✅ Terunggah' : '❌ Belum Ada'}
                                                        </div>
                                                    </div>
                                                </div>
                                                {berkas.kk && (
                                                    <a href={getFileUrl(berkas.kk)} target="_blank" rel="noreferrer" className="btn btn-sm" style={{ padding: '6px 12px', fontSize: '0.75rem', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', fontWeight: 700 }}>
                                                        <ExternalLink size={14} /> Lihat
                                                    </a>
                                                )}
                                            </div>

                                            {/* Akte */}
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'var(--bg-hover)', borderRadius: 12 }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                                    <div style={{ padding: 8, background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', borderRadius: 8 }}><FileText size={18} /></div>
                                                    <div>
                                                        <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>Akte Kelahiran</div>
                                                        <div style={{ fontSize: '0.75rem', color: berkas.akte ? '#10b981' : '#ef4444', fontWeight: 600 }}>
                                                            {berkas.akte ? '✅ Terunggah' : '❌ Belum Ada'}
                                                        </div>
                                                    </div>
                                                </div>
                                                {berkas.akte && (
                                                    <a href={getFileUrl(berkas.akte)} target="_blank" rel="noreferrer" className="btn btn-sm" style={{ padding: '6px 12px', fontSize: '0.75rem', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', fontWeight: 700 }}>
                                                        <ExternalLink size={14} /> Lihat
                                                    </a>
                                                )}
                                            </div>

                                            {/* Ijazah */}
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'var(--bg-hover)', borderRadius: 12 }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                                    <div style={{ padding: 8, background: 'rgba(56, 189, 248, 0.1)', color: '#0284c7', borderRadius: 8 }}><FileText size={18} /></div>
                                                    <div>
                                                        <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>Ijazah / SKL</div>
                                                        <div style={{ fontSize: '0.75rem', color: berkas.ijazah ? '#10b981' : '#ef4444', fontWeight: 600 }}>
                                                            {berkas.ijazah ? '✅ Terunggah' : '❌ Belum Ada'}
                                                        </div>
                                                    </div>
                                                </div>
                                                {berkas.ijazah && (
                                                    <a href={getFileUrl(berkas.ijazah)} target="_blank" rel="noreferrer" className="btn btn-sm" style={{ padding: '6px 12px', fontSize: '0.75rem', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(56, 189, 248, 0.1)', color: '#0284c7', fontWeight: 700 }}>
                                                        <ExternalLink size={14} /> Lihat
                                                    </a>
                                                )}
                                            </div>

                                            {/* KTP Ortu */}
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'var(--bg-hover)', borderRadius: 12 }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                                    <div style={{ padding: 8, background: 'rgba(168, 85, 247, 0.1)', color: '#9333ea', borderRadius: 8 }}><FileText size={18} /></div>
                                                    <div>
                                                        <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>KTP Orang Tua</div>
                                                        <div style={{ fontSize: '0.75rem', color: berkas.ktp_ortu ? '#10b981' : '#ef4444', fontWeight: 600 }}>
                                                            {berkas.ktp_ortu ? '✅ Terunggah' : '❌ Belum Ada'}
                                                        </div>
                                                    </div>
                                                </div>
                                                {berkas.ktp_ortu && (
                                                    <a href={getFileUrl(berkas.ktp_ortu)} target="_blank" rel="noreferrer" className="btn btn-sm" style={{ padding: '6px 12px', fontSize: '0.75rem', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(168, 85, 247, 0.1)', color: '#9333ea', fontWeight: 700 }}>
                                                        <ExternalLink size={14} /> Lihat
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )
                            })()}
                        </div>

                        <div className="modal-footer" style={{ flexWrap: 'wrap', gap: 10, justifyContent: 'space-between', background: 'var(--bg-hover)', borderRadius: '0 0 20px 20px' }}>
                            <button
                                className="btn btn-outline"
                                style={{ borderRadius: 8, height: 38, display: 'flex', alignItems: 'center', gap: 8 }}
                                onClick={() => window.open(`https://wa.me/${selectedReg.telepon_ortu.replace(/^0/, '62')}`, '_blank')}
                            >
                                <Send size={16} /> WA Orang Tua
                            </button>

                            <div style={{ display: 'flex', gap: 10 }}>
                                <button
                                    className="btn btn-success"
                                    onClick={() => handleAccept(selectedReg.id)}
                                    disabled={selectedReg.status === 'accepted'}
                                    style={{ borderRadius: 8, display: 'flex', alignItems: 'center', gap: 6 }}
                                >
                                    <CheckCircle size={16} /> {selectedReg.status === 'accepted' ? 'Sudah Diterima' : 'Eksekusi Terima Siswa'}
                                </button>
                                {selectedReg.status === 'accepted' && (
                                    <button
                                        className="btn" 
                                        onClick={() => handleRollback(selectedReg.id)}
                                        style={{ borderRadius: 8, display: 'flex', alignItems: 'center', gap: 6, background: '#fef3c7', color: '#92400e', border: '1px solid #fde68a', fontWeight: 700 }}
                                    >
                                        <RotateCcw size={16} /> Rollback
                                    </button>
                                )}
                                <button
                                    className="btn btn-danger"
                                    onClick={() => handleUpdateStatus(selectedReg.id, 'rejected')}
                                    disabled={selectedReg.status === 'rejected' || selectedReg.status === 'accepted'}
                                    style={{ borderRadius: 8, display: 'flex', alignItems: 'center', gap: 6 }}
                                >
                                    <XCircle size={16} /> Tolak
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeMainTab === 'steps' && renderStepsTab()}
            {activeMainTab === 'requirements' && renderRequirementsTab()}
            {activeMainTab === 'settings' && renderSettingsTab()}
            {activeMainTab === 'analytics' && renderAnalyticsTab()}
            {activeMainTab === 'gelombang' && renderGelombangTab()}
            {activeMainTab === 'pengumuman' && renderPengumumanTab()}

            {/* Modals */}
            {showStepModal && renderStepModal()}
            {showReqModal && renderReqModal()}
            {showGelModal && renderGelModal()}
            {showAnnModal && renderAnnModal()}
        </div>
    )

    // ==================== TAB RENDERS ====================

    function renderStepsTab() {
        return (
            <div>
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <div>
                        <h3 className="cms-section-title" style={{ fontSize: '1.4rem' }}>Alur Pendaftaran</h3>
                        <p className="text-secondary small m-0">Susun langkah-langkah yang harus dilalui calon siswa.</p>
                    </div>
                    <button className="btn btn-primary" style={{ borderRadius: 12, height: 42, marginLeft: 'auto' }} onClick={() => openStepModal()}>
                        <Plus size={18} /> Tambah Langkah
                    </button>
                </div>

                <div className="table-responsive" style={{ border: '1px solid var(--border-color)', borderRadius: 16, overflow: 'hidden' }}>
                    <table className="table" style={{ margin: 0 }}>
                        <thead style={{ background: 'var(--bg-hover)' }}>
                            <tr>
                                <th style={{ padding: '16px 24px', color: 'var(--text-muted)', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase' }} width="60">No</th>
                                <th style={{ padding: '16px 24px', color: 'var(--text-muted)', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase' }} width="60">Icon</th>
                                <th style={{ padding: '16px 24px', color: 'var(--text-muted)', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase' }}>Judul</th>
                                <th style={{ padding: '16px 24px', color: 'var(--text-muted)', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase' }}>Deskripsi</th>
                                <th style={{ padding: '16px 24px', color: 'var(--text-muted)', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', textAlign: 'center' }} width="80">Urutan</th>
                                <th style={{ padding: '16px 24px', color: 'var(--text-muted)', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', textAlign: 'center' }} width="80">Status</th>
                                <th style={{ padding: '16px 24px', color: 'var(--text-muted)', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', textAlign: 'right' }} width="100">Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {steps.length === 0 ? (
                                <tr><td colSpan="7" style={{ textAlign: 'center', padding: '100px 0', color: 'var(--text-muted)', fontWeight: 500 }}>Belum ada langkah pendaftaran</td></tr>
                            ) : steps.map(s => (
                                <tr key={s.id}>
                                    <td style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)' }}>
                                        <div style={{ fontWeight: 800, color: 'var(--primary-color)', fontSize: '1rem' }}>{s.step_number}</div>
                                    </td>
                                    <td style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)' }}>
                                        <div style={{ fontSize: '1.5rem', background: 'var(--bg-hover)', width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 10 }}>{s.icon}</div>
                                    </td>
                                    <td style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)' }}>
                                        <div style={{ fontWeight: 700, color: 'var(--text-color)' }}>{s.title}</div>
                                    </td>
                                    <td style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)' }}>
                                        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>{s.description}</span>
                                    </td>
                                    <td style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)', textAlign: 'center' }}>
                                        <span style={{ padding: '4px 10px', background: 'var(--bg-hover)', borderRadius: 6, fontWeight: 700, fontSize: '0.8rem', color: 'var(--text-color)' }}>{s.sort_order}</span>
                                    </td>
                                    <td style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)', textAlign: 'center' }}>
                                        <span className={`badge ${s.is_active ? 'badge-success' : 'badge-danger'}`} style={{ borderRadius: 6 }}>
                                            {s.is_active ? 'Aktif' : 'Nonaktif'}
                                        </span>
                                    </td>
                                    <td style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)', textAlign: 'right' }}>
                                        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                                            <button className="btn-icon text-primary" onClick={() => openStepModal(s)} title="Edit"><Edit2 size={16} /></button>
                                            <button className="btn-icon text-danger" onClick={() => deleteStep(s)} title="Hapus"><Trash2 size={16} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        )
    }

    function renderRequirementsTab() {
        return (
            <div>
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <div>
                        <h3 className="cms-section-title" style={{ fontSize: '1.4rem' }}>Syarat Dokumen</h3>
                        <p className="text-secondary small m-0">Daftar dokumen wajib yang harus diunggah pendaftar.</p>
                    </div>
                    <button className="btn btn-primary" style={{ borderRadius: 12, height: 42, marginLeft: 'auto' }} onClick={() => openReqModal()}>
                        <Plus size={18} /> Tambah Syarat
                    </button>
                </div>

                <div className="table-responsive" style={{ border: '1px solid var(--border-color)', borderRadius: 16, overflow: 'hidden' }}>
                    <table className="table" style={{ margin: 0 }}>
                        <thead style={{ background: 'var(--bg-hover)' }}>
                            <tr>
                                <th style={{ padding: '16px 24px', color: 'var(--text-muted)', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase' }}>Persyaratan / Dokumen</th>
                                <th style={{ padding: '16px 24px', color: 'var(--text-muted)', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', textAlign: 'center' }} width="80">Urutan</th>
                                <th style={{ padding: '16px 24px', color: 'var(--text-muted)', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', textAlign: 'center' }} width="80">Status</th>
                                <th style={{ padding: '16px 24px', color: 'var(--text-muted)', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', textAlign: 'right' }} width="100">Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {requirements.length === 0 ? (
                                <tr><td colSpan="4" style={{ textAlign: 'center', padding: '100px 0', color: 'var(--text-muted)', fontWeight: 500 }}>Belum ada syarat</td></tr>
                            ) : requirements.map(r => (
                                <tr key={r.id}>
                                    <td style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                            <div style={{ padding: 6, background: 'rgba(16, 185, 129, 0.1)', borderRadius: 8, color: '#10b981', display: 'flex' }}>
                                                <CheckCircle2 size={18} strokeWidth={2.5} />
                                            </div>
                                            <span style={{ fontWeight: 600, color: 'var(--text-color)', fontSize: '0.95rem' }}>{r.text}</span>
                                        </div>
                                    </td>
                                    <td style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)', textAlign: 'center' }}>
                                        <span style={{ padding: '4px 10px', background: 'var(--bg-hover)', borderRadius: 6, fontWeight: 700, fontSize: '0.8rem', color: 'var(--text-color)' }}>{r.sort_order}</span>
                                    </td>
                                    <td style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)', textAlign: 'center' }}>
                                        <span className={`badge ${r.is_active ? 'badge-success' : 'badge-danger'}`} style={{ borderRadius: 6 }}>
                                            {r.is_active ? 'Aktif' : 'Nonaktif'}
                                        </span>
                                    </td>
                                    <td style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)', textAlign: 'right' }}>
                                        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                                            <button className="btn-icon text-primary" onClick={() => openReqModal(r)} title="Edit"><Edit2 size={16} /></button>
                                            <button className="btn-icon text-danger" onClick={() => deleteReq(r)} title="Hapus"><Trash2 size={16} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        )
    }

    // ==================== MODALS ====================

    function renderStepModal() {
        return (
            <div className="modal-backdrop">
                <div className="modal" style={{ maxWidth: 500 }}>
                    <div className="modal-header">
                        <h3>{editStep ? 'Edit Langkah' : 'Tambah Langkah'}</h3>
                        <button className="btn-icon" onClick={() => setShowStepModal(false)}>×</button>
                    </div>
                    <div className="modal-body">
                        <form id="stepForm" onSubmit={saveStep}>
                            <div className="grid-2 mb-4">
                                <div className="form-group">
                                    <label>Nomor Langkah</label>
                                    <input type="text" className="form-control" value={stepForm.step_number} required
                                        onChange={e => setStepForm({ ...stepForm, step_number: e.target.value })}
                                        placeholder="01"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Icon / Emoji</label>
                                    <input type="text" className="form-control" value={stepForm.icon}
                                        onChange={e => setStepForm({ ...stepForm, icon: e.target.value })}
                                        placeholder="📋"
                                    />
                                </div>
                            </div>

                            <div className="form-group mb-4">
                                <label>Judul <span className="text-danger">*</span></label>
                                <input type="text" className="form-control" value={stepForm.title} required
                                    onChange={e => setStepForm({ ...stepForm, title: e.target.value })}
                                    placeholder="Daftar Online"
                                />
                            </div>

                            <div className="form-group mb-4">
                                <label>Deskripsi Singkat</label>
                                <textarea className="form-control" rows="2" value={stepForm.description}
                                    onChange={e => setStepForm({ ...stepForm, description: e.target.value })}
                                    placeholder="Isi formulir pendaftaran secara lengkap."
                                />
                            </div>

                            <div className="grid-2 mb-4">
                                <div className="form-group">
                                    <label>Urutan Tampil</label>
                                    <input type="number" className="form-control" value={stepForm.sort_order}
                                        onChange={e => setStepForm({ ...stepForm, sort_order: parseInt(e.target.value) || 0 })}
                                    />
                                </div>
                                <div className="form-group" style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: 10 }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', margin: 0 }}>
                                        <input
                                            type="checkbox"
                                            checked={stepForm.is_active !== 0}
                                            onChange={e => setStepForm({ ...stepForm, is_active: e.target.checked ? 1 : 0 })}
                                            style={{ width: 18, height: 18 }}
                                        />
                                        <span style={{ fontWeight: 600 }}>Aktif</span>
                                    </label>
                                </div>
                            </div>
                        </form>
                    </div>
                    <div className="modal-footer">
                        <button className="btn btn-secondary" onClick={() => setShowStepModal(false)} disabled={savingStep}>Batal</button>
                        <button type="submit" form="stepForm" className="btn btn-primary" disabled={savingStep}>
                            {savingStep ? 'Menyimpan...' : 'Simpan Langkah'}
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    function renderReqModal() {
        return (
            <div className="modal-backdrop">
                <div className="modal" style={{ maxWidth: 500 }}>
                    <div className="modal-header">
                        <h3>{editReq ? 'Edit Syarat' : 'Tambah Syarat'}</h3>
                        <button className="btn-icon" onClick={() => setShowReqModal(false)}>×</button>
                    </div>
                    <div className="modal-body">
                        <form id="reqForm" onSubmit={saveReq}>
                            <div className="form-group mb-4">
                                <label>Persyaratan Dokumen <span className="text-danger">*</span></label>
                                <input type="text" className="form-control" value={reqForm.text} required
                                    onChange={e => setReqForm({ ...reqForm, text: e.target.value })}
                                    placeholder="Contoh: Fotokopi Ijazah / SKL"
                                />
                            </div>

                            <div className="grid-2 mb-4">
                                <div className="form-group">
                                    <label>Urutan Tampil</label>
                                    <input type="number" className="form-control" value={reqForm.sort_order}
                                        onChange={e => setReqForm({ ...reqForm, sort_order: parseInt(e.target.value) || 0 })}
                                    />
                                </div>
                                <div className="form-group" style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: 10 }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', margin: 0 }}>
                                        <input
                                            type="checkbox"
                                            checked={reqForm.is_active !== 0}
                                            onChange={e => setReqForm({ ...reqForm, is_active: e.target.checked ? 1 : 0 })}
                                            style={{ width: 18, height: 18 }}
                                        />
                                        <span style={{ fontWeight: 600 }}>Aktif</span>
                                    </label>
                                </div>
                            </div>
                        </form>
                    </div>
                    <div className="modal-footer">
                        <button className="btn btn-secondary" onClick={() => setShowReqModal(false)} disabled={savingReq}>Batal</button>
                        <button type="submit" form="reqForm" className="btn btn-primary" disabled={savingReq}>
                            {savingReq ? 'Menyimpan...' : 'Simpan Syarat'}
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    function renderSettingsTab() {
        return (
            <div style={{ maxWidth: 800 }}>
                <div className="mb-5">
                    <h3 className="cms-section-title" style={{ fontSize: '1.4rem' }}>Konfigurasi PPDB</h3>
                    <p className="text-secondary small m-0">Atur status pendaftaran, kuota, dan tampilan portal PPDB.</p>
                </div>

                <div className="grid-2 mb-4" style={{ gap: 30 }}>
                    <div className="card p-4" style={{ background: 'var(--bg-hover)', border: '1px solid var(--border-color)', borderRadius: 20 }}>
                        <h4 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
                            <Settings size={18} className="text-primary" /> Status & Kuota
                        </h4>

                        <div className="form-group mb-4">
                            <label className="d-flex align-items-center gap-2 mb-2" style={{ fontWeight: 700, fontSize: '0.9rem' }}>
                                Status Pendaftaran
                            </label>
                            <div className="d-flex gap-3">
                                <button
                                    className={`btn ${settings.ppdb_is_open === '1' ? 'btn-success' : 'btn-outline'}`}
                                    style={{ flex: 1, borderRadius: 12, height: 44 }}
                                    onClick={() => handleSettingChange('ppdb_is_open', '1')}
                                >
                                    <CheckCircle size={18} className="mr-2" /> Buka
                                </button>
                                <button
                                    className={`btn ${settings.ppdb_is_open === '0' ? 'btn-danger' : 'btn-outline'}`}
                                    style={{ flex: 1, borderRadius: 12, height: 44 }}
                                    onClick={() => handleSettingChange('ppdb_is_open', '0')}
                                >
                                    <XCircle size={18} className="mr-2" /> Tutup
                                </button>
                            </div>
                        </div>

                        <div className="form-group mb-4">
                            <label style={{ fontWeight: 700, fontSize: '0.9rem' }}>Tahun Ajaran Target</label>
                            <input
                                type="text"
                                className="form-control"
                                value={settings.ppdb_year}
                                onChange={e => handleSettingChange('ppdb_year', e.target.value)}
                                placeholder="Contoh: 2025/2026"
                                style={{ borderRadius: 10, height: 44 }}
                            />
                        </div>

                        <div className="form-group mb-0">
                            <label style={{ fontWeight: 700, fontSize: '0.9rem' }}>Target Kuota (Siswa)</label>
                            <input
                                type="number"
                                className="form-control"
                                value={settings.ppdb_quota}
                                onChange={e => handleSettingChange('ppdb_quota', e.target.value)}
                                style={{ borderRadius: 10, height: 44 }}
                            />
                        </div>
                    </div>

                    <div className="card p-4" style={{ background: 'var(--bg-hover)', border: '1px solid var(--border-color)', borderRadius: 20 }}>
                        <h4 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
                            <Layers size={18} className="text-primary" /> Tampilan Portal
                        </h4>

                        <div className="form-group mb-4">
                            <label style={{ fontWeight: 700, fontSize: '0.9rem' }}>Judul Hero Portal</label>
                            <input
                                type="text"
                                className="form-control"
                                value={settings.ppdb_hero_title}
                                onChange={e => handleSettingChange('ppdb_hero_title', e.target.value)}
                                style={{ borderRadius: 10, height: 44 }}
                            />
                        </div>

                        <div className="form-group mb-4">
                            <label style={{ fontWeight: 700, fontSize: '0.9rem' }}>Sub-judul Hero</label>
                            <textarea
                                className="form-control"
                                rows="2"
                                value={settings.ppdb_hero_subtitle}
                                onChange={e => handleSettingChange('ppdb_hero_subtitle', e.target.value)}
                                style={{ borderRadius: 10, resize: 'none' }}
                            />
                        </div>

                        <div className="form-group mb-0">
                            <label style={{ fontWeight: 700, fontSize: '0.9rem' }}>No. WhatsApp CS</label>
                            <input
                                type="text"
                                className="form-control"
                                value={settings.ppdb_contact_wa}
                                onChange={e => handleSettingChange('ppdb_contact_wa', e.target.value)}
                                placeholder="Contoh: 08123456789"
                                style={{ borderRadius: 10, height: 44 }}
                            />
                            <small className="text-muted mt-1 d-block">Gunakan format 08xxx atau 62xxx</small>
                        </div>
                    </div>
                </div>

                <div className="d-flex justify-content-end gap-3 mt-4">
                    <button
                        className="btn btn-primary"
                        style={{ borderRadius: 14, height: 50, padding: '0 32px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 10 }}
                        onClick={() => saveSettings(['ppdb_is_open', 'ppdb_year', 'ppdb_quota', 'ppdb_contact_wa', 'ppdb_hero_title', 'ppdb_hero_subtitle'])}
                        disabled={savingSettings}
                    >
                        <Save size={20} />
                        {savingSettings ? 'Menyimpan...' : 'Simpan Pengaturan'}
                    </button>
                </div>
            </div>
        )
    }

    const PIE_COLORS = ['#6366f1', '#f472b6', '#94a3b8']

    function renderAnalyticsTab() {
        if (!analytics) return <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>Memuat data analytics...</div>
        
        // PAD DAILY DATA FOR LINE CHART SO IT DOES NOT CRASH ON SINGLE ELEMENT
        let dailySafe = (analytics.daily || []).map(d => {
            const dateObj = new Date(d.date);
            const safeDate = isNaN(dateObj.valueOf()) ? String(d.date || '') : dateObj.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
            return { date: safeDate, count: Number(d.count) || 0 };
        });
        if (dailySafe.length === 1) {
            dailySafe = [{ date: 'Sebelumnya', count: 0 }, ...dailySafe];
        }

        const genderSafe = (analytics.gender || []).map(g => ({ name: g.jk === 'L' ? 'Laki-laki' : g.jk === 'P' ? 'Perempuan' : 'Lainnya', value: Number(g.count) || 0 }));
        const schoolsSafe = (analytics.schools || []).map(s => ({ sekolah: String(s.sekolah || 'Tidak Diketahui'), count: Number(s.count) || 0 }));
        const funnelSafe = analytics.funnel || [];

        return (
            <div>
                <div className="mb-4"><h3 className="cms-section-title" style={{ fontSize: '1.4rem' }}>Analytics PPDB</h3><p className="text-secondary small m-0">Insight visual pendaftaran siswa baru.</p></div>
                <div className="grid-2 mb-4" style={{ gap: 24 }}>
                    {/* Line Chart - Daily */}
                    <div className="card p-4" style={{ borderRadius: 20, border: '1px solid var(--border-color)' }}>
                        <h4 style={{ fontSize: '0.9rem', fontWeight: 800, marginBottom: 16 }}>📈 Pendaftar per Hari (14 Hari)</h4>
                        {dailySafe.length > 0 ? (
                            <ChartErrorBoundary>
                                <LineChart width={400} height={200} data={dailySafe}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                                    <XAxis dataKey="date" style={{ fontSize: '0.7rem' }} />
                                    <YAxis style={{ fontSize: '0.7rem' }} />
                                    <Tooltip />
                                    <Line type="linear" dataKey="count" stroke="#6366f1" strokeWidth={3} dot={{ r: 4, fill: '#6366f1' }} name="Pendaftar" />
                                </LineChart>
                            </ChartErrorBoundary>
                        ) : (
                            <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>Belum ada data pendaftar.</div>
                        )}
                    </div>

                    {/* Pie Chart - Gender */}
                    <div className="card p-4" style={{ borderRadius: 20, border: '1px solid var(--border-color)' }}>
                        <h4 style={{ fontSize: '0.9rem', fontWeight: 800, marginBottom: 16 }}>👫 Rasio Jenis Kelamin</h4>
                        {genderSafe.length > 0 ? (
                            <ChartErrorBoundary>
                                <PieChart width={400} height={200}>
                                    <Pie data={genderSafe} cx="50%" cy="50%" outerRadius={70} dataKey="value" labelLine={false}>
                                        {genderSafe.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                                    </Pie>
                                    <Tooltip />
                                    <Legend wrapperStyle={{ fontSize: '0.8rem' }} />
                                </PieChart>
                            </ChartErrorBoundary>
                        ) : (
                            <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>Belum ada data gender.</div>
                        )}
                    </div>

                    {/* Bar Chart - Schools */}
                    <div className="card p-4" style={{ borderRadius: 20, border: '1px solid var(--border-color)' }}>
                        <h4 style={{ fontSize: '0.9rem', fontWeight: 800, marginBottom: 16 }}>🏫 Top 10 Asal Sekolah</h4>
                        {schoolsSafe.length > 0 ? (
                            <ChartErrorBoundary>
                                <BarChart width={400} height={220} data={schoolsSafe} layout="vertical" margin={{ left: 20, right: 20 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                                    <XAxis type="number" style={{ fontSize: '0.7rem' }} />
                                    <YAxis type="category" dataKey="sekolah" width={120} style={{ fontSize: '0.65rem' }} />
                                    <Tooltip />
                                    <Bar dataKey="count" fill="#6366f1" radius={[0, 6, 6, 0]} name="Pendaftar" />
                                </BarChart>
                            </ChartErrorBoundary>
                        ) : (
                            <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>Belum ada data sekolah asal.</div>
                        )}
                    </div>

                    {/* Funnel - Conversion */}
                    <div className="card p-4" style={{ borderRadius: 20, border: '1px solid var(--border-color)' }}>
                        <h4 style={{ fontSize: '0.9rem', fontWeight: 800, marginBottom: 16 }}>🔽 Funnel Konversi</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {funnelSafe.map((f, i) => {
                                const maxCount = Number(funnelSafe[0]?.count) || 1
                                const fCount = Number(f.count) || 0
                                const pct = maxCount > 0 ? (fCount / maxCount) * 100 : 0
                                const colors = ['#6366f1', '#8b5cf6', '#a855f7', '#10b981']
                                return (
                                    <div key={i}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 700, marginBottom: 4 }}>
                                            <span style={{ color: 'var(--text-color)' }}>{f.stage}</span>
                                            <span style={{ color: colors[i] || '#cbd5e1' }}>{fCount}</span>
                                        </div>
                                        <div style={{ height: 10, background: 'var(--bg-hover)', borderRadius: 5, overflow: 'hidden' }}>
                                            <div style={{ height: '100%', width: `${pct}%`, background: colors[i] || '#cbd5e1', borderRadius: 5, transition: 'width 0.5s' }} />
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    function renderGelombangTab() {
        return (
            <div>
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <div><h3 className="cms-section-title" style={{ fontSize: '1.4rem' }}>Gelombang Pendaftaran</h3><p className="text-secondary small m-0">Kelola gelombang dan kuota PPDB.</p></div>
                    <button className="btn btn-primary" style={{ borderRadius: 12, height: 42 }} onClick={() => openGelModal()}><Plus size={18} /> Tambah Gelombang</button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
                    {gelombang.map(g => (
                        <div key={g.id} className="card" style={{ padding: 24, borderRadius: 20, border: '1px solid var(--border-color)', position: 'relative' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 12 }}>
                                <div>
                                    <h4 style={{ margin: 0, fontWeight: 800, fontSize: '1.1rem' }}>{g.nama}</h4>
                                    <span className={`badge ${g.is_active ? 'badge-success' : 'badge-danger'}`} style={{ marginTop: 6, display: 'inline-block' }}>{g.is_active ? 'Aktif' : 'Nonaktif'}</span>
                                </div>
                                <div style={{ display: 'flex', gap: 6 }}>
                                    <button className="btn-icon text-primary" onClick={() => openGelModal(g)} title="Edit"><Edit2 size={16} /></button>
                                    <button className="btn-icon text-danger" onClick={() => deleteGel(g)} title="Hapus"><Trash2 size={16} /></button>
                                </div>
                            </div>
                            <div style={{ marginBottom: 12 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 700, marginBottom: 6 }}>
                                    <span style={{ color: 'var(--text-muted)' }}>Kuota</span>
                                    <span style={{ color: 'var(--text-color)' }}>{g.terisi || 0} / {g.kuota}</span>
                                </div>
                                <div style={{ height: 10, background: 'var(--bg-hover)', borderRadius: 5, overflow: 'hidden' }}>
                                    <div style={{ height: '100%', width: `${Math.min(((g.terisi || 0) / g.kuota) * 100, 100)}%`, background: (g.terisi || 0) >= g.kuota ? '#ef4444' : '#6366f1', borderRadius: 5, transition: 'width 0.3s' }} />
                                </div>
                            </div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: 4 }}>
                                <span>💰 Biaya Daftar Ulang: <strong>Rp {Number(g.biaya_daftar_ulang).toLocaleString('id-ID')}</strong></span>
                                {g.tanggal_buka && <span>📅 {new Date(g.tanggal_buka).toLocaleDateString('id-ID')} — {g.tanggal_tutup ? new Date(g.tanggal_tutup).toLocaleDateString('id-ID') : '...'}</span>}
                            </div>
                        </div>
                    ))}
                    {gelombang.length === 0 && <p className="text-secondary">Belum ada gelombang. Klik "Tambah Gelombang" untuk memulai.</p>}
                </div>
            </div>
        )
    }

    function renderPengumumanTab() {
        return (
            <div>
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <div><h3 className="cms-section-title" style={{ fontSize: '1.4rem' }}>Pengumuman Dasbor PPDB</h3><p className="text-secondary small m-0">Pengumuman ini tampil di dasbor pendaftar.</p></div>
                    <button className="btn btn-primary" style={{ borderRadius: 12, height: 42 }} onClick={() => openAnnModal()}><Plus size={18} /> Tambah Pengumuman</button>
                </div>
                <div className="table-responsive" style={{ border: '1px solid var(--border-color)', borderRadius: 16, overflow: 'hidden' }}>
                    <table className="table" style={{ margin: 0 }}>
                        <thead style={{ background: 'var(--bg-hover)' }}>
                            <tr>
                                <th style={{ padding: '16px 24px', color: 'var(--text-muted)', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase' }}>Judul</th>
                                <th style={{ padding: '16px 24px', color: 'var(--text-muted)', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase' }}>Isi</th>
                                <th style={{ padding: '16px 24px', color: 'var(--text-muted)', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', textAlign: 'center' }} width="80">Tipe</th>
                                <th style={{ padding: '16px 24px', color: 'var(--text-muted)', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', textAlign: 'center' }} width="80">Status</th>
                                <th style={{ padding: '16px 24px', color: 'var(--text-muted)', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', textAlign: 'right' }} width="100">Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {ppdbAnnouncements.map(a => (
                                <tr key={a.id}>
                                    <td style={{ padding: '16px 24px', fontWeight: 700 }}>{a.judul}</td>
                                    <td style={{ padding: '16px 24px', fontSize: '0.85rem', color: 'var(--text-muted)', maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.isi || '-'}</td>
                                    <td style={{ padding: '16px 24px', textAlign: 'center' }}><span className="badge" style={{ background: a.tipe === 'warning' ? '#fef9c3' : a.tipe === 'success' ? '#dcfce7' : '#eff6ff', color: a.tipe === 'warning' ? '#854d0e' : a.tipe === 'success' ? '#166534' : '#1e40af', border: '1px solid', borderColor: a.tipe === 'warning' ? '#fef08a' : a.tipe === 'success' ? '#bbf7d0' : '#bfdbfe' }}>{a.tipe}</span></td>
                                    <td style={{ padding: '16px 24px', textAlign: 'center' }}><span className={`badge ${a.is_active ? 'badge-success' : 'badge-danger'}`}>{a.is_active ? 'Aktif' : 'Off'}</span></td>
                                    <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                                        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                                            <button className="btn-icon text-primary" onClick={() => openAnnModal(a)}><Edit2 size={16} /></button>
                                            <button className="btn-icon text-danger" onClick={() => deleteAnn(a)}><Trash2 size={16} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        )
    }

    function renderGelModal() {
        return (
            <div className="modal-backdrop">
                <div className="modal" style={{ maxWidth: 500 }}>
                    <div className="modal-header"><h3>{editGel ? 'Edit Gelombang' : 'Tambah Gelombang'}</h3><button className="btn-icon" onClick={() => setShowGelModal(false)}>×</button></div>
                    <div className="modal-body">
                        <form id="gelForm" onSubmit={saveGel}>
                            <div className="form-group mb-3"><label>Nama Gelombang <span className="text-danger">*</span></label><input type="text" className="form-control" value={gelForm.nama} required onChange={e => setGelForm({...gelForm, nama: e.target.value})} placeholder="Gelombang 1" /></div>
                            <div className="grid-2 mb-3">
                                <div className="form-group"><label>Kuota</label><input type="number" className="form-control" value={gelForm.kuota} onChange={e => setGelForm({...gelForm, kuota: parseInt(e.target.value) || 0})} /></div>
                                <div className="form-group"><label>Biaya Daftar Ulang</label><input type="number" className="form-control" value={gelForm.biaya_daftar_ulang} onChange={e => setGelForm({...gelForm, biaya_daftar_ulang: parseInt(e.target.value) || 0})} /></div>
                            </div>
                            <div className="grid-2 mb-3">
                                <div className="form-group"><label>Tanggal Buka</label><input type="date" className="form-control" value={gelForm.tanggal_buka} onChange={e => setGelForm({...gelForm, tanggal_buka: e.target.value})} /></div>
                                <div className="form-group"><label>Tanggal Tutup</label><input type="date" className="form-control" value={gelForm.tanggal_tutup} onChange={e => setGelForm({...gelForm, tanggal_tutup: e.target.value})} /></div>
                            </div>
                            <div className="form-group"><label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}><input type="checkbox" checked={gelForm.is_active === 1} onChange={e => setGelForm({...gelForm, is_active: e.target.checked ? 1 : 0})} style={{ width: 18, height: 18 }} /><span style={{ fontWeight: 600 }}>Aktif</span></label></div>
                        </form>
                    </div>
                    <div className="modal-footer">
                        <button className="btn btn-secondary" onClick={() => setShowGelModal(false)} disabled={savingGel}>Batal</button>
                        <button type="submit" form="gelForm" className="btn btn-primary" disabled={savingGel}>{savingGel ? 'Menyimpan...' : 'Simpan'}</button>
                    </div>
                </div>
            </div>
        )
    }

    function renderAnnModal() {
        return (
            <div className="modal-backdrop">
                <div className="modal" style={{ maxWidth: 500 }}>
                    <div className="modal-header"><h3>{editAnn ? 'Edit Pengumuman' : 'Tambah Pengumuman'}</h3><button className="btn-icon" onClick={() => setShowAnnModal(false)}>×</button></div>
                    <div className="modal-body">
                        <form id="annForm" onSubmit={saveAnn}>
                            <div className="form-group mb-3"><label>Judul <span className="text-danger">*</span></label><input type="text" className="form-control" value={annForm.judul} required onChange={e => setAnnForm({...annForm, judul: e.target.value})} placeholder="Batas waktu pengisian biodata" /></div>
                            <div className="form-group mb-3"><label>Isi / Detail</label><textarea className="form-control" rows={3} value={annForm.isi} onChange={e => setAnnForm({...annForm, isi: e.target.value})} placeholder="Opsional, detail lebih lanjut..." /></div>
                            <div className="grid-2 mb-3">
                                <div className="form-group"><label>Tipe</label>
                                    <select className="form-control" value={annForm.tipe} onChange={e => setAnnForm({...annForm, tipe: e.target.value})}>
                                        <option value="info">Info (Biru)</option>
                                        <option value="warning">Warning (Kuning)</option>
                                        <option value="success">Success (Hijau)</option>
                                    </select>
                                </div>
                                <div className="form-group" style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: 10 }}><label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}><input type="checkbox" checked={annForm.is_active === 1} onChange={e => setAnnForm({...annForm, is_active: e.target.checked ? 1 : 0})} style={{ width: 18, height: 18 }} /><span style={{ fontWeight: 600 }}>Aktif</span></label></div>
                            </div>
                        </form>
                    </div>
                    <div className="modal-footer">
                        <button className="btn btn-secondary" onClick={() => setShowAnnModal(false)} disabled={savingAnn}>Batal</button>
                        <button type="submit" form="annForm" className="btn btn-primary" disabled={savingAnn}>{savingAnn ? 'Menyimpan...' : 'Simpan'}</button>
                    </div>
                </div>
            </div>
        )
    }
}
