-- Migration: 008_infaq_settings.sql
-- Description: Create settings table for Infaq Harian

CREATE TABLE IF NOT EXISTS infaq_settings (
    \`key\` VARCHAR(50) PRIMARY KEY,
    \`value\` TEXT NOT NULL
);

-- Seed defaults
INSERT INTO infaq_settings (\`key\`, \`value\`) VALUES 
('nominal_default', '2000'),
('active_days', '[1,2,3,4,5,6]'), -- 1: Mon, 6: Sat
('wa_template', 'Syukron Jazakumullah Khairan kepada [nama] yang telah berinfaq sebesar [nominal] pada tanggal [tanggal]. Semoga menjadi berkah. Amin.')
ON DUPLICATE KEY UPDATE \`value\` = VALUES(\`value\`);
