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
    const [toasts, setToasts] = useState([])
    const [loading, setLoading] = useState(true)
    const [currentUser] = useState({ nama: 'Pak Ahmad', role: 'admin' })

    const activeTahunAjaran = tahunAjaranList.find(t => t.status === 'aktif')?.tahun || '2025/2026'

    // --- FETCH INITIAL DATA ---
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true)
                const [sRes, uRes, kRes, cRes, bRes, tARes] = await Promise.all([
                    fetch(`${API_BASE}/siswa`),
                    fetch(`${API_BASE}/units`),
                    fetch(`${API_BASE}/kelas`),
                    fetch(`${API_BASE}/categories`),
                    fetch(`${API_BASE}/tagihan`),
                    fetch(`${API_BASE}/tahun-ajaran`)
                ])

                const sData = await sRes.json()
                const uData = await uRes.json()
                const kData = await kRes.json()
                const cData = await cRes.json()
                const bData = await bRes.json()
                const tAData = await tARes.json()

                // Map snake_case to camelCase
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
            } catch (err) {
                console.error("Fetch error:", err)
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

    const formatRupiah = useCallback((num) => {
        return 'Rp ' + Number(num).toLocaleString('id-ID')
    }, [])

    const addTahunAjaran = useCallback((tahun) => {
        setTahunAjaranList(prev => [
            { id: Date.now(), tahun, status: 'nonaktif' },
            ...prev
        ])
        addToast('success', 'Berhasil', `Tahun ajaran ${tahun} berhasil ditambahkan`)
    }, [addToast])

    const setTahunAjaranAktif = useCallback((id) => {
        setTahunAjaranList(prev => prev.map(t => ({
            ...t,
            status: t.id === id ? 'aktif' : 'nonaktif'
        })))
        addToast('success', 'Berhasil', 'Tahun ajaran aktif berhasil diubah')
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
                setStudents(prev => [...prev, { ...student, id: data.id }])
                addToast('success', 'Berhasil', `Siswa ${student.nama} berhasil ditambahkan`)
            }
        } catch (err) { addToast('danger', 'Error', 'Gagal menambah siswa') }
    }, [addToast])

    const updateStudent = useCallback((id, data) => {
        setStudents(prev => prev.map(s => s.id === id ? { ...s, ...data } : s))
        addToast('success', 'Berhasil', 'Data siswa berhasil diperbarui')
    }, [addToast])

    const deleteStudent = useCallback((id) => {
        setStudents(prev => prev.filter(s => s.id !== id))
        addToast('success', 'Berhasil', 'Data siswa berhasil dihapus')
    }, [addToast])

    const generateBulkBills = useCallback((kelasIds, kategoriId, fromMonth, toMonth) => {
        const category = categories.find(c => c.id === kategoriId)
        if (!category) return 0
        const targetStudents = students.filter(s => kelasIds.includes(s.kelasId) && s.status === 'aktif')
        const newBills = []
        let newId = bills.length + 1
        targetStudents.forEach(student => {
            for (let m = fromMonth; m <= toMonth; m++) {
                const exists = bills.some(b => b.siswaId === student.id && b.kategoriId === kategoriId && b.bulan === MONTHS[m])
                if (!exists) {
                    const nominalAsli = category.nominal
                    newBills.push({
                        id: newId++,
                        siswaId: student.id,
                        siswaName: student.nama,
                        kelas: student.kelas,
                        kategoriId,
                        kategori: category.nama,
                        bulan: MONTHS[m],
                        tahun: 2026,
                        tahunAjaran: activeTahunAjaran,
                        nominalAsli: nominalAsli,
                        nominal: nominalAsli,
                        isDiskon: false,
                        status: 'belum',
                        paidAt: null,
                    })
                }
            }
        })
        setBills(prev => [...prev, ...newBills])
        addToast('success', 'Generate Berhasil', `${newBills.length} tagihan berhasil di-generate`)
        return newBills.length
    }, [bills, categories, students, addToast, activeTahunAjaran])

    const generateSingleBill = useCallback((siswaId, inputKategori, customNominal, fromMonth, toMonth) => {
        const student = students.find(s => s.id === siswaId)
        if (!student || student.status !== 'aktif') return 0
        const isCustom = typeof inputKategori === 'string'
        const categoryMaster = !isCustom ? categories.find(c => c.id === inputKategori) : null
        const kategoriName = isCustom ? inputKategori : (categoryMaster?.nama || 'Lain-lain')
        const nominalTagihan = isCustom ? Number(customNominal) : (categoryMaster?.nominal || 0)
        const newBills = []
        let newId = bills.length + 1
        for (let m = fromMonth; m <= toMonth; m++) {
            let exists = isCustom
                ? bills.some(b => b.siswaId === student.id && b.kategori === kategoriName && b.bulan === MONTHS[m])
                : bills.some(b => b.siswaId === student.id && b.kategoriId === inputKategori && b.bulan === MONTHS[m])

            if (!exists && nominalTagihan > 0) {
                newBills.push({
                    id: newId++,
                    siswaId: student.id,
                    siswaName: student.nama,
                    kelas: student.kelas,
                    kategoriId: isCustom ? null : inputKategori,
                    kategori: kategoriName,
                    bulan: MONTHS[m],
                    tahun: 2026,
                    tahunAjaran: activeTahunAjaran,
                    nominalAsli: nominalTagihan,
                    nominal: nominalTagihan,
                    isDiskon: false,
                    status: 'belum',
                    paidAt: null,
                })
            }
        }
        setBills(prev => [...prev, ...newBills])
        return newBills.length
    }, [bills, categories, students, activeTahunAjaran])

    const applyDiscountToBills = useCallback((billIds, type, value) => {
        setBills(prev => prev.map(b => {
            if (!billIds.includes(b.id)) return b
            if (b.status === 'lunas') return b
            const base = b.nominalAsli || b.nominal
            let finalNominal = type === 'Persentase' ? base - (base * (value / 100)) : Math.max(0, base - value)
            return { ...b, nominal: finalNominal, nominalAsli: base, isDiskon: finalNominal < base }
        }))
        addToast('success', 'Berhasil', `Diskon diterapkan pada ${billIds.length} tagihan.`)
    }, [addToast])

    const processPayment = useCallback((selectedBillIds, amountPaid, partialPayMap = {}) => {
        const now = new Date().toISOString().slice(0, 10)
        const paidBills = bills.filter(b => selectedBillIds.includes(b.id)).map(b => ({
            ...b,
            nominal: partialPayMap[b.id] || b.nominal,
            originalNominal: b.nominal
        }))
        const total = paidBills.reduce((s, b) => s + b.nominal, 0)
        if (amountPaid < total) return null

        setBills(prev => {
            const result = []
            let nextId = Math.max(...prev.map(p => p.id), 0) + 1
            prev.forEach(b => {
                if (selectedBillIds.includes(b.id)) {
                    const payAmount = partialPayMap[b.id] || b.nominal
                    if (payAmount < b.nominal && payAmount > 0) {
                        result.push({ ...b, nominal: payAmount, status: 'lunas', paidAt: now })
                        result.push({ ...b, id: nextId++, nominal: b.nominal - payAmount, status: 'belum', paidAt: null, kategori: b.kategoti || b.kategori_nama })
                    } else {
                        result.push({ ...b, status: 'lunas', paidAt: now })
                    }
                } else result.push(b)
            })
            return result
        })

        const invoiceNo = `INV-${now.replace(/-/g, '')}-${String(Date.now()).slice(-4)}`
        const newTx = {
            id: Date.now(), invoiceNo, tanggal: now, siswaName: paidBills[0].siswaName,
            kasir: currentUser.nama, items: paidBills, total, amountPaid, change: amountPaid - total, status: 'success'
        }
        setTransactions(prev => [newTx, ...prev])
        addToast('success', 'Berhasil', 'Pembayaran diproses')
        return newTx
    }, [bills, currentUser, addToast])

    const addCategory = useCallback((cat) => {
        setCategories(prev => [...prev, { ...cat, id: Date.now() }])
        addToast('success', 'Berhasil', `Kategori "${cat.nama}" ditambahkan`)
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
        students, addStudent, updateStudent, deleteStudent,
        units: unitsWithDynamicCount, setUnits, addUnit, updateUnit, deleteUnit,
        addKelas, updateKelas, deleteKelas,
        categories, addCategory,
        bills, generateBulkBills, generateSingleBill,
        cashFlow, transactions, users,
        tahunAjaranList, addTahunAjaran, setTahunAjaranAktif,
        currentUser, tahunAjaran: activeTahunAjaran,
        toasts, addToast, formatRupiah,
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
