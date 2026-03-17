import { useApp } from '../context/AppContext'
import { useMemo } from 'react'
import StatCards from '../features/dashboard/StatCards'
import TransactionChart from '../features/dashboard/TransactionChart'
import RecentActivity from '../features/dashboard/RecentActivity'
import CashFlowSummary from '../features/dashboard/CashFlowSummary'
import TopDebtors from '../features/dashboard/TopDebtors'

export default function DashboardPage() {
    const { students, bills, cashFlow, formatRupiah, activityLog, units, tahunAjaran } = useApp()

    const activeStudentsCount = students.filter(s => s.status === 'aktif').length
    const graduatedStudentsCount = students.filter(s => s.status === 'lulus').length
    const totalKelasCount = units.reduce((s, u) => s + u.kelas.length, 0)
    const unpaidBills = bills.filter(b => b.status === 'belum')
    const paidBills = bills.filter(b => b.status === 'lunas')
    const totalUnpaidAmount = unpaidBills.reduce((s, b) => s + b.nominal, 0)
    const totalPaidAmount = paidBills.reduce((s, b) => s + b.nominal, 0)

    const totalIncome = cashFlow.filter(c => c.tipe === 'masuk').reduce((s, c) => s + c.nominal, 0)
    const totalExpense = cashFlow.filter(c => c.tipe === 'keluar').reduce((s, c) => s + c.nominal, 0)
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

    // Chart data
    const chartData = useMemo(() => {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun']
        return months.map(m => {
            const paid = bills.filter(b => b.status === 'lunas' && b.bulan === m)
            const unpaid = bills.filter(b => b.status === 'belum' && b.bulan === m)
            return {
                bulan: m,
                terbayar: paid.reduce((s, b) => s + b.nominal, 0),
                tunggakan: unpaid.reduce((s, b) => s + b.nominal, 0),
            }
        })
    }, [bills])

    // Top debtors
    const topDebtorsList = useMemo(() => {
        const map = {}
        unpaidBills.forEach(b => {
            const sid = b.siswa_id || b.siswaId
            const snama = b.siswa_nama || b.siswaName
            if (!map[sid]) map[sid] = { nama: snama, total: 0 }
            map[sid].total += Number(b.nominal)
        })
        return Object.values(map).sort((a, b) => b.total - a.total).slice(0, 5)
    }, [unpaidBills])

    return (
        <div className="fade-in">
            <div className="page-header">
                <div>
                    <h1>Selamat Datang, Pak Ahmad 👋</h1>
                    <p style={{ color: 'var(--text-secondary)', marginTop: 4, fontSize: '0.9rem' }}>
                        Tahun Ajaran: <strong>{tahunAjaran}</strong> (Aktif)
                    </p>
                </div>
            </div>

            <StatCards stats={stats} formatRupiah={formatRupiah} />

            <div className="grid-60-40" style={{ marginBottom: 24 }}>
                <TransactionChart chartData={chartData} formatRupiah={formatRupiah} />
                <RecentActivity activityLog={activityLog} />
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
