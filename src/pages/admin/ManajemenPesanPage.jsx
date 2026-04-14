import { useState, useEffect, useRef, useCallback } from 'react'
import { API_BASE } from '../../services/api'
import LoadingSpinner from '../../components/LoadingSpinner'
import {
    MessageSquare, Search, Send,  Check, CheckCheck,
    Plus, MoreVertical, Phone,  Hash, Info
} from 'lucide-react'

export default function ManajemenPesanPage() {
    const [contacts, setContacts] = useState([])
    const [activeContact, setActiveContact] = useState(null)
    const [messages, setMessages] = useState([])
    const [text, setText] = useState('')
    const [search, setSearch] = useState('')
    const [loadingContacts, setLoadingContacts] = useState(true)
    const [loadingMessages, setLoadingMessages] = useState(false)
    const [isSending, setIsSending] = useState(false)
    const messagesEndRef = useRef(null)

    const fetchContacts = useCallback(async () => {
        try {
            const token = localStorage.getItem('token')
            const res = await fetch(`${API_BASE}/admin/pesan/contacts`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })
            if (res.ok) setContacts(await res.json())
        } catch (err) {
            console.error('Gagal fetch contacts', err)
        } finally {
            setLoadingContacts(false)
        }
    }, [])

    const fetchMessages = useCallback(async (siswaId) => {
        if (!siswaId) return
        setLoadingMessages(true)
        try {
            const token = localStorage.getItem('token')
            const res = await fetch(`${API_BASE}/admin/pesan/${siswaId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })
            if (res.ok) {
                const data = await res.json()
                setMessages(data)
            }
        } catch (err) {
            console.error('Gagal fetch messages', err)
        } finally {
            setLoadingMessages(false)
            // Scroll to bottom after state update
            setTimeout(scrollToBottom, 50)
        }
    }, [])

    // Auto-refresh contacts
    useEffect(() => {
        fetchContacts()
        const interval = setInterval(fetchContacts, 15000)
        return () => clearInterval(interval)
    }, [fetchContacts])

    // Fetch messages on contact change and auto-refresh
    useEffect(() => {
        if (activeContact) {
            const contactId = activeContact.id
            fetchMessages(contactId)
            const interval = setInterval(() => {
                // Background refresh without loading state to avoid flickering
                const refreshMessages = async () => {
                    try {
                        const token = localStorage.getItem('token')
                        const res = await fetch(`${API_BASE}/admin/pesan/${contactId}`, {
                            headers: { 'Authorization': `Bearer ${token}` }
                        })
                        if (res.ok) setMessages(await res.json())
                    } catch (e) { /* ignore refresh error */ }
                }
                refreshMessages()
            }, 5000)
            return () => clearInterval(interval)
        } else {
            setMessages([])
        }
    }, [activeContact, fetchMessages])

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }

    const handleSend = async (e) => {
        e.preventDefault()
        if (!text.trim() || !activeContact || isSending) return

        setIsSending(true)
        const currentText = text
        setText('') // Clear input immediately for UX

        try {
            const token = localStorage.getItem('token')
            const userData = JSON.parse(localStorage.getItem('user')) || { id: 1 }
            const res = await fetch(`${API_BASE}/admin/pesan`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    penerima_id: activeContact.id,
                    text: currentText,
                    admin_id: userData.id
                })
            })

            if (res.ok) {
                fetchMessages(activeContact.id)
                fetchContacts()
            } else {
                setText(currentText) // Restore text on failure
                alert('Gagal mengirim pesan')
            }
        } catch (err) {
            setText(currentText)
            alert('Gagal mengirim pesan')
        } finally {
            setIsSending(false)
        }
    }

    const filteredContacts = contacts.filter(c =>
        c.nama.toLowerCase().includes(search.toLowerCase()) ||
        c.nisn.includes(search)
    )

    const formatTime = (isoString) => {
        if (!isoString) return ''
        const date = new Date(isoString)
        return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
    }

    const ContactSkeleton = () => (
        <div className="d-flex align-items-center gap-3 p-3 mb-1 rounded-xl animate-pulse opacity-60">
            <div className="bg-gray-200 rounded-circle" style={{ width: '48px', height: '48px' }}></div>
            <div className="flex-grow-1">
                <div className="bg-gray-200 rounded mb-2" style={{ width: '60%', height: '12px' }}></div>
                <div className="bg-gray-200 rounded" style={{ width: '40%', height: '8px' }}></div>
            </div>
        </div>
    )

    return (
        <div className="admin-page animate-fadeIn p-0" style={{ height: 'calc(100vh - 100px)' }}>
            <div className="d-flex h-100 gap-0 overflow-hidden" style={{ background: 'var(--bg-body)' }}>

                {/* --- SIDEBAR KONTAK --- */}
                <div
                    className="d-flex flex-column border-end bg-card glassmorphism-sidebar"
                    style={{
                        width: '360px',
                        zIndex: 10,
                        backgroundColor: 'var(--bg-card)',
                        boxShadow: '4px 0 24px rgba(0,0,0,0.02)'
                    }}
                >
                    <div className="p-4">
                        <div className="d-flex align-items-center justify-content-between mb-4">
                            <h3 className="m-0 fw-bold d-flex align-items-center gap-2" style={{ fontSize: '1.4rem', color: 'var(--text-primary)' }}>
                                <div className="p-2 bg-primary bg-opacity-10 rounded-lg text-primary">
                                    <MessageSquare size={22} />
                                </div>
                                Pesan
                            </h3>
                            <div className="badge bg-primary bg-opacity-10 text-primary rounded-pill px-3 py-2 fw-medium">
                                {contacts.reduce((acc, c) => acc + (c.unread_count || 0), 0)} Baru
                            </div>
                        </div>

                        <div className="position-relative">
                            <Search size={18} className="position-absolute" style={{ left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                            <input
                                type="text"
                                className="form-control premium-input shadow-sm"
                                placeholder="Cari siswa atau NISN..."
                                style={{
                                    paddingLeft: '48px',
                                    borderRadius: '16px',
                                    height: '50px',
                                    background: 'var(--bg-input)',
                                    border: '1px solid var(--border-color)',
                                    fontSize: '0.95rem'
                                }}
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="flex-grow-1 overflow-auto px-3 pb-4 scroll-hidden">
                        {loadingContacts ? (
                            <>
                                <ContactSkeleton />
                                <ContactSkeleton />
                                <ContactSkeleton />
                                <ContactSkeleton />
                            </>
                        ) : (
                            filteredContacts.length === 0 ? (
                                <div className="text-center p-5 text-muted">
                                    <Search size={40} className="mb-3 opacity-20" />
                                    <p className="small">Tidak ada kontak ditemukan</p>
                                </div>
                            ) : (
                                filteredContacts.map(c => (
                                    <div
                                        key={c.id}
                                        className={`d-flex align-items-center gap-3 p-3 mb-2 rounded-2xl cursor-pointer transition-all duration-300 ${activeContact?.id === c.id ? 'active-contact-premium' : 'hover-bg-gray'}`}
                                        onClick={() => setActiveContact(c)}
                                        style={{
                                            borderRadius: '20px',
                                            border: activeContact?.id === c.id ? '1px solid var(--primary-200)' : '1px solid transparent',
                                            background: activeContact?.id === c.id ? 'linear-gradient(135deg, var(--primary-50) 0%, #fff 100%)' : 'transparent',
                                            boxShadow: activeContact?.id === c.id ? 'var(--shadow-md)' : 'none'
                                        }}
                                    >
                                        <div className="position-relative">
                                            <div
                                                className={`rounded-2xl d-flex align-items-center justify-content-center fw-bold transition-all ${activeContact?.id === c.id ? 'bg-primary text-white shadow-lg scale-105' : 'bg-primary bg-opacity-10 text-primary'}`}
                                                style={{ width: '52px', height: '52px', fontSize: '1.2rem' }}
                                            >
                                                {c.nama.charAt(0)}
                                            </div>
                                            {c.unread_count > 0 && (
                                                <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger shadow-sm bounce-in" style={{ padding: '6px 8px', fontSize: '0.7rem' }}>
                                                    {c.unread_count}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex-grow-1 overflow-hidden">
                                            <div className="d-flex justify-content-between align-items-center mb-1">
                                                <div className="fw-bold text-truncate" style={{ fontSize: '1rem', color: activeContact?.id === c.id ? 'var(--primary-700)' : 'var(--text-primary)' }}>
                                                    {c.nama}
                                                </div>
                                                {c.last_activity && (
                                                    <div className="small text-muted" style={{ fontSize: '0.7rem' }}>
                                                        {formatTime(c.last_activity)}
                                                    </div>
                                                )}
                                            </div>
                                            <div className={`small text-truncate ${c.unread_count > 0 ? 'fw-bold text-primary' : 'text-muted'}`} style={{ fontSize: '0.85rem' }}>
                                                {c.last_message || 'Mulai percakapan...'}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )
                        )}
                    </div>
                </div>

                {/* --- AREA CHAT UTAMA --- */}
                <div className="flex-grow-1 d-flex flex-column position-relative" style={{ background: 'var(--bg-card)' }}>
                    {activeContact ? (
                        <>
                            {/* Header Chat */}
                            <div className="px-4 py-3 bg-card border-bottom d-flex align-items-center justify-content-between shadow-xs" style={{ zIndex: 5 }}>
                                <div className="d-flex align-items-center gap-3">
                                    <div className="p-1 rounded-2xl bg-gradient-brand text-white shadow-sm" style={{ width: '44px', height: '44px' }}>
                                        <div className="w-100 h-100 rounded-2xl bg-white bg-opacity-20 d-flex align-items-center justify-content-center fw-bold">
                                            {activeContact.nama.charAt(0)}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="fw-bold h6 m-0 d-flex align-items-center gap-2">
                                            {activeContact.nama}
                                            <span className="badge bg-success bg-opacity-10 text-success rounded-pill px-2 py-1" style={{ fontSize: '0.6rem' }}>ONLINE</span>
                                        </div>
                                        <div className="small text-muted d-flex align-items-center gap-2">
                                            <span className="d-flex align-items-center gap-1"><Hash size={12} /> {activeContact.nisn}</span>
                                            <span className="opacity-30">|</span>
                                            <span>{activeContact.kelas_nama || 'Umum'}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="d-flex gap-2">
                                    <button className="btn-icon-premium" title="Info"><Info size={20} /></button>
                                    <button className="btn-icon-premium" title="Telepon"><Phone size={20} /></button>
                                    <button className="btn-icon-premium" title="Lainnya"><MoreVertical size={20} /></button>
                                </div>
                            </div>

                            {/* Kotak Pesan */}
                            <div
                                className="flex-grow-1 overflow-auto p-4 d-flex flex-column gap-3 scroll-hidden"
                                style={{
                                    scrollBehavior: 'smooth',
                                    backgroundImage: `radial-gradient(var(--border-color) 0.5px, transparent 0.5px)`,
                                    backgroundSize: '24px 24px',
                                    backgroundOpacity: 0.1
                                }}
                            >
                                {loadingMessages && messages.length === 0 ? (
                                    <div className="h-100 d-flex align-items-center justify-content-center">
                                        <LoadingSpinner />
                                    </div>
                                ) : (
                                    messages.map((m, idx) => {
                                        const isAdmin = m.pengirim_type === 'admin'
                                        return (
                                            <div key={m.id || idx} className={`d-flex flex-column ${isAdmin ? 'align-items-end' : 'align-items-start'} mb-1 animate-slideIn`}>
                                                <div
                                                    className={`p-3 p-md-4 shadow-sm transition-all hover-scale-message`}
                                                    style={{
                                                        maxWidth: '80%',
                                                        borderRadius: isAdmin ? '24px 24px 4px 24px' : '24px 24px 24px 4px',
                                                        background: isAdmin
                                                            ? 'linear-gradient(135deg, var(--primary-600) 0%, var(--primary-800) 100%)'
                                                            : 'var(--gray-50)',
                                                        color: isAdmin ? '#fff' : 'var(--text-primary)',
                                                        boxShadow: isAdmin ? '0 10px 15px -3px rgba(37, 99, 235, 0.2)' : 'var(--shadow-sm)',
                                                        border: isAdmin ? 'none' : '1px solid var(--border-color)'
                                                    }}
                                                >
                                                    <div style={{ fontSize: '0.96rem', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
                                                        {m.pesan}
                                                    </div>
                                                    <div className={`mt-2 d-flex align-items-center gap-2 justify-content-end`} style={{ fontSize: '0.7rem', opacity: 0.7 }}>
                                                        {formatTime(m.waktu)}
                                                        {isAdmin && (
                                                            m.is_read ? <CheckCheck size={14} className="text-white-50" /> : <Check size={14} className="text-white-50" />
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    })
                                )}

                                {messages.length === 0 && !loadingMessages && (
                                    <div className="h-100 d-flex flex-column align-items-center justify-content-center text-center p-5 opacity-40">
                                        <MessageSquare size={100} className="mb-4 text-primary opacity-10" />
                                        <h5 className="fw-bold">Belum ada percakapan</h5>
                                        <p style={{ maxWidth: '300px' }}>Ketik pesan pertama Anda untuk memulai komunikasi dengan {activeContact.nama}.</p>
                                    </div>
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Input Pesan */}
                            <div className="p-4 bg-card border-top">
                                <form onSubmit={handleSend} className="container-fluid p-0">
                                    <div className="d-flex align-items-center gap-3 bg-gray-50 p-2 rounded-3xl border shadow-premium-sm" style={{ paddingLeft: '12px' }}>
                                        <button
                                            type="button"
                                            className="btn-icon-premium bg-white shadow-sm"
                                            style={{ color: 'var(--primary-600)' }}
                                        >
                                            <Plus size={22} />
                                        </button>

                                        <input
                                            type="text"
                                            className="form-control border-0 bg-transparent py-2 px-0 shadow-none"
                                            placeholder={`Ketik pesan untuk ${activeContact.nama.split(' ')[0]}...`}
                                            style={{ fontSize: '1rem', color: 'var(--text-primary)' }}
                                            value={text}
                                            onChange={e => setText(e.target.value)}
                                            disabled={isSending}
                                        />

                                        <button
                                            type="submit"
                                            className={`btn btn-primary d-flex align-items-center justify-content-center transition-all ${isSending ? 'opacity-50' : 'hover-scale'}`}
                                            style={{
                                                width: '56px',
                                                height: '56px',
                                                borderRadius: '24px',
                                                background: 'linear-gradient(135deg, var(--primary-500) 0%, var(--primary-700) 100%)',
                                                border: 'none',
                                                boxShadow: '0 8px 16px -4px rgba(37, 99, 235, 0.4)'
                                            }}
                                            disabled={isSending || !text.trim()}
                                        >
                                            {isSending ? <LoadingSpinner size="sm" color="white" /> : <Send size={24} />}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </>
                    ) : (
                        <div className="h-100 d-flex flex-column align-items-center justify-content-center text-center p-5 animate-fadeIn">
                            <div
                                className="bg-primary bg-opacity-5 rounded-circle mb-5 d-flex align-items-center justify-content-center shadow-premium-lg"
                                style={{ width: '240px', height: '240px' }}
                            >
                                <div className="bg-white rounded-circle shadow-lg d-flex align-items-center justify-content-center" style={{ width: '150px', height: '150px' }}>
                                    <MessageSquare size={70} className="text-primary opacity-60" />
                                </div>
                            </div>
                            <h3 className="fw-bold mb-3" style={{ color: 'var(--text-primary)' }}>Pilih Kontak Siswa</h3>
                            <p className="text-secondary mb-4" style={{ maxWidth: '400px' }}>
                                Kelola komunikasi langsung dengan siswa lebih mudah dan efisien melalui panel manajemen pesan.
                            </p>
                            <div className="d-flex gap-3">
                                <span className="badge bg-primary bg-opacity-10 text-primary px-3 py-2 rounded-pill">Total {contacts.length} Siswa</span>
                                <span className="badge bg-success bg-opacity-10 text-success px-3 py-2 rounded-pill">Sistem Sinkronisasi Real-time</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                .active-contact-premium {
                    transform: translateX(5px);
                    transition: all 0.3s ease;
                }
                .hover-bg-gray:hover {
                    background: var(--bg-hover);
                    transform: translateX(3px);
                }
                .btn-icon-premium {
                    width: 44px;
                    height: 44px;
                    border-radius: 14px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: var(--text-secondary);
                    transition: all 0.2s;
                    border: none;
                    background: transparent;
                }
                .btn-icon-premium:hover {
                    background: var(--bg-hover);
                    color: var(--primary-600);
                    transform: translateY(-2px);
                }
                .bg-gradient-brand {
                    background: linear-gradient(135deg, var(--primary-500) 0%, var(--primary-700) 100%);
                }
                .rounded-lg { border-radius: 12px; }
                .rounded-2xl { border-radius: 20px; }
                .rounded-3xl { border-radius: 30px; }
                .shadow-xs { box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
                .shadow-premium-sm { box-shadow: 0 4px 12px rgba(0,0,0,0.03), 0 1px 2px rgba(0,0,0,0.04); }
                .scroll-hidden::-webkit-scrollbar { display: none; }
                .scroll-hidden { -ms-overflow-style: none; scrollbar-width: none; }
                .animate-slideIn {
                    animation: slideInUp 0.3s ease forwards;
                }
                @keyframes slideInUp {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .hover-scale:hover { transform: scale(1.05); }
                .hover-scale-message:hover { transform: scale(1.01); }
                .bounce-in { animation: bounceIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
                @keyframes bounceIn {
                    0% { transform: translate(-50%, -50%) scale(0); }
                    100% { transform: translate(-50%, -50%) scale(1); }
                }

                [data-theme="dark"] .glassmorphism-sidebar {
                    background: rgba(30, 41, 59, 0.7) !important;
                    backdrop-filter: blur(10px);
                }
                [data-theme="dark"] .active-contact-premium {
                    background: linear-gradient(135deg, rgba(37, 99, 235, 0.2) 0%, rgba(30, 41, 59, 0.8) 100%) !important;
                    border-color: rgba(37, 99, 235, 0.4) !important;
                }
                [data-theme="dark"] .active-contact-premium .fw-bold {
                    color: #fff !important;
                }
            `}} />
        </div>
    )
}
