-- Add multi-image gallery support to products
ALTER TABLE ms_products
  ADD COLUMN images LONGTEXT DEFAULT NULL COMMENT 'JSON array of additional image URLs';
