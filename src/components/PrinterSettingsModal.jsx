import { useState, useEffect } from 'react'
import Modal from './Modal'
import { bluetoothHelper } from '../utils/bluetoothHelper'
import { Bluetooth, RefreshCw, CheckCircle2, Circle, Trash2, Printer } from 'lucide-react'

export default function PrinterSettingsModal({ onClose }) {
    const [devices, setDevices] = useState([])
    const [defaultId, setDefaultId] = useState(bluetoothHelper.getDefaultPrinterId())
    const [loading, setLoading] = useState(false)
    const [scanning, setScanning] = useState(false)

    useEffect(() => {
        loadDevices()
    }, [])

    const loadDevices = async () => {
        setLoading(true)
        const list = await bluetoothHelper.getAuthorizedDevices()
        setDevices(list)
        setLoading(false)
    }

    const handleScan = async () => {
        setScanning(true)
        try {
            const device = await bluetoothHelper.requestPrinter()
            if (device) {
                console.log('Device picked:', device.name, device.id)
                // Simpan perangkat di memory dan jadikan default
                bluetoothHelper.setActiveDevice(device)
                setDefaultId(device.id)
                
                // Tambahkan ke state lokal segera tanpa menunggu getDevices
                setDevices(prev => {
                    const exists = prev.find(d => d.id === device.id)
                    if (exists) return prev
                    return [...prev, device]
                })

                // Jika browser HP tidak mendukung auto-connect PWA (getDevices), kita beri notifikasi saja
                if (!navigator.bluetooth.getDevices) {
                    import('sweetalert2').then(Swal => Swal.default.fire('Info', 'Printer diatur sebagai default! (Catatan: Keamanan Browser HP Anda mungkin masih mewajibkan popup konfirmasi saat mencetak).', 'success'))
                }
            }
        } catch (err) {
            console.error('Scan error:', err)
        } finally {
            setScanning(false)
        }
    }

    const handleSetDefault = (id) => {
        bluetoothHelper.setDefaultPrinterId(id)
        setDefaultId(id)
    }

    const handleForget = async (device) => {
        if (device.forget) {
            await device.forget()
            if (defaultId === device.id) {
                bluetoothHelper.setDefaultPrinterId(null)
                setDefaultId(null)
            }
            await loadDevices()
        }
    }

    return (
        <Modal 
            title="⚙️ Pengaturan Printer Bluetooth" 
            onClose={onClose}
            footer={
                <button className="btn btn-primary" onClick={onClose} style={{ borderRadius: 12 }}>
                    Selesai
                </button>
            }
        >
            <div className="printer-settings-container" style={{ padding: '4px' }}>
                <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '20px' }}>
                    Pilih printer Bluetooth yang akan digunakan sebagai perangkat cetak utama (default).
                </p>

                <div className="printer-list" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {devices.length > 0 ? (
                        devices.map((device) => (
                            <div 
                                key={device.id} 
                                onClick={() => handleSetDefault(device.id)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px',
                                    padding: '16px',
                                    borderRadius: '16px',
                                    background: defaultId === device.id ? 'rgba(var(--pos-primary-rgb), 0.08)' : '#f8fafc',
                                    border: `2px solid ${defaultId === device.id ? 'var(--pos-primary)' : 'transparent'}`,
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease',
                                    position: 'relative'
                                }}
                            >
                                <div style={{ 
                                    width: '44px', 
                                    height: '44px', 
                                    borderRadius: '12px', 
                                    background: defaultId === device.id ? 'var(--pos-primary)' : '#e2e8f0',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: defaultId === device.id ? '#fff' : '#64748b'
                                }}>
                                    <Printer size={22} />
                                </div>
                                
                                <div style={{ flex: 1 }}>
                                    <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>{device.name || 'Printer Bluetooth'}</h4>
                                    <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>ID: {device.id.slice(0, 8)}...</span>
                                </div>

                                {defaultId === device.id ? (
                                    <CheckCircle2 color="var(--pos-primary)" size={24} />
                                ) : (
                                    <Circle color="#cbd5e1" size={24} />
                                )}

                                <button 
                                    onClick={(e) => { e.stopPropagation(); handleForget(device); }}
                                    style={{ 
                                        position: 'absolute', 
                                        top: '8px', 
                                        right: '8px',
                                        padding: '4px',
                                        background: 'transparent',
                                        border: 'none',
                                        color: '#cbd5e1',
                                        cursor: 'pointer'
                                    }}
                                    title="Lupakan perangkat"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        ))
                    ) : (
                        <div style={{ 
                            textAlign: 'center', 
                            padding: '30px 20px', 
                            background: '#f1f5f9', 
                            borderRadius: '16px',
                            color: '#64748b' 
                        }}>
                            <Bluetooth size={40} style={{ opacity: 0.2, marginBottom: '12px' }} />
                            <p style={{ fontSize: '0.85rem' }}>Belum ada printer yang tersimpan.</p>
                        </div>
                    )}
                </div>

                <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'center' }}>
                    <button 
                        className={`btn ${scanning ? 'btn-ghost' : 'btn-outline'}`}
                        disabled={scanning}
                        onClick={handleScan}
                        style={{ 
                            borderRadius: '14px', 
                            gap: '8px',
                            padding: '10px 24px',
                            borderWidth: '1.5px',
                            borderColor: scanning ? 'transparent' : 'var(--pos-primary)',
                            color: 'var(--pos-primary)',
                            boxShadow: scanning ? 'none' : '0 4px 12px rgba(var(--pos-primary-rgb), 0.1)'
                        }}
                    >
                        {scanning ? (
                            <RefreshCw className="animate-spin" size={18} />
                        ) : (
                            <Bluetooth size={18} />
                        )}
                        {scanning ? 'Mencari...' : 'Scan Printer Baru'}
                    </button>
                </div>
            </div>

            <style dangerouslySetInnerHTML={{ __html: `
                @keyframes pulse-glow {
                    0% { box-shadow: 0 0 0 0 rgba(var(--pos-primary-rgb), 0.4); }
                    70% { box-shadow: 0 0 0 10px rgba(var(--pos-primary-rgb), 0); }
                    100% { box-shadow: 0 0 0 0 rgba(var(--pos-primary-rgb), 0); }
                }
                .printer-settings-container { font-family: 'Inter', sans-serif; }
                .animate-spin { animation: spin 1s linear infinite; }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            `}} />
        </Modal>
    )
}
