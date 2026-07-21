-- Make site_id nullable so media can be account-wide (not tied to a minisite)
ALTER TABLE ms_media MODIFY COLUMN site_id INT(11) NULL DEFAULT NULL;

-- Add 'original' column to store the user-facing filename
ALTER TABLE ms_media ADD COLUMN IF NOT EXISTS original VARCHAR(255) NULL AFTER filename;

-- Ensure folder column exists
ALTER TABLE ms_media ADD COLUMN IF NOT EXISTS folder VARCHAR(100) NULL AFTER size;

-- Serve account media from /media/u{accountId}/...
-- No schema change needed — url column already stores the path
