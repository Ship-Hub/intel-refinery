-- Repair production databases that skipped the non-idempotent 011 refinery redesign.
-- This creates the model-surface tables used by the live refinement pipeline without
-- dropping or rewriting existing project/source data.

CREATE TABLE IF NOT EXISTS refinery_model_versions (
  id CHAR(36) PRIMARY KEY,
  project_id CHAR(36) NOT NULL,
  run_id CHAR(36),
  version_number INT NOT NULL DEFAULT 1,
  status VARCHAR(20) DEFAULT 'building',
  summary TEXT,
  model_data JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_rmv_project (project_id),
  INDEX idx_rmv_run (run_id),
  INDEX idx_rmv_version (project_id, version_number),
  INDEX idx_rmv_status (status),
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (run_id) REFERENCES refinery_runs(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS artifacts (
  id CHAR(36) PRIMARY KEY,
  project_id CHAR(36) NOT NULL,
  artifact_type VARCHAR(100),
  title VARCHAR(500) NOT NULL,
  summary TEXT,
  content JSON,
  confidence DECIMAL(4,3) DEFAULT 1.000,
  importance DECIMAL(4,3) DEFAULT 0.500,
  status VARCHAR(20) DEFAULT 'active',
  source_coverage_count INT DEFAULT 1,
  first_seen_source_id CHAR(36),
  created_by_task_id CHAR(36),
  model_version_id CHAR(36),
  metadata JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_artifacts_project (project_id),
  INDEX idx_artifacts_type (artifact_type),
  INDEX idx_artifacts_status (status),
  INDEX idx_artifacts_confidence (confidence),
  INDEX idx_artifacts_created (created_at),
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (first_seen_source_id) REFERENCES sources(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS artifact_evidence (
  id CHAR(36) PRIMARY KEY,
  project_id CHAR(36) NOT NULL,
  artifact_id CHAR(36) NOT NULL,
  source_id CHAR(36) NOT NULL,
  chunk_id CHAR(36),
  quote TEXT,
  evidence_type VARCHAR(30) DEFAULT 'supports',
  confidence DECIMAL(4,3) DEFAULT 1.000,
  metadata JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_ae_project (project_id),
  INDEX idx_ae_artifact (artifact_id),
  INDEX idx_ae_source (source_id),
  INDEX idx_ae_chunk (chunk_id),
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (artifact_id) REFERENCES artifacts(id) ON DELETE CASCADE,
  FOREIGN KEY (source_id) REFERENCES sources(id) ON DELETE CASCADE,
  FOREIGN KEY (chunk_id) REFERENCES source_chunks(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS artifact_connections (
  id CHAR(36) PRIMARY KEY,
  project_id CHAR(36) NOT NULL,
  from_artifact_id CHAR(36) NOT NULL,
  to_artifact_id CHAR(36) NOT NULL,
  connection_type VARCHAR(100) NOT NULL,
  label VARCHAR(500),
  explanation TEXT,
  confidence DECIMAL(4,3) DEFAULT 1.000,
  strength DECIMAL(4,3) DEFAULT 0.500,
  status VARCHAR(20) DEFAULT 'active',
  created_by_task_id CHAR(36),
  metadata JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_ac_project (project_id),
  INDEX idx_ac_from (from_artifact_id),
  INDEX idx_ac_to (to_artifact_id),
  INDEX idx_ac_type (connection_type),
  INDEX idx_ac_status (status),
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (from_artifact_id) REFERENCES artifacts(id) ON DELETE CASCADE,
  FOREIGN KEY (to_artifact_id) REFERENCES artifacts(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS connection_evidence (
  id CHAR(36) PRIMARY KEY,
  project_id CHAR(36) NOT NULL,
  connection_id CHAR(36) NOT NULL,
  source_id CHAR(36),
  chunk_id CHAR(36),
  artifact_id CHAR(36),
  quote TEXT,
  explanation TEXT,
  metadata JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_ce_project (project_id),
  INDEX idx_ce_connection (connection_id),
  INDEX idx_ce_source (source_id),
  INDEX idx_ce_artifact (artifact_id),
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (connection_id) REFERENCES artifact_connections(id) ON DELETE CASCADE,
  FOREIGN KEY (source_id) REFERENCES sources(id) ON DELETE SET NULL,
  FOREIGN KEY (chunk_id) REFERENCES source_chunks(id) ON DELETE SET NULL,
  FOREIGN KEY (artifact_id) REFERENCES artifacts(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS views (
  id CHAR(36) PRIMARY KEY,
  project_id CHAR(36) NOT NULL,
  model_version_id CHAR(36),
  view_type VARCHAR(100) NOT NULL,
  title VARCHAR(500),
  structure JSON,
  content JSON,
  status VARCHAR(20) DEFAULT 'pending',
  created_by_task_id CHAR(36),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_views_project (project_id),
  INDEX idx_views_model (model_version_id),
  INDEX idx_views_type (view_type),
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (model_version_id) REFERENCES refinery_model_versions(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
