import { useState, useRef } from 'react'
import { useApp } from '../../context/AppContext'
import { useCustomAlert } from '../../hooks/useCustomAlert'
import { User, Phone, MapPin, Calendar, FileText, Download, Search, Upload, CheckCircle2, AlertCircle, Briefcase, GraduationCap, Users, Shield, ArrowLeft, HeartPulse, CreditCard, Save, X, Edit3, Trash2, IdCard, BookOpen } from 'lucide-react'

/* ─────────────── helpers ─────────────── */
const fmtDate = (d) => {
    if (!d) return '-'
    try { return new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) }
    catch { return d }
}

const GOLDAR = ['A', 'B', 'AB', 'O']
const AGAMA = ['Islam', 'Kristen', 'Katolik', 'Hindu', 'Buddha', 'Konghucu']
const PEND = ['SD/MI', 'SMP/MTs', 'SMA/SMK/MA', 'D3', 'S1', 'S2', 'S3', 'Tidak Sekolah']
const JENIS_TINGGAL = ['Bersama Orang Tua', 'Kost', 'Asrama', 'Bersama Wali']
const STATUS_HIDUP = ['Hidup', 'Meninggal']
const KEWARGANEGARAAN = ['WNI', 'WNA']

/* ─────────────── sub-components ─────────────── */

