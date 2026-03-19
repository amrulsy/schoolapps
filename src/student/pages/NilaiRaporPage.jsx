import { useState } from 'react'
import { BookOpen, Award, ChevronDown, ChevronUp, Download } from 'lucide-react'

const mockNilai = {
    semester: 'Ganjil 2025/2026',
    ranking: 5,
    totalSiswa: 30,
    average: 82.5,
    subjects: [
        { nama: 'Matematika', tugas: 85, uts: 78, uas: 82, akhir: 82 },
        { nama: 'Bahasa Indonesia', tugas: 90, uts: 88, uas: 85, akhir: 88 },
        { nama: 'Bahasa Inggris', tugas: 78, uts: 75, uas: 80, akhir: 78 },
        { nama: 'Fisika', tugas: 80, uts: 72, uas: 75, akhir: 76 },
        { nama: 'Kimia', tugas: 88, uts: 85, uas: 82, akhir: 85 },
        { nama: 'Pemrograman Dasar', tugas: 95, uts: 90, uas: 92, akhir: 92 },
        { nama: 'Basis Data', tugas: 88, uts: 82, uas: 85, akhir: 85 },
        { nama: 'Pendidikan Agama', tugas: 90, uts: 88, uas: 90, akhir: 89 },
        { nama: 'PKN', tugas: 85, uts: 80, uas: 82, akhir: 82 },
        { nama: 'Penjas', tugas: 88, uts: 85, uas: 87, akhir: 87 },
    ]
}

const getGradeColor = (val) => {
    if (val >= 85) return '#10B981'
    if (val >= 75) return '#3B82F6'
    if (val >= 65) return '#F59E0B'
    return '#EF4444'
}

export default function NilaiRaporPage() {
    const [expandedSubject, setExpandedSubject] = useState(null)
    const { semester, ranking, totalSiswa, average, subjects } = mockNilai

    return (
        <div className="stu-page">
            <h2 className="stu-page-title">📊 Nilai & e-Rapor</h2>

            {/* Semester Selector */}
            <div className="stu-semester-card">
                <div className="stu-semester-info">
                    <BookOpen size={20} />
                    <div>
                        <span className="stu-semester-name">{semester}</span>
                        <span className="stu-semester-meta">Peringkat {ranking}/{totalSiswa} • Rata-rata: {average}</span>
                    </div>
                </div>
            </div>

            {/* Average Circle */}
            <div className="stu-average-card">
                <div className="stu-average-circle" style={{ borderColor: getGradeColor(average) }}>
                    <span className="stu-average-value" style={{ color: getGradeColor(average) }}>{average}</span>
                    <span className="stu-average-label">Rata-rata</span>
                </div>
                <div className="stu-ranking-info">
                    <Award size={24} color="#F59E0B" />
                    <span>Peringkat <strong>{ranking}</strong> dari {totalSiswa} siswa</span>
                </div>
            </div>

            {/* Subject Cards */}
            <div className="stu-section">
                <h3 className="stu-section-title">Nilai Per Mata Pelajaran</h3>
                <div className="stu-list">
                    {subjects.map((s, i) => (
                        <div key={i} className="stu-subject-card" onClick={() => setExpandedSubject(expandedSubject === i ? null : i)}>
                            <div className="stu-subject-header">
                                <div className="stu-subject-name">{s.nama}</div>
                                <div className="stu-subject-right">
                                    <span className="stu-subject-grade" style={{ color: getGradeColor(s.akhir) }}>{s.akhir}</span>
                                    {expandedSubject === i ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                </div>
                            </div>
                            {/* Grade bar */}
                            <div className="stu-grade-bar">
                                <div className="stu-grade-fill" style={{ width: `${s.akhir}%`, background: getGradeColor(s.akhir) }} />
                            </div>
                            {expandedSubject === i && (
                                <div className="stu-subject-detail">
                                    <div className="stu-detail-row"><span>Tugas/PR</span><span>{s.tugas}</span></div>
                                    <div className="stu-detail-row"><span>UTS</span><span>{s.uts}</span></div>
                                    <div className="stu-detail-row"><span>UAS</span><span>{s.uas}</span></div>
                                    <div className="stu-detail-row final"><span>Nilai Akhir</span><span>{s.akhir}</span></div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Download e-Rapor Button */}
            <button className="stu-download-btn">
                <Download size={18} />
                Download e-Rapor (PDF)
            </button>
        </div>
    )
}
