CREATE TABLE IF NOT EXISTS admin_audit_logs (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  actor_type ENUM('platform_token', 'user') NOT NULL,
  actor_user_id BIGINT NULL,
  action VARCHAR(100) NOT NULL,
  target_type VARCHAR(100) NOT NULL,
  target_id VARCHAR(255) NULL,
  metadata JSON NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_admin_audit_logs_created (created_at),
  INDEX idx_admin_audit_logs_target (target_type, target_id),
  CONSTRAINT fk_admin_audit_logs_actor
    FOREIGN KEY (actor_user_id) REFERENCES users(id)
);
