import { useApp } from '../context/AppContext'
import { useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'
import { TrendingUp, TrendingDown, Wallet, Download } from 'lucide-react'
import * as XLSX from 'xlsx'
import { downloadFile } from '../utils/downloadHelper'

const COLORS = ['#22C55E', '#EF4444', '#3B82F6', '#F59E0B', '#14B8A6']

export default function LaporanPage() {
    const { bills, cashFlow, formatRupiah, categories, MONTHS } = useApp()

    const totalIncome = cashFlow.filter(c => c.tipe === 'masuk').reduce((s, c) => s + c.nominal, 0)
    const totalExpense = cashFlow.filter(c => c.tipe === 'keluar').reduce((s, c) => s + c.nominal, 0)
    const saldo = totalIncome - totalExpense

    // Monthly bar chart
    const monthlyData = useMemo(() => {
        return MONTHS.slice(0, 6).map(m => {
            const income = cashFlow.filter(c => c.tipe === 'masuk' && c.tanggal?.includes(`-${String(MONTHS.indexOf(m) + 1).padStart(2, '0')}-`)).reduce((s, c) => s + c.nominal, 0)
            const expense = cashFlow.filter(c => c.tipe === 'keluar' && c.tanggal?.includes(`-${String(MONTHS.indexOf(m) + 1).padStart(2, '0')}-`)).reduce((s, c) => s + c.nominal, 0)
            return { bulan: m, pemasukan: income, pengeluaran: expense }
        })
    }, [cashFlow, MONTHS])

    // Category pie chart
    const categoryData = useMemo(() => {
        return categories.map(cat => {
            const paid = bills.filter(b => b.kategori === cat.nama && b.status === 'lunas').reduce((s, b) => s + b.nominal, 0)
            return { name: cat.nama, value: paid }
        }).filter(c => c.value > 0)
    }, [bills, categories])

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div style={{
                    background: 'var(--bg-card)', border: '1px solid var(--border-color)',
                    borderRadius: 8, padding: '12px 16px', boxShadow: 'var(--shadow-md)',
                }}>
                    <p style={{ fontWeight: 600, marginBottom: 4, color: 'var(--text-primary)' }}>{label} 2026</p>
                    {payload.map((p, i) => (
                        <p key={i} style={{ color: p.color, fontSize: '0.85rem' }}>
                            {p.name}: {formatRupiah(p.value)}
                        </p>
                    ))}
                </div>
            )
        }
        return null
    }

    const handleExportExcel = async () => {
        const sheetData = cashFlow.map((c, i) => ({
            No: i + 1,
            Tanggal: c.tanggal ? new Date(c.tanggal).toLocaleDateString('id-ID') : '-',
            Tipe: c.tipe === 'masuk' ? 'Pemasukan' : 'Pengeluaran',
            Keterangan: c.keterangan,
            Nominal: c.nominal,
            Referensi: c.ref,
        }))

        // Tambahkan baris ringkasan saldo di akhir
        sheetData.push({ No: '', Tanggal: '', Tipe: '', Keterangan: '' })
        sheetData.push({ No: '', Tanggal: '', Tipe: 'TOTAL PEMASUKAN', Keterangan: '', Nominal: totalIncome })
        sheetData.push({ No: '', Tanggal: '', Tipe: 'TOTAL PENGELUARAN', Keterangan: '', Nominal: totalExpense })
        sheetData.push({ No: '', Tanggal: '', Tipe: 'SALDO BERSIH', Keterangan: '', Nominal: saldo })

        const ws = XLSX.utils.json_to_sheet(sheetData)
        // Set lebar kolom
        ws['!cols'] = [
            { wch: 5 },  // No
            { wch: 14 }, // Tanggal
            { wch: 14 }, // Tipe
            { wch: 45 }, // Keterangan
            { wch: 16 }, // Nominal
            { wch: 12 }, // Referensi
        ]
        const wb = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(wb, ws, 'Arus Kas')
        const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
        const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
        await downloadFile(blob, 'Laporan_Arus_Kas_SIAS.xlsx')
    }

    return (
        <div className="fade-in">
            <div className="page-header">
                <h1>📈 Laporan Keuangan</h1>
                <div className="actions">
                    <button className="btn btn-ghost" onClick={handleExportExcel}>
                        <Download size={16} /> Export Excel
                    </button>
                </div>
            </div>

            <div className="cashflow-cards" style={{ marginBottom: 24 }}>
                <div className="cashflow-card income">
                    <div className="cf-label"><TrendingUp size={16} /> Total Pemasukan</div>
                    <div className="cf-value">{formatRupiah(totalIncome)}</div>
                </div>
                <div className="cashflow-card expense">
                    <div className="cf-label"><TrendingDown size={16} /> Total Pengeluaran</div>
                    <div className="cf-value">{formatRupiah(totalExpense)}</div>
                </div>
                <div className="cashflow-card balance">
                    <div className="cf-label"><Wallet size={16} /> Saldo Bersih</div>
                    <div className="cf-value">{formatRupiah(saldo)}</div>
                </div>
            </div>

            <div className="grid-2">
                <div className="card">
                    <div className="card-header">
                        <h3>📊 Arus Kas Bulanan</h3>
                    </div>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={monthlyData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                            <XAxis dataKey="bulan" tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} />
                            <YAxis tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} tickFormatter={v => `${(v / 1000000).toFixed(1)}jt`} />
                            <Tooltip content={<CustomTooltip />} />
                            <Bar dataKey="pemasukan" name="Pemasukan" fill="#22C55E" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="pengeluaran" name="Pengeluaran" fill="#EF4444" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                <div className="card">
                    <div className="card-header">
                        <h3>🥧 Pembayaran per Kategori</h3>
                    </div>
                    {categoryData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={categoryData}
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={100}
                                    dataKey="value"
                                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                                    labelLine={{ stroke: 'var(--text-muted)' }}
                                >
                                    {categoryData.map((_, index) => (
                                        <Cell key={index} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={v => formatRupiah(v)} />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>
                            Belum ada data pembayaran
                        </div>
                    )}
                </div>
            </div>

            {/* Collection Rate Table */}
            <div className="card" style={{ marginTop: 24 }}>
                <div className="card-header">
                    <h3>📋 Rasio Penagihan per Kategori</h3>
                </div>
                <div className="table-container" style={{ border: 'none', boxShadow: 'none' }}>
                    <table>
                        <thead>
                            <tr>
                                <th>Kategori</th>
                                <th>Total Tagihan</th>
                                <th>Terbayar</th>
                                <th>Tunggakan</th>
                                <th>Rasio</th>
                            </tr>
                        </thead>
                        <tbody>
                            {categories.map(cat => {
                                const catBills = bills.filter(b => b.kategori === cat.nama)
                                const paid = catBills.filter(b => b.status === 'lunas')
                                const unpaid = catBills.filter(b => b.status === 'belum')
                                const rate = catBills.length > 0 ? ((paid.length / catBills.length) * 100).toFixed(0) : 0
                                return (
                                    <tr key={cat.id}>
                                        <td style={{ fontWeight: 500 }}>{cat.nama}</td>
                                        <td>{catBills.length} item</td>
                                        <td className="mono" style={{ color: 'var(--success-600)' }}>{formatRupiah(paid.reduce((s, b) => s + b.nominal, 0))}</td>
                                        <td className="mono" style={{ color: 'var(--danger-500)' }}>{formatRupiah(unpaid.reduce((s, b) => s + b.nominal, 0))}</td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                <div style={{ flex: 1, height: 6, background: 'var(--gray-200)', borderRadius: 3, overflow: 'hidden' }}>
                                                    <div style={{ width: `${rate}%`, height: '100%', background: Number(rate) >= 70 ? 'var(--success-500)' : Number(rate) >= 40 ? 'var(--warning-500)' : 'var(--danger-500)', borderRadius: 3, transition: 'width 0.5s' }} />
                                                </div>
                                                <span style={{ fontSize: '0.8rem', fontWeight: 600, minWidth: 35 }}>{rate}%</span>
                                            </div>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
