-- Auth extras migration
-- Run once in phpMyAdmin or MySQL CLI

-- Password reset token columns
ALTER TABLE `ms_accounts`
  ADD COLUMN `reset_token`   VARCHAR(64)  DEFAULT NULL AFTER `password`,
  ADD COLUMN `reset_expires` DATETIME     DEFAULT NULL AFTER `reset_token`,
  ADD COLUMN `is_suspended`  TINYINT(1)   NOT NULL DEFAULT 0 AFTER `reset_expires`;
