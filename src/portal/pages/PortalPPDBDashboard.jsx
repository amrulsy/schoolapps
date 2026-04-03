import { useState, useEffect, useRef } from "react";
import { Helmet } from "react-helmet-async";
import { 
  User, FileText, CheckCircle, Save, LogOut, UploadCloud, AlertCircle, 
  MapPin, Users, Camera, ChevronRight, ChevronLeft, Home, Bell, Menu, X, 
  CheckCircle2, Loader2, Download, ExternalLink, Printer
} from "lucide-react";
import Swal from "sweetalert2";
import { API_BASE_PUBLIC } from "../../services/api";

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
const getMediaUrl = (p) => {
  if (!p) return "";
  if (p.startsWith("http")) return p;
  const origin = import.meta.env.VITE_API_URL || `${window.location.protocol}//${window.location.hostname}:3005`;
  return `${origin}${p}`;
};

export default function PortalPPDBDashboard() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [step, setStep] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [announcements, setAnnouncements] = useState([]);
  
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
      saveTimeout.current = setTimeout(() => autoSave(updated), 1500);
      return updated;
    });
  };

  const autoSave = async (currentForm) => {
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
      // Silent update completeness in UI if we want, or just wait for explicit refresh
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
        
        Swal.fire("Berhasil!", "Pendaftaran Anda telah dikirim dan sedang diverifikasi.", "success");
        fetchDashboard();
      } catch (err) {
        Swal.fire("Gagal", err.message, "error");
      } finally {
        setLoading(false);
      }
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

  // BUG FIX: Add missing print certificate handler
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
      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
        <Loader2 className="animate-spin text-indigo-600 mb-4" size={48} />
        <p className="text-slate-500 font-medium">Memuat dasbor pendaftar...</p>
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

            {/* Wizard Container */}
            <div className="ppdb-wizard-card">
              
              {/* Wizard Steps Header */}
              <div className="ppdb-steps-scroll">
                <div className="ppdb-steps-inner">
                  {stepsList.map(s => (
                    <button key={s.id} onClick={() => setStep(s.id)} className={`ppdb-step-btn ${step === s.id ? 'active' : ''} ${step > s.id ? 'done' : ''}`}>
                      <div className="ppdb-step-num">
                        {step > s.id ? '✓' : s.id}
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
                    <div className="form-grid">
                      <Input label="Nama Lengkap" name="nama_lengkap" value={form.nama_lengkap} onChange={handleInputChange} disabled={isLocked} required />
                      <Input label="NISN" name="nisn" value={form.nisn} onChange={handleInputChange} disabled={isLocked} placeholder="10 Digit" />
                      <Input label="NIK" name="nik" value={form.nik} onChange={handleInputChange} disabled={isLocked} placeholder="16 Digit" />
                      <div className="form-row">
                        <Input label="Tempat Lahir" name="tempat_lahir" value={form.tempat_lahir} onChange={handleInputChange} disabled={isLocked} />
                        <Input label="Tanggal Lahir" name="tgl_lahir" type="date" value={form.tgl_lahir} onChange={handleInputChange} disabled={isLocked} />
                      </div>
                      <div className="form-row">
                        <Select label="Jenis Kelamin" name="jenis_kelamin" value={form.jenis_kelamin} onChange={handleInputChange} disabled={isLocked}>
                          <option value="L">Laki-laki</option>
                          <option value="P">Perempuan</option>
                        </Select>
                        <Input label="Agama" name="agama" value={form.agama} onChange={handleInputChange} disabled={isLocked} />
                      </div>
                      <div className="form-row">
                        <Input label="Anak Ke" name="anak_ke" type="number" value={form.anak_ke} onChange={handleInputChange} disabled={isLocked} />
                        <Input label="Jml Saudara" name="jml_saudara" type="number" value={form.jml_saudara} onChange={handleInputChange} disabled={isLocked} />
                      </div>
                      <div className="form-row">
                        <Input label="Tinggi Badan (cm)" name="tb" type="number" value={form.tb} onChange={handleInputChange} disabled={isLocked} />
                        <Input label="Berat Badan (kg)" name="bb" type="number" value={form.bb} onChange={handleInputChange} disabled={isLocked} />
                      </div>
                      <div className="form-row">
                         <Select label="Golongan Darah" name="gol_darah" value={form.gol_darah} onChange={handleInputChange} disabled={isLocked}>
                            <option value="">Pilih</option>
                            <option value="A">A</option><option value="B">B</option><option value="AB">AB</option><option value="O">O</option>
                         </Select>
                         <Input label="Cita-cita" name="cita_cita" value={form.cita_cita} onChange={handleInputChange} disabled={isLocked} />
                      </div>
                      <div className="span-full">
                        <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#475569', marginBottom: '8px', display: 'block' }}>Riwayat Penyakit (Jika ada)</label>
                        <textarea name="riwayat_penyakit" value={form.riwayat_penyakit} onChange={handleInputChange} disabled={isLocked} className="ppdb-textarea"></textarea>
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
                        <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#475569', marginBottom: '8px', display: 'block' }}>Alamat Lengkap (Blok/No/Jalan)</label>
                        <textarea name="alamat_lengkap" value={form.alamat_lengkap} onChange={handleInputChange} disabled={isLocked} className="ppdb-textarea"></textarea>
                      </div>
                      <div className="form-row">
                        <Input label="RT" name="rt" value={form.rt} onChange={handleInputChange} disabled={isLocked} />
                        <Input label="RW" name="rw" value={form.rw} onChange={handleInputChange} disabled={isLocked} />
                      </div>
                      <Input label="Dusun / Lingkungan" name="dusun" value={form.dusun} onChange={handleInputChange} disabled={isLocked} />
                      <Input label="Kelurahan / Desa" name="kelurahan" value={form.kelurahan} onChange={handleInputChange} disabled={isLocked} />
                      <div className="form-row">
                        <Input label="Kecamatan" name="kecamatan" value={form.kecamatan} onChange={handleInputChange} disabled={isLocked} />
                        <Input label="Kabupaten / Kota" name="kabupaten" value={form.kabupaten} onChange={handleInputChange} disabled={isLocked} />
                      </div>
                      <div className="form-row">
                        <Input label="Provinsi" name="provinsi" value={form.provinsi} onChange={handleInputChange} disabled={isLocked} />
                        <Input label="Kode Pos" name="kodepos" value={form.kodepos} onChange={handleInputChange} disabled={isLocked} />
                      </div>
                      <Select label="Jenis Tinggal" name="jenis_tinggal" value={form.jenis_tinggal} onChange={handleInputChange} disabled={isLocked}>
                        <option value="">Pilih</option>
                        <option value="Bersama Orang Tua">Bersama Orang Tua</option>
                        <option value="Wali">Wali / Saudara</option>
                        <option value="Kost">Kost</option>
                        <option value="Asrama">Asrama</option>
                      </Select>
                      <Input label="No. WhatsApp" name="no_whatsapp" value={form.no_whatsapp} onChange={handleInputChange} disabled={isLocked} required />
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
                        <Input label="Nama Lengkap Ayah" name="nama_ayah" value={form.nama_ayah} onChange={handleInputChange} disabled={isLocked} />
                        <Input label="NIK Ayah" name="nik_ayah" value={form.nik_ayah} onChange={handleInputChange} disabled={isLocked} />
                        <div className="form-row">
                           <Input label="Pendidikan" name="pendidikan_ayah" value={form.pendidikan_ayah} onChange={handleInputChange} disabled={isLocked} />
                           <Input label="Pekerjaan" name="pekerjaan_ayah" value={form.pekerjaan_ayah} onChange={handleInputChange} disabled={isLocked} />
                        </div>
                        <div className="form-row">
                           <Input label="Penghasilan / Bulan" name="penghasilan_ayah" value={form.penghasilan_ayah} onChange={handleInputChange} disabled={isLocked} />
                           <Input label="No. Telp/WA" name="telp_ayah" value={form.telp_ayah} onChange={handleInputChange} disabled={isLocked} />
                        </div>
                      </div>
                    </div>
                    {/* IBU */}
                    <div style={{ marginBottom: '32px' }}>
                      <SectionLabel icon={<Users />} title="Data Ibu Kandung" />
                      <div className="form-grid">
                        <Input label="Nama Lengkap Ibu" name="nama_ibu" value={form.nama_ibu} onChange={handleInputChange} disabled={isLocked} />
                        <Input label="NIK Ibu" name="nik_ibu" value={form.nik_ibu} onChange={handleInputChange} disabled={isLocked} />
                        <div className="form-row">
                           <Input label="Pendidikan" name="pendidikan_ibu" value={form.pendidikan_ibu} onChange={handleInputChange} disabled={isLocked} />
                           <Input label="Pekerjaan" name="pekerjaan_ibu" value={form.pekerjaan_ibu} onChange={handleInputChange} disabled={isLocked} />
                        </div>
                        <div className="form-row">
                           <Input label="Penghasilan / Bulan" name="penghasilan_ibu" value={form.penghasilan_ibu} onChange={handleInputChange} disabled={isLocked} />
                           <Input label="No. Telp/WA" name="telp_ibu" value={form.telp_ibu} onChange={handleInputChange} disabled={isLocked} />
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
                                 <label className="btn-upload">
                                   <input type="file" hidden accept="image/*" onChange={(e) => handleUpload(e, 'foto')} />
                                   <UploadCloud size={14} /> Upload Foto
                                 </label>
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
                       <div style={{ height: '10px', background: '#e2e8f0', borderRadius: '5px', overflow: 'hidden' }}>
                          <div style={{ width: `${data.completeness_pct}%`, height: '100%', background: 'linear-gradient(90deg, #4f46e5, #8b5cf6)', borderRadius: '5px', transition: 'width 0.5s' }} />
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
                    <button onClick={handlePrintCertificate} style={{ marginTop: '12px', width: '100%', background: 'white', border: '2px solid #4f46e5', color: '#4f46e5', padding: '8px', borderRadius: '10px', fontSize: '0.85rem', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer' }}>
                       <Printer size={16} /> Cetak Bukti Lulus
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
          --ppdb-primary-glow: rgba(79, 70, 229, 0.25);
          --ppdb-accent: #7c3aed;
          --ppdb-success: #10b981;
          --ppdb-border: rgba(226, 232, 240, 0.8);
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
          background: white; border-radius: 20px; overflow: hidden;
          border: 1px solid var(--ppdb-border);
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.07), 0 2px 4px -1px rgba(0,0,0,0.04);
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
          background: white; border-radius: 20px; padding: 20px;
          border: 1px solid var(--ppdb-border);
          box-shadow: 0 2px 8px rgba(0,0,0,0.06);
          margin-bottom: 16px;
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

        /* === INPUT FOCUS GLOW === */
        .portal-input-clean:focus,
        .ppdb-dashboard-root select:focus,
        .ppdb-textarea:focus {
          border-color: var(--ppdb-primary) !important;
          box-shadow: 0 0 0 3px var(--ppdb-primary-glow), 0 2px 8px rgba(79, 70, 229, 0.1) !important;
          outline: none !important;
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

function Input({ label, ...props }) {
  return (
    <div style={{ marginBottom: '4px' }}>
      <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#475569', marginBottom: '8px', display: 'block' }}>{label}</label>
      <input 
        className="portal-input-clean" 
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

function Select({ label, children, ...props }) {
  return (
    <div style={{ marginBottom: '4px' }}>
      <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#475569', marginBottom: '8px', display: 'block' }}>{label}</label>
      <select 
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

