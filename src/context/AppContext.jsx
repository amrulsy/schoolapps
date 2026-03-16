import { createContext, useContext, useState, useCallback } from 'react'

const AppContext = createContext()

import {
    MONTHS,
    SEED_STUDENTS,
    SEED_UNITS,
    SEED_CATEGORIES,
    SEED_USERS,
    SEED_TAHUN_AJARAN,
    ACTIVITY_LOG,
    generateInitialBills,
    generateInitialCashFlow,
    generateInitialTransactions
} from '../data/seedData'

const INITIAL_BILLS = generateInitialBills()
const INITIAL_CASHFLOW = generateInitialCashFlow(INITIAL_BILLS)
const INITIAL_TRANSACTIONS = generateInitialTransactions(INITIAL_BILLS)

export function AppProvider({ children }) {
    const [theme, setTheme] = useState('light')
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
    const [students, setStudents] = useState(SEED_STUDENTS)
    const [units, setUnits] = useState(SEED_UNITS)
    const [categories, setCategories] = useState(SEED_CATEGORIES)
    const [bills, setBills] = useState(INITIAL_BILLS)
    const [cashFlow, setCashFlow] = useState(INITIAL_CASHFLOW)
    const [transactions, setTransactions] = useState(INITIAL_TRANSACTIONS)
    const [users, setUsers] = useState(SEED_USERS)
    const [tahunAjaranList, setTahunAjaranList] = useState(SEED_TAHUN_AJARAN)
    const [toasts, setToasts] = useState([])
    const [currentUser] = useState({ nama: 'Pak Ahmad', role: 'admin' })
    const activeTahunAjaran = tahunAjaranList.find(t => t.status === 'aktif')?.tahun || '2025/2026'

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

    const addStudent = useCallback((student) => {
        setStudents(prev => [...prev, { ...student, id: Date.now() }])
        addToast('success', 'Berhasil', `Siswa ${student.nama} berhasil ditambahkan`)
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
        // Jika inputKategori berupa ID kategori master, string name-nya akan dicari
        // Jika string biasa (Custom), ia tidak akan divalidasi ke master
        const student = students.find(s => s.id === siswaId)
        if (!student || student.status !== 'aktif') return 0

        const isCustom = typeof inputKategori === 'string'
        const categoryMaster = !isCustom ? categories.find(c => c.id === inputKategori) : null

        const kategoriName = isCustom ? inputKategori : (categoryMaster?.nama || 'Lain-lain')
        const nominalTagihan = isCustom ? Number(customNominal) : (categoryMaster?.nominal || 0)

        const newBills = []
        let newId = bills.length + 1

        for (let m = fromMonth; m <= toMonth; m++) {
            // Cek duplikasi jika menggunakan master category (by ID). Jika kustom, izinkan saja agar overlap possible tapi terbedakan (kecuali dicegah user).
            let exists = false;
            if (!isCustom) {
                exists = bills.some(b => b.siswaId === student.id && b.kategoriId === inputKategori && b.bulan === MONTHS[m])
            } else {
                exists = bills.some(b => b.siswaId === student.id && b.kategori === kategoriName && b.bulan === MONTHS[m])
            }

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
            if (b.status === 'lunas') return b // Jangan diskon tagihan lunas

            // Logika pemotongan diskon dari nominal asal
            const base = b.nominalAsli || b.nominal
            let finalNominal = base

            if (type === 'Persentase') {
                finalNominal = base - (base * (value / 100))
            } else if (type === 'Nominal') {
                finalNominal = Math.max(0, base - value)
            }

            return {
                ...b,
                nominal: finalNominal,
                nominalAsli: base,
                isDiskon: finalNominal < base
            }
        }))
        addToast('success', 'Berhasil', `Berhasil menerapkan potongan harga pada ${billIds.length} tagihan.`)
    }, [addToast])

    const processPayment = useCallback((selectedBillIds, amountPaid, partialPayMap = {}) => {
        const now = new Date().toISOString().slice(0, 10)
        const paidBillsRaw = bills.filter(b => selectedBillIds.includes(b.id))

        // Map paid bills with their actual partial paid amounts
        const paidBills = paidBillsRaw.map(b => ({
            ...b,
            nominal: partialPayMap[b.id] || b.nominal,
            originalNominal: b.nominal
        }))

        const total = paidBills.reduce((s, b) => s + b.nominal, 0)
        if (amountPaid < total) return null

        setBills(prev => {
            const result = []
            let nextId = Math.max(...prev.map(p => p.id), Date.now() % 100000) + 1

            prev.forEach(b => {
                if (selectedBillIds.includes(b.id)) {
                    const payAmount = partialPayMap[b.id] || b.nominal
                    if (payAmount < b.nominal && payAmount > 0) {
                        // Split bill into Lunas dan Sisa
                        result.push({ ...b, nominal: payAmount, status: 'lunas', paidAt: now })
                        result.push({
                            ...b,
                            id: nextId++,
                            nominal: b.nominal - payAmount,
                            status: 'belum',
                            paidAt: null,
                            kategori: b.kategori.includes('(Sisa)') ? b.kategori : `${b.kategori} (Sisa)`
                        })
                    } else {
                        // Fully paid
                        result.push({ ...b, status: 'lunas', paidAt: now })
                    }
                } else {
                    result.push(b)
                }
            })
            return result
        })

        const newFlows = paidBills.map((bill, i) => ({
            id: Date.now() + i,
            tanggal: now,
            keterangan: `${bill.kategori} ${bill.siswaName} - ${bill.bulan}'${bill.tahun.toString().slice(-2)} (${bill.tahunAjaran})`,
            nominal: bill.nominal,
            tipe: 'masuk',
            ref: `#${String(bill.id).padStart(4, '0')}`,
        }))
        setCashFlow(prev => [...newFlows, ...prev])

        const invoiceNo = `INV-${now.replace(/-/g, '')}-${String(paidBills[0]?.id).padStart(4, '0')}`
        const newTx = {
            id: Date.now(),
            invoiceNo,
            tanggal: now,
            siswaName: paidBills[0].siswaName,
            kasir: currentUser.nama,
            items: paidBills,
            total,
            amountPaid,
            change: amountPaid - total,
            status: 'success'
        }
        setTransactions(prev => [newTx, ...prev])

        addToast('success', 'Pembayaran Berhasil', `${paidBills.length} item telah dilunaskan`)

        return newTx
    }, [bills, currentUser, addToast])

    const revertTransaction = useCallback((txId) => {
        let targetTx = null
        setTransactions(prev => prev.map(t => {
            if (t.id === txId) {
                targetTx = t
                return { ...t, status: 'voided' }
            }
            return t
        }))

        // Timeout to ensure we get the updated transaction if needed, but we already copied it here
        setTimeout(() => {
            if (!targetTx) return

            const itemIds = targetTx.items.map(i => i.id)
            setBills(prev => prev.map(b => {
                if (itemIds.includes(b.id)) {
                    return { ...b, status: 'belum', paidAt: null }
                }
                return b
            }))

            setCashFlow(prev => prev.filter(cf => !targetTx.items.find(i => cf.ref === `#${String(i.id).padStart(4, '0')}`)))

            addToast('warning', 'Transaksi Dibatalkan', `Invoice ${targetTx.invoiceNo} telah di-void`)
        }, 0)
    }, [addToast])

    const addExpense = useCallback((keterangan, nominal, tanggal) => {
        setCashFlow(prev => [{
            id: Date.now(),
            tanggal,
            keterangan,
            nominal: Number(nominal),
            tipe: 'keluar',
            ref: '—',
        }, ...prev])
        addToast('success', 'Berhasil', 'Pengeluaran berhasil dicatat')
    }, [addToast])

    const addCategory = useCallback((cat) => {
        setCategories(prev => [...prev, { ...cat, id: Date.now() }])
        addToast('success', 'Berhasil', `Kategori "${cat.nama}" berhasil ditambahkan`)
    }, [addToast])

    const deleteCategory = useCallback((id) => {
        setCategories(prev => prev.filter(c => c.id !== id))
        addToast('success', 'Berhasil', 'Kategori berhasil dihapus')
    }, [addToast])

    // Urutkan selalu dari yang terbaru ke terlama
    const sortedCashFlow = [...cashFlow].sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal))
    const sortedTransactions = [...transactions].sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal))

    const value = {
        theme, toggleTheme,
        sidebarCollapsed, setSidebarCollapsed,
        students, addStudent, updateStudent, deleteStudent,
        units, setUnits,
        categories, addCategory, deleteCategory,
        bills, generateBulkBills, generateSingleBill,
        cashFlow: sortedCashFlow, addExpense,
        transactions: sortedTransactions, revertTransaction,
        users,
        tahunAjaranList, addTahunAjaran, setTahunAjaranAktif,
        currentUser, tahunAjaran: activeTahunAjaran,
        toasts, addToast,
        formatRupiah,
        processPayment,
        applyDiscountToBills,
        activityLog: ACTIVITY_LOG,
        MONTHS,
    }

    return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
    const ctx = useContext(AppContext)
    if (!ctx) throw new Error('useApp must be used within AppProvider')
    return ctx
}
