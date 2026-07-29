-- Add apps JSON column to ms_sites for storing per-site enabled apps + config
ALTER TABLE ms_sites
  ADD COLUMN apps LONGTEXT DEFAULT NULL COMMENT 'JSON: { appId: { enabled: bool, ...config } }';
