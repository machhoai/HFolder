PRAGMA foreign_keys = ON;
CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  root TEXT NOT NULL UNIQUE,
  widths TEXT NOT NULL,
  types TEXT NOT NULL DEFAULT '[]',
  tags TEXT NOT NULL DEFAULT '[]'
);
CREATE TABLE IF NOT EXISTS entries (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id),
  relative_path TEXT NOT NULL,
  name TEXT NOT NULL,
  is_dir INTEGER NOT NULL,
  size INTEGER NOT NULL,
  modified INTEGER NOT NULL,
  code TEXT,
  code_key TEXT,
  confirmed INTEGER NOT NULL DEFAULT 0,
  kind TEXT NOT NULL DEFAULT '',
  tags TEXT NOT NULL DEFAULT '[]',
  UNIQUE(project_id,relative_path)
);
CREATE UNIQUE INDEX IF NOT EXISTS unique_project_code ON entries(project_id,code_key) WHERE code_key IS NOT NULL;
CREATE TABLE IF NOT EXISTS counters (
  project_id TEXT NOT NULL REFERENCES projects(id),
  parent_key TEXT NOT NULL,
  high_water INTEGER NOT NULL,
  PRIMARY KEY(project_id,parent_key)
);
CREATE TABLE IF NOT EXISTS operations (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  action TEXT NOT NULL,
  before_path TEXT NOT NULL,
  after_path TEXT NOT NULL,
  status TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
PRAGMA user_version = 1;
