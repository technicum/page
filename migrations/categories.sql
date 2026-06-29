-- Categories table
CREATE TABLE IF NOT EXISTS ms_categories (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(100) NOT NULL,
  slug        VARCHAR(100) NOT NULL UNIQUE,
  icon        VARCHAR(10)  NOT NULL DEFAULT '🏢',
  description VARCHAR(255) DEFAULT NULL,
  sort_order  INT          NOT NULL DEFAULT 0,
  status      TINYINT(1)   NOT NULL DEFAULT 1,
  created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Seed with common business categories
INSERT INTO ms_categories (name, slug, icon, sort_order) VALUES
  ('Restaurant & Food',      'restaurant',   '🍽️',  1),
  ('Retail & Shop',          'retail',       '🛍️',  2),
  ('Healthcare',             'healthcare',   '🏥',  3),
  ('Education',              'education',    '🎓',  4),
  ('Freelancer',             'freelancer',   '💼',  5),
  ('Real Estate',            'real-estate',  '🏠',  6),
  ('Beauty & Wellness',      'beauty',       '💆',  7),
  ('Technology',             'technology',   '💻',  8),
  ('Creative & Design',      'creative',     '🎨',  9),
  ('Fitness & Sports',       'fitness',      '🏋️', 10),
  ('Travel & Tourism',       'travel',       '✈️', 11),
  ('Events & Entertainment', 'events',       '🎉', 12),
  ('Finance & Legal',        'finance',      '⚖️', 13),
  ('Non-profit',             'nonprofit',    '❤️', 14),
  ('Other',                  'other',        '📁', 99);

-- Add category_id to sites table
ALTER TABLE ms_sites
  ADD COLUMN category_id INT UNSIGNED DEFAULT NULL,
  ADD CONSTRAINT fk_site_category FOREIGN KEY (category_id) REFERENCES ms_categories(id) ON DELETE SET NULL;
