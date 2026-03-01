-- DealFlow Lite local-first schema
-- Target: SQLite 3

PRAGMA foreign_keys = ON;

-- Profiles (single local user for local mode)
CREATE TABLE IF NOT EXISTS profiles (
  id TEXT PRIMARY KEY,
  display_name TEXT,
  locale TEXT NOT NULL DEFAULT 'ja-JP',
  timezone TEXT NOT NULL DEFAULT 'Asia/Tokyo',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS companies (
  id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL,
  name TEXT NOT NULL,
  industry TEXT,
  notes TEXT,
  search_text TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (owner_id) REFERENCES profiles(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS contacts (
  id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL,
  company_id TEXT,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  tags_json TEXT NOT NULL DEFAULT '[]',
  lifecycle_stage TEXT,
  project TEXT,
  notes TEXT,
  search_text TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (owner_id) REFERENCES profiles(id) ON DELETE CASCADE,
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS deals (
  id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL,
  contact_id TEXT NOT NULL,
  title TEXT NOT NULL,
  stage TEXT NOT NULL DEFAULT 'lead'
    CHECK (stage IN ('lead', 'qualified', 'proposal', 'negotiation')),
  amount NUMERIC NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'JPY',
  expected_close_date TEXT,
  status TEXT NOT NULL DEFAULT 'open'
    CHECK (status IN ('open', 'won', 'lost')),
  project TEXT,
  notes TEXT,
  search_text TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (owner_id) REFERENCES profiles(id) ON DELETE CASCADE,
  FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL,
  contact_id TEXT,
  deal_id TEXT,
  type TEXT NOT NULL CHECK (type IN ('daily_todo', 'customer_engagement', 'project_task')),
  title TEXT NOT NULL,
  due_date TEXT,
  status TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'done')),
  reminder_state TEXT NOT NULL DEFAULT 'none' CHECK (reminder_state IN ('none', 'due_today', 'overdue')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (owner_id) REFERENCES profiles(id) ON DELETE CASCADE,
  FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE SET NULL,
  FOREIGN KEY (deal_id) REFERENCES deals(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS activities (
  id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL,
  contact_id TEXT NOT NULL,
  deal_id TEXT,
  type TEXT NOT NULL CHECK (type IN ('note', 'email', 'meeting')),
  content TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (owner_id) REFERENCES profiles(id) ON DELETE CASCADE,
  FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE,
  FOREIGN KEY (deal_id) REFERENCES deals(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS email_templates (
  id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  is_system INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (owner_id) REFERENCES profiles(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS email_logs (
  id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL,
  contact_id TEXT NOT NULL,
  template_id TEXT,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  sent_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (owner_id) REFERENCES profiles(id) ON DELETE CASCADE,
  FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE,
  FOREIGN KEY (template_id) REFERENCES email_templates(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS analytics_events (
  id TEXT PRIMARY KEY,
  owner_id TEXT,
  event_name TEXT NOT NULL,
  entity_type TEXT,
  entity_id TEXT,
  metadata_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (owner_id) REFERENCES profiles(id) ON DELETE SET NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_companies_owner ON companies(owner_id);
CREATE INDEX IF NOT EXISTS idx_contacts_owner ON contacts(owner_id);
CREATE INDEX IF NOT EXISTS idx_contacts_company ON contacts(company_id);
CREATE INDEX IF NOT EXISTS idx_deals_owner ON deals(owner_id);
CREATE INDEX IF NOT EXISTS idx_deals_stage ON deals(owner_id, stage);
CREATE INDEX IF NOT EXISTS idx_deals_status ON deals(owner_id, status);
CREATE INDEX IF NOT EXISTS idx_tasks_owner ON tasks(owner_id);
CREATE INDEX IF NOT EXISTS idx_tasks_due ON tasks(owner_id, due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(owner_id, status);
CREATE INDEX IF NOT EXISTS idx_activities_owner_contact_time ON activities(owner_id, contact_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_logs_owner_time ON email_logs(owner_id, sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_events_owner_time ON analytics_events(owner_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_contacts_search_text ON contacts(search_text);
CREATE INDEX IF NOT EXISTS idx_companies_search_text ON companies(search_text);
CREATE INDEX IF NOT EXISTS idx_deals_search_text ON deals(search_text);

-- Updated-at triggers
CREATE TRIGGER IF NOT EXISTS trg_profiles_updated_at
AFTER UPDATE ON profiles
FOR EACH ROW
WHEN NEW.updated_at = OLD.updated_at
BEGIN
  UPDATE profiles SET updated_at = datetime('now') WHERE id = OLD.id;
END;

CREATE TRIGGER IF NOT EXISTS trg_companies_updated_at
AFTER UPDATE ON companies
FOR EACH ROW
WHEN NEW.updated_at = OLD.updated_at
BEGIN
  UPDATE companies SET updated_at = datetime('now') WHERE id = OLD.id;
END;

CREATE TRIGGER IF NOT EXISTS trg_contacts_updated_at
AFTER UPDATE ON contacts
FOR EACH ROW
WHEN NEW.updated_at = OLD.updated_at
BEGIN
  UPDATE contacts SET updated_at = datetime('now') WHERE id = OLD.id;
END;

CREATE TRIGGER IF NOT EXISTS trg_deals_updated_at
AFTER UPDATE ON deals
FOR EACH ROW
WHEN NEW.updated_at = OLD.updated_at
BEGIN
  UPDATE deals SET updated_at = datetime('now') WHERE id = OLD.id;
END;

CREATE TRIGGER IF NOT EXISTS trg_tasks_updated_at
AFTER UPDATE ON tasks
FOR EACH ROW
WHEN NEW.updated_at = OLD.updated_at
BEGIN
  UPDATE tasks SET updated_at = datetime('now') WHERE id = OLD.id;
END;

CREATE TRIGGER IF NOT EXISTS trg_email_templates_updated_at
AFTER UPDATE ON email_templates
FOR EACH ROW
WHEN NEW.updated_at = OLD.updated_at
BEGIN
  UPDATE email_templates SET updated_at = datetime('now') WHERE id = OLD.id;
END;

-- Dashboard views
CREATE VIEW IF NOT EXISTS v_dashboard_today_tasks AS
SELECT
  owner_id,
  COUNT(*) AS today_task_count
FROM tasks
WHERE due_date = date('now', 'localtime')
  AND status <> 'done'
GROUP BY owner_id;

CREATE VIEW IF NOT EXISTS v_dashboard_pipeline_total AS
SELECT
  owner_id,
  COALESCE(SUM(amount), 0) AS pipeline_total_jpy
FROM deals
WHERE status = 'open'
GROUP BY owner_id;

CREATE VIEW IF NOT EXISTS v_dashboard_recent_touch AS
SELECT
  owner_id,
  contact_id,
  MAX(created_at) AS last_activity_at
FROM activities
GROUP BY owner_id, contact_id;
