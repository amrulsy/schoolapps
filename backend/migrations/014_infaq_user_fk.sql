-- Migration: 014_infaq_user_fk.sql
-- Description: Add foreign key constraint to user_id in infaq_harian

-- 1. Remove orphaned user_id values
UPDATE infaq_harian ih
LEFT JOIN users u ON ih.user_id = u.id
SET ih.user_id = NULL
WHERE ih.user_id IS NOT NULL AND u.id IS NULL;

-- 2. Add foreign key constraint
ALTER TABLE infaq_harian 
ADD CONSTRAINT fk_infaq_user 
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;
