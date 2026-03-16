/**
 * printHelper.js
 * Utilitas cetak konten spesifik ke jendela popup baru
 * sehingga tidak mencetak seluruh halaman (sidebar, header, dll)
 */

/**
 * Cetak konten HTML spesifik ke popup window baru
 * @param {string} htmlContent - HTML string konten yang akan dicetak
 * @param {string} title - Judul dokumen cetak
 * @param {string} [extraCss=''] - CSS tambahan opsional
 */
export function printHtml(htmlContent, title = 'Cetak', extraCss = '') {
    const popup = window.open('', '_blank', 'width=800,height=600,scrollbars=yes')
    if (!popup) {
        alert('Popup diblokir. Mohon izinkan popup dari halaman ini untuk mencetak.')
        return
    }

    popup.document.write(`<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8" />
  <title>${title}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Segoe UI', Arial, sans-serif;
      font-size: 12pt;
      color: #000;
      background: #fff;
      padding: 24px;
    }
    table { width: 100%; border-collapse: collapse; }
    th, td { border: 1px solid #aaa; padding: 6px 10px; text-align: left; }
    th { background: #f0f0f0; font-weight: bold; }
    .mono { font-family: 'Courier New', monospace; }
    ${extraCss}
  </style>
</head>
<body onload="window.print(); window.close();">
  ${htmlContent}
</body>
</html>`)
    popup.document.close()
}

/**
 * Cetak konten struk/nota pembayaran
 * @param {object} receipt - Data struk (invoiceNo, tanggal, kasir, siswa, items, total, dll)
 * @param {function} formatRupiah - Fungsi format rupiah
 */
export function printReceipt(receipt, formatRupiah) {
    const student = receipt.student || {}
    const itemsHtml = receipt.items.map(item => `
        <tr>
            <td>${item.kategori} ${item.bulan}'${item.tahun.toString().slice(-2)} (${item.tahunAjaran})</td>
            <td class="mono" style="text-align:right">${formatRupiah(item.nominal)}</td>
        </tr>
    `).join('')

    const voidBanner = receipt.status === 'voided'
        ? `<div style="text-align:center; border: 4px solid red; color: red; font-size: 24pt; font-weight: bold; padding: 8px; margin: 16px 0; transform: rotate(-5deg); opacity: 0.5;">VOID / DIBATALKAN</div>`
        : ''

    const html = `
        ${voidBanner}
        <div style="text-align:center; margin-bottom: 12px;">
            <h2 style="font-size:16pt;">SMK PPRQ</h2>
            <p>Jl. Pesantren No.1, Kota</p>
            <p>Telp: (021) 123-4567</p>
        </div>
        <hr style="border-color:#aaa; margin: 8px 0;" />
        <table style="border:none; margin-bottom: 8px;">
            <tr><td style="border:none; width:120px;">No. Nota</td><td style="border:none;">: <strong>${receipt.invoiceNo}</strong></td></tr>
            <tr><td style="border:none;">Tanggal</td><td style="border:none;">: ${new Date(receipt.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</td></tr>
            <tr><td style="border:none;">Kasir</td><td style="border:none;">: ${receipt.kasir}</td></tr>
        </table>
        <hr style="border-color:#aaa; margin: 8px 0; border-style: dashed;" />
        <table style="border:none; margin-bottom: 8px;">
            <tr><td style="border:none; width:120px;">Siswa</td><td style="border:none;">: <strong>${student.nama || receipt.siswaName || '-'}</strong></td></tr>
            <tr><td style="border:none;">NISN</td><td style="border:none;">: ${student.nisn || '-'}</td></tr>
            <tr><td style="border:none;">Kelas</td><td style="border:none;">: ${student.kelas || '-'}</td></tr>
        </table>
        <hr style="border-color:#aaa; margin: 8px 0; border-style: dashed;" />
        <table>
            <thead><tr><th>Tagihan</th><th style="text-align:right;">Nominal</th></tr></thead>
            <tbody>${itemsHtml}</tbody>
        </table>
        <hr style="border-color:#aaa; margin: 8px 0;" />
        <table style="border:none;">
            <tr>
                <td style="border:none; font-weight:bold; font-size:13pt;">TOTAL</td>
                <td style="border:none; text-align:right; font-weight:bold; font-size:13pt;" class="mono">${formatRupiah(receipt.total)}</td>
            </tr>
            <tr>
                <td style="border:none; color:#555;">Uang Diterima</td>
                <td style="border:none; text-align:right; color:#555;" class="mono">${formatRupiah(receipt.amountPaid)}</td>
            </tr>
            <tr>
                <td style="border:none; color:#555;">Kembalian</td>
                <td style="border:none; text-align:right; color:#555;" class="mono">${formatRupiah(receipt.change)}</td>
            </tr>
        </table>
        <hr style="border-color:#aaa; margin: 8px 0;" />
        <p style="text-align:center; margin-top: 12px; color: #555;">
            Metode: Tunai &nbsp;|&nbsp; ${receipt.status === 'voided' ? 'NOTA DIBATALKAN' : 'Terima kasih 🙏'}
        </p>
    `
    printHtml(html, `Nota ${receipt.invoiceNo}`)
}

