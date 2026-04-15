import { useState, useEffect, useCallback, useRef } from 'react'
import { API_BASE, getAuthHeaders } from '../../services/api'
import {
    Wifi, WifiOff, RefreshCw, LogOut, Send,
    QrCode, MessageCircle, CheckCircle, AlertCircle, Clock, History as HistoryIcon,
    ShieldCheck, ChevronRight, FileText
} from 'lucide-react'
import { useSettings } from '../../context/SettingsContext'

const styles = `
  .wa-page { max-width: 900px; margin: 0 auto; }
  .wa-card {
    background: var(--bg-card); border-radius: 28px; padding: 32px;
    border: 1px solid var(--border-color); box-shadow: var(--shadow-sm);
    margin-bottom: 24px; position: relative; overflow: hidden;
  }
  .wa-card:hover { box-shadow: var(--shadow-lg); }
  .wa-status-dot {
    width: 12px; height: 12px; border-radius: 50%;
    display: inline-block; margin-right: 8px;
  }
  .wa-btn {
    padding: 12px 24px; border-radius: 14px; border: 1.5px solid var(--border-color);
    background: var(--bg-card); font-weight: 700; font-size: 0.85rem;
    cursor: pointer; display: inline-flex; align-items: center; gap: 8px;
    color: var(--text-primary); transition: all 0.2s;
  }
  .wa-btn:hover { background: var(--bg-hover); transform: translateY(-1px); }
  .wa-btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
  .wa-btn-primary { background: #25D366; color: #fff; border-color: #25D366; }
  .wa-btn-primary:hover { background: #1da851; }
  .wa-btn-danger { border-color: var(--danger-500); color: var(--danger-500); }
  .wa-btn-danger:hover { background: rgba(239, 68, 68, 0.05); }
  .wa-qr-container {
    display: flex; justify-content: center; padding: 32px;
    background: #fff; border-radius: 20px; border: 2px dashed var(--border-color);
  }
  .wa-qr-container img { border-radius: 12px; max-width: 280px; }
  .wa-test-input {
    background: var(--bg-input); border: 1.5px solid var(--border-color);
    border-radius: 12px; padding: 12px 16px; color: var(--text-primary);
    font-weight: 600; width: 100%; transition: all 0.2s;
  }
  .wa-test-input:focus { border-color: #25D366; box-shadow: 0 0 0 4px rgba(37, 211, 102, 0.1); outline: none; }
  .wa-stat-row {
    display: flex; justify-content: space-between; align-items: center;
    padding: 12px 0; border-bottom: 1px solid var(--border-color);
  }
  .wa-stat-row:last-child { border-bottom: none; }
  .wa-wizard-step {
    padding: 20px; border-radius: 16px; background: var(--bg-stripe);
    border: 1px solid var(--border-color); margin-top: 16px;
  }
  @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
  .pulse-dot { animation: pulse 1.5s ease-in-out infinite; }

  @media (max-width: 768px) {
    .wa-page { padding: 0 4px; }
    .wa-card { padding: 20px; border-radius: 24px; }
    .wa-btn { padding: 10px 16px; font-size: 0.8rem; flex: 1; justify-content: center; }
    .wa-grid-responsive { grid-template-columns: 1fr !important; }
    .wa-stat-row { flex-direction: column; align-items: flex-start; gap: 4px; padding: 16px 0; }
    .wa-stat-row span:last-child { width: 100%; text-align: left; margin-top: 4px; }
    .wa-qr-container img { max-width: 100%; }
    .wa-card .d-flex.align-items-center.gap-20 { gap: 12px !important; }
    .wa-card h2 { font-size: 1.25rem !important; }
    .wa-card p { font-size: 0.8rem !important; }
    .wa-tips-grid { grid-template-columns: 1fr !important; }
    .wa-card-header-row { flex-wrap: wrap; gap: 12px; }
    .wa-card-header-row h3 { font-size: 0.95rem !important; }
  }
  @media (max-width: 480px) {
    .wa-card { padding: 14px; border-radius: 18px; margin-bottom: 14px; }
    .wa-wizard-step { padding: 14px; }
    .wa-test-input { font-size: 15px; }
  }
`

