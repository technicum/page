-- Galleries table for managing named photo galleries
CREATE TABLE IF NOT EXISTS ms_galleries (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  account_id  INT UNSIGNED NOT NULL,
  site_id     INT UNSIGNED DEFAULT NULL,
  name        VARCHAR(200) NOT NULL,
  description TEXT DEFAULT NULL,
  cover_url   VARCHAR(500) DEFAULT NULL,
  images      LONGTEXT DEFAULT NULL,   -- JSON array of image URLs
  status      TINYINT(1) DEFAULT 1,
  sort_order  INT DEFAULT 0,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  KEY idx_account (account_id),
  KEY idx_site (site_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
