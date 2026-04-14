import { useState, useEffect, useCallback } from 'react';
import { useApp } from '../../../context/AppContext';
import { useCustomAlert } from '../../../hooks/useCustomAlert';
import { Plus, Edit2, Trash2, Calendar as CalendarIcon, RefreshCw, Layout, Clock, MapPin, AlignLeft, X, Save, CheckCircle2 } from 'lucide-react';
import { API_BASE_CMS as API_BASE, getAuthHeaders } from '../../../services/api';

export default function CmsAgendaPage({ hideHeader = false }) {
    const { addToast } = useApp();
    const { confirmDelete } = useCustomAlert();
    const [agendas, setAgendas] = useState([]);
    const [loading, setLoading] = useState(true);

    const [showModal, setShowModal] = useState(false);
    const [editItem, setEditItem] = useState(null);
    const [formData, setFormData] = useState({
        title: '', description: '', event_date: '', time: '', location: '', is_active: 1
    });
    const [saving, setSaving] = useState(false);

    const loadAgendas = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/agenda`, { headers: getAuthHeaders() });
            if (res.ok) setAgendas(await res.json());
        } catch (err) {
            addToast('danger', 'Error', 'Gagal memuat data agenda.');
        } finally {
            setLoading(false);
        }
    }, [addToast]);

    useEffect(() => { loadAgendas(); }, [loadAgendas]);

    const openModal = (item = null) => {
        setEditItem(item);
        if (item) {
            // Format YYYY-MM-DD for date input
            const d = new Date(item.event_date);
            const dateStr = !isNaN(d) ? d.toISOString().split('T')[0] : '';
            setFormData({
                title: item.title,
                description: item.description || '',
                event_date: dateStr,
                time: item.time || '',
                location: item.location || '',
                is_active: item.is_active
            });
        } else {
            setFormData({ title: '', description: '', event_date: '', time: '', location: '', is_active: 1 });
        }
        setShowModal(true);
    };

    const saveAgenda = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const url = editItem ? `${API_BASE}/agenda/${editItem.id}` : `${API_BASE}/agenda`;
            const method = editItem ? 'PUT' : 'POST';
            const res = await fetch(url, {
                method,
                headers: getAuthHeaders(),
                body: JSON.stringify(formData)
            });
            if (res.ok) {
                addToast('success', 'Berhasil', `Agenda ${editItem ? 'diperbarui' : 'ditambahkan'}.`);
                setShowModal(false);
                loadAgendas();
            } else {
                const err = await res.json();
                addToast('danger', 'Gagal', err.error || 'Terjadi kesalahan');
            }
        } catch (err) {
            addToast('danger', 'Error', 'Gagal menyimpan agenda.');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (item) => {
        if (await confirmDelete(`Hapus agenda "${item.title}"?`, 'Data akan dihapus permanen.')) {
            try {
                const res = await fetch(`${API_BASE}/agenda/${item.id}`, {
                    method: 'DELETE',
                    headers: getAuthHeaders()
                });
                if (res.ok) {
                    addToast('success', 'Berhasil', 'Agenda dihapus.');
                    loadAgendas();
                } else {
                    addToast('danger', 'Gagal', 'Gagal menghapus agenda.');
                }
            } catch (err) {
                addToast('danger', 'Error', 'Gagal menghapus agenda.');
            }
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return new Date(dateString).toLocaleDateString('id-ID', options);
    };

    return (
        <div className={hideHeader ? '' : 'fade-in'}>
            {!hideHeader && (
                <div className="page-header">
                    <h1><Layout size={24} style={{ marginRight: 8, verticalAlign: 'middle' }} /> Manajemen Agenda</h1>
                    <button className="btn btn-secondary" onClick={loadAgendas}>
                        <RefreshCw size={16} /> Refresh
                    </button>
                </div>
            )}

            <div className="cms-section-card" style={hideHeader ? { padding: 0, boxShadow: 'none' } : {}}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <div>
                        <h3 className="cms-section-title" style={{ marginBottom: 4 }}>🗓️ Daftar Agenda Sekolah</h3>
                        <p className="cms-section-desc">Acara mendatang akan ditampilkan secara publik di Halaman Utama Portal.</p>
                    </div>
                    <button className="btn btn-primary btn-sm" onClick={() => openModal()}>
                        <Plus size={14} /> Tambah Agenda
                    </button>
                </div>

                {loading ? (
                    <div style={{ textAlign: 'center', padding: 20 }}>Memuat...</div>
                ) : agendas.length === 0 ? (
                    <div className="cms-empty-state">Belum ada agenda bulan ini. Klik &quot;Tambah Agenda&quot; untuk membuat jadwal baru.</div>
                ) : (
                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th style={{ width: 50 }}>No</th>
                                    <th style={{ width: 150 }}>Tanggal Acara</th>
                                    <th>Judul Acara</th>
                                    <th>Waktu & Lokasi</th>
                                    <th style={{ width: 80 }}>Status</th>
                                    <th style={{ width: 90 }}>Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {agendas.map((item, index) => (
                                    <tr key={item.id}>
                                        <td className="text-center">{index + 1}</td>
                                        <td><strong>{formatDate(item.event_date)}</strong></td>
                                        <td>
                                            <div style={{ fontWeight: 600 }}>{item.title}</div>
                                            {item.description && <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{item.description}</div>}
                                        </td>
                                        <td>
                                            <div style={{ fontSize: '0.85rem' }}>⏰ {item.time || '-'}</div>
                                            <div style={{ fontSize: '0.85rem' }}>📍 {item.location || '-'}</div>
                                        </td>
                                        <td>
                                            <span className={`badge ${item.is_active ? 'badge-success' : 'badge-secondary'}`}>
                                                {item.is_active ? 'Aktif' : 'Off'}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="action-group">
                                                <button className="btn-icon btn-edit" title="Edit" onClick={() => openModal(item)}>
                                                    <Edit2 size={16} />
                                                </button>
                                                <button className="btn-icon btn-delete danger" title="Hapus" onClick={() => handleDelete(item)}>
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Modal Form */}
            {showModal && (
                <div className="modal-backdrop glass animate-fade-in" onClick={() => setShowModal(false)} style={{ zIndex: 1100 }}>
                    <div className="modal animate-slide-up" style={{ maxWidth: 620 }} onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <div style={{
                                    width: 40, height: 40, borderRadius: 12,
                                    background: editItem ? 'var(--primary-50)' : 'var(--success-50)',
                                    color: editItem ? 'var(--primary-600)' : 'var(--success-600)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                                }}>
                                    {editItem ? <Edit2 size={20} /> : <Plus size={20} />}
                                </div>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{editItem ? 'Edit Agenda Sekolah' : 'Tambah Agenda Baru'}</h3>
                                    <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                        {editItem ? 'Perbarui informasi agenda yang sudah ada.' : 'Buat jadwal kegiatan sekolah baru.'}
                                    </p>
                                </div>
                            </div>
                            <button className="btn-close-round" onClick={() => setShowModal(false)}>
                                <X size={18} />
                            </button>
                        </div>
                        <form onSubmit={saveAgenda}>
                            <div className="modal-body">
                                <div className="form-group mb-4">
                                    <label className="cms-label"><AlignLeft size={14} /> Judul Acara <span className="text-danger">*</span></label>
                                    <div style={{ position: 'relative' }}>
                                        <input type="text" className="form-control" required
                                            placeholder="Masukan nama atau judul kegiatan..."
                                            style={{ paddingLeft: 12 }}
                                            value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="form-row mb-4">
                                    <div className="form-group mb-0">
                                        <label className="cms-label"><CalendarIcon size={14} /> Tanggal Acara <span className="text-danger">*</span></label>
                                        <input type="date" className="form-control" required
                                            value={formData.event_date} onChange={e => setFormData({ ...formData, event_date: e.target.value })}
                                        />
                                    </div>
                                    <div className="form-group mb-0">
                                        <label className="cms-label"><Clock size={14} /> Jam / Waktu</label>
                                        <input type="text" className="form-control" placeholder="Cth: 08:00 - 12:00"
                                            value={formData.time} onChange={e => setFormData({ ...formData, time: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="form-group mb-4">
                                    <label className="cms-label"><MapPin size={14} /> Lokasi / Tempat</label>
                                    <input type="text" className="form-control" placeholder="Cth: Aula Utama SMK PPRQ"
                                        value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })}
                                    />
                                </div>

                                <div className="form-group mb-4">
                                    <label className="cms-label"><AlignLeft size={14} /> Deskripsi Singkat</label>
                                    <textarea className="form-control" rows={3}
                                        placeholder="Tambahkan informasi tambahan jika diperlukan..."
                                        value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    ></textarea>
                                </div>

                                <div style={{
                                    background: 'var(--bg-hover)',
                                    padding: '16px',
                                    borderRadius: '12px',
                                    border: '1px solid var(--border-color)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                        <div style={{
                                            width: 32, height: 32, borderRadius: '50%',
                                            background: formData.is_active ? 'var(--success-50)' : 'var(--gray-100)',
                                            color: formData.is_active ? 'var(--success-600)' : 'var(--gray-400)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                                        }}>
                                            <CheckCircle2 size={18} />
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>Visibilitas Publik</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Tampilkan agenda ini di portal sekolah.</div>
                                        </div>
                                    </div>
                                    <label className="switch-control" style={{
                                        position: 'relative',
                                        display: 'inline-block',
                                        width: 44,
                                        height: 24,
                                        cursor: 'pointer'
                                    }}>
                                        <input type="checkbox" style={{ opacity: 0, width: 0, height: 0 }}
                                            checked={formData.is_active === 1}
                                            onChange={e => setFormData({ ...formData, is_active: e.target.checked ? 1 : 0 })}
                                        />
                                        <span style={{
                                            position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0,
                                            background: formData.is_active ? 'var(--success-500)' : '#cbd5e1',
                                            transition: '.3s', borderRadius: 24
                                        }}></span>
                                        <span style={{
                                            position: 'absolute', height: 18, width: 18, left: formData.is_active ? 22 : 3, bottom: 3,
                                            background: 'white', transition: '.3s', borderRadius: '50%',
                                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                        }}></span>
                                    </label>
                                </div>
                            </div>
                            <div className="modal-footer" style={{ background: 'var(--bg-hover)', borderBottomLeftRadius: 'var(--radius-2xl)', borderBottomRightRadius: 'var(--radius-2xl)' }}>
                                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)} style={{ border: 'none' }}>
                                    Batal
                                </button>
                                <button type="submit" className="btn btn-primary" disabled={saving} style={{ minWidth: 120, justifyContent: 'center' }}>
                                    {saving ? (
                                        <>
                                            <RefreshCw size={16} className="animate-spin" /> {editItem ? 'Menyimpan...' : 'Memproses...'}
                                        </>
                                    ) : (
                                        <>
                                            <Save size={16} /> {editItem ? 'Simpan Perubahan' : 'Tambah Agenda'}
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
