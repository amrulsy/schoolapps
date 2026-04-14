import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { MessageCircle, GraduationCap } from 'lucide-react'
import { usePortal } from '../context/PortalContext'

export default function PortalFloatingActions() {
    const { settings } = usePortal()
    const [offsetY, setOffsetY] = useState(0)
    const [isFooterVisible, setIsFooterVisible] = useState(false)
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 991)

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth <= 991)
        const handleScroll = () => setOffsetY(window.pageYOffset)
        
        window.addEventListener('resize', handleResize)
        window.addEventListener('scroll', handleScroll, { passive: true })

        // Target the footer element
        const footer = document.querySelector('.portal-footer')
        let observer;
        
        if (footer) {
            observer = new IntersectionObserver(
                ([entry]) => {
                    setIsFooterVisible(entry.isIntersecting)
                },
                { rootMargin: "0px" }
            )
            observer.observe(footer)
        }

        return () => {
            window.removeEventListener('resize', handleResize)
            window.removeEventListener('scroll', handleScroll)
            if (observer && footer) observer.unobserve(footer)
        }
    }, [])

    // Jika di mobile dan footer terlihat, sembunyikan floating action
    const shouldHide = isMobile && isFooterVisible
    const isVisible = offsetY > 300 && !shouldHide

    return (
        <div className={`portal-floating-actions ${isVisible ? 'visible' : ''}`}>
            <div className="portal-floating-actions-inner">
                <Link to="/ppdb" className="portal-floating-btn primary">                    <GraduationCap size={20} />
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
