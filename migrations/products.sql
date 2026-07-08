-- Products table for physical, digital and service offerings
CREATE TABLE IF NOT EXISTS ms_products (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  account_id    INT UNSIGNED NOT NULL,
  site_id       INT UNSIGNED DEFAULT NULL,
  type          ENUM('physical','digital','service') NOT NULL DEFAULT 'physical',
  name          VARCHAR(200) NOT NULL,
  description   TEXT DEFAULT NULL,
  price         DECIMAL(10,2) DEFAULT NULL,
  compare_price DECIMAL(10,2) DEFAULT NULL,
  currency      VARCHAR(10) DEFAULT 'INR',
  image_url     VARCHAR(500) DEFAULT NULL,
  file_url      VARCHAR(500) DEFAULT NULL,   -- digital: download link
  duration      VARCHAR(100) DEFAULT NULL,   -- service: e.g. "1 hour", "30 min"
  collection    VARCHAR(100) DEFAULT NULL,   -- optional grouping label
  in_stock      TINYINT(1) DEFAULT 1,
  status        TINYINT(1) DEFAULT 1,
  sort_order    INT DEFAULT 0,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  KEY idx_account (account_id),
  KEY idx_site (site_id),
  KEY idx_type (type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
