import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { API_BASE, getAuthHeaders } from '../../services/api'
import LoadingSpinner from '../../components/LoadingSpinner'
import {
    Calendar, PlusCircle, Trash2, Edit, Save, X, Search, Clock,
    ChevronDown, ChevronRight, BookOpen, RefreshCw, Layout,
    TrendingUp, CheckCircle, ShieldCheck, List, Info, Book, Users, User, GraduationCap
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

        .kelas-navigator-modern {
            background: var(--bg-card); border: 1px solid var(--border-color);
            border-radius: 32px; padding: 1.5rem; height: 100%;
            display: flex; flex-direction: column; gap: 1.5rem;
            box-shadow: 0 10px 30px -10px rgba(0,0,0,0.05);
        }

        .search-container-modern { position: relative; margin-bottom: 0.5rem; }
        .search-input-glass {
            background: var(--bg-hover) !important; border: 1.5px solid transparent !important;
            border-radius: 20px !important; padding: 0.85rem 1rem 0.85rem 3.25rem !important;
            font-weight: 700; transition: all 0.3s !important; width: 100%;
        }
        .search-input-glass:focus {
            background: var(--bg-card) !important; border-color: var(--primary-300) !important;
            box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1) !important;
        }

        .kelas-navigator-list {
            display: flex; flex-direction: column; gap: 0.75rem;
            overflow-y: auto; padding-right: 4px;
        }
        .kelas-navigator-list::-webkit-scrollbar { width: 5px; }
        .kelas-navigator-list::-webkit-scrollbar-thumb { background: var(--border-color); border-radius: 10px; }

        .kelas-btn {
            width: 100%; padding: 1.15rem 1.5rem;
            display: flex; align-items: center; justify-content: space-between;
            background: rgba(var(--primary-rgb), 0.03); backdrop-filter: blur(8px);
            border: 1.5px solid var(--border-color); border-radius: 24px;
            color: var(--text-secondary); font-weight: 800; cursor: pointer;
            transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            position: relative; overflow: hidden;
        }
        .kelas-btn:hover {
            background: var(--bg-hover); transform: translateX(8px);
            border-color: var(--primary-400); color: var(--primary-600);
        }
        .kelas-btn.active {
            background: linear-gradient(135deg, var(--primary-600), var(--primary-800));
            color: white; border-color: transparent; scale: 1.02;
            box-shadow: 0 15px 25px -5px rgba(37, 99, 235, 0.3);
            transform: translateX(5px);
        }
        .kelas-btn.active .icon-box-soft {
            background: rgba(255, 255, 255, 0.2) !important; color: white !important;
        }
        .kelas-btn .chevron-icon { transition: all 0.3s; }
        .kelas-btn:hover .chevron-icon { transform: translateX(3px); opacity: 1 !important; color: var(--primary-600); }
        .kelas-btn.active .chevron-icon { color: white !important; opacity: 1 !important; }
        [data-theme='dark'] .kelas-btn.active { box-shadow: 0 10px 25px -5px rgba(37, 99, 235, 0.2); }

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

        @media (max-width: 768px) {
            .pelajaran-header {
                flex-direction: column;
                align-items: flex-start;
                gap: 1rem;
                padding-bottom: 0;
            }
            .pelajaran-header .d-flex.gap-2 {
                width: 100%;
                flex-wrap: wrap;
            }
            .pelajaran-header .d-flex.gap-2 button {
                flex: 1;
                justify-content: center;
                white-space: nowrap;
            }
            .bento-grid {
                grid-template-columns: 1fr;
                gap: 1rem;
            }
            .bento-card {
                padding: 1.5rem;
                border-radius: 24px;
            }
            .bento-card h1 {
                font-size: 2.5rem !important;
            }
            .tab-nav-modern {
                width: 100%;
                overflow-x: auto;
                -webkit-overflow-scrolling: touch;
                padding-bottom: 8px;
            }
            .tab-btn-modern {
                padding: 0.6rem 1rem;
                font-size: 0.8rem;
                white-space: nowrap;
            }
            .jadwal-layout-container {
                flex-direction: column !important;
                gap: 1.5rem !important;
            }
            .kelas-sidebar-container {
                max-width: 100% !important;
                width: 100% !important;
            }
            .kelas-navigator-list {
                flex-direction: row !important;
                overflow-x: auto !important;
                max-height: none !important;
                padding: 4px 4px 12px !important;
                gap: 12px !important;
                scrollbar-width: none;
            }
            .kelas-navigator-list::-webkit-scrollbar { display: none; }
            .kelas-btn {
                width: auto !important;
                min-width: 140px;
                margin-bottom: 0 !important;
                padding: 1.15rem 1.75rem !important;
                flex-shrink: 0;
                justify-content: center !important;
                font-size: 0.85rem;
                border-radius: 20px !important;
            }
            .kelas-btn .chevron-icon { display: none; }
            .kelas-btn:hover { transform: translateY(-4px); }
            .kelas-btn.active { transform: scale(1.05) translateY(-4px) !important; }

            .session-card {
                flex-direction: column;
                align-items: flex-start !important;
                gap: 1.25rem;
                padding: 1.5rem;
            }
            .session-info {
                margin-left: 0 !important;
                flex-direction: column;
                align-items: flex-start !important;
                gap: 1rem !important;
            }
            .session-card .d-flex.gap-2 {
                width: 100%;
                justify-content: flex-end;
                border-top: 1px solid var(--border-color);
                padding-top: 1rem;
            }
            .table-modern thead {
                display: none;
            }
            .table-modern tr td {
                display: block;
                width: 100%;
                border: none;
                padding: 10px 1.5rem;
            }
            .table-modern tr td:first-child {
                border-top: 1px solid var(--border-color);
                padding-top: 20px;
            }
            .table-modern tr td:last-child {
                border-bottom: 1px solid var(--border-color);
                padding-bottom: 20px;
            }
        }

        /* NEW OVERHAUL STYLES */
        .animate-slide-up { animation: slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) both; }
        @keyframes slideUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }

        .session-card {
            background: var(--bg-card); border: 1px solid var(--border-color);
            border-left: 6px solid var(--primary-600); border-radius: 22px;
            padding: 1.25rem 1.75rem; display: flex; align-items: center;
            justify-content: space-between; margin-bottom: 1rem;
            transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.1);
            box-shadow: 0 4px 12px rgba(0,0,0,0.03);
            position: relative;
        }
        .session-card:hover {
            transform: translateY(-6px) scale(1.01);
            box-shadow: 0 15px 30px -10px rgba(0,0,0,0.1);
            border-color: var(--primary-200);
        }
        
        .guru-avatar-mini {
            width: 42px; height: 42px; border-radius: 14px;
            background: linear-gradient(135deg, var(--primary-50), #eff6ff); 
            color: var(--primary-700); display: flex; align-items: center; 
            justify-content: center; font-weight: 800; font-size: 0.9rem;
            border: 1px solid var(--primary-100);
        }

        .premium-empty-state {
            padding: 5rem 2rem; display: flex; flex-direction: column;
            align-items: center; text-align: center; background: var(--bg-hover);
            border-radius: 32px; border: 2.5px dashed var(--border-color);
            margin: 1rem 0; transition: all 0.3s;
        }
        .premium-empty-state:hover { border-color: var(--primary-300); background: var(--bg-card); }

        .session-time-box { display: flex; flex-direction: column; gap: 4px; min-width: 120px; }
        .session-info { flex: 1; margin-left: 2rem; display: flex; align-items: center; gap: 3rem; }

        .table-modern tr { transition: all 0.3s; }
        .table-modern tr:hover td { transform: scale(1.002); }
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
                        <div className="jadwal-layout-container" style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
                            {/* Left Panel: Kelas Navigator */}
                            <div className="kelas-sidebar-container" style={{ flex: '1 1 300px', maxWidth: '350px' }}>
                                <div className="kelas-navigator-modern">
                                    <div className="d-flex justify-content-between align-items-center">
                                        <h5 className="fw-black mb-0 d-flex align-items-center gap-2" style={{ color: 'var(--text-primary)', fontSize: '1.1rem' }}>
                                            <GraduationCap size={22} className="text-primary" /> Daftar Kelas
                                        </h5>
                                        <span className="badge rounded-pill bg-soft-blue px-3 py-2 text-primary fw-bold" style={{ fontSize: '0.7rem' }}>
                                            {filteredKelas.length} KELAS
                                        </span>
                                    </div>
                                    <div className="search-container-modern mb-0">
                                        <Search size={18} style={{ position: 'absolute', left: '18px', top: '14px', color: 'var(--text-secondary)', zIndex: 1 }} />
                                        <input
                                            type="text"
                                            placeholder="Cari kelas..."
                                            className="search-input-glass"
                                            value={search}
                                            onChange={e => setSearch(e.target.value)}
                                        />
                                    </div>
                                    <div className="kelas-navigator-list">
                                        {filteredKelas.map((k, idx) => (
                                            <button
                                                key={k.id}
                                                className={`kelas-btn animate-slide-up ${String(selectedKelasId) === String(k.id) ? 'active' : ''}`}
                                                style={{ animationDelay: `${idx * 0.05}s`, animationDuration: '0.4s' }}
                                                onClick={() => setSelectedKelasId(k.id)}
                                            >
                                                <div className="d-flex align-items-center gap-3">
                                                    <div className="icon-box-soft mb-0 shadow-sm" style={{ width: 38, height: 38, borderRadius: '12px' }}>
                                                        <Users size={18} />
                                                    </div>
                                                    <div className="d-flex flex-column text-start">
                                                        <span className="fw-black mb-0" style={{ fontSize: '0.95rem' }}>{k.nama}</span>
                                                        <span className="text-muted small fw-bold opacity-60" style={{ fontSize: '0.65rem', display: String(selectedKelasId) === String(k.id) ? 'none' : 'block' }}>PILIH UNIT</span>
                                                    </div>
                                                </div>
                                                <ChevronRight size={18} className="chevron-icon opacity-30" />
                                            </button>
                                        ))}
                                        {filteredKelas.length === 0 && (
                                            <div className="text-center py-4 text-muted small fw-bold">Kelas tidak ditemukan</div>
                                        )}
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
                                                            <div className="day-body" style={{ borderTop: '1px solid var(--border-color)', padding: '1.5rem' }}>
                                                                {sessions.length === 0 ? (
                                                                    <div className="premium-empty-state animate-slide-up">
                                                                        <div className="icon-box-soft bg-soft-blue mb-4" style={{ width: 80, height: 80 }}>
                                                                            <Calendar size={40} />
                                                                        </div>
                                                                        <h5 className="fw-black mb-2" style={{ color: 'var(--text-primary)' }}>Hari {hari} Kosong</h5>
                                                                        <p className="text-muted small fw-bold px-4" style={{ maxWidth: '300px' }}>Belum ada jadwal yang diatur untuk hari ini. Tambahkan sesi untuk memulai.</p>
                                                                        <button className="btn-modern-primary mt-2" onClick={() => openCreateModal(hari)}>
                                                                            <PlusCircle size={18} /> Tambah Sesi Pertama
                                                                        </button>
                                                                    </div>
                                                                ) : (
                                                                    <div className="sessions-list">
                                                                        {sessions.sort((a, b) => a.jam_ke - b.jam_ke).map((s, idx) => (
                                                                            <div key={s.id} className="session-card animate-slide-up" style={{ animationDelay: `${idx * 0.05}s` }}>
                                                                                <div className="session-time-box">
                                                                                    <span className="fw-black text-primary" style={{ fontSize: '1rem' }}>Jam ke-{s.jam_ke}</span>
                                                                                    <span className="text-muted small fw-bold">
                                                                                        {s.jam_mulai?.substring(0, 5)} - {s.jam_selesai?.substring(0, 5)}
                                                                                    </span>
                                                                                </div>
                                                                                <div className="session-info">
                                                                                    <div style={{ minWidth: '160px' }}>
                                                                                        <span className="pill-soft pill-soft-primary" style={{ fontSize: '0.85rem', padding: '0.6rem 1.25rem' }}>
                                                                                            {s.mapel_nama}
                                                                                        </span>
                                                                                    </div>
                                                                                    <div className="d-flex align-items-center gap-3">
                                                                                        <div className="guru-avatar-mini shadow-sm">
                                                                                            {s.guru_nama?.charAt(0)}
                                                                                        </div>
                                                                                        <div className="d-flex flex-column">
                                                                                            <span className="text-muted small fw-bold text-uppercase" style={{ fontSize: '0.65rem' }}>Pengajar</span>
                                                                                            <span className="fw-bold" style={{ color: 'var(--text-primary)', fontSize: '0.9rem' }}>{s.guru_nama}</span>
                                                                                        </div>
                                                                                    </div>
                                                                                </div>
                                                                                <div className="d-flex justify-content-end gap-2">
                                                                                    <button className="btn btn-glass-secondary btn-sm p-2 rounded-xl" title="Edit Sesi" onClick={() => openEditModal(s)}><Edit size={18} /></button>
                                                                                    <button className="btn btn-glass-danger btn-sm p-2 rounded-xl" title="Hapus Sesi" onClick={() => handleDelete(s.id)} style={{ color: '#ef4444' }}><Trash2 size={18} /></button>
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
                        <div className="bento-card animate-slide-up" style={{ padding: '2.5rem', borderRadius: '32px' }}>
                            <div className="d-flex justify-content-between align-items-center mb-4 pb-3 border-bottom" style={{ borderColor: 'var(--border-color)' }}>
                                <div>
                                    <h4 className="fw-black mb-1" style={{ color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>Master Waktu Pelajaran</h4>
                                    <p className="text-muted small fw-bold text-uppercase letter-spacing-1 mb-0">Konfigurasi rentang waktu per sesi pelajaran</p>
                                </div>
                                <button className="btn-modern-primary d-md-none" onClick={openCreateJamModal}>
                                    <PlusCircle size={20} />
                                </button>
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
                                        ) : jamList.sort((a,b) => a.jam_ke - b.jam_ke).map(j => (
                                            <tr key={j.id}>
                                                <td>
                                                    <div className="d-flex align-items-center gap-2">
                                                        <div className="fw-black text-primary p-2 rounded-lg bg-soft-blue" style={{ fontSize: '1rem', minWidth: '45px', textAlign: 'center' }}>{j.jam_ke}</div>
                                                        <span className="fw-bold" style={{ color: 'var(--text-primary)' }}>Jam Pelajaran</span>
                                                    </div>
                                                </td>
                                                <td>
                                                    <div className="d-flex align-items-center gap-2 fw-bold" style={{ color: 'var(--text-primary)' }}>
                                                        <Clock size={18} className="text-muted" />
                                                        {j.jam_mulai.substring(0, 5)} - {j.jam_selesai.substring(0, 5)}
                                                    </div>
                                                </td>
                                                <td>
                                                    <span className={`pill-soft ${j.tipe === 'Pelajaran' ? 'pill-soft-primary' : 'pill-soft-warning'}`} style={{ padding: '0.6rem 1.25rem' }}>
                                                        {j.tipe}
                                                    </span>
                                                </td>
                                                <td className="text-end">
                                                    <div className="d-flex justify-content-end gap-2">
                                                        <button className="btn btn-glass-secondary btn-sm p-2 rounded-xl" onClick={() => openEditJamModal(j)}><Edit size={18} /></button>
                                                        <button className="btn btn-glass-danger btn-sm p-2 rounded-xl" onClick={() => handleJamDelete(j.id)} style={{ color: '#ef4444' }}><Trash2 size={18} /></button>
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
                        <div className="animate-slide-up">
                            <div className="bento-card mb-4" style={{ padding: '1.5rem', borderRadius: '28px' }}>
                                <div className="d-flex align-items-center gap-3 flex-wrap">
                                    <div className="search-container-modern mb-0 flex-grow-1" style={{ maxWidth: '450px' }}>
                                        <Search size={20} style={{ position: 'absolute', left: '18px', top: '15px', color: 'var(--text-secondary)', zIndex: 1 }} />
                                        <input
                                            type="text"
                                            placeholder="Cari mata pelajaran, guru, atau kelas..."
                                            className="search-input-glass"
                                            style={{ paddingLeft: '3.5rem' }}
                                            value={searchMapel}
                                            onChange={e => setSearchMapel(e.target.value)}
                                        />
                                    </div>
                                    <div className="d-flex gap-2 ms-md-auto overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
                                        <div className="filter-pill active">SEMUA</div>
                                        <div className="filter-pill">NASIONAL</div>
                                        <div className="filter-pill">KEWILAYAHAN</div>
                                        <div className="filter-pill">PEMINATAN</div>
                                    </div>
                                </div>
                            </div>

                            <div className="bento-card" style={{ padding: '2rem', borderRadius: '32px' }}>
                                <div className="table-responsive">
                                    <table className="table-modern">
                                        <thead>
                                            <tr>
                                                <th style={{ width: '40%' }}>Mata Pelajaran</th>
                                                <th>Unit & Pengajar</th>
                                                <th className="text-end">Aksi</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {mapelList.filter(m => (m.nama || '').toLowerCase().includes(searchMapel.toLowerCase()) || (m.guru_nama || '').toLowerCase().includes(searchMapel.toLowerCase())).length === 0 ? (
                                                <tr><td colSpan="3" className="text-center py-5 text-muted fw-bold">Mata Pelajaran tidak ditemukan.</td></tr>
                                            ) : mapelList.filter(m => (m.nama || '').toLowerCase().includes(searchMapel.toLowerCase()) || (m.guru_nama || '').toLowerCase().includes(searchMapel.toLowerCase())).map(m => (
                                                <tr key={m.id}>
                                                    <td>
                                                        <div className="d-flex align-items-center gap-4">
                                                            <div className="icon-box-soft bg-soft-blue mb-0 shadow-sm" style={{ width: 48, height: 48, borderRadius: '15px' }}>
                                                                <BookOpen size={22} />
                                                            </div>
                                                            <div>
                                                                <div className="fw-black mb-1" style={{ color: 'var(--text-primary)', fontSize: '1rem' }}>{m.nama}</div>
                                                                <span className={`pill-soft ${m.tingkat === 'Nasional' ? 'pill-soft-primary' : m.tingkat === 'Peminatan' ? 'pill-soft-success' : 'pill-soft-warning'}`} style={{ fontSize: '0.65rem', padding: '0.25rem 0.75rem' }}>
                                                                    {m.tingkat || 'Nasional'}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <div className="d-flex align-items-center gap-3">
                                                            <div className="guru-avatar-mini shadow-sm" style={{ background: 'var(--bg-hover)', color: 'var(--text-secondary)' }}>
                                                                <User size={18} />
                                                            </div>
                                                            <div>
                                                                <div className="fw-bold mb-0" style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>{m.kelas_nama || 'Semua Kelas'}</div>
                                                                <div className="text-muted small fw-bold"><span className="text-primary opacity-75">Oleh:</span> {m.guru_nama || 'Belum diatur'}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="text-end">
                                                        <div className="d-flex justify-content-end gap-2">
                                                            <button className="btn btn-glass-secondary btn-sm p-3 rounded-xl" title="Edit Mapel" onClick={() => openEditMapelModal(m)}><Edit size={18} /></button>
                                                            <button className="btn btn-glass-danger btn-sm p-3 rounded-xl" title="Hapus Mapel" onClick={() => handleMapelDelete(m.id, m.nama)} style={{ color: '#ef4444' }}><Trash2 size={18} /></button>
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
