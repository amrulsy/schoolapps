import { useState, useRef, useEffect } from 'react'
import { MessageCircle, Send, ArrowLeft } from 'lucide-react'
import { useStudent } from '../StudentApp'

export default function PesanPage() {
    const { pesanList, sendMessage, fetchStudentData } = useStudent()
    const [newMsg, setNewMsg] = useState('')
    const [sending, setSending] = useState(false)
    const messagesEndRef = useRef(null)

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }

    useEffect(() => {
        scrollToBottom()
    }, [pesanList])

    const handleSend = async () => {
        if (!newMsg.trim() || sending) return
        setSending(true)
        const success = await sendMessage(newMsg)
        if (success) {
            setNewMsg('')
            fetchStudentData()
        }
        setSending(false)
    }

    const formatTime = (isoString) => {
        if (!isoString) return ''
        const date = new Date(isoString)
        return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
    }

    return (
        <div className="stu-chat-page">
            <div className="stu-chat-header">
                <button className="stu-chat-back" onClick={() => window.history.back()}>
                    <ArrowLeft size={20} />
                </button>
                <div className="stu-chat-avatar">A</div>
                <div className="stu-chat-contact-info">
                    <span className="stu-chat-name">Admin Sekolah</span>
                    <span className="stu-chat-role">Tata Usaha & Layanan Akademik</span>
                </div>
            </div>

            <div className="stu-chat-messages">
                {pesanList.length === 0 ? (
                    <div style={{ textAlign: 'center', color: '#9CA3AF', marginTop: '40px' }}>
                        <MessageCircle size={32} style={{ opacity: 0.5, marginBottom: '8px' }} />
                        <p>Belum ada riwayat pesan.</p>
                        <p style={{ fontSize: '0.8rem' }}>Kirim pesan untuk menghubungi Admin.</p>
                    </div>
                ) : pesanList.map(m => {
                    const isSelf = m.pengirim_type === 'student'
                    return (
                        <div key={m.id} className={`stu-chat-bubble ${isSelf ? 'student' : 'teacher'}`}>
                            <p>{m.pesan}</p>
                            <span className="stu-chat-time">{formatTime(m.waktu)}</span>
                        </div>
                    )
                })}
                <div ref={messagesEndRef} />
            </div>

            <div className="stu-chat-input">
                <input
                    placeholder="Tulis pesan..."
                    value={newMsg}
                    onChange={e => setNewMsg(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSend()}
                    disabled={sending}
                />
                <button className="stu-chat-send" onClick={handleSend} disabled={sending || !newMsg.trim()}>
                    <Send size={20} />
                </button>
            </div>
        </div>
    )
}
