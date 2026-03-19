import { useState } from 'react'
import { MessageCircle, Send, Search, User, ArrowLeft } from 'lucide-react'

const mockContacts = [
    { id: 1, nama: 'Pak Ahmad (Wali Kelas)', role: 'Guru', unread: 2, lastMsg: 'Tolong kumpulkan tugas sebelum Jumat', lastTime: '10:30' },
    { id: 2, nama: 'Bu Sari (BK)', role: 'Konselor', unread: 0, lastMsg: 'Jadwal sesi konseling sudah diatur', lastTime: 'Kemarin' },
    { id: 3, nama: 'Admin Tata Usaha', role: 'Admin', unread: 1, lastMsg: 'Dokumen KIP Anda sudah diverifikasi', lastTime: 'Kemarin' },
    { id: 4, nama: 'Pak Budi (Matematika)', role: 'Guru', unread: 0, lastMsg: 'Nilai remedial sudah diupdate', lastTime: '15 Mar' },
]

const mockMessages = {
    1: [
        { id: 1, from: 'teacher', text: 'Selamat pagi, Ada tugas yang harus dikumpulkan minggu ini', time: '09:00' },
        { id: 2, from: 'student', text: 'Baik pak, tugas apa saja?', time: '09:15' },
        { id: 3, from: 'teacher', text: 'Tugas Pemrograman Dasar bab 5 dan Basis Data bab 3', time: '09:20' },
        { id: 4, from: 'student', text: 'Siap pak, akan saya kumpulkan sebelum Jumat', time: '09:25' },
        { id: 5, from: 'teacher', text: 'Tolong kumpulkan tugas sebelum Jumat', time: '10:30' },
    ],
    2: [
        { id: 1, from: 'teacher', text: 'Halo, sesi konseling kamu sudah dijadwalkan untuk Selasa depan jam 10', time: '14:00' },
        { id: 2, from: 'student', text: 'Baik bu, terima kasih', time: '14:05' },
        { id: 3, from: 'teacher', text: 'Jadwal sesi konseling sudah diatur', time: '14:10' },
    ],
    3: [
        { id: 1, from: 'teacher', text: 'Selamat siang, dokumen KIP Anda sudah kami verifikasi dan data sudah lengkap', time: '11:00' },
        { id: 2, from: 'teacher', text: 'Dokumen KIP Anda sudah diverifikasi', time: '11:05' },
    ],
}

export default function PesanPage() {
    const [selectedContact, setSelectedContact] = useState(null)
    const [search, setSearch] = useState('')
    const [newMsg, setNewMsg] = useState('')

    const filteredContacts = mockContacts.filter(c =>
        c.nama.toLowerCase().includes(search.toLowerCase())
    )

    if (selectedContact) {
        const messages = mockMessages[selectedContact.id] || []
        return (
            <div className="stu-chat-page">
                {/* Chat Header */}
                <div className="stu-chat-header">
                    <button className="stu-chat-back" onClick={() => setSelectedContact(null)}>
                        <ArrowLeft size={20} />
                    </button>
                    <div className="stu-chat-avatar">{selectedContact.nama.charAt(0)}</div>
                    <div className="stu-chat-contact-info">
                        <span className="stu-chat-name">{selectedContact.nama}</span>
                        <span className="stu-chat-role">{selectedContact.role}</span>
                    </div>
                </div>

                {/* Messages */}
                <div className="stu-chat-messages">
                    {messages.map(m => (
                        <div key={m.id} className={`stu-chat-bubble ${m.from}`}>
                            <p>{m.text}</p>
                            <span className="stu-chat-time">{m.time}</span>
                        </div>
                    ))}
                </div>

                {/* Input */}
                <div className="stu-chat-input">
                    <input
                        placeholder="Tulis pesan..."
                        value={newMsg}
                        onChange={e => setNewMsg(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && setNewMsg('')}
                    />
                    <button className="stu-chat-send" onClick={() => setNewMsg('')}>
                        <Send size={20} />
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="stu-page">
            <h2 className="stu-page-title">💬 Pesan</h2>

            {/* Search */}
            <div className="stu-search-bar">
                <Search size={18} />
                <input placeholder="Cari kontak..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>

            {/* Contact List */}
            <div className="stu-list">
                {filteredContacts.map(c => (
                    <div key={c.id} className="stu-contact-item" onClick={() => setSelectedContact(c)}>
                        <div className="stu-contact-avatar">{c.nama.charAt(0)}</div>
                        <div className="stu-contact-info">
                            <div className="stu-contact-top">
                                <span className="stu-contact-name">{c.nama}</span>
                                <span className="stu-contact-time">{c.lastTime}</span>
                            </div>
                            <div className="stu-contact-bottom">
                                <span className="stu-contact-msg">{c.lastMsg}</span>
                                {c.unread > 0 && <span className="stu-unread-badge">{c.unread}</span>}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
