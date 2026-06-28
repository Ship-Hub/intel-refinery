-- Intel Refinery — Core Schema Migration
-- Replaces dispute-specific tables with neutral refinery model

-- ========================================
-- WORKSPACES & PROJECTS
-- ========================================

CREATE TABLE IF NOT EXISTS workspaces (
  id CHAR(36) PRIMARY KEY,
  account_id CHAR(36) NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_workspaces_account (account_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS projects (
  id CHAR(36) PRIMARY KEY,
  workspace_id CHAR(36),
  account_id CHAR(36) NOT NULL,
  title VARCHAR(500) NOT NULL,
  description TEXT,
  status ENUM('draft', 'processing', 'completed', 'failed', 'archived') DEFAULT 'draft',
  processing_status ENUM('idle', 'ingesting', 'normalizing', 'extracting', 'connecting', 'structuring', 'reporting', 'completed', 'failed') DEFAULT 'idle',
  source_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_projects_account (account_id),
  INDEX idx_projects_workspace (workspace_id),
  INDEX idx_projects_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ========================================
-- SOURCES & CHUNKS
-- ========================================

CREATE TABLE IF NOT EXISTS sources (
  id CHAR(36) PRIMARY KEY,
  project_id CHAR(36) NOT NULL,
  source_type ENUM('pdf', 'image', 'text', 'url', 'audio', 'video', 'raw_text', 'other') NOT NULL,
  source_category ENUM('document', 'image', 'text', 'web', 'audio', 'video', 'other') NOT NULL,
  file_name VARCHAR(500),
  file_path VARCHAR(1000),
  file_size BIGINT,
  mime_type VARCHAR(255),
  url TEXT,
  title VARCHAR(500),
  extracted_text LONGTEXT,
  extracted_text_length INT DEFAULT 0,
  metadata JSON,
  file_hash VARCHAR(128),
  ingestion_status ENUM('pending', 'ingesting', 'normalized', 'cleaned', 'chunked', 'failed') DEFAULT 'pending',
  ingestion_error TEXT,
  retry_count INT DEFAULT 0,
  next_retry_at DATETIME,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_sources_project (project_id),
  INDEX idx_sources_status (ingestion_status),
  INDEX idx_sources_hash (file_hash),
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS source_chunks (
  id CHAR(36) PRIMARY KEY,
  source_id CHAR(36) NOT NULL,
  project_id CHAR(36) NOT NULL,
  chunk_index INT NOT NULL,
  text TEXT NOT NULL,
  char_count INT DEFAULT 0,
  embedding_json JSON,
  keywords JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_chunks_source (source_id),
  INDEX idx_chunks_project (project_id),
  FOREIGN KEY (source_id) REFERENCES sources(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ========================================
-- EXTRACTIONS & OBSERVATIONS
-- ========================================

CREATE TABLE IF NOT EXISTS extractions (
  id CHAR(36) PRIMARY KEY,
  project_id CHAR(36) NOT NULL,
  source_id CHAR(36),
  chunk_id CHAR(36),
  extraction_type ENUM('observation', 'entity', 'event', 'number', 'definition', 'quote', 'signal') NOT NULL,
  content JSON NOT NULL,
  confidence DECIMAL(3,2) DEFAULT 1.00,
  ai_task_id CHAR(36),
  model_version_id CHAR(36),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_extractions_project (project_id),
  INDEX idx_extractions_type (extraction_type),
  FOREIGN KEY (source_id) REFERENCES sources(id) ON DELETE SET NULL,
  FOREIGN KEY (chunk_id) REFERENCES source_chunks(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS observations (
  id CHAR(36) PRIMARY KEY,
  project_id CHAR(36) NOT NULL,
  observation_type ENUM('fact', 'claim', 'event', 'number', 'definition', 'quote', 'signal', 'question') NOT NULL,
  content TEXT NOT NULL,
  source_refs JSON,
  entity_refs JSON,
  confidence DECIMAL(3,2) DEFAULT 1.00,
  keywords JSON,
  related_observation_ids JSON,
  ai_execution_id CHAR(36),
  model_version_id CHAR(36),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_observations_project (project_id),
  INDEX idx_observations_type (observation_type),
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ========================================
-- ENTITIES & RELATIONSHIPS
-- ========================================

CREATE TABLE IF NOT EXISTS entities (
  id CHAR(36) PRIMARY KEY,
  project_id CHAR(36) NOT NULL,
  name VARCHAR(500) NOT NULL,
  entity_type ENUM('person', 'organization', 'product', 'location', 'event', 'document', 'concept', 'other') DEFAULT 'other',
  aliases JSON,
  attributes JSON,
  mention_count INT DEFAULT 1,
  source_refs JSON,
  confidence DECIMAL(3,2) DEFAULT 1.00,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS relationships (
  id CHAR(36) PRIMARY KEY,
  project_id CHAR(36) NOT NULL,
  from_id CHAR(36) NOT NULL,
  from_type ENUM('observation', 'entity', 'theme') NOT NULL,
  to_id CHAR(36) NOT NULL,
  to_type ENUM('observation', 'entity', 'theme') NOT NULL,
  relationship_type ENUM('supports', 'contradicts', 'causes', 'follows', 'expands', 'explains', 'is_example_of', 'references', 'same_as') NOT NULL,
  description TEXT,
  confidence DECIMAL(3,2) DEFAULT 1.00,
  evidence TEXT,
  source_refs JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_relationships_project (project_id),
  INDEX idx_relationships_from (from_id),
  INDEX idx_relationships_to (to_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ========================================
-- THEMES & SUBTOPICS
-- ========================================

CREATE TABLE IF NOT EXISTS themes (
  id CHAR(36) PRIMARY KEY,
  project_id CHAR(36) NOT NULL,
  name VARCHAR(500) NOT NULL,
  description TEXT,
  relevance ENUM('primary', 'secondary', 'contextual') DEFAULT 'secondary',
  confidence DECIMAL(3,2) DEFAULT 1.00,
  observation_refs JSON,
  entity_refs JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS subtopics (
  id CHAR(36) PRIMARY KEY,
  project_id CHAR(36) NOT NULL,
  theme_id CHAR(36) NOT NULL,
  name VARCHAR(500) NOT NULL,
  description TEXT,
  observation_refs JSON,
  source_refs JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (theme_id) REFERENCES themes(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ========================================
-- PATTERNS, CONTRADICTIONS, GAPS
-- ========================================

CREATE TABLE IF NOT EXISTS patterns (
  id CHAR(36) PRIMARY KEY,
  project_id CHAR(36) NOT NULL,
  name VARCHAR(500) NOT NULL,
  description TEXT,
  observation_refs JSON,
  confidence DECIMAL(3,2) DEFAULT 1.00,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS contradictions (
  id CHAR(36) PRIMARY KEY,
  project_id CHAR(36) NOT NULL,
  description TEXT NOT NULL,
  observation_id_a CHAR(36),
  observation_id_b CHAR(36),
  severity ENUM('direct_conflict', 'tension', 'inconsistency', 'reconcilable') DEFAULT 'tension',
  resolution_possible BOOLEAN DEFAULT FALSE,
  resolution_hint TEXT,
  confidence DECIMAL(3,2) DEFAULT 1.00,
  source_refs JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS gaps (
  id CHAR(36) PRIMARY KEY,
  project_id CHAR(36) NOT NULL,
  description TEXT NOT NULL,
  category ENUM('missing_context', 'missing_evidence', 'missing_timeline', 'missing_entity', 'missing_reasoning') NOT NULL,
  importance ENUM('critical', 'high', 'medium', 'low') DEFAULT 'medium',
  suggested_info TEXT,
  source_refs JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ========================================
-- QUESTIONS & INSIGHTS
-- ========================================

CREATE TABLE IF NOT EXISTS questions (
  id CHAR(36) PRIMARY KEY,
  project_id CHAR(36) NOT NULL,
  question TEXT NOT NULL,
  category ENUM('clarification', 'investigation', 'implication', 'challenge', 'exploration') DEFAULT 'clarification',
  priority INT DEFAULT 2,
  revelation_potential TEXT,
  observation_refs JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS insights (
  id CHAR(36) PRIMARY KEY,
  project_id CHAR(36) NOT NULL,
  insight TEXT NOT NULL,
  basis TEXT,
  confidence DECIMAL(3,2) DEFAULT 1.00,
  observation_refs JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ========================================
-- REFINERY MODEL & REPORTS
-- ========================================

CREATE TABLE IF NOT EXISTS refinery_models (
  id CHAR(36) PRIMARY KEY,
  project_id CHAR(36) NOT NULL,
  version INT NOT NULL DEFAULT 1,
  model_data JSON NOT NULL,
  source_hash VARCHAR(128),
  generated_by ENUM('ai', 'manual', 'hybrid') DEFAULT 'ai',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_models_project (project_id),
  INDEX idx_models_version (project_id, version),
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS reports (
  id CHAR(36) PRIMARY KEY,
  project_id CHAR(36) NOT NULL,
  refinery_model_id CHAR(36),
  title VARCHAR(500),
  report_data JSON NOT NULL,
  report_type ENUM('full', 'summary', 'thematic', 'chronological', 'custom') DEFAULT 'full',
  status ENUM('draft', 'complete', 'reviewed', 'archived') DEFAULT 'draft',
  quality_score DECIMAL(3,2),
  quality_review_data JSON,
  export_format ENUM('json', 'markdown', 'pdf', 'html') DEFAULT 'json',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_reports_project (project_id),
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (refinery_model_id) REFERENCES refinery_models(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS report_sections (
  id CHAR(36) PRIMARY KEY,
  report_id CHAR(36) NOT NULL,
  section_id VARCHAR(100),
  title VARCHAR(500) NOT NULL,
  content LONGTEXT,
  visibility ENUM('full', 'summary', 'optional') DEFAULT 'full',
  sort_order INT DEFAULT 0,
  source_refs JSON,
  metadata JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (report_id) REFERENCES reports(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ========================================
-- AI OPERATIONAL TABLES (Task, Execution, Model Run, Prompt Version)
-- ========================================

CREATE TABLE IF NOT EXISTS ai_tasks (
  id CHAR(36) PRIMARY KEY,
  project_id CHAR(36),
  task_type VARCHAR(100) NOT NULL,
  status ENUM('queued', 'running', 'completed', 'failed') DEFAULT 'queued',
  input_data JSON,
  output_data JSON,
  error_message TEXT,
  retry_count INT DEFAULT 0,
  max_retries INT DEFAULT 2,
  started_at DATETIME,
  completed_at DATETIME,
  duration_ms INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_aitasks_project (project_id),
  INDEX idx_aitasks_type_status (task_type, status),
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS ai_executions (
  id CHAR(36) PRIMARY KEY,
  ai_task_id CHAR(36) NOT NULL,
  attempt_number INT DEFAULT 1,
  provider VARCHAR(50) NOT NULL,
  model VARCHAR(200) NOT NULL,
  status ENUM('attempting', 'completed', 'failed') DEFAULT 'attempting',
  prompt_text TEXT,
  prompt_version_id CHAR(36),
  response_text TEXT,
  error_message TEXT,
  token_usage JSON,
  cost_estimate DECIMAL(10,6),
  latency_ms INT,
  temperature DECIMAL(3,2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_aiexecutions_task (ai_task_id),
  INDEX idx_aiexecutions_provider_model (provider, model),
  FOREIGN KEY (ai_task_id) REFERENCES ai_tasks(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS model_runs (
  id CHAR(36) PRIMARY KEY,
  project_id CHAR(36),
  refinery_model_id CHAR(36),
  run_type ENUM('full', 'incremental', 'reprocess') NOT NULL,
  `trigger` ENUM('manual', 'new_source', 'model_config_change', 'scheduled') NOT NULL,
  status ENUM('running', 'completed', 'failed') DEFAULT 'running',
  nodes_completed JSON,
  nodes_failed JSON,
  started_at DATETIME,
  completed_at DATETIME,
  duration_ms INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL,
  FOREIGN KEY (refinery_model_id) REFERENCES refinery_models(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS prompt_versions (
  id CHAR(36) PRIMARY KEY,
  task_type VARCHAR(100) NOT NULL,
  version INT NOT NULL,
  prompt_text TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_promptversions_task (task_type),
  UNIQUE KEY uk_task_version (task_type, version)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ========================================
-- SEED DATA
-- ========================================

-- Seed initial prompt versions
INSERT INTO prompt_versions (id, task_type, version, prompt_text, description, is_active) VALUES
  (UUID(), 'extract_observations', 1, '[Active: extraction_prompt_v1]', 'Initial extraction prompt — extracts observations, entities, events, numbers, definitions, quotes from source chunks.', TRUE),
  (UUID(), 'detect_relationships', 1, '[Active: relationship_prompt_v1]', 'Initial relationship detection prompt — identifies supports, contradicts, causes, follows, expands relationships.', TRUE),
  (UUID(), 'discover_structure', 1, '[Active: structure_prompt_v1]', 'Initial structure discovery prompt — discovers natural themes, subtopics, and organization without fixed templates.', TRUE),
  (UUID(), 'generate_report', 1, '[Active: report_prompt_v1]', 'Initial report generation prompt — composes readable reports from Refinery Model with dynamic sections.', TRUE),
  (UUID(), 'identify_contradictions', 1, '[Active: contradiction_prompt_v1]', 'Initial contradiction detection prompt — identifies direct conflicts, tensions, and inconsistencies.', TRUE),
  (UUID(), 'identify_gaps', 1, '[Active: gap_prompt_v1]', 'Initial gap identification prompt — finds missing context, evidence, timelines, entities, and reasoning.', TRUE),
  (UUID(), 'generate_questions', 1, '[Active: question_prompt_v1]', 'Initial question generation prompt — creates useful follow-up questions from the Refinery Model.', TRUE),
  (UUID(), 'extract_entities', 1, '[Active: entity_prompt_v1]', 'Initial entity extraction prompt — extracts people, organizations, products, locations, events, documents.', TRUE),
  (UUID(), 'quality_review', 1, '[Active: quality_review_prompt_v1]', 'Initial quality review prompt — validates reports against refinery model for accuracy and completeness.', TRUE);