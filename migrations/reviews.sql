-- ── Reviews migration ────────────────────────────────────────────────────────
-- Run this in phpMyAdmin or via MySQL CLI

CREATE TABLE IF NOT EXISTS ms_reviews (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  site_id        INT NOT NULL,
  reviewer_name  VARCHAR(100) NOT NULL,
  reviewer_email VARCHAR(255) DEFAULT NULL,
  rating         TINYINT UNSIGNED NOT NULL,
  comment        TEXT DEFAULT NULL,
  is_approved    TINYINT(1) NOT NULL DEFAULT 1,
  created_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_site (site_id),
  INDEX idx_site_approved (site_id, is_approved)
);
