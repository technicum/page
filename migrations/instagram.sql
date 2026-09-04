-- Instagram Auto-DM: comment -> keyword-matched private reply
-- Run this in phpMyAdmin or MySQL CLI (also auto-runs on server start via config/db.js)

CREATE TABLE IF NOT EXISTS ms_instagram_accounts (
  id                 INT AUTO_INCREMENT PRIMARY KEY,
  account_id         INT NOT NULL COMMENT 'ms_accounts.id that owns this connection',
  site_id            INT NOT NULL COMMENT 'mini site this Instagram account is attached to',
  ig_user_id         VARCHAR(64) NOT NULL COMMENT 'Instagram Business Account ID',
  ig_username        VARCHAR(255) DEFAULT '',
  fb_page_id         VARCHAR(64) DEFAULT '',
  access_token       TEXT NOT NULL COMMENT 'long-lived Facebook Page access token',
  token_expires_at   DATETIME DEFAULT NULL,
  status             ENUM('active','error','revoked') DEFAULT 'active',
  last_error         VARCHAR(500) DEFAULT '',
  connected_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_ig_user (ig_user_id),
  INDEX idx_account (account_id),
  INDEX idx_site (site_id)
) CHARACTER SET utf8mb4;

CREATE TABLE IF NOT EXISTS ms_instagram_rules (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  ig_account_id   INT NOT NULL,
  site_id         INT NOT NULL,
  name            VARCHAR(255) NOT NULL DEFAULT 'Rule',
  keywords        VARCHAR(500) NOT NULL COMMENT 'comma-separated, matched case-insensitively as substrings',
  match_type      ENUM('any','all') DEFAULT 'any' COMMENT 'match ANY keyword or ALL keywords must be present',
  public_reply    VARCHAR(300) DEFAULT '' COMMENT 'optional public comment reply, e.g. Check your DMs!',
  dm_message      TEXT NOT NULL,
  is_active       TINYINT(1) DEFAULT 1,
  sort_order      INT DEFAULT 0,
  times_triggered INT DEFAULT 0,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_ig_account (ig_account_id),
  INDEX idx_site (site_id)
) CHARACTER SET utf8mb4;

CREATE TABLE IF NOT EXISTS ms_instagram_events (
  id                  INT AUTO_INCREMENT PRIMARY KEY,
  ig_account_id       INT NOT NULL,
  site_id             INT NOT NULL,
  rule_id             INT DEFAULT NULL,
  comment_id          VARCHAR(64) NOT NULL COMMENT 'Instagram comment ID -- dedupes webhook retries',
  media_id            VARCHAR(64) DEFAULT '',
  commenter_ig_id     VARCHAR(64) DEFAULT '',
  commenter_username  VARCHAR(255) DEFAULT '',
  comment_text        TEXT,
  dm_sent             TINYINT(1) DEFAULT 0,
  dm_message          TEXT,
  status              ENUM('sent','skipped_no_match','skipped_duplicate','skipped_rate_limit','error') DEFAULT 'skipped_no_match',
  error               VARCHAR(500) DEFAULT '',
  created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_comment (comment_id),
  INDEX idx_ig_account (ig_account_id),
  INDEX idx_site (site_id),
  INDEX idx_commenter (commenter_ig_id)
) CHARACTER SET utf8mb4;
