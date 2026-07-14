-- ─────────────────────────────────────────────────────────────────────────────
-- ms_posts: add columns for blog posts + website pages
--
-- Architecture:
--   ms_posts     → post_type IN ('post','page')
--   ms_products  → stays separate (products / services / jobs)
--   ms_websites  → stays separate (website settings)
--
-- Run ONCE on production:
--   mysql -u root -p pagezapper < migrations/unify_posts.sql
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Add new columns to ms_posts
ALTER TABLE ms_posts
  ADD COLUMN IF NOT EXISTS post_type   ENUM('post','page') NOT NULL DEFAULT 'post' AFTER account_id,
  ADD COLUMN IF NOT EXISTS website_id  INT DEFAULT NULL AFTER site_id,
  ADD COLUMN IF NOT EXISTS sections    JSON DEFAULT NULL AFTER content,
  ADD COLUMN IF NOT EXISTS meta        JSON DEFAULT NULL AFTER sections;

-- 2. Indexes for fast filtering
ALTER TABLE ms_posts
  ADD INDEX IF NOT EXISTS idx_post_type (post_type),
  ADD INDEX IF NOT EXISTS idx_website_id (website_id);

-- 3. Mark all existing rows explicitly as blog posts (safety net)
UPDATE ms_posts SET post_type = 'post' WHERE post_type = 'post';

-- 4. Migrate ms_website_pages → ms_posts (post_type = 'page')
--    SKIP THIS if you have no website data yet (ms_website_pages is empty or doesn't exist).
--    Only run if you previously created websites through the dashboard.
--
-- INSERT INTO ms_posts
--   (account_id, website_id, post_type, title, slug, status, sections, meta, sort_order, created_at, updated_at)
-- SELECT
--   w.account_id,
--   wp.website_id,
--   'page'                                         AS post_type,
--   wp.title,
--   wp.slug,
--   IF(wp.is_published = 1, 'published', 'draft')  AS status,
--   wp.sections,
--   JSON_OBJECT(
--     'is_home',   wp.is_home,
--     'seo_title', COALESCE(wp.seo_title, ''),
--     'seo_desc',  COALESCE(wp.seo_desc,  '')
--   )                                              AS meta,
--   wp.sort_order,
--   wp.created_at,
--   wp.updated_at
-- FROM ms_website_pages wp
-- JOIN ms_websites w ON w.id = wp.website_id;

-- ─────────────────────────────────────────────────────────────────────────────
-- After verifying data is correct, optionally drop old table:
--   DROP TABLE ms_website_pages;
-- (Don't run yet — verify controllers work first)
-- ─────────────────────────────────────────────────────────────────────────────
