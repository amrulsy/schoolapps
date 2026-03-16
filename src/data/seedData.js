/* =============================================
   SIAS SMK PPRQ — Seed & Initial Data
   ============================================= */

export const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']

export const SEED_STUDENTS = [
    { id: 1, nisn: '0012345601', nama: 'Ahmad Fauzi', kelas: 'X IPA 1', kelasId: 1, jk: 'L', tempatLahir: 'Bogor', tglLahir: '2010-03-15', telp: '081234567801', alamat: 'Jl. Merdeka No.10', status: 'aktif', wali: 'Bp. Fauzi' },
    { id: 2, nisn: '0012345602', nama: 'Budi Santoso', kelas: 'X IPA 1', kelasId: 1, jk: 'L', tempatLahir: 'Jakarta', tglLahir: '2010-06-22', telp: '081234567802', alamat: 'Jl. Sudirman No.5', status: 'aktif', wali: 'Bp. Santoso' },
    { id: 3, nisn: '0012345603', nama: 'Citra Dewi', kelas: 'X IPS 1', kelasId: 3, jk: 'P', tempatLahir: 'Bandung', tglLahir: '2010-01-08', telp: '081234567803', alamat: 'Jl. Anggrek No.7', status: 'aktif', wali: 'Ibu Dewi' },
    { id: 4, nisn: '0012345604', nama: 'Dewi Lestari', kelas: 'XI IPA 1', kelasId: 4, jk: 'P', tempatLahir: 'Surabaya', tglLahir: '2009-11-30', telp: '081234567804', alamat: 'Jl. Kenari No.3', status: 'aktif', wali: 'Bp. Lestari' },
    { id: 5, nisn: '0012345605', nama: 'Eko Prasetyo', kelas: 'XII IPA 1', kelasId: 6, jk: 'L', tempatLahir: 'Yogyakarta', tglLahir: '2008-07-12', telp: '081234567805', alamat: 'Jl. Flamboyan No.9', status: 'lulus', wali: 'Bp. Prasetyo' },
    { id: 6, nisn: '0012345606', nama: 'Fina Harahap', kelas: 'X IPA 2', kelasId: 2, jk: 'P', tempatLahir: 'Medan', tglLahir: '2010-09-05', telp: '081234567806', alamat: 'Jl. Cemara No.12', status: 'aktif', wali: 'Ibu Harahap' },
    { id: 7, nisn: '0012345607', nama: 'Gunawan Sidiq', kelas: 'X IPA 2', kelasId: 2, jk: 'L', tempatLahir: 'Semarang', tglLahir: '2010-04-18', telp: '081234567807', alamat: 'Jl. Melati No.8', status: 'aktif', wali: 'Bp. Sidiq' },
    { id: 8, nisn: '0012345608', nama: 'Hani Safitri', kelas: 'XI IPS 1', kelasId: 5, jk: 'P', tempatLahir: 'Depok', tglLahir: '2009-12-20', telp: '081234567808', alamat: 'Jl. Dahlia No.15', status: 'aktif', wali: 'Ibu Safitri' },
    { id: 9, nisn: '0012345609', nama: 'Irfan Maulana', kelas: 'X TKJ 1', kelasId: 7, jk: 'L', tempatLahir: 'Tangerang', tglLahir: '2010-02-28', telp: '081234567809', alamat: 'Jl. Sakura No.20', status: 'aktif', wali: 'Bp. Maulana' },
    { id: 10, nisn: '0012345610', nama: 'Jasmine Putri', kelas: 'X TKJ 2', kelasId: 8, jk: 'P', tempatLahir: 'Bekasi', tglLahir: '2010-05-14', telp: '081234567810', alamat: 'Jl. Mawar No.6', status: 'aktif', wali: 'Ibu Putri' },
    { id: 11, nisn: '0012345611', nama: 'Kurnia Adi', kelas: 'XI TKJ 1', kelasId: 9, jk: 'L', tempatLahir: 'Bogor', tglLahir: '2009-08-03', telp: '081234567811', alamat: 'Jl. Tulip No.4', status: 'aktif', wali: 'Bp. Adi' },
    { id: 12, nisn: '0012345612', nama: 'Lina Marlina', kelas: 'X IPS 1', kelasId: 3, jk: 'P', tempatLahir: 'Cirebon', tglLahir: '2010-10-25', telp: '081234567812', alamat: 'Jl. Teratai No.11', status: 'pindah', wali: 'Ibu Marlina' },
]

export const SEED_UNITS = [
    {
        id: 1, nama: 'SMA',
        kelas: [
            { id: 1, nama: 'X IPA 1', siswaCount: 3 },
            { id: 2, nama: 'X IPA 2', siswaCount: 2 },
            { id: 3, nama: 'X IPS 1', siswaCount: 2 },
            { id: 4, nama: 'XI IPA 1', siswaCount: 1 },
            { id: 5, nama: 'XI IPS 1', siswaCount: 1 },
            { id: 6, nama: 'XII IPA 1', siswaCount: 1 },
        ]
    },
    {
        id: 2, nama: 'SMK',
        kelas: [
            { id: 7, nama: 'X TKJ 1', siswaCount: 1 },
            { id: 8, nama: 'X TKJ 2', siswaCount: 1 },
            { id: 9, nama: 'XI TKJ 1', siswaCount: 1 },
        ]
    }
]

