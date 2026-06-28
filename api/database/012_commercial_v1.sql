-- Intel Refinery — Commercial Developer Platform v1
-- Extends the 010_commercial_backend tables with webhooks, idempotency,
-- API key scopes, rate limiting, request logging, and entitlements.
-- Run after 011_refinery_redesign.sql

-- ========================================
-- TABLE: webhook_endpoints
-- ========================================
CREATE TABLE IF NOT EXISTS webhook_endpoints (
  id CHAR(36) PRIMARY KEY,
  account_id CHAR(36) NOT NULL,
  workspace_id CHAR(36),
  name VARCHAR(255) NOT NULL,
  url VARCHAR(2048) NOT NULL,
  secret VARCHAR(255) NOT NULL,
  events JSON NOT NULL,
  is_active TINYINT(1) DEFAULT 1,
  max_retries INT DEFAULT 3,
  retry_interval_seconds INT DEFAULT 60,
  description TEXT,
  created_by CHAR(36),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_webhook_account (account_id),
  INDEX idx_webhook_workspace (workspace_id),
  FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ========================================
-- TABLE: webhook_deliveries
-- ========================================
CREATE TABLE IF NOT EXISTS webhook_deliveries (
  id CHAR(36) PRIMARY KEY,
  webhook_endpoint_id CHAR(36) NOT NULL,
  event VARCHAR(255) NOT NULL,
  payload JSON NOT NULL,
  status ENUM('pending','delivering','delivered','failed','permanently_failed') DEFAULT 'pending',
  attempt_count INT DEFAULT 0,
  max_retries INT DEFAULT 3,
  next_attempt_at DATETIME,
  delivered_at DATETIME,
  response_status_code INT,
  response_body TEXT,
  error_message TEXT,
  completed_at DATETIME,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_webhook_delivery_endpoint (webhook_endpoint_id),
  INDEX idx_webhook_delivery_status (status),
  INDEX idx_webhook_delivery_next (next_attempt_at),
  FOREIGN KEY (webhook_endpoint_id) REFERENCES webhook_endpoints(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ========================================
-- TABLE: idempotency_keys
-- ========================================
CREATE TABLE IF NOT EXISTS idempotency_keys (
  id CHAR(36) PRIMARY KEY,
  idempotency_key VARCHAR(255) NOT NULL,
  account_id CHAR(36),
  request_method VARCHAR(10) NOT NULL,
  request_path VARCHAR(500) NOT NULL,
  response_status_code INT NOT NULL,
  response_body JSON NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE INDEX idx_idempotency_key (idempotency_key),
  INDEX idx_idempotency_account (account_id),
  FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ========================================
-- TABLE: api_key_scopes
-- ========================================
CREATE TABLE IF NOT EXISTS api_key_scopes (
  id CHAR(36) PRIMARY KEY,
  api_key_id CHAR(36) NOT NULL,
  scope VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_apiscope_key (api_key_id),
  UNIQUE INDEX idx_apiscope_key_scope (api_key_id, scope),
  FOREIGN KEY (api_key_id) REFERENCES api_keys(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ========================================
-- TABLE: rate_limiting_buckets
-- ========================================
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

-- ========================================
-- TABLE: request_logs
-- ========================================
CREATE TABLE IF NOT EXISTS request_logs (
  id CHAR(36) PRIMARY KEY,
  account_id CHAR(36),
  api_key_id CHAR(36),
  method VARCHAR(10) NOT NULL,
  path VARCHAR(1000) NOT NULL,
  status_code INT,
  duration_ms INT,
  ip_address VARCHAR(45),
  user_agent VARCHAR(500),
  idempotency_key VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_request_logs_account (account_id),
  INDEX idx_request_logs_apikey (api_key_id),
  INDEX idx_request_logs_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ========================================
-- TABLE: entitlements
-- ========================================
CREATE TABLE IF NOT EXISTS entitlements (
  id CHAR(36) PRIMARY KEY,
  account_id CHAR(36) NOT NULL,
  feature VARCHAR(100) NOT NULL,
  limit_value INT NOT NULL DEFAULT 0,
  overage_allowed TINYINT(1) DEFAULT 0,
  overage_cost_per_unit_cents INT DEFAULT 0,
  effective_from DATETIME NOT NULL,
  effective_until DATETIME,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_entitlements_account (account_id),
  UNIQUE INDEX idx_entitlements_account_feature (account_id, feature, effective_from),
  FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ========================================
-- TABLE: workspaces
-- ========================================
CREATE TABLE IF NOT EXISTS workspaces (
  id CHAR(36) PRIMARY KEY,
  account_id CHAR(36) NOT NULL,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(20) DEFAULT 'active',
  settings JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_workspaces_account (account_id),
  UNIQUE INDEX idx_workspaces_account_slug (account_id, slug),
  FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Add workspace_id to existing tables
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS settings JSON AFTER slug;
ALTER TABLE api_keys ADD COLUMN IF NOT EXISTS scopes JSON AFTER daily_credit_limit;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS account_id CHAR(36) AFTER workspace_id;

-- Update api_keys for enhanced tracking
ALTER TABLE api_keys ADD COLUMN IF NOT EXISTS is_active TINYINT(1) DEFAULT 1 AFTER label;
ALTER TABLE api_keys ADD COLUMN IF NOT EXISTS requests_count INT DEFAULT 0 AFTER is_active;
ALTER TABLE api_keys ADD COLUMN IF NOT EXISTS last_used_at DATETIME AFTER requests_count;
ALTER TABLE api_keys ADD COLUMN IF NOT EXISTS created_by_user_id CHAR(36) AFTER last_used_at;
ALTER TABLE api_keys ADD COLUMN IF NOT EXISTS allowed_ips JSON AFTER created_by_user_id;

-- Update usage_events for granular metering
ALTER TABLE usage_events ADD COLUMN IF NOT EXISTS input_tokens INT AFTER credits_charged;
ALTER TABLE usage_events ADD COLUMN IF NOT EXISTS output_tokens INT AFTER input_tokens;
ALTER TABLE usage_events ADD COLUMN IF NOT EXISTS audio_seconds DECIMAL(10,3) AFTER output_tokens;
ALTER TABLE usage_events ADD COLUMN IF NOT EXISTS image_count INT AFTER audio_seconds;
ALTER TABLE usage_events ADD COLUMN IF NOT EXISTS retrieval_provider VARCHAR(50) AFTER image_count;
ALTER TABLE usage_events ADD COLUMN IF NOT EXISTS metadata JSON AFTER retrieval_provider;
ALTER TABLE usage_events ADD COLUMN IF NOT EXISTS workspace_id CHAR(36) AFTER account_id;
ALTER TABLE usage_events ADD COLUMN IF NOT EXISTS project_id CHAR(36) AFTER workspace_id;
ALTER TABLE usage_events ADD COLUMN IF NOT EXISTS duration_ms INT AFTER metadata;

-- Update plans for entitlements model
ALTER TABLE plans ADD COLUMN IF NOT EXISTS code VARCHAR(100) AFTER name;
ALTER TABLE plans ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active' AFTER monthly_credits;
ALTER TABLE plans ADD COLUMN IF NOT EXISTS entitlements JSON AFTER status;
ALTER TABLE plans ADD COLUMN IF NOT EXISTS rate_limits JSON AFTER entitlements;
ALTER TABLE plans ADD COLUMN IF NOT EXISTS features JSON AFTER rate_limits;
ALTER TABLE plans ADD COLUMN IF NOT EXISTS max_projects INT DEFAULT 5 AFTER features;
ALTER TABLE plans ADD COLUMN IF NOT EXISTS max_sources_per_project INT DEFAULT 100 AFTER max_projects;
ALTER TABLE plans ADD COLUMN IF NOT EXISTS max_workspaces INT DEFAULT 1 AFTER max_sources_per_project;
ALTER TABLE plans ADD COLUMN IF NOT EXISTS max_api_keys INT DEFAULT 5 AFTER max_workspaces;
ALTER TABLE plans ADD COLUMN IF NOT EXISTS max_webhooks INT DEFAULT 3 AFTER max_api_keys;
ALTER TABLE plans ADD COLUMN IF NOT EXISTS max_team_members INT DEFAULT 1 AFTER max_webhooks;
ALTER TABLE plans ADD COLUMN IF NOT EXISTS retention_days INT DEFAULT 90 AFTER max_team_members;
ALTER TABLE plans ADD COLUMN IF NOT EXISTS rate_limit_per_key INT DEFAULT 60 AFTER retention_days;
ALTER TABLE plans ADD COLUMN IF NOT EXISTS rate_limit_window_ms INT DEFAULT 60000 AFTER rate_limit_per_key;
ALTER TABLE plans ADD COLUMN IF NOT EXISTS webhook_signing_enabled TINYINT(1) DEFAULT 1 AFTER rate_limit_window_ms;
ALTER TABLE plans ADD COLUMN IF NOT EXISTS custom_domains_allowed TINYINT(1) DEFAULT 0 AFTER webhook_signing_enabled;
ALTER TABLE plans ADD COLUMN IF NOT EXISTS priority_support TINYINT(1) DEFAULT 0 AFTER custom_domains_allowed;

-- Update subscriptions for provider tracking
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS provider VARCHAR(50) AFTER plan_id;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS provider_subscription_id VARCHAR(255) AFTER provider;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS canceled_at DATETIME AFTER current_period_end;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS trial_end DATETIME AFTER canceled_at;

-- Update payments for provider tracking
ALTER TABLE payments ADD COLUMN IF NOT EXISTS provider_payment_intent VARCHAR(255) AFTER provider_payment_id;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS refunded_at DATETIME AFTER credits_granted;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS refund_amount_cents INT AFTER refunded_at;

-- ========================================
-- SEED: Default entitlements from plans
-- ========================================
INSERT IGNORE INTO plans (id, code, name, monthly_credits, monthly_price_cents, status, entitlements, rate_limits, features, max_projects, max_sources_per_project, max_workspaces, max_api_keys, max_webhooks, max_team_members, retention_days, rate_limit_per_key, rate_limit_window_ms)
VALUES
  (UUID(), 'sandbox', 'Sandbox', 5000, 0, 'active',
   '{"refinery_runs": 10, "sources_per_run": 5, "chunks_per_source": 50}',
   '{"per_key": {"window_ms": 60000, "max": 30}, "per_workspace": {"window_ms": 60000, "max": 300}}',
   '{"webhooks": false, "custom_domains": false, "priority_support": false, "api_access": true, "team_collaboration": false}',
   3, 50, 1, 3, 0, 1, 30, 30, 60000),
  (UUID(), 'builder', 'Builder', 15000, 1900, 'active',
   '{"refinery_runs": 100, "sources_per_run": 25, "chunks_per_source": 200}',
   '{"per_key": {"window_ms": 60000, "max": 120}, "per_workspace": {"window_ms": 60000, "max": 1000}}',
   '{"webhooks": true, "custom_domains": false, "priority_support": false, "api_access": true, "team_collaboration": true}',
   10, 200, 3, 10, 5, 5, 90, 120, 60000),
  (UUID(), 'scale', 'Scale', 50000, 4900, 'active',
   '{"refinery_runs": 500, "sources_per_run": 100, "chunks_per_source": 500}',
   '{"per_key": {"window_ms": 60000, "max": 300}, "per_workspace": {"window_ms": 60000, "max": 3000}}',
   '{"webhooks": true, "custom_domains": true, "priority_support": false, "api_access": true, "team_collaboration": true}',
   50, 500, 10, 25, 20, 20, 180, 300, 60000),
  (UUID(), 'enterprise', 'Enterprise', 200000, 14900, 'active',
   '{"refinery_runs": -1, "sources_per_run": -1, "chunks_per_source": -1}',
   '{"per_key": {"window_ms": 60000, "max": 1000}, "per_workspace": {"window_ms": 60000, "max": 10000}}',
   '{"webhooks": true, "custom_domains": true, "priority_support": true, "api_access": true, "team_collaboration": true}',
   -1, -1, -1, 100, 100, 100, 365, 1000, 60000);

-- Seed a default Sandbox entitlement for any existing accounts without one
INSERT INTO entitlements (id, account_id, feature, limit_value, overage_allowed, effective_from)
SELECT UUID(), a.id, 'refinery_runs', 10, 0, NOW()
FROM accounts a
WHERE NOT EXISTS (
  SELECT 1 FROM entitlements e WHERE e.account_id = a.id AND e.feature = 'refinery_runs'
);
