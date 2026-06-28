CREATE TABLE IF NOT EXISTS retrieval_cache (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  query_hash CHAR(64) NOT NULL,
  normalized_query VARCHAR(1000) NOT NULL,
  provider VARCHAR(64) NOT NULL,
  results_json JSON NOT NULL,
  retrieved_at DATETIME NOT NULL,
  expires_at DATETIME NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_retrieval_query_hash (query_hash),
  KEY idx_retrieval_expires_at (expires_at)
);
