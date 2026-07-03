-- Chat system migration
-- Run once in phpMyAdmin or MySQL CLI

CREATE TABLE IF NOT EXISTS `ms_chat_settings` (
  `id`              INT AUTO_INCREMENT PRIMARY KEY,
  `site_id`         INT NOT NULL,
  `account_id`      INT NOT NULL,
  `enabled`         TINYINT(1) NOT NULL DEFAULT 0,
  `require_name`    TINYINT(1) NOT NULL DEFAULT 1,
  `require_email`   TINYINT(1) NOT NULL DEFAULT 0,
  `require_phone`   TINYINT(1) NOT NULL DEFAULT 0,
  `welcome_message` VARCHAR(500) DEFAULT 'Hi! How can we help you today?',
  `offline_message` VARCHAR(500) DEFAULT 'We are currently offline. Leave a message and we''ll get back to you soon.',
  `created_at`      DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `site_id` (`site_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `ms_chat_sessions` (
  `id`              INT AUTO_INCREMENT PRIMARY KEY,
  `site_id`         INT NOT NULL,
  `account_id`      INT NOT NULL,
  `visitor_name`    VARCHAR(100) DEFAULT NULL,
  `visitor_email`   VARCHAR(100) DEFAULT NULL,
  `visitor_phone`   VARCHAR(30)  DEFAULT NULL,
  `token`           VARCHAR(64)  NOT NULL,
  `status`          ENUM('open','closed') DEFAULT 'open',
  `vendor_read`     TINYINT(1) NOT NULL DEFAULT 0,
  `last_message_at` DATETIME DEFAULT NULL,
  `created_at`      DATETIME DEFAULT CURRENT_TIMESTAMP,
  KEY `site_id` (`site_id`),
  KEY `account_id` (`account_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `ms_chat_messages` (
  `id`          INT AUTO_INCREMENT PRIMARY KEY,
  `session_id`  INT NOT NULL,
  `sender`      ENUM('visitor','vendor') NOT NULL,
  `message`     TEXT NOT NULL,
  `is_read`     TINYINT(1) NOT NULL DEFAULT 0,
  `created_at`  DATETIME DEFAULT CURRENT_TIMESTAMP,
  KEY `session_id` (`session_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
