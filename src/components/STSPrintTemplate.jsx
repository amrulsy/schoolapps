

const STSPrintTemplate = ({ data, batchData }) => {
    if (batchData && Array.isArray(batchData)) {
        return (
            <div className="sts-batch-container">
                <style>{`
                    @media print {
                        .sts-page-break { page-break-after: always; }
                        .sts-page-break:last-child { page-break-after: auto; }
                    }
                `}</style>
                {batchData.map((d, idx) => (
                    <div key={idx} className="sts-page-break">
                        <SingleSTS data={d} />
                    </div>
                ))}
            </div>
        );
    }

    if (!data) return null;
    return <SingleSTS data={data} />;
};

const SingleSTS = ({ data }) => {
    const { student, tahunAjaran, semester, nilaiMapel, waliKelas } = data;
    const school = JSON.parse(localStorage.getItem('school_settings') || '{}');

    const getKeterangan = (nilai) => {
        const n = Number(nilai);
        if (n >= 85) return "Istimewa";
        if (n >= 75) return "Kompeten";
        if (n >= 60) return "Sedang Berkembang";
        return "Perlu Pendampingan";
    };

    const getCatClass = (score) => {
        const n = Number(score);
        if (n >= 85) return 'cat-istimewa';
        if (n >= 75) return 'cat-kompeten';
        if (n >= 60) return 'cat-berkembang';
        return 'cat-perlu';
    };

    // Only use real data — no mock data generation
    const allMapel = nilaiMapel || [];

    const grouped = allMapel.reduce((acc, curr) => {
        const key = curr.kelompok || curr.mapel_tingkat || "Muatan Lokal";
        if (!acc[key]) acc[key] = [];
        acc[key].push(curr);
        return acc;
    }, {});

    // Layout config
    const layoutConfig = {
        fontSize: '9.2pt',
        lineHeight: '1.2',
        rowPadding: '6.5px',
        pagePadding: '10mm 15mm',
        sectionGap: '8px',
        signatureGap: '55px',
    };

    return (
        <div className="sts-print-container" style={{
            '--font-size': layoutConfig.fontSize,
            '--line-height': layoutConfig.lineHeight,
            '--row-padding': layoutConfig.rowPadding,
            '--page-padding': layoutConfig.pagePadding,
            '--section-gap': layoutConfig.sectionGap,
            '--sig-gap': layoutConfig.signatureGap,

            padding: 'var(--page-padding)',
            background: 'white',
            color: '#1e293b',
            fontFamily: "'Plus Jakarta Sans', 'Inter', system-ui, sans-serif",
            lineHeight: 'var(--line-height)',
            width: '210mm',
            height: '297mm',
            margin: '0 auto',
            fontSize: 'var(--font-size)',
            boxSizing: 'border-box',
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            printColorAdjust: 'exact',
            WebkitPrintColorAdjust: 'exact'
        }}>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
                
                @media screen {
                    .sts-print-container {
                        box-shadow: 0 10px 40px rgba(0,0,0,0.15);
                        border: 1px solid #e2e8f0;
                        margin: 20px auto !important;
                    }
                }

                @media print {
                    @page { size: A4; margin: 0; }
                    body { margin: 0 !important; padding: 0 !important; background: white !important; }
                    .sts-print-container { 
                        width: 210mm !important; 
                        height: 297mm !important; 
                        padding: var(--page-padding) !important; 
                        margin: 0 !important; 
                        border: none !important; 
                        box-shadow: none !important;
                        overflow: hidden;
                        background-color: white !important;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                    * { 
                        -webkit-print-color-adjust: exact !important; 
                        print-color-adjust: exact !important; 
                    }
                }

                /* Layout Utilities */
                .premium-divider { height: 1.5px; background: linear-gradient(90deg, #1e293b 0%, #e2e8f0 100%) !important; margin: 8px 0; border-radius: 1px; }
                
                /* Header Section */
                .sts-header { display: flex; align-items: center; gap: 14px; margin-bottom: 8px; }
                .sts-logo-container { 
                    width: 58px; height: 58px; 
                    background: #f1f5f9 !important;
                    border: 1.2px solid #94a3b8;
                    border-radius: 8px;
                    display: flex; align-items: center; justify-content: center;
                    font-weight: 800; font-size: 11px; color: #64748b;
                    flex-shrink: 0;
                }
                .school-details { flex: 1; }
                .school-details h1 { margin: 0; font-size: 15pt; font-weight: 800; color: #0f172a; letter-spacing: -0.4px; }
                .school-details p { margin: 1px 0; color: #64748b; font-size: 8.5pt; font-weight: 500; }

                /* Document Title */
                .title-area { text-align: center; margin: 5px 0 12px 0; }
                .doc-type-pill { 
                    display: inline-block; background: #f1f5f9 !important; padding: 2px 14px; border-radius: 5px; 
                    font-size: 7.5pt; font-weight: 700; color: #475569; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 4px;
                }
                .title-area h2 { margin: 0; font-size: 11.5pt; font-weight: 800; color: #0f172a; text-transform: uppercase; letter-spacing: 0.5px; }
                .title-area .sub-title { font-size: 9.5pt; color: #64748b; font-weight: 600; margin-top: 2px; }

                /* Student Dashboard Info Card */
                .student-dashboard { 
                    display: grid; grid-template-columns: 1.25fr 1fr; gap: 15px; 
                    padding: 10px 18px; background: #f8fafc !important; border-left: 5px solid #1e293b; border-radius: 8px; margin-bottom: var(--section-gap);
                }
                .info-group { display: flex; flex-direction: column; gap: 4px; }
                .info-row { display: flex; align-items: center; gap: 10px; }
                .info-label { width: 90px; font-size: 7.5pt; font-weight: 600; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.4px; }
                .info-value { font-size: 9.5pt; font-weight: 700; color: #334155; }

                /* Assessment Table */
                .results-table { 
                    width: 100%; border-collapse: separate; border-spacing: 0; margin-bottom: var(--section-gap); 
                    border-radius: 8px; border: 1px solid #e2e8f0 !important; overflow: hidden; 
                    background-color: white !important;
                }
                .results-table th { 
                    background: #f1f5f9 !important; color: #475569; padding: 8px 15px; font-weight: 700; font-size: 8.5pt; 
                    text-transform: uppercase; letter-spacing: 0.8px; text-align: left; border-bottom: 1px solid #e2e8f0 !important;
                }
                .results-table td { padding: var(--row-padding) 15px; border-bottom: 1px solid #f1f5f9 !important; vertical-align: middle; }
                .results-table tr:last-child td { border-bottom: none !important; }
                
                .category-row { background: #f8fafc !important; }
                .category-header { 
                    padding: 6px 15px; font-size: 8pt; font-weight: 800; color: #64748b; 
                    text-transform: uppercase; letter-spacing: 1.2px; border-bottom: 1px solid #e2e8f0 !important;
                }

                .score-cell { font-size: 10.5pt; font-weight: 800; color: #0f172a !important; text-align: center; }
                .description-cell { font-size: 8.5pt; font-weight: 600; font-style: italic; }
                
                /* Grade Categorization Colors */
                .cat-istimewa { color: #16a34a !important; }
                .cat-kompeten { color: #2563eb !important; }
                .cat-berkembang { color: #d97706 !important; }
                .cat-perlu { color: #dc2626 !important; }

                /* Footer Section */
                .legend-box {
                    display: flex; gap: 12px; justify-content: center; margin-bottom: var(--section-gap); 
                    font-size: 7.5pt; color: #94a3b8; font-weight: 500;
                }
                .legend-pill { display: flex; align-items: center; gap: 6px; background: #f8fafc !important; padding: 2px 10px; border-radius: 5px; border: 1px solid #f1f5f9 !important; }
                .dot-indicator { width: 6px; height: 6px; border-radius: 50%; }

                .signature-section { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-top: 0; padding-top: 0; position: relative; }
                .sig-box { text-align: center; }
                .sig-label { font-size: 8.5pt; font-weight: 700; color: #475569; text-transform: uppercase; letter-spacing: 0.6px; margin-bottom: var(--sig-gap); }
                .sig-name { font-size: 9.5pt; font-weight: 800; color: #0f172a; border-bottom: 1.5px solid #334155 !important; padding-bottom: 1px; min-width: 160px; display: inline-block; }
                .sig-nip { font-size: 8pt; color: #94a3b8; margin-top: 4px; font-weight: 500; }
                
                .date-line { text-align: center; margin-bottom: 0; font-size: 9.5pt; font-weight: 600; color: #64748b; padding-right: 0; }
                
                .bg-mark {
                    position: absolute; top: 55%; left: 50%; transform: translate(-50%, -50%) rotate(-45deg);
                    font-size: 75pt; font-weight: 900; color: rgba(241, 245, 249, 0.4) !important; z-index: -1; pointer-events: none;
                }
            `}</style>

            <div className="bg-mark">ACADEMIC</div>

            <div className="sts-header">
                <div className="sts-logo-container">LOGO</div>
                <div className="school-details">
                    <h1>{school.nama || 'SMK PPRQ'}</h1>
                    <p>{school.alamat || 'Alamat sekolah tidak terkonfigurasi'}</p>
                    <p style={{ display: 'flex', gap: '8px' }}>
                        <span>T: {school.telp || '-'}</span>
                        <span>•</span>
                        <span>E: {school.email || '-'}</span>
                    </p>
                </div>
            </div>

            <div className="premium-divider"></div>

            <div className="title-area">
                <span className="doc-type-pill">Kurikulum Merdeka • TA {tahunAjaran?.tahun || '-'}</span>
                <h2>Surat Keterangan Hasil Asesmen</h2>
                <div className="sub-title">Sumatif Tengah Semester (STS)</div>
            </div>

            <div className="student-dashboard">
                <div className="info-group">
                    <div className="info-row">
                        <span className="info-label">Nama Siswa</span>
                        <span className="info-value">{student.nama}</span>
                    </div>
                    <div className="info-row">
                        <span className="info-label">NISN</span>
                        <span className="info-value">{student.nisn || '-'}</span>
                    </div>
                </div>
                <div className="info-group">
                    <div className="info-row">
                        <span className="info-label">Kelas</span>
                        <span className="info-value">{student.kelas_nama}</span>
                    </div>
                    <div className="info-row">
                        <span className="info-label">Semester</span>
                        <span className="info-value">{semester}</span>
                    </div>
                </div>
            </div>

            <table className="results-table">
                <thead>
                    <tr>
                        <th style={{ width: '40px', textAlign: 'center' }}>No</th>
                        <th>Mata Pelajaran</th>
                        <th style={{ width: '90px', textAlign: 'center' }}>Skor</th>
                        <th style={{ width: '210px' }}>Keterangan Capaian</th>
                    </tr>
                </thead>
                <tbody>
                    {(() => {
                        const rows = [];
                        let globalIdx = 1;

                        Object.entries(grouped).forEach(([cat, items]) => {
                            rows.push(
                                <tr key={`cat-${cat}`} className="category-row">
                                    <td colSpan="4" className="category-header">{cat}</td>
                                </tr>
                            );

                            items.forEach((m) => {
                                const score = Number(m.sts || 0);
                                const ket = getKeterangan(score);
                                const catClass = getCatClass(score);

                                rows.push(
                                    <tr key={m.id}>
                                        <td style={{ textAlign: 'center', color: '#94a3b8', fontWeight: 700 }}>{String(globalIdx++).padStart(2, '0')}</td>
                                        <td style={{ fontWeight: 700, color: '#334155' }}>{m.mapel_nama}</td>
                                        <td className="score-cell">{score}</td>
                                        <td className={`description-cell ${catClass}`}>{ket}</td>
                                    </tr>
                                );
                            });
                        });

                        return rows;
                    })()}
                </tbody>
            </table>

            <div className="legend-box">
                <div className="legend-pill"><div className="dot-indicator" style={{ background: '#15803d' }}></div> Istimewa (≥85)</div>
                <div className="legend-pill"><div className="dot-indicator" style={{ background: '#1d4ed8' }}></div> Kompeten (75-84)</div>
                <div className="legend-pill"><div className="dot-indicator" style={{ background: '#b45309' }}></div> Berkembang (60-74)</div>
                <div className="legend-pill"><div className="dot-indicator" style={{ background: '#b91c1c' }}></div> Perlu Pendampingan ({'<'}60)</div>
            </div>

            <div className="date-line">
                Salatiga, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
            </div>

            <div className="signature-section">
                <div className="sig-box">
                    <div className="sig-label">Kepala Sekolah</div>
                    <div className="sig-name">{school.kepala_sekolah || '-'}</div>
                    <div className="sig-nip">NIP. {school.nip_kepsek || '-'}</div>
                </div>
                <div className="sig-box">
                    <div className="sig-label">Wali Kelas</div>
                    <div className="sig-name">{waliKelas?.nama || '-'}</div>
                    <div className="sig-nip">NIP. {waliKelas?.nip || '-'}</div>
                </div>
            </div>
        </div>
    );
};

export default STSPrintTemplate;
