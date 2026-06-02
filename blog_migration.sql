-- Run this in phpMyAdmin to add blog support
-- PageZapper Blog Migration

CREATE TABLE IF NOT EXISTS `ms_posts` (
  `id`            int(11)                     NOT NULL AUTO_INCREMENT,
  `page_id`       int(11)                     NOT NULL,
  `account_id`    int(11)                     NOT NULL,
  `title`         varchar(255)                NOT NULL,
  `slug`          varchar(255)                NOT NULL,
  `content`       longtext                    DEFAULT NULL,
  `excerpt`       text                        DEFAULT NULL,
  `meta_title`    varchar(255)                DEFAULT NULL,
  `meta_desc`     text                        DEFAULT NULL,
  `og_image`      varchar(500)                DEFAULT NULL,
  `status`        enum('draft','published')   NOT NULL DEFAULT 'draft',
  `created_at`    timestamp                   NULL DEFAULT current_timestamp(),
  `updated_at`    timestamp                   NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `page_slug` (`page_id`, `slug`),
  KEY `account_id` (`account_id`),
  CONSTRAINT `ms_posts_page`    FOREIGN KEY (`page_id`)    REFERENCES `ms_pages`    (`id`) ON DELETE CASCADE,
  CONSTRAINT `ms_posts_account` FOREIGN KEY (`account_id`) REFERENCES `ms_accounts` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
