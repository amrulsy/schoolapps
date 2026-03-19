import { useState, useRef } from 'react'
import Modal from '../../components/Modal'
import { useReactToPrint } from 'react-to-print'
import { downloadFile } from '../../utils/downloadHelper'
import { Printer, FileDown } from 'lucide-react'

export default function ReceiptModal({ receipt, formatRupiah, onClose }) {
    const [loadingPdf, setLoadingPdf] = useState(false)
    const receiptRef = useRef(null)

    // react-to-print: hanya mencetak area .receipt, sembunyikan elemen no-print
    const handlePrint = useReactToPrint({
        contentRef: receiptRef,
        documentTitle: `Nota - ${receipt.invoiceNo}`,
        pageStyle: `
            @media print {
                body { margin: 0; padding: 16px; font-family: 'Courier New', monospace; }
                .receipt { width: 280px; margin: 0 auto; }
                .receipt-header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 8px; margin-bottom: 8px; }
                .receipt-info { font-size: 11px; margin-bottom: 8px; }
                .receipt-items .item { display: flex; justify-content: space-between; font-size: 11px; padding: 2px 0; }
                .receipt-total { display: flex; justify-content: space-between; font-weight: bold; border-top: 2px solid #000; padding-top: 4px; font-size: 13px; }
                .receipt-footer { text-align: center; margin-top: 12px; font-size: 10px; color: #555; border-top: 1px dashed #000; padding-top: 8px; }
            }
        `,
    })

    const handleDownloadPdf = async () => {
        const el = receiptRef.current
        if (!el) return
        setLoadingPdf(true)
        try {
            const { default: html2canvas } = await import('html2canvas')
            const { jsPDF } = await import('jspdf')
            const canvas = await html2canvas(el, { scale: 2, useCORS: true, backgroundColor: '#ffffff' })
            const imgData = canvas.toDataURL('image/png')
            const pdfW = 80
            const pdfH = (canvas.height * pdfW) / canvas.width
            const pdf = new jsPDF({ unit: 'mm', format: [pdfW, pdfH], orientation: 'portrait' })
            pdf.addImage(imgData, 'PNG', 0, 0, pdfW, pdfH)
            const blob = pdf.output('blob')
            await downloadFile(blob, `${receipt.invoiceNo}.pdf`)
        } catch (err) {
            console.error('PDF error:', err)
        } finally {
            setLoadingPdf(false)
        }
    }

    return (
        <Modal title="🧾 Nota Pembayaran" onClose={onClose} footer={
            <>
                <button className="btn btn-ghost" onClick={handlePrint} type="button">
                    <Printer size={16} /> Cetak Nota
                </button>
                <button className="btn btn-primary" onClick={handleDownloadPdf} disabled={loadingPdf} type="button">
                    <FileDown size={16} /> {loadingPdf ? 'Memproses...' : 'Download PDF'}
                </button>
            </>
        }>
            {/* Area yang akan dicetak oleh react-to-print */}
            <div ref={receiptRef} className="receipt" style={{ background: '#fff', color: '#000' }}>
                <div className="receipt-header">
                    <h3>SMK PPRQ</h3>
                    <p>Jl. Pesantren No.1, Kota</p>
                    <p>Telp: (021) 123-4567</p>
                </div>

                <div className="receipt-info">
                    <div><span>No. Nota</span>: {receipt.invoiceNo}</div>
                    <div><span>Tanggal</span>: {receipt.tanggal ? new Date(receipt.tanggal).toLocaleString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-'}</div>
                    <div><span>Kasir</span>: {receipt.kasir}</div>
                </div>

                <div className="receipt-info" style={{ borderTop: '1px dashed #ccc', paddingTop: 8 }}>
                    <div><span>Siswa</span>: {receipt?.student?.nama || '-'}</div>
                    <div><span>NISN</span>: {receipt?.student?.nisn || '-'}</div>
                    <div><span>Kelas</span>: {receipt?.student?.kelas || '-'}</div>
                </div>

                <div className="receipt-items">
                    {(receipt?.items || []).map(item => (
                        <div key={item.id} className="item">
                            <span>{item.kategori_nama || item.kategori || 'Tagihan'} ({item.kelas_nama || '-'}) {item.bulan}'{(item.tahun || '').toString().slice(-2)} ({item.tahun_ajaran || item.tahunAjaran || '-'})</span>
                            <span>{formatRupiah(Number(item.nominal || 0))}</span>
                        </div>
                    ))}
                </div>

                <div className="receipt-total">
                    <span>TOTAL</span>
                    <span>{formatRupiah(Number(receipt?.total || 0))}</span>
                </div>
                <div className="item" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#666' }}>
                    <span>Uang Diterima</span>
                    <span>{formatRupiah(Number(receipt?.amountPaid || 0))}</span>
                </div>
                <div className="item" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#666' }}>
                    <span>Kembalian</span>
                    <span>{formatRupiah(Number(receipt?.change || 0))}</span>
                </div>

                <div className="receipt-footer">
                    <p>Metode: Tunai</p>
                    <p style={{ marginTop: 8 }}>Terima kasih atas pembayarannya 🙏</p>
                </div>
            </div>
        </Modal>
    )
}
