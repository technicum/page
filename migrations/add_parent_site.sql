-- Add parent_site_id to support multiple bio links per business (staff/employee links)
ALTER TABLE ms_sites
  ADD COLUMN parent_site_id INT UNSIGNED DEFAULT NULL AFTER is_published;

CREATE INDEX idx_sites_parent ON ms_sites (parent_site_id);
