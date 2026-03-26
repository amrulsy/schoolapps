import React from 'react'

const PRINT_STYLES = /*css*/`
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=Outfit:wght@600;700&display=swap');

  @media print { 
    @page { 
      size: A4; 
      margin: 8mm 10mm; 
    }
    body { 
      background: white !important; 
      color: #000000 !important; 
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    .no-print { display: none !important; }
    .print-only { display: block !important; }

    * { 
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      box-shadow: none !important; 
      text-shadow: none !important; 
      filter: none !important;
      transition: none !important;
      animation: none !important;
    }
  }

  .rapor-print-container {
    width: 100%;
    margin: 0;
    background: white !important; 
    padding: 2mm 0;
    font-family: 'Inter', -apple-system, sans-serif; 
    line-height: 1.4; 
    color: #0f172a;
    font-size: 11pt;
    box-sizing: border-box;
  }

  .school-banner {
    display: flex;
    align-items: center;
    border-bottom: 2px solid #0f172a !important;
    padding-bottom: 8px;
    margin-bottom: 15px;
  }
  .school-logo {
    width: 60px;
    height: 60px;
    background: #f8fafc !important;
    border: 1.5px solid #0f172a !important;
    margin-right: 15px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 800;
    font-size: 12pt;
    color: #0f172a;
  }
  .school-info-top h1 {
    margin: 0;
    font-size: 16pt;
    font-family: 'Outfit', sans-serif;
    color: #0f172a;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    line-height: 1.1;
  }
  .school-info-top p {
    margin: 2px 0 0 0;
    font-size: 9.5pt;
    color: #334155 !important;
    font-weight: 500;
  }

  .rapor-main-title {
    text-align: center;
    font-family: 'Outfit', sans-serif;
    font-weight: 800;
    font-size: 14pt;
    margin-bottom: 15px;
    color: #0f172a;
    text-transform: uppercase;
    border-bottom: 1px solid #cbd5e1 !important;
    padding-bottom: 5px;
  }

  .student-info-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px 30px;
    margin-bottom: 20px;
    padding: 12px 15px;
    background: #f8fafc !important;
    border: 1px solid #cbd5e1 !important;
  }
  .info-item {
    display: flex;
    font-size: 10pt;
  }
  .info-label {
    width: 110px;
    color: #475569 !important;
    font-weight: 600;
  }
  .info-value {
    flex: 1;
    font-weight: 700;
    color: #0f172a;
  }

  .section-heading {
    font-family: 'Outfit', sans-serif;
    font-weight: 800;
    font-size: 11pt;
    margin: 15px 0 8px 0;
    color: #0f172a;
    display: flex;
    align-items: center;
    text-transform: uppercase;
  }
  .section-num {
    background: #0f172a !important;
    color: white !important;
    width: 22px;
    height: 22px;
    border-radius: 4px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    margin-right: 10px;
    font-size: 9pt;
    font-weight: 800;
  }

  .premium-table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 15px;
  }
  .premium-table th {
    background: #0f172a !important;
    color: white !important;
    padding: 8px;
    font-weight: 700;
    font-size: 9pt;
    border: 1px solid #0f172a !important;
    text-align: left;
  }
  .premium-table td {
    padding: 8px;
    border: 1px solid #cbd5e1 !important;
    font-size: 10pt;
    vertical-align: top;
    color: #0f172a;
  }
  .premium-table tr:nth-child(even) {
    background: #fcfcfd !important;
  }

  .compact-row {
    display: flex;
    gap: 20px;
    align-items: flex-start;
  }
  .catatan-box-premium {
    border: 1px solid #cbd5e1 !important;
    padding: 12px 15px;
    background: #fff !important;
    font-size: 10.5pt;
    font-style: italic;
    color: #1e293b;
    margin-bottom: 20px;
    line-height: 1.4;
  }

  .signatures-grid {
    margin-top: 25px;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 30px;
  }
  .sig-wrapper { 
    text-align: center; 
    display: flex; 
    flex-direction: column; 
    align-items: center;
  }
  .sig-line {
    margin-top: 45px;
    width: 220px;
    border-bottom: 1.5px solid #0f172a !important;
    font-weight: 800;
    padding-bottom: 2px;
    color: #0f172a;
    font-size: 11pt;
    min-height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .sig-nip {
    font-size: 9pt;
    color: #475569 !important;
    font-weight: 600;
    margin-top: 3px;
  }
  .sig-date {
    font-size: 10pt;
    margin-bottom: 8px;
    font-weight: 500;
  }
`

