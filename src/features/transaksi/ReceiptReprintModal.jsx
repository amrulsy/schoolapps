import { useState, useRef } from 'react'
import Modal from '../../components/Modal'
import { useReactToPrint } from 'react-to-print'
import { downloadFile } from '../../utils/downloadHelper'
import { Printer, FileDown, Bluetooth } from 'lucide-react'
import { EscPosEncoder } from '../../utils/escPosHelper'

export default function ReceiptReprintModal({ receipt, formatRupiah, onClose }) {
    const [loadingPdf, setLoadingPdf] = useState(false)
    const [loadingBT, setLoadingBT] = useState(false)
    const [paperSize, setPaperSize] = useState('80mm') // 58mm, 80mm, A4
    const receiptRef = useRef(null)

    // Ukuran dalam pixel (estimasi 96dpi) atau CSS width
    const paperWidths = {
        '58mm': '200px',
        '80mm': '280px',
        'A4': '100%',
    }

    const paperMaxW = {
        '58mm': '200px',
        '80mm': '280px',
        'A4': '700px',
    }

    // react-to-print: mencetak HANYA area struk nota
    const handlePrint = useReactToPrint({
        contentRef: receiptRef,
        documentTitle: `Struk - ${receipt.invoiceNo}`,
        pageStyle: `
            @media print {
                @page { size: ${paperSize === 'A4' ? 'A4' : 'auto'}; margin: 0; }
                body { margin: 0; padding: ${paperSize === 'A4' ? '20mm' : '8px'}; font-family: 'Courier New', monospace; background: #fff; }
                .receipt { 
                    width: ${paperSize === 'A4' ? '100%' : paperWidths[paperSize]}; 
                    max-width: ${paperMaxW[paperSize]};
                    margin: 0 auto; 
                    position: relative; 
                }
                .receipt-header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 8px; margin-bottom: 8px; }
                .receipt-header h3 { margin: 0; font-size: 16px; }
                .receipt-header p { margin: 2px 0; font-size: 10px; }
                .receipt-info { font-size: 11px; margin-bottom: 8px; }
                .receipt-items .item { display: flex; justify-content: space-between; font-size: 11px; padding: 2px 0; border-bottom: 1px dotted #ccc; }
                .receipt-total { display: flex; justify-content: space-between; font-weight: bold; border-top: 2px solid #000; margin-top: 4px; padding-top: 4px; font-size: 13px; }
                .receipt-footer { text-align: center; margin-top: 12px; font-size: 10px; color: #555; border-top: 1px dashed #000; padding-top: 8px; }
                .void-overlay { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-20deg); border: 4px solid red; color: red; font-size: 28px; font-weight: 900; padding: 6px 20px; border-radius: 8px; opacity: 0.4; white-space: nowrap; }
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

            let pdfW = 80
            let pdfFormat = 'portrait'
            let pdfSize = [80, 150]

            if (paperSize === '58mm') {
                pdfW = 58
                pdfSize = [58, (canvas.height * 58) / canvas.width]
            } else if (paperSize === '80mm') {
                pdfW = 80
                pdfSize = [80, (canvas.height * 80) / canvas.width]
            } else {
                // A4
                pdfW = 210
                pdfSize = 'a4'
            }

            const pdf = new jsPDF({
                unit: 'mm',
                format: pdfSize,
                orientation: pdfFormat
            })

            const finalW = pdfW - (paperSize === 'A4' ? 40 : 0) // Margin 20mm kiri kanan untuk A4
            const finalH = (canvas.height * finalW) / canvas.width
            const xPos = paperSize === 'A4' ? 20 : 0
            const yPos = paperSize === 'A4' ? 20 : 0

            pdf.addImage(imgData, 'PNG', xPos, yPos, finalW, finalH)
            const blob = pdf.output('blob')
            await downloadFile(blob, `${receipt.invoiceNo}.pdf`)
        } catch (err) {
            console.error('PDF error:', err)
        } finally {
            setLoadingPdf(false)
        }
    }

    const handleBluetoothPrint = async () => {
        setLoadingBT(true)
        try {
            const encoder = new EscPosEncoder()
            const bytes = encoder
                .initialize()
                .align(1) // Center
                .line("--------------------------------")
                .bold(true).line("SMK PPRQ")
                .bold(false).line("Jl. Pesantren No.1, Kota")
                .line("Telp: (021) 123-4567")
                .line("--------------------------------")
                .align(0) // Left
                .line(`Nota: ${receipt.invoiceNo}`)
                .line(`Tgl : ${new Date(receipt.tanggal).toLocaleDateString('id-ID')}`)
                .line(`Siswa: ${receipt.student?.nama || '-'}`)
                .line(`NISN: ${receipt.student?.nisn || '-'}`)
                .line("--------------------------------")
                .line("Item             | Total")
                .line("--------------------------------")

                ; (receipt.items || []).forEach(item => {
                    const name = (item.kategori || 'Tagihan').slice(0, 16).padEnd(16)
                    const nominal = formatRupiah(item.nominal).replace(/\s/g, '')
                    encoder.line(`${name} ${nominal.padStart(15)}`)
                })

            encoder
                .line("--------------------------------")
                .align(2) // Right
                .bold(true).line(`TOTAL: ${formatRupiah(receipt.total)}`)
                .bold(false).line(`Bayar: ${formatRupiah(receipt.amountPaid)}`)
                .line(`Kembali: ${formatRupiah(receipt.change)}`)
                .feed(2)
                .align(1)
                .line("Terima kasih atas")
                .line("pembayarannya!")
                .feed(4)

            const data = encoder.encode()

            const device = await navigator.bluetooth.requestDevice({
                filters: [
                    { services: ['000018f0-0000-1000-8000-00805f9b34fb'] },
                    { namePrefix: 'Printer' }, { namePrefix: 'RPP' }, { namePrefix: 'MP' }, { namePrefix: 'MTP' }
                ],
                optionalServices: ['0000ff00-0000-1000-8000-00805f9b34fb', '49535343-fe7d-4ae5-8fa9-9fafd205e455']
            })

            const server = await device.gatt.connect()
            const service = (await server.getPrimaryServices())[0]
            const characteristics = await service.getCharacteristics()
            const writer = characteristics.find(c => c.properties.write || c.properties.writeWithoutResponse)

            if (!writer) throw new Error("Could not find write characteristic")

            const chunkSize = 20
            for (let i = 0; i < data.length; i += chunkSize) {
                await writer.writeValue(data.slice(i, i + chunkSize))
            }

            await server.disconnect()
        } catch (err) {
            console.error('Bluetooth Print error:', err)
            if (err.name !== 'NotFoundError' && err.name !== 'AbortError') {
                import('sweetalert2').then(Swal => Swal.default.fire('Error', 'Gagal menghubungkan ke printer Bluetooth.', 'error'))
            }
        } finally {
            setLoadingBT(false)
        }
    }

    return (
        <Modal title="🧾 Nota Pembayaran" onClose={onClose} footer={
            <>
                <div style={{ marginRight: 'auto', display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Ukuran:</span>
                    <select
                        className="form-control"
                        style={{ width: 'auto', padding: '2px 8px', height: '32px', fontSize: '0.85rem' }}
                        value={paperSize}
                        onChange={(e) => setPaperSize(e.target.value)}
                    >
                        <option value="58mm">58mm (Thermal)</option>
                        <option value="80mm">80mm (Thermal)</option>
                        <option value="A4">A4 (Standard)</option>
                    </select>
                </div>
                <button className="btn btn-ghost" onClick={handlePrint} type="button">
                    <Printer size={16} /> Cetak
                </button>
                <button className="btn btn-primary" onClick={handleDownloadPdf} disabled={loadingPdf} type="button">
                    <FileDown size={16} /> {loadingPdf ? '...' : 'PDF'}
                </button>
                <button className="btn btn-outline" onClick={handleBluetoothPrint} disabled={loadingBT} type="button" style={{ border: '1.5px solid var(--primary-500)', color: 'var(--primary-600)' }}>
                    <Bluetooth size={16} /> {loadingBT ? '...' : 'Bluetooth'}
                </button>
            </>
        }>
            {/* Area target react-to-print — hanya bagian ini yang tercetak */}
            <div
                ref={receiptRef}
                className="receipt"
                style={{
                    position: 'relative',
                    background: '#fff',
                    color: '#000',
                    width: paperWidths[paperSize],
                    maxWidth: paperMaxW[paperSize],
                    margin: '0 auto',
                    padding: paperSize === 'A4' ? '40px' : '10px',
                    boxShadow: '0 0 10px rgba(0,0,0,0.1)',
                    fontFamily: "'Courier New', monospace"
                }}
            >
                {receipt.status === 'voided' && (
                    <div className="void-overlay" style={{
                        position: 'absolute', top: '50%', left: '50%',
                        transform: 'translate(-50%, -50%) rotate(-20deg)',
                        border: '4px solid red', color: 'red', fontSize: '28px',
                        fontWeight: 900, padding: '6px 20px', borderRadius: 8,
                        opacity: 0.4, pointerEvents: 'none', whiteSpace: 'nowrap', zIndex: 10
                    }}>
                        VOID / DIBATALKAN
                    </div>
                )}

                <div className="receipt-header">
                    <h3>SMK PPRQ</h3>
                    <p>Jl. Pesantren No.1, Kota</p>
                    <p>Telp: (021) 123-4567</p>
                </div>

                <div className="receipt-info">
                    <div><span>No. Nota</span>: {receipt.invoiceNo}</div>
                    <div><span>Tanggal</span>: {new Date(receipt.tanggal).toLocaleString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
                    <div><span>Kasir</span>: {receipt.kasir}</div>
                </div>

                <div className="receipt-info" style={{ borderTop: '1px dashed #ccc', paddingTop: 8 }}>
                    <div><span>Siswa</span>: {receipt.student?.nama}</div>
                    <div><span>NISN</span>: {receipt.student?.nisn}</div>
                    <div><span>Kelas</span>: {receipt.student?.kelas}</div>
                </div>

                <div className="receipt-items">
                    {receipt.items.map(item => (
                        <div key={item.id} className="item">
                            <span>{item.kategori} ({item.kelas_nama || '-'}) {item.bulan}'{item.tahun.toString().slice(-2)} ({item.tahun_ajaran || item.tahunAjaran})</span>
                            <span>{formatRupiah(item.nominal)}</span>
                        </div>
                    ))}
                </div>

                <div className="receipt-total">
                    <span>TOTAL</span>
                    <span>{formatRupiah(receipt.total)}</span>
                </div>
                <div className="item" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#555' }}>
                    <span>Uang Diterima</span>
                    <span>{formatRupiah(receipt.amountPaid)}</span>
                </div>
                <div className="item" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#555' }}>
                    <span>Kembalian</span>
                    <span>{formatRupiah(receipt.change)}</span>
                </div>

                <div className="receipt-footer">
                    <p>Metode: Tunai</p>
                    <p style={{ marginTop: 8 }}>
                        {receipt.status === 'voided' ? '⚠️ Nota ini TELAH DIBATALKAN' : 'Terima kasih atas pembayarannya 🙏'}
                    </p>
                </div>
            </div>
        </Modal>
    )
}
