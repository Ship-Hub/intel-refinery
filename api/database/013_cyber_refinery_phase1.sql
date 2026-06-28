-- Cyber Refinery Phase 1 foundation.
-- Additive migration only; do not drop or rewrite existing refinery data.

CREATE TABLE IF NOT EXISTS refinery_profiles (
  id CHAR(36) PRIMARY KEY,
  profile_key VARCHAR(80) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  description TEXT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'active',
  protocol_bundle_key VARCHAR(120) NULL,
  parser_bundle_key VARCHAR(120) NULL,
  view_bundle_key VARCHAR(120) NULL,
  validation_bundle_key VARCHAR(120) NULL,
  configuration_json JSON NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

INSERT INTO refinery_profiles (
  id,
  profile_key,
  name,
  description,
  status,
  protocol_bundle_key,
  parser_bundle_key,
  view_bundle_key,
  validation_bundle_key,
  configuration_json
)
VALUES
  (
    '11111111-1111-4111-8111-111111111111',
    'general',
    'General Refinery',
    'Default Intel Refinery profile for mixed research and knowledge refinement projects.',
    'active',
    'general.v1',
    'general.v1',
    'general.v1',
    'general.v1',
    JSON_OBJECT('defaultIntent', 'general_research')
  ),
  (
    '22222222-2222-4222-8222-222222222222',
    'cyber',
    'Cyber Refinery',
    'Specialized profile for cybersecurity reports, platform exports, advisories, logs, policies, assets, vulnerabilities, threats, incidents, controls, and analyst notes.',
    'active',
    'cyber.v1',
    'cyber.v1',
    'cyber.v1',
    'cyber.v1',
    JSON_OBJECT(
      'defaultIntent', 'cyber_assessment',
      'disallowedCapabilities', JSON_ARRAY('scanning', 'exploitation', 'blocking', 'device_access', 'automated_remediation')
    )
  )
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  description = VALUES(description),
  status = VALUES(status),
  protocol_bundle_key = VALUES(protocol_bundle_key),
  parser_bundle_key = VALUES(parser_bundle_key),
  view_bundle_key = VALUES(view_bundle_key),
  validation_bundle_key = VALUES(validation_bundle_key),
  configuration_json = VALUES(configuration_json);

SET @sql = IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'projects' AND COLUMN_NAME = 'refinery_profile_id') = 0,
  'ALTER TABLE projects ADD COLUMN refinery_profile_id CHAR(36) NULL AFTER account_id',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'projects' AND COLUMN_NAME = 'intent') = 0,
  'ALTER TABLE projects ADD COLUMN intent VARCHAR(100) NULL AFTER refinery_profile_id',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

UPDATE projects
SET refinery_profile_id = '11111111-1111-4111-8111-111111111111'
WHERE refinery_profile_id IS NULL;

SET @sql = IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'sources' AND COLUMN_NAME = 'source_category') = 0,
  'ALTER TABLE sources ADD COLUMN source_category VARCHAR(100) NULL AFTER source_type',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'sources' AND COLUMN_NAME = 'inclusion_state') = 0,
  'ALTER TABLE sources ADD COLUMN inclusion_state VARCHAR(30) NOT NULL DEFAULT ''included'' AFTER status',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'sources' AND COLUMN_NAME = 'source_notes') = 0,
  'ALTER TABLE sources ADD COLUMN source_notes TEXT NULL AFTER metadata',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'sources' AND COLUMN_NAME = 'display_name') = 0,
  'ALTER TABLE sources ADD COLUMN display_name VARCHAR(500) NULL AFTER title',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'sources' AND COLUMN_NAME = 'source_package_id') = 0,
  'ALTER TABLE sources ADD COLUMN source_package_id CHAR(36) NULL AFTER project_id',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'sources' AND COLUMN_NAME = 'duplicate_of_source_id') = 0,
  'ALTER TABLE sources ADD COLUMN duplicate_of_source_id CHAR(36) NULL AFTER source_package_id',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'sources' AND COLUMN_NAME = 'replaced_by_source_id') = 0,
  'ALTER TABLE sources ADD COLUMN replaced_by_source_id CHAR(36) NULL AFTER duplicate_of_source_id',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'sources' AND COLUMN_NAME = 'last_refined_at') = 0,
  'ALTER TABLE sources ADD COLUMN last_refined_at DATETIME NULL AFTER updated_at',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

CREATE TABLE IF NOT EXISTS source_packages (
  id CHAR(36) PRIMARY KEY,
  project_id VARCHAR(64) NOT NULL,
  name VARCHAR(255) NOT NULL,
  package_type VARCHAR(100) NULL,
  description TEXT NULL,
  source_system VARCHAR(255) NULL,
  metadata JSON NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_source_packages_project (project_id)
);
