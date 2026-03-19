import { useStudent } from '../StudentApp'
import { useState } from 'react'
import { Megaphone, Search, Calendar, Tag } from 'lucide-react'

const mockAnnouncements = [
    { id: 1, title: 'Jadwal Ujian Tengah Semester Genap 2025/2026', category: 'akademik', date: '2026-03-18', content: 'Diberitahukan kepada seluruh siswa bahwa UTS semester genap akan dilaksanakan pada tanggal 24-28 Maret 2026. Pastikan untuk mempersiapkan diri dengan baik.' },
    { id: 2, title: 'Pengumuman Libur Hari Raya Idul Fitri', category: 'umum', date: '2026-03-15', content: 'Libur Hari Raya Idul Fitri 1447H dimulai tanggal 29 Maret - 7 April 2026. Masuk kembali tanggal 8 April 2026.' },
    { id: 3, title: 'Lomba Kompetensi Siswa (LKS) Tingkat Provinsi', category: 'kegiatan', date: '2026-03-12', content: 'Pendaftaran LKS tingkat provinsi telah dibuka. Siswa yang berminat dapat mendaftar melalui guru pembimbing masing-masing paling lambat 20 Maret 2026.' },
    { id: 4, title: 'Kunjungan Industri ke PT Telkom', category: 'kegiatan', date: '2026-03-10', content: 'Kunjungan industri ke PT Telkom Indonesia akan dilaksanakan pada 25 Maret 2026 untuk jurusan TKJ dan RPL. Biaya kontribusi Rp 50.000.' },
    { id: 5, title: 'Perubahan Jadwal Pelajaran', category: 'akademik', date: '2026-03-08', content: 'Terdapat perubahan jadwal pelajaran mulai pekan depan. Jadwal terbaru dapat dilihat di papan pengumuman atau melalui wali kelas masing-masing.' },
    { id: 6, title: 'Program Beasiswa Tahun 2026', category: 'umum', date: '2026-03-05', content: 'SMK PPRQ membuka pendaftaran beasiswa prestasi dan beasiswa yayasan untuk tahun ajaran 2026/2027. Formulir dapat diambil di ruang TU.' },
]

const categoryConfig = {
    umum: { color: '#3B82F6', label: 'Umum' },
    akademik: { color: '#8B5CF6', label: 'Akademik' },
    kegiatan: { color: '#F59E0B', label: 'Kegiatan' },
}

export default function PengumumanPage() {
    const { announcements: serverAnnouncements } = useStudent()
    const [search, setSearch] = useState('')
    const [filterCat, setFilterCat] = useState('semua')
    const [selectedAnnouncement, setSelectedAnnouncement] = useState(null)

    // Merge server announcements + mock
    const allAnnouncements = [
        ...mockAnnouncements,
        ...serverAnnouncements.map(a => ({
            id: `s-${a.id}`,
            title: a.title,
            category: 'umum',
            date: a.created_at,
            content: a.content || a.excerpt || ''
        }))
    ]

    const filtered = allAnnouncements.filter(a => {
        const matchSearch = a.title.toLowerCase().includes(search.toLowerCase())
        const matchCat = filterCat === 'semua' || a.category === filterCat
        return matchSearch && matchCat
    })

    if (selectedAnnouncement) {
        const a = selectedAnnouncement
        const cat = categoryConfig[a.category] || categoryConfig.umum
        return (
            <div className="stu-page">
                <button className="stu-back-btn" onClick={() => setSelectedAnnouncement(null)}>← Kembali</button>
                <div className="stu-announcement-detail">
                    <span className="stu-cat-badge" style={{ background: `${cat.color}15`, color: cat.color }}>{cat.label}</span>
                    <h2>{a.title}</h2>
                    <span className="stu-detail-date">
                        <Calendar size={14} />
                        {new Date(a.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </span>
                    <div className="stu-detail-content">{a.content}</div>
                </div>
            </div>
        )
    }

    return (
        <div className="stu-page">
            <h2 className="stu-page-title">📢 Mading Digital</h2>

            {/* Search */}
            <div className="stu-search-bar">
                <Search size={18} />
                <input placeholder="Cari pengumuman..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>

            {/* Category Filter */}
            <div className="stu-filter-pills">
                <button className={`stu-pill ${filterCat === 'semua' ? 'active' : ''}`} onClick={() => setFilterCat('semua')}>Semua</button>
                {Object.entries(categoryConfig).map(([key, cfg]) => (
                    <button key={key} className={`stu-pill ${filterCat === key ? 'active' : ''}`}
                        style={filterCat === key ? { background: cfg.color, color: '#fff' } : {}}
                        onClick={() => setFilterCat(key)}>
                        {cfg.label}
                    </button>
                ))}
            </div>

            {/* Announcements List */}
            <div className="stu-list">
                {filtered.length === 0 ? (
                    <div className="stu-empty-mini">Tidak ada pengumuman</div>
                ) : filtered.map(a => {
                    const cat = categoryConfig[a.category] || categoryConfig.umum
                    return (
                        <div key={a.id} className="stu-announcement-card" onClick={() => setSelectedAnnouncement(a)}>
                            <div className="stu-announcement-top">
                                <span className="stu-cat-badge" style={{ background: `${cat.color}15`, color: cat.color }}>
                                    <Tag size={12} /> {cat.label}
                                </span>
                                <span className="stu-announcement-date">
                                    {new Date(a.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                                </span>
                            </div>
                            <h4>{a.title}</h4>
                            <p>{a.content.substring(0, 100)}...</p>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
