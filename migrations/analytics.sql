CREATE TABLE IF NOT EXISTS `ms_analytics` (
  `id`         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `site_id`    INT UNSIGNED NOT NULL,
  `event_type` VARCHAR(16)  NOT NULL COMMENT 'view|click',
  `block_id`   VARCHAR(64)  DEFAULT NULL,
  `block_type` VARCHAR(64)  DEFAULT NULL,
  `label`      VARCHAR(255) DEFAULT NULL,
  `ip_hash`    VARCHAR(40)  DEFAULT NULL,
  `referrer`   VARCHAR(512) DEFAULT NULL,
  `created_at` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_site_date`  (`site_id`, `created_at`),
  INDEX `idx_site_event` (`site_id`, `event_type`, `created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
