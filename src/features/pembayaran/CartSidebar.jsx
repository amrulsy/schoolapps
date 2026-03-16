import { ShoppingCart, CreditCard } from 'lucide-react'

export default function CartSidebar({
    studentBills,
    selectedBills,
    toggleBill,
    toggleAll,
    partialPay,
    setPartialPay,
    formatRupiah,
    totalSelected,
    amountPaid,
    setAmountPaid,
    handleAmountKeyDown,
    change,
    canPay,
    handlePay,
    amountRef,
    payBtnRef
}) {
    const paidAmount = Number(amountPaid) || 0

    return (
        <div className="pos-cart">
            <div className="pos-cart-header">
                <ShoppingCart size={18} style={{ verticalAlign: 'middle', marginRight: 8 }} />
                Keranjang Bayar
            </div>

            <div className="pos-cart-items">
                {studentBills.length === 0 ? (
                    <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
                        ✅ Tidak ada tunggakan
                    </div>
                ) : (
                    studentBills.map(bill => (
                        <div
                            key={bill.id}
                            className={`pos-cart-item ${selectedBills.includes(bill.id) ? 'selected' : ''}`}
                            onClick={() => toggleBill(bill)}
                            tabIndex={0}
                            role="checkbox"
                            aria-checked={selectedBills.includes(bill.id)}
                            onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleBill(bill) } }}
                        >
                            <input
                                type="checkbox"
                                checked={selectedBills.includes(bill.id)}
                                onChange={() => toggleBill(bill)}
                                style={{ accentColor: 'var(--primary-600)' }}
                                tabIndex={-1}
                            />
                            <div className="item-info">
                                <div className="item-name">{bill.kategori}</div>
                                <div className="item-period">{bill.bulan}'{bill.tahun.toString().slice(-2)} ({bill.tahunAjaran})</div>
                            </div>
                            <div className="item-amount" onClick={e => e.stopPropagation()}>
                                {selectedBills.includes(bill.id) ? (
                                    <input
                                        type="number"
                                        className="form-control mono"
                                        style={{ width: 110, padding: '4px 8px', height: 28, fontSize: '0.85rem', textAlign: 'right' }}
                                        value={partialPay[bill.id] || ''}
                                        onChange={e => {
                                            const val = Number(e.target.value)
                                            setPartialPay(p => ({ ...p, [bill.id]: val }))
                                        }}
                                        title="Edit nominal cicilan"
                                    />
                                ) : (
                                    formatRupiah(bill.nominal)
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {studentBills.length > 0 && (
                <div style={{ padding: '8px 20px', borderTop: '1px solid var(--border-color)' }}>
                    <label className="checkbox-wrapper" style={{ fontSize: '0.8rem' }}>
                        <input type="checkbox" checked={selectedBills.length === studentBills.length && studentBills.length > 0} onChange={toggleAll} />
                        <span>Pilih Semua</span>
                    </label>
                </div>
            )}

            <div className="pos-cart-footer">
                <div className="pos-total-row">
                    <span className="label">Total</span>
                    <span className="amount">{formatRupiah(totalSelected)}</span>
                </div>

                <div className="form-group" style={{ marginBottom: 12 }}>
                    <label style={{ fontSize: '0.8rem' }}>Uang Diterima</label>
                    <input
                        ref={amountRef}
                        type="number"
                        className="form-control mono"
                        placeholder="Masukkan nominal..."
                        value={amountPaid}
                        onChange={e => setAmountPaid(e.target.value)}
                        onKeyDown={handleAmountKeyDown}
                        style={{ fontSize: '1.1rem', fontWeight: 600 }}
                    />
                </div>

                {paidAmount > 0 && (
                    <div className="pos-total-row" style={{ marginBottom: 16 }}>
                        <span className="label">Kembalian</span>
                        <span className="amount" style={{ color: change >= 0 ? 'var(--success-600)' : 'var(--danger-500)' }}>
                            {change >= 0 ? formatRupiah(change) : `Kurang ${formatRupiah(Math.abs(change))}`}
                            {change >= 0 && ' ✅'}
                        </span>
                    </div>
                )}

                <button
                    ref={payBtnRef}
                    className="pos-pay-btn"
                    onClick={handlePay}
                    disabled={!canPay}
                >
                    <CreditCard size={20} />
                    BAYAR SEKARANG
                </button>
                <p style={{ textAlign: 'center', marginTop: 8, fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    Tekan <kbd style={{ padding: '1px 6px', background: 'var(--gray-100)', borderRadius: 4, border: '1px solid var(--border-color)' }}>Enter</kbd> untuk memproses
                </p>
            </div>
        </div>
    )
}
