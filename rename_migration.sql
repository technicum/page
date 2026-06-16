-- ============================================================
-- Migration: rename ms_pages → ms_sites
-- Run this in phpMyAdmin BEFORE deploying updated code.
-- ============================================================

-- 1. Rename the main table
ALTER TABLE `ms_pages` RENAME TO `ms_sites`;

-- 2. ms_hits references page_id → rename to site_id for clarity
ALTER TABLE `ms_hits` CHANGE `page_id` `site_id` int(11) NOT NULL;

-- 3. ms_posts references page_id → rename to site_id
ALTER TABLE `ms_posts` CHANGE `page_id` `site_id` int(11) NOT NULL;

-- 4. Add is_admin flag to ms_accounts (for the admin panel)
ALTER TABLE `ms_accounts`
  ADD COLUMN `is_admin` tinyint(1) NOT NULL DEFAULT 0 AFTER `plan`;

-- 5. Make your account an admin (change email if needed)
UPDATE `ms_accounts` SET `is_admin` = 1 WHERE `email` = 'abhi@gmail.com';

-- Done!
