import { useStudent } from '../StudentApp'
import { User, MapPin, Phone, Mail, Calendar, FileText, Shield, ChevronRight, LogOut } from 'lucide-react'
import { useState } from 'react'

export default function StudentProfilePage() {
    const { student, profile, handleLogout } = useStudent()
    const data = profile || student || {}
    const [activeSection, setActiveSection] = useState('personal')

    const sections = [
        { id: 'personal', label: 'Data Pribadi', icon: User },
        { id: 'parents', label: 'Orang Tua', icon: Shield },
        { id: 'documents', label: 'Dokumen', icon: FileText },
    ]

    const InfoRow = ({ label, value }) => (
        <div className="stu-info-row">
            <span className="stu-info-label">{label}</span>
            <span className="stu-info-value">{value || '-'}</span>
        </div>
    )

    return (
        <div className="stu-profile-page">
            {/* Profile Header */}
            <div className="stu-profile-header">
                <div className="stu-profile-avatar">
                    {data.nama?.charAt(0) || 'S'}
                </div>
                <h2>{data.nama || 'Siswa'}</h2>
                <p className="stu-profile-class">{data.kelas_nama || data.kelas || '-'}</p>
                <div className="stu-profile-badges">
                    <span className="stu-badge-pill">NISN: {data.nisn || '-'}</span>
                    <span className={`stu-badge-pill ${data.status === 'aktif' ? 'active' : ''}`}>
                        {data.status === 'aktif' ? '🟢 Aktif' : data.status || '-'}
                    </span>
                </div>
            </div>

            {/* Section Tabs */}
            <div className="stu-tab-bar">
                {sections.map(s => (
                    <button
                        key={s.id}
                        className={`stu-tab ${activeSection === s.id ? 'active' : ''}`}
                        onClick={() => setActiveSection(s.id)}
                    >
                        <s.icon size={16} />
                        {s.label}
                    </button>
                ))}
            </div>

            {/* Personal Data */}
            {activeSection === 'personal' && (
                <div className="stu-card">
                    <InfoRow label="Nama Lengkap" value={data.nama} />
                    <InfoRow label="NISN" value={data.nisn} />
                    <InfoRow label="NIS" value={data.nis} />
                    <InfoRow label="Jenis Kelamin" value={data.jk === 'L' ? 'Laki-laki' : data.jk === 'P' ? 'Perempuan' : '-'} />
                    <InfoRow label="Tempat Lahir" value={data.tempat_lahir} />
                    <InfoRow label="Tanggal Lahir" value={data.tgl_lahir ? new Date(data.tgl_lahir).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'} />
                    <InfoRow label="Agama" value={data.agama} />
                    <InfoRow label="Email" value={data.email} />
                    <InfoRow label="Telepon" value={data.telp} />
                    <InfoRow label="Alamat" value={data.alamat} />
                    <InfoRow label="Jurusan" value={data.jurusan || data.unit_nama} />
                    <InfoRow label="Angkatan" value={data.angkatan} />
                </div>
            )}

            {/* Parents */}
            {activeSection === 'parents' && (
                <div className="stu-parents-section">
                    <div className="stu-card">
                        <h4 className="stu-card-title">👨 Data Ayah</h4>
                        <InfoRow label="Nama" value={data.ayah?.nama} />
                        <InfoRow label="Pekerjaan" value={data.ayah?.pekerjaan} />
                        <InfoRow label="Pendidikan" value={data.ayah?.pendidikan} />
                        <InfoRow label="HP" value={data.ayah?.hp} />
                    </div>
                    <div className="stu-card">
                        <h4 className="stu-card-title">👩 Data Ibu</h4>
                        <InfoRow label="Nama" value={data.ibu?.nama} />
                        <InfoRow label="Pekerjaan" value={data.ibu?.pekerjaan} />
                        <InfoRow label="Pendidikan" value={data.ibu?.pendidikan} />
                        <InfoRow label="HP" value={data.ibu?.hp} />
                    </div>
                </div>
            )}

            {/* Documents */}
            {activeSection === 'documents' && (
                <div className="stu-card">
                    {(data.dokumen && data.dokumen.length > 0) ? data.dokumen.map(d => (
                        <div key={d.id} className="stu-doc-item">
                            <FileText size={18} />
                            <div className="stu-doc-info">
                                <span className="stu-doc-name">{d.nama_dokumen}</span>
                                <span className={`stu-doc-status ${d.status === 'Terverifikasi' ? 'verified' : ''}`}>
                                    {d.status}
                                </span>
                            </div>
                        </div>
                    )) : (
                        <div className="stu-empty-mini">Belum ada dokumen yang diunggah</div>
                    )}
                </div>
            )}

            {/* Logout Button */}
            <button className="stu-logout-btn" onClick={handleLogout}>
                <LogOut size={18} />
                Keluar dari Akun
            </button>
        </div>
    )
}
