-- Intel Refinery — Essential Commercial Backend Tables
-- Creates accounts, API keys, and billing infrastructure
-- Run against intel_refinery database

CREATE TABLE IF NOT EXISTS accounts (
  id CHAR(36) PRIMARY KEY,
  organization_name VARCHAR(255),
  role ENUM('owner', 'admin', 'member') DEFAULT 'owner',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS api_keys (
  id CHAR(36) PRIMARY KEY,
  account_id CHAR(36) NOT NULL,
  name VARCHAR(255),
  api_key_hash VARCHAR(255) NOT NULL,
  key_prefix VARCHAR(16) NOT NULL,
  label VARCHAR(255),
  daily_credit_limit INT DEFAULT 1000,
  revoked_at DATETIME NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_apikeys_account (account_id),
  INDEX idx_apikeys_prefix (key_prefix),
  FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS user_sessions (
  id CHAR(36) PRIMARY KEY,
  account_id CHAR(36) NOT NULL,
  token_hash VARCHAR(255) NOT NULL,
  expires_at DATETIME NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_sessions_account (account_id),
  INDEX idx_sessions_token (token_hash),
  FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS auth_identities (
  id CHAR(36) PRIMARY KEY,
  account_id CHAR(36) NOT NULL,
  provider ENUM('google', 'github', 'gitlab', 'telegram') NOT NULL,
  provider_user_id VARCHAR(255),
  email VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_authidentities_account (account_id),
  FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS plans (
  id CHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  stripe_price_id VARCHAR(255),
  paystack_plan_code VARCHAR(255),
  coinbase_price_id VARCHAR(255),
  monthly_credits INT NOT NULL DEFAULT 1000,
  price_cents INT NOT NULL DEFAULT 0,
  currency VARCHAR(3) DEFAULT 'USD'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS subscriptions (
  id CHAR(36) PRIMARY KEY,
  account_id CHAR(36) NOT NULL,
  plan_id CHAR(36) NOT NULL,
  status ENUM('active', 'canceled', 'past_due', 'unpaid', 'trialing') DEFAULT 'active',
  current_period_start DATETIME,
  current_period_end DATETIME,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_subscriptions_account (account_id),
  FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS payments (
  id CHAR(36) PRIMARY KEY,
  account_id CHAR(36) NOT NULL,
  provider ENUM('stripe', 'paystack', 'coinbase_commerce') NOT NULL,
  provider_payment_id VARCHAR(255),
  amount_cents INT NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  status ENUM('pending', 'completed', 'failed', 'refunded') DEFAULT 'pending',
  credits_granted INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_payments_account (account_id),
  FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS credit_ledger (
  id CHAR(36) PRIMARY KEY,
  account_id CHAR(36) NOT NULL,
  type ENUM('grant', 'usage', 'topup', 'refund', 'bonus') NOT NULL,
  amount INT NOT NULL,
  balance_after INT NOT NULL,
  source_id CHAR(36),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_ledger_account (account_id),
  FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS usage_events (
  id CHAR(36) PRIMARY KEY,
  account_id CHAR(36),
  api_key_id CHAR(36),
  feature_type VARCHAR(100),
  provider VARCHAR(50),
  model VARCHAR(200),
  credits_charged INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_usage_account (account_id),
  FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Seed free plan
INSERT IGNORE INTO plans (id, name, monthly_credits, price_cents, currency) VALUES
  (UUID(), 'Sandbox', 5000, 0, 'USD'),
  (UUID(), 'Builder', 15000, 1900, 'USD'),
  (UUID(), 'Scale', 50000, 4900, 'USD');