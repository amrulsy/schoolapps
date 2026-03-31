import { useState, useRef } from 'react'
import Modal from '../../components/Modal'
import { useReactToPrint } from 'react-to-print'
import { downloadFile } from '../../utils/downloadHelper'
import { Printer, FileDown, MessageCircle, Bluetooth, Settings } from 'lucide-react'
import { EscPosEncoder } from '../../utils/escPosHelper'
import { bluetoothHelper } from '../../utils/bluetoothHelper'
import PrinterSettingsModal from '../../components/PrinterSettingsModal'
import { useApp } from '../../context/AppContext'

export default function ReceiptModal({ receipt, formatRupiah, onClose }) {
    const { schoolSettings } = useApp()
    
    // Konfigurasi Header/Footer (Fallback ke default jika kosong)
    const storeName = schoolSettings?.receipt_header1 || schoolSettings?.school_name || 'NAMA TOKO'
    const storeAddress = schoolSettings?.receipt_header2 || schoolSettings?.school_address || 'Alamat Toko'
    const storePhone = schoolSettings?.receipt_header3 || schoolSettings?.school_phone || 'Telp / Kontak'
    const receiptFooter = schoolSettings?.receipt_footer || 'Terima kasih atas pembayarannya!'

    const [loadingPdf, setLoadingPdf] = useState(false)
    const [loadingWA, setLoadingWA] = useState(false)
    const [loadingBT, setLoadingBT] = useState(false)
    const [showPrinterSettings, setShowPrinterSettings] = useState(false)
    const [paperSize, setPaperSize] = useState('58mm') // 58mm default for thermal
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

    // Dynamic print styles based on paper size
    const getPageStyle = () => {
        const pageSizeCss = paperSize === 'A4' ? 'A4' : paperSize // '58mm' or '80mm'
        const bodyPad = paperSize === 'A4' ? '20mm' : '2mm 0'
        const receiptPad = paperSize === 'A4' ? '32px' : '8px 4px'
        const receiptMaxW = paperSize === 'A4' ? '100%' : paperWidths[paperSize]
        const receiptFontSize = paperSize === 'A4' ? '12pt' : (paperSize === '80mm' ? '10pt' : '8pt')
        const receiptBoldWeight = '900'
        return `
            @page {
                size: ${pageSizeCss === 'A4' ? 'A4' : 'auto'};
                margin: 0;
            }
            @media print {
                html, body {
                    margin: 0 !important;
                    padding: 0 !important;
                    background: #fff !important;
                    width: ${pageSizeCss === 'A4' ? 'auto' : pageSizeCss} !important;
                    min-height: 100% !important;
                    overflow: visible !important;
                    -webkit-print-color-adjust: exact;
                    print-color-adjust: exact;
                }
                .receipt {
                    display: block !important;
                    margin: 0 !important;
                    padding: ${receiptPad} !important;
                    box-shadow: none !important;
                    border: none !important;
                    border-top: none !important;
                    border-bottom: none !important;
                    width: 100% !important;
                    max-width: ${receiptMaxW} !important;
                    font-family: "Courier New", Courier, "Courier", monospace !important;
                    font-size: ${receiptFontSize} !important;
                    line-height: 1.2 !important;
                    overflow: visible !important;
                }
                .receipt-border {
                    border-color: #000 !important;
                    border-style: dashed !important;
                }
                .fw-bold {
                    font-weight: ${receiptBoldWeight} !important;
                }
                * {
                    box-sizing: border-box !important;
                    color: #000 !important;
                    -webkit-print-color-adjust: exact;
                    print-color-adjust: exact;
                }
            }
        `
    }

    // react-to-print: uses dynamic pageStyle for correct paper sizing
    const handlePrint = useReactToPrint({
        contentRef: receiptRef,
        documentTitle: `Nota - ${receipt.invoiceNo}`,
        pageStyle: getPageStyle()
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
                pdfW = 210
                pdfSize = 'a4'
            }

            const pdf = new jsPDF({ unit: 'mm', format: pdfSize, orientation: pdfFormat })
            
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
            if (!bluetoothHelper.isSupported()) {
                throw new Error("Browser Anda tidak mendukung fitur Web Bluetooth. Gunakan Google Chrome/Edge, dan pastikan aplikasi diakses melalui koneksi aman (localhost atau HTTPS).")
            }

            const encoder = new EscPosEncoder()
            
            const maxChars = paperSize === '80mm' ? 48 : 32
            const dashLine = "-".repeat(maxChars)

            const printRow = (leftText, rightText) => {
                const rightStr = String(rightText || '')
                const spaceLen = maxChars - leftText.length - rightStr.length
                if (spaceLen > 0) {
                    encoder.line(leftText + " ".repeat(spaceLen) + rightStr)
                } else {
                    encoder.line(leftText + " " + rightStr)
                }
            }

            encoder
                .initialize()
                .align(1) // Center
                .bold(true).line(storeName)
                .bold(false).line(storeAddress)
                .line(storePhone)
                .line("") // Empty line mimicking margin
                .align(0) // Left
                .line(dashLine)

            const kasirName = (receipt.kasir && receipt.kasir !== 'undefined' && receipt.kasir !== 'null') ? receipt.kasir : 'Admin'
            const statusName = (receipt.status === 'voided' || receipt.status === 'void') ? 'DIBATALKAN' : 'SUKSES'
            
            printRow("Nota:", receipt.invoice_no || receipt.invoiceNo)
            printRow("Tgl:", receipt.tanggal ? new Date(receipt.tanggal).toLocaleString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-')
            printRow("Siswa:", receipt?.student?.nama || receipt.siswa_nama || '-')
            printRow("Kasir:", kasirName)
            printRow("Metode:", "TUNAI")
            printRow("Status:", statusName)
            
            encoder.line(dashLine)

                ; (receipt?.items || []).forEach(item => {
                    const nominalStr = formatRupiah(Number(item.nominal || 0)).replace(/\s/g, '')
                    const spaceCount = 1
                    const nameMaxLen = maxChars - nominalStr.length - spaceCount
                    
                    let name = `${item.kategori_nama || item.kategori || 'Tagihan'} ${item.bulan}'${(item.tahun || '').toString().slice(-2)}`
                    if (name.length > nameMaxLen) {
                        name = name.slice(0, nameMaxLen - 2) + '..'
                    }
                    
                    encoder.line(`${name.padEnd(nameMaxLen)} ${nominalStr}`)
                })

            encoder.line(dashLine).align(0)

            encoder.bold(true)
            printRow("TOTAL:", formatRupiah(Number(receipt?.total || 0)))
            encoder.bold(false)
            printRow("Tunai:", formatRupiah(Number(receipt?.amountPaid || 0)))
            printRow("Kembali:", formatRupiah(Number(receipt?.change || 0)))

            encoder.feed(1).align(1)
                
            // Handle multiline footer for ESC/POS
            const footerLines = receiptFooter.split('\n')
            footerLines.forEach(l => encoder.line(l))
            
            encoder.feed(4)

            const data = encoder.encode()

            // AUTO-CONNECT LOGIC
            let device = bluetoothHelper.getActiveDevice()

            const defaultId = bluetoothHelper.getDefaultPrinterId()
            if (!device && defaultId) {
                const authorizedDevices = await bluetoothHelper.getAuthorizedDevices()
                device = authorizedDevices.find(d => d.id === defaultId)
                if (device) bluetoothHelper.setActiveDevice(device)
            }

            // Jika masih tidak ada (device belum dipairing hari ini atau getDevices diblokir HP), minta pilih
            if (!device) {
                device = await bluetoothHelper.requestPrinter()
            }

            if (!device) return

            const writer = await bluetoothHelper.connectAndGetWriter(device)
            await bluetoothHelper.sendData(writer, data)
            await device.gatt.disconnect()

        } catch (err) {
            console.error('Bluetooth Print error:', err)
            if (err.name !== 'NotFoundError' && err.name !== 'AbortError') {
                import('sweetalert2').then(Swal => Swal.default.fire('Error', `Gagal menghubungkan ke printer Bluetooth.\n\nDetail: ${err.message}`, 'error'))
            } else if (err.name === 'NotFoundError') {
                import('sweetalert2').then(Swal => Swal.default.fire('Info', 'Proses dibatalkan atau tidak ada printer yang terdeteksi.', 'info'))
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
                        style={{ width: 'auto', padding: '2px 8px', height: '32px', fontSize: '0.85rem', borderRadius: 12 }}
                        value={paperSize}
                        onChange={(e) => setPaperSize(e.target.value)}
                    >
                        <option value="58mm">58mm (Thermal)</option>
                        <option value="80mm">80mm (Thermal)</option>
                        <option value="A4">A4 (Standard)</option>
                    </select>
                </div>
                <button className="btn btn-ghost" onClick={handlePrint} type="button" style={{ borderRadius: 12 }}>
                    <Printer size={16} /> Cetak Nota
                </button>
                <button className="btn btn-primary" onClick={handleDownloadPdf} disabled={loadingPdf} type="button" style={{ borderRadius: 12, background: 'var(--pos-primary)', borderColor: 'var(--pos-primary)' }}>
                    <FileDown size={16} /> {loadingPdf ? '...' : 'PDF'}
                </button>
                <div style={{ display: 'flex', gap: 0 }}>
                    <button 
                        className="btn btn-outline" 
                        onClick={handleBluetoothPrint} 
                        disabled={loadingBT} 
                        type="button" 
                        style={{ 
                            borderRadius: '12px 0 0 12px', 
                            border: '1.5px solid var(--pos-primary)', 
                            color: 'var(--pos-primary)',
                            borderRight: 'none'
                        }}
                    >
                        <Bluetooth size={16} /> {loadingBT ? '...' : 'Bluetooth'}
                    </button>
                    <button 
                        className="btn btn-outline" 
                        onClick={() => setShowPrinterSettings(true)} 
                        type="button" 
                        style={{ 
                            borderRadius: '0 12px 12px 0', 
                            border: '1.5px solid var(--pos-primary)', 
                            color: 'var(--pos-primary)',
                            padding: '0 8px'
                        }}
                        title="Pengaturan Printer"
                    >
                        <Settings size={16} />
                    </button>
                </div>
                <button className="btn btn-success" onClick={handleShareWA} disabled={loadingWA} type="button" style={{ borderRadius: 12, background: '#22c55e', borderColor: '#22c55e', color: '#fff' }}>
                    <MessageCircle size={16} /> {loadingWA ? '...' : 'WhatsApp'}
                </button>
            </>
        }>
            {/* Modal Pengaturan Printer */}
            {showPrinterSettings && (
                <PrinterSettingsModal onClose={() => setShowPrinterSettings(false)} />
            )}

            {/* Area yang akan dicetak oleh react-to-print */}
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
                    padding: paperSize === 'A4' ? '32px' : '24px 16px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                    border: paperSize === 'A4' ? '1px solid #cbd5e1' : 'none',
                    borderTop: paperSize === 'A4' ? '1px solid #cbd5e1' : '4px dashed #cbd5e1', 
                    borderBottom: paperSize === 'A4' ? '1px solid #cbd5e1' : '4px dashed #cbd5e1', 
                    fontFamily: '"Courier New", Courier, monospace',
                    fontSize: paperSize === 'A4' ? '1rem' : (paperSize === '80mm' ? '0.9rem' : '0.8rem'),
                    transition: 'all 0.3s ease'
                }}
            >
                {/* Print styles are now handled via pageStyle in useReactToPrint */}
                <div style={{ textAlign: 'center', marginBottom: 16 }}>
                    <strong style={{ fontSize: '1.2rem', display: 'block' }}>{storeName}</strong>
                    <div style={{ marginTop: 4 }}>{storeAddress}</div>
                    <div>{storePhone}</div>
                </div>

                <div className="receipt-border" style={{ borderTop: '1px dashed #94a3b8', borderBottom: '1px dashed #94a3b8', padding: '12px 0', marginBottom: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}><span>Nota:</span> <span className="fw-bold" style={{ fontWeight: 900 }}>{receipt.invoice_no || receipt.invoiceNo}</span></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}><span>Tgl:</span> <span>{receipt.tanggal ? new Date(receipt.tanggal).toLocaleString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-'}</span></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}><span>Siswa:</span> <span className="fw-bold" style={{ fontWeight: 900 }}>{receipt?.student?.nama || receipt.siswa_nama || '-'}</span></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}><span>Kasir:</span> <span>{(receipt.kasir && receipt.kasir !== 'undefined' && receipt.kasir !== 'null') ? receipt.kasir : 'Admin'}</span></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}><span>Metode:</span> <span>TUNAI</span></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Status:</span> <span className="fw-bold" style={{ fontWeight: 900 }}>{(receipt.status === 'voided' || receipt.status === 'void') ? 'DIBATALKAN' : 'SUKSES'}</span></div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                    {(receipt?.items || []).map(item => {
                        const isSpp = (item.kategori_nama || item.kategori || '').toLowerCase().includes('spp')
                        const labelPrefix = (isSpp && item.bulan) ? 'Bulan Berjalan: ' : ''
                        return (
                            <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <span style={{ paddingRight: 8, width: '65%', lineHeight: 1.2 }}>
                                    {labelPrefix}{item.kategori_nama || item.kategori || 'Tagihan'} ({item.kelas_nama || '-'}) {item.bulan}{item.tahun ? `'${item.tahun.toString().slice(-2)}` : ''}
                                </span>
                                <span className="fw-bold" style={{ flex: 1, textAlign: 'right', fontWeight: 900 }}>{formatRupiah(Number(item.nominal || 0))}</span>
                            </div>
                        )
                    })}
                </div>

                <div className="receipt-border" style={{ borderTop: '1px dashed #94a3b8', paddingTop: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }} className="fw-bold"><span style={{ fontWeight: 900 }}>TOTAL:</span> <span style={{ fontWeight: 900 }}>{formatRupiah(Number(receipt?.total || 0))}</span></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}><span>Tunai:</span> <span>{formatRupiah(Number(receipt?.amountPaid || 0))}</span></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Kembali:</span> <span>{formatRupiah(Number(receipt?.change || 0))}</span></div>
                </div>

                <div style={{ textAlign: 'center', marginTop: 24 }}>
                    <div style={{ whiteSpace: 'pre-wrap', opacity: 0.8 }}>
                        {receiptFooter}
                    </div>
                </div>
            </div>
        </Modal>
    )
}
