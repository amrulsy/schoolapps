import { useState, useRef } from 'react'
import Modal from '../../components/Modal'
import { useReactToPrint } from 'react-to-print'
import { downloadFile } from '../../utils/downloadHelper'
import { Printer, FileDown, MessageCircle, Bluetooth } from 'lucide-react'
import { EscPosEncoder } from '../../utils/escPosHelper'

export default function ReceiptModal({ receipt, formatRupiah, onClose }) {
    const [loadingPdf, setLoadingPdf] = useState(false)
    const [loadingWA, setLoadingWA] = useState(false)
    const [loadingBT, setLoadingBT] = useState(false)
    const receiptRef = useRef(null)

    // react-to-print: thermal receipt optimized - no margins/whitespace
    const handlePrint = useReactToPrint({
        contentRef: receiptRef,
        documentTitle: `Nota - ${receipt.invoiceNo}`,
        pageStyle: `
            @page { margin: 0; padding: 0; size: 80mm auto; }
            * { box-sizing: border-box; }
            html, body { margin: 0; padding: 0; width: 80mm; background: #fff; }
            body { font-family: 'Courier New', monospace; font-size: 11px; color: #000; }
            .receipt { width: 100%; max-width: 80mm; margin: 0; padding: 4mm; border: none; border-radius: 0; background: #fff; box-shadow: none; }
            .receipt * { color: #000; background: transparent; }
            .receipt-header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 4px; margin-bottom: 6px; }
            .receipt-header h3 { font-size: 14px; margin: 0; }
            .receipt-header p { font-size: 10px; margin: 2px 0 0; }
            .receipt-info { font-size: 10px; margin-bottom: 6px; }
            .receipt-info span { display: inline-block; width: 80px; }
            .receipt-items { border-top: 1px dashed #000; border-bottom: 1px dashed #000; padding: 4px 0; margin-bottom: 4px; }
            .receipt-items .item { display: flex; justify-content: space-between; font-size: 10px; padding: 1px 0; }
            .receipt-total { display: flex; justify-content: space-between; font-weight: bold; border-top: 2px solid #000; padding-top: 3px; font-size: 12px; }
            .receipt-footer { text-align: center; margin-top: 6px; font-size: 9px; border-top: 1px dashed #000; padding-top: 4px; }
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

    const handleShareWA = async () => {
        const el = receiptRef.current
        if (!el) return
        setLoadingWA(true)
        try {
            const { default: html2canvas } = await import('html2canvas')
            const canvas = await html2canvas(el, { scale: 2, useCORS: true, backgroundColor: '#ffffff' })

            // Get phone number from student data
            let phone = (receipt?.student?.telp || '').replace(/[^0-9]/g, '')
            if (phone.startsWith('0')) phone = '62' + phone.slice(1)

            const message = `Halo Bapak/Ibu,\nBerikut adalah bukti pembayaran dari SMK PPRQ:\n\nNo. Nota: ${receipt.invoiceNo}\nSiswa: ${receipt?.student?.nama || '-'} (${receipt?.student?.nisn || '-'})\nTotal Bayar: ${formatRupiah(Number(receipt?.total || 0))}\n\nTerima kasih atas pembayarannya.`
            const encodedMsg = encodeURIComponent(message)
            const waUrl = `https://wa.me/${phone}?text=${encodedMsg}`

            // Try Web Share API (Mobile support for files)
            if (navigator.share) {
                const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'))
                const file = new File([blob], `Nota-${receipt.invoiceNo}.png`, { type: 'image/png' })

                if (navigator.canShare && navigator.canShare({ files: [file] })) {
                    try {
                        await navigator.share({
                            files: [file],
                            title: 'Nota Pembayaran',
                            text: message
                        })
                        setLoadingWA(false)
                        return
                    } catch (err) {
                        console.log('Navigator share failed, falling back...', err)
                    }
                }
            }

            // Fallback: Download image then open WhatsApp link (Desktop / Limited Mobile)
            const imgData = canvas.toDataURL('image/png')
            const link = document.createElement('a')
            link.href = imgData
            link.download = `Nota-${receipt.invoiceNo}.png`
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)

            window.open(waUrl, '_blank')
        } catch (err) {
            console.error('WA Share error:', err)
        } finally {
            setLoadingWA(false)
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
                .line(`Siswa: ${receipt?.student?.nama || '-'}`)
                .line(`NISN: ${receipt?.student?.nisn || '-'}`)
                .line("--------------------------------")
                .line("Item             | Total")
                .line("--------------------------------")

                ; (receipt?.items || []).forEach(item => {
                    const name = (item.kategori_nama || item.kategori || 'Tagihan').slice(0, 16).padEnd(16)
                    const nominal = formatRupiah(Number(item.nominal || 0)).replace(/\s/g, '')
                    encoder.line(`${name} ${nominal.padStart(15)}`)
                })

            encoder
                .line("--------------------------------")
                .align(2) // Right
                .bold(true).line(`TOTAL: ${formatRupiah(Number(receipt?.total || 0))}`)
                .bold(false).line(`Bayar: ${formatRupiah(Number(receipt?.amountPaid || 0))}`)
                .line(`Kembali: ${formatRupiah(Number(receipt?.change || 0))}`)
                .feed(2)
                .align(1)
                .line("Terima kasih atas")
                .line("pembayarannya!")
                .feed(4)

            const data = encoder.encode()

            // Request Device
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

            // Send in chunks
            const chunkSize = 20
            for (let i = 0; i < data.length; i += chunkSize) {
                await writer.writeValue(data.slice(i, i + chunkSize))
            }

            await server.disconnect()
        } catch (err) {
            console.error('Bluetooth Print error:', err)
            if (err.name !== 'NotFoundError' && err.name !== 'AbortError') {
                import('sweetalert2').then(Swal => Swal.default.fire('Error', 'Gagal menghubungkan ke printer Bluetooth. Pastikan printer menyala dan Bluetooth aktif.', 'error'))
            }
        } finally {
            setLoadingBT(false)
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
                <button className="btn btn-outline" onClick={handleBluetoothPrint} disabled={loadingBT} type="button" style={{ border: '1.5px solid var(--primary-500)', color: 'var(--primary-600)' }}>
                    <Bluetooth size={16} /> {loadingBT ? 'Menyambung...' : 'Bluetooth'}
                </button>
                <button className="btn btn-success" onClick={handleShareWA} disabled={loadingWA} type="button" style={{ background: '#25D366', borderColor: '#25D366', color: '#fff' }}>
                    <MessageCircle size={16} /> {loadingWA ? 'Mengolah...' : 'Kirim WhatsApp'}
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