export const SEED_CATEGORIES = [
    { id: 1, nama: 'SPP', nominal: 150000, tipe: 'Bulanan' },
    { id: 2, nama: 'Ujian Semester', nominal: 100000, tipe: 'Semester' },
    { id: 3, nama: 'Daftar Ulang', nominal: 500000, tipe: 'Tahunan' },
    { id: 4, nama: 'Seragam', nominal: 350000, tipe: 'Insidentil' },
    { id: 5, nama: 'Buku Paket', nominal: 200000, tipe: 'Tahunan' },
]

export const SEED_USERS = [
    { id: 1, nama: 'Pak Ahmad', username: 'ahmad@pprq', role: 'admin' },
    { id: 2, nama: 'Bu Siti', username: 'siti@pprq', role: 'kasir' },
    { id: 3, nama: 'Pak Budi', username: 'budi@pprq', role: 'kasir' },
]

export const SEED_TAHUN_AJARAN = [
    { id: 1, tahun: '2025/2026', status: 'aktif' },
    { id: 2, tahun: '2024/2025', status: 'nonaktif' },
    { id: 3, tahun: '2023/2024', status: 'nonaktif' },
]

export const ACTIVITY_LOG = [
    { text: 'Budi Santoso membayar SPP Feb 2026', time: '5 menit lalu' },
    { text: 'Tagihan Kelas X IPA 1 di-generate', time: '1 jam lalu' },
    { text: 'Pengeluaran: Beli ATK Rp 250.000', time: '2 jam lalu' },
    { text: 'Login: Pak Ahmad', time: '3 jam lalu' },
    { text: 'Citra Dewi membayar SPP Jan 2026', time: '5 jam lalu' },
]

/* =============================================
   Helper Generators
   ============================================= */

export function generateInitialBills() {
    const bills = []
    let id = 1
    const activeStudents = SEED_STUDENTS.filter(s => s.status === 'aktif')
    activeStudents.forEach(student => {
        for (let m = 0; m < 3; m++) {
            const isPaid = Math.random() > 0.5
            const nominalAsli = 150000
            bills.push({
                id: id++,
                siswaId: student.id,
                siswaName: student.nama,
                kelas: student.kelas,
                kategoriId: 1,
                kategori: 'SPP',
                bulan: MONTHS[m],
                tahun: 2026,
                tahunAjaran: '2025/2026',
                nominalAsli: nominalAsli,
                nominal: nominalAsli,
                isDiskon: false,
                status: isPaid ? 'lunas' : 'belum',
                paidAt: isPaid ? `2026-0${m + 1}-${10 + Math.floor(Math.random() * 15)}` : null,
            })
        }
    })
    return bills
}

export function generateInitialCashFlow(bills) {
    const flows = []
    let id = 1
    const paidBills = bills.filter(b => b.status === 'lunas')
    paidBills.forEach(bill => {
        flows.push({
            id: id++,
            tanggal: bill.paidAt,
            keterangan: `${bill.kategori} ${bill.siswaName} - ${bill.bulan}'${bill.tahun.toString().slice(-2)} (${bill.tahunAjaran})`,
            nominal: bill.nominal,
            tipe: 'masuk',
            ref: `#${String(bill.id).padStart(4, '0')}`,
        })
    })

    const expenses = [
        { keterangan: 'Beli Kertas A4 (5 rim)', nominal: 275000, tanggal: '2026-01-15' },
        { keterangan: 'Bayar Listrik Januari', nominal: 850000, tanggal: '2026-01-20' },
        { keterangan: 'Beli Toner Printer', nominal: 350000, tanggal: '2026-02-05' },
        { keterangan: 'Bayar Listrik Februari', nominal: 920000, tanggal: '2026-02-18' },
        { keterangan: 'Bayar Air PDAM', nominal: 180000, tanggal: '2026-02-20' },
        { keterangan: 'Beli Alat Kebersihan', nominal: 150000, tanggal: '2026-03-01' },
    ]

    expenses.forEach(exp => {
        flows.push({
            id: id++,
            tanggal: exp.tanggal,
            keterangan: exp.keterangan,
            nominal: exp.nominal,
            tipe: 'keluar',
            ref: '—',
        })
    })
    flows.sort((a, b) => b.tanggal.localeCompare(a.tanggal))
    return flows
}

export function generateInitialTransactions(bills) {
    const paidBills = bills.filter(b => b.status === 'lunas')
    const grouped = {}
    paidBills.forEach(b => {
        const key = `${b.siswaId}-${b.paidAt}`
        if (!grouped[key]) grouped[key] = []
        grouped[key].push(b)
    })

    const transactions = []
    let invNum = 1
    for (const key in grouped) {
        const items = grouped[key]
        const total = items.reduce((s, i) => s + i.nominal, 0)
        transactions.push({
            id: Date.now() + invNum * 100,
            invoiceNo: `INV-${items[0].paidAt.replace(/-/g, '')}-${String(invNum).padStart(4, '0')}`,
            tanggal: items[0].paidAt,
            siswaName: items[0].siswaName,
            kasir: 'Pak Ahmad',
            items,
            total,
            amountPaid: total,
            change: 0,
            status: 'success'
        })
        invNum++
    }
    transactions.sort((a, b) => b.tanggal.localeCompare(a.tanggal))
    return transactions
}
