-- ── ms_media — Media library ───────────────────────────────────────────────
-- Run this in phpMyAdmin to enable database-tracked media.

CREATE TABLE IF NOT EXISTS `ms_media` (
  `id`          int(11)       NOT NULL AUTO_INCREMENT,
  `account_id`  int(11)       NOT NULL,
  `site_id`     int(11)       NOT NULL,
  `filename`    varchar(255)  NOT NULL,
  `original`    varchar(255)  DEFAULT NULL COMMENT 'Original upload filename',
  `url`         varchar(500)  NOT NULL COMMENT 'Public URL path e.g. /media/7/photo.jpg',
  `mime_type`   varchar(100)  DEFAULT NULL COMMENT 'e.g. image/jpeg',
  `size`        int(11)       DEFAULT 0 COMMENT 'File size in bytes',
  `width`       smallint(6)   DEFAULT NULL,
  `height`      smallint(6)   DEFAULT NULL,
  `alt`         varchar(255)  DEFAULT NULL COMMENT 'Alt text for accessibility',
  `folder`      varchar(100)  DEFAULT NULL COMMENT 'Optional folder/tag for organization',
  `created_at`  timestamp     NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_account`  (`account_id`),
  KEY `idx_site`     (`site_id`),
  KEY `idx_folder`   (`folder`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
