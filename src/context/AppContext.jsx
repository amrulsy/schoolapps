import { createContext, useContext, useState, useCallback, useEffect } from 'react'

const AppContext = createContext()

import {
    MONTHS,
    ACTIVITY_LOG,
} from '../data/seedData'

const API_BASE = 'http://localhost:3000/api'

export function AppProvider({ children }) {
    const [theme, setTheme] = useState('light')
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
    const [students, setStudents] = useState([])
    const [units, setUnits] = useState([])
    const [categories, setCategories] = useState([])
    const [bills, setBills] = useState([])
    const [cashFlow, setCashFlow] = useState([])
    const [transactions, setTransactions] = useState([])
    const [users, setUsers] = useState([])
    const [tahunAjaranList, setTahunAjaranList] = useState([])
    const [generateLogs, setGenerateLogs] = useState([])
    const [toasts, setToasts] = useState([])
    const [loading, setLoading] = useState(true)
    const [currentUser] = useState({ nama: 'Pak Ahmad', role: 'admin' })

    const activeTahunAjaran = tahunAjaranList.find(t => t.status === 'aktif')?.tahun || '2025/2026'

    const fetchBills = useCallback(async () => {
        try {
            const res = await fetch(`${API_BASE}/tagihan`)
            const data = await res.json()
            setBills(data)
        } catch (err) { console.error("Fetch bills error:", err) }
    }, [])

    // --- FETCH INITIAL DATA ---
    useEffect(() => {
        const fetchData = async () => {
            console.log("[AppContext] Starting initial data fetch...");
            try {
                setLoading(true)

                // Helper to safe-fetch
                const safeFetch = async (url, defaultValue = []) => {
                    try {
                        const res = await fetch(url);
                        if (!res.ok) {
                            console.warn(`[AppContext] Fetch failed for ${url} (Status: ${res.statusCode})`);
                            return defaultValue;
                        }
                        const data = await res.json();
                        console.log(`[AppContext] Received ${Array.isArray(data) ? data.length : 'object'} items from ${url}`);
                        return data;
                    } catch (e) {
                        console.error(`[AppContext] Error fetching ${url}:`, e);
                        return defaultValue;
                    }
                };

                const [sData, uData, kData, cData, bData, tAData, txData, cfData, usrData, logData] = await Promise.all([
                    safeFetch(`${API_BASE}/siswa`),
                    safeFetch(`${API_BASE}/units`),
                    safeFetch(`${API_BASE}/kelas`),
                    safeFetch(`${API_BASE}/categories`),
                    safeFetch(`${API_BASE}/tagihan`),
                    safeFetch(`${API_BASE}/tahun-ajaran`),
                    safeFetch(`${API_BASE}/transactions`),
                    safeFetch(`${API_BASE}/cashflow`),
                    safeFetch(`${API_BASE}/users`),
                    safeFetch(`${API_BASE}/log-generate`)
                ])

                console.log("[AppContext] Mapping and setting state...");

                // Map snake_case to camelCase for UI consistency where needed
                const mappedStudents = sData.map(s => ({
                    ...s,
                    kelasId: s.kelas_id,
                    kelas: s.kelas_nama,
                    tempatLahir: s.tempat_lahir,
                    tglLahir: s.tgl_lahir,
                    jenisTinggal: s.jenis_tinggal
                }))

                // Nest kelas inside units
                const nestedUnits = uData.map(unit => ({
                    ...unit,
                    kelas: kData.filter(k => k.unit_id === unit.id) || []
                }))

                setStudents(mappedStudents)
                setUnits(nestedUnits)
                setCategories(cData)
                setBills(bData)
                setTahunAjaranList(tAData)
                setTransactions(txData)
                setCashFlow(cfData)
                setUsers(usrData)
                setGenerateLogs(logData)

                console.log("[AppContext] Initial data fetch complete.");
            } catch (err) {
                console.error("[AppContext] Fatal fetch error:", err)
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [])

    const toggleTheme = useCallback(() => {
        setTheme(prev => {
            const next = prev === 'light' ? 'dark' : 'light'
            document.documentElement.setAttribute('data-theme', next)
            return next
        })
    }, [])

    const addToast = useCallback((type, title, message) => {
        const id = Date.now()
        setToasts(prev => [...prev, { id, type, title, message }])
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id))
        }, 4000)
    }, [])

    const removeToast = useCallback((id) => {
        setToasts(prev => prev.filter(t => t.id !== id))
    }, [])

    const formatRupiah = useCallback((num) => {
        return 'Rp ' + Number(num).toLocaleString('id-ID')
    }, [])

    const addTahunAjaran = useCallback(async (tahun) => {
        try {
            const res = await fetch(`${API_BASE}/tahun-ajaran`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tahun })
            })
            if (res.ok) {
                const data = await res.json()
                setTahunAjaranList(prev => [data, ...prev])
                addToast('success', 'Berhasil', `Tahun ajaran ${tahun} berhasil ditambahkan`)
            }
        } catch (err) { addToast('danger', 'Error', 'Gagal menambah tahun ajaran') }
    }, [addToast])

    const setTahunAjaranAktif = useCallback(async (id) => {
        try {
            const res = await fetch(`${API_BASE}/tahun-ajaran/${id}/status`, {
                method: 'PUT'
            })
            if (res.ok) {
                setTahunAjaranList(prev => prev.map(t => ({
                    ...t,
                    status: t.id === id ? 'aktif' : 'nonaktif'
                })))
                addToast('success', 'Berhasil', 'Tahun ajaran aktif berhasil diubah')
            }
        } catch (err) { addToast('danger', 'Error', 'Gagal mengubah status tahun ajaran') }
    }, [addToast])

    const addStudent = useCallback(async (student) => {
        try {
            const res = await fetch(`${API_BASE}/siswa`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(student)
            })
            if (res.ok) {
                const data = await res.json()
                // Find class name for UI
                const kelasName = units.flatMap(u => u.kelas).find(k => k.id === student.kelasId)?.nama || ''
                setStudents(prev => [...prev, { ...student, id: data.id, kelas: kelasName }])
                addToast('success', 'Berhasil', `Siswa ${student.nama} berhasil ditambahkan`)
            }
        } catch (err) { addToast('danger', 'Error', 'Gagal menambah siswa') }
    }, [addToast, units])

    const updateStudent = useCallback(async (id, data) => {
        console.log("Updating Student Payload:", id, data)
        try {
            const res = await fetch(`${API_BASE}/siswa/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            })
            if (res.ok) {
                // Find class name for UI
                const kelasName = units.flatMap(u => u.kelas).find(k => k.id === data.kelasId)?.nama || ''
                setStudents(prev => prev.map(s => {
                    if (s.id === id) {
                        return {
                            ...s,
                            ...data,
                            kelas: kelasName,
                            ayah: { ...(s.ayah || {}), ...(data.ayah || {}) },
                            ibu: { ...(s.ibu || {}), ...(data.ibu || {}) },
                            wali_detail: { ...(s.wali_detail || {}), ...(data.wali_detail || {}) }
                        }
                    }
                    return s
                }))
                addToast('success', 'Berhasil', 'Data siswa berhasil diperbarui')
            }
        } catch (err) { addToast('danger', 'Error', 'Gagal memperbarui siswa') }
    }, [addToast, units])

    const deleteStudent = useCallback(async (id) => {
        try {
            const res = await fetch(`${API_BASE}/siswa/${id}`, { method: 'DELETE' })
            if (res.ok) {
                setStudents(prev => prev.filter(s => s.id !== id))
                addToast('success', 'Berhasil', 'Data siswa berhasil dihapus')
            }
        } catch (err) { addToast('danger', 'Error', 'Gagal menghapus siswa') }
    }, [addToast])

    const generateBulkBills = useCallback(async (kelasIds, kategoriId, mIndices, inputTAId = null) => {
        const category = categories.find(c => c.id === kategoriId)
        if (!category) return 0
        const taObj = inputTAId ? tahunAjaranList.find(t => t.id === Number(inputTAId)) : tahunAjaranList.find(t => t.status === 'aktif')
        const targetStudents = students.filter(s => kelasIds.includes(s.kelasId) && s.status === 'aktif')
        const [y1, y2] = (taObj?.tahun || "2025/2026").split('/').map(Number)
        const newBills = []

        targetStudents.forEach(student => {
            mIndices.forEach(m => {
                const exists = bills.some(b => b.siswa_id === student.id && b.kategori_id === kategoriId && b.bulan === MONTHS[m] && (b.tahun_ajaran_id === taObj?.id))
                if (!exists) {
                    const billYear = m <= 5 ? y1 : y2
                    newBills.push({
                        siswa_id: student.id,
                        kategori_id: kategoriId,
                        tahun_ajaran_id: taObj?.id || null,
                        bulan: MONTHS[m],
                        tahun: billYear,
                        nominal_asli: category.nominal,
                        nominal: category.nominal,
                        status: 'belum',
                        kelas_id: student.kelasId
                    })
                }
            })
        })

        if (newBills.length === 0) return 0

        try {
            const logData = {
                tipe: 'bulk',
                keterangan: `Generate ${category.nama} untuk ${kelasIds.length} kelas`,
                operator: currentUser.nama
            }

            const res = await fetch(`${API_BASE}/tagihan`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tagihanList: newBills, logData })
            })
            if (res.ok) {
                await fetchBills()
                const freshLogs = await (await fetch(`${API_BASE}/log-generate`)).json()
                setGenerateLogs(freshLogs)
                addToast('success', 'Generate Berhasil', `${newBills.length} tagihan berhasil di-generate`)
                return newBills.length
            }
        } catch (err) { addToast('danger', 'Error', 'Gagal generate tagihan massal') }
        return 0
    }, [bills, categories, students, addToast, MONTHS, tahunAjaranList, fetchBills])

    const generateSingleBill = useCallback(async (siswaId, inputKategori, customNominal, mIndices, inputTAId = null) => {
        const student = students.find(s => s.id === siswaId)
        if (!student || student.status !== 'aktif') return 0
        const taObj = inputTAId ? tahunAjaranList.find(t => t.id === Number(inputTAId)) : tahunAjaranList.find(t => t.status === 'aktif')
        const isCustom = typeof inputKategori === 'string'
        const categoryMaster = !isCustom ? categories.find(c => c.id === inputKategori) : null
        const kategoriName = isCustom ? inputKategori : (categoryMaster?.nama || 'Lain-lain')
        const nominalTagihan = isCustom ? Number(customNominal) : (categoryMaster?.nominal || 0)
        const [y1, y2] = (taObj?.tahun || "2025/2026").split('/').map(Number)
        const newBills = []

        mIndices.forEach(m => {
            let exists = isCustom
                ? bills.some(b => b.siswa_id === student.id && (b.kategori_nama === kategoriName || b.kategori === kategoriName) && b.bulan === MONTHS[m] && (b.tahun_ajaran_id === taObj?.id))
                : bills.some(b => b.siswa_id === student.id && b.kategori_id === inputKategori && b.bulan === MONTHS[m] && (b.tahun_ajaran_id === taObj?.id))

            if (!exists && nominalTagihan > 0) {
                const billYear = m <= 5 ? y1 : y2
                newBills.push({
                    siswa_id: student.id,
                    kategori_id: isCustom ? null : inputKategori,
                    tahun_ajaran_id: taObj?.id || null,
                    bulan: MONTHS[m],
                    tahun: billYear,
                    nominal_asli: nominalTagihan,
                    nominal: nominalTagihan,
                    status: 'belum',
                    kelas_id: student.kelasId
                })
            }
        })

        if (newBills.length === 0) return 0

        try {
            const logData = {
                tipe: 'single',
                keterangan: `Generate ${kategoriName} untuk ${student.nama}`,
                operator: currentUser.nama
            }
            const res = await fetch(`${API_BASE}/tagihan`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tagihanList: newBills, logData })
            })
            if (res.ok) {
                await fetchBills()
                const freshLogs = await (await fetch(`${API_BASE}/log-generate`)).json()
                setGenerateLogs(freshLogs)
                addToast('success', 'Berhasil', `${newBills.length} tagihan berhasil dibuat`)
                return newBills.length
            }
        } catch (err) { addToast('danger', 'Error', 'Gagal membuat tagihan tunggal') }
        return 0
    }, [bills, categories, students, addToast, MONTHS, tahunAjaranList, fetchBills])

    const rollbackGeneration = useCallback(async (logId) => {
        try {
            const res = await fetch(`${API_BASE}/log-generate/${logId}`, {
                method: 'DELETE'
            })
            if (res.ok) {
                await fetchBills()
                const freshLogs = await (await fetch(`${API_BASE}/log-generate`)).json()
                setGenerateLogs(freshLogs)
                addToast('success', 'Rollback Berhasil', 'Tagihan berhasil dibatalkan.')
                return true
            } else {
                const errData = await res.json()
                addToast('danger', 'Gagal Rollback', errData.error || 'Terjadi kesalahan.')
                return false
            }
        } catch (err) {
            addToast('danger', 'Error', 'Gagal melakukan rollback.')
            return false
        }
    }, [fetchBills, addToast])

    const applyDiscountToBills = useCallback(async (billIds, type, value) => {
        try {
            const res = await fetch(`${API_BASE}/tagihan/discount`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ billIds, type, value })
            })
            if (res.ok) {
                await fetchBills()
                addToast('success', 'Berhasil', `Diskon diterapkan pada ${billIds.length} tagihan.`)
            }
        } catch (err) { addToast('danger', 'Error', 'Gagal menerapkan diskon') }
    }, [addToast, fetchBills])

    const processPayment = useCallback(async (selectedBillIds, amountPaid, partialPayMap = {}) => {
        const billsToPay = bills.filter(b => selectedBillIds.includes(b.id))
        if (billsToPay.length === 0) return null
        const total = billsToPay.reduce((s, b) => s + (Number(partialPayMap[b.id] ?? b.nominal) || 0), 0)

        if (amountPaid < total) return null

        try {
            const res = await fetch(`${API_BASE}/pembayaran`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    siswaId: billsToPay[0].siswa_id || billsToPay[0].siswaId,
                    selectedBillIds,
                    amountPaid,
                    total,
                    change: amountPaid - total,
                    partialPayMap,
                    kasir: currentUser.nama
                })
            })

            if (res.ok) {
                const data = await res.json()
                // Fetch necessary data updates
                await Promise.all([
                    fetchBills(),
                    fetch(`${API_BASE}/transactions`).then(r => r.json()).then(setTransactions),
                    fetch(`${API_BASE}/cashflow`).then(r => r.json()).then(setCashFlow)
                ])

                addToast('success', 'Berhasil', 'Pembayaran diproses')

                // Return transaction data for receipt modal
                return {
                    id: data.id,
                    invoiceNo: data.invoiceNo,
                    tanggal: new Date().toISOString(),
                    total,
                    amountPaid,
                    change: amountPaid - total,
                    kasir: currentUser.nama,
                    items: billsToPay.map(b => ({
                        ...b,
                        kategori: b.kategori_nama || b.kategori || 'Tagihan',
                        nominal: Number(partialPayMap[b.id] ?? b.nominal) || 0
                    }))
                }
            }
        } catch (err) { addToast('danger', 'Error', 'Gagal memproses pembayaran') }
        return null
    }, [bills, currentUser, addToast, fetchBills])

    const revertTransaction = useCallback(async (id) => {
        try {
            const res = await fetch(`${API_BASE}/transactions/${id}/void`, { method: 'PUT' })
            if (res.ok) {
                // Fetch necessary data updates
                await Promise.all([
                    fetch(`${API_BASE}/transactions`).then(r => r.json()).then(setTransactions),
                    fetch(`${API_BASE}/cashflow`).then(r => r.json()).then(setCashFlow)
                ])
                addToast('success', 'Berhasil', 'Transaksi dibatalkan (Void)')
            }
        } catch (err) { addToast('danger', 'Error', 'Gagal membatalkan transaksi') }
    }, [addToast])

    const addCategory = useCallback(async (cat) => {
        try {
            const res = await fetch(`${API_BASE}/categories`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(cat)
            })
            if (res.ok) {
                const data = await res.json()
                setCategories(prev => [...prev, data])
                addToast('success', 'Berhasil', `Kategori "${cat.nama}" ditambahkan`)
            }
        } catch (err) { addToast('danger', 'Error', 'Gagal menambah kategori') }
    }, [addToast])

    const deleteCategory = useCallback(async (id) => {
        try {
            const res = await fetch(`${API_BASE}/categories/${id}`, { method: 'DELETE' })
            if (res.ok) {
                setCategories(prev => prev.filter(c => c.id !== id))
                addToast('success', 'Berhasil', 'Kategori berhasil dihapus')
            }
        } catch (err) { addToast('danger', 'Error', 'Gagal menghapus kategori') }
    }, [addToast])

    const addExpense = useCallback(async (keterangan, nominal, tanggal) => {
        try {
            const res = await fetch(`${API_BASE}/cashflow`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ keterangan, nominal, tipe: 'keluar', tanggal })
            })
            if (res.ok) {
                const data = await res.json()
                setCashFlow(prev => [data, ...prev])
                addToast('success', 'Berhasil', 'Catatan pengeluaran disimpan')
            }
        } catch (err) { addToast('danger', 'Error', 'Gagal menyimpan pengeluaran') }
    }, [addToast])

    // --- UNIT & KELAS CRUD ---
    const addUnit = useCallback(async (nama) => {
        try {
            const res = await fetch(`${API_BASE}/units`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nama })
            })
            if (res.ok) {
                const data = await res.json()
                setUnits(prev => [...prev, { ...data, kelas: [] }])
                addToast('success', 'Berhasil', `Unit "${nama}" berhasil ditambahkan`)
            } else { throw new Error('API Error') }
        } catch (err) { addToast('danger', 'Error', 'Gagal menambah unit') }
    }, [addToast])

    const updateUnit = useCallback(async (id, nama) => {
        try {
            const res = await fetch(`${API_BASE}/units/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nama })
            })
            if (res.ok) {
                setUnits(prev => prev.map(u => u.id === id ? { ...u, nama } : u))
                addToast('success', 'Berhasil', 'Unit berhasil diperbarui')
            } else { throw new Error('API Error') }
        } catch (err) { addToast('danger', 'Error', 'Gagal memperbarui unit') }
    }, [addToast])

    const deleteUnit = useCallback(async (id) => {
        try {
            const res = await fetch(`${API_BASE}/units/${id}`, { method: 'DELETE' })
            const data = await res.json()
            if (res.ok) {
                setUnits(prev => prev.filter(u => u.id !== id))
                addToast('success', 'Berhasil', 'Unit berhasil dihapus')
            } else { addToast('danger', 'Gagal', data.error || 'Terjadi kesalahan') }
        } catch (err) { addToast('danger', 'Error', 'Gagal menghapus unit') }
    }, [addToast])

    const addKelas = useCallback(async (unit_id, nama) => {
        try {
            const res = await fetch(`${API_BASE}/kelas`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ unit_id, nama })
            })
            if (res.ok) {
                const data = await res.json()
                setUnits(prev => prev.map(u => u.id === unit_id
                    ? { ...u, kelas: [...u.kelas, data] }
                    : u
                ))
                addToast('success', 'Berhasil', `Kelas "${nama}" berhasil ditambahkan`)
            } else { throw new Error('API Error') }
        } catch (err) { addToast('danger', 'Error', 'Gagal menambah kelas') }
    }, [addToast])

    const updateKelas = useCallback(async (unit_id, kelas_id, nama) => {
        try {
            const res = await fetch(`${API_BASE}/kelas/${kelas_id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nama })
            })
            if (res.ok) {
                setUnits(prev => prev.map(u => u.id === unit_id ? {
                    ...u,
                    kelas: u.kelas.map(k => k.id === kelas_id ? { ...k, nama } : k)
                } : u))
                addToast('success', 'Berhasil', 'Kelas berhasil diperbarui')
            } else { throw new Error('API Error') }
        } catch (err) { addToast('danger', 'Error', 'Gagal memperbarui kelas') }
    }, [addToast])

    const deleteKelas = useCallback(async (unit_id, kelas_id) => {
        try {
            const res = await fetch(`${API_BASE}/kelas/${kelas_id}`, { method: 'DELETE' })
            const data = await res.json()
            if (res.ok) {
                setUnits(prev => prev.map(u => u.id === unit_id ? {
                    ...u,
                    kelas: u.kelas.filter(k => k.id !== kelas_id)
                } : u))
                addToast('success', 'Berhasil', 'Kelas berhasil dihapus')
            } else { addToast('danger', 'Gagal', data.error || 'Terjadi kesalahan') }
        } catch (err) { addToast('danger', 'Error', 'Gagal menghapus kelas') }
    }, [addToast])

    // Dynamic Siswa Count calculation map
    const kelasSiswaCount = students.reduce((acc, student) => {
        if (student.status === 'aktif' && student.kelasId) {
            acc[student.kelasId] = (acc[student.kelasId] || 0) + 1;
        }
        return acc;
    }, {})

    // Inject dynamic count into units
    const unitsWithDynamicCount = units.map(unit => ({
        ...unit,
        kelas: unit.kelas.map(k => ({ ...k, siswaCount: kelasSiswaCount[k.id] || 0 }))
    }))

    const value = {
        theme, toggleTheme, sidebarCollapsed, setSidebarCollapsed,
        students, setStudents, addStudent, updateStudent, deleteStudent,
        units: unitsWithDynamicCount, setUnits, addUnit, updateUnit, deleteUnit,
        addKelas, updateKelas, deleteKelas,
        categories, addCategory, deleteCategory,
        bills, generateBulkBills, generateSingleBill, fetchBills,
        generateLogs, rollbackGeneration,
        cashFlow, transactions, revertTransaction, users,
        tahunAjaranList, addTahunAjaran, setTahunAjaranAktif,
        currentUser, tahunAjaran: activeTahunAjaran,
        toasts, addToast, removeToast, formatRupiah,
        processPayment, applyDiscountToBills,
        activityLog: ACTIVITY_LOG, MONTHS, loading
    }

    return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
    const ctx = useContext(AppContext)
    if (!ctx) throw new Error('useApp must be used within AppProvider')
    return ctx
}
