
const PRINT_STYLES = /*css*/`
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

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

    .rapor-print-page {
      page-break-after: always;
    }
    .rapor-print-page:last-child {
      page-break-after: auto;
    }

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
    padding: 4mm 6mm;
    font-family: 'Plus Jakarta Sans', -apple-system, sans-serif; 
    line-height: 1.35; 
    color: #1e293b;
    font-size: 10pt;
    box-sizing: border-box;
  }

  /* ─── School Banner ─── */
  .rp-header {
    display: flex;
    align-items: center;
    gap: 14px;
    padding-bottom: 10px;
    margin-bottom: 10px;
    border-bottom: 3px double #1e293b !important;
  }
  .rp-logo-box {
    width: 58px; height: 58px;
    background: #f1f5f9 !important;
    border: 1.5px solid #94a3b8 !important;
    border-radius: 8px;
    display: flex; align-items: center; justify-content: center;
    font-weight: 800; font-size: 11pt; color: #64748b;
    flex-shrink: 0;
  }
  .rp-school-info h1 {
    margin: 0; font-size: 15pt; font-weight: 800;
    color: #0f172a; text-transform: uppercase; letter-spacing: 0.3px; line-height: 1.15;
  }
  .rp-school-info p {
    margin: 1px 0 0 0; font-size: 8.5pt; color: #64748b; font-weight: 500;
  }

  /* ─── Document Title ─── */
  .rp-main-title {
    text-align: center;
    margin: 8px 0 12px 0;
  }
  .rp-main-title h2 {
    margin: 0; font-size: 13pt; font-weight: 800;
    color: #0f172a; text-transform: uppercase; letter-spacing: 0.8px;
  }
  .rp-main-title .rp-subtitle {
    font-size: 9pt; color: #64748b; font-weight: 600; margin-top: 2px;
  }

  /* ─── Student Info Card ─── */
  .rp-student-card {
    display: grid; grid-template-columns: 1fr 1fr;
    gap: 6px 28px;
    padding: 10px 14px;
    background: #f8fafc !important;
    border: 1px solid #e2e8f0 !important;
    border-left: 4px solid #1e293b !important;
    border-radius: 6px;
    margin-bottom: 14px;
  }
  .rp-info-row {
    display: flex; align-items: center; gap: 8px; font-size: 9.5pt;
  }
  .rp-info-label {
    width: 100px; font-weight: 600; color: #94a3b8;
    text-transform: uppercase; font-size: 7.5pt; letter-spacing: 0.3px;
  }
  .rp-info-value {
    font-weight: 700; color: #334155; flex: 1;
  }

  /* ─── Section Heading ─── */
  .rp-section {
    display: flex; align-items: center; gap: 8px;
    margin: 12px 0 6px 0;
  }
  .rp-section-badge {
    width: 21px; height: 21px; border-radius: 5px;
    background: #1e293b !important; color: white !important;
    display: inline-flex; align-items: center; justify-content: center;
    font-size: 8pt; font-weight: 800; flex-shrink: 0;
  }
  .rp-section-title {
    font-size: 10pt; font-weight: 800; color: #0f172a;
    text-transform: uppercase; letter-spacing: 0.5px;
  }

  /* ─── Grade Table ─── */
  .rp-grade-table {
    width: 100%; border-collapse: separate; border-spacing: 0;
    margin-bottom: 10px; border-radius: 6px;
    border: 1px solid #cbd5e1 !important; overflow: hidden;
  }
  .rp-grade-table th {
    background: #1e293b !important; color: white !important;
    padding: 7px 10px; font-weight: 700; font-size: 8pt;
    text-transform: uppercase; letter-spacing: 0.6px;
    border: none !important; text-align: left;
  }
  .rp-grade-table td {
    padding: 6px 10px; border-bottom: 1px solid #f1f5f9 !important;
    font-size: 9.5pt; vertical-align: top; color: #334155;
  }
  .rp-grade-table tr:last-child td { border-bottom: none !important; }
  .rp-grade-table tr:nth-child(even) td { background: #fafbfc !important; }

  .rp-score-cell {
    text-align: center; font-weight: 800; font-size: 11pt; color: #0f172a !important;
  }
  .rp-mapel-name { font-weight: 700; color: #334155; }
  .rp-desc-cell {
    font-size: 8.5pt; color: #64748b; font-style: italic; line-height: 1.35;
    text-align: justify;
  }

  /* ─── Compact Row (Ekskul + Kehadiran) ─── */
  .rp-compact-row {
    display: flex; gap: 16px; align-items: flex-start;
    margin-bottom: 10px;
  }
  .rp-compact-col { flex: 1; }
  .rp-compact-col.narrow { width: 200px; flex: none; }

  .rp-mini-table {
    width: 100%; border-collapse: separate; border-spacing: 0;
    border: 1px solid #cbd5e1 !important; border-radius: 6px; overflow: hidden;
  }
  .rp-mini-table th {
    background: #f1f5f9 !important; padding: 6px 10px;
    font-size: 7.5pt; font-weight: 700; color: #64748b;
    text-transform: uppercase; letter-spacing: 0.6px;
    border-bottom: 1px solid #e2e8f0 !important; text-align: left;
  }
  .rp-mini-table td {
    padding: 5px 10px; font-size: 9pt; border-bottom: 1px solid #f1f5f9 !important;
    color: #334155;
  }
  .rp-mini-table tr:last-child td { border-bottom: none !important; }

  /* ─── Catatan Box ─── */
  .rp-catatan-box {
    border: 1px solid #cbd5e1 !important;
    border-radius: 6px; overflow: hidden;
    margin-bottom: 12px;
  }
  .rp-catatan-header {
    background: #f1f5f9 !important;
    padding: 5px 12px; font-size: 7.5pt; font-weight: 700;
    color: #64748b; text-transform: uppercase; letter-spacing: 0.6px;
    border-bottom: 1px solid #e2e8f0 !important;
  }
  .rp-catatan-body {
    padding: 8px 12px; font-size: 9.5pt;
    font-style: italic; color: #475569; line-height: 1.4;
    min-height: 24px;
  }

  /* ─── Signatures ─── */
  .rp-sig-date {
    text-align: right; font-size: 9.5pt; font-weight: 600;
    color: #64748b; margin-bottom: 6px; padding-right: 50px;
  }
  .rp-sig-subtitle {
    text-align: center; font-size: 9pt; font-weight: 600;
    color: #475569; margin-bottom: 2px;
  }
  .rp-sig-grid {
    display: grid; grid-template-columns: 1fr 1fr 1fr;
    gap: 20px; margin-top: 4px;
  }
  .rp-sig-box { text-align: center; }
  .rp-sig-label {
    font-size: 8.5pt; font-weight: 700; color: #475569;
    margin-bottom: 50px;
  }
  .rp-sig-name {
    font-size: 10pt; font-weight: 800; color: #0f172a;
    border-bottom: 1.5px solid #334155 !important;
    padding-bottom: 2px; display: inline-block; min-width: 140px;
  }
  .rp-sig-nip {
    font-size: 7.5pt; color: #94a3b8; margin-top: 3px; font-weight: 500;
  }
`

