-- Add 'job' type to ms_products table
-- Run this in phpMyAdmin or MySQL CLI

ALTER TABLE ms_products
  MODIFY COLUMN type ENUM('physical','digital','service','job') NOT NULL DEFAULT 'physical';
