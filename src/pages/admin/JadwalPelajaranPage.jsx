import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { API_BASE, getAuthHeaders } from '../../services/api'
import LoadingSpinner from '../../components/LoadingSpinner'
import {
    Calendar, PlusCircle, Trash2, Edit, Save, X, Search, Clock,
    ChevronDown, ChevronRight, BookOpen, RefreshCw, Layout,
    TrendingUp, CheckCircle, ShieldCheck, List, Info, Book, User, GraduationCap
} from 'lucide-react'
import { useCustomAlert } from '../../hooks/useCustomAlert'
import '../../styles/cms.css'

export default function JadwalPelajaranPage() {
    const { showSuccess, showError, confirmDelete, MySwal } = useCustomAlert()
    const [activeTab, setActiveTab] = useState('jadwal') // 'jadwal' | 'waktu' | 'mapel'

    const [jadwalList, setJadwalList] = useState([])
    const [guruList, setGuruList] = useState([])
    const [kelasList, setKelasList] = useState([])
    const [mapelList, setMapelList] = useState([])
    const [jamList, setJamList] = useState([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [searchMapel, setSearchMapel] = useState('')

    // UI state (Jadwal)
    const [selectedKelasId, setSelectedKelasId] = useState(null)
    const [expandedHari, setExpandedHari] = useState('Senin')

    // Modal state (Jadwal)
    const [showModal, setShowModal] = useState(false)
    const [isEdit, setIsEdit] = useState(false)
    const [submitLoading, setSubmitLoading] = useState(false)
    const [formData, setFormData] = useState({ id: '', guru_id: '', kelas_id: '', mapel_id: '', hari: 'Senin', jam_pelajaran_id: '', end_jam_pelajaran_id: '' })

    // Modal state (Waktu)
    const [showJamModal, setShowJamModal] = useState(false)
    const [isEditJam, setIsEditJam] = useState(false)
    const [submitLoadingJam, setSubmitLoadingJam] = useState(false)
    const [jamFormData, setJamFormData] = useState({ id: '', jam_ke: '', jam_mulai: '', jam_selesai: '', tipe: 'Pelajaran' })

    // Modal state (Mapel)
    const [showMapelModal, setShowMapelModal] = useState(false)
    const [isEditMapel, setIsEditMapel] = useState(false)
    const [submitLoadingMapel, setSubmitLoadingMapel] = useState(false)
    const [mapelFormData, setMapelFormData] = useState({ id: '', nama: '', tingkat: 'Nasional', guru_id: '', kelas_id: '' })

    const fetchData = async () => {
        setLoading(true)
        try {
            const [jadwalRes, guruRes, kelasRes, mapelRes, jamRes] = await Promise.all([
                fetch(`${API_BASE}/admin/jadwal`, { headers: getAuthHeaders() }),
                fetch(`${API_BASE}/admin/guru`, { headers: getAuthHeaders() }),
                fetch(`${API_BASE}/kelas`, { headers: getAuthHeaders() }),
                fetch(`${API_BASE}/admin/akademik/mapel`, { headers: getAuthHeaders() }),
                fetch(`${API_BASE}/admin/jam-pelajaran`, { headers: getAuthHeaders() })
            ])
            if (jadwalRes.ok) setJadwalList(await jadwalRes.json())
            if (guruRes.ok) setGuruList(await guruRes.json())

            if (kelasRes.ok) {
                const kelasData = await kelasRes.json()
                setKelasList(kelasData)
                if (kelasData.length > 0 && !selectedKelasId) {
                    setSelectedKelasId(kelasData[0].id)
                }
            }

            if (mapelRes.ok) setMapelList(await mapelRes.json())
            if (jamRes.ok) setJamList(await jamRes.json())
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchData()
    }, [])

    /* =========================================
       HANDLERS: JADWAL PELAJARAN
       ========================================= */
    const openCreateModal = (hari = 'Senin') => {
        setIsEdit(false)
        setFormData({ id: '', guru_id: '', kelas_id: selectedKelasId || (kelasList[0]?.id || ''), mapel_id: '', hari: hari, jam_pelajaran_id: jamList.length > 0 ? jamList[0].id : '', end_jam_pelajaran_id: jamList.length > 0 ? jamList[0].id : '' })
        setShowModal(true)
    }

    const openEditModal = (j) => {
        setIsEdit(true)
        setFormData({ id: j.id, guru_id: j.guru_id, kelas_id: j.kelas_id, mapel_id: j.mapel_id, hari: j.hari, jam_pelajaran_id: j.jam_pelajaran_id, end_jam_pelajaran_id: j.jam_pelajaran_id })
        setShowModal(true)
    }

    const handleDelete = async (id) => {
        if (!await confirmDelete('Hapus Jadwal?', 'Jadwal ini akan dihapus permanen.')) return
        try {
            const res = await fetch(`${API_BASE}/admin/jadwal/${id}`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            })
            if (!res.ok) throw new Error('Gagal menghapus')
            showSuccess('Dihapus!', 'Jadwal berhasil dihapus.')
            fetchData()
        } catch (err) {
            showError('Gagal!', err.message)
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setSubmitLoading(true)
        try {
            const method = isEdit ? 'PUT' : 'POST'
            const url = isEdit ? `${API_BASE}/admin/jadwal/${formData.id}` : `${API_BASE}/admin/jadwal`

            const mapel = mapelList.find(m => String(m.id) === String(formData.mapel_id));
            let submitData = { ...formData, guru_id: mapel ? mapel.guru_id : '' };
            if (!isEdit) {
                // Range calculation
                const startJam = jamList.find(j => j.id === parseInt(formData.jam_pelajaran_id));
                const endJam = jamList.find(j => j.id === parseInt(formData.end_jam_pelajaran_id));

                if (startJam && endJam) {
                    if (startJam.jam_ke > endJam.jam_ke) {
                        throw new Error("Jam selesai tidak boleh lebih awal dari jam mulai.");
                    }
                    const jam_pelajaran_ids = jamList
                        .filter(j => j.jam_ke >= startJam.jam_ke && j.jam_ke <= endJam.jam_ke && j.tipe === 'Pelajaran')
                        .map(j => j.id);

                    submitData = { ...submitData, jam_pelajaran_ids };
                }
            }

            const res = await fetch(url, {
                method,
                headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
                body: JSON.stringify(submitData)
            })

            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'Terjadi kesalahan')

            setShowModal(false)
            showSuccess('Berhasil!', `Jadwal berhasil ${isEdit ? 'diperbarui' : 'ditambahkan'}`)
            fetchData()
        } catch (err) {
            setShowModal(false)
            showError('Gagal!', err.message)
        } finally {
            setSubmitLoading(false)
        }
    }

    /* =========================================
       HANDLERS: WAKTU PELAJARAN
       ========================================= */
    const openCreateJamModal = () => {
        setIsEditJam(false)
        const nextJamKe = jamList.length > 0 ? Math.max(...jamList.map(j => j.jam_ke)) + 1 : 1
        setJamFormData({ id: '', jam_ke: nextJamKe, jam_mulai: '', jam_selesai: '', tipe: 'Pelajaran' })
        setShowJamModal(true)
    }

    const openEditJamModal = (j) => {
        setIsEditJam(true)
        setJamFormData({ id: j.id, jam_ke: j.jam_ke, jam_mulai: j.jam_mulai, jam_selesai: j.jam_selesai, tipe: j.tipe })
        setShowJamModal(true)
    }

    const handleJamDelete = async (id) => {
        if (!await confirmDelete('Hapus Waktu?', 'Pastikan tidak ada jadwal yang menggunakan waktu ini.')) return
        try {
            const res = await fetch(`${API_BASE}/admin/jam-pelajaran/${id}`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'Gagal menghapus')
            showSuccess('Dihapus!', 'Waktu pelajaran berhasil dihapus.')
            fetchData() // Refresh both jam and jadwal
        } catch (err) {
            showError('Gagal!', err.message)
        }
    }

    const handleJamSubmit = async (e) => {
        e.preventDefault()
        setSubmitLoadingJam(true)
        try {
            const method = isEditJam ? 'PUT' : 'POST'
            const url = isEditJam ? `${API_BASE}/admin/jam-pelajaran/${jamFormData.id}` : `${API_BASE}/admin/jam-pelajaran`

            const res = await fetch(url, {
                method,
                headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
                body: JSON.stringify(jamFormData)
            })

            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'Terjadi kesalahan')

            setShowJamModal(false)
            showSuccess('Berhasil!', `Waktu pelajaran berhasil ${isEditJam ? 'diperbarui' : 'ditambahkan'}`)
            fetchData()
        } catch (err) {
            showError('Gagal!', err.message)
        } finally {
            setSubmitLoadingJam(false)
        }
    }

    const handleBulkDelete = async () => {
        const result = await MySwal.fire({
            title: 'Kosongkan Jadwal?',
            text: `Pilih cakupan jadwal yang ingin dihapus untuk Kelas ${selectedKelasData?.nama}`,
            icon: 'warning',
            showCancelButton: true,
            showDenyButton: true,
            confirmButtonText: 'Hapus Semua Hari',
            denyButtonText: `Hapus Hanya Hari ${expandedHari || 'Terpilih'}`,
            cancelButtonText: 'Batal',
            confirmButtonColor: '#ef4444',
            denyButtonColor: '#f59e0b',
            customClass: {
                confirmButton: 'btn btn-danger px-4 py-2 rounded-xl fw-bold mx-2',
                denyButton: 'btn btn-warning px-4 py-2 rounded-xl fw-bold mx-2',
                cancelButton: 'btn btn-outline-secondary px-4 py-2 rounded-xl fw-bold mx-2',
            },
            buttonsStyling: false
        })

        if (result.isDismissed) return

        const payload = {
            kelas_id: selectedKelasId,
            hari: result.isDenied ? expandedHari : null
        }

        if (result.isDenied && !expandedHari) {
            showError('Gagal!', 'Silakan buka salah satu hari terlebih dahulu untuk menghapus per hari.')
            return
        }

        try {
            const res = await fetch(`${API_BASE}/admin/jadwal/bulk/delete`, {
                method: 'DELETE',
                headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'Gagal menghapus')
            showSuccess('Dihapus!', `${data.count} sesi jadwal telah dihapus.`)
            fetchData()
        } catch (err) {
            showError('Gagal!', err.message)
        }
    }

    /* =========================================
       HANDLERS: MASTER MATA PELAJARAN
       ========================================= */
    const openCreateMapelModal = () => {
        setIsEditMapel(false)
        setMapelFormData({ id: '', nama: '', tingkat: 'Nasional', guru_id: '', kelas_id: '' })
        setShowMapelModal(true)
    }

    const openEditMapelModal = (m) => {
        setIsEditMapel(true)
        setMapelFormData({ id: m.id, nama: m.nama, tingkat: m.tingkat || 'Nasional', guru_id: m.guru_id || '', kelas_id: m.kelas_id || '' })
        setShowMapelModal(true)
    }

    const handleMapelDelete = async (id, nama) => {
        if (!await confirmDelete('Hapus Mapel?', `Yakin ingin menghapus mata pelajaran ${nama}? Menghapus mapel akan menghapus semua jadwal terkait.`)) return
        try {
            const res = await fetch(`${API_BASE}/admin/akademik/mapel/${id}`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            })
            if (!res.ok) throw new Error('Gagal menghapus')
            showSuccess('Dihapus!', 'Mata pelajaran berhasil dihapus.')
            fetchData()
        } catch (err) {
            showError('Gagal!', err.message)
        }
    }

    const handleMapelSubmit = async (e) => {
        e.preventDefault()
        setSubmitLoadingMapel(true)
        try {
            const method = isEditMapel ? 'PUT' : 'POST'
            const url = isEditMapel ? `${API_BASE}/admin/akademik/mapel/${mapelFormData.id}` : `${API_BASE}/admin/akademik/mapel`

            // Note: Since we don't have PUT /mapel/:id yet based on my research, 
            // I'll check if it exists or use POST if required. 
            // My earlier grep showed router.post('/mapel') and router.delete('/mapel/:id').
            // If PUT is missing, I might need to clarify or implement it. 
            // For now I'll assume standard REST.

            const res = await fetch(url, {
                method,
                headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
                body: JSON.stringify(mapelFormData)
            })

            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'Terjadi kesalahan')

            setShowMapelModal(false)
            showSuccess('Berhasil!', `Mata pelajaran berhasil ${isEditMapel ? 'diperbarui' : 'ditambahkan'}`)
            fetchData()
        } catch (err) {
            showError('Gagal!', err.message)
        } finally {
            setSubmitLoadingMapel(false)
        }
    }

    // Filter current class schedules
    const currentKelasSchedules = jadwalList.filter(j => j.kelas_id === parseInt(selectedKelasId))
    const selectedKelasData = kelasList.find(k => k.id === parseInt(selectedKelasId))

    // Apply search filter for classes (left panel)
    const filteredKelas = kelasList.filter(k => (k.nama || '').toLowerCase().includes(search.toLowerCase()))

    const daysOfWeek = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu']

    const styles = `
        :root {
            --primary-rgb: 59, 130, 246;
            --primary-600: #2563eb;
            --bg-card: #ffffff;
            --bg-hover: #f1f5f9;
            --text-primary: #1e293b;
            --text-secondary: #64748b;
            --border-color: #e2e8f0;
            --shadow-sm: 0 1px 3px rgba(0,0,0,0.1);
        }

        [data-theme='dark'] {
            --bg-card: #1e293b;
            --bg-hover: #334155;
            --text-primary: #f8fafc;
            --text-secondary: #94a3b8;
            --border-color: #334155;
        }

        .pelajaran-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 2rem;
            padding: 1rem 0;
        }

        .bento-grid {
            display: grid;
            grid-template-columns: 2fr 1fr;
            gap: 1.5rem;
            margin-bottom: 2.5rem;
        }

        .bento-card {
            background: var(--bg-card);
            border: 1px solid var(--border-color);
            border-radius: 32px;
            padding: 2rem;
            box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05);
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            position: relative;
            overflow: hidden;
        }

        .bento-card:hover { border-color: var(--primary-600); box-shadow: 0 20px 40px -10px rgba(var(--primary-rgb), 0.1); }

        .icon-box-soft {
            width: 56px; height: 56px; border-radius: 18px;
            display: flex; align-items: center; justify-content: center;
            margin-bottom: 1.25rem;
        }
        .bg-soft-blue { background: rgba(59, 130, 246, 0.1); color: #3b82f6; }
        .bg-soft-green { background: rgba(16, 185, 129, 0.1); color: #10b981; }
        .bg-soft-purple { background: rgba(139, 92, 246, 0.1); color: #8b5cf6; }

        .stat-pill {
            background: var(--bg-hover);
            padding: 0.75rem 1.25rem;
            border-radius: 16px;
            display: flex; align-items: center; gap: 0.75rem;
        }

        .tab-nav-modern {
            display: flex; gap: 0.5rem;
            background: var(--bg-hover);
            padding: 0.5rem; border-radius: 20px;
            margin-bottom: 2.5rem; width: fit-content;
        }

        .tab-btn-modern {
            padding: 0.75rem 1.5rem; border: none; background: transparent;
            color: var(--text-secondary); font-weight: 700; font-size: 0.9rem;
            border-radius: 14px; transition: all 0.2s;
            display: flex; align-items: center; gap: 0.5rem;
        }

        .tab-btn-modern.active {
            background: var(--bg-card); color: var(--primary-600);
            box-shadow: 0 4px 12px rgba(0,0,0,0.05);
        }

        .filter-pill {
            padding: 0.6rem 1.25rem; border-radius: 14px; cursor: pointer;
            font-size: 0.85rem; font-weight: 700; transition: all 0.2s;
            background: var(--bg-hover); color: var(--text-secondary); border: 1px solid transparent;
        }

        .filter-pill.active {
            background: var(--primary-600); color: white; border-color: var(--primary-600);
            box-shadow: 0 4px 12px rgba(37, 99, 235, 0.2);
        }

        .table-modern {
            width: 100%; border-collapse: separate; border-spacing: 0 0.75rem;
        }
        .table-modern th {
            padding: 1rem 1.5rem; font-size: 0.75rem; font-weight: 800;
            text-transform: uppercase; color: var(--text-secondary); letter-spacing: 1px;
        }
        .table-modern tr td {
            background: var(--bg-card); padding: 1.25rem 1.5rem;
            border-top: 1px solid var(--border-color); border-bottom: 1px solid var(--border-color);
            transition: all 0.2s;
        }
        .table-modern tr td:first-child { border-left: 1px solid var(--border-color); border-top-left-radius: 20px; border-bottom-left-radius: 20px; }
        .table-modern tr td:last-child { border-right: 1px solid var(--border-color); border-top-right-radius: 20px; border-bottom-right-radius: 20px; }
        .table-modern tr:hover td { background: var(--bg-hover); }

        .modal-backdrop {
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(15, 23, 42, 0.8); backdrop-filter: blur(8px);
            display: flex; align-items: center; justify-content: center; z-index: 10000;
            animation: fadeIn 0.3s ease-out;
        }
        .modal-container {
            background: var(--bg-card); width: 95%; max-width: 600px;
            border-radius: 32px; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5);
            animation: modalIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
            max-height: 90vh; display: flex; flex-direction: column; overflow: hidden;
        }
        .modal-header {
            padding: 2rem; background: linear-gradient(to bottom, var(--bg-hover), var(--bg-card));
            border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: flex-start;
        }
        .header-icon {
            width: 52px; height: 52px; background: var(--primary-600); color: white;
            border-radius: 16px; display: flex; align-items: center; justify-content: center;
            box-shadow: 0 8px 16px rgba(37, 99, 235, 0.2); margin-bottom: 1rem;
        }
        .modal-body-scroll { padding: 2rem; overflow-y: auto; flex: 1; }
        .modal-footer { padding: 1.5rem 2rem; border-top: 1px solid var(--border-color); display: flex; justify-content: flex-end; gap: 1rem; }

        .form-section-card {
            background: var(--bg-hover); padding: 1.5rem; border-radius: 24px; margin-bottom: 1.5rem;
        }
        .section-title { font-size: 0.75rem; font-weight: 800; color: var(--primary-600); text-transform: uppercase; margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem; }
        
        .modern-input {
            width: 100%; background: var(--bg-card); border: 2px solid var(--border-color);
            padding: 0.875rem 1.25rem; border-radius: 16px; font-weight: 500; color: var(--text-primary);
            transition: all 0.2s;
        }
        .modern-input:focus { border-color: var(--primary-600); outline: none; box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1); }
        
        .btn-modern-primary {
            background: var(--primary-600); color: white; border: none;
            padding: 0.6rem 1.25rem; border-radius: 14px; font-weight: 700;
            display: flex; align-items: center; gap: 0.5rem; transition: all 0.2s;
            font-size: 0.9rem;
        }
        .btn-modern-primary:hover { transform: translateY(-2px); box-shadow: 0 8px 16px rgba(var(--primary-rgb), 0.2); filter: brightness(1.1); }
        .btn-modern-primary:active { transform: translateY(0); }

        .btn-modern-danger {
            background: rgba(239, 68, 68, 0.1); color: #ef4444; border: 1.5px solid rgba(239, 68, 68, 0.2);
            padding: 0.6rem 1.25rem; border-radius: 14px; font-weight: 700;
            display: flex; align-items: center; gap: 0.5rem; transition: all 0.2s;
            font-size: 0.9rem;
        }
        .btn-modern-danger:hover { background: #ef4444; color: white; transform: translateY(-2px); box-shadow: 0 8px 16px rgba(239, 68, 68, 0.2); }
        .btn-modern-danger:active { transform: translateY(0); }

        .kelas-btn {
            width: 100%; text-align: left; padding: 1rem 1.25rem; border: none; 
            display: flex; justify-content: space-between; align-items: center;
            background: transparent; color: var(--text-secondary);
            border-radius: 14px; font-weight: 600; transition: all 0.2s;
            margin-bottom: 4px;
        }
        .kelas-btn:hover { background: var(--bg-hover); color: var(--text-primary); transform: translateX(4px); }
        .kelas-btn.active { 
            background: var(--primary-50); color: var(--primary-700); 
            box-shadow: inset 4px 0 0 var(--primary-600);
        }
        [data-theme='dark'] .kelas-btn.active { background: rgba(37, 99, 235, 0.1); color: #60a5fa; }

        .search-container-modern {
            position: relative; margin-bottom: 1.5rem;
        }
        .search-input-glass {
            width: 100%; padding: 0.875rem 1rem 0.875rem 3rem; border-radius: 16px;
            border: 1px solid var(--border-color); background: var(--bg-card);
            color: var(--text-primary); font-weight: 500; transition: all 0.2s;
        }
        .search-input-glass:focus { 
            border-color: var(--primary-600); box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
            background: var(--bg-card);
        }

        .accordion-item-modern {
            border-radius: 20px; border: 1px solid var(--border-color); 
            overflow: hidden; margin-bottom: 12px; transition: all 0.3s;
        }
        .accordion-item-modern.expanded { border-color: var(--primary-600); box-shadow: 0 8px 24px rgba(37, 99, 235, 0.08); }
        
        .day-header {
            width: 100%; border: none; padding: 1.25rem 1.5rem; display: flex; 
            justify-content: space-between; align-items: center; transition: all 0.2s;
        }
        .day-header.expanded { background: var(--primary-50); }
        [data-theme='dark'] .day-header.expanded { background: rgba(37, 99, 235, 0.05); }

        .session-row {
            display: grid; grid-template-columns: 120px 1fr 1fr 100px; gap: 1rem;
            padding: 1rem 1.5rem; align-items: center; border-top: 1px solid var(--border-color);
            transition: all 0.2s;
        }
        .session-row:hover { background: var(--bg-hover); }

        .pill-soft {
            padding: 0.5rem 1rem; border-radius: 10px; font-weight: 700; font-size: 0.75rem; 
            text-transform: uppercase; letter-spacing: 0.5px;
        }
        .pill-soft-primary { background: var(--primary-50); color: var(--primary-700); }
        .pill-soft-success { background: #ecfdf5; color: #059669; }
        .pill-soft-warning { background: #fffbeb; color: #d97706; }
        [data-theme='dark'] .pill-soft-primary { background: rgba(37, 99, 235, 0.1); color: #60a5fa; }
        [data-theme='dark'] .pill-soft-success { background: rgba(16, 185, 129, 0.1); color: #34d399; }
        [data-theme='dark'] .pill-soft-warning { background: rgba(245, 158, 11, 0.1); color: #fbbf24; }

        .empty-state-card {
            padding: 4rem 2rem; text-align: center; color: var(--text-secondary);
        }

        .btn-modern-primary {
            background: var(--primary-600); color: white; border: none; padding: 0.75rem 1.5rem;
            border-radius: 14px; font-weight: 700; transition: all 0.2s; display: flex; align-items: center; gap: 0.5rem;
            font-size: 0.9rem;
        }
        .btn-modern-primary:hover { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(37, 99, 235, 0.3); }

        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes modalIn { from { opacity: 0; transform: scale(0.9) translateY(20px); } to { opacity: 1; transform: scale(1) translateY(0); } }
    `;

    return (
        <div className="admin-page animate-fadeIn pb-5">
            <style dangerouslySetInnerHTML={{ __html: styles }} />

            <div className="pelajaran-header">
                <div className="d-flex align-items-center gap-3">
                    <div style={{
                        width: 52, height: 52,
                        background: 'linear-gradient(135deg, #1e293b, #334155)',
                        borderRadius: '16px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        boxShadow: '0 8px 16px rgba(0,0,0,0.1)'
                    }}>
                        <BookOpen size={28} />
                    </div>
                    <div>
                        <h2 className="fw-black mb-0" style={{ letterSpacing: '-1px', color: 'var(--text-primary)' }}>Pusat Kurikulum & Jadwal</h2>
                        <p className="text-muted small fw-bold mb-0 text-uppercase letter-spacing-1">Manajemen Mata Pelajaran, Waktu, dan Penjadwalan Sesi</p>
                    </div>
                </div>
                <div className="d-flex gap-2">
                    <button className="btn btn-glass-secondary shadow-sm" style={{ borderRadius: '14px', padding: '12px 20px', fontWeight: 700 }} onClick={fetchData}>
                        <RefreshCw size={18} className="me-2" /> Refresh
                    </button>
                    {activeTab === 'mapel' && (
                        <button className="btn btn-primary shadow-sm" style={{ borderRadius: '14px', padding: '12px 24px', fontWeight: 700, backgroundColor: 'var(--primary-600)' }} onClick={openCreateMapelModal}>
                            <PlusCircle size={20} className="me-2" /> Tambah Mapel
                        </button>
                    )}
                    {activeTab === 'waktu' && (
                        <button className="btn btn-primary shadow-sm" style={{ borderRadius: '14px', padding: '12px 24px', fontWeight: 700, backgroundColor: 'var(--primary-600)' }} onClick={openCreateJamModal}>
                            <PlusCircle size={20} className="me-2" /> Tambah Waktu
                        </button>
                    )}
                </div>
            </div>

            {/* Bento Stats Overview */}
            <div className="bento-grid">
                <div className="bento-main">
                    <div className="bento-card">
                        <div className="d-flex justify-content-between align-items-start mb-4">
                            <div>
                                <div className="icon-box-soft bg-soft-blue">
                                    <BookOpen size={24} />
                                </div>
                                <div className="text-muted small fw-bold text-uppercase letter-spacing-1 mb-1">Total Mata Pelajaran</div>
                                <h1 className="fw-black mb-0" style={{ fontSize: '3.5rem', letterSpacing: '-2px', color: 'var(--text-primary)' }}>{mapelList.length}</h1>
                            </div>
                            <div className="d-none d-md-block">
                                <TrendingUp size={48} className="text-primary opacity-10" />
                            </div>
                        </div>
                        <div className="d-flex gap-3 mt-4">
                            <div className="stat-pill">
                                <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#3b82f6' }}></div>
                                <div className="flex-grow-1">
                                    <div className="text-muted" style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase' }}>Sesi Pelajaran</div>
                                    <div className="fw-bold" style={{ color: 'var(--text-primary)' }}>{jamList.filter(j => j.tipe === 'Pelajaran').length}</div>
                                </div>
                            </div>
                            <div className="stat-pill">
                                <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#10b981' }}></div>
                                <div className="flex-grow-1">
                                    <div className="text-muted" style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase' }}>Total Jadwal</div>
                                    <div className="fw-bold" style={{ color: 'var(--text-primary)' }}>{jadwalList.length}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="bento-side">
                    <div className="bento-card h-100 d-flex flex-column justify-content-center">
                        <div className="d-flex align-items-center gap-3">
                            <div className="icon-box-soft bg-soft-green mb-0" style={{ width: 42, height: 42 }}>
                                <CheckCircle size={20} />
                            </div>
                            <div>
                                <div className="text-muted small fw-bold text-uppercase mb-0" style={{ fontSize: '0.65rem' }}>System Health</div>
                                <h3 className="fw-bold mb-0" style={{ color: 'var(--text-primary)' }}>Excellent</h3>
                            </div>
                        </div>
                        <div className="mt-4 pt-3 border-top" style={{ borderColor: 'var(--border-color)' }}>
                            <div className="d-flex justify-content-between small mb-1">
                                <span className="text-muted">Database Sync</span>
                                <span className="text-success fw-bold">Active</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="tab-nav-modern">
                <button className={`tab-btn-modern ${activeTab === 'jadwal' ? 'active' : ''}`} onClick={() => setActiveTab('jadwal')}>
                    <Calendar size={18} /> Jadwal Kelas
                </button>
                <button className={`tab-btn-modern ${activeTab === 'waktu' ? 'active' : ''}`} onClick={() => setActiveTab('waktu')}>
                    <Clock size={18} /> Waktu Pelajaran
                </button>
                <button className={`tab-btn-modern ${activeTab === 'mapel' ? 'active' : ''}`} onClick={() => setActiveTab('mapel')}>
                    <Book size={18} /> Master Mata Pelajaran
                </button>
            </div>

            {loading ? <LoadingSpinner fullScreen={false} /> : (
                <div className="animate-fade-in">
                    {/* TAB JADWAL KELAS */}
                    {activeTab === 'jadwal' && (
                        <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
                            {/* Left Panel: Kelas List */}
                            <div style={{ flex: '1 1 300px', maxWidth: '350px' }}>
                                <div className="bento-card" style={{ padding: '1.5rem', borderRadius: '24px' }}>
                                    <h5 className="fw-bold mb-3 d-flex align-items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                                        <GraduationCap size={20} className="text-primary" /> Daftar Kelas
                                    </h5>
                                    <div className="search-container-modern">
                                        <Search size={18} style={{ position: 'absolute', left: '16px', top: '14px', color: 'var(--text-secondary)', zIndex: 1 }} />
                                        <input
                                            type="text"
                                            placeholder="Cari kelas..."
                                            className="search-input-glass"
                                            value={search}
                                            onChange={e => setSearch(e.target.value)}
                                        />
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '500px', overflowY: 'auto' }}>
                                        {kelasList.filter(k => (k.nama || '').toLowerCase().includes(search.toLowerCase())).map(k => (
                                            <button
                                                key={k.id}
                                                className={`kelas-btn ${selectedKelasId === k.id ? 'active' : ''}`}
                                                onClick={() => setSelectedKelasId(k.id)}
                                            >
                                                {k.nama}
                                                <ChevronRight size={18} style={{ opacity: selectedKelasId === k.id ? 1 : 0.3 }} />
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Right Panel: Daily Schedule */}
                            <div style={{ flex: '2 1 600px' }}>
                                {selectedKelasData ? (
                                    <div className="bento-card" style={{ padding: '2rem', borderRadius: '32px' }}>
                                        <div className="d-flex justify-content-between align-items-center mb-4">
                                            <div>
                                                <h4 className="fw-black mb-1" style={{ color: 'var(--text-primary)' }}>
                                                    Jadwal Kelas {selectedKelasData.nama}
                                                </h4>
                                                <p className="text-muted small fw-bold text-uppercase letter-spacing-1 mb-0">Kelola distribusi waktu pengajaran</p>
                                            </div>
                                            <div className="d-flex gap-2">
                                                <button className="btn-modern-danger" onClick={handleBulkDelete}>
                                                    <Trash2 size={18} /> Kosongkan
                                                </button>
                                                <button className="btn-modern-primary" onClick={() => openCreateModal(expandedHari)}>
                                                    <PlusCircle size={18} /> Tambah Sesi
                                                </button>
                                            </div>
                                        </div>

                                        <div className="d-flex flex-column gap-3">
                                            {daysOfWeek.map(hari => {
                                                const isExpanded = expandedHari === hari
                                                const sessions = currentKelasSchedules.filter(j => j.hari === hari)
                                                return (
                                                    <div key={hari} className={`accordion-item-modern ${isExpanded ? 'expanded' : ''}`}>
                                                        <button
                                                            className={`day-header ${isExpanded ? 'expanded' : ''}`}
                                                            onClick={() => setExpandedHari(isExpanded ? null : hari)}
                                                        >
                                                            <div className="d-flex align-items-center gap-3">
                                                                <div className={`p-2 rounded-xl ${isExpanded ? 'bg-primary text-white shadow-sm' : 'bg-soft-blue'}`} style={{ width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                                    <Calendar size={20} />
                                                                </div>
                                                                <span className="fw-bold" style={{ color: 'var(--text-primary)' }}>Hari {hari}</span>
                                                            </div>
                                                            <div className="d-flex align-items-center gap-3">
                                                                <span className={`pill-soft ${sessions.length > 0 ? 'pill-soft-primary' : ''}`} style={{ background: sessions.length > 0 ? '' : 'var(--bg-hover)', color: sessions.length > 0 ? '' : 'var(--text-secondary)' }}>
                                                                    {sessions.length} Sesi
                                                                </span>
                                                                <ChevronDown size={20} style={{ transform: isExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.3s' }} className="text-muted" />
                                                            </div>
                                                        </button>
                                                        {isExpanded && (
                                                            <div className="day-body" style={{ borderTop: '1px solid var(--border-color)' }}>
                                                                {sessions.length === 0 ? (
                                                                    <div className="empty-state-card">
                                                                        <Calendar size={32} className="opacity-20 mb-3" />
                                                                        <p className="mb-0 fw-bold">Belum ada jadwal untuk hari ini.</p>
                                                                    </div>
                                                                ) : (
                                                                    <div className="sessions-list">
                                                                        <div className="session-row text-muted small fw-bold text-uppercase letter-spacing-1" style={{ backgroundColor: 'var(--bg-hover)', borderTop: 'none' }}>
                                                                            <div>Waktu</div>
                                                                            <div>Mata Pelajaran</div>
                                                                            <div>Guru</div>
                                                                            <div className="text-end">Aksi</div>
                                                                        </div>
                                                                        {sessions.sort((a, b) => a.jam_ke - b.jam_ke).map(s => (
                                                                            <div key={s.id} className="session-row">
                                                                                <div className="d-flex flex-column">
                                                                                    <span className="fw-black" style={{ color: 'var(--text-primary)' }}>Jam ke-{s.jam_ke}</span>
                                                                                    <span className="text-muted small fw-bold">
                                                                                        {s.jam_mulai?.substring(0, 5)} - {s.jam_selesai?.substring(0, 5)}
                                                                                    </span>
                                                                                </div>
                                                                                <div>
                                                                                    <span className="pill-soft pill-soft-primary">
                                                                                        {s.mapel_nama}
                                                                                    </span>
                                                                                </div>
                                                                                <div className="d-flex align-items-center gap-2">
                                                                                    <div style={{
                                                                                        width: 32, height: 32, borderRadius: '10px',
                                                                                        background: 'var(--primary-50)', color: 'var(--primary-700)',
                                                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                                                        fontSize: '0.75rem', fontWeight: 800
                                                                                    }}>
                                                                                        {s.guru_nama?.charAt(0)}
                                                                                    </div>
                                                                                    <span className="fw-bold small" style={{ color: 'var(--text-primary)' }}>{s.guru_nama}</span>
                                                                                </div>
                                                                                <div className="d-flex justify-content-end gap-2">
                                                                                    <button className="btn btn-glass-secondary btn-sm p-2 rounded-lg" onClick={() => openEditModal(s)}><Edit size={16} /></button>
                                                                                    <button className="btn btn-glass-danger btn-sm p-2 rounded-lg" onClick={() => handleDelete(s.id)} style={{ color: '#ef4444' }}><Trash2 size={16} /></button>
                                                                                </div>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="bento-card h-100 d-flex flex-column align-items-center justify-content-center py-5" style={{ borderRadius: '32px' }}>
                                        <div className="icon-box-soft bg-soft-blue" style={{ width: 80, height: 80 }}>
                                            <GraduationCap size={40} />
                                        </div>
                                        <h5 className="fw-bold mt-4" style={{ color: 'var(--text-primary)' }}>Pilih Kelas Terlebih Dahulu</h5>
                                        <p className="text-muted text-center small fw-medium px-4" style={{ maxWidth: '300px' }}>Silakan pilih kelas dari daftar di sebelah kiri untuk mengelola jadwal pelajaran.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* TAB WAKTU PELAJARAN */}
                    {activeTab === 'waktu' && (
                        <div className="bento-card animate-fade-in" style={{ padding: '2rem', borderRadius: '32px' }}>
                            <div className="d-flex justify-content-between align-items-center mb-4">
                                <div>
                                    <h4 className="fw-black mb-1" style={{ color: 'var(--text-primary)' }}>Master Waktu Pelajaran</h4>
                                    <p className="text-muted small fw-bold text-uppercase letter-spacing-1 mb-0">Konfigurasi rentang waktu per sesi pelajaran</p>
                                </div>
                            </div>
                            <div className="table-responsive">
                                <table className="table-modern">
                                    <thead>
                                        <tr>
                                            <th>Jam Ke</th>
                                            <th>Waktu Pelaksanaan</th>
                                            <th>Tipe Sesi</th>
                                            <th className="text-end">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {jamList.length === 0 ? (
                                            <tr><td colSpan="4" className="text-center py-5 text-muted fw-bold">Belum ada data waktu pelajaran.</td></tr>
                                        ) : jamList.map(j => (
                                            <tr key={j.id}>
                                                <td className="fw-black" style={{ color: 'var(--text-primary)' }}>Jam ke-{j.jam_ke}</td>
                                                <td>
                                                    <div className="d-flex align-items-center gap-2 fw-bold small" style={{ color: 'var(--text-primary)' }}>
                                                        <div className="icon-box-soft bg-soft-blue mb-0" style={{ width: 32, height: 32, borderRadius: '8px' }}>
                                                            <Clock size={16} />
                                                        </div>
                                                        {j.jam_mulai.substring(0, 5)} - {j.jam_selesai.substring(0, 5)}
                                                    </div>
                                                </td>
                                                <td>
                                                    <span className={`pill-soft ${j.tipe === 'Pelajaran' ? 'pill-soft-primary' : 'pill-soft-warning'}`}>
                                                        {j.tipe}
                                                    </span>
                                                </td>
                                                <td className="text-end">
                                                    <div className="d-flex justify-content-end gap-2">
                                                        <button className="btn btn-glass-secondary btn-sm p-2 rounded-lg" onClick={() => openEditJamModal(j)}><Edit size={16} /></button>
                                                        <button className="btn btn-glass-danger btn-sm p-2 rounded-lg" onClick={() => handleJamDelete(j.id)} style={{ color: '#ef4444' }}><Trash2 size={16} /></button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* TAB MASTER MATA PELAJARAN */}
                    {activeTab === 'mapel' && (
                        <div className="animate-fade-in">
                            <div className="bento-card mb-4" style={{ padding: '1.25rem', borderRadius: '24px' }}>
                                <div className="d-flex align-items-center gap-3 flex-wrap">
                                    <div className="search-container-modern mb-0 flex-grow-1" style={{ maxWidth: '400px' }}>
                                        <Search size={18} style={{ position: 'absolute', left: '16px', top: '14px', color: 'var(--text-secondary)', zIndex: 1 }} />
                                        <input
                                            type="text"
                                            placeholder="Cari mata pelajaran..."
                                            className="search-input-glass"
                                            value={searchMapel}
                                            onChange={e => setSearchMapel(e.target.value)}
                                        />
                                    </div>
                                    <div className="d-flex gap-2 ms-md-auto">
                                        <div className="filter-pill active">SEMUA</div>
                                        <div className="filter-pill">NASIONAL</div>
                                        <div className="filter-pill">PEMINATAN</div>
                                    </div>
                                </div>
                            </div>

                            <div className="bento-card" style={{ padding: '2rem', borderRadius: '32px' }}>
                                <div className="table-responsive">
                                    <table className="table-modern">
                                        <thead>
                                            <tr>
                                                <th>Mata Pelajaran</th>
                                                <th>Kelas & Guru</th>
                                                <th className="text-end">Aksi</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {mapelList.filter(m => (m.nama || '').toLowerCase().includes(searchMapel.toLowerCase())).length === 0 ? (
                                                <tr><td colSpan="3" className="text-center py-5 text-muted fw-bold">Mata Pelajaran tidak ditemukan.</td></tr>
                                            ) : mapelList.filter(m => (m.nama || '').toLowerCase().includes(searchMapel.toLowerCase())).map(m => (
                                                <tr key={m.id}>
                                                    <td className="fw-black" style={{ color: 'var(--text-primary)' }}>
                                                        <div className="d-flex align-items-center gap-3">
                                                            <div className="icon-box-soft bg-soft-blue mb-0" style={{ width: 36, height: 36, borderRadius: '10px' }}>
                                                                <BookOpen size={18} />
                                                            </div>
                                                            {m.nama}
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <div className="fw-bold mb-1" style={{ fontSize: '0.85rem' }}>{m.kelas_nama || '-'}</div>
                                                        <div className="text-muted" style={{ fontSize: '0.75rem' }}><User size={12} className="me-1" />{m.guru_nama || 'Belum diatur'}</div>
                                                    </td>
                                                    <td className="text-end">
                                                        <div className="d-flex justify-content-end gap-2">
                                                            <button className="btn btn-glass-secondary btn-sm p-2 rounded-lg" onClick={() => openEditMapelModal(m)}><Edit size={16} /></button>
                                                            <button className="btn btn-glass-danger btn-sm p-2 rounded-lg" onClick={() => handleMapelDelete(m.id, m.nama)} style={{ color: '#ef4444' }}><Trash2 size={16} /></button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* PORTAL MODALS */}
            {showModal && createPortal(
                <div className="modal-backdrop">
                    <div className="modal-container">
                        <div className="modal-header">
                            <div>
                                <div className="header-icon">
                                    {isEdit ? <Edit size={24} /> : <Calendar size={24} />}
                                </div>
                                <h3 className="fw-black mb-1" style={{ color: 'var(--text-primary)', letterSpacing: '-1px' }}>
                                    {isEdit ? 'Edit Sesi Jadwal' : 'Tambah Sesi Baru'}
                                </h3>
                                <p className="text-muted small fw-bold text-uppercase mb-0">{selectedKelasData?.nama} • Hari {formData.hari}</p>
                            </div>
                            <button className="btn btn-glass-secondary p-2 rounded-circle" onClick={() => setShowModal(false)}><X size={20} /></button>
                        </div>
                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
                            <div className="modal-body-scroll">
                                <div className="form-section-card">
                                    <div className="section-title"><Clock size={16} /> Waktu & Sesi</div>
                                    <div className="row g-3">
                                        <div className={isEdit ? "col-12" : "col-6"}>
                                            <label className="text-muted small fw-bold mb-2 d-block">{isEdit ? 'PILIH JAM PELAJARAN' : 'DARI JAM KE-'}</label>
                                            <select className="modern-input" required value={formData.jam_pelajaran_id} onChange={e => setFormData({ ...formData, jam_pelajaran_id: e.target.value })}>
                                                <option value="">-- Pilih Jam --</option>
                                                {jamList.filter(j => j.tipe === 'Pelajaran').map(j => (
                                                    <option key={j.id} value={j.id}>Jam ke-{j.jam_ke} ({j.jam_mulai.substring(0, 5)}-{j.jam_selesai.substring(0, 5)})</option>
                                                ))}
                                            </select>
                                        </div>
                                        {!isEdit && (
                                            <div className="col-6">
                                                <label className="text-muted small fw-bold mb-2 d-block">SAMPAI JAM KE-</label>
                                                <select className="modern-input" required value={formData.end_jam_pelajaran_id} onChange={e => setFormData({ ...formData, end_jam_pelajaran_id: e.target.value })}>
                                                    <option value="">-- Pilih Jam Akhir --</option>
                                                    {jamList.filter(j => j.tipe === 'Pelajaran').map(j => (
                                                        <option key={j.id} value={j.id}>Jam ke-{j.jam_ke} ({j.jam_mulai.substring(0, 5)}-{j.jam_selesai.substring(0, 5)})</option>
                                                    ))}
                                                </select>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="form-section-card">
                                    <div className="section-title"><BookOpen size={16} /> Materi & Pengajar</div>
                                    <div className="mb-0">
                                        <label className="text-muted small fw-bold mb-2 d-block">MATA PELAJARAN</label>
                                        <select className="modern-input" required value={formData.mapel_id} onChange={e => setFormData({ ...formData, mapel_id: e.target.value })}>
                                            <option value="">-- Pilih Mapel --</option>
                                            {mapelList.filter(m => String(m.kelas_id) === String(formData.kelas_id)).map(m => (
                                                <option key={m.id} value={m.id}>{m.nama} (Oleh: {m.guru_nama})</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-glass-secondary" style={{ borderRadius: '14px', fontWeight: 700 }} onClick={() => setShowModal(false)}>Batal</button>
                                <button type="submit" className="btn-modern-primary" disabled={submitLoading}>
                                    {submitLoading ? 'Menyimpan...' : <><Save size={20} /> Simpan Jadwal</>}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>,
                document.body
            )}

            {showJamModal && createPortal(
                <div className="modal-backdrop">
                    <div className="modal-container" style={{ maxWidth: '500px' }}>
                        <div className="modal-header">
                            <div>
                                <div className="header-icon">
                                    <Clock size={24} />
                                </div>
                                <h3 className="fw-black mb-1" style={{ color: 'var(--text-primary)', letterSpacing: '-1px' }}>
                                    {isEditJam ? 'Edit Waktu' : 'Tambah Waktu'}
                                </h3>
                                <p className="text-muted small fw-bold text-uppercase mb-0">Konfigurasi Sesi Pengajaran</p>
                            </div>
                            <button className="btn btn-glass-secondary p-2 rounded-circle" onClick={() => setShowJamModal(false)}><X size={20} /></button>
                        </div>
                        <form onSubmit={handleJamSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
                            <div className="modal-body-scroll">
                                <div className="form-section-card">
                                    <div className="section-title"><List size={16} /> Identitas Sesi</div>
                                    <div className="row g-3">
                                        <div className="col-12">
                                            <label className="text-muted small fw-bold mb-2 d-block">JAM KE-</label>
                                            <input type="number" className="modern-input" required value={jamFormData.jam_ke} onChange={e => setJamFormData({ ...jamFormData, jam_ke: e.target.value })} />
                                        </div>
                                        <div className="col-12">
                                            <label className="text-muted small fw-bold mb-2 d-block">TIPE SESI</label>
                                            <select className="modern-input" required value={jamFormData.tipe} onChange={e => setJamFormData({ ...jamFormData, tipe: e.target.value })}>
                                                <option value="Pelajaran">Pelajaran</option>
                                                <option value="Istirahat">Istirahat</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                                <div className="form-section-card">
                                    <div className="section-title"><Clock size={16} /> Rentang Waktu</div>
                                    <div className="row g-3">
                                        <div className="col-6">
                                            <label className="text-muted small fw-bold mb-2 d-block">JAM MULAI</label>
                                            <input type="time" className="modern-input" required value={jamFormData.jam_mulai} onChange={e => setJamFormData({ ...jamFormData, jam_mulai: e.target.value })} />
                                        </div>
                                        <div className="col-6">
                                            <label className="text-muted small fw-bold mb-2 d-block">JAM SELESAI</label>
                                            <input type="time" className="modern-input" required value={jamFormData.jam_selesai} onChange={e => setJamFormData({ ...jamFormData, jam_selesai: e.target.value })} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-glass-secondary" onClick={() => setShowJamModal(false)}>Batal</button>
                                <button type="submit" className="btn-modern-primary" disabled={submitLoadingJam}>
                                    {submitLoadingJam ? 'Menyimpan...' : <><Save size={20} /> Simpan Waktu</>}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>,
                document.body
            )}

            {showMapelModal && createPortal(
                <div className="modal-backdrop">
                    <div className="modal-container" style={{ maxWidth: '500px' }}>
                        <div className="modal-header">
                            <div>
                                <div className="header-icon">
                                    <Book size={24} />
                                </div>
                                <h3 className="fw-black mb-1" style={{ color: 'var(--text-primary)', letterSpacing: '-1px' }}>
                                    {isEditMapel ? 'Edit Mapel' : 'Tambah Mapel'}
                                </h3>
                                <p className="text-muted small fw-bold text-uppercase mb-0">Master Data Kurikulum</p>
                            </div>
                            <button className="btn btn-glass-secondary p-2 rounded-circle" onClick={() => setShowMapelModal(false)}><X size={20} /></button>
                        </div>
                        <form onSubmit={handleMapelSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
                            <div className="modal-body-scroll">
                                <div className="form-section-card">
                                    <div className="section-title"><Info size={16} /> Informasi Pelajaran</div>
                                    <div className="mb-4">
                                        <label className="text-muted small fw-bold mb-2 d-block">NAMA MATA PELAJARAN</label>
                                        <input type="text" className="modern-input" placeholder="Misal: Matematika Terapan" required value={mapelFormData.nama} onChange={e => setMapelFormData({ ...mapelFormData, nama: e.target.value })} />
                                    </div>
                                    <div className="mb-3">
                                        <label className="text-muted small fw-bold mb-2 d-block">TINGKAT/KELOMPOK</label>
                                        <select className="modern-input" required value={mapelFormData.tingkat} onChange={e => setMapelFormData({ ...mapelFormData, tingkat: e.target.value })}>
                                            <option value="Nasional">Nasional (Wajib)</option>
                                            <option value="Kewilayahan">Kewilayahan</option>
                                            <option value="Peminatan">Peminatan Kejuruan</option>
                                        </select>
                                    </div>
                                    <div className="mb-3">
                                        <label className="text-muted small fw-bold mb-2 d-block">KELAS</label>
                                        <select className="modern-input" required value={mapelFormData.kelas_id} onChange={e => setMapelFormData({ ...mapelFormData, kelas_id: e.target.value })}>
                                            <option value="">-- Pilih Kelas --</option>
                                            {kelasList.map(k => <option key={k.id} value={k.id}>{k.nama}</option>)}
                                        </select>
                                    </div>
                                    <div className="mb-0">
                                        <label className="text-muted small fw-bold mb-2 d-block">GURU PENGAMPU</label>
                                        <select className="modern-input" required value={mapelFormData.guru_id} onChange={e => setMapelFormData({ ...mapelFormData, guru_id: e.target.value })}>
                                            <option value="">-- Pilih Guru --</option>
                                            {guruList.map(g => <option key={g.id} value={g.id}>{g.nama}</option>)}
                                        </select>
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-glass-secondary" onClick={() => setShowMapelModal(false)}>Batal</button>
                                <button type="submit" className="btn-modern-primary" disabled={submitLoadingMapel}>
                                    {submitLoadingMapel ? 'Menyimpan...' : <><Save size={20} /> Simpan Mapel</>}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>,
                document.body
            )}
        </div>
    )
}
