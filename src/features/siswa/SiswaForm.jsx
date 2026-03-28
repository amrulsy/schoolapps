import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { UserPlus, Edit2, X, Info, BookOpen, User, MapPin, Save } from 'lucide-react'
import { useApp } from '../../context/AppContext'

const styles = /*css*/`
  .siswa-modal-overlay {
    position: fixed; inset: 0; background: rgba(15, 23, 42, 0.7);
    backdrop-filter: blur(12px); z-index: 10000;
    display: flex; align-items: center; justify-content: center; padding: 20px;
    animation: fade-in 0.3s ease;
  }
  .siswa-modal-container {
    background: var(--bg-card); width: 100%; max-width: 800px;
    max-height: 90vh; border-radius: 28px;
    display: flex; flex-direction: column; overflow: hidden;
    box-shadow: 0 40px 80px -20px rgba(0,0,0,0.3);
    border: 1px solid var(--border-color);
    animation: fade-scale-in 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  }
  .siswa-modal-header {
    padding: 24px 28px; background: var(--bg-card);
    border-bottom: 1px solid var(--border-color); display: flex;
    justify-content: space-between; align-items: center;
  }
  .header-content { display: flex; align-items: center; gap: 16px; }
  .header-icon { 
    width: 48px; height: 48px; border-radius: 14px;
    background: var(--primary-100); color: var(--primary-600);
    display: flex; align-items: center; justify-content: center;
  }
  .header-text h2 { margin: 0; font-size: 1.25rem; font-weight: 800; color: var(--text-primary); letter-spacing: -0.5px; }
  .header-text p { margin: 2px 0 0; font-size: 0.8125rem; color: var(--text-secondary); fw-bold; }

  .btn-close-circle {
    width: 36px; height: 36px; border-radius: 50%; border: none;
    background: var(--bg-stripe); color: var(--text-secondary); font-size: 20px;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; transition: all 0.2s;
  }
  .btn-close-circle:hover { background: var(--danger-100); color: var(--danger-600); transform: rotate(90deg); }

  .siswa-modal-body {
    flex: 1; overflow-y: auto; padding: 28px; background: var(--bg-stripe);
  }
  .premium-form { display: flex; flex-direction: column; gap: 24px; }
  
  .form-section-card {
    background: var(--bg-card); padding: 24px; border-radius: 20px;
    border: 1px solid var(--border-color); box-shadow: var(--shadow-sm);
  }
  .section-title { display: flex; align-items: center; gap: 10px; margin-bottom: 20px; }
  .section-title h3 { margin: 0; font-size: 0.75rem; font-weight: 800; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.1em; }
  .section-title svg { color: var(--primary-500); }

  .form-row { display: flex; gap: 20px; margin-bottom: 20px; }
  .form-row:last-child { margin-bottom: 0; }
  .flex-1 { flex: 1; }

  .form-group { display: flex; flex-direction: column; gap: 8px; }
  .form-group label { font-size: 0.75rem; font-weight: 700; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.05em; }
  
  .modern-input {
    width: 100%; padding: 12px 16px; border-radius: 12px;
    border: 1.5px solid var(--border-color); background: var(--bg-input);
    color: var(--text-primary); font-size: 0.9375rem; font-weight: 500;
    transition: all 0.2s;
  }
  .modern-input:focus { border-color: var(--primary-500); background: var(--bg-card); outline: none; box-shadow: 0 0 0 4px var(--primary-50); }
  
  .gender-toggle { display: flex; gap: 12px; }
  .toggle-btn {
    flex: 1; padding: 12px; border-radius: 12px; border: 1.5px solid var(--border-color);
    background: var(--bg-card); color: var(--text-secondary); font-weight: 700;
    cursor: pointer; transition: all 0.2s;
  }
  .toggle-btn.active { background: var(--primary-600); border-color: var(--primary-600); color: #fff; box-shadow: 0 4px 12px rgba(37, 99, 235, 0.2); }
  .toggle-btn:hover:not(.active) { border-color: var(--primary-400); color: var(--primary-600); }

  .siswa-modal-footer {
    padding: 20px 28px; background: var(--bg-card); border-top: 1px solid var(--border-color);
    display: flex; justify-content: flex-end; gap: 12px;
  }
  .btn-glass-secondary {
    padding: 12px 24px; border-radius: 14px; border: 1px solid var(--border-color);
    background: transparent; color: var(--text-secondary); font-weight: 700; cursor: pointer; transition: all 0.2s;
  }
  .btn-glass-secondary:hover { background: var(--bg-stripe); color: var(--text-primary); }

  .btn-modern-primary {
    padding: 12px 28px; border-radius: 14px; border: none;
    background: var(--primary-600); color: #fff; font-weight: 700;
    display: flex; align-items: center; gap: 10px; cursor: pointer;
    transition: all 0.2s; box-shadow: 0 4px 12px rgba(37, 99, 235, 0.2);
  }
  .btn-modern-primary:hover { background: var(--primary-700); transform: translateY(-1px); box-shadow: 0 6px 16px rgba(37, 99, 235, 0.3); }

  @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
  @keyframes fade-scale-in {
    from { opacity: 0; transform: scale(0.95) translateY(10px); }
    to { opacity: 1; transform: scale(1) translateY(0); }
  }
`;

