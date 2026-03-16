import { useState } from 'react'
import { useApp } from '../context/AppContext'
import { Save, Upload, AlertTriangle } from 'lucide-react'

export default function PengaturanPage() {
    const { tahunAjaran, addToast } = useApp()
    const [school, setSchool] = useState({
        nama: 'SMK PPRQ',
        alamat: 'Jl. Pesantren No.1, Kota',
        telepon: '(021) 123-4567',
        email: 'admin@smkpprq.sch.id',
    })

    const handleSave = () => {
        addToast('success', 'Berhasil', 'Pengaturan sekolah berhasil diperbarui')
    }

    return (
        <div className="fade-in">
            <div className="page-header">
                <h1>Pengaturan</h1>
            </div>

            <div className="card" style={{ marginBottom: 24 }}>
                <div className="card-header">
                    <h3>🏫 Profil Sekolah</h3>
                </div>

                <div className="form-row">
                    <div className="form-group">
                        <label>Nama Sekolah</label>
                        <input className="form-control" value={school.nama} onChange={e => setSchool(prev => ({ ...prev, nama: e.target.value }))} />
                    </div>
                    <div className="form-group">
                        <label>Telepon</label>
                        <input className="form-control" value={school.telepon} onChange={e => setSchool(prev => ({ ...prev, telepon: e.target.value }))} />
                    </div>
                </div>

                <div className="form-group">
                    <label>Alamat</label>
                    <input className="form-control" value={school.alamat} onChange={e => setSchool(prev => ({ ...prev, alamat: e.target.value }))} />
                </div>

                <div className="form-row">
                    <div className="form-group">
                        <label>Email</label>
                        <input type="email" className="form-control" value={school.email} onChange={e => setSchool(prev => ({ ...prev, email: e.target.value }))} />
                    </div>
                    <div className="form-group">
                        <label>Logo Sekolah</label>
                        <button className="btn btn-ghost" style={{ width: '100%', justifyContent: 'center' }}>
                            <Upload size={16} /> Upload Logo
                        </button>
                    </div>
                </div>

                <div style={{ textAlign: 'right', marginTop: 16 }}>
                    <button className="btn btn-primary" onClick={handleSave}>
                        <Save size={16} /> Simpan Perubahan
                    </button>
                </div>
            </div>

            <div className="card">
                <div className="card-header">
                    <h3>📅 Tahun Ajaran Aktif</h3>
                </div>

                <div className="form-row" style={{ alignItems: 'flex-end' }}>
                    <div className="form-group">
                        <label>Tahun Ajaran Aktif</label>
                        <select className="form-control" defaultValue={tahunAjaran}>
                            <option>2025/2026</option>
                            <option>2024/2025</option>
                            <option>2023/2024</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <button className="btn btn-ghost">🔄 Ganti</button>
                    </div>
                </div>

                <div style={{
                    background: 'var(--warning-50)', border: '1px solid var(--warning-500)',
                    borderRadius: 'var(--radius-md)', padding: 12, marginTop: 8,
                    display: 'flex', alignItems: 'flex-start', gap: 8,
                    fontSize: '0.85rem', color: 'var(--warning-600)',
                }}>
                    <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: 2 }} />
                    <span>Mengganti tahun ajaran aktif akan mengubah konteks seluruh data yang ditampilkan di sistem.</span>
                </div>
            </div>
        </div>
    )
}
