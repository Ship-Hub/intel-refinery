-- Intel Refinery — Graph-First Schema Redesign
-- Replaces fixed knowledge tables with a universal artifact graph
-- Run against intel_refinery database (destructive — 0 users)

-- ========================================
-- PHASE 1: DROP OLD KNOWLEDGE TABLES
-- ========================================

SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS report_sections;
DROP TABLE IF EXISTS reports;
DROP TABLE IF EXISTS insights;
DROP TABLE IF EXISTS questions;
DROP TABLE IF EXISTS gaps;
DROP TABLE IF EXISTS contradictions;
DROP TABLE IF EXISTS patterns;
DROP TABLE IF EXISTS subtopics;
DROP TABLE IF EXISTS themes;
DROP TABLE IF EXISTS relationships;
DROP TABLE IF EXISTS entities;
DROP TABLE IF EXISTS observations;
DROP TABLE IF EXISTS extractions;
DROP TABLE IF EXISTS model_runs;
DROP TABLE IF EXISTS refinery_models;

-- ========================================
-- PHASE 2: RECREATE CHANGED EXISTING TABLES
-- ========================================

DROP TABLE IF EXISTS source_chunks;

CREATE TABLE source_chunks (
  id CHAR(36) PRIMARY KEY,
  source_id CHAR(36) NOT NULL,
  project_id CHAR(36) NOT NULL,
  chunk_index INT NOT NULL,
  content TEXT NOT NULL,
  token_count INT DEFAULT 0,
  metadata JSON,
  embedding JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_chunks_source (source_id),
  INDEX idx_chunks_project (project_id),
  FOREIGN KEY (source_id) REFERENCES sources(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

DROP TABLE IF EXISTS sources;

CREATE TABLE sources (
  id CHAR(36) PRIMARY KEY,
  project_id CHAR(36) NOT NULL,
  source_type VARCHAR(50) NOT NULL,
  original_name VARCHAR(500),
  title VARCHAR(500),
  uri VARCHAR(1000),
  raw_text LONGTEXT,
  extracted_text LONGTEXT,
  metadata JSON,
  content_hash VARCHAR(128),
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_sources_project (project_id),
  INDEX idx_sources_status (status),
  INDEX idx_sources_hash (content_hash),
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

DROP TABLE IF EXISTS projects;

CREATE TABLE projects (
  id CHAR(36) PRIMARY KEY,
  workspace_id CHAR(36),
  account_id CHAR(36) NOT NULL,
  title VARCHAR(500) NOT NULL,
  description TEXT,
  guidance_prompt TEXT,
  mode VARCHAR(20) DEFAULT 'quick',
  status VARCHAR(20) DEFAULT 'draft',
  source_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_projects_account (account_id),
  INDEX idx_projects_workspace (workspace_id),
  INDEX idx_projects_status (status),
  INDEX idx_projects_mode (mode)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ========================================
-- PHASE 3: ALTER AI AUDIT TABLES
-- ========================================

ALTER TABLE ai_tasks
  ADD COLUMN task_stage VARCHAR(50) AFTER task_type;

ALTER TABLE ai_executions
  ADD COLUMN input_hash VARCHAR(64) AFTER prompt_version_id,
  ADD COLUMN validation_status VARCHAR(50) DEFAULT 'pending' AFTER status,
  ADD COLUMN estimated_cost DECIMAL(10,6) AFTER token_usage;

-- ========================================
-- PHASE 4: CREATE NEW CORE TABLES
-- ========================================

-- REFINERY RUNS — one complete execution of the refinement engine
CREATE TABLE refinery_runs (
  id CHAR(36) PRIMARY KEY,
  project_id CHAR(36) NOT NULL,
  trigger VARCHAR(50) NOT NULL,
  status VARCHAR(20) DEFAULT 'running',
  stages_completed JSON,
  stages_failed JSON,
  models_used JSON,
  total_estimated_cost DECIMAL(12,6),
  duration_ms INT,
  error_message TEXT,
  started_at DATETIME,
  completed_at DATETIME,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_runs_project (project_id),
  INDEX idx_runs_status (status),
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- REFINERY MODEL VERSIONS — frozen snapshot per run
CREATE TABLE refinery_model_versions (
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

-- ARTIFACTS — the universal knowledge node
CREATE TABLE artifacts (
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

-- ARTIFACT EVIDENCE — traceability from artifacts to source material
CREATE TABLE artifact_evidence (
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

-- ARTIFACT CONNECTIONS — generic edges between any two artifacts
CREATE TABLE artifact_connections (
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

-- CONNECTION EVIDENCE — explainability for relationships
CREATE TABLE connection_evidence (
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

-- VIEWS — generated representations of the Refinery Model
CREATE TABLE views (
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

-- ========================================
-- PHASE 5: CONVENIENCE SQL VIEWS
-- ========================================

-- These are query helpers, not core schema.
-- They provide ergonomic access to commonly filtered subsets.

CREATE VIEW hypotheses AS
  SELECT a.* FROM artifacts a
  WHERE a.artifact_type = 'hypothesis';

CREATE VIEW questions AS
  SELECT a.* FROM artifacts a
  WHERE a.artifact_type = 'question';

CREATE VIEW people AS
  SELECT a.* FROM artifacts a
  WHERE a.artifact_type = 'person';

CREATE VIEW events AS
  SELECT a.* FROM artifacts a
  WHERE a.artifact_type = 'event';

CREATE VIEW gaps AS
  SELECT a.* FROM artifacts a
  WHERE a.artifact_type = 'knowledge_gap';

CREATE VIEW insights AS
  SELECT a.* FROM artifacts a
  WHERE a.artifact_type = 'insight';

CREATE VIEW patterns AS
  SELECT a.* FROM artifacts a
  WHERE a.artifact_type = 'pattern';

SET FOREIGN_KEY_CHECKS = 1;

-- ========================================
-- PHASE 6: SEED DATA
-- ========================================

-- Update prompt versions for new pipeline stages
INSERT INTO prompt_versions (id, task_type, version, prompt_text, description, is_active) VALUES
  (UUID(), 'observe', 1, '[Active: observe_prompt_v1]', 'Observes source chunks and creates artifacts with evidence.', TRUE),
  (UUID(), 'connect', 1, '[Active: connect_prompt_v1]', 'Discovers connections between artifacts.', TRUE),
  (UUID(), 'understand', 1, '[Active: understand_prompt_v1]', 'Refines artifacts, creates hypotheses, deepens understanding.', TRUE),
  (UUID(), 'reflect', 1, '[Active: reflect_prompt_v1]', 'Challenges the model, identifies gaps, weaknesses, and alternatives.', TRUE),
  (UUID(), 'generate_view', 1, '[Active: generate_view_prompt_v1]', 'Generates a view (report, timeline, etc.) from the Refinery Model.', TRUE)
ON DUPLICATE KEY UPDATE prompt_text = VALUES(prompt_text), is_active = TRUE;
