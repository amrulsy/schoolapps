import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
    Download,
    Upload,
    AlertTriangle,
    CheckCircle2,
    Loader2,
    Database,
    ShieldCheck,
    History,
    FileJson,
    FolderArchive
} from 'lucide-react';

const API_BASE = `${window.location.protocol}//${window.location.hostname}:3000/api`;

const BackupPage = () => {
    const { addToast } = useApp();
    const [loading, setLoading] = useState(false);
    const [file, setFile] = useState(null);
    const [serverStatus, setServerStatus] = useState('checking'); // 'checking', 'online', 'offline'

    const checkServer = async () => {
        try {
            const res = await fetch(`${API_BASE}/ping`);
            if (res.ok) setServerStatus('online');
            else setServerStatus('offline');
        } catch (e) {
            setServerStatus('offline');
        }
    };

    React.useEffect(() => {
        checkServer();
    }, []);

    const handleExport = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const targetUrl = `${API_BASE}/admin/backup/export`;
            console.log('Fetching backup from:', targetUrl);

            const response = await fetch(targetUrl, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) {
                const contentType = response.headers.get('content-type');
                let errorMessage = `HTTP Error ${response.status}`;

                if (contentType && contentType.includes('application/json')) {
                    const errorData = await response.json();
                    errorMessage = errorData.error || errorMessage;
                } else {
                    const text = await response.text();
                    console.error('Non-JSON Error Response:', text);
                    errorMessage = `Kesalahan Server (${response.status}). Silakan cek koneksi backend.`;
                }
                throw new Error(errorMessage);
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            const timestamp = new Date().toISOString().slice(0, 10);
            a.download = `sias-backup-${timestamp}.zip`;
            document.body.appendChild(a);
            a.click();

            // Clean up after a small delay
            setTimeout(() => {
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
            }, 100);

            addToast('success', 'Berhasil', 'Backup berhasil diunduh!');
        } catch (err) {
            console.error('Export Error:', err);
            const msg = (err.message === 'Failed to fetch' || err.name === 'TypeError')
                ? 'Gagal terhubung ke API (Failed to fetch). Pastikan server backend di port 3000 sedang aktif dan dapat dijangkau.'
                : err.message;
            addToast('danger', 'Gagal', msg);
        } finally {
            setLoading(false);
        }
    };

    const handleImport = async (e) => {
        if (e) e.preventDefault();
        if (!file) return;

        if (!window.confirm('PERINGATAN KRITIKAL:\n\nProses restore akan menghapus SELURUH data saat ini dan menggantinya dengan data dari file backup.\n\nApakah Anda yakin ingin melanjutkan?')) {
            return;
        }

        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const formData = new FormData();
            formData.append('backup', file);

            const targetUrl = `${API_BASE}/admin/backup/import`;
            console.log('Restoring backup to:', targetUrl);

            const response = await fetch(targetUrl, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Restore gagal');

            addToast('success', 'Berhasil', 'Data berhasil dipulihkan! Halaman akan dimuat ulang...');
            setFile(null);
            setTimeout(() => window.location.reload(), 2500);
        } catch (err) {
            const msg = (err.message === 'Failed to fetch' || err.name === 'TypeError')
                ? 'Gagal terhubung ke API (Failed to fetch). Pastikan server backend di port 3000 sedang aktif.'
                : err.message;
            addToast('danger', 'Gagal', msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fade-in">
            {/* Header */}
            <div className="page-header">
                <div>
                    <h1><Database size={24} style={{ marginRight: 8, verticalAlign: 'middle' }} /> Backup & Restore</h1>
                    <p style={{ color: 'var(--text-secondary)', marginTop: 4, fontSize: '0.9rem' }}>
                        Kelola cadangan data dan pemulihan sistem secara aman.
                    </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div className={`badge ${serverStatus === 'online' ? 'badge-success' : serverStatus === 'offline' ? 'badge-danger' : 'badge-warning'}`}>
                        Backend: {serverStatus.toUpperCase()}
                    </div>
                    <button className="btn btn-ghost btn-sm" onClick={checkServer}>
                        <History size={14} /> Cek Koneksi
                    </button>
                </div>
            </div>

            <div className="grid-2">
                {/* Export Section */}
                <div className="card">
                    <div className="card-header">
                        <h3><Download size={20} className="mr-2" /> Buat Backup</h3>
                    </div>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 20 }}>
                        Amankan data sistem dengan mengunduh salinan lengkap database dan file media ke komputer Anda.
                    </p>

                    <div style={{ background: 'var(--gray-50)', padding: 16, borderRadius: 8, marginBottom: 20 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.85rem', marginBottom: 8 }}>
                            <FileJson size={16} color="var(--primary-500)" />
                            <span>Database Dump (.json)</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.85rem' }}>
                            <FolderArchive size={16} color="var(--primary-500)" />
                            <span>Folder Upload & Media</span>
                        </div>
                    </div>

                    <button
                        className="btn btn-primary w-full btn-lg"
                        onClick={handleExport}
                        disabled={loading}
                    >
                        {loading ? <Loader2 className="animate-spin" /> : <Download size={18} />}
                        {loading ? 'Memproses...' : 'Unduh Backup (.zip)'}
                    </button>
                </div>

                {/* Import Section */}
                <div className="card">
                    <div className="card-header">
                        <h3><Upload size={20} className="mr-2" /> Restore Data</h3>
                    </div>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 20 }}>
                        Pulihkan sistem ke keadaan sebelumnya dengan mengunggah file arsip backup (.zip).
                    </p>

                    <form onSubmit={handleImport}>
                        <div className="form-group">
                            <label>Pilih File Backup (.zip)</label>
                            <input
                                type="file"
                                className="form-control"
                                accept=".zip"
                                onChange={(e) => setFile(e.target.files[0])}
                                style={{ paddingTop: 8 }}
                            />
                            {file && (
                                <p style={{ fontSize: '0.75rem', color: 'var(--success-600)', marginTop: 8, fontWeight: 600 }}>
                                    ✓ File siap: {file.name} ({(file.size / 1024).toFixed(1)} KB)
                                </p>
                            )}
                        </div>

                        <button
                            type="submit"
                            className="btn btn-danger w-full btn-lg"
                            disabled={loading || !file}
                            style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}
                        >
                            {loading ? <Loader2 className="animate-spin" /> : <ShieldCheck size={18} />}
                            {loading ? 'Memulihkan...' : 'Mulai Restore Data'}
                        </button>
                    </form>
                </div>
            </div>

            {/* Warning Section */}
            <div className="card" style={{ marginTop: 24, borderLeft: '4px solid var(--danger-500)', background: 'rgba(239, 68, 68, 0.02)' }}>
                <div style={{ display: 'flex', gap: 16 }}>
                    <div style={{ color: 'var(--danger-500)', paddingTop: 4 }}>
                        <AlertTriangle size={32} />
                    </div>
                    <div>
                        <h4 style={{ color: 'var(--danger-700)', fontWeight: 700, marginBottom: 4 }}>Informasi Penting & Keamanan</h4>
                        <ul style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', paddingLeft: 18, lineHeight: 1.7 }}>
                            <li>Proses <strong>Restore</strong> akan menimpa data yang ada saat ini secara permanen.</li>
                            <li>Pastikan file backup yang diunggah adalah file asli yang diunduh dari sistem ini.</li>
                            <li>Jangan menutup atau merefresh halaman saat proses backup atau restore sedang berjalan.</li>
                            <li>Sangat disarankan untuk melakukan backup sebelum melakukan pemulihan data baru.</li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* Logs Placeholder or Status */}
            <div style={{ marginTop: 32, textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                <History size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                <span>Status Sistem: Siap | Versi Data: 1.0.0</span>
            </div>
        </div>
    );
};

export default BackupPage;
