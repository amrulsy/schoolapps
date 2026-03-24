import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, X, Command } from 'lucide-react'

const navigationItems = [
    { to: '/admin', text: 'Dashboard', category: 'General' },
    { to: '/admin/siswa', text: 'Data Siswa', category: 'Data Master' },
    { to: '/admin/guru', text: 'Data Guru', category: 'Data Master' },
    { to: '/admin/unit-kelas', text: 'Unit & Kelas', category: 'Data Master' },
    { to: '/admin/tahun-ajaran', text: 'Tahun Ajaran', category: 'Data Master' },
    { to: '/admin/jadwal', text: 'Manajemen Pelajaran', category: 'Data Master' },
    { to: '/admin/kategori-tagihan', text: 'Kategori Tagihan', category: 'Data Master' },
    { to: '/admin/rekening', text: 'Rekening Bank', category: 'Data Master' },
    { to: '/admin/presensi', text: 'Presensi Siswa', category: 'Data Master' },
    { to: '/admin/bk', text: 'Bimbingan Konseling', category: 'Data Master' },
    { to: '/admin/akademik', text: 'Nilai Akademik', category: 'Data Master' },
    { to: '/admin/pesan', text: 'Manajemen Pesan', category: 'Data Master' },
    { to: '/admin/tagihan', text: 'Tagihan', category: 'Keuangan' },
    { to: '/admin/riwayat-generate', text: 'Riwayat Generate', category: 'Keuangan' },
    { to: '/admin/kartu-spp', text: 'Kartu SPP', category: 'Keuangan' },
    { to: '/admin/pembayaran', text: 'Pembayaran (POS)', category: 'Keuangan' },
    { to: '/admin/tabungan', text: 'Kasir Tabungan', category: 'Keuangan' },
    { to: '/admin/riwayat', text: 'Riwayat Transaksi', category: 'Keuangan' },
    { to: '/admin/arus-kas', text: 'Arus Kas', category: 'Keuangan' },
    { to: '/admin/laporan', text: 'Laporan Keuangan', category: 'Laporan' },
    { to: '/admin/users', text: 'Manajemen User', category: 'Sistem' },
    { to: '/admin/student-menus', text: 'Menu Siswa', category: 'Sistem' },
    { to: '/admin/pengaturan', text: 'Pengaturan', category: 'Sistem' },
    { to: '/admin/backup', text: 'Backup & Restore', category: 'Sistem' },
    { to: '/admin/cms/home', text: 'Konten Halaman Utama', category: 'CMS' },
    { to: '/admin/cms/ppdb', text: 'Manajemen PPDB', category: 'CMS' },
    { to: '/admin/cms/contacts', text: 'Pesan Kontak', category: 'CMS' },
]

export default function CommandPalette() {
    const [isOpen, setIsOpen] = useState(false)
    const [query, setQuery] = useState('')
    const [selectedIndex, setSelectedIndex] = useState(0)
    const navigate = useNavigate()
    const inputRef = useRef(null)

    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault()
                setIsOpen(prev => !prev)
            }
            if (e.key === 'Escape') setIsOpen(false)
        }

        const handleOpenEvent = () => setIsOpen(true)
        window.addEventListener('keydown', handleKeyDown)
        window.addEventListener('open-command-palette', handleOpenEvent)
        return () => {
            window.removeEventListener('keydown', handleKeyDown)
            window.removeEventListener('open-command-palette', handleOpenEvent)
        }
    }, [])

    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 10)
            setQuery('')
            setSelectedIndex(0)
        }
    }, [isOpen])

    const filteredItems = query === ''
        ? navigationItems.slice(0, 5)
        : navigationItems.filter(item =>
            item.text.toLowerCase().includes(query.toLowerCase()) ||
            item.category.toLowerCase().includes(query.toLowerCase())
        )

    const handleSelect = (index) => {
        const item = filteredItems[index]
        if (item) {
            navigate(item.to)
            setIsOpen(false)
        }
    }

    const onKeyDown = (e) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault()
            setSelectedIndex(prev => (prev + 1) % filteredItems.length)
        } else if (e.key === 'ArrowUp') {
            e.preventDefault()
            setSelectedIndex(prev => (prev - 1 + filteredItems.length) % filteredItems.length)
        } else if (e.key === 'Enter') {
            handleSelect(selectedIndex)
        }
    }

    if (!isOpen) return null

    return (
        <div className="command-palette-overlay" onClick={() => setIsOpen(false)}>
            <div className={`command-palette-modal ${isOpen ? 'open' : ''}`} onClick={e => e.stopPropagation()}>
                <div className="command-palette-search">
                    <Search size={20} className="search-icon" />
                    <input
                        ref={inputRef}
                        type="text"
                        placeholder="Search for pages, settings, or tools..."
                        value={query}
                        onChange={e => {
                            setQuery(e.target.value)
                            setSelectedIndex(0)
                        }}
                        onKeyDown={onKeyDown}
                    />
                    <div className="close-hint">ESC</div>
                </div>

                <div className="command-palette-results">
                    {filteredItems.length === 0 ? (
                        <div className="no-results">No results found for "{query}"</div>
                    ) : (
                        filteredItems.map((item, index) => (
                            <div
                                key={item.to}
                                className={`result-item ${index === selectedIndex ? 'active' : ''}`}
                                onClick={() => handleSelect(index)}
                                onMouseEnter={() => setSelectedIndex(index)}
                            >
                                <div className="item-icon">
                                    <Command size={16} />
                                </div>
                                <div className="item-info">
                                    <div className="item-text">{item.text}</div>
                                    <div className="item-category">{item.category}</div>
                                </div>
                                {index === selectedIndex && <div className="enter-hint">⏎ Enter</div>}
                            </div>
                        ))
                    )}
                </div>

                <div className="command-palette-footer">
                    <span><kbd>↑↓</kbd> to navigate</span>
                    <span><kbd>⏎</kbd> to select</span>
                    <span><kbd>ESC</kbd> to close</span>
                </div>
            </div>
        </div>
    )
}
