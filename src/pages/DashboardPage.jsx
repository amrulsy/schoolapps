import { useApp } from '../context/AppContext'
import { useMemo } from 'react'
import StatCards from '../features/dashboard/StatCards'
import TransactionChart from '../features/dashboard/TransactionChart'
import RecentActivity from '../features/dashboard/RecentActivity'
import CashFlowSummary from '../features/dashboard/CashFlowSummary'
import TopDebtors from '../features/dashboard/TopDebtors'

export default function DashboardPage() {
    const { students, bills, cashFlow, formatRupiah, generateLogs, transactions, units, tahunAjaran, currentUser, loading } = useApp()

    const activeStudentsCount = students.filter(s => s.status === 'aktif').length
    const graduatedStudentsCount = students.filter(s => s.status === 'lulus').length
    const totalKelasCount = units.reduce((s, u) => s + (u.kelas?.length || 0), 0)

    // Consistent property access for bills
    const unpaidBills = bills.filter(b => b.status === 'belum')
    const paidBills = bills.filter(b => b.status === 'lunas')
    const totalUnpaidAmount = unpaidBills.reduce((s, b) => s + Number(b.nominal || 0), 0)
    const totalPaidAmount = paidBills.reduce((s, b) => s + Number(b.nominal || 0), 0)

    const totalIncome = cashFlow.filter(c => c.tipe === 'masuk').reduce((s, c) => s + Number(c.nominal || 0), 0)
    const totalExpense = cashFlow.filter(c => c.tipe === 'keluar').reduce((s, c) => s + Number(c.nominal || 0), 0)
    const saldoAmount = totalIncome - totalExpense

    const stats = {
        activeStudents: activeStudentsCount,
        graduatedStudents: graduatedStudentsCount,
        totalKelas: totalKelasCount,
        unitsCount: units.length,
        totalUnpaid: totalUnpaidAmount,
        unpaidCount: unpaidBills.length,
        totalPaid: totalPaidAmount,
        paidCount: paidBills.length
    }

    // Dynamic Chart Data: Last 6 Months
    const chartData = useMemo(() => {
        const result = []
        const now = new Date()
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
        const indonesianMonths = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']

        for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
            const mIdx = d.getMonth()
            const mLabel = monthNames[mIdx]
            const fullMonthName = indonesianMonths[mIdx]
            const year = d.getFullYear()

            // Filter by month name (Indonesian) and year
            const paid = bills.filter(b => b.status === 'lunas' && b.bulan === fullMonthName && Number(b.tahun) === year)
            const unpaid = bills.filter(b => b.status === 'belum' && b.bulan === fullMonthName && Number(b.tahun) === year)

            result.push({
                bulan: `${mLabel} ${year.toString().slice(-2)}`,
                terbayar: paid.reduce((s, b) => s + Number(b.nominal || 0), 0),
                tunggakan: unpaid.reduce((s, b) => s + Number(b.nominal || 0), 0),
            })
        }
        return result
    }, [bills])

    // Consolidate Real Activity Logs
    const realActivityLog = useMemo(() => {
        const logs = []

        // 1. Transactions (Payments)
        transactions.slice(0, 10).forEach(tx => {
            logs.push({
                text: `${tx.siswa_nama || tx.siswaName || 'Siswa'} membayar ${formatRupiah(tx.total)}`,
                time: new Date(tx.tanggal || tx.created_at).toLocaleString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }),
                timestamp: new Date(tx.tanggal || tx.created_at).getTime()
            })
        })

        // 2. Generation Logs
        generateLogs.slice(0, 5).forEach(log => {
            logs.push({
                text: log.keterangan,
                time: new Date(log.created_at).toLocaleString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }),
                timestamp: new Date(log.created_at).getTime()
            })
        })

        // 3. Expenses
        cashFlow.filter(c => c.tipe === 'keluar').slice(0, 5).forEach(c => {
            logs.push({
                text: `Pengeluaran: ${c.keterangan}`,
                time: new Date(c.tanggal || c.created_at).toLocaleString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }),
                timestamp: new Date(c.tanggal || c.created_at).getTime()
            })
        })

        return logs.sort((a, b) => b.timestamp - a.timestamp).slice(0, 8)
    }, [transactions, generateLogs, cashFlow, formatRupiah])

    // Top debtors
    const topDebtorsList = useMemo(() => {
        const map = {}
        unpaidBills.forEach(b => {
            const sid = b.siswa_id || b.siswaId
            const snama = b.siswa_nama || b.siswaName
            if (!map[sid]) map[sid] = { nama: snama, total: 0 }
            map[sid].total += Number(b.nominal || 0)
        })
        return Object.values(map).sort((a, b) => b.total - a.total).slice(0, 5)
    }, [unpaidBills])

    if (loading) return <div className="p-8 text-center text-muted">Memuat data dashboard...</div>

    return (
        <div className="fade-in">
            <div className="page-header">
                <div>
                    <h1>Selamat Datang, {currentUser.nama} 👋</h1>
                    <p style={{ color: 'var(--text-secondary)', marginTop: 4, fontSize: '0.9rem' }}>
                        Tahun Ajaran: <strong>{tahunAjaran}</strong> (Aktif)
                    </p>
                </div>
            </div>

            <StatCards stats={stats} formatRupiah={formatRupiah} />

            <div className="grid-60-40" style={{ marginBottom: 24 }}>
                <TransactionChart chartData={chartData} formatRupiah={formatRupiah} />
                <RecentActivity activityLog={realActivityLog} />
            </div>

            <div className="grid-60-40">
                <CashFlowSummary
                    totalIncome={totalIncome}
                    totalExpense={totalExpense}
                    saldo={saldoAmount}
                    formatRupiah={formatRupiah}
                />
                <TopDebtors topDebtors={topDebtorsList} formatRupiah={formatRupiah} />
            </div>
        </div>
    )
}
