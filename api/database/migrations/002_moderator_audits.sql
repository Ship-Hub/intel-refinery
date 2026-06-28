CREATE TABLE IF NOT EXISTS moderator_monitors (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  platform VARCHAR(100) NOT NULL,
  external_conversation_id VARCHAR(255) NOT NULL,
  owner_external_user_id VARCHAR(255) NOT NULL,
  owner_username VARCHAR(255) NULL,
  report_frequency VARCHAR(32) NOT NULL,
  admin_snapshot JSON NOT NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  last_report_at DATETIME NULL,
  next_report_at DATETIME NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_monitor_platform_conversation (platform, external_conversation_id)
);
