import { useState } from 'react'
import { useApp } from '../context/AppContext'
import { History, RotateCcw, AlertCircle, Calendar, User, Hash } from 'lucide-react'
import EmptyState from '../components/EmptyState'

export default function RiwayatGeneratePage() {
    const { generateLogs, rollbackGeneration, formatRupiah, loading } = useApp()
    const [search, setSearch] = useState('')
    const [isProcessing, setIsProcessing] = useState(false)

    const filtered = (generateLogs || []).filter(log =>
        (log.keterangan || '').toLowerCase().includes(search.toLowerCase()) ||
        (log.operator || '').toLowerCase().includes(search.toLowerCase())
    )

    const handleRollback = async (id) => {
        if (!window.confirm('Apakah Anda yakin ingin melakukan rollback? Seluruh tagihan yang dibuat dalam batch ini akan dihapus. (Hanya bisa dilakukan jika belum ada tagihan yang dibayar)')) {
            return
        }

        setIsProcessing(true)
        await rollbackGeneration(id)
        setIsProcessing(false)
    }

    return (
        <div className="fade-in">
            <div className="page-header">
                <h1>Riwayat Generate Tagihan</h1>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                    Pantau dan batalkan (rollback) batch pembuatan tagihan jika terjadi kesalahan.
                </div>
            </div>

            <div className="filter-bar">
                <div className="search-input">
                    <Hash size={16} className="search-icon" />
                    <input
                        className="form-control"
                        placeholder="Cari keterangan atau operator..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>
            </div>

            {filtered.length === 0 ? (
                <EmptyState
                    icon={History}
                    title="Riwayat Kosong"
                    message="Belum ada catatan pembuatan tagihan yang ditemukan."
                />
            ) : (
                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Waktu</th>
                                <th>Tipe</th>
                                <th>Keterangan</th>
                                <th>Jumlah</th>
                                <th>Operator</th>
                                <th style={{ textAlign: 'right' }}>Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map(log => (
                                <tr key={log.id}>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <Calendar size={14} color="var(--primary-500)" />
                                            <div>
                                                {new Date(log.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                                    {new Date(log.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <span className={`badge ${log.tipe === 'bulk' ? 'badge-primary' : 'badge-ghost'}`}>
                                            {log.tipe === 'bulk' ? 'Massal' : 'Tunggal'}
                                        </span>
                                    </td>
                                    <td style={{ fontWeight: 500 }}>{log.keterangan}</td>
                                    <td>
                                        <div style={{ fontWeight: 600 }}>{log.jumlah_tagihan} Items</div>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <User size={14} />
                                            {log.operator || '-'}
                                        </div>
                                    </td>
                                    <td style={{ textAlign: 'right' }}>
                                        <button
                                            className="btn btn-danger btn-sm"
                                            style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                                            onClick={() => handleRollback(log.id)}
                                            disabled={isProcessing}
                                        >
                                            <RotateCcw size={14} /> Rollback
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            <div style={{ marginTop: '24px', padding: '16px', borderRadius: '8px', backgroundColor: 'var(--warning-50)', border: '1px solid var(--warning-200)', display: 'flex', gap: '12px' }}>
                <AlertCircle size={20} color="var(--warning-600)" style={{ flexShrink: 0 }} />
                <div style={{ fontSize: '0.85rem', color: 'var(--warning-800)' }}>
                    <strong>Catatan:</strong> Rollback hanya dapat dilakukan jika <strong>seluruh tagihan</strong> dalam batch tersebut belum ada yang dibayar. Jika salah satu saja sudah ada yang berstatus "Lunas", maka tombol rollback akan menolak penghapusan untuk menjaga integritas data keuangan.
                </div>
            </div>
        </div>
    )
}