export default function SiswaForm({ data, allKelas, onSave, onClose }) {
    const { tahunAjaranList } = useApp()
    const activeTa = tahunAjaranList?.find(t => t.status === 'aktif')
    const defaultTglMulai = activeTa?.tanggal_mulai ? activeTa.tanggal_mulai.split('T')[0] : ''

    const [form, setForm] = useState({
        nisn: data?.nisn || '',
        nis: data?.nis || '',
        nama: data?.nama || '',
        jk: data?.jk || 'L',
        kelasId: data?.kelasId || (allKelas[0]?.id || ''),
        status: data?.status || 'aktif',
        tempatLahir: data?.tempatLahir || '',
        tglLahir: data?.tglLahir || '',
        telp: data?.telp || '',
        alamat: data?.alamat || '',
        wali: data?.wali || '',
        angkatan: data?.angkatan || '',
        jenisPendaftaran: data?.jenisPendaftaran || 'Baru',
        tanggalMulaiSekolah: data?.tanggalMulaiSekolah || defaultTglMulai,
    })

    useEffect(() => {
        if (!data?.id && form.jenisPendaftaran === 'Baru' && !form.tanggalMulaiSekolah && defaultTglMulai) {
             setForm(prev => ({ ...prev, tanggalMulaiSekolah: defaultTglMulai }))
        }
    }, [data?.id, form.jenisPendaftaran, form.tanggalMulaiSekolah, defaultTglMulai])

    const handleChange = (field, value) => {
        setForm(prev => {
            let next = { ...prev, [field]: value }
            if (field === 'jenisPendaftaran' && value === 'Baru') {
                next.tanggalMulaiSekolah = defaultTglMulai
            }
            return next
        })
    }

    const handleSubmit = (e) => {
        e.preventDefault()
        onSave(form)
    }

    return createPortal(
        <div className="siswa-modal-overlay">
            <style dangerouslySetInnerHTML={{ __html: styles }} />
            <div className="siswa-modal-container">
                <div className="siswa-modal-header">
                    <div className="header-content">
                        <div className="header-icon">
                            {data ? <Edit2 size={24} /> : <UserPlus size={24} />}
                        </div>
                        <div className="header-text">
                            <h2>{data ? 'Edit Data Siswa' : 'Tambah Siswa Baru'}</h2>
                            <p>Lengkapi formulir untuk mendaftarkan siswa baru</p>
                        </div>
                    </div>
                    <button className="btn-close-circle" onClick={onClose} title="Tutup">
                        <X size={20} />
                    </button>
                </div>

                <div className="siswa-modal-body">
                    <form id="siswaForm" onSubmit={handleSubmit} className="premium-form">
                        {/* IDENTITAS */}
                        <div className="form-section-card">
                            <div className="section-title">
                                <Info size={18} />
                                <h3>Data Identitas</h3>
                            </div>
                            <div className="form-row">
                                <div className="form-group flex-1">
                                    <label>NISN <span className="text-danger">*</span></label>
                                    <input
                                        type="text"
                                        className="modern-input"
                                        placeholder="Nomor Induk Siswa Nasional"
                                        value={form.nisn}
                                        onChange={(e) => handleChange('nisn', e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="form-group flex-1">
                                    <label>NIS <span className="cms-hint">(Opsional)</span></label>
                                    <input
                                        type="text"
                                        className="modern-input"
                                        placeholder="Nomor Induk Sekolah"
                                        value={form.nis}
                                        onChange={(e) => handleChange('nis', e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="form-group">
                                <label>NAMA LENGKAP <span className="text-danger">*</span></label>
                                <input
                                    type="text"
                                    className="modern-input"
                                    placeholder="Nama sesuai ijazah"
                                    value={form.nama}
                                    onChange={(e) => handleChange('nama', e.target.value)}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>JENIS KELAMIN</label>
                                <div className="gender-toggle">
                                    <button
                                        type="button"
                                        className={`toggle-btn ${form.jk === 'L' ? 'active' : ''}`}
                                        onClick={() => handleChange('jk', 'L')}
                                    >
                                        Laki-laki
                                    </button>
                                    <button
                                        type="button"
                                        className={`toggle-btn ${form.jk === 'P' ? 'active' : ''}`}
                                        onClick={() => handleChange('jk', 'P')}
                                    >
                                        Perempuan
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* AKADEMIK */}
                        <div className="form-section-card">
                            <div className="section-title">
                                <BookOpen size={18} />
                                <h3>Penerimaan & Akademik</h3>
                            </div>
                            <div className="form-row">
                                <div className="form-group flex-1">
                                    <label>TAHUN ANGKATAN <span className="text-danger">*</span></label>
                                    <input
                                        type="text"
                                        className="modern-input"
                                        placeholder="Contoh: 2025"
                                        value={form.angkatan}
                                        onChange={(e) => handleChange('angkatan', e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="form-group flex-1">
                                    <label>JENIS PENDAFTARAN</label>
                                    <div className="gender-toggle">
                                        <button
                                            type="button"
                                            className={`toggle-btn ${form.jenisPendaftaran === 'Baru' ? 'active' : ''}`}
                                            style={{ padding: '10px' }}
                                            onClick={() => handleChange('jenisPendaftaran', 'Baru')}
                                        >
                                            Baru
                                        </button>
                                        <button
                                            type="button"
                                            className={`toggle-btn ${form.jenisPendaftaran === 'Pindahan' ? 'active' : ''}`}
                                            style={{ padding: '10px' }}
                                            onClick={() => handleChange('jenisPendaftaran', 'Pindahan')}
                                        >
                                            Pindahan
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <div className="form-row">
                                <div className="form-group flex-1">
                                    <label>TANGGAL MULAI SEKOLAH <span className="text-danger">*</span></label>
                                    <input
                                        type="date"
                                        className="modern-input"
                                        value={form.tanggalMulaiSekolah}
                                        onChange={(e) => handleChange('tanggalMulaiSekolah', e.target.value)}
                                        disabled={form.jenisPendaftaran === 'Baru'}
                                        required
                                    />
                                </div>
                                <div className="form-group flex-1">
                                    <label>KELAS <span className="text-danger">*</span></label>
                                    <select
                                        className="modern-input"
                                        value={form.kelasId}
                                        onChange={(e) => handleChange('kelasId', e.target.value)}
                                        required
                                    >
                                        <option value="">Pilih Kelas</option>
                                        {allKelas.map(k => (
                                            <option key={k.id} value={k.id}>{k.nama}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group flex-1">
                                    <label>STATUS <span className="text-danger">*</span></label>
                                    <select
                                        className="modern-input"
                                        value={form.status}
                                        onChange={(e) => handleChange('status', e.target.value)}
                                        required
                                    >
                                        <option value="aktif">Aktif</option>
                                        <option value="nonaktif">Nonaktif</option>
                                        <option value="alumni">Alumni</option>
                                        <option value="pindah">Pindah</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* PRIBADI */}
                        <div className="form-section-card">
                            <div className="section-title">
                                <User size={18} />
                                <h3>Data Pribadi & Wali</h3>
                            </div>
                            <div className="form-row">
                                <div className="form-group flex-1">
                                    <label>TEMPAT LAHIR</label>
                                    <input
                                        type="text"
                                        className="modern-input"
                                        placeholder="Kota Kelahiran"
                                        value={form.tempatLahir}
                                        onChange={(e) => handleChange('tempatLahir', e.target.value)}
                                    />
                                </div>
                                <div className="form-group flex-1">
                                    <label>TANGGAL LAHIR</label>
                                    <input
                                        type="date"
                                        className="modern-input"
                                        value={form.tglLahir}
                                        onChange={(e) => handleChange('tglLahir', e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="form-group">
                                <label>NAMA WALI <span className="cms-hint">(Orang Tua/Wali)</span></label>
                                <input
                                    type="text"
                                    className="modern-input"
                                    placeholder="Nama Lengkap Wali"
                                    value={form.wali}
                                    onChange={(e) => handleChange('wali', e.target.value)}
                                />
                            </div>
                            <div className="form-group">
                                <label>NO. TELEPON / WA</label>
                                <input
                                    type="text"
                                    className="modern-input"
                                    placeholder="62812345678"
                                    value={form.telp}
                                    onChange={(e) => handleChange('telp', e.target.value)}
                                />
                            </div>
                        </div>

                        {/* ALAMAT */}
                        <div className="form-section-card">
                            <div className="section-title">
                                <MapPin size={18} />
                                <h3>Alamat Tinggal</h3>
                            </div>
                            <div className="form-group">
                                <label>ALAMAT LENGKAP</label>
                                <textarea
                                    className="modern-input"
                                    placeholder="Jalan, No. Rumah, RT/RW, Desa/Kelurahan..."
                                    rows={3}
                                    value={form.alamat}
                                    onChange={(e) => handleChange('alamat', e.target.value)}
                                />
                            </div>
                        </div>
                    </form>
                </div>

                <div className="siswa-modal-footer">
                    <button type="button" className="btn-glass-secondary" onClick={onClose}>
                        Batal
                    </button>
                    <button type="submit" form="siswaForm" className="btn-modern-primary">
                        <Save size={18} className="me-2" /> {data ? 'Simpan Perubahan' : 'Tambahkan Siswa'}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    )
}
