-- PageZapper Database Schema
-- Run this once in your Hostinger MySQL panel (phpMyAdmin)

CREATE TABLE IF NOT EXISTS `ms_accounts` (
  `id`         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name`       VARCHAR(120) NOT NULL,
  `email`      VARCHAR(180) NOT NULL UNIQUE,
  `password`   VARCHAR(255) NOT NULL,
  `plan`       ENUM('free','pro','business') NOT NULL DEFAULT 'free',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `ms_pages` (
  `id`            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `account_id`    INT UNSIGNED NOT NULL,
  `title`         VARCHAR(160) NOT NULL,
  `subdomain`     VARCHAR(80)  NOT NULL UNIQUE,
  `custom_domain` VARCHAR(180) DEFAULT NULL,
  `category`      VARCHAR(80)  DEFAULT '',
  `template_id`   VARCHAR(80)  NOT NULL DEFAULT 'minimal',
  `settings`      LONGTEXT     DEFAULT NULL,
  `is_published`  TINYINT(1)   NOT NULL DEFAULT 1,
  `created_at`    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_account` (`account_id`),
  KEY `idx_subdomain` (`subdomain`),
  KEY `idx_custom_domain` (`custom_domain`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
