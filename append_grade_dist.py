import os

content = open(r'src\pages\guru\GuruRaporPage.jsx', 'r', encoding='utf-8').read()

grade_dist_code = (
    "\n\n// R11: Grade Distribution Chart\n"
    "function GradeDistChart({ students }) {\n"
    "    const grades = [\n"
    "        { label: 'A (90+)', range: [90, 100], color: '#10b981', textColor: 'var(--success-700)' },\n"
    "        { label: 'B (80-89)', range: [80, 89], color: '#3b82f6', textColor: 'var(--primary-700)' },\n"
    "        { label: 'C (70-79)', range: [70, 79], color: '#f59e0b', textColor: '#b45309' },\n"
    "        { label: 'D (<70)', range: [0, 69], color: '#ef4444', textColor: '#b91c1c' },\n"
    "    ]\n"
    "    const withGrades = students.filter(s => s.nilai_akhir > 0)\n"
    "    if (withGrades.length === 0) return null\n"
    "    const counts = grades.map(g => ({\n"
    "        ...g, count: withGrades.filter(s => s.nilai_akhir >= g.range[0] && s.nilai_akhir <= g.range[1]).length\n"
    "    }))\n"
    "    const maxCount = Math.max(...counts.map(g => g.count), 1)\n"
    "    const avg = (withGrades.reduce((a, s) => a + s.nilai_akhir, 0) / withGrades.length).toFixed(1)\n"
    "    return (\n"
    '        <div style={{ background: \'var(--bg-card)\', borderRadius: 16, padding: \'20px\', border: \'1px solid var(--border-color)\', marginTop: 20 }}>\n'
    '            <div className="d-flex align-items-center justify-content-between mb-3">\n'
    '                <div className="d-flex align-items-center gap-2">\n'
    "                    <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--primary-50)', color: 'var(--primary-600)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>\n"
    "                        <BarChart2 size={16} />\n"
    "                    </div>\n"
    '                    <h6 className="fw-bold mb-0 text-primary">Distribusi Nilai Akhir</h6>\n'
    "                </div>\n"
    "                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)' }}>\n"
    '                    Rata-rata: <span className="text-primary fw-black">{avg}</span> &bull; {withGrades.length} siswa\n'
    "                </div>\n"
    "            </div>\n"
    "            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', height: 80 }}>\n"
    "                {counts.map(g => (\n"
    "                    <div key={g.label} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, height: '100%', justifyContent: 'flex-end' }}>\n"
    "                        <div style={{ fontWeight: 800, fontSize: '0.95rem', color: g.textColor }}>{g.count}</div>\n"
    "                        <div style={{ width: '100%', background: g.color, borderRadius: 6, opacity: g.count === 0 ? 0.15 : 0.85, height: String(Math.max(8, Math.round((g.count / maxCount) * 52))) + 'px', transition: 'height 0.6s cubic-bezier(0.16, 1, 0.3, 1)' }} />\n"
    "                        <div style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-muted)', textAlign: 'center', whiteSpace: 'nowrap' }}>{g.label}</div>\n"
    "                    </div>\n"
    "                ))}\n"
    "            </div>\n"
    "        </div>\n"
    "    )\n"
    "}\n"
)

open(r'src\pages\guru\GuruRaporPage.jsx', 'w', encoding='utf-8').write(content + grade_dist_code)
print("GradeDistChart appended successfully!")
