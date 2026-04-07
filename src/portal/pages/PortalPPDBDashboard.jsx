import { useState, useEffect, useRef } from "react";
import { Helmet } from "react-helmet-async";
import { 
  User, FileText, CheckCircle, Save, LogOut, UploadCloud, AlertCircle, 
  MapPin, Users, Camera, ChevronRight, ChevronLeft, Home, Bell, Menu, X, 
  CheckCircle2, Loader2, Download, ExternalLink, Printer, Sparkles, FileCheck, ShieldCheck, Eye
} from "lucide-react";
import Swal from "sweetalert2";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import { QRCodeSVG } from "qrcode.react";
import { API_BASE_PUBLIC, getMediaUrl } from "../../services/api";

// Custom SVG Icons (Hoisted)
function GraduationCap({ size }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/>
    </svg>
  );
}

function MessageCircle({ size }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
    </svg>
  );
}

// Helper: Get full media URL


export default function PortalPPDBDashboard() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [step, setStep] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [announcements, setAnnouncements] = useState([]);
  const [savedFields, setSavedFields] = useState({}); // Tracking which fields just saved
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [pdfProgress, setPdfProgress] = useState(0);
  
  // Local form state
  const [form, setForm] = useState({
    nama_lengkap: "", nisn: "", tempat_lahir: "", tgl_lahir: "", 
    jenis_kelamin: "L", agama: "", no_whatsapp: "", alamat_lengkap: "",
    // Biodata Tambahan (JSON)
    nik: "", no_kk: "", anak_ke: "", jml_saudara: "", bb: "", tb: "", 
    gol_darah: "", riwayat_penyakit: "", hobby: "", cita_cita: "",
    rt: "", rw: "", dusun: "", kelurahan: "", kecamatan: "", kabupaten: "", provinsi: "", kodepos: "", jenis_tinggal: "",
    // Ayah
    nama_ayah: "", nik_ayah: "", tgl_lahir_ayah: "", pendidikan_ayah: "", pekerjaan_ayah: "", penghasilan_ayah: "", telp_ayah: "",
    // Ibu
    nama_ibu: "", nik_ibu: "", tgl_lahir_ibu: "", pendidikan_ibu: "", pekerjaan_ibu: "", penghasilan_ibu: "", telp_ibu: "",
    // Wali (Opsional)
    nama_wali: "", hubungan_wali: "", pekerjaan_wali: "", telp_wali: "", alamat_wali: ""
  });

  const saveTimeout = useRef(null);

  useEffect(() => {
    fetchDashboard();
    fetchAnnouncements();
  }, []);

  useEffect(() => {
    if (data?.status === 'accepted') {
      triggerConfetti();
    }
  }, [data?.status]);

  const fetchDashboard = async () => {
    try {
      const token = localStorage.getItem("ppdb_token");
      if (!token) return (window.location.href = "/login?redirect=/ppdb/dashboard");

      const res = await fetch(`${API_BASE_PUBLIC}/ppdb/dashboard`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      
      setData(json);
      
      // Parse biodata tambahan
      let bio = {};
      try { bio = typeof json.biodata_tambahan === 'string' ? JSON.parse(json.biodata_tambahan) : (json.biodata_tambahan || {}); } catch(e){}
      
      setForm({
        nama_lengkap: json.nama_lengkap || "",
        nisn: json.nisn || "",
        tempat_lahir: json.tempat_lahir || "",
        tgl_lahir: json.tgl_lahir ? json.tgl_lahir.split('T')[0] : "",
        jenis_kelamin: json.jenis_kelamin || "L",
        agama: json.agama || "",
        no_whatsapp: json.no_whatsapp || "",
        alamat_lengkap: json.alamat_lengkap || "",
        ...bio
      });
    } catch (err) {
      Swal.fire("Error", err.message, "error");
      if (err.message.includes("Token")) handleLogout();
    } finally {
      setLoading(false);
    }
  };

  const fetchAnnouncements = async () => {
    try {
      const res = await fetch(`${API_BASE_PUBLIC}/ppdb/announcements`);
      const json = await res.json();
      if (!json.error) setAnnouncements(json);
    } catch (e) {}
  };

  const handleInputChange = (e) => {
    if (data?.status !== 'draft') return;
    const { name, value } = e.target;
    setForm(prev => {
      const updated = { ...prev, [name]: value };
      // Auto-save logic
      if (saveTimeout.current) clearTimeout(saveTimeout.current);
      saveTimeout.current = setTimeout(() => autoSave(updated, [name]), 1500);
      return updated;
    });
  };

  const autoSave = async (currentForm, changedFields = []) => {
    if (data?.status !== 'draft') return;
    setIsSaving(true);
    try {
      const token = localStorage.getItem("ppdb_token");
      const { nama_lengkap, nisn, tempat_lahir, tgl_lahir, jenis_kelamin, agama, no_whatsapp, alamat_lengkap, ...bio } = currentForm;
      
      await fetch(`${API_BASE_PUBLIC}/ppdb/dashboard/biodata`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          nama_lengkap, nisn, tempat_lahir, tgl_lahir, jenis_kelamin, agama, no_whatsapp, alamat_lengkap,
          biodata_tambahan: bio
        }),
      });
      
      // Show success feedback for changed fields
      const newSaved = { ...savedFields };
      changedFields.forEach(f => newSaved[f] = true);
      setSavedFields(newSaved);
      
      // Clear feedback after 2 seconds
      setTimeout(() => {
        setSavedFields(prev => {
          const next = { ...prev };
          changedFields.forEach(f => delete next[f]);
          return next;
        });
      }, 2000);

    } catch (e) {
      console.error("Auto-save failed", e);
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpload = async (e, type = 'foto') => {
    if (data?.status !== 'draft') return;
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append(type === 'foto' ? "foto" : "file", file);
    if (type !== 'foto') formData.append("type", type);

    const endpoint = type === 'foto' ? "/ppdb/dashboard/upload-foto" : "/ppdb/dashboard/upload-berkas";

    setIsSaving(true);
    try {
      const token = localStorage.getItem("ppdb_token");
      const res = await fetch(`${API_BASE_PUBLIC}${endpoint}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      
      // BUG FIX: Properly merge upload response into data state
      setData(prev => {
        const updated = { ...prev, completeness_pct: json.completeness_pct ?? prev.completeness_pct };
        if (type === 'foto') {
          updated.foto_path = json.foto_path;
        } else {
          // Merge berkas_json properly
          let existingBerkas = {};
          try { existingBerkas = typeof prev.berkas_json === 'string' ? JSON.parse(prev.berkas_json) : (prev.berkas_json || {}); } catch(ex){}
          existingBerkas[type] = json.file_path;
          updated.berkas_json = existingBerkas;
        }
        return updated;
      });
      Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Upload berhasil', showConfirmButton: false, timer: 3000 });
    } catch (err) {
      Swal.fire("Gagal", err.message, "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmitFinal = async () => {
    if (data.completeness_pct < 100) {
      return Swal.fire("Belum Lengkap", "Mohon lengkapi semua data dan berkas (100%) sebelum mengirim pendaftaran.", "warning");
    }

    const res = await Swal.fire({
      title: "Kirim Pendaftaran?",
      text: "Data akan dikunci dan tidak dapat diubah lagi. Pastikan semua data sudah benar.",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Ya, Kirim Sekarang",
      cancelButtonText: "Periksa Lagi",
      confirmButtonColor: "#4f46e5"
    });

    if (res.isConfirmed) {
      setLoading(true);
      try {
        const token = localStorage.getItem("ppdb_token");
        const res = await fetch(`${API_BASE_PUBLIC}/ppdb/dashboard/submit`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = await res.json();
        if (json.error) throw new Error(json.error);
        
        // Success Sanctuary Trigger
        setData(prev => ({ ...prev, status: 'locked' })); // Local update to hide form
        triggerConfetti();
        Swal.fire({
          title: "Berhasil!",
          text: "Pendaftaran Anda telah dikirim dan sedang diverifikasi.",
          icon: "success",
          timer: 2000,
          showConfirmButton: false
        });
        fetchDashboard();
      } catch (err) {
        Swal.fire("Gagal", err.message, "error");
      } finally {
        setLoading(false);
      }
    }
  };

  const triggerConfetti = () => {
    const colors = ['#4f46e5', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444'];
    for(let i=0; i<50; i++) {
      const p = document.createElement('div');
      p.className = 'confetti-piece';
      p.style.left = Math.random() * 100 + 'vw';
      p.style.top = '-10px';
      p.style.background = colors[Math.floor(Math.random() * colors.length)];
      p.style.animationDelay = Math.random() * 2 + 's';
      p.style.borderRadius = Math.random() > 0.5 ? '50%' : '0';
      document.body.appendChild(p);
      setTimeout(() => p.remove(), 5000);
    }
  };

  const handleLogout = async () => {
    const res = await Swal.fire({
      title: "Keluar Sesi?",
      text: "Anda akan keluar dari dasbor pendaftar.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Ya, Keluar",
      cancelButtonText: "Batal",
      confirmButtonColor: "#ef4444"
    });
    if (res.isConfirmed) {
      localStorage.removeItem("ppdb_token");
      window.location.href = "/login";
    }
  };

  // MODERN PDF GENERATION HANDLER
  const handleDownloadPDF = async () => {
    setIsGeneratingPDF(true);
    setPdfProgress(10);

    try {
      // Phase 1: Preparation
      await new Promise(r => setTimeout(r, 800)); // Aesthetic delay
      setPdfProgress(40);

      const input = document.getElementById('premium-certificate-template');
      if (!input) throw new Error("Template not found");

      // Phase 2: Capturing
      setPdfProgress(60);
      const canvas = await html2canvas(input, {
        scale: 3, // High quality
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
      });
      
      // Phase 3: Generating PDF
      setPdfProgress(85);
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      
      setPdfProgress(100);
      await new Promise(r => setTimeout(r, 400));
      
      pdf.save(`Bukti_PPDB_${data?.registration_number || 'Siswa'}.pdf`);
      
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'success',
        title: 'PDF Berhasil diunduh',
        showConfirmButton: false,
        timer: 3000
      });
    } catch (err) {
      console.error("PDF Error:", err);
      Swal.fire("Gagal", "Gagal membuat PDF. Silakan coba lagi.", "error");
    } finally {
      setIsGeneratingPDF(false);
      setPdfProgress(0);
    }
  };

  const handlePrintCertificate = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <html><head><title>Bukti Penerimaan PPDB</title>
      <style>body{font-family:'Inter',sans-serif;padding:40px;max-width:600px;margin:0 auto}
      .header{text-align:center;margin-bottom:32px} h1{font-size:18px;margin:8px 0}
      .badge{background:#ecfdf5;color:#166534;padding:8px 16px;border-radius:8px;font-weight:700;display:inline-block;margin:12px 0}
      table{width:100%;border-collapse:collapse;margin:24px 0}
      td{padding:8px 12px;border-bottom:1px solid #e2e8f0;font-size:14px}
      td:first-child{font-weight:700;width:40%;color:#475569}
      .footer{text-align:center;margin-top:40px;font-size:12px;color:#94a3b8}
      @media print{body{padding:20px}}</style></head>
      <body>
        <div class="header">
          <h1>SURAT BUKTI PENERIMAAN<br/>PESERTA DIDIK BARU</h1>
          <div class="badge">✅ DITERIMA</div>
        </div>
        <table>
          <tr><td>No. Registrasi</td><td>${data?.registration_number || '-'}</td></tr>
          <tr><td>Nama Lengkap</td><td>${data?.nama_lengkap || '-'}</td></tr>
          <tr><td>NISN</td><td>${data?.nisn || '-'}</td></tr>
          <tr><td>Kelas</td><td>${data?.kelas_nama || 'Belum ditentukan'}</td></tr>
          <tr><td>Status</td><td>Diterima</td></tr>
        </table>
        <div class="footer">Dokumen ini dicetak dari Sistem PPDB Online.<br/>Tanggal cetak: ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
      </body></html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  if (loading) {
    return (
      <div className="ppdb-dashboard-root">
        <nav className="ppdb-navbar">
          <div className="ppdb-navbar-inner">
            <Skeleton width="150px" height="32px" />
            <Skeleton width="40px" height="40px" borderRadius="12px" />
          </div>
        </nav>
        <div className="ppdb-content-wrapper">
          <div className="dashboard-grid">
            <main>
              <div className="ppdb-wizard-card">
                <div className="ppdb-steps-scroll">
                  <div className="ppdb-steps-inner" style={{ padding: '15px' }}>
                    {[1,2,3,4,5].map(i => <Skeleton key={i} width="100px" height="36px" margin="0 10px 0 0" />)}
                  </div>
                </div>
                <div className="ppdb-step-content">
                  <div style={{ marginBottom: '30px' }}>
                    <Skeleton width="200px" height="24px" margin="0 0 10px 0" />
                    <Skeleton width="300px" height="16px" />
                  </div>
                  <div className="form-grid">
                    {[1,2,3,4,5,6].map(i => <div key={i}><Skeleton width="100px" height="14px" margin="0 0 8px 0" /><Skeleton width="100%" height="48px" borderRadius="16px" /></div>)}
                  </div>
                </div>
              </div>
            </main>
            <aside>
              <Skeleton width="100%" height="200px" borderRadius="20px" margin="0 0 16px 0" />
              <Skeleton width="100%" height="150px" borderRadius="20px" />
            </aside>
          </div>
        </div>
      </div>
    );
  }

  const stepsList = [
    { id: 1, label: "Data Pribadi", icon: <User size={18} /> },
    { id: 2, label: "Alamat & Kontak", icon: <MapPin size={18} /> },
    { id: 3, label: "Orang Tua / Wali", icon: <Users size={18} /> },
    { id: 4, label: "Upload Berkas", icon: <UploadCloud size={18} /> },
    { id: 5, label: "Finalisasi", icon: <CheckCircle size={18} /> }
  ];

  const berkasItems = [
    { key: 'kk', label: 'Kartu Keluarga (KK)', desc: 'Scan/Foto KK asli yang jelas' },
    { key: 'akte', label: 'Akte Kelahiran', desc: 'Scan/Foto Akte Kelahiran asli' },
    { key: 'ijazah', label: 'Ijazah / SKL', desc: 'Scan Ijazah SD/SMP atau Surat Keterangan Lulus' },
    { key: 'ktp_ortu', label: 'KTP Orang Tua', desc: 'Foto KTP Ayah & Ibu (digabung)' }
  ];

  const isLocked = data?.status !== 'draft';

  return (
    <div className="ppdb-dashboard-root">
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'radial-gradient(circle at 0% 0%, rgba(79, 70, 229, 0.03) 0%, transparent 50%), radial-gradient(circle at 100% 100%, rgba(124, 58, 237, 0.03) 0%, transparent 50%)', zIndex: -1, pointerEvents: 'none' }} />
      <Helmet><title>Dasbor PPDB | {data?.nama_lengkap}</title></Helmet>

      {/* --- PREMIUM NAVBAR --- */}
      <nav className="ppdb-navbar">

        <div className="ppdb-navbar-inner">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)', color: 'white', padding: '10px', borderRadius: '14px', display: 'flex', boxShadow: '0 4px 12px rgba(79, 70, 229, 0.3)' }}>
              <GraduationCap size={22} />
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: '1rem', fontWeight: 900, color: '#1e293b', letterSpacing: '-0.02em' }}>PPDB PORTAL</h1>
              <p style={{ margin: 0, fontSize: '0.65rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Dashboard Siswa</p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
             <div className="mobile-hide" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginRight: '8px' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1e293b' }}>{data?.nama_lengkap}</span>
                <span style={{ fontSize: '0.65rem', background: '#f1f5f9', padding: '3px 10px', borderRadius: '8px', color: '#475569', fontWeight: 800 }}>ID: {data?.registration_number}</span>
             </div>
             <button onClick={handleLogout} style={{ border: 'none', background: '#fee2e2', color: '#ef4444', padding: '10px', borderRadius: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
               <LogOut size={18} />
             </button>
          </div>
        </div>
      </nav>

      <div className="ppdb-content-wrapper">
        <div className="dashboard-grid">
          
          {/* --- MAIN CONTENT --- */}
          <main>
            {/* Success Sanctuary View */}
            {data?.status !== 'draft' && data?.status !== 'rejected' && (
              <SuccessSanctuary 
                data={data} 
                handlePrintCertificate={handleDownloadPDF} 
              />
            )}

            {/* PDF MODAL OVERLAY */}
            {isGeneratingPDF && <GeneratingOverlay progress={pdfProgress} />}

            {/* HIDDEN CERTIFICATE TEMPLATE */}
            <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
               <CertificateTemplate id="premium-certificate-template" data={data} />
            </div>

            {/* Form View (Visible only for draft) */}
            {data?.status === 'draft' && (
              <>
                {/* Announcement Banner */}
                {announcements.filter(a => a.is_active).map(a => (
                  <div key={a.id} style={{ background: a.tipe === 'warning' ? '#fffbeb' : a.tipe === 'success' ? '#f0fdf4' : '#eff6ff', border: '1px solid', borderColor: a.tipe === 'warning' ? '#fef3c7' : a.tipe === 'success' ? '#dcfce7' : '#dbeafe', padding: '16px', borderRadius: '16px', marginBottom: '20px', display: 'flex', gap: '12px' }}>
                    <Bell size={20} style={{ color: a.tipe === 'warning' ? '#d97706' : a.tipe === 'success' ? '#16a34a' : '#2563eb', flexShrink: 0 }} />
                    <div>
                      <h4 style={{ margin: '0 0 4px', fontSize: '0.9rem', fontWeight: 800, color: '#1e293b' }}>{a.judul}</h4>
                      <p style={{ margin: 0, fontSize: '0.85rem', color: '#475569', lineHeight: 1.5 }}>{a.isi}</p>
                    </div>
                  </div>
                ))}
              </>
            )}

            {/* Wizard Container */}
            <div className="ppdb-wizard-card">
              
              {/* Wizard Steps Header */}
              <div className="ppdb-steps-scroll">
                <div className="ppdb-steps-inner">
                  {stepsList.map(s => (
                    <button key={s.id} onClick={() => setStep(s.id)} className={`ppdb-step-btn ${step === s.id ? 'active' : ''} ${(step > s.id || isLocked) ? 'done' : ''}`}>
                      <div className="ppdb-step-num">
                        {(step > s.id || isLocked) ? '✓' : s.id}
                      </div>
                      <span className="ppdb-step-label">{s.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Step Content */}
              <div className="ppdb-step-content">
                
                {/* STEP 1: DATA PRIBADI */}
                {step === 1 && (
                  <div className="animate-fade-in">
                    <SectionLabel icon={<User />} title="Informasi Identitas" desc="Perbaiki data sesuai Akta Kelahiran/KK" />
                    
                    <div style={{ background: 'rgba(255,255,255,0.4)', padding: '20px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.5)', marginBottom: '20px' }}>
                      <h4 style={{ fontSize: '0.8rem', fontWeight: 800, color: '#4f46e5', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Identitas Utama</h4>
                      <div className="form-grid">
                        <Input label="Nama Lengkap" name="nama_lengkap" value={form.nama_lengkap} onChange={handleInputChange} disabled={isLocked} required savedFields={savedFields} />
                        <Input label="NISN" name="nisn" value={form.nisn} onChange={handleInputChange} disabled={isLocked} placeholder="10 Digit" savedFields={savedFields} />
                        <Input label="NIK" name="nik" value={form.nik} onChange={handleInputChange} disabled={isLocked} placeholder="16 Digit" savedFields={savedFields} />
                        <div className="form-row">
                          <Input label="Tempat Lahir" name="tempat_lahir" value={form.tempat_lahir} onChange={handleInputChange} disabled={isLocked} savedFields={savedFields} />
                          <Input label="Tanggal Lahir" name="tgl_lahir" type="date" value={form.tgl_lahir} onChange={handleInputChange} disabled={isLocked} savedFields={savedFields} />
                        </div>
                      </div>
                    </div>

                    <div style={{ background: 'rgba(255,255,255,0.4)', padding: '20px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.5)', marginBottom: '20px' }}>
                      <h4 style={{ fontSize: '0.8rem', fontWeight: 800, color: '#4f46e5', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Detail Personal</h4>
                      <div className="form-grid">
                        <div className="form-row">
                          <Select label="Jenis Kelamin" name="jenis_kelamin" value={form.jenis_kelamin} onChange={handleInputChange} disabled={isLocked} savedFields={savedFields}>
                            <option value="L">Laki-laki</option>
                            <option value="P">Perempuan</option>
                          </Select>
                          <Input label="Agama" name="agama" value={form.agama} onChange={handleInputChange} disabled={isLocked} savedFields={savedFields} />
                        </div>
                        <div className="form-row">
                          <Input label="Anak Ke" name="anak_ke" type="number" value={form.anak_ke} onChange={handleInputChange} disabled={isLocked} savedFields={savedFields} />
                          <Input label="Jml Saudara" name="jml_saudara" type="number" value={form.jml_saudara} onChange={handleInputChange} disabled={isLocked} savedFields={savedFields} />
                        </div>
                        <div className="form-row">
                          <Input label="Tinggi Badan (cm)" name="tb" type="number" value={form.tb} onChange={handleInputChange} disabled={isLocked} savedFields={savedFields} />
                          <Input label="Berat Badan (kg)" name="bb" type="number" value={form.bb} onChange={handleInputChange} disabled={isLocked} savedFields={savedFields} />
                        </div>
                        <div className="form-row">
                           <Select label="Golongan Darah" name="gol_darah" value={form.gol_darah} onChange={handleInputChange} disabled={isLocked} savedFields={savedFields}>
                              <option value="">Pilih</option>
                              <option value="A">A</option><option value="B">B</option><option value="AB">AB</option><option value="O">O</option>
                           </Select>
                           <Input label="Cita-cita" name="cita_cita" value={form.cita_cita} onChange={handleInputChange} disabled={isLocked} savedFields={savedFields} />
                        </div>
                        <div className="span-full">
                          <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#475569', marginBottom: '8px', display: 'flex', justifyContent: 'space-between' }}>
                             Riwayat Penyakit (Jika ada)
                             {savedFields.riwayat_penyakit && <span style={{ color: '#10b981', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: 4 }}><CheckCircle2 size={10} /> Tersimpan</span>}
                          </label>
                          <textarea name="riwayat_penyakit" value={form.riwayat_penyakit} onChange={handleInputChange} disabled={isLocked} className={`ppdb-textarea ${savedFields.riwayat_penyakit ? 'input-success-glow' : ''}`}></textarea>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 2: ALAMAT & KONTAK */}
                {step === 2 && (
                  <div className="animate-fade-in">
                    <SectionLabel icon={<MapPin />} title="Domisili & Kontak" desc="Pastikan nomor WA aktif untuk notifikasi" />
                    <div className="form-grid">
                      <div className="span-full">
                        <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#475569', marginBottom: '8px', display: 'flex', justifyContent: 'space-between' }}>
                           Alamat Lengkap (Blok/No/Jalan)
                           {savedFields.alamat_lengkap && <span style={{ color: '#10b981', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: 4 }}><CheckCircle2 size={10} /> Tersimpan</span>}
                        </label>
                        <textarea name="alamat_lengkap" value={form.alamat_lengkap} onChange={handleInputChange} disabled={isLocked} className={`ppdb-textarea ${savedFields.alamat_lengkap ? 'input-success-glow' : ''}`}></textarea>
                      </div>
                      <div className="form-row">
                        <Input label="RT" name="rt" value={form.rt} onChange={handleInputChange} disabled={isLocked} savedFields={savedFields} />
                        <Input label="RW" name="rw" value={form.rw} onChange={handleInputChange} disabled={isLocked} savedFields={savedFields} />
                      </div>
                      <Input label="Dusun / Lingkungan" name="dusun" value={form.dusun} onChange={handleInputChange} disabled={isLocked} savedFields={savedFields} />
                      <Input label="Kelurahan / Desa" name="kelurahan" value={form.kelurahan} onChange={handleInputChange} disabled={isLocked} savedFields={savedFields} />
                      <div className="form-row">
                        <Input label="Kecamatan" name="kecamatan" value={form.kecamatan} onChange={handleInputChange} disabled={isLocked} savedFields={savedFields} />
                        <Input label="Kabupaten / Kota" name="kabupaten" value={form.kabupaten} onChange={handleInputChange} disabled={isLocked} savedFields={savedFields} />
                      </div>
                      <div className="form-row">
                        <Input label="Provinsi" name="provinsi" value={form.provinsi} onChange={handleInputChange} disabled={isLocked} savedFields={savedFields} />
                        <Input label="Kode Pos" name="kodepos" value={form.kodepos} onChange={handleInputChange} disabled={isLocked} savedFields={savedFields} />
                      </div>
                      <Select label="Jenis Tinggal" name="jenis_tinggal" value={form.jenis_tinggal} onChange={handleInputChange} disabled={isLocked} savedFields={savedFields}>
                        <option value="">Pilih</option>
                        <option value="Bersama Orang Tua">Bersama Orang Tua</option>
                        <option value="Wali">Wali / Saudara</option>
                        <option value="Kost">Kost</option>
                        <option value="Asrama">Asrama</option>
                      </Select>
                      <Input label="No. WhatsApp" name="no_whatsapp" value={form.no_whatsapp} onChange={handleInputChange} disabled={isLocked} required savedFields={savedFields} />
                    </div>
                  </div>
                )}

                {/* STEP 3: ORANG TUA */}
                {step === 3 && (
                  <div className="animate-fade-in">
                    {/* AYAH */}
                    <div style={{ marginBottom: '32px' }}>
                      <SectionLabel icon={<Users />} title="Data Ayah Kandung" />
                      <div className="form-grid">
                        <Input label="Nama Lengkap Ayah" name="nama_ayah" value={form.nama_ayah} onChange={handleInputChange} disabled={isLocked} savedFields={savedFields} />
                        <Input label="NIK Ayah" name="nik_ayah" value={form.nik_ayah} onChange={handleInputChange} disabled={isLocked} savedFields={savedFields} />
                        <div className="form-row">
                           <Input label="Pendidikan" name="pendidikan_ayah" value={form.pendidikan_ayah} onChange={handleInputChange} disabled={isLocked} savedFields={savedFields} />
                           <Input label="Pekerjaan" name="pekerjaan_ayah" value={form.pekerjaan_ayah} onChange={handleInputChange} disabled={isLocked} savedFields={savedFields} />
                        </div>
                        <div className="form-row">
                           <Input label="Penghasilan / Bulan" name="penghasilan_ayah" value={form.penghasilan_ayah} onChange={handleInputChange} disabled={isLocked} savedFields={savedFields} />
                           <Input label="No. Telp/WA" name="telp_ayah" value={form.telp_ayah} onChange={handleInputChange} disabled={isLocked} savedFields={savedFields} />
                        </div>
                      </div>
                    </div>
                    {/* IBU */}
                    <div style={{ marginBottom: '32px' }}>
                      <SectionLabel icon={<Users />} title="Data Ibu Kandung" />
                      <div className="form-grid">
                        <Input label="Nama Lengkap Ibu" name="nama_ibu" value={form.nama_ibu} onChange={handleInputChange} disabled={isLocked} savedFields={savedFields} />
                        <Input label="NIK Ibu" name="nik_ibu" value={form.nik_ibu} onChange={handleInputChange} disabled={isLocked} savedFields={savedFields} />
                        <div className="form-row">
                           <Input label="Pendidikan" name="pendidikan_ibu" value={form.pendidikan_ibu} onChange={handleInputChange} disabled={isLocked} savedFields={savedFields} />
                           <Input label="Pekerjaan" name="pekerjaan_ibu" value={form.pekerjaan_ibu} onChange={handleInputChange} disabled={isLocked} savedFields={savedFields} />
                        </div>
                        <div className="form-row">
                           <Input label="Penghasilan / Bulan" name="penghasilan_ibu" value={form.penghasilan_ibu} onChange={handleInputChange} disabled={isLocked} savedFields={savedFields} />
                           <Input label="No. Telp/WA" name="telp_ibu" value={form.telp_ibu} onChange={handleInputChange} disabled={isLocked} savedFields={savedFields} />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 4: UPLOAD BERKAS */}
                {step === 4 && (
                  <div className="animate-fade-in">
                    <SectionLabel icon={<UploadCloud />} title="Upload Berkas Persyaratan" desc="Pastikan format gambar/PDF jelas dan terbaca" />
                    
                    <div className="file-grid">
                      {/* Foto */}
                      <div className="file-card">
                         <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                            <div style={{ width: '60px', height: '80px', background: '#f1f5f9', borderRadius: '8px', overflow: 'hidden', flexShrink: 0, border: '2px dashed #cbd5e1' }}>
                               {data?.foto_path ? <img src={getMediaUrl(data.foto_path)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}><Camera size={20} /></div>}
                            </div>
                            <div style={{ flex: 1 }}>
                               <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 800 }}>Pas Foto</h4>
                               <p style={{ margin: '2px 0 10px', fontSize: '0.75rem', color: '#64748b' }}>Background Merah/Biru, Max 2MB</p>
                               {isLocked ? (
                                 <span className="badge-success">Tersimpan</span>
                               ) : (
                                 <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                   <label className="btn-upload" style={{ background: data?.foto_path ? '#ecfdf5' : 'white', borderColor: data?.foto_path ? '#10b981' : '#e2e8f0', color: data?.foto_path ? '#10b981' : '#475569' }}>
                                     <input type="file" hidden accept="image/*" onChange={(e) => handleUpload(e, 'foto')} />
                                     <UploadCloud size={14} /> {data?.foto_path ? 'Ganti' : 'Upload'}
                                   </label>
                                   {data?.foto_path && (
                                     <a href={getMediaUrl(data.foto_path)} target="_blank" className="btn-view" style={{ flex: 1, justifyContent: 'center', background: '#f1f5f9', color: '#64748b', border: '1px solid #e2e8f0' }}>
                                       <Eye size={14} /> Lihat
                                     </a>
                                   )}
                                 </div>
                               )}
                            </div>
                         </div>
                      </div>

                      {/* Other Documents */}
                      {berkasItems.map(item => {
                        const berkasObj = typeof data?.berkas_json === 'string' ? JSON.parse(data.berkas_json || '{}') : (data?.berkas_json || {});
                        const isUploaded = berkasObj[item.key];
                        return (
                          <div key={item.key} className="file-card">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
                               <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 800 }}>{item.label}</h4>
                               {isUploaded && <CheckCircle2 size={18} className="text-emerald-500" />}
                            </div>
                            <p style={{ margin: '0 0 12px', fontSize: '0.75rem', color: '#64748b', lineHeight: 1.4 }}>{item.desc}</p>
                            {isLocked ? (
                               isUploaded ? <a href={getMediaUrl(isUploaded)} target="_blank" className="btn-view"><Download size={14} /> Lihat File</a> : <span className="text-slate-400 text-xs italic">Tidak ada file</span>
                            ) : (
                              <label className="btn-upload" style={{ background: isUploaded ? '#ecfdf5' : 'white', borderColor: isUploaded ? '#10b981' : '#e2e8f0', color: isUploaded ? '#10b981' : '#475569' }}>
                                 <input type="file" hidden onChange={(e) => handleUpload(e, item.key)} />
                                 {isUploaded ? 'Ganti File' : 'Pilih File'}
                              </label>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* STEP 5: FINALISASI */}
                {step === 5 && (
                  <div className="animate-fade-in text-center" style={{ padding: '20px 0' }}>
                    <div style={{ width: '80px', height: '80px', background: '#ecfdf5', color: '#10b981', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                      <CheckCircle2 size={48} />
                    </div>
                    <h3 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#1e293b', marginBottom: '8px' }}>Finalisasi Pendaftaran</h3>
                    <p style={{ color: '#64748b', maxWidth: '450px', margin: '0 auto 32px', lineHeight: 1.6 }}>Review kembali semua data yang sudah Anda isi. Jika sudah yakin, klik tombol di bawah untuk mengirim pendaftaran ke panitia.</p>
                    
                    <div className="review-box" style={{ background: '#f8fafc', borderRadius: '20px', padding: '24px', textAlign: 'left', marginBottom: '32px' }}>
                       <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                          <span style={{ fontWeight: 700, color: '#475569' }}>Kelengkapan Data</span>
                          <span style={{ fontWeight: 800, color: data.completeness_pct === 100 ? '#10b981' : '#f59e0b' }}>{data.completeness_pct}%</span>
                       </div>
                       <div style={{ height: '10px', background: '#e2e8f0', borderRadius: '5px', overflow: 'hidden', position: 'relative' }}>
                          <div style={{ width: `${data.completeness_pct}%`, height: '100%', background: 'linear-gradient(90deg, #4f46e5, #8b5cf6)', borderRadius: '5px', transition: 'width 0.5s', position: 'relative' }}>
                             <div className="btn-primary-large" style={{ position: 'absolute', inset: 0, opacity: 0.3, background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)', backgroundSize: '200% 100%', animation: 'ppdbShimmer 2s infinite' }}></div>
                          </div>
                       </div>
                    </div>

                    {!isLocked ? (
                      <button onClick={handleSubmitFinal} className="btn-primary-large" style={{ width: '100%', maxWidth: '300px' }}>
                         Kirim Pendaftaran
                      </button>
                    ) : (
                      <div style={{ background: '#dcfce7', color: '#166534', padding: '16px', borderRadius: '16px', fontWeight: 700, display: 'inline-block' }}>
                         ✅ Pendaftaran Sudah Terkirim
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="ppdb-step-footer">
                <button onClick={() => setStep(s => Math.max(1, s-1))} disabled={step === 1} className="btn-nav" style={{ flexShrink: 0 }}>
                  <ChevronLeft size={20} /> <span className="mobile-hide">Sebelumnya</span>
                </button>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                   {isSaving && <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>
                      <Loader2 className="animate-spin" size={12} /> <span className="mobile-hide">Menyimpan...</span>
                   </div>}
                   {!isSaving && <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: '#10b981', fontWeight: 600 }}>
                      <CheckCircle2 size={12} /> <span className="mobile-hide">Tersimpan</span>
                   </div>}
                </div>

                <button onClick={() => setStep(s => Math.min(5, s+1))} disabled={step === 5} className="btn-nav btn-nav-primary" style={{ flexShrink: 0 }}>
                  <span>{step === 4 ? 'Terakhir' : 'Lanjut'}</span> <ChevronRight size={20} />
                </button>
              </div>
            </div>
          </main>

          {/* --- SIDEBAR --- */}
          <aside>
            {/* Status Card */}
            <div className="ppdb-status-card">
               <h3 style={{ margin: '0 0 20px', fontSize: '1rem', fontWeight: 800, color: '#1e293b' }}>Status Pendaftaran</h3>
               
               <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <StatusItem active={true} done={true} label="Registrasi Akun" date={data?.created_at} />
                  <StatusItem active={data?.completeness_pct >= 100} done={data?.completeness_pct >= 100} label="Lengkapi Biodata" />
                  <StatusItem active={data?.status !== 'draft'} done={data?.status !== 'draft'} label="Verifikasi Panitia" />
                  <StatusItem active={data?.status === 'accepted'} done={data?.status === 'accepted'} label="Hasil Seleksi" />
               </div>

               {data?.status === 'accepted' && (
                 <div style={{ marginTop: '24px', padding: '16px', background: 'rgba(79, 70, 229, 0.05)', borderRadius: '16px', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#4f46e5', textTransform: 'uppercase', marginBottom: '4px' }}>Selamat! Anda Diterima</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#1e293b' }}>{data?.kelas_nama || 'Kelas Belum Ditentukan'}</div>
                    <button onClick={handleDownloadPDF} style={{ marginTop: '12px', width: '100%', background: 'white', border: '2px solid #4f46e5', color: '#4f46e5', padding: '8px', borderRadius: '10px', fontSize: '0.85rem', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer' }}>
                       <Download size={16} /> Unduh Bukti Lulus (PDF)
                    </button>
                 </div>
               )}
            </div>

            {/* Help Card */}
            <div className="ppdb-help-card">
               <h3 style={{ margin: '0 0 8px', fontSize: '1.1rem', fontWeight: 800 }}>Butuh Bantuan?</h3>
               <p style={{ margin: '0 0 20px', fontSize: '0.85rem', opacity: 0.9, lineHeight: 1.5 }}>Hubungi tim panitia PPDB jika mengalami kesulitan teknis.</p>
               <a href={`https://wa.me/${data?.contact_wa || ''}`} target="_blank" className="btn-help">
                  <MessageCircle size={18} /> Chat Panitia
               </a>
            </div>
          </aside>

      </div>{/* dashboard-grid */}
      </div>{/* ppdb-content-wrapper */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');

        *, *::before, *::after { box-sizing: border-box; }

        .ppdb-dashboard-root {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          background: #f8fafc;
          min-height: 100vh;
          padding-bottom: 120px;
          overflow-x: hidden;
          width: 100%;
          --ppdb-primary: #4f46e5;
          --ppdb-primary-light: rgba(79, 70, 229, 0.08);
          --ppdb-primary-glow: rgba(79, 70, 229, 0.15);
          --ppdb-accent: #7c3aed;
          --ppdb-success: #10b981;
          --ppdb-border: rgba(226, 232, 240, 0.6);
          --ppdb-glass: rgba(255, 255, 255, 0.7);
          --ppdb-glass-border: rgba(255, 255, 255, 0.4);
        }

        .skeleton-loader {
          background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%);
          background-size: 200% 100%;
          animation: ppdbSkeleton 1.5s infinite;
          border-radius: 12px;
        }

        /* === NAVBAR === */
        .ppdb-navbar {
          background: rgba(255, 255, 255, 0.85);
          backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);
          border-bottom: 1px solid var(--ppdb-border);
          position: sticky; top: 0; z-index: 100;
          padding: 0 16px;
        }
        .ppdb-navbar-inner {
          max-width: 1200px; margin: 0 auto; height: 56px;
          display: flex; align-items: center; justify-content: space-between;
        }

        /* === CONTENT WRAPPER === */
        .ppdb-content-wrapper {
          max-width: 1200px; margin: 16px auto; padding: 0 12px;
          width: 100%;
        }

        /* === DASHBOARD GRID === */
        .dashboard-grid {
          display: grid; grid-template-columns: 1fr; gap: 16px;
          align-items: start; width: 100%;
          animation: ppdbSlideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1);
        }
        @media (min-width: 992px) {
          .dashboard-grid { grid-template-columns: minmax(0, 1fr) 340px; gap: 24px; }
          .ppdb-content-wrapper { padding: 0 16px; margin: 24px auto; }
          .ppdb-navbar-inner { height: 64px; }
        }

        /* === WIZARD CARD === */
        .ppdb-wizard-card {
          background: var(--ppdb-glass);
          backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);
          border-radius: 24px; overflow: hidden;
          border: 1px solid var(--ppdb-glass-border);
          box-shadow: 0 10px 40px -10px rgba(0,0,0,0.08);
        }

        /* === WIZARD TAB SCROLL === */
        .ppdb-steps-scroll {
          width: 100%; overflow-x: auto; overflow-y: hidden;
          border-bottom: 1px solid #f1f5f9; background: #fff;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: none;
        }
        .ppdb-steps-scroll::-webkit-scrollbar { display: none; }
        .ppdb-steps-inner {
          display: flex; padding: 10px; gap: 6px;
          min-width: max-content;
        }

        /* === STEP BUTTONS === */
        .ppdb-step-btn {
          display: flex; align-items: center; gap: 8px;
          padding: 8px 14px; border: none; border-radius: 12px;
          background: transparent; cursor: pointer;
          color: #94a3b8; transition: all 0.2s;
          white-space: nowrap; flex-shrink: 0;
          font-family: inherit;
        }
        .ppdb-step-btn.active {
          background: rgba(79, 70, 229, 0.08); color: #4f46e5;
        }
        .ppdb-step-btn.done { color: #64748b; }
        .ppdb-step-num {
          width: 26px; height: 26px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-size: 0.75rem; font-weight: 900; color: white; flex-shrink: 0;
          background: #e2e8f0;
        }
        .ppdb-step-btn.active .ppdb-step-num {
          background: #4f46e5;
          box-shadow: 0 3px 8px rgba(79, 70, 229, 0.3);
        }
        .ppdb-step-btn.done .ppdb-step-num { background: #10b981; }
        .ppdb-step-label { font-size: 0.8rem; font-weight: 800; }

        /* On mobile: hide labels, show only step circles in compact row */
        @media (max-width: 640px) {
          .ppdb-steps-inner {
            min-width: 0; width: 100%;
            justify-content: space-between;
            gap: 4px; padding: 8px;
          }
          .ppdb-step-btn {
            padding: 6px 8px; gap: 0;
            flex: 1; justify-content: center;
          }
          .ppdb-step-label { display: none; }
          .ppdb-step-num { width: 30px; height: 30px; font-size: 0.8rem; }
        }
        @media (min-width: 641px) {
          .ppdb-steps-inner { min-width: max-content; }
        }

        /* === STEP CONTENT === */
        .ppdb-step-content { padding: 20px 16px; }
        @media (min-width: 768px) { .ppdb-step-content { padding: 24px; } }

        /* === STEP FOOTER (prev/next) === */
        .ppdb-step-footer {
          padding: 12px 16px; background: #f8fafc;
          border-top: 1px solid #f1f5f9;
          display: flex; justify-content: space-between; align-items: center;
        }

        /* === SIDEBAR CARDS === */
        .ppdb-status-card {
          background: var(--ppdb-glass);
          backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
          border-radius: 24px; padding: 24px;
          border: 1px solid var(--ppdb-glass-border);
          box-shadow: 0 8px 32px rgba(0,0,0,0.04);
          margin-bottom: 20px;
        }
        .ppdb-help-card {
          background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
          border-radius: 20px; padding: 20px; color: white;
          box-shadow: 0 8px 20px -4px rgba(79, 70, 229, 0.3);
        }

        /* === TEXTAREA === */
        .ppdb-textarea {
          width: 100%; padding: 12px 14px; border-radius: 14px;
          border: 1px solid #e2e8f0; min-height: 80px;
          font-size: 0.9rem; font-family: inherit; resize: vertical;
          transition: all 0.3s; background: #fff;
          box-shadow: 0 2px 4px rgba(0,0,0,0.02);
        }

        /* === FORM GRIDS === */
        .form-grid { display: grid; grid-template-columns: 1fr; gap: 14px; }
        .form-row { display: grid; grid-template-columns: 1fr; gap: 14px; }
        .file-grid { display: grid; grid-template-columns: 1fr; gap: 14px; }
        .span-full { grid-column: 1 / -1; }

        @media (min-width: 768px) {
          .form-grid { grid-template-columns: 1fr 1fr; gap: 16px 24px; }
          .form-row { grid-template-columns: 1fr 1fr; gap: 16px; }
          .file-grid { grid-template-columns: repeat(2, 1fr); gap: 16px; }
        }

        /* === ANIMATIONS === */
        .animate-fade-in { animation: ppdbFadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
        @keyframes ppdbFadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes ppdbSlideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes ppdbPulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        @keyframes ppdbShimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        @keyframes ppdbGlowPulse {
          0% { box-shadow: 0 0 0 0 var(--ppdb-primary-glow); }
          50% { box-shadow: 0 0 0 8px var(--ppdb-primary-glow); }
          100% { box-shadow: 0 0 0 0 var(--ppdb-primary-glow); }
        }
        @keyframes ppdbSkeleton {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        @keyframes ppdbConfetti {
          0% { transform: translateY(0) rotate(0); opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
        .confetti-piece {
          position: fixed; width: 10px; height: 10px; border-radius: 2px;
          z-index: 2000; pointer-events: none;
          animation: ppdbConfetti 3s ease-out forwards;
        }
        @keyframes ppdbScaleIn {
          from { transform: scale(0.9); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }

        /* === INPUT FOCUS GLOW === */
        .portal-input-clean:focus,
        .ppdb-dashboard-root select:focus,
        .ppdb-textarea:focus {
          border-color: var(--ppdb-primary) !important;
          box-shadow: 0 0 0 4px var(--ppdb-primary-glow), 0 4px 12px rgba(79, 70, 229, 0.08) !important;
          outline: none !important;
          background: white !important;
        }
        
        .input-success-glow {
          animation: ppdbGlowPulse 1.5s ease-in-out;
          border-color: #10b981 !important;
        }

        /* === BUTTONS === */
        .btn-upload {
          display: flex; align-items: center; justify-content: center; gap: 8px;
          padding: 10px 16px; border: 2px dashed #cbd5e1; border-radius: 12px;
          font-size: 0.85rem; font-weight: 700; cursor: pointer;
          background: #fafbfc; color: #475569;
          transition: all 0.2s;
        }
        .btn-upload:hover {
          background: var(--ppdb-primary-light); border-color: var(--ppdb-primary);
          color: var(--ppdb-primary);
        }
        .btn-nav {
          border: 1px solid var(--ppdb-border); background: white; color: #475569;
          padding: 10px 16px; border-radius: 12px; font-weight: 700;
          display: flex; align-items: center; gap: 6px; cursor: pointer;
          transition: all 0.2s; font-size: 0.85rem;
        }
        .btn-nav:disabled { opacity: 0.4; cursor: not-allowed; }
        .btn-nav-primary {
          background: linear-gradient(135deg, var(--ppdb-primary) 0%, var(--ppdb-accent) 100%);
          color: white; border: none;
          box-shadow: 0 4px 12px rgba(79, 70, 229, 0.25);
        }
        .btn-primary-large {
          background: linear-gradient(135deg, var(--ppdb-primary) 0%, var(--ppdb-accent) 100%);
          color: white; border: none; padding: 14px 28px; border-radius: 14px;
          font-size: 1rem; font-weight: 800; cursor: pointer;
          box-shadow: 0 8px 20px -4px rgba(79, 70, 229, 0.4);
          transition: all 0.2s; position: relative; overflow: hidden;
        }
        .btn-primary-large::after {
          content: ''; position: absolute; inset: 0;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
          background-size: 200% 100%; animation: ppdbShimmer 3s infinite;
        }
        .btn-help {
          background: rgba(255,255,255,0.15); backdrop-filter: blur(8px);
          border: 1px solid rgba(255,255,255,0.25); color: white;
          padding: 12px; border-radius: 12px;
          display: flex; align-items: center; justify-content: center;
          gap: 8px; text-decoration: none; font-weight: 800; transition: all 0.2s;
        }
        .btn-help:hover { background: rgba(255,255,255,0.25); }
        .btn-view {
          display: inline-flex; align-items: center; gap: 6px; padding: 8px 14px;
          background: var(--ppdb-primary-light); color: var(--ppdb-primary);
          border-radius: 10px; font-size: 0.8rem; font-weight: 700;
          text-decoration: none; transition: all 0.2s;
        }
        .badge-success {
          display: inline-flex; align-items: center; gap: 4px; padding: 4px 12px;
          background: #ecfdf5; color: #059669; border-radius: 8px;
          font-size: 0.75rem; font-weight: 700;
        }

        /* === FILE CARDS === */
        .file-card {
          padding: 16px; border: 1px solid var(--ppdb-border); border-radius: 14px;
          background: white; transition: all 0.2s;
          position: relative; overflow: hidden;
        }
        .file-card::before {
          content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px;
          background: linear-gradient(90deg, var(--ppdb-primary), var(--ppdb-accent));
          opacity: 0; transition: opacity 0.3s;
        }
        .file-card:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.08); }
        .file-card:hover::before { opacity: 1; }

        /* === MOBILE HIDE === */
        .mobile-hide { }
        .mobile-nav { display: none; }

        /* === MOBILE RESPONSIVE === */
        @media (max-width: 991px) {
          .mobile-hide { display: none !important; }

          .ppdb-dashboard-root { padding-bottom: 100px !important; }

          aside { width: 100%; }
          .ppdb-status-card { padding: 16px; }
          .ppdb-help-card { padding: 16px; }

          .mobile-nav {
            display: flex; position: fixed;
            bottom: 16px; left: 12px; right: 12px;
            height: 64px;
            background: rgba(255, 255, 255, 0.92);
            backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
            border-radius: 18px;
            box-shadow: 0 8px 32px rgba(0,0,0,0.12);
            z-index: 1000; padding: 0 4px;
            align-items: center; justify-content: space-around;
            animation: ppdbSlideUpNav 0.4s cubic-bezier(0.16, 1, 0.3, 1);
          }
          @keyframes ppdbSlideUpNav {
            from { transform: translateY(80px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
          }
          .mobile-nav-item {
            display: flex; flex-direction: column; align-items: center;
            gap: 2px; color: #94a3b8; font-size: 0.6rem; font-weight: 700;
            cursor: pointer; padding: 8px 4px; border-radius: 12px;
            transition: all 0.2s; flex: 1; position: relative;
          }
          .mobile-nav-item.active {
            color: var(--ppdb-primary);
            background: var(--ppdb-primary-light);
          }
          .mobile-nav-item.active::after {
            content: ''; position: absolute; bottom: 4px;
            width: 4px; height: 4px; border-radius: 50%;
            background: var(--ppdb-primary);
          }
        }

        @media (max-width: 480px) {
          .ppdb-content-wrapper { padding: 0 8px; margin: 12px auto; }
          .ppdb-step-content { padding: 16px 12px; }
          .ppdb-step-footer { padding: 10px 12px; }
          .ppdb-wizard-card { border-radius: 16px; }
          .ppdb-status-card { border-radius: 16px; padding: 14px; }
          .ppdb-help-card { border-radius: 16px; padding: 14px; }
          .file-card { padding: 14px; }
          .btn-nav { padding: 8px 12px; font-size: 0.8rem; }
        }
      `}</style>

      {/* --- STICKY BOTTOM NAV (MOBILE) --- */}
      <div className="mobile-nav">
        <div className={`mobile-nav-item ${step === 1 ? 'active' : ''}`} onClick={() => setStep(1)}>
          <User size={20} />
          <span>Profil</span>
        </div>
        <div className={`mobile-nav-item ${step === 2 || step === 3 ? 'active' : ''}`} onClick={() => setStep(2)}>
          <MapPin size={20} />
          <span>Data</span>
        </div>
        <div className={`mobile-nav-item ${step === 4 ? 'active' : ''}`} onClick={() => setStep(4)}>
          <UploadCloud size={20} />
          <span>Berkas</span>
        </div>
        <div className={`mobile-nav-item ${step === 5 ? 'active' : ''}`} onClick={() => setStep(5)}>
          <CheckCircle size={20} />
          <span>Selesai</span>
        </div>
      </div>
    </div>
  );
}

// Sub-components
function SectionLabel({ icon, title, desc }) {
  return (
    <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', alignItems: 'start' }}>
      <div style={{ color: '#4f46e5', flexShrink: 0 }}>{icon}</div>
      <div>
        <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#1e293b' }}>{title}</h3>
        {desc && <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: '#64748b' }}>{desc}</p>}
      </div>
    </div>
  );
}

function Input({ label, name, ...props }) {
  const isSaved = props.savedFields?.[name];
  return (
    <div style={{ marginBottom: '4px' }}>
      <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#475569', marginBottom: '8px', display: 'flex', justifyContent: 'space-between' }}>
        {label}
        {isSaved && <span style={{ color: '#10b981', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: 4 }}><CheckCircle2 size={10} /> Tersimpan</span>}
      </label>
      <input 
        className={`portal-input-clean ${isSaved ? 'input-success-glow' : ''}`}
        name={name}
        style={{ 
          width: '100%', padding: '14px', borderRadius: '16px', 
          border: '1px solid #e2e8f0', fontSize: '0.95rem', outline: 'none', 
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          background: '#fff',
          boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
        }}
        {...props} 
      />
    </div>
  );
}

function Select({ label, name, children, ...props }) {
  const isSaved = props.savedFields?.[name];
  return (
    <div style={{ marginBottom: '4px' }}>
      <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#475569', marginBottom: '8px', display: 'flex', justifyContent: 'space-between' }}>
        {label}
        {isSaved && <span style={{ color: '#10b981', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: 4 }}><CheckCircle2 size={10} /> Tersimpan</span>}
      </label>
      <select 
        className={isSaved ? 'input-success-glow' : ''}
        name={name}
        style={{ 
          width: '100%', padding: '14px', borderRadius: '16px', 
          border: '1px solid #e2e8f0', fontSize: '0.95rem', outline: 'none', 
          background: 'white', transition: 'all 0.3s',
          boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
        }}
        {...props}
      >
        {children}
      </select>
    </div>
  );
}

function Skeleton({ width, height, borderRadius = '12px', margin = '0' }) {
  return <div className="skeleton-loader" style={{ width, height, borderRadius, margin }} />;
}

function StatusItem({ active, done, label, date }) {
  return (
    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
      <div style={{ 
        width: '24px', height: '24px', borderRadius: '50%', flexShrink: 0,
        background: done ? '#ecfdf5' : (active ? '#eff6ff' : '#f1f5f9'),
        color: done ? '#10b981' : (active ? '#3b82f6' : '#94a3b8'),
        display: 'flex', alignItems: 'center', justifyContent: 'center'
      }}>
        {done ? <CheckCircle2 size={16} /> : <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'currentColor' }} />}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: '0.85rem', fontWeight: 700, color: active ? '#1e293b' : '#94a3b8' }}>{label}</div>
        {date && <div style={{ fontSize: '0.65rem', color: '#64748b' }}>{new Date(date).toLocaleDateString('id-ID')}</div>}
      </div>
    </div>
  );
}

function SuccessSanctuary({ data, handlePrintCertificate }) {
  const isAccepted = data?.status === 'accepted';

  return (
    <div className="animate-fade-in" style={{ animation: 'ppdbScaleIn 0.8s' }}>
      {/* MONUMENTAL CARD */}
      <div className="ppdb-wizard-card" style={{ 
        padding: '0', 
        textAlign: 'center', 
        background: 'white',
        overflow: 'hidden'
      }}>
        {/* Celebratory Header if Accepted */}
        {isAccepted && (
          <div style={{ 
            background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #4338ca 100%)',
            padding: '60px 20px',
            color: 'white',
            position: 'relative',
            overflow: 'hidden'
          }}>
             {/* Royal Pattern Overlay */}
             <div style={{ position: 'absolute', inset: 0, opacity: 0.1, backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>
             
             <div style={{ position: 'relative', zIndex: 1 }}>
                <div style={{ 
                  width: '80px', height: '80px', background: 'rgba(255,255,255,0.2)', 
                  borderRadius: '50%', display: 'flex', alignItems: 'center', 
                  justifyContent: 'center', margin: '0 auto 20px',
                  border: '2px solid rgba(255,255,255,0.4)',
                  boxShadow: '0 0 30px rgba(0,0,0,0.1)'
                }}>
                  <GraduationCap size={40} />
                </div>
                <h2 style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: '8px', letterSpacing: '-0.04em' }}>SELAMAT!</h2>
                <p style={{ fontSize: '1.1rem', fontWeight: 600, opacity: 0.9 }}>Anda Dinyatakan Diterima di Instansi Kami</p>
             </div>

             {/* Sparkle Decorations */}
             <div style={{ position: 'absolute', top: '20%', left: '10%', animation: 'ppdbPulse 2s infinite' }}><CheckCircle2 size={24} style={{ opacity: 0.3 }} /></div>
             <div style={{ position: 'absolute', bottom: '20%', right: '10%', animation: 'ppdbPulse 3s infinite' }}><CheckCircle2 size={20} style={{ opacity: 0.3 }} /></div>
          </div>
        )}

        <div style={{ padding: '40px 20px' }}>
          {!isAccepted && (
            <>
              <div style={{ position: 'relative', width: '100px', height: '100px', margin: '0 auto 24px' }}>
                <div style={{ position: 'absolute', inset: 0, background: '#ecfdf5', borderRadius: '50%', animation: 'ppdbPulse 2s infinite' }}></div>
                <div style={{ position: 'absolute', inset: '10px', background: '#10b981', borderRadius: '50%', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 10px 25px rgba(16, 185, 129, 0.3)' }}>
                  <CheckCircle2 size={40} />
                </div>
              </div>
              <h2 style={{ fontSize: '2rem', fontWeight: 900, color: '#1e293b', marginBottom: '12px', letterSpacing: '-0.03em' }}>Pendaftaran Berhasil!</h2>
              <p style={{ color: '#64748b', fontSize: '1rem', maxWidth: '500px', margin: '0 auto 40px', lineHeight: 1.6 }}>Data Anda telah kami amankan. Silakan tunggu proses verifikasi dari tim panitia kami.</p>
            </>
          )}

          {/* ROADMAP VISUALIZATION */}
          <div style={{ maxWidth: '600px', margin: '0 auto 48px', display: 'flex', justifyContent: 'space-between', position: 'relative', padding: '0 10px' }}>
            <div style={{ position: 'absolute', top: '24px', left: '40px', right: '40px', height: '3px', background: '#e2e8f0', zIndex: 0 }}>
               <div style={{ height: '100%', background: '#4f46e5', width: isAccepted ? '100%' : '50%', transition: 'width 1.5s cubic-bezier(0.34, 1.56, 0.64, 1)' }}></div>
            </div>
            
            <RoadmapNode active={true} done={true} label="Registrasi" sub="Lengkap" />
            <RoadmapNode active={true} done={isAccepted} label="Verifikasi" sub={isAccepted ? "Selesai" : "Proses"} />
            <RoadmapNode active={isAccepted} done={isAccepted} label="Hasil Seleksi" sub={isAccepted ? "Diterima" : "Mendatang"} />
          </div>

          {/* ACTION CARDS FOR ACCEPTED */}
          {isAccepted && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px', marginBottom: '48px', textAlign: 'left' }}>
               {/* Admission Details Card */}
               <div style={{ background: '#f8fafc', padding: '24px', borderRadius: '24px', border: '1px solid #e2e8f0' }}>
                  <h4 style={{ margin: '0 0 16px', fontSize: '0.9rem', fontWeight: 800, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FileText size={18} style={{ color: '#4f46e5' }} /> Detail Penempatan
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                     <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Nomor Induk</span>
                        <span style={{ fontSize: '0.85rem', fontWeight: 800 }}>{data?.registration_number}</span>
                     </div>
                     <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Pilihan Jurusan</span>
                        <span style={{ fontSize: '0.85rem', fontWeight: 800 }}>{data?.jurusan_pilihan || '-'}</span>
                     </div>
                     <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Kelas</span>
                        <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#4f46e5' }}>{data?.kelas_nama || 'Menunggu Plotting'}</span>
                     </div>
                     <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Status</span>
                        <span style={{ fontSize: '0.75rem', fontWeight: 800, background: '#dcfce7', color: '#166534', padding: '2px 8px', borderRadius: '6px' }}>OFFICIAL</span>
                     </div>
                  </div>
               </div>

               {/* Next Steps Card */}
               <div style={{ background: '#eff6ff', padding: '24px', borderRadius: '24px', border: '1px solid #dbeafe' }}>
                  <h4 style={{ margin: '0 0 16px', fontSize: '0.9rem', fontWeight: 800, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <MapPin size={18} style={{ color: '#2563eb' }} /> Langkah Selanjutnya
                  </h4>
                  <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                     <li style={{ fontSize: '0.8rem', color: '#1e3a8a', display: 'flex', gap: '8px' }}>
                        <span style={{ minWidth: '18px', height: '18px', background: '#3b82f6', color: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: 900 }}>1</span>
                        Cetak Bukti Penerimaan di bawah.
                     </li>
                     <li style={{ fontSize: '0.8rem', color: '#1e3a8a', display: 'flex', gap: '8px' }}>
                        <span style={{ minWidth: '18px', height: '18px', background: '#3b82f6', color: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: 900 }}>2</span>
                        Lakukan daftar ulang di sekolah.
                     </li>
                  </ul>
               </div>
            </div>
          )}

          {/* ACTION BUTTONS */}
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={handlePrintCertificate} className="btn-primary-large" style={{ padding: '14px 32px', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Download size={20} /> {isAccepted ? 'Unduh Surat Penerimaan' : 'Unduh Bukti Daftar'}
            </button>
            
            <a href={`https://wa.me/${(data?.contact_wa || '').replace(/^0/, '62')}?text=Halo Panitia PPDB, saya ${data?.nama_lengkap} (ID: ${data?.registration_number}) ingin menanyakan perihal langkah lanjutan setelah diterima.`} target="_blank" className="btn-nav" style={{ padding: '14px 32px', background: '#fff', color: '#10b981', border: '2px solid #10b981', fontSize: '0.95rem' }}>
               <MessageCircle size={20} style={{ marginRight: '8px' }} /> Tanya Panitia (WA)
            </a>
          </div>
        </div>
      </div>

      <div style={{ marginTop: '32px', textAlign: 'center' }}>
        <p style={{ color: '#64748b', fontSize: '0.85rem', fontWeight: 600 }}>Pusat Informasi PPDB &copy; {new Date().getFullYear()}</p>
      </div>
    </div>
  );
}

function RoadmapNode({ active, done, label, sub }) {
  return (
    <div style={{ zIndex: 1, textAlign: 'center', width: '80px' }}>
      <div style={{ 
        width: '40px', height: '40px', borderRadius: '50%', margin: '0 auto 10px',
        background: done ? '#4f46e5' : (active ? 'white' : '#f1f5f9'),
        border: done ? 'none' : `3px solid ${active ? '#4f46e5' : '#e2e8f0'}`,
        color: done ? 'white' : (active ? '#4f46e5' : '#94a3b8'),
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: active ? '0 8px 16px rgba(79, 70, 229, 0.15)' : 'none',
        transition: 'all 0.5s'
      }}>
        {done ? <CheckCircle2 size={20} /> : <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'currentColor' }} />}
      </div>
      <div style={{ fontSize: '0.75rem', fontWeight: 800, color: active ? '#1e293b' : '#94a3b8', whiteSpace: 'nowrap' }}>{label}</div>
      <div style={{ fontSize: '0.6rem', color: active ? '#64748b' : '#cbd5e1', marginTop: '2px' }}>{sub}</div>
    </div>
  );
}

function GeneratingOverlay({ progress }) {
  return (
    <div style={{ 
      position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.8)', 
      backdropFilter: 'blur(12px)', zIndex: 9999, display: 'flex', 
      alignItems: 'center', justifyContent: 'center'
    }}>
      <div style={{ 
        background: 'white', padding: '40px', borderRadius: '32px', 
        width: '100%', maxWidth: '400px', textAlign: 'center',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        border: '1px solid rgba(255,255,255,0.1)',
        animation: 'ppdbScaleIn 0.3s ease-out'
      }}>
        <div style={{ position: 'relative', width: '80px', height: '80px', margin: '0 auto 24px' }}>
           <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '4px solid #f1f5f9' }}></div>
           <div style={{ 
             position: 'absolute', inset: 0, borderRadius: '50%', 
             border: '4px solid #4f46e5', borderTopColor: 'transparent',
             animation: 'spin 1s linear infinite'
           }}></div>
           <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4f46e5' }}>
              <FileCheck size={32} />
           </div>
        </div>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#1e293b', marginBottom: '8px' }}>Menyiapkan Dokumen</h3>
        <p style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '24px' }}>Mohon tunggu sebentar, kami sedang memproses sertifikat digital Anda...</p>
        
        <div style={{ height: '8px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden', marginBottom: '12px' }}>
           <div style={{ 
             width: `${progress}%`, height: '100%', 
             background: 'linear-gradient(90deg, #4f46e5, #7c3aed)',
             transition: 'width 0.4s ease-out'
           }}></div>
        </div>
        <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#4f46e5', textAlign: 'right' }}>{progress}%</div>
      </div>
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

function CertificateTemplate({ id, data }) {
  const isAccepted = data?.status === 'accepted';
  return (
    <div id={id} style={{ 
      width: '210mm', height: '297mm', background: 'white', 
      padding: '15mm', boxSizing: 'border-box', position: 'relative',
      fontFamily: "'Inter', sans-serif", color: '#1e293b'
    }}>
      {/* BORDER DESIGN */}
      <div style={{ position: 'absolute', inset: '10mm', border: '2px solid #e2e8f0', borderRadius: '4px' }}></div>
      <div style={{ position: 'absolute', inset: '12mm', border: '5px solid #4f46e5', borderRadius: '4px' }}></div>
      
      {/* CORNER ACCENTS */}
      <div style={{ position: 'absolute', top: '12mm', left: '12mm', width: '40mm', height: '40mm', background: '#4f46e5', clipPath: 'polygon(0 0, 100% 0, 0 100%)', opacity: 0.1 }}></div>
      <div style={{ position: 'absolute', bottom: '12mm', right: '12mm', width: '40mm', height: '40mm', background: '#4f46e5', clipPath: 'polygon(100% 100%, 100% 0, 0 100%)', opacity: 0.1 }}></div>

      {/* CONTENT */}
      <div style={{ position: 'relative', zIndex: 1, padding: '20mm' }}>
         {/* Header */}
         <div style={{ textAlign: 'center', marginBottom: '20mm' }}>
            <div style={{ color: '#4f46e5', marginBottom: '8mm' }}><GraduationCap size={64} /></div>
            <h1 style={{ fontSize: '28pt', fontWeight: 900, margin: '0 0 4mm', letterSpacing: '-0.02em', color: '#1e293b' }}>
               {isAccepted ? 'SURAT KETERANGAN PENERIMAAN' : 'BUKTI PENDAFTARAN ONLINE'}
            </h1>
            <p style={{ fontSize: '14pt', color: '#64748b', fontWeight: 600, margin: 0 }}>Penerimaan Peserta Didik Baru (PPDB)</p>
            <div style={{ width: '40mm', height: '2pt', background: '#e2e8f0', margin: '6mm auto' }}></div>
         </div>

         {/* Main Body */}
         <div style={{ marginBottom: '15mm' }}>
            <p style={{ fontSize: '12pt', lineHeight: 1.6, color: '#475569', marginBottom: '10mm' }}>
               Berdasarkan data yang telah masuk ke sistem PPDB Online, bersama ini kami menerangkan bahwa:
            </p>
            
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '12mm' }}>
               <tbody>
                  {[
                     ['No. Registrasi', data?.registration_number],
                     ['Pilihan Jurusan', data?.jurusan_pilihan || '-'],
                     ['Nama Lengkap', data?.nama_lengkap],
                     ['NISN / NIK', `${data?.nisn || '-'} / ${data?.nik || '-'}`],
                     ['Tempat, Tgl Lahir', `${data?.tempat_lahir || '-'}, ${data?.tgl_lahir ? new Date(data.tgl_lahir).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}`],
                     ['Jenis Kelamin', data?.jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan'],
                     ['Alamat', data?.alamat_lengkap || '-'],
                     ['No. WhatsApp', data?.no_whatsapp || '-'],
                  ].map(([k, v]) => (
                     <tr key={k}>
                        <td style={{ padding: '4mm 0', fontSize: '11pt', fontWeight: 700, color: '#64748b', width: '45mm', borderBottom: '1pt solid #f1f5f9' }}>{k}</td>
                        <td style={{ padding: '4mm 0', fontSize: '11pt', fontWeight: 800, color: '#1e293b', borderBottom: '1pt solid #f1f5f9' }}>{v}</td>
                     </tr>
                  ))}
               </tbody>
            </table>

            {isAccepted && (
               <div style={{ background: '#f0fdf4', border: '1pt solid #dcfce7', padding: '8mm', borderRadius: '4mm', marginBottom: '10mm' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4mm', marginBottom: '3mm' }}>
                     <ShieldCheck size={24} style={{ color: '#16a34a' }} />
                     <h4 style={{ margin: 0, fontSize: '13pt', fontWeight: 900, color: '#166534' }}>STATUS: DINYATAKAN DITERIMA</h4>
                  </div>
                  <p style={{ margin: 0, fontSize: '11pt', color: '#15803d', lineHeight: 1.5 }}>
                     Selamat! Anda telah lolos seleksi dan terdaftar sebagai siswa baru pada kelas <strong>{data?.kelas_nama || '-'}</strong>. 
                     Mohon segera melakukan daftar ulang sesuai jadwal yang telah ditentukan.
                  </p>
               </div>
            )}
            
            {!isAccepted && (
               <div style={{ background: '#eff6ff', border: '1pt solid #dbeafe', padding: '8mm', borderRadius: '4mm', marginBottom: '10mm' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4mm', marginBottom: '3mm' }}>
                     <FileCheck size={24} style={{ color: '#2563eb' }} />
                     <h4 style={{ margin: 0, fontSize: '13pt', fontWeight: 900, color: '#1e40af' }}>STATUS: PENDAFTARAN TERKUNCI</h4>
                  </div>
                  <p style={{ margin: 0, fontSize: '11pt', color: '#1d4ed8', lineHeight: 1.5 }}>
                     Pendaftaran Anda sedang dalam proses verifikasi oleh panitia. Mohon simpan bukti ini untuk keperluan administrasi selanjutnya.
                  </p>
               </div>
            )}
         </div>

         {/* Footer & Verification */}
         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '20mm' }}>
            <div>
               <div style={{ padding: '4mm', background: 'white', border: '1pt solid #e2e8f0', borderRadius: '4mm', display: 'inline-block', marginBottom: '4mm' }}>
                  <QRCodeSVG value={`VERIFIED-PPDB-${data?.registration_number}`} size={100} />
               </div>
               <p style={{ margin: 0, fontSize: '8pt', color: '#94a3b8', fontWeight: 600 }}>Scan untuk verifikasi digital</p>
            </div>
            <div style={{ textAlign: 'center', width: '60mm' }}>
               <p style={{ margin: '0 0 20mm', fontSize: '11pt', color: '#475569' }}>
                  Dicetak pada: <br/><strong>{new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</strong>
               </p>
               <div style={{ width: '100%', height: '1pt', background: '#1e293b', marginBottom: '2mm' }}></div>
               <p style={{ margin: 0, fontSize: '11pt', fontWeight: 900, color: '#1e293b' }}>PANITIA PPDB ONLINE</p>
               <p style={{ margin: 0, fontSize: '9pt', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Dokumen Sah Digital</p>
            </div>
         </div>
      </div>

      {/* Watermark */}
      <div style={{ 
        position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%) rotate(-45deg)',
        fontSize: '80pt', fontWeight: 900, color: '#f1f5f9', zIndex: 0, whiteSpace: 'nowrap', pointerEvents: 'none', opacity: 0.4
      }}>
        PPDB ONLINE
      </div>
    </div>
  );
}
