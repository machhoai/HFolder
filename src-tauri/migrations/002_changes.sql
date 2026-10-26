CREATE TABLE IF NOT EXISTS change_plans (
 id TEXT PRIMARY KEY,
 project_id TEXT NOT NULL REFERENCES projects(id),
 payload TEXT NOT NULL,
 status TEXT NOT NULL,
 progress INTEGER NOT NULL DEFAULT 0,
 inflight INTEGER,
 created_at INTEGER NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS one_running_change ON change_plans(project_id) WHERE status='running';
PRAGMA user_version = 2;
