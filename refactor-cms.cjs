const fs = require('fs');

const file = 'src/features/cms/pages/CmsHomePage.jsx';
let content = fs.readFileSync(file, 'utf-8');

// Replacements mapping
content = content.replace(/style=\{tabNavStyle\}/g, 'className="cms-tab-nav"');
content = content.replace(/style=\{\{\s*\.\.\.tabBtnStyle.*?\}\}/g, 'className={`cms-tab-btn ${activeTab === t.key ? \'active\' : \'\'}`}');
content = content.replace(/style=\{tabContentStyle\}/g, 'style={{ minHeight: 400 }}');

content = content.replace(/style=\{sectionCardStyle\}/g, 'className="cms-section-card"');
content = content.replace(/style=\{\{\s*\.\.\.sectionCardStyle.*?\}\}/g, 'className="cms-section-card" style={{ marginTop: 16 }}');

content = content.replace(/style=\{sectionTitleStyle\}/g, 'className="cms-section-title"');
content = content.replace(/style=\{\{\s*\.\.\.sectionTitleStyle.*?marginBottom: 0 \}\}/g, 'className="cms-section-title" style={{ marginBottom: 0 }}');
content = content.replace(/style=\{\{\s*\.\.\.sectionTitleStyle.*?marginBottom: 4 \}\}/g, 'className="cms-section-title" style={{ marginBottom: 4 }}');

content = content.replace(/style=\{sectionDescStyle\}/g, 'className="cms-section-desc"');
content = content.replace(/style=\{hintStyle\}/g, 'className="cms-hint"');
content = content.replace(/style=\{emptyStyle\}/g, 'className="cms-empty-state"');
content = content.replace(/style=\{itemCardStyle\}/g, 'className="cms-item-card"');
content = content.replace(/style=\{ctaPreviewStyle\}/g, 'className="cms-cta-preview"');
content = content.replace(/style=\{ctaPreviewBtnStyle\}/g, 'className="cms-cta-preview-btn"');

// Delete the STYLES block at the bottom
const styleBlockRegex = /\/\/ ==================== STYLES ====================\s*const tabNavStyle =[\s\S]*$/;
content = content.replace(styleBlockRegex, '');

fs.writeFileSync(file, content);
console.log('CmsHomePage refactored successfully.');
