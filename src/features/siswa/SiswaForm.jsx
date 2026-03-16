import { useState } from 'react'
import Modal from '../../components/Modal'

export default function SiswaForm({ data, allKelas, onSave, onClose }) {
    const [form, setForm] = useState({
        nisn: data?.nisn || '',
        nama: data?.nama || '',
        jk: data?.jk || 'L',
        kelasId: data?.kelasId || (allKelas[0]?.id || ''),
        status: data?.status || 'aktif',
        tempatLahir: data?.tempatLahir || '',
        tglLahir: data?.tglLahir || '',
        telp: data?.telp || '',
        alamat: data?.alamat || '',
        wali: data?.wali || '',
    })

    const handleChange = (field, value) => {
        setForm(prev => ({ ...prev, [field]: value }))
    }

    const handleSubmit = (e) => {
        e.preventDefault()
        onSave(form)
    }

    return (
        <Modal title={data ? 'Edit Siswa' : 'Tambah Siswa Baru'} onClose={onClose} footer={
            <>
                <button className="btn btn-ghost" onClick={onClose} type="button">Batal</button>
                <button className="btn btn-primary" onClick={handleSubmit} type="submit">Simpan Data</button>
            </>
        }>
            <div className="form-group">
                <label>NISN</label>
                <input className="form-control" value={form.nisn} onChange={e => handleChange('nisn', e.target.value)} required placeholder="Nomor Induk Siswa Nasional" />
            </div>
            <div className="form-group">
                <label>Nama Lengkap</label>
                <input className="form-control" value={form.nama} onChange={e => handleChange('nama', e.target.value)} required placeholder="Nama sesuai ijazah" />
            </div>
            <div className="form-grid">
                <div className="form-group">
                    <label>Jenis Kelamin</label>
                    <select className="form-control" value={form.jk} onChange={e => handleChange('jk', e.target.value)}>
                        <option value="L">Laki-laki</option>
                        <option value="P">Perempuan</option>
                    </select>
                </div>
                <div className="form-group">
                    <label>Kelas</label>
                    <select className="form-control" value={form.kelasId} onChange={e => handleChange('kelasId', Number(e.target.value))}>
                        {allKelas.map(k => (
                            <option key={k.id} value={k.id}>{k.nama}</option>
                        ))}
                    </select>
                </div>
            </div>
            <div className="form-grid">
                <div className="form-group">
                    <label>Tempat Lahir</label>
                    <input className="form-control" value={form.tempatLahir} onChange={e => handleChange('tempatLahir', e.target.value)} placeholder="Kota kelahiran" />
                </div>
                <div className="form-group">
                    <label>Tanggal Lahir</label>
                    <input type="date" className="form-control" value={form.tglLahir} onChange={e => handleChange('tglLahir', e.target.value)} />
                </div>
            </div>
            <div className="form-grid">
                <div className="form-group">
                    <label>Status</label>
                    <select className="form-control" value={form.status} onChange={e => handleChange('status', e.target.value)}>
                        <option value="aktif">Aktif</option>
                        <option value="lulus">Lulus</option>
                        <option value="pindah">Pindah</option>
                        <option value="keluar">Keluar</option>
                    </select>
                </div>
                <div className="form-group">
                    <label>No. Telp / HP</label>
                    <input type="tel" className="form-control" value={form.telp} onChange={e => handleChange('telp', e.target.value)} placeholder="08..." />
                </div>
            </div>
            <div className="form-group">
                <label>Nama Wali</label>
                <input className="form-control" value={form.wali} onChange={e => handleChange('wali', e.target.value)} placeholder="Nama wali/orang tua" />
            </div>
            <div className="form-group">
                <label>Alamat</label>
                <textarea className="form-control" value={form.alamat} onChange={e => handleChange('alamat', e.target.value)} placeholder="Alamat lengkap siswa" rows={2} />
            </div>
        </Modal>
    )
}
