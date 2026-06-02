-- Forms Module Migration
-- Run this in phpMyAdmin or via MySQL CLI

CREATE TABLE IF NOT EXISTS `ms_forms` (
  `id`         INT(11) NOT NULL AUTO_INCREMENT,
  `account_id` INT(11) NOT NULL,
  `site_id`    INT(11) NOT NULL,
  `name`       VARCHAR(150) NOT NULL,
  `fields`     LONGTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL DEFAULT '[]'
               CHECK (json_valid(`fields`)),
  `settings`   LONGTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL DEFAULT '{}'
               CHECK (json_valid(`settings`)),
  `created_at` TIMESTAMP NULL DEFAULT current_timestamp(),
  `updated_at` TIMESTAMP NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `account_id` (`account_id`),
  KEY `site_id`    (`site_id`),
  CONSTRAINT `ms_forms_account_fk` FOREIGN KEY (`account_id`) REFERENCES `ms_accounts` (`id`) ON DELETE CASCADE,
  CONSTRAINT `ms_forms_site_fk`    FOREIGN KEY (`site_id`)    REFERENCES `ms_pages`    (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `ms_form_entries` (
  `id`         INT(11) NOT NULL AUTO_INCREMENT,
  `form_id`    INT(11) NOT NULL,
  `data`       LONGTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL DEFAULT '{}'
               CHECK (json_valid(`data`)),
  `ip`         VARCHAR(45) DEFAULT NULL,
  `created_at` TIMESTAMP NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `form_id` (`form_id`),
  CONSTRAINT `ms_form_entries_fk` FOREIGN KEY (`form_id`) REFERENCES `ms_forms` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
