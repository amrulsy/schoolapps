import { useState } from 'react'
import { BookOpen, Award, ChevronDown, ChevronUp, Download } from 'lucide-react'
import { useStudent } from '../StudentApp'

const getGradeColor = (val) => {
    if (val >= 85) return '#10B981'
    if (val >= 75) return '#3B82F6'
    if (val >= 65) return '#F59E0B'
    return '#EF4444'
}

export default function NilaiRaporPage() {
    const { nilaiData } = useStudent()
    const [expandedSubject, setExpandedSubject] = useState(null)
    const { currentSemester, subjects } = nilaiData || { currentSemester: { semester: 'Ganjil', tahunAjaran: '' }, subjects: { muatanNasional: [], muatanKewilayahan: [], muatanPeminatan: [] } }

    const allSubjects = [
        ...(subjects?.muatanNasional || []),
        ...(subjects?.muatanKewilayahan || []),
        ...(subjects?.muatanPeminatan || [])
    ]

    const average = allSubjects.length > 0
        ? Math.round(allSubjects.reduce((acc, curr) => acc + curr.final, 0) / allSubjects.length)
        : 0

    const semester = `${currentSemester.semester} ${currentSemester.tahunAjaran}`
    const ranking = '-'
    const totalSiswa = '-'

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
                    {allSubjects.map((s, i) => (
                        <div key={i} className="stu-subject-card" onClick={() => setExpandedSubject(expandedSubject === i ? null : i)}>
                            <div className="stu-subject-header">
                                <div className="stu-subject-name">{s.subject}</div>
                                <div className="stu-subject-right">
                                    <span className="stu-subject-grade" style={{ color: getGradeColor(s.final) }}>{s.final}</span>
                                    {expandedSubject === i ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                </div>
                            </div>
                            {/* Grade bar */}
                            <div className="stu-grade-bar">
                                <div className="stu-grade-fill" style={{ width: `${s.final}%`, background: getGradeColor(s.final) }} />
                            </div>
                            {expandedSubject === i && (
                                <div className="stu-subject-detail">
                                    <div className="stu-detail-row"><span>Tugas/PR</span><span>{s.tugas}</span></div>
                                    <div className="stu-detail-row"><span>UTS</span><span>{s.uts}</span></div>
                                    <div className="stu-detail-row"><span>UAS</span><span>{s.uas}</span></div>
                                    <div className="stu-detail-row final"><span>Nilai Akhir</span><span>{s.final}</span></div>
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
