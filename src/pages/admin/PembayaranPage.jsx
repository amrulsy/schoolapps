import React, { useState, useRef, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import Modal from '../../components/Modal'
import { useReactToPrint } from 'react-to-print'
import { downloadFile } from '../../utils/downloadHelper'
import { Search, CreditCard, AlertCircle, MessageCircle } from 'lucide-react'

// Features
import CartSidebar from '../../features/pembayaran/CartSidebar'
import ReceiptModal from '../../features/pembayaran/ReceiptModal'

export default function PembayaranPage() {
    const [searchParams] = useSearchParams()
    const { students, units, bills, formatRupiah, processPayment, currentUser, tahunAjaran: activeTahunAjaran, tahunAjaranList } = useApp()
    const [search, setSearch] = useState('')
    const [filterKelas, setFilterKelas] = useState('')
    const [filterTA, setFilterTA] = useState(activeTahunAjaran || '')
    const [selectedStudent, setSelectedStudent] = useState(null)
    const [selectedBills, setSelectedBills] = useState([])
    const [partialPay, setPartialPay] = useState({})
    const [amountPaid, setAmountPaid] = useState('')
    const [receipt, setReceipt] = useState(null)
    const [sendWA, setSendWA] = useState(false)
    const searchRef = useRef(null)
    const amountRef = useRef(null)
    const payBtnRef = useRef(null)

    const allKelas = units.flatMap(u => u.kelas)

    // Filtered suggestions
    const suggestions = (search.length >= 2 || filterKelas)
        ? students.filter(s => {
            const matchStatus = s.status === 'aktif'
            const matchSearch = !search || (s.nama || '').toLowerCase().includes(search.toLowerCase()) || String(s.nisn || '').includes(search)
            const matchKelas = !filterKelas || s.kelas === filterKelas
            return matchStatus && matchSearch && matchKelas
        }).slice(0, 10)
        : []

    // Get unpaid bills for selected student (filtered by period for cart)
    const studentBills = selectedStudent
        ? bills.filter(b => (b.siswa_id === selectedStudent.id || b.siswaId === selectedStudent.id) && b.status === 'belum' && (b.tahun_ajaran === filterTA || b.tahunAjaran === filterTA))
        : []

    // Agrupasi by Category for Summary Table (specific period)
    const activeBillsForSummary = selectedStudent
        ? bills.filter(b => (b.siswa_id === selectedStudent.id || b.siswaId === selectedStudent.id) && (b.tahun_ajaran === filterTA || b.tahunAjaran === filterTA))
        : []

    // CROSS-PERIOD DEBT CALCULATION
    const unpaidBillsAllTime = selectedStudent
        ? bills.filter(b => (b.siswa_id === selectedStudent.id || b.siswaId === selectedStudent.id) && b.status === 'belum')
        : []
    const otherPeriodsUnpaid = unpaidBillsAllTime.filter(b => (b.tahun_ajaran || b.tahunAjaran) !== filterTA)
    const totalOtherDebt = otherPeriodsUnpaid.reduce((s, b) => s + Number(b.nominal), 0)
    const yearsWithOtherDebt = [...new Set(otherPeriodsUnpaid.map(b => b.tahun_ajaran || b.tahunAjaran))].sort()

    const categoriesMap = {}
    activeBillsForSummary.forEach(b => {
        const cat = b.kategori_nama || b.kategori
        if (!categoriesMap[cat]) categoriesMap[cat] = []
        categoriesMap[cat].push(b)
    })

    const totalSelected = studentBills
        .filter(b => selectedBills.includes(b.id))
        .reduce((s, b) => s + Number(partialPay[b.id] ?? b.nominal ?? 0), 0)

    const paidAmount = Number(amountPaid) || 0
    const change = paidAmount - totalSelected
    const canPay = selectedBills.length > 0 && paidAmount >= totalSelected

    const selectStudent = (student) => {
        setSelectedStudent(student)
        setSearch(student.nama)
        setSelectedBills([])
        setPartialPay({})
        setAmountPaid('')
    }

    const toggleBill = (bill) => {
        setSelectedBills(prev => {
            if (prev.includes(bill.id)) {
                setPartialPay(p => { const np = { ...p }; delete np[bill.id]; return np; })
                return prev.filter(x => x !== bill.id)
            } else {
                setPartialPay(p => ({ ...p, [bill.id]: Number(bill.nominal) }))
                return [...prev, bill.id]
            }
        })
    }

    const toggleAll = () => {
        if (selectedBills.length === studentBills.length) {
            setSelectedBills([])
            setPartialPay({})
        } else {
            setSelectedBills(studentBills.map(b => b.id))
            const newPartial = {}
            studentBills.forEach(b => newPartial[b.id] = Number(b.nominal))
            setPartialPay(newPartial)
        }
    }

    const handlePay = async () => {
        if (!canPay) return
        try {
            const result = await processPayment(selectedBills, paidAmount, partialPay, sendWA)
            if (result) {
                // Ensure student data is attached for the receipt
                const receiptData = {
                    ...result,
                    student: selectedStudent
                }
                setReceipt(receiptData)

                // Reset state
                setSelectedStudent(null)
                setSelectedBills([])
                setPartialPay({})
                setAmountPaid('')
                setSearch('')
                setSendWA(false)
            }
        } catch (err) {
            console.error("Payment submission error:", err)
        }
    }

    // Keyboard navigation: Tab flow
    const handleSearchKeyDown = (e) => {
        if (e.key === 'Enter' && suggestions.length > 0) {
            e.preventDefault()
            selectStudent(suggestions[0])
        }
        if (e.key === 'Escape') {
            setSearch('')
            setSelectedStudent(null)
        }
    }

    const handleAmountKeyDown = (e) => {
        if (e.key === 'Enter' && canPay) {
            e.preventDefault()
            handlePay()
        }
    }

    // Focus search on mount
    useEffect(() => {
        searchRef.current?.focus()
    }, [])

    // Auto-sync amount field with total selected (but still editable)
    useEffect(() => {
        if (totalSelected > 0) {
            setAmountPaid(totalSelected.toString())
        } else {
            setAmountPaid('')
        }
    }, [totalSelected])

    // Handle deep link from SISWA ID
    useEffect(() => {
        const sid = searchParams.get('siswaId')
        if (sid && students.length > 0) {
            const student = students.find(s => s.id === Number(sid) || s.id === sid)
            if (student) {
                selectStudent(student)
            }
        }
    }, [searchParams, students])



    return (
        <div className="fade-in">
            {/* POS Header */}
            <div className="pos-header-info mb-4">
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                    <div style={{ padding: 10, background: 'rgba(99, 102, 241, 0.1)', color: 'var(--pos-primary)', borderRadius: 12 }}>
                        <CreditCard size={24} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <h2 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0 }}>Terminal Pembayaran</h2>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                <div style={{ width: 8, height: 8, background: 'var(--pos-success)', borderRadius: '50%' }}></div>
                                {currentUser?.nama || 'Operator'}
                            </span>
                            <span>•</span>
                            <span>{new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                        </div>
                    </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Tahun Ajaran Aktif</div>
                    <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--pos-primary)' }}>{activeTahunAjaran}</div>
                </div>
            </div>

            {/* Search bar & Filters */}
            <div style={{ position: 'relative', marginBottom: 24 }}>
                <div className="filter-bar" style={{ marginBottom: 0, paddingRight: '12px' }}>
                    <div className="search-input" style={{ flex: 1 }}>
                        <Search size={18} className="search-icon" />
                        <input
                            ref={searchRef}
                            className="form-control"
                            placeholder="Cari siswa (Nama / NISN)... — tekan Enter untuk memilih"
                            value={search}
                            onChange={e => { setSearch(e.target.value); setSelectedStudent(null) }}
                            onKeyDown={handleSearchKeyDown}
                            autoFocus
                        />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <select
                            className="form-control"
                            style={{ height: '44px', borderRadius: '12px', background: 'var(--bg-card)' }}
                            value={filterKelas}
                            onChange={e => { setFilterKelas(e.target.value); setSelectedStudent(null) }}
                        >
                            <option value="">Semua Kelas</option>
                            {allKelas.map(k => (
                                <option key={k.id} value={k.nama}>{k.nama}</option>
                            ))}
                        </select>
                    </div>
                </div>
                {suggestions.length > 0 && !selectedStudent && (
                    <div style={{
                        position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50,
                        background: 'var(--bg-card)', border: '1px solid var(--border-color)',
                        borderRadius: '0 0 var(--radius-lg) var(--radius-lg)',
                        boxShadow: 'var(--shadow-lg)',
                    }}>
                        {suggestions.map((s, i) => (
                            <div key={s.id}
                                style={{
                                    padding: '12px 20px', cursor: 'pointer',
                                    borderBottom: i < suggestions.length - 1 ? '1px solid var(--border-color)' : 'none',
                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                }}
                                onClick={() => selectStudent(s)}
                                tabIndex={0}
                                onKeyDown={e => e.key === 'Enter' && selectStudent(s)}
                            >
                                <div>
                                    <strong>{s.nama}</strong>
                                    <span style={{ color: 'var(--text-secondary)', marginLeft: 8, fontSize: '0.8rem' }}>
                                        NISN: {s.nisn}
                                    </span>
                                </div>
                                <span className="badge badge-info">{s.kelas}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* POS Layout */}
            {selectedStudent ? (
                <div className="responsive-split">
                    {/* Left: Student Info & Summary */}
                    <div style={{ minWidth: 0 }}>
                        <div className="card" style={{ marginBottom: 16, border: '1px solid var(--pos-border)', borderRadius: '24px', padding: '24px', position: 'relative', overflow: 'hidden' }}>
                            {/* Decorative Background */}
                            <div style={{ position: 'absolute', top: -40, right: -40, width: 140, height: 140, background: 'rgba(99, 102, 241, 0.05)', borderRadius: '50%', zIndex: 0 }}></div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: 24, position: 'relative', zIndex: 1 }}>
                                {/* Student Initial Avatar */}
                                <div style={{
                                    width: 72, height: 72, borderRadius: 22,
                                    background: 'linear-gradient(135deg, var(--pos-primary), #4f46e5)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    color: '#fff', fontWeight: 800, fontSize: '1.6rem',
                                    boxShadow: '0 8px 24px rgba(79, 70, 229, 0.25)'
                                }}>
                                    {(selectedStudent.nama || 'S').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                                </div>

                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                        <h2 style={{ fontSize: '1.6rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                                            {selectedStudent.nama || 'Tanpa Nama'}
                                        </h2>
                                        <span className="status-pill" style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--pos-success)', fontSize: '0.75rem', border: '1px solid rgba(16, 185, 129, 0.15)' }}>
                                            STUDENT • AKTIF
                                        </span>
                                    </div>
                                    <div style={{ display: 'flex', gap: 20, color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--pos-primary)' }}></div>
                                            NISN: <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{selectedStudent.nisn}</span>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#8b5cf6' }}></div>
                                            KELAS: <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{selectedStudent.kelas}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Redesigned Cross-period Debt Notice */}
                            {totalOtherDebt > 0 && (
                                <div style={{
                                    marginTop: 20, padding: '16px 20px',
                                    background: 'rgba(239, 68, 68, 0.04)',
                                    borderRadius: '20px', border: '1px solid rgba(239, 68, 68, 0.12)',
                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                    backdropFilter: 'blur(10px)',
                                    position: 'relative', zIndex: 1,
                                    flexWrap: 'wrap', gap: 12
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                                        <div style={{
                                            width: 44, height: 44, borderRadius: '14px', background: 'rgba(239, 68, 68, 0.1)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--pos-danger)'
                                        }}>
                                            <AlertCircle size={22} />
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--pos-danger)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 2 }}>
                                                Tunggakan Periode Lain
                                            </div>
                                            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                                                {formatRupiah(totalOtherDebt)}
                                            </div>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: 10 }}>
                                        {yearsWithOtherDebt.map(yr => (
                                            <button
                                                key={yr}
                                                onClick={() => setFilterTA(yr)}
                                                className="btn-pill"
                                                style={{
                                                    fontSize: '0.8rem', padding: '8px 16px', background: 'white',
                                                    color: 'var(--pos-danger)', border: '1px solid rgba(239, 68, 68, 0.2)',
                                                    borderRadius: '12px', cursor: 'pointer', fontWeight: 700,
                                                    boxShadow: '0 4px 12px rgba(239, 68, 68, 0.08)',
                                                    transition: 'all 0.2s ease',
                                                    display: 'flex', alignItems: 'center', gap: 6
                                                }}
                                            >
                                                Bayar TA {yr}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="responsive-grid-3" style={{ position: 'relative', zIndex: 1, marginBottom: 16 }}>
                            <div style={{ padding: '12px', background: 'var(--pos-bg-soft)', borderRadius: 12, border: '1px solid var(--pos-border)' }}>
                                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>Kelas</div>
                                <div style={{ fontWeight: 800 }}>{selectedStudent.kelas}</div>
                            </div>
                            <div style={{ padding: '12px', background: 'var(--pos-bg-soft)', borderRadius: 12, border: '1px solid var(--pos-border)' }}>
                                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>Wali Kelas</div>
                                <div style={{ fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{selectedStudent.wali || '-'}</div>
                            </div>
                            <div style={{ padding: '12px', background: 'rgba(239, 68, 68, 0.05)', borderRadius: 12, border: '1px solid rgba(239, 68, 68, 0.1)' }}>
                                <div style={{ fontSize: '0.7rem', color: 'var(--pos-danger)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>Tunggakan</div>
                                <div style={{ fontWeight: 800, color: 'var(--pos-danger)' }}>{formatRupiah(studentBills.reduce((s, b) => s + Number(b.nominal), 0))}</div>
                            </div>
                        </div>

                        {/* Billing Summary Table */}
                        <div className="card" style={{ padding: '16px 20px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                                <h4 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.9rem' }}>
                                    <CreditCard size={18} /> Rincian Tagihan
                                </h4>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Periode:</span>
                                    <select
                                        className="form-control"
                                        style={{ width: 'auto', height: '32px', fontSize: '0.8rem', padding: '0 12px', borderRadius: '8px' }}
                                        value={filterTA}
                                        onChange={e => setFilterTA(e.target.value)}
                                    >
                                        {(tahunAjaranList || []).map(t => (
                                            <option key={t.id} value={t.tahun}>{t.tahun}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div style={{ maxHeight: '400px', overflowY: 'auto', overflowX: 'auto', margin: '0 -20px' }}>
                                <table className="compact-table" style={{ width: '100%', fontSize: '0.8rem' }}>
                                    <thead>
                                        <tr style={{ background: 'var(--gray-50)', position: 'sticky', top: 0 }}>
                                            <th style={{ padding: '8px 20px', textAlign: 'left' }}>Item / Bulan</th>
                                            <th style={{ padding: '8px 20px', textAlign: 'right' }}>Nominal</th>
                                            <th style={{ padding: '8px 20px', textAlign: 'center' }}>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {Object.keys(categoriesMap).map(kategori => (
                                            <React.Fragment key={kategori}>
                                                <tr style={{ background: 'var(--gray-50)' }}>
                                                    <td colSpan="3" style={{ padding: '4px 20px', fontWeight: 700, fontSize: '0.75rem', color: 'var(--primary-600)' }}>
                                                        {kategori.toUpperCase()}
                                                    </td>
                                                </tr>
                                                {categoriesMap[kategori].map(b => (
                                                    <tr key={b.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                                        <td style={{ padding: '8px 20px' }}>
                                                            {b.bulan} {b.tahun}
                                                            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                                                                Kelas: {b.kelas_nama || '-'} | ({b.tahun_ajaran || b.tahunAjaran || '-'})
                                                            </div>
                                                        </td>
                                                        <td style={{ padding: '8px 20px', textAlign: 'right' }} className="mono">
                                                            {formatRupiah(b.nominal)}
                                                        </td>
                                                        <td style={{ padding: '8px 20px', textAlign: 'center' }}>
                                                            <span style={{
                                                                color: b.status === 'lunas' ? 'var(--success-600)' : 'var(--danger-600)',
                                                                fontWeight: 600,
                                                                fontSize: '0.7rem'
                                                            }}>
                                                                {b.status.toUpperCase()}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </React.Fragment>
                                        ))}
                                        {Object.keys(categoriesMap).length === 0 && (
                                            <tr>
                                                <td colSpan="3" style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                                                    Belum ada tagihan untuk tahun ajaran ini.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    {/* Right: Cart Side */}
                    <div>
                        <CartSidebar
                            studentBills={studentBills}
                            selectedBills={selectedBills}
                            toggleBill={toggleBill}
                            toggleAll={toggleAll}
                            partialPay={partialPay}
                            setPartialPay={setPartialPay}
                            formatRupiah={formatRupiah}
                            totalSelected={totalSelected}
                            amountPaid={amountPaid}
                            setAmountPaid={setAmountPaid}
                            handleAmountKeyDown={handleAmountKeyDown}
                            change={change}
                            canPay={canPay}
                            handlePay={handlePay}
                            amountRef={amountRef}
                            payBtnRef={payBtnRef}
                        />

                        {/* WhatsApp Notification Toggle */}
                        {selectedBills.length > 0 && (
                            <div style={{
                                marginTop: 12, padding: '14px 20px',
                                background: sendWA ? 'rgba(37, 211, 102, 0.08)' : 'var(--bg-card)',
                                borderRadius: 16, border: `1.5px solid ${sendWA ? 'rgba(37, 211, 102, 0.3)' : 'var(--border-color)'}`,
                                display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer',
                                transition: 'all 0.2s ease'
                            }}
                            onClick={() => setSendWA(!sendWA)}
                            >
                                <div style={{
                                    width: 40, height: 40, borderRadius: 12,
                                    background: sendWA ? 'rgba(37, 211, 102, 0.15)' : 'var(--bg-stripe)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    color: sendWA ? '#25D366' : 'var(--text-muted)',
                                    transition: 'all 0.2s'
                                }}>
                                    <MessageCircle size={20} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: 700, fontSize: '0.85rem', color: sendWA ? '#25D366' : 'var(--text-primary)' }}>
                                        Kirim Nota via WhatsApp
                                    </div>
                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                        Kirim ke nomor siswa & orang tua
                                    </div>
                                </div>
                                <div style={{
                                    width: 44, height: 24, borderRadius: 12,
                                    background: sendWA ? '#25D366' : 'var(--border-color)',
                                    position: 'relative', transition: 'background 0.2s'
                                }}>
                                    <div style={{
                                        width: 20, height: 20, borderRadius: '50%',
                                        background: '#fff', position: 'absolute', top: 2,
                                        left: sendWA ? 22 : 2,
                                        transition: 'left 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.15)'
                                    }} />
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <div style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    padding: '80px 20px', background: 'var(--bg-card)', borderRadius: 32,
                    border: '1px solid var(--pos-border)', marginTop: 40, textAlign: 'center'
                }}>
                    <div style={{
                        width: 120, height: 120, background: 'var(--pos-bg-soft)', borderRadius: '50%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24,
                        color: 'var(--pos-primary)', opacity: 0.8
                    }}>
                        <CreditCard size={56} />
                    </div>
                    <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>Input Siswa</h3>
                    <p style={{ maxWidth: 460, margin: '12px auto 0', fontSize: '0.95rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                        Ketik nama atau NISN siswa untuk menarik data tagihan secara otomatis. Sistem akan menampilkan rincian tunggakan yang belum lunas.
                    </p>
                </div>
            )}

            {/* Receipt Modal */}
            {receipt && (
                <ReceiptModal receipt={receipt} formatRupiah={formatRupiah} onClose={() => setReceipt(null)} />
            )}
        </div>
    )
}
