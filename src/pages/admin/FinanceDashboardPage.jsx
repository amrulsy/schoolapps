import { useApp } from '../../context/AppContext'
import { useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts'
import { TrendingUp, Target } from 'lucide-react'
import LoadingSpinner from '../../components/LoadingSpinner'
import StatCards from '../../features/dashboard/StatCards'
import RevenueDistributionChart from '../../features/dashboard/RevenueDistributionChart'
import RecentActivity from '../../features/dashboard/RecentActivity'
import TopDebtors from '../../features/dashboard/TopDebtors'

export default function DashboardPage() {
    const { students, bills, cashFlow, formatRupiah, generateLogs, transactions, units, tahunAjaran, categories, MONTHS, loading } = useApp()

    const activeStudentsCount = students.filter(s => s.status === 'aktif').length
    const graduatedStudentsCount = students.filter(s => s.status === 'lulus').length
    const totalKelasCount = units.reduce((s, u) => s + (u.kelas?.length || 0), 0)

    // Consistent property access for bills
    const unpaidBills = bills.filter(b => b.status === 'belum')
    const paidBills = bills.filter(b => b.status === 'lunas')
    const totalUnpaidAmount = unpaidBills.reduce((s, b) => s + Number(b.nominal || 0), 0)
    const totalPaidAmount = paidBills.reduce((s, b) => s + Number(b.nominal || 0), 0)


    // Arus Kas Sekolah (from LaporanPage)
    const monthlyCashFlowData = useMemo(() => {
        return MONTHS.map((m, idx) => {
            const targetMonthIndex = idx < 6 ? idx + 6 : idx - 6;
            const income = cashFlow.filter(c => {
                if (c.tipe !== 'masuk' || !c.tanggal) return false;
                const d = new Date(c.tanggal);
                return d.getMonth() === targetMonthIndex;
            }).reduce((s, c) => s + Number(c.nominal), 0);

            const expense = cashFlow.filter(c => {
                if (c.tipe !== 'keluar' || !c.tanggal) return false;
                const d = new Date(c.tanggal);
                return d.getMonth() === targetMonthIndex;
            }).reduce((s, c) => s + Number(c.nominal), 0);

            return { bulan: m, pemasukan: income, pengeluaran: expense }
        })
    }, [cashFlow, MONTHS])

    // Rasio Penagihan per Kategori (from LaporanPage)
    const collectionRatioData = useMemo(() => {
        return categories.map(cat => {
            const catBills = bills.filter(b => (b.kategori_nama || b.kategori) === cat.nama && b.tahun_ajaran === tahunAjaran)
            const totalNominal = catBills.reduce((s, b) => s + Number(b.nominal), 0)
            const paidNominal = catBills.filter(b => b.status === 'lunas').reduce((s, b) => s + Number(b.nominal), 0)
            const unpaidNominal = totalNominal - paidNominal
            const rate = totalNominal > 0 ? ((paidNominal / totalNominal) * 100).toFixed(1) : 0
            return {
                id: cat.id,
                nama: cat.nama,
                count: catBills.length,
                total: totalNominal,
                paid: paidNominal,
                unpaid: unpaidNominal,
                rate: Number(rate)
            }
        })
    }, [bills, categories, tahunAjaran])

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div style={{
                    background: 'var(--bg-card)', border: '1px solid var(--border-color)',
                    borderRadius: 8, padding: '12px 16px', boxShadow: 'var(--shadow-md)',
                }}>
                    <p style={{ fontWeight: 600, marginBottom: 4 }}>{label}</p>
                    {payload.map((p, i) => (
                        <p key={i} style={{ color: p.color, fontSize: '0.85rem', margin: 0 }}>
                            {p.name}: {formatRupiah(p.value)}
                        </p>
                    ))}
                </div>
            )
        }
        return null
    }

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


    // Revenue Distribution by Category (for Donut Chart)
    const revenueDistributionData = useMemo(() => {
        return collectionRatioData
            .filter(item => item.paid > 0)
            .map((item, idx) => ({
                name: item.nama,
                value: item.paid,
                color: ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'][idx % 6]
            }))
    }, [collectionRatioData])

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

    if (loading) return <LoadingSpinner fullScreen={false} message="Menghitung Data Statistik..." />

    return (
        <div className="fade-in">
            <div className="page-header">
                <div>
                    <h1>Dashboard Keuangan 💰</h1>
                    <p style={{ color: 'var(--text-secondary)', marginTop: 4, fontSize: '0.9rem' }}>
                        Analisis Pendapatan, Tagihan & Arus Kas - {tahunAjaran}
                    </p>
                </div>
            </div>

            <StatCards stats={stats} formatRupiah={formatRupiah} />

            <div className="grid-60-40" style={{ marginBottom: 24 }}>
                <RevenueDistributionChart data={revenueDistributionData} formatRupiah={formatRupiah} />
                <RecentActivity activityLog={realActivityLog} />
            </div>

            <div className="grid-60-40" style={{ marginBottom: 24 }}>
                <div className="card">
                    <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <TrendingUp size={20} color="var(--success-500)" /> Arus Kas Sekolah
                        </h3>
                        <div style={{ display: 'flex', gap: 16 }}>
                            <div style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: 4 }}>
                                <div style={{ width: 10, height: 10, background: '#22C55E', borderRadius: 2 }}></div> Pemasukan
                            </div>
                            <div style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: 4 }}>
                                <div style={{ width: 10, height: 10, background: '#EF4444', borderRadius: 2 }}></div> Pengeluaran
                            </div>
                        </div>
                    </div>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={monthlyCashFlowData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                            <XAxis dataKey="bulan" tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} axisLine={false} tickLine={false} />
                            <YAxis
                                tick={{ fill: 'var(--text-secondary)', fontSize: 11 }}
                                axisLine={false}
                                tickLine={false}
                                tickFormatter={v => v >= 1000000 ? `${(v / 1000000).toFixed(1)}jt` : v >= 1000 ? `${(v / 1000).toFixed(0)}rb` : v}
                            />
                            <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: 'var(--gray-100)', opacity: 0.4 }} />
                            <Bar dataKey="pemasukan" name="Pemasukan" fill="#22C55E" radius={[4, 4, 0, 0]} barSize={20} />
                            <Bar dataKey="pengeluaran" name="Pengeluaran" fill="#EF4444" radius={[4, 4, 0, 0]} barSize={20} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
                <TopDebtors topDebtors={topDebtorsList} formatRupiah={formatRupiah} />
            </div>

            <div className="card">
                <div className="card-header">
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Target size={20} color="var(--primary-500)" /> Rasio Penagihan per Kategori
                    </h3>
                </div>
                <div className="table-container" style={{ border: 'none', boxShadow: 'none' }}>
                    <table>
                        <thead>
                            <tr>
                                <th>Kategori</th>
                                <th style={{ textAlign: 'right' }}>Total Tagihan</th>
                                <th style={{ textAlign: 'right' }}>Terbayar</th>
                                <th style={{ textAlign: 'right' }}>Tunggakan</th>
                                <th style={{ width: '30%' }}>Progres Rasio</th>
                            </tr>
                        </thead>
                        <tbody>
                            {collectionRatioData.map(item => (
                                <tr key={item.id}>
                                    <td style={{ fontWeight: 600 }}>{item.nama}</td>
                                    <td style={{ textAlign: 'right' }}>{formatRupiah(item.total)}</td>
                                    <td style={{ textAlign: 'right', color: 'var(--success-600)' }}>{formatRupiah(item.paid)}</td>
                                    <td style={{ textAlign: 'right', color: 'var(--danger-500)' }}>{formatRupiah(item.unpaid)}</td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                            <div style={{ flex: 1, height: 8, background: 'var(--gray-100)', borderRadius: 4, overflow: 'hidden' }}>
                                                <div style={{
                                                    width: `${item.rate}%`,
                                                    height: '100%',
                                                    background: item.rate >= 80 ? 'var(--success-500)' : item.rate >= 50 ? 'var(--warning-500)' : 'var(--danger-500)',
                                                    borderRadius: 4,
                                                    transition: 'width 1s cubic-bezier(0.4, 0, 0.2, 1)'
                                                }} />
                                            </div>
                                            <span style={{ fontSize: '0.85rem', fontWeight: 700, minWidth: 45, textAlign: 'right' }}>{item.rate}%</span>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
