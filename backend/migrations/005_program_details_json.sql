-- ============================================
-- 005_program_details_json.sql
-- Expand cms_programs with structured JSON data
-- ============================================

ALTER TABLE cms_programs 
ADD COLUMN milestones_json JSON,
ADD COLUMN showcase_json JSON,
ADD COLUMN alumni_json JSON,
ADD COLUMN stats_json JSON;

-- Seed initial JSON data for TKJ as example
-- (Note: MySQL JSON_ARRAY/JSON_OBJECT can be used but strings are safer for some environments)
UPDATE cms_programs 
SET 
  milestones_json = '[
    {"grade": "Kelas X", "title": "Fondasi Cipta Karya", "skills": ["Dasar Seni Rupa", "Tipografi Dasar", "Sketsa Tangan", "Etika Profesi"], "color": "#4f46e5", "icon": "book"},
    {"grade": "Kelas XI", "title": "Eksplorasi Medium", "skills": ["Desain Grafis", "Fotografi", "Videografi", "Animasi 2D"], "color": "#10b981", "icon": "settings"},
    {"grade": "Kelas XII", "title": "Portfolio & Industri", "skills": ["UI/UX Design", "Project Industri", "Sertifikasi BNSP", "Pameran Akhir"], "color": "#f59e0b", "icon": "graduation-cap"}
  ]',
  showcase_json = '[
    {"id": 1, "type": "image", "url": "https://images.unsplash.com/photo-1558494949-ef010cbdcc48?w=800&q=80", "title": "Server Rack Setup", "author": "Budi (Kelas XII)", "size": "large"},
    {"id": 2, "type": "video", "url": "https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=800&q=80", "title": "Network Infrastructure", "author": "Siti (Kelas XI)", "size": "standard"},
    {"id": 3, "type": "image", "url": "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800&q=80", "title": "Cyber Security Lab", "author": "Andi (Kelas XII)", "size": "tall"},
    {"id": 4, "type": "image", "url": "https://images.unsplash.com/photo-1563770660941-20978e870813?w=800&q=80", "title": "Fiber Optic Splicing", "author": "Rina (Kelas X)", "size": "wide"},
    {"id": 5, "type": "image", "url": "https://images.unsplash.com/photo-1516321497487-e288fb19713f?w=800&q=80", "title": "Linux Server Admin", "author": "Agus (Kelas XI)", "size": "standard"}
  ]',
  alumni_json = '[
    {"id": 1, "name": "Diana R.", "role": "Senior UX Designer", "company": "Gojek", "quote": "Skill praktik di sekolah dan pendekatan mentor sangat relevan. Langsung kepakai di industri tech.", "image": "https://i.pravatar.cc/150?u=diana"},
    {"id": 2, "name": "Rizky M.", "role": "Art Director", "company": "Ogilvy", "quote": "Project based learning di SMK benar-benar membentuk mental kreatif dan problem solving saya.", "image": "https://i.pravatar.cc/150?u=rizky"}
  ]',
  stats_json = '{"labor_absorption": "90%", "partners_count": "50+"}'
WHERE slug = 'tkj' OR title LIKE '%Komputer%';