/**
 * Cetak Kartu SPP dari profil siswa
 * @param {object} student - Data siswa
 * @param {object} categoriesMap - Map kategori berisi array tagihan
 * @param {string[]} MONTHS - Array nama bulan
 * @param {function} formatRupiah - Fungsi format rupiah
 * @param {string} tahunAjaran - Tahun ajaran aktif
 */
export function printKartuSPP(student, categoriesMap, MONTHS, formatRupiah, tahunAjaran) {
    const tablesHtml = Object.entries(categoriesMap).map(([kategori, kBills]) => {
        const rows = MONTHS.map(m => {
            const bill = kBills.find(b => b.bulan === m)
            if (!bill) return ''
            return `<tr>
                <td>${m}'${bill.tahun.toString().slice(-2)}</td>
                <td class="mono">${formatRupiah(bill.nominal)}</td>
                <td><strong style="color:${bill.status === 'lunas' ? 'green' : 'red'}">${bill.status === 'lunas' ? 'LUNAS' : 'BELUM'}</strong></td>
                <td>${bill.paidAt ? new Date(bill.paidAt).toLocaleDateString('id-ID') : '-'}</td>
                <td style="width:100px;"></td>
            </tr>`
        }).join('')

        return `
            <h3 style="margin: 16px 0 8px; font-size: 12pt;">Tagihan ${kategori}</h3>
            <table>
                <thead><tr><th>Bulan</th><th>Nominal</th><th>Status</th><th>Tgl Bayar</th><th>Paraf</th></tr></thead>
                <tbody>${rows}</tbody>
            </table>
        `
    }).join('')

    const html = `
        <div style="text-align:center; margin-bottom: 16px;">
            <h2 style="font-size: 16pt;">KARTU PEMBAYARAN SPP & TAGIHAN</h2>
            <p style="color:#555;">SMK PPRQ — Tahun Ajaran ${tahunAjaran}</p>
        </div>
        <hr style="border-color:#aaa; margin-bottom: 12px;" />
        <table style="border:none; margin-bottom:16px; font-size:11pt;">
            <tr>
                <td style="border:none; width:50%"><strong>Nama:</strong> ${student.nama}</td>
                <td style="border:none;"><strong>Kelas:</strong> ${student.kelas}</td>
            </tr>
            <tr>
                <td style="border:none;"><strong>NISN:</strong> ${student.nisn}</td>
                <td style="border:none;"><strong>Wali:</strong> ${student.wali || '-'}</td>
            </tr>
        </table>
        ${tablesHtml}
        <div style="margin-top: 40px; display: flex; justify-content: flex-end; gap:80px;">
            <div style="text-align:center;">
                <p>Mengetahui,</p>
                <br/><br/><br/>
                <p><strong>Orang Tua / Wali</strong></p>
            </div>
            <div style="text-align:center;">
                <p>Petugas Keuangan</p>
                <br/><br/><br/>
                <p><strong>(......................)</strong></p>
            </div>
        </div>
    `
    printHtml(html, `Kartu SPP - ${student.nama}`)
}