export default function WhatsAppConfigPage() {
    const [status, setStatus] = useState(null)
    const [loading, setLoading] = useState(true)
    const [testPhone, setTestPhone] = useState('')
    const [testMessage, setTestMessage] = useState('Halo! Ini pesan tes dari SIAS 🎓')
    const [testResult, setTestResult] = useState(null)
    const [sending, setSending] = useState(false)
    const [configWizardStep, setConfigWizardStep] = useState(0) // 0: idle, 1: input, 2: confirm
    const [newHourlyLimit, setNewHourlyLimit] = useState(50)
    const intervalRef = useRef(null)

    const { schoolSettings, updateSchoolSettings } = useSettings()
    const defaultTemplate = `*📋 NOTA PEMBAYARAN*\n*SMK PPRQ - SIAS*\n\nNo. Invoice: *{invoiceNo}*\nNama Siswa: *{siswaNama}*\n\n*Rincian Pembayaran:*\n{rincian}\n\n*Total: {total}*\nDibayar: {dibayar}\nKembali: {kembali}\n\nTerima kasih atas pembayarannya. 🙏`
    const [waTemplate, setWaTemplate] = useState(defaultTemplate)
    const [isSavingTemplate, setIsSavingTemplate] = useState(false)

    useEffect(() => {
        if (schoolSettings?.wa_template_pembayaran) {
            setWaTemplate(schoolSettings.wa_template_pembayaran)
        }
    }, [schoolSettings])

    const handleSaveTemplate = async () => {
        setIsSavingTemplate(true)
        await updateSchoolSettings({ wa_template_pembayaran: waTemplate })
        setIsSavingTemplate(false)
    }

    const fetchStatus = useCallback(async () => {
        try {
            const res = await fetch(`${API_BASE}/admin/whatsapp/status`, { headers: getAuthHeaders() })
            if (res.ok) {
                const data = await res.json()
                setStatus(data)
                if (configWizardStep === 0) setNewHourlyLimit(data.hourlyLimit || 50)
            }
        } catch (err) {
            console.error('Fetch WA status error:', err)
        } finally {
            setLoading(false)
        }
    }, [configWizardStep])

    useEffect(() => {
        fetchStatus()
        intervalRef.current = setInterval(fetchStatus, 5000)
        return () => clearInterval(intervalRef.current)
    }, [fetchStatus])

    const handleLogout = async () => {
        await fetch(`${API_BASE}/admin/whatsapp/logout`, { method: 'POST', headers: getAuthHeaders() })
        fetchStatus()
    }

    const handleRestart = async () => {
        await fetch(`${API_BASE}/admin/whatsapp/restart`, { method: 'POST', headers: getAuthHeaders() })
        fetchStatus()
    }

    const handleTest = async () => {
        if (!testPhone) return
        setSending(true)
        setTestResult(null)
        try {
            const res = await fetch(`${API_BASE}/admin/whatsapp/test`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({ phone: testPhone, message: testMessage })
            })
            const data = await res.json()
            setTestResult(data)
        } catch (err) {
            setTestResult({ success: false, reason: err.message })
        } finally {
            setSending(false)
        }
    }

    const handleClearHistory = async () => {
        await fetch(`${API_BASE}/admin/whatsapp/clear-history`, { method: 'POST', headers: getAuthHeaders() })
        fetchStatus()
    }

    const handleUpdateConfig = async () => {
        await fetch(`${API_BASE}/admin/whatsapp/update-config`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ hourlyLimit: newHourlyLimit })
        })
        setConfigWizardStep(0)
        fetchStatus()
    }

    const isConnected = status?.isReady
    const hasQR = status?.qrCode
    const history = status?.history || []

    return (
        <div className="wa-page fade-in">
            <style dangerouslySetInnerHTML={{ __html: styles }} />

            {/* Header */}
            <div className="wa-card" style={{ background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)', color: '#fff', border: 'none' }}>
                <div style={{ position: 'absolute', top: -30, right: -30, width: 150, height: 150, background: 'rgba(255,255,255,0.08)', borderRadius: '50%' }} />
                <div style={{ position: 'absolute', bottom: -50, left: -20, width: 120, height: 120, background: 'rgba(255,255,255,0.05)', borderRadius: '50%' }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: 20, position: 'relative', zIndex: 1 }}>
                    <div style={{
                        width: 64, height: 64, borderRadius: 20,
                        background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                        <MessageCircle size={32} />
                    </div>
                    <div>
                        <h2 style={{ fontWeight: 900, fontSize: '1.5rem', margin: 0, letterSpacing: '-0.5px' }}>WhatsApp Gateway</h2>
                        <p style={{ margin: '4px 0 0', opacity: 0.85, fontSize: '0.9rem', fontWeight: 600 }}>
                            Konfigurasi & Monitoring Layanan Pesan
                        </p>
                    </div>
                </div>
            </div>

            <div className="wa-grid-responsive" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                    {/* Status Card */}
                    <div className="wa-card" style={{ height: '100%' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                            <h3 style={{ margin: 0, fontWeight: 800, fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: 10 }}>
                                {isConnected ? <Wifi size={22} style={{ color: '#25D366' }} /> : <WifiOff size={22} style={{ color: 'var(--danger-500)' }} />}
                                Status Koneksi
                            </h3>
                            <div style={{ display: 'flex', gap: 8 }}>
                                <button className="wa-btn" onClick={handleRestart} disabled={loading}>
                                    <RefreshCw size={16} /> Restart
                                </button>
                                {isConnected && (
                                    <button className="wa-btn wa-btn-danger" onClick={handleLogout}>
                                        <LogOut size={16} /> Logout
                                    </button>
                                )}
                            </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                            <div className="wa-stat-row">
                                <span style={{ color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.85rem' }}>Mode</span>
                                <span style={{ fontWeight: 700, textTransform: 'uppercase', fontSize: '0.85rem' }}>
                                    {status?.mode === 'internal' ? '🟢 Internal (whatsapp-web.js)' : '🔵 External API'}
                                </span>
                            </div>
                            <div className="wa-stat-row">
                                <span style={{ color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.85rem' }}>Status</span>
                                <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, fontSize: '0.85rem' }}>
                                    <span className={`wa-status-dot ${!loading ? '' : 'pulse-dot'}`} style={{ background: isConnected ? '#25D366' : '#ef4444' }} />
                                    {loading ? 'Memeriksa...' : (status?.statusMessage || 'Tidak diketahui')}
                                </span>
                            </div>
                            <div className="wa-stat-row">
                                <span style={{ color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.85rem' }}>Antrean Pesan</span>
                                <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>{status?.queueLength || 0} pesan</span>
                            </div>
                            <div className="wa-stat-row">
                                <span style={{ color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.85rem' }}>Terkirim (1 jam terakhir)</span>
                                <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>{status?.sentThisHour || 0} / 50</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                    {/* Test Message Section */}
                    <div className="wa-card" style={{ height: '100%' }}>
                        <h3 style={{ margin: '0 0 20px', fontWeight: 800, fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: 10 }}>
                            <Send size={20} style={{ color: '#25D366' }} />
                            Kirim Pesan Tes
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            <div>
                                <input
                                    type="text"
                                    className="wa-test-input"
                                    placeholder="Nomor HP Tujuan (0812...)"
                                    value={testPhone}
                                    onChange={e => setTestPhone(e.target.value)}
                                />
                            </div>
                            <div>
                                <textarea
                                    className="wa-test-input"
                                    rows={2}
                                    value={testMessage}
                                    onChange={e => setTestMessage(e.target.value)}
                                    style={{ resize: 'none' }}
                                />
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <button
                                    className="wa-btn wa-btn-primary"
                                    onClick={handleTest}
                                    disabled={sending || !testPhone || !isConnected}
                                    style={{ flex: 1 }}
                                >
                                    {sending ? <Clock size={16} /> : <Send size={16} />} 
                                    {sending ? 'Mengirim...' : 'Kirim Tes'}
                                </button>
                                {testResult && (
                                    <span style={{
                                        display: 'flex', alignItems: 'center', gap: 6,
                                        fontWeight: 700, fontSize: '0.85rem',
                                        color: testResult.success ? '#25D366' : 'var(--danger-500)'
                                    }}>
                                        {testResult.success ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* QR Code Section */}
            {hasQR && (
                <div className="wa-card">
                    <h3 style={{ margin: '0 0 8px', fontWeight: 800, fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: 10 }}>
                        <QrCode size={22} style={{ color: '#25D366' }} />
                        Scan QR Code
                    </h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: '0 0 20px' }}>
                        Buka WhatsApp di HP → Perangkat Tertaut → Tautkan Perangkat → Scan QR di bawah
                    </p>
                    <div className="wa-qr-container">
                        <img src={status.qrCode} alt="WhatsApp QR Code" />
                    </div>
                </div>
            )}

            {/* Advanced Settings Wizard */}
            <div className="wa-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ margin: 0, fontWeight: 800, fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: 10 }}>
                        <ShieldCheck size={22} style={{ color: '#8b5cf6' }} />
                        Pengaturan Lanjutan
                    </h3>
                    {configWizardStep === 0 && (
                        <button className="wa-btn" onClick={() => setConfigWizardStep(1)}>
                            Ubah Konfigurasi
                        </button>
                    )}
                </div>

                {configWizardStep === 0 ? (
                    <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ padding: '8px 16px', borderRadius: 12, background: 'var(--bg-stripe)', border: '1px solid var(--border-color)', flex: 1 }}>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Limit Pengiriman:</span>
                            <span style={{ marginLeft: 8, fontWeight: 800, color: 'var(--text-primary)' }}>{status?.hourlyLimit || 50} pesan / jam</span>
                        </div>
                    </div>
                ) : configWizardStep === 1 ? (
                    <div className="wa-wizard-step fade-in">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                            <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#8b5cf6', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>1</div>
                            <h4 style={{ margin: 0, fontWeight: 700, fontSize: '0.95rem' }}>Tentukan Limit Baru</h4>
                        </div>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 20 }}>
                            Masukkan jumlah maksimal pesan yang boleh dikirim oleh sistem dalam satu jam.
                        </p>
                        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                            <input
                                type="number"
                                className="wa-test-input"
                                value={newHourlyLimit}
                                onChange={e => setNewHourlyLimit(parseInt(e.target.value))}
                                style={{ width: 120 }}
                                min="1"
                                max="500"
                            />
                            <span style={{ fontWeight: 600, color: 'var(--text-muted)' }}>pesan per jam</span>
                        </div>
                        <div style={{ marginTop: 24, display: 'flex', gap: 12 }}>
                            <button className="wa-btn wa-btn-primary" onClick={() => setConfigWizardStep(2)} disabled={!newHourlyLimit}>
                                Lanjut <ChevronRight size={16} />
                            </button>
                            <button className="wa-btn" onClick={() => setConfigWizardStep(0)}>Batal</button>
                        </div>
                    </div>
                ) : (
                    <div className="wa-wizard-step fade-in" style={{ borderColor: 'var(--danger-500)', background: 'rgba(239, 68, 68, 0.02)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--danger-500)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>2</div>
                            <h4 style={{ margin: 0, fontWeight: 700, fontSize: '0.95rem', color: 'var(--danger-500)' }}>Peringatan Keamanan</h4>
                        </div>
                        <div style={{ display: 'flex', gap: 16, background: 'rgba(239, 68, 68, 0.05)', padding: 16, borderRadius: 12, marginBottom: 20, border: '1px solid rgba(239, 68, 68, 0.1)' }}>
                            <AlertCircle size={24} style={{ color: 'var(--danger-500)', flexShrink: 0 }} />
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', lineHeight: 1.6 }}>
                                <p style={{ margin: '0 0 8px', fontWeight: 700 }}>Anda akan mengubah limit menjadi {newHourlyLimit} pesan/jam.</p>
                                Mengirim terlalu banyak pesan dalam waktu singkat meningkatkan risiko nomor WhatsApp Anda <strong>diblokir permanen</strong> oleh sistem WhatsApp. Pastikan nomor aman dan reputasi chat sudah baik.
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: 12 }}>
                            <button className="wa-btn wa-btn-danger" style={{ background: 'var(--danger-500)', color: '#fff' }} onClick={handleUpdateConfig}>
                                Saya Mengerti & Terapkan
                            </button>
                            <button className="wa-btn" onClick={() => setConfigWizardStep(1)}>Kembali</button>
                        </div>
                    </div>
                )}
            </div>

            {/* Template Editor Section */}
            <div className="wa-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                    <h3 style={{ margin: 0, fontWeight: 800, fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: 10 }}>
                        <FileText size={22} style={{ color: '#0ea5e9' }} />
                        Template Nota Pembayaran
                    </h3>
                    <button className="wa-btn wa-btn-primary" onClick={handleSaveTemplate} disabled={isSavingTemplate} style={{ height: 36, padding: '0 16px', fontSize: '0.8rem', background: '#0ea5e9', borderColor: '#0ea5e9' }}>
                        {isSavingTemplate ? 'Menyimpan...' : 'Simpan Template'}
                    </button>
                </div>
                <div className="wa-grid-responsive" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24 }}>
                    <div>
                        <textarea
                            className="wa-test-input"
                            style={{ width: '100%', height: '220px', fontFamily: 'monospace', fontSize: '0.85rem', resize: 'vertical' }}
                            value={waTemplate}
                            onChange={(e) => setWaTemplate(e.target.value)}
                        />
                    </div>
                    <div style={{ background: 'var(--bg-stripe)', padding: 16, borderRadius: 16, border: '1px solid var(--border-color)', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        <h4 style={{ margin: '0 0 10px', fontWeight: 800, color: 'var(--text-primary)' }}>Variabel Dinamis:</h4>
                        <ul style={{ paddingLeft: 16, margin: 0, lineHeight: 1.8 }}>
                            <li><code>{`{invoiceNo}`}</code> : No. Invoice</li>
                            <li><code>{`{siswaNama}`}</code> : Nama Lengkap Siswa</li>
                            <li><code>{`{rincian}`}</code> : Daftar Item Dibayar</li>
                            <li><code>{`{total}`}</code> : Total Tagihan (Rp)</li>
                            <li><code>{`{dibayar}`}</code> : Nominal Dibayar (Rp)</li>
                            <li><code>{`{kembali}`}</code> : Nominal Kembalian (Rp)</li>
                        </ul>
                        <div style={{ marginTop: 16, padding: '8px 12px', background: 'rgba(14, 165, 233, 0.1)', color: '#0ea5e9', borderRadius: 8, fontWeight: 600 }}>
                            Gunakan *teks* untuk tulisan tebal (bold).
                        </div>
                    </div>
                </div>
            </div>

            {/* History Table */}
            <div className="wa-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                    <h3 style={{ margin: 0, fontWeight: 800, fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: 10 }}>
                        <HistoryIcon size={20} style={{ color: '#25D366' }} />
                        Riwayat & Antrean Pesan
                    </h3>
                    <button className="wa-btn" onClick={handleClearHistory} style={{ height: 32, padding: '0 12px', fontSize: '0.75rem' }}>
                        Hapus Riwayat
                    </button>
                </div>

                <div className="table-responsive">
                    <table className="table table-hover align-middle" style={{ margin: 0 }}>
                        <thead>
                            <tr style={{ background: 'var(--bg-stripe)', border: 'none' }}>
                                <th style={{ padding: '12px 16px', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', border: 'none', borderTopLeftRadius: 12 }}>WAKTU</th>
                                <th style={{ padding: '12px 16px', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', border: 'none' }}>NOMOR</th>
                                <th style={{ padding: '12px 16px', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', border: 'none' }}>PESAN</th>
                                <th style={{ padding: '12px 16px', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', border: 'none', borderTopRightRadius: 12 }}>STATUS</th>
                            </tr>
                        </thead>
                        <tbody>
                            {history.length === 0 ? (
                                <tr>
                                    <td colSpan="4" style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                        Belum ada riwayat pengiriman pesan
                                    </td>
                                </tr>
                            ) : history.map((item) => (
                                <tr key={item.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                    <td style={{ padding: '14px 16px', fontSize: '0.8rem', fontWeight: 600 }}>
                                        {new Date(item.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                                    </td>
                                    <td style={{ padding: '14px 16px', fontSize: '0.8rem', fontWeight: 700 }}>
                                        {item.phone}
                                    </td>
                                    <td style={{ padding: '14px 16px', fontSize: '0.8rem', color: 'var(--text-secondary)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {item.message}
                                    </td>
                                    <td style={{ padding: '14px 16px' }}>
                                        {item.status === 'sent' && (
                                            <span style={{ padding: '4px 10px', borderRadius: 20, background: 'rgba(37, 211, 102, 0.1)', color: '#25D366', fontSize: '0.7rem', fontWeight: 800 }}>
                                                Terkirim
                                            </span>
                                        )}
                                        {item.status === 'pending' && (
                                            <span style={{ padding: '4px 10px', borderRadius: 20, background: 'rgba(234, 179, 8, 0.1)', color: '#ca8a04', fontSize: '0.7rem', fontWeight: 800 }}>
                                                Antrean
                                            </span>
                                        )}
                                        {item.status === 'failed' && (
                                            <span title={item.error} style={{ padding: '4px 10px', borderRadius: 20, background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', fontSize: '0.7rem', fontWeight: 800, cursor: 'help' }}>
                                                Gagal
                                            </span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Info Section */}
            <div className="wa-card" style={{ background: 'var(--bg-stripe)' }}>
                <h4 style={{ fontWeight: 800, margin: '0 0 12px', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <AlertCircle size={18} /> Tips Keamanan
                </h4>
                <div className="wa-tips-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                    <div style={{ display: 'flex', gap: 10 }}>
                        <div style={{ color: '#25D366', flexShrink: 0 }}>•</div>
                        <div><strong>Jeda Acak:</strong> Tiap pesan diberi jeda 5-15 detik otomatis untuk menghindari deteksi bot.</div>
                    </div>
                    <div style={{ display: 'flex', gap: 10 }}>
                        <div style={{ color: '#25D366', flexShrink: 0 }}>•</div>
                        <div><strong>Batas Per Jam:</strong> Disarankan tidak lebih dari 50 pesan/jam untuk akun baru/jarang dipakai.</div>
                    </div>
                    <div style={{ display: 'flex', gap: 10 }}>
                        <div style={{ color: '#25D366', flexShrink: 0 }}>•</div>
                        <div><strong>Konten Dinamis:</strong> Sistem menambahkan waktu pengiriman agar isi pesan tidak identik 100%.</div>
                    </div>
                    <div style={{ display: 'flex', gap: 10 }}>
                        <div style={{ color: '#25D366', flexShrink: 0 }}>•</div>
                        <div><strong>Nomor Aktif:</strong> Gunakan nomor yang sering digunakan untuk chat (bukan nomor baru beli sekali pakai).</div>
                    </div>
                </div>
            </div>
        </div>
    )
}
