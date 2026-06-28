-- Repair auth tables for production databases created before commercial auth landed.
-- This file is intentionally in api/database (not api/database/migrations) so the
-- existing production deploy runner applies it to established Refinery databases.

CREATE TABLE IF NOT EXISTS user_sessions (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  session_token_hash VARCHAR(255) NOT NULL,
  expires_at DATETIME NOT NULL,
  revoked_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_used_at DATETIME NULL,
  UNIQUE KEY uniq_user_sessions_token_hash (session_token_hash),
  INDEX idx_user_sessions_user_expiry (user_id, expires_at),
  CONSTRAINT fk_user_sessions_user
    FOREIGN KEY (user_id) REFERENCES users(id)
);

ALTER TABLE auth_identities
  MODIFY COLUMN provider ENUM('google', 'github', 'gitlab', 'telegram') NOT NULL;

DROP PROCEDURE IF EXISTS add_login_otp_metadata_if_missing;

DELIMITER //

CREATE PROCEDURE add_login_otp_metadata_if_missing()
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'login_otps'
      AND COLUMN_NAME = 'metadata'
  ) THEN
    ALTER TABLE login_otps
      ADD COLUMN metadata JSON NULL AFTER used_at;
  END IF;
END//

DELIMITER ;

CALL add_login_otp_metadata_if_missing();

DROP PROCEDURE add_login_otp_metadata_if_missing;
