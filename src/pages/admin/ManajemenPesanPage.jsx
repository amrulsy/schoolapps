import { useState, useEffect, useRef } from 'react'
import { API_BASE } from '../../services/api'
import LoadingSpinner from '../../components/LoadingSpinner'
import { MessageSquare, Search, Send, User, Clock, Check, CheckCheck, Plus, MoreVertical, X, Phone, Video } from 'lucide-react'

export default function ManajemenPesanPage() {
    const [contacts, setContacts] = useState([])
    const [activeContact, setActiveContact] = useState(null)
    const [messages, setMessages] = useState([])
    const [text, setText] = useState('')
    const [search, setSearch] = useState('')
    const [loadingContacts, setLoadingContacts] = useState(true)
    const [loadingMessages, setLoadingMessages] = useState(false)
    const messagesEndRef = useRef(null)

    const fetchContacts = async () => {
        try {
            const token = localStorage.getItem('token')
            const res = await fetch(`${API_BASE}/admin/pesan/contacts`, { headers: { 'Authorization': `Bearer ${token}` } })
            if (res.ok) setContacts(await res.json())
        } catch (err) { console.error('Gagal fetch contacts', err) }
        finally { setLoadingContacts(false) }
    }

    const fetchMessages = async (siswaId) => {
        setLoadingMessages(true)
        try {
            const token = localStorage.getItem('token')
            const res = await fetch(`${API_BASE}/admin/pesan/${siswaId}`, { headers: { 'Authorization': `Bearer ${token}` } })
            if (res.ok) setMessages(await res.json())
        } catch (err) { console.error('Gagal fetch messages', err) }
        finally { setLoadingMessages(false); scrollToBottom() }
    }

    useEffect(() => {
        fetchContacts()
        const interval = setInterval(fetchContacts, 10000) // auto-refresh kontak tiap 10 detik
        return () => clearInterval(interval)
    }, [])

    useEffect(() => {
        if (activeContact) {
            fetchMessages(activeContact.id)
            const interval = setInterval(() => fetchMessages(activeContact.id), 5000) // auto-refresh chat
            return () => clearInterval(interval)
        }
    }, [activeContact])

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }

    const handleSend = async (e) => {
        e.preventDefault()
        if (!text.trim() || !activeContact) return
        try {
            const token = localStorage.getItem('token')
            const userData = JSON.parse(localStorage.getItem('user')) || { id: 1 }
            await fetch(`${API_BASE}/admin/pesan`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ penerima_id: activeContact.id, text, admin_id: userData.id })
            })
            setText('')
            fetchMessages(activeContact.id)
            fetchContacts()
        } catch (err) { alert('Gagal mengirim pesan') }
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

    return (
        <div className="admin-page animate-fadeIn" style={{ height: 'calc(100vh - 120px)', padding: '0' }}>
            <div className="card d-flex flex-row h-100 border-0 shadow-premium overflow-hidden" style={{ borderRadius: '24px' }}>

                {/* Sidebar Kontak */}
                <div className="d-flex flex-column border-end bg-white" style={{ width: '320px' }}>
                    <div className="p-4">
                        <h3 className="mb-3 d-flex align-items-center gap-2" style={{ fontSize: '1.25rem' }}>
                            <MessageSquare className="text-primary" size={24} /> Chat Siswa
                        </h3>
                        <div className="position-relative">
                            <Search size={16} className="position-absolute" style={{ left: '12px', top: '12px', color: 'var(--text-muted)' }} />
                            <input
                                type="text"
                                className="form-control"
                                placeholder="Cari kontak siswa..."
                                style={{ paddingLeft: '40px', borderRadius: '12px', height: '40px', background: 'var(--gray-50)', border: 'none' }}
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="flex-grow-1 overflow-auto px-2">
                        {loadingContacts ? <div className="p-4 text-center"><LoadingSpinner /></div> : (
                            filteredContacts.length === 0 ? <div className="p-4 text-center text-muted small">Tidak ada kontak ditemukan</div> :
                                filteredContacts.map(c => (
                                    <div
                                        key={c.id}
                                        className={`d-flex align-items-center gap-3 p-3 mb-1 rounded-xl cursor-pointer transition-base ${activeContact?.id === c.id ? 'bg-primary text-white shadow-md' : 'hover-bg-gray'}`}
                                        onClick={() => setActiveContact(c)}
                                        style={{ borderRadius: '16px', cursor: 'pointer' }}
                                    >
                                        <div className="position-relative">
                                            <div className={`rounded-full d-flex align-items-center justify-content-center border ${activeContact?.id === c.id ? 'bg-white bg-opacity-20 border-white' : 'bg-primary bg-opacity-10 border-primary border-opacity-20'}`} style={{ width: '48px', height: '48px', overflow: 'hidden', color: activeContact?.id === c.id ? 'white' : 'var(--primary)' }}>
                                                <span className="fw-bold fs-5">{c.nama.charAt(0)}</span>
                                            </div>
                                            {c.unread_count > 0 && (
                                                <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger border border-2 border-white">
                                                    {c.unread_count}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex-grow-1 overflow-hidden">
                                            <div className="fw-bold text-truncate" style={{ fontSize: '0.95rem' }}>{c.nama}</div>
                                            <div className={`small text-truncate ${activeContact?.id === c.id ? 'text-white-50' : 'text-muted'}`}>
                                                {c.last_message || 'Belum ada pesan'}
                                            </div>
                                        </div>
                                        {c.last_message_time && (
                                            <div className={`small ${activeContact?.id === c.id ? 'text-white-50' : 'text-muted'}`} style={{ fontSize: '0.65rem' }}>
                                                {formatTime(c.last_message_time)}
                                            </div>
                                        )}
                                    </div>
                                ))
                        )}
                    </div>
                </div>

                {/* Area Chat Utama */}
                <div className="flex-grow-1 d-flex flex-column bg-light bg-opacity-30">
                    {activeContact ? (
                        <>
                            {/* Chat Header */}
                            <div className="p-3 bg-white border-bottom d-flex align-items-center justify-content-between px-4 shadow-sm">
                                <div className="d-flex align-items-center gap-3">
                                    <div className="rounded-full bg-primary bg-opacity-10 p-2 text-primary d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
                                        <span className="fw-bold">{activeContact.nama.charAt(0)}</span>
                                    </div>
                                    <div>
                                        <div className="fw-bold h6 m-0">{activeContact.nama}</div>
                                        <div className="small text-muted d-flex align-items-center gap-1">
                                            {activeContact.nisn} • {activeContact.kelas_nama || 'Umum'}
                                        </div>
                                    </div>
                                </div>
                                <div className="d-flex gap-2">
                                    <button className="btn-icon"><Phone size={18} /></button>
                                    <button className="btn-icon"><Video size={18} /></button>
                                    <button className="btn-icon"><MoreVertical size={18} /></button>
                                </div>
                            </div>

                            {/* Kotak Pesan */}
                            <div className="flex-grow-1 overflow-auto p-4 d-flex flex-column gap-3" style={{ scrollBehavior: 'smooth' }}>
                                {loadingMessages && messages.length === 0 ? <LoadingSpinner /> : (
                                    messages.map((m, idx) => {
                                        const isAdmin = m.pengirim_type === 'admin'
                                        return (
                                            <div key={m.id || idx} className={`d-flex flex-column ${isAdmin ? 'align-items-end' : 'align-items-start'}`}>
                                                <div
                                                    className={`p-3 rounded-2xl shadow-sm transition-base`}
                                                    style={{
                                                        maxWidth: '75%',
                                                        borderRadius: isAdmin ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
                                                        background: isAdmin ? 'linear-gradient(135deg, var(--primary-500) 0%, var(--primary-700) 100%)' : '#fff',
                                                        color: isAdmin ? '#fff' : 'var(--text-primary)',
                                                        border: isAdmin ? 'none' : '1px solid var(--border-color)'
                                                    }}
                                                >
                                                    <div style={{ fontSize: '0.92rem', lineHeight: '1.5' }}>{m.pesan}</div>
                                                    <div className={`mt-2 d-flex align-items-center gap-1 justify-content-end`} style={{ fontSize: '0.65rem', opacity: 0.8 }}>
                                                        {formatTime(m.waktu)}
                                                        {isAdmin && <CheckCheck size={12} />}
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    })
                                )}
                                {messages.length === 0 && !loadingMessages && (
                                    <div className="text-center text-muted mt-5 animate-pulse">
                                        <Clock size={40} className="mb-2 opacity-20" />
                                        <p>Belum ada percakapan dengan {activeContact.nama}</p>
                                    </div>
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Input Pesan */}
                            <div className="p-4 bg-white border-top">
                                <form onSubmit={handleSend} className="d-flex gap-2">
                                    <button type="button" className="btn-icon"><Plus size={20} /></button>
                                    <input
                                        type="text"
                                        className="form-control flex-grow-1 border-0 bg-light px-4"
                                        style={{ height: '48px', borderRadius: '24px', fontSize: '0.95rem' }}
                                        placeholder="Tulis balasan..."
                                        value={text}
                                        onChange={e => setText(e.target.value)}
                                    />
                                    <button type="submit" className="btn btn-primary d-flex align-items-center justify-content-center p-0" style={{ width: '48px', height: '48px', borderRadius: '50%' }}>
                                        <Send size={20} />
                                    </button>
                                </form>
                            </div>
                        </>
                    ) : (
                        <div className="h-100 d-flex flex-column align-items-center justify-content-center text-center p-5 animate-fadeIn">
                            <div className="bg-primary bg-opacity-10 p-5 rounded-circle mb-4">
                                <MessageSquare size={80} className="text-primary opacity-20" />
                            </div>
                            <h4 className="fw-bold">Selamat Datang di Pusat Pesan</h4>
                            <p className="text-secondary" style={{ maxWidth: '320px' }}>
                                Silakan pilih kontak siswa di sebelah kiri untuk memulai percakapan atau melihat riwayat pesan.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