export default function RaporPrintTemplate({ data, batchData }) {
  if (batchData && Array.isArray(batchData)) {
    return (
      <>
        {batchData.map((d, idx) => (
          <div key={idx} className="rapor-print-page">
            <SingleRapor d={d} />
          </div>
        ))}
      </>
    )
  }

  if (!data) return null
  return <SingleRapor d={data} />
}

function SingleRapor({ d }) {
  const { student, tahunAjaran, semester, nilaiMapel, attendance, catatan, waliKelas, ekskul } = d
  const school = JSON.parse(localStorage.getItem('school_settings') || '{}')

  return (
    <div className="rapor-print-container">
      <style>{PRINT_STYLES}</style>

      {/* School Banner */}
      <header className="rp-header">
        <div className="rp-logo-box">LOGO</div>
        <div className="rp-school-info">
          <h1>{school.nama || 'SMK PPRQ'}</h1>
          <p>{school.alamat || 'Alamat sekolah tidak terkonfigurasi'}</p>
          <p>Telp: {school.telp || '(0298) 321-xxx'} | Email: {school.email || 'info@smkpprq.sch.id'}</p>
        </div>
      </header>

      {/* Document Title */}
      <div className="rp-main-title">
        <h2>Laporan Hasil Belajar</h2>
        <div className="rp-subtitle">Kurikulum Merdeka — Tahun Ajaran {tahunAjaran.tahun || '-'}</div>
      </div>

      {/* Student Info Card */}
      <section className="rp-student-card">
        <div className="rp-info-row">
          <span className="rp-info-label">Nama Siswa</span>
          <span className="rp-info-value">{student.nama}</span>
        </div>
        <div className="rp-info-row">
          <span className="rp-info-label">Kelas</span>
          <span className="rp-info-value">{student.kelas_nama}</span>
        </div>
        <div className="rp-info-row">
          <span className="rp-info-label">NISN</span>
          <span className="rp-info-value">{student.nisn || '-'}</span>
        </div>
        <div className="rp-info-row">
          <span className="rp-info-label">Semester</span>
          <span className="rp-info-value">{semester === 'Ganjil' ? '1 (Ganjil)' : '2 (Genap)'}</span>
        </div>
        <div className="rp-info-row">
          <span className="rp-info-label">Sekolah</span>
          <span className="rp-info-value">{school.nama || 'SMK PPRQ'}</span>
        </div>
        <div className="rp-info-row">
          <span className="rp-info-label">Tahun Ajaran</span>
          <span className="rp-info-value">{tahunAjaran.tahun}</span>
        </div>
      </section>

      {/* A: Nilai Akademik */}
      <div className="rp-section">
        <span className="rp-section-badge">A</span>
        <span className="rp-section-title">Nilai Akademik</span>
      </div>
      <table className="rp-grade-table">
        <thead>
          <tr>
            <th style={{ width: '38px', textAlign: 'center' }}>No</th>
            <th style={{ width: '200px' }}>Mata Pelajaran</th>
            <th style={{ width: '70px', textAlign: 'center' }}>Nilai</th>
            <th>Capaian Kompetensi</th>
          </tr>
        </thead>
        <tbody>
          {nilaiMapel.length > 0 ? nilaiMapel.map((n, i) => (
            <tr key={n.id}>
              <td style={{ textAlign: 'center', color: '#94a3b8', fontWeight: 700 }}>{String(i + 1).padStart(2, '0')}</td>
              <td className="rp-mapel-name">{n.mapel_nama}</td>
              <td className="rp-score-cell">{Math.round(n.nilai_akhir)}</td>
              <td className="rp-desc-cell">{n.deskripsi || '-'}</td>
            </tr>
          )) : (
            <tr><td colSpan="4" style={{ textAlign: 'center', color: '#94a3b8', padding: '16px' }}>Data nilai belum tersedia</td></tr>
          )}
        </tbody>
      </table>

      {/* B & C: Ekskul + Kehadiran side by side */}
      <div className="rp-compact-row">
        <div className="rp-compact-col">
          <div className="rp-section" style={{ marginTop: 0 }}>
            <span className="rp-section-badge">B</span>
            <span className="rp-section-title">Ekstrakurikuler</span>
          </div>
          <table className="rp-mini-table">
            <thead>
              <tr>
                <th style={{ width: '140px' }}>Kegiatan</th>
                <th>Keterangan</th>
              </tr>
            </thead>
            <tbody>
              {ekskul && ekskul.length > 0 ? ekskul.map((e, idx) => (
                <tr key={idx}>
                  <td style={{ fontWeight: 700 }}>{e.nama_ekskul}</td>
                  <td>{e.keterangan || '-'}</td>
                </tr>
              )) : (
                <tr><td colSpan="2" style={{ textAlign: 'center', color: '#94a3b8' }}>—</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="rp-compact-col narrow">
          <div className="rp-section" style={{ marginTop: 0 }}>
            <span className="rp-section-badge">C</span>
            <span className="rp-section-title">Ketidakhadiran</span>
          </div>
          <table className="rp-mini-table">
            <tbody>
              <tr>
                <td style={{ fontWeight: 600 }}>Sakit</td>
                <td style={{ textAlign: 'center', fontWeight: 800 }}>{attendance?.sakit || 0} Hari</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 600 }}>Izin</td>
                <td style={{ textAlign: 'center', fontWeight: 800 }}>{attendance?.izin || 0} Hari</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 600 }}>Tanpa Keterangan</td>
                <td style={{ textAlign: 'center', fontWeight: 800 }}>{attendance?.alpha || 0} Hari</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Catatan Wali Kelas */}
      <div className="rp-section">
        <span className="rp-section-badge">D</span>
        <span className="rp-section-title">Catatan Wali Kelas</span>
      </div>
      <div className="rp-catatan-box">
        <div className="rp-catatan-body">
          {catatan || 'Capaian kompetensi secara umum sudah sangat baik. Pertahankan motivasi dan semangat belajarmu untuk meraih prestasi yang lebih tinggi.'}
        </div>
      </div>

      {/* Signatures */}
      <div className="rp-sig-date">
        Salatiga, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
      </div>
      <div className="rp-sig-subtitle">Mengetahui,</div>

      <div className="rp-sig-grid">
        <div className="rp-sig-box">
          <div className="rp-sig-label">Orang Tua / Wali</div>
          <div className="rp-sig-name">&nbsp;</div>
        </div>
        <div className="rp-sig-box">
          <div className="rp-sig-label">Wali Kelas</div>
          <div className="rp-sig-name">{waliKelas?.nama || '-'}</div>
          <div className="rp-sig-nip">NIP. {waliKelas?.nip || '-'}</div>
        </div>
        <div className="rp-sig-box">
          <div className="rp-sig-label">Kepala Sekolah</div>
          <div className="rp-sig-name">{school.kepala_sekolah || 'Kepala Sekolah'}</div>
          <div className="rp-sig-nip">NIP. {school.nip_kepsek || '-'}</div>
        </div>
      </div>
    </div>
  )
}