/** Satu field read/edit */
function Field({ label, value, editValue, isEditing, onChange, type = 'text', options = [], span = 1, displayValue }) {
    const display = displayValue || value || '-'
    if (isEditing) {
        if (type === 'select') {
            return (
                <div style={{ gridColumn: `span ${span}` }}>
                    <span className="info-item-label">{label}</span>
                    <select className="edit-input" value={editValue ?? value} onChange={e => onChange(e.target.value)}>
                        {options.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                </div>
            )
        }
        if (type === 'textarea') {
            return (
                <div style={{ gridColumn: `span ${span}` }}>
                    <span className="info-item-label">{label}</span>
                    <textarea className="edit-input" style={{ resize: 'vertical', minHeight: 72 }} value={editValue ?? value} onChange={e => onChange(e.target.value)} />
                </div>
            )
        }
        return (
            <div style={{ gridColumn: `span ${span}` }}>
                <span className="info-item-label">{label}</span>
                <input type={type} className="edit-input" value={editValue ?? value} onChange={e => onChange(e.target.value)} />
            </div>
        )
    }
    return (
        <div style={{ gridColumn: `span ${span}` }}>
            <span className="info-item-label">{label}</span>
            <div className="info-item-value">{display}</div>
        </div>
    )
}

/** Section card wrapper */
function SectionCard({ icon, title, children, columns = 2 }) {
    return (
        <div className="parent-card">
            <h5 className="section-card-title">{icon}{title}</h5>
            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${columns}, 1fr)`, gap: '18px 28px' }}>
                {children}
            </div>
        </div>
    )
}

/** Parent bio card */
function ParentSection({ title, icon, prefix, data, isEditing, formData, onChange, formatRupiah }) {
    const d = data || {}
    const f = (field) => formData?.[`${prefix}_${field}`] ?? d[field]
    const ch = (field) => (val) => onChange(`${prefix}_${field}`, val)

    return (
        <div className="parent-card">
            <h5 className="section-card-title">{icon}{title}</h5>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px 28px' }}>
                <Field label="Nama Lengkap" value={d.nama} editValue={f('nama')} isEditing={isEditing} onChange={ch('nama')} span={2} />
                <Field label="NIK" value={d.nik} editValue={f('nik')} isEditing={isEditing} onChange={ch('nik')} />
                <Field label="Status" value={d.status_hidup} editValue={f('status_hidup')} isEditing={isEditing} onChange={ch('status_hidup')} type="select" options={STATUS_HIDUP} />
                <Field label="Pendidikan Terakhir" value={d.pendidikan} editValue={f('pendidikan')} isEditing={isEditing} onChange={ch('pendidikan')} type="select" options={PEND} />
                <Field label="Pekerjaan" value={d.pekerjaan} editValue={f('pekerjaan')} isEditing={isEditing} onChange={ch('pekerjaan')} />
                <Field label="Penghasilan" value={d.penghasilan} editValue={f('penghasilan')} isEditing={isEditing} onChange={ch('penghasilan')} type="number"
                    displayValue={d.penghasilan > 0 ? formatRupiah(d.penghasilan) : 'Tidak ada'} />
                <Field label="No. Handphone" value={d.hp} editValue={f('hp')} isEditing={isEditing} onChange={ch('hp')} />
                {data?.hubungan !== undefined && (
                    <Field label="Hubungan" value={d.hubungan} editValue={f('hubungan')} isEditing={isEditing} onChange={ch('hubungan')} />
                )}
                {data?.alamat !== undefined && (
                    <Field label="Alamat" value={d.alamat} editValue={f('alamat')} isEditing={isEditing} onChange={ch('alamat')} span={2} type="textarea" />
                )}
            </div>
        </div>
    )
}

/** Document card */
function DocumentCard({ doc }) {
    const fileInputRef = useRef(null)
    const [fileName, setFileName] = useState(null)

    const isNone = doc.status === 'Tidak Ada'
    const isVerif = doc.status === 'Terverifikasi'
    const statusClass = isVerif ? 'doc-status-verif' : isNone ? 'doc-status-none' : 'doc-status-unverif'

    const handleFile = (e) => {
        const file = e.target.files[0]
        if (file) setFileName(file.name)
    }

    return (
        <div className="document-card">
            <div className={`doc-icon-wrapper ${isNone ? 'empty' : ''}`}>
                <FileText size={22} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-primary)', marginBottom: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {doc.nama}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span className={`doc-status-badge ${statusClass}`}>{doc.status}</span>
                    {!isNone && <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{fileName || doc.size}</span>}
                </div>
            </div>
            <div style={{ display: 'flex', gap: 4, alignItems: 'center', flexShrink: 0 }}>
                <input type="file" ref={fileInputRef} style={{ display: 'none' }} onChange={handleFile} accept=".pdf,.jpg,.jpeg,.png" />
                {!isNone && (
                    <>
                        <button className="btn-icon" style={{ width: 30, height: 30, padding: 0 }} title="Pratinjau"><Search size={14} /></button>
                        <button className="btn-icon" style={{ width: 30, height: 30, padding: 0 }} title="Unduh"><Download size={14} /></button>
                    </>
                )}
                <button
                    className="btn-icon"
                    style={{ width: 30, height: 30, padding: 0, color: isNone ? 'var(--primary-600)' : 'inherit', background: isNone ? 'var(--primary-50)' : undefined, borderRadius: 7 }}
                    title="Unggah" onClick={() => fileInputRef.current?.click()}
                >
                    <Upload size={14} />
                </button>
            </div>
        </div>
    )
}

/* ═══════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════ */
export default function SiswaProfile({ data, onClose }) {
    const { formatRupiah, updateStudent, addToast, deleteStudent } = useApp()
    const { confirmDelete } = useCustomAlert()
    const [activeTab, setActiveTab] = useState('diri')
    const [showNik, setShowNik] = useState(false)
    const [isEditing, setIsEditing] = useState(false)
    const [form, setForm] = useState({})

    const p = data // "profile" shorthand — always reads from live `data` prop

    const maskNik = (nik) => {
        if (!nik || nik === '-') return '-'
        if (showNik) return nik
        return nik.substring(0, 6) + '●●●●●●' + nik.substring(nik.length - 4)
    }

    /* ── CRUD ── */
    const handleEdit = () => {
        // Flatten nested objects into form with prefix keys
        const flat = { ...data }
        if (data.ayah) Object.entries(data.ayah).forEach(([k, v]) => { flat[`ayah_${k}`] = v })
        if (data.ibu) Object.entries(data.ibu).forEach(([k, v]) => { flat[`ibu_${k}`] = v })
        if (data.wali_detail) Object.entries(data.wali_detail).forEach(([k, v]) => { flat[`wali_${k}`] = v })
        setForm(flat)
        setIsEditing(true)
    }

    const handleChange = (field, value) => setForm(prev => ({ ...prev, [field]: value }))

    const handleSave = () => {
        // Re-nest nested objects
        const ayahFields = ['nama', 'nik', 'pendidikan', 'pekerjaan', 'penghasilan', 'hp', 'status_hidup']
        const ibuFields = [...ayahFields]
        const waliFields = [...ayahFields, 'hubungan', 'alamat']

        const payload = { ...form }
        payload.ayah = {}
        ayahFields.forEach(k => { payload.ayah[k] = form[`ayah_${k}`] ?? data.ayah?.[k]; delete payload[`ayah_${k}`] })
        payload.ibu = {}
        ibuFields.forEach(k => { payload.ibu[k] = form[`ibu_${k}`] ?? data.ibu?.[k]; delete payload[`ibu_${k}`] })
        payload.wali_detail = {}
        waliFields.forEach(k => { payload.wali_detail[k] = form[`wali_${k}`] ?? data.wali_detail?.[k]; delete payload[`wali_${k}`] })

        updateStudent(data.id, payload)
        addToast('success', 'Profil Diperbarui', `Data ${data.nama} berhasil disimpan`)
        setIsEditing(false)
    }

    const handleCancel = () => { setForm({}); setIsEditing(false) }

    const tabs = [
        { id: 'diri', icon: <User size={17} />, label: 'Data Identitas' },
        { id: 'ortu', icon: <Users size={17} />, label: 'Orang Tua & Wali' },
        { id: 'dokumen', icon: <FileCheck size={17} />, label: 'Berkas Digital' },
    ]

    /* ────────────── fv = form value helper ────────────── */
    const fv = (field) => isEditing ? (form[field] ?? p[field]) : p[field]

    return (
        <div className="fade-in">
            {/* ── Page Header ── */}
            <div className="page-header no-print" style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <button className="btn-icon" onClick={onClose}><ArrowLeft size={20} /></button>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <h1 style={{ fontSize: '1.4rem', fontWeight: 800 }}>Profil Siswa</h1>
                        <span style={{ color: 'var(--text-muted)' }}>/</span>
                        <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Detail Lengkap</span>
                    </div>
                </div>
            </div>

            <div className="profile-card no-print">
                {/* ── Banner ── */}
                <div className="profile-banner" />

                <div style={{ padding: '0 28px 28px' }}>
                    {/* ── Avatar + Info row ── */}
                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 24, marginBottom: 24 }}>
                        <div className="profile-avatar-wrapper">
                            <div className="profile-avatar-inner">{p.nama?.charAt(0)}</div>
                        </div>

                        <div style={{ flex: 1, paddingBottom: 4 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 16, flexWrap: 'wrap' }}>
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6, flexWrap: 'wrap' }}>
                                        <h2 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.03em', margin: 0 }}>{p.nama}</h2>
                                        <span className={`badge ${p.status === 'aktif' ? 'badge-success' : p.status === 'lulus' ? 'badge-info' : 'badge-warning'}`}>
                                            {p.status?.toUpperCase()}
                                        </span>
                                        <span className="verif-badge"><CheckCircle2 size={11} /> TERVERIFIKASI</span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 16, color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 600, flexWrap: 'wrap' }}>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><Hash size={14} />{p.no_reg || '-'}</span>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><IdCard size={14} /><span className="mono">{p.nisn}</span></span>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><GraduationCap size={14} />{p.kelas}</span>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><BookOpen size={14} />{p.jurusan || '-'}</span>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                    {isEditing ? (
                                        <>
                                            <button className="btn btn-primary" onClick={handleSave} style={{ fontSize: '0.875rem' }}><Save size={16} /> Simpan Perubahan</button>
                                            <button className="btn btn-secondary" onClick={handleCancel} style={{ fontSize: '0.875rem' }}><X size={16} /> Batal</button>
                                        </>
                                    ) : (
                                        <>
                                            <button className="btn btn-primary" onClick={handleEdit} style={{ fontSize: '0.875rem' }}><Edit3 size={16} /> Edit Profil</button>
                                            <button className="btn btn-outline" style={{ fontSize: '0.875rem', color: 'var(--danger-color)', borderColor: 'var(--danger-color)' }}
                                                onClick={async () => {
                                                    const isConfirmed = await confirmDelete(
                                                        `Hapus Siswa "${p.nama}"?`,
                                                        "Tindakan ini akan menghapus data siswa beserta tagihannya secara permanen."
                                                    )
                                                    if (isConfirmed) {
                                                        deleteStudent(p.id)
                                                        onClose()
                                                    }
                                                }}>
                                                <Trash2 size={16} /> Hapus
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ── Tabs ── */}
                    <div className="profile-nav-tabs">
                        {tabs.map(t => (
                            <button key={t.id} onClick={() => setActiveTab(t.id)}
                                className={`profile-tab-btn ${activeTab === t.id ? 'active' : ''}`}>
                                {t.icon} {t.label}
                            </button>
                        ))}
                    </div>

                    {/* ══════════════ TAB: DATA IDENTITAS ══════════════ */}
                    {activeTab === 'diri' && (
                        <div className="tab-pane-content fade-in">
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

                                {/* Card 1 — Identitas Dasar */}
                                <SectionCard icon={<Shield size={18} />} title="Identitas Dasar" columns={2}>
                                    <Field label="Nama Lengkap" value={p.nama} editValue={fv('nama')} isEditing={isEditing} onChange={v => handleChange('nama', v)} span={2} />
                                    <Field label="NIS" value={p.nis} editValue={fv('nis')} isEditing={isEditing} onChange={v => handleChange('nis', v)} />
                                    <Field label="NISN" value={p.nisn} editValue={fv('nisn')} isEditing={isEditing} onChange={v => handleChange('nisn', v)} />
                                    <Field label="Jenis Kelamin" value={p.jk === 'L' ? 'Laki-laki' : 'Perempuan'} editValue={fv('jk')} isEditing={isEditing} onChange={v => handleChange('jk', v)} type="select" options={['L', 'P']} displayValue={p.jk === 'L' ? 'Laki-laki' : 'Perempuan'} />
                                    <Field label="Agama" value={p.agama} editValue={fv('agama')} isEditing={isEditing} onChange={v => handleChange('agama', v)} type="select" options={AGAMA} />
                                    <Field label="Tempat Lahir" value={p.tempatLahir} editValue={fv('tempatLahir')} isEditing={isEditing} onChange={v => handleChange('tempatLahir', v)} />
                                    <Field label="Tanggal Lahir" value={p.tglLahir} editValue={fv('tglLahir')} isEditing={isEditing} onChange={v => handleChange('tglLahir', v)} type="date" displayValue={fmtDate(p.tglLahir)} />
                                    <Field label="Kewarganegaraan" value={p.kewarganegaraan} editValue={fv('kewarganegaraan')} isEditing={isEditing} onChange={v => handleChange('kewarganegaraan', v)} type="select" options={KEWARGANEGARAAN} />
                                    <Field label="Jurusan" value={p.jurusan} editValue={fv('jurusan')} isEditing={isEditing} onChange={v => handleChange('jurusan', v)} />
                                    <Field label="Email" value={p.email} editValue={fv('email')} isEditing={isEditing} onChange={v => handleChange('email', v)} type="email" />
                                    <Field label="Nomor HP" value={p.telp} editValue={fv('telp')} isEditing={isEditing} onChange={v => handleChange('telp', v)} type="tel" />
                                    <Field label="Asal Sekolah (SMP/MTs)" value={p.asal_sekolah} editValue={fv('asal_sekolah')} isEditing={isEditing} onChange={v => handleChange('asal_sekolah', v)} span={2} />

                                    {/* NIK dengan mask */}
                                    <div style={{ gridColumn: 'span 1' }}>
                                        <span className="info-item-label">Nomor Induk Kependudukan (NIK)</span>
                                        {isEditing ? (
                                            <input type="text" className="edit-input mono" maxLength={16} value={fv('nik') || ''} onChange={e => handleChange('nik', e.target.value)} />
                                        ) : (
                                            <div className="info-item-value">
                                                <span className="mono">{maskNik(p.nik)}</span>
                                                <button onClick={() => setShowNik(!showNik)} className="btn-icon" style={{ width: 22, height: 22, padding: 0, marginLeft: 2 }}>
                                                    {showNik ? <EyeOff size={13} /> : <Eye size={13} />}
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                    <Field label="No. Kartu Keluarga" value={p.no_kk} editValue={fv('no_kk')} isEditing={isEditing} onChange={v => handleChange('no_kk', v)} />
                                    <Field label="Anak Ke-" value={p.anak_ke} editValue={fv('anak_ke')} isEditing={isEditing} onChange={v => handleChange('anak_ke', Number(v))} type="number" />
                                    <Field label="Jumlah Saudara" value={p.jml_saudara} editValue={fv('jml_saudara')} isEditing={isEditing} onChange={v => handleChange('jml_saudara', Number(v))} type="number" />
                                    <Field label="Hobby / Kegemaran" value={p.hobby} editValue={fv('hobby')} isEditing={isEditing} onChange={v => handleChange('hobby', v)} />
                                    <Field label="Cita-cita" value={p.cita_cita} editValue={fv('cita_cita')} isEditing={isEditing} onChange={v => handleChange('cita_cita', v)} />
                                </SectionCard>

                                {/* Card 2 — Kesehatan */}
                                <SectionCard icon={<Activity size={18} />} title="Kesehatan" columns={2}>
                                    <Field label="Berat Badan" value={p.bb} editValue={fv('bb')} isEditing={isEditing} onChange={v => handleChange('bb', Number(v))} type="number" displayValue={`${p.bb || '-'} kg`} />
                                    <Field label="Tinggi Badan" value={p.tb} editValue={fv('tb')} isEditing={isEditing} onChange={v => handleChange('tb', Number(v))} type="number" displayValue={`${p.tb || '-'} cm`} />
                                    <Field label="Golongan Darah" value={p.gol_darah} editValue={fv('gol_darah')} isEditing={isEditing} onChange={v => handleChange('gol_darah', v)} type="select" options={GOLDAR} />
                                    <Field label="Berkebutuhan Khusus" value={p.kebutuhan_khusus} editValue={fv('kebutuhan_khusus')} isEditing={isEditing} onChange={v => handleChange('kebutuhan_khusus', v)}
                                        type="select" options={['Tidak', 'Tuna Netra', 'Tuna Rungu', 'Tuna Wicara', 'Lainnya']} />
                                    <Field label="Riwayat Penyakit" value={p.riwayat_penyakit} editValue={fv('riwayat_penyakit')} isEditing={isEditing} onChange={v => handleChange('riwayat_penyakit', v)} span={2} type="textarea" />
                                </SectionCard>

                                {/* Card 3 — Domisili */}
                                <SectionCard icon={<Home size={18} />} title="Domisili / Tempat Tinggal" columns={3}>
                                    <Field label="Alamat Jalan" value={p.alamat} editValue={fv('alamat')} isEditing={isEditing} onChange={v => handleChange('alamat', v)} span={3} />
                                    <Field label="RT" value={p.rt} editValue={fv('rt')} isEditing={isEditing} onChange={v => handleChange('rt', v)} />
                                    <Field label="RW" value={p.rw} editValue={fv('rw')} isEditing={isEditing} onChange={v => handleChange('rw', v)} />
                                    <Field label="Kode Pos" value={p.kodepos} editValue={fv('kodepos')} isEditing={isEditing} onChange={v => handleChange('kodepos', v)} />
                                    <Field label="Desa / Kelurahan" value={p.kelurahan} editValue={fv('kelurahan')} isEditing={isEditing} onChange={v => handleChange('kelurahan', v)} />
                                    <Field label="Kecamatan" value={p.kecamatan} editValue={fv('kecamatan')} isEditing={isEditing} onChange={v => handleChange('kecamatan', v)} />
                                    <Field label="Kabupaten / Kota" value={p.kabupaten} editValue={fv('kabupaten')} isEditing={isEditing} onChange={v => handleChange('kabupaten', v)} />
                                    <Field label="Provinsi" value={p.provinsi} editValue={fv('provinsi')} isEditing={isEditing} onChange={v => handleChange('provinsi', v)} />
                                    <Field label="Jenis Tinggal" value={p.jenis_tinggal} editValue={fv('jenis_tinggal')} isEditing={isEditing} onChange={v => handleChange('jenis_tinggal', v)} type="select" options={JENIS_TINGGAL} />
                                </SectionCard>

                            </div>
                        </div>
                    )}

                    {/* ══════════════ TAB: ORANG TUA & WALI ══════════════ */}
                    {activeTab === 'ortu' && (
                        <div className="tab-pane-content fade-in">
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
                                <ParentSection
                                    title="Biodata Ayah" icon={<Users size={17} />}
                                    prefix="ayah" data={p.ayah}
                                    isEditing={isEditing} formData={form} onChange={handleChange}
                                    formatRupiah={formatRupiah}
                                />
                                <ParentSection
                                    title="Biodata Ibu" icon={<Heart size={17} />}
                                    prefix="ibu" data={p.ibu}
                                    isEditing={isEditing} formData={form} onChange={handleChange}
                                    formatRupiah={formatRupiah}
                                />
                                <ParentSection
                                    title="Biodata Wali" icon={<Shield size={17} />}
                                    prefix="wali" data={p.wali_detail}
                                    isEditing={isEditing} formData={form} onChange={handleChange}
                                    formatRupiah={formatRupiah}
                                />
                            </div>
                        </div>
                    )}

                    {/* ══════════════ TAB: BERKAS DIGITAL ══════════════ */}
                    {activeTab === 'dokumen' && (
                        <div className="tab-pane-content fade-in">
                            {/* Summary badges */}
                            <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
                                {[
                                    { label: 'Terverifikasi', cls: 'badge-success', count: (p.dokumen || []).filter(d => d.status === 'Terverifikasi').length },
                                    { label: 'Belum Verif', cls: 'badge-warning', count: (p.dokumen || []).filter(d => d.status === 'Belum Verifikasi').length },
                                    { label: 'Tidak Ada', cls: 'badge-secondary', count: (p.dokumen || []).filter(d => d.status === 'Tidak Ada').length },
                                ].map(b => (
                                    <span key={b.label} className={`badge ${b.cls}`}>
                                        {b.label}: {b.count}
                                    </span>
                                ))}
                            </div>
                            <div className="document-grid">
                                {(p.dokumen || []).map(doc => (
                                    <DocumentCard key={doc.id} doc={doc} />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
