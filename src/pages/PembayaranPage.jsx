import { useState, useRef, useEffect, useCallback } from 'react'
import { useApp } from '../context/AppContext'
import Modal from '../components/Modal'
import { useReactToPrint } from 'react-to-print'
import { downloadFile } from '../utils/downloadHelper'
import { Search, CreditCard } from 'lucide-react'

// Features
import CartSidebar from '../features/pembayaran/CartSidebar'
import ReceiptModal from '../features/pembayaran/ReceiptModal'

export default function PembayaranPage() {
    const { students, bills, formatRupiah, processPayment, currentUser } = useApp()
    const [search, setSearch] = useState('')
    const [selectedStudent, setSelectedStudent] = useState(null)
    const [selectedBills, setSelectedBills] = useState([])
    const [partialPay, setPartialPay] = useState({})
    const [amountPaid, setAmountPaid] = useState('')
    const [receipt, setReceipt] = useState(null)
    const searchRef = useRef(null)
    const amountRef = useRef(null)
    const payBtnRef = useRef(null)

    // Filtered suggestions
    const suggestions = search.length >= 2
        ? students.filter(s => s.status === 'aktif' && (s.nama.toLowerCase().includes(search.toLowerCase()) || s.nisn.includes(search))).slice(0, 5)
        : []

    // Get unpaid bills for selected student
    const studentBills = selectedStudent
        ? bills.filter(b => b.siswaId === selectedStudent.id && b.status === 'belum')
        : []

    const totalSelected = studentBills
        .filter(b => selectedBills.includes(b.id))
        .reduce((s, b) => s + (partialPay[b.id] || b.nominal), 0)

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
                setPartialPay(p => ({ ...p, [bill.id]: bill.nominal }))
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
            studentBills.forEach(b => newPartial[b.id] = b.nominal)
            setPartialPay(newPartial)
        }
    }

    const handlePay = () => {
        if (!canPay) return
        const result = processPayment(selectedBills, paidAmount, partialPay)
        if (result) {
            result.student = selectedStudent
            setReceipt(result)
            setSelectedStudent(null)
            setSelectedBills([])
            setPartialPay({})
            setAmountPaid('')
            setSearch('')
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

    // Auto-focus amount input when bills are selected
    useEffect(() => {
        if (selectedBills.length > 0 && amountRef.current) {
            amountRef.current.focus()
        }
    }, [selectedBills.length])

    return (
        <div className="fade-in">
            <div className="page-header">
                <h1>💳 Proses Pembayaran</h1>
            </div>

            {/* Search bar */}
            <div style={{ position: 'relative', marginBottom: 24 }}>
                <div className="filter-bar" style={{ marginBottom: 0 }}>
                    <div className="search-input" style={{ flex: 1 }}>
                        <Search size={16} className="search-icon" />
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
                <div className="pos-layout">
                    {/* Left: Student Info */}
                    <div className="pos-student">
                        <div className="card" style={{ marginBottom: 16 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
                                <div style={{
                                    width: 56, height: 56, borderRadius: '50%',
                                    background: 'linear-gradient(135deg, var(--primary-500), var(--secondary-500))',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    color: '#fff', fontWeight: 700, fontSize: '1.2rem',
                                }}>
                                    {selectedStudent.nama.charAt(0)}
                                </div>
                                <div>
                                    <h2 style={{ marginBottom: 2 }}>{selectedStudent.nama}</h2>
                                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                                        NISN: <span className="mono">{selectedStudent.nisn}</span>
                                    </p>
                                </div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 24px', fontSize: '0.85rem' }}>
                                <div><span style={{ color: 'var(--text-secondary)' }}>Kelas:</span> <strong>{selectedStudent.kelas}</strong></div>
                                <div><span style={{ color: 'var(--text-secondary)' }}>Wali:</span> <strong>{selectedStudent.wali || '-'}</strong></div>
                                <div><span style={{ color: 'var(--text-secondary)' }}>Telp:</span> <strong className="mono">{selectedStudent.telp || '-'}</strong></div>
                                <div><span style={{ color: 'var(--text-secondary)' }}>Status:</span> <span className="badge badge-success">Aktif</span></div>
                            </div>
                            <div style={{ marginTop: 16, padding: '12px 16px', background: 'var(--danger-50)', borderRadius: 'var(--radius-md)' }}>
                                <span style={{ color: 'var(--danger-600)', fontWeight: 600, fontSize: '0.85rem' }}>
                                    Total Tunggakan: <span className="mono">{formatRupiah(studentBills.reduce((s, b) => s + b.nominal, 0))}</span> ({studentBills.length} item)
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Right: Cart */}
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
                </div>
            ) : (
                <div className="card" style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>
                    <CreditCard size={48} style={{ marginBottom: 16, opacity: 0.3 }} />
                    <h3 style={{ color: 'var(--text-secondary)' }}>Cari Siswa untuk Memulai</h3>
                    <p style={{ maxWidth: 400, margin: '8px auto 0', fontSize: '0.85rem' }}>
                        Ketik nama atau NISN siswa pada kolom pencarian di atas untuk menampilkan tagihan yang belum lunas.
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
