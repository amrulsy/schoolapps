import { useState } from 'react'
import { BookOpen, Download } from 'lucide-react'


const getGradeColor = (val) => {
    if (val >= 85) return '#10B981'
    if (val >= 75) return '#3B82F6'
    if (val >= 65) return '#F59E0B'
    return '#EF4444'
}

const getGradeLabel = (val) => {
    if (val >= 95) return 'SUMMA CUM LAUDE'
    if (val >= 90) return 'MAGNA CUM LAUDE'
    if (val >= 85) return 'HIGH DISTINCTION'
    if (val >= 80) return 'EXCELLENT'
    if (val >= 75) return 'VERY GOOD'
    return 'KEEP PUSHING'
}

// Static Mock Data for V4 Preview
const MOCK_SUBJECTS = [
    { subject: 'Matematika Terapan', final: 92, tugas: 95, uts: 92, uas: 91, category: 'A' },
    { subject: 'Bahasa Inggis Business', final: 88, tugas: 85, uts: 90, uas: 89, category: 'A' },
    { subject: 'Pemrograman Web Fullstack', final: 95, tugas: 98, uts: 92, uas: 95, category: 'B' },
    { subject: 'Basis Data Lanjut', final: 84, tugas: 80, uts: 85, uas: 87, category: 'B' },
    { subject: 'Pendidikan Agama & Budi Pekerti', final: 94, tugas: 95, uts: 92, uas: 94, category: 'C' },
    { subject: 'Pendidikan Pancasila', final: 87, tugas: 85, uts: 85, uas: 90, category: 'C' }
]

export default function NilaiRaporPage() {
    const [expandedSubject, setExpandedSubject] = useState(null)

    // Use Mock Data for Preview
    const subjects = MOCK_SUBJECTS
    const averageScore = Math.round(subjects.reduce((acc, curr) => acc + curr.final, 0) / subjects.length)


    return (
        <div className="stu-page" style={{ paddingBottom: '100px' }}>
            {/* V4 Immersive Hub: Universal Monument */}
            <div className="stu-fade-up">
                <div className="stu-academic-v4-banner">
                    <div className="stu-score-monument">
                        <span className="stu-score-main-val">{averageScore}</span>
                        <span className="stu-score-label-elite">{getGradeLabel(averageScore)}</span>
                    </div>

                    <h2 className="stu-academic-title-v4">Electronic Academic Universe</h2>

                    <div className="stu-academic-v4-stats">
                        <div className="stu-v4-stat-box">
                            <span className="stu-v4-stat-label">TOTAL SUBJECTS</span>
                            <span className="stu-v4-stat-val">{subjects.length}</span>
                        </div>
                        <div className="stu-v4-stat-box">
                            <span className="stu-v4-stat-label">RANK STATUS</span>
                            <span className="stu-v4-stat-val">ELITE</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Glassmorphism 3.0 Subject Matrix */}
            <div className="stu-section stu-fade-up delay-1">
                <div className="stu-section-header">
                    <h3 className="stu-section-title">Academic Universe</h3>
                </div>

                <div className="stu-subject-grid-v4">
                    {subjects.map((s, i) => (
                        <div
                            key={i}
                            className="stu-subject-card-v4 stu-fade-up"
                            style={{ animationDelay: `${0.2 + (i * 0.1)}s` }}
                            onClick={() => setExpandedSubject(expandedSubject === i ? null : i)}
                        >
                            <div className="stu-subject-v4-icon">
                                <BookOpen size={18} />
                            </div>
                            <div className="stu-subject-v4-name">{s.subject}</div>

                            <div className="stu-subject-v4-grade">
                                <span className="stu-subject-v4-val" style={{ color: getGradeColor(s.final) }}>{s.final}</span>
                                <span className="stu-subject-v4-tag">GRADE {s.final >= 90 ? 'A' : 'B'}</span>
                            </div>

                            {/* Detailed Pop-out for Glassmorphism 3.0 */}
                            {expandedSubject === i && (
                                <div className="stu-subject-detail-v3 stu-fade-in" style={{ marginTop: '12px', borderTop: '1px solid var(--stu-border)' }}>
                                    <div className="stu-detail-item-v3">
                                        <span className="stu-detail-label-v3">Tugas</span>
                                        <span className="stu-detail-value-v3">{s.tugas}</span>
                                    </div>
                                    <div className="stu-detail-item-v3">
                                        <span className="stu-detail-label-v3">UTS</span>
                                        <span className="stu-detail-value-v3">{s.uts}</span>
                                    </div>
                                    <div className="stu-detail-item-v3">
                                        <span className="stu-detail-label-v3">UAS</span>
                                        <span className="stu-detail-value-v3">{s.uas}</span>
                                    </div>
                                    <div className="stu-detail-item-v3" style={{ background: `${getGradeColor(s.final)}20` }}>
                                        <span className="stu-detail-label-v3">Final</span>
                                        <span className="stu-detail-value-v3" style={{ color: getGradeColor(s.final) }}>{s.final}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Elite Action Footer */}
            <div className="stu-academic-footer stu-fade-up delay-4">
                <button className="stu-btn-download-elite" style={{ background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)' }}>
                    <Download size={20} />
                    <span>Generate Academic Report</span>
                </button>
            </div>
        </div>
    )
}
