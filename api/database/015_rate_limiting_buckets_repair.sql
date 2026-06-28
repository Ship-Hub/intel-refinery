-- Repair production databases that predate the commercial v1 rate limiter table.
-- This lives in api/database so the existing deploy runner applies it to
-- established Refinery databases that intentionally skip older schema files.

CREATE TABLE IF NOT EXISTS rate_limiting_buckets (
  id CHAR(36) PRIMARY KEY,
  bucket_key VARCHAR(255) NOT NULL,
  window_start DATETIME NOT NULL,
  window_ms INT NOT NULL,
  count INT DEFAULT 0,
  max INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE INDEX idx_rate_bucket_key_window (bucket_key, window_start),
  INDEX idx_rate_bucket_expiry (window_start)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
