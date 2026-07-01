-- Add parent_site_id and path_slug to support staff/employee bio links
-- Staff links live at: business.pagezaper.com/staffslug
ALTER TABLE ms_sites
  ADD COLUMN parent_site_id INT UNSIGNED DEFAULT NULL AFTER is_published,
  ADD COLUMN path_slug      VARCHAR(100) DEFAULT NULL AFTER parent_site_id;

-- Fast lookup: find staff sites under a parent by slug
CREATE INDEX idx_sites_parent     ON ms_sites (parent_site_id);
CREATE UNIQUE INDEX idx_sites_parent_slug ON ms_sites (parent_site_id, path_slug);
