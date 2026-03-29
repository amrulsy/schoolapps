import React from 'react';
import { AlertTriangle, Settings } from 'lucide-react';

export default function MaintenancePage() {
    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: '#f8fafc',
            color: '#334155',
            padding: '20px',
            textAlign: 'center',
            fontFamily: 'Inter, system-ui, -apple-system, sans-serif'
        }}>
            <div className="fade-in" style={{
                background: 'white',
                padding: '40px',
                borderRadius: '16px',
                boxShadow: '0 10px 25px rgba(0,0,0,0.05)',
                maxWidth: '500px',
                width: '100%'
            }}>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginBottom: '24px' }}>
                    <Settings 
                        size={64} 
                        color="var(--primary-500, #3b82f6)" 
                        style={{ animation: 'spin 4s linear infinite' }} 
                    />
                </div>
                
                <h1 style={{ 
                    fontSize: '1.75rem', 
                    fontWeight: '700', 
                    color: '#0f172a',
                    marginBottom: '16px' 
                }}>
                    Sistem Dalam Pemeliharaan
                </h1>
                
                <p style={{ 
                    fontSize: '1rem', 
                    lineHeight: '1.6', 
                    color: '#64748b',
                    marginBottom: '24px' 
                }}>
                    Mohon maaf, portal saat ini sedang tidak dapat diakses karena kami sedang melakukan sinkronisasi data dan pemeliharaan sistem. 
                </p>

                <div style={{
                    backgroundColor: '#fffbeb',
                    border: '1px solid #fef3c7',
                    padding: '16px',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    justifyContent: 'center',
                    color: '#92400e'
                }}>
                    <AlertTriangle size={20} style={{ flexShrink: 0 }} />
                    <span style={{ fontSize: '0.9rem', fontWeight: '500', textAlign: 'left' }}>
                        Silakan kembali beberapa saat lagi setelah proses maintenance selesai.
                    </span>
                </div>

                <style>{`
                    @keyframes spin { 
                        100% { transform: rotate(360deg); } 
                    }
                    .fade-in {
                        animation: fadeIn 0.4s ease-out;
                    }
                    @keyframes fadeIn {
                        from { opacity: 0; transform: translateY(10px); }
                        to { opacity: 1; transform: translateY(0); }
                    }
                `}</style>
            </div>
            <div style={{ marginTop: '24px', color: '#94a3b8', fontSize: '0.85rem' }}>
                Mode Pemeliharaan Aktif &copy; {new Date().getFullYear()}
            </div>
        </div>
    );
}
