USE dispute_resolution_ai;

CREATE TABLE IF NOT EXISTS accounts (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  status ENUM('active', 'suspended', 'closed') NOT NULL DEFAULT 'active',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS users (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  email VARCHAR(320) NULL UNIQUE,
  display_name VARCHAR(255) NOT NULL,
  platform_role ENUM('user', 'admin') NOT NULL DEFAULT 'user',
  status ENUM('active', 'suspended') NOT NULL DEFAULT 'active',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS account_members (
  account_id BIGINT NOT NULL,
  user_id BIGINT NOT NULL,
  role ENUM('owner', 'admin', 'member') NOT NULL DEFAULT 'member',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (account_id, user_id),
  CONSTRAINT fk_account_members_account
    FOREIGN KEY (account_id) REFERENCES accounts(id),
  CONSTRAINT fk_account_members_user
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS auth_identities (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  provider ENUM('google', 'telegram') NOT NULL,
  provider_user_id VARCHAR(255) NOT NULL,
  email VARCHAR(320) NULL,
  display_name VARCHAR(255) NULL,
  metadata JSON NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_auth_identity_provider_user (provider, provider_user_id),
  CONSTRAINT fk_auth_identities_user
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS login_otps (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  provider ENUM('telegram') NOT NULL,
  provider_user_id VARCHAR(255) NOT NULL,
  code_hash VARCHAR(255) NOT NULL,
  expires_at DATETIME NOT NULL,
  used_at DATETIME NULL,
  metadata JSON NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_login_otps_lookup (provider, provider_user_id, expires_at)
);

CREATE TABLE IF NOT EXISTS plans (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  code VARCHAR(100) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  monthly_price_cents INT NOT NULL DEFAULT 0,
  monthly_credits INT NOT NULL DEFAULT 0,
  status ENUM('active', 'archived') NOT NULL DEFAULT 'active',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS subscriptions (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  account_id BIGINT NOT NULL,
  plan_id BIGINT NOT NULL,
  status ENUM('trialing', 'active', 'past_due', 'canceled') NOT NULL DEFAULT 'active',
  current_period_start DATETIME NOT NULL,
  current_period_end DATETIME NOT NULL,
  provider VARCHAR(100) NULL,
  provider_subscription_id VARCHAR(255) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_subscriptions_account_status (account_id, status),
  CONSTRAINT fk_subscriptions_account
    FOREIGN KEY (account_id) REFERENCES accounts(id),
  CONSTRAINT fk_subscriptions_plan
    FOREIGN KEY (plan_id) REFERENCES plans(id)
);

CREATE TABLE IF NOT EXISTS payments (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  account_id BIGINT NOT NULL,
  amount_cents INT NOT NULL,
  credits_to_grant INT NOT NULL DEFAULT 0,
  currency CHAR(3) NOT NULL DEFAULT 'USD',
  description VARCHAR(255) NULL,
  status ENUM('pending', 'paid', 'failed', 'refunded') NOT NULL,
  provider VARCHAR(100) NULL,
  provider_payment_id VARCHAR(255) NULL,
  paid_at DATETIME NULL,
  metadata JSON NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_payments_account_created (account_id, created_at),
  CONSTRAINT fk_payments_account
    FOREIGN KEY (account_id) REFERENCES accounts(id)
);

CREATE TABLE IF NOT EXISTS credit_ledger (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  account_id BIGINT NOT NULL,
  amount INT NOT NULL,
  balance_after INT NOT NULL,
  entry_type ENUM('grant', 'usage', 'topup', 'adjustment', 'refund', 'expiration') NOT NULL,
  reference_type VARCHAR(100) NULL,
  reference_id VARCHAR(255) NULL,
  description VARCHAR(255) NULL,
  created_by_user_id BIGINT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_credit_ledger_account_created (account_id, created_at),
  CONSTRAINT fk_credit_ledger_account
    FOREIGN KEY (account_id) REFERENCES accounts(id),
  CONSTRAINT fk_credit_ledger_creator
    FOREIGN KEY (created_by_user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS usage_events (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  account_id BIGINT NOT NULL,
  api_key_id BIGINT NULL,
  feature_type VARCHAR(100) NOT NULL,
  credits_charged INT NOT NULL DEFAULT 0,
  provider VARCHAR(100) NULL,
  model VARCHAR(255) NULL,
  input_tokens INT NULL,
  output_tokens INT NULL,
  audio_seconds INT NULL,
  image_count INT NULL,
  retrieval_provider VARCHAR(100) NULL,
  metadata JSON NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_usage_events_account_created (account_id, created_at),
  INDEX idx_usage_events_feature_created (feature_type, created_at),
  CONSTRAINT fk_usage_events_account
    FOREIGN KEY (account_id) REFERENCES accounts(id)
);

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

CREATE TABLE IF NOT EXISTS payment_providers (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  code VARCHAR(100) NOT NULL UNIQUE,
  display_name VARCHAR(255) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS payment_attempts (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  payment_id BIGINT NOT NULL,
  provider_code VARCHAR(100) NOT NULL,
  provider_reference VARCHAR(255) NULL,
  checkout_url TEXT NULL,
  status ENUM('created', 'pending', 'paid', 'failed', 'expired', 'canceled') NOT NULL DEFAULT 'created',
  metadata JSON NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_payment_attempts_payment (payment_id),
  INDEX idx_payment_attempts_provider_reference (provider_code, provider_reference),
  CONSTRAINT fk_payment_attempts_payment
    FOREIGN KEY (payment_id) REFERENCES payments(id)
);

CREATE TABLE IF NOT EXISTS webhook_events (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  provider_code VARCHAR(100) NOT NULL,
  provider_event_id VARCHAR(255) NOT NULL,
  event_type VARCHAR(255) NOT NULL,
  payload JSON NOT NULL,
  processed_at DATETIME NULL,
  processing_error VARCHAR(500) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_webhook_provider_event (provider_code, provider_event_id),
  INDEX idx_webhook_events_processed (processed_at)
);

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

-- Existing api_keys table upgrade.
ALTER TABLE api_keys
  ADD COLUMN account_id BIGINT NULL,
  ADD COLUMN label VARCHAR(255) NULL,
  ADD COLUMN key_prefix VARCHAR(32) NULL,
  ADD COLUMN created_by_user_id BIGINT NULL,
  ADD COLUMN revoked_at DATETIME NULL,
  ADD COLUMN daily_credit_limit INT NULL,
  ADD CONSTRAINT fk_api_keys_account
    FOREIGN KEY (account_id) REFERENCES accounts(id),
  ADD CONSTRAINT fk_api_keys_creator
    FOREIGN KEY (created_by_user_id) REFERENCES users(id);

ALTER TABLE usage_events
  ADD CONSTRAINT fk_usage_events_api_key
    FOREIGN KEY (api_key_id) REFERENCES api_keys(id);

INSERT INTO payment_providers (
  code,
  display_name
)
VALUES
  ('stripe', 'Stripe'),
  ('paystack', 'Paystack'),
  ('coinbase_commerce', 'Coinbase Commerce')
ON DUPLICATE KEY UPDATE
  display_name = VALUES(display_name);
