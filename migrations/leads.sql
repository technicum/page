-- Lead CRM
CREATE TABLE IF NOT EXISTS ms_leads (
  id          SERIAL PRIMARY KEY,
  site_id     INTEGER NOT NULL REFERENCES ms_sites(id) ON DELETE CASCADE,
  name        VARCHAR(255),
  email       VARCHAR(255),
  phone       VARCHAR(255),
  source      VARCHAR(50)  NOT NULL DEFAULT 'manual',  -- manual | form | booking | chat
  source_id   INTEGER,                                  -- foreign id in source table
  stage       VARCHAR(50)  NOT NULL DEFAULT 'new',      -- new | contacted | qualified | won | lost
  tags        TEXT         NOT NULL DEFAULT '',          -- comma-separated
  notes       TEXT         NOT NULL DEFAULT '',
  created_at  TIMESTAMP    NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ms_leads_site    ON ms_leads(site_id);
CREATE INDEX IF NOT EXISTS idx_ms_leads_stage   ON ms_leads(stage);
CREATE INDEX IF NOT EXISTS idx_ms_leads_source  ON ms_leads(source, source_id);
