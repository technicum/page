-- Add lat/lng/state to ms_sites for radius-based search
ALTER TABLE ms_sites
  ADD COLUMN lat   DECIMAL(10, 6) DEFAULT NULL,
  ADD COLUMN lng   DECIMAL(10, 6) DEFAULT NULL,
  ADD COLUMN state VARCHAR(100)   DEFAULT NULL;

-- Index for faster geo queries
CREATE INDEX idx_sites_lat_lng ON ms_sites (lat, lng);
CREATE INDEX idx_sites_state   ON ms_sites (state);
