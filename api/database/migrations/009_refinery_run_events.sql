CREATE TABLE IF NOT EXISTS refinery_run_events (
  id CHAR(36) PRIMARY KEY,
  run_id CHAR(36) NOT NULL,
  project_id CHAR(36) NOT NULL,
  event_type VARCHAR(50) NOT NULL,
  stage VARCHAR(80),
  message TEXT,
  payload JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_run_events_run (run_id, created_at),
  INDEX idx_run_events_project (project_id, created_at),
  FOREIGN KEY (run_id) REFERENCES refinery_runs(id) ON DELETE CASCADE,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
