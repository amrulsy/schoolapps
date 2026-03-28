import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { MessageCircle, GraduationCap } from 'lucide-react'
import { usePortal } from '../context/PortalContext'

export default function PortalFloatingActions() {
    const { settings } = usePortal()
    const [offsetY, setOffsetY] = useState(0)

    useEffect(() => {
        const handleScroll = () => setOffsetY(window.pageYOffset)
        window.addEventListener('scroll', handleScroll, { passive: true })
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    return (
        <div className={`portal-floating-actions ${offsetY > 300 ? 'visible' : ''}`}>
            <div className="portal-floating-actions-inner">
                <Link to="/ppdb" className="portal-floating-btn primary">
                    <GraduationCap size={20} />
                    <span>Daftar PPDB</span>
                </Link>
                <a 
                    href={`https://wa.me/${(settings.contact_whatsapp || settings.wa_number || '628123456789').replace(/^0/, '62')}`} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="portal-floating-btn secondary"
                >
                    <MessageCircle size={20} />
                    <span>Tanya Admin</span>
                </a>
            </div>
        </div>
    )
}