export default function RaporPrintTemplate({ data }) {
    if (!data) return null

    const { student, tahunAjaran, semester, nilaiMapel, attendance, catatan, waliKelas } = data
    const school = JSON.parse(localStorage.getItem('school_settings') || '{}')

    return (
        <div className="rapor-print-container">
            <style>{PRINT_STYLES}</style>

            {/* School Banner */}
            <header className="school-banner">
                <div className="school-logo">LOGO</div>
                <div className="school-info-top">
                    <h1>{school.nama || 'SMK PPRQ'}</h1>
                    <p>{school.alamat || 'Alamat sekolah tidak terkonfigurasi'}</p>
                    <p>Telp: (0298) 321-xxx | Email: info@smkpprq.sch.id</p>
                </div>
            </header>

            <div className="rapor-main-title">Laporan Hasil Belajar (Rapor)</div>

            {/* Student Info */}
            <section className="student-info-grid">
                <div className="info-item">
                    <span className="info-label">Nama Siswa</span>
                    <span className="info-value">: {student.nama}</span>
                </div>
                <div className="info-item">
                    <span className="info-label">Kelas</span>
                    <span className="info-value">: {student.kelas_nama}</span>
                </div>
                <div className="info-item">
                    <span className="info-label">NISN</span>
                    <span className="info-value">: {student.nisn || '-'}</span>
                </div>
                <div className="info-item">
                    <span className="info-label">Semester</span>
                    <span className="info-value">: {semester === 'Ganjil' ? '1 (Ganjil)' : '2 (Genap)'}</span>
                </div>
                <div className="info-item">
                    <span className="info-label">Sekolah</span>
                    <span className="info-value">: {school.nsm || 'SMK PPRQ'}</span>
                </div>
                <div className="info-item">
                    <span className="info-label">Tahun Ajaran</span>
                    <span className="info-value">: {tahunAjaran.tahun}</span>
                </div>
            </section>

            <div className="section-heading"><span className="section-num">A</span> Nilai Akademik</div>
            <table className="premium-table">
                <thead>
                    <tr>
                        <th style={{ width: '45px', textAlign: 'center' }}>No</th>
                        <th style={{ width: '220px' }}>Mata Pelajaran</th>
                        <th style={{ width: '90px', textAlign: 'center' }}>Nilai Akhir</th>
                        <th>Capaian Kompetensi</th>
                    </tr>
                </thead>
                <tbody>
                    {nilaiMapel.length > 0 ? nilaiMapel.map((n, i) => (
                        <tr key={n.id}>
                            <td style={{ textAlign: 'center' }}>{i + 1}</td>
                            <td style={{ fontWeight: '700' }}>{n.mapel_nama}</td>
                            <td style={{ textAlign: 'center', fontWeight: '800', fontSize: '12pt' }}>
                                {Math.round(n.nilai_akhir)}
                            </td>
                            <td style={{ fontSize: '9.5pt', textAlign: 'justify', lineHeight: '1.4' }}>
                                {n.deskripsi || '-'}
                            </td>
                        </tr>
                    )) : (
                        <tr><td colSpan="4" style={{ textAlign: 'center' }}>Data nilai belum tersedia</td></tr>
                    )}
                </tbody>
            </table>

            <div className="compact-row">
                <div style={{ flex: 1 }}>
                    <div className="section-heading"><span className="section-num">B</span> Ekstrakurikuler</div>
                    <table className="premium-table">
                        <thead>
                            <tr>
                                <th style={{ width: '150px' }}>Kegiatan</th>
                                <th>Keterangan</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td style={{ fontWeight: '700' }}>Pramuka</td>
                                <td style={{ fontSize: '10pt' }}>Aktif dan berpartisipasi dengan sangat baik dalam kegiatan kepramukaan.</td>
                            </tr>
                            <tr><td>-</td><td>-</td></tr>
                        </tbody>
                    </table>
                </div>

                <div style={{ width: '250px' }}>
                    <div className="section-heading"><span className="section-num">C</span> Ketidakhadiran</div>
                    <table className="premium-table">
                        <tbody>
                            <tr>
                                <td style={{ fontWeight: '600' }}>Sakit</td>
                                <td style={{ textAlign: 'center', fontWeight: '800' }}>{attendance.sakit} Hari</td>
                            </tr>
                            <tr>
                                <td style={{ fontWeight: '600' }}>Izin</td>
                                <td style={{ textAlign: 'center', fontWeight: '800' }}>{attendance.izin} Hari</td>
                            </tr>
                            <tr>
                                <td style={{ fontWeight: '600' }}>Tanpa Keterangan</td>
                                <td style={{ textAlign: 'center', fontWeight: '800' }}>{attendance.alpha} Hari</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="section-heading"><span className="section-num">D</span> Catatan Wali Kelas</div>
            <div className="catatan-box-premium">
                "{catatan || 'Capaian kompetensi secara umum sudah sangat baik. Pertahankan motivasi dan semangat belajarmu untuk meraih prestasi yang lebih tinggi.'}"
            </div>

            <div style={{ textAlign: 'center', marginTop: 15, marginBottom: 8 }}>
                <div className="sig-date" style={{ marginBottom: 2 }}>Salatiga, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
                <p style={{ fontWeight: 600, margin: 0 }}>Mengetahui,</p>
            </div>

            <div className="signatures-grid" style={{ marginTop: 8 }}>
                <div className="sig-wrapper">
                    <p style={{ fontWeight: 600, marginBottom: 5 }}>Orang Tua/Wali</p>
                    <div className="sig-line">&nbsp;</div>
                </div>
                <div className="sig-wrapper">
                    <p style={{ fontWeight: 600, marginBottom: 5 }}>Wali Kelas</p>
                    <div className="sig-line">{waliKelas.nama}</div>
                    <span className="sig-nip">NIP. {waliKelas.nip || '-'}</span>
                </div>
            </div>

            <div className="sig-wrapper" style={{ marginTop: 25, width: '100%' }}>
                <p style={{ fontWeight: 600, marginBottom: 5 }}>Kepala Sekolah</p>
                <div className="sig-line" style={{ width: '280px' }}>{school.kepala_sekolah || 'Kepala Sekolah'}</div>
                <span className="sig-nip">NIP. {school.nip_kepsek || '-'}</span>
            </div>
        </div>
    )
}
