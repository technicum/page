-- Website Builder migration
-- Run: mysql -u root -p pagezapper < migrations/website.sql

CREATE TABLE IF NOT EXISTS ms_websites (
  id INT AUTO_INCREMENT PRIMARY KEY,
  account_id INT NOT NULL,
  title VARCHAR(255) NOT NULL DEFAULT 'My Website',
  subdomain VARCHAR(80) UNIQUE,
  settings JSON DEFAULT '{}',
  is_published TINYINT(1) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (account_id) REFERENCES ms_accounts(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS ms_website_pages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  website_id INT NOT NULL,
  title VARCHAR(255) NOT NULL DEFAULT 'New Page',
  slug VARCHAR(100) NOT NULL DEFAULT 'home',
  is_home TINYINT(1) DEFAULT 0,
  sections JSON DEFAULT '[]',
  seo_title VARCHAR(255) DEFAULT NULL,
  seo_desc TEXT DEFAULT NULL,
  sort_order INT DEFAULT 0,
  is_published TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (website_id) REFERENCES ms_websites(id) ON DELETE CASCADE
);
