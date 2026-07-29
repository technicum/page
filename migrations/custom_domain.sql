-- Add custom_domain to ms_websites (if not already present)
ALTER TABLE ms_websites ADD COLUMN IF NOT EXISTS custom_domain VARCHAR(180) DEFAULT NULL;
ALTER TABLE ms_websites ADD UNIQUE INDEX IF NOT EXISTS idx_websites_custom_domain (custom_domain);

-- Ensure ms_sites has apps column (already added by sites_add_apps.sql but safe to repeat)
ALTER TABLE ms_sites ADD COLUMN IF NOT EXISTS custom_domain VARCHAR(180) DEFAULT NULL;
ALTER TABLE ms_sites ADD UNIQUE INDEX IF NOT EXISTS idx_sites_custom_domain (custom_domain);
