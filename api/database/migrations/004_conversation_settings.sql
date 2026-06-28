CREATE TABLE IF NOT EXISTS conversation_settings (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  platform VARCHAR(100) NOT NULL,
  external_conversation_id VARCHAR(255) NOT NULL,
  conversational_level TINYINT NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_conversation_settings_platform_conversation (platform, external_conversation_id)
);
