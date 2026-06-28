USE dispute_resolution_ai;

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

ALTER TABLE payments
  ADD COLUMN credits_to_grant INT NOT NULL DEFAULT 0 AFTER amount_cents,
  ADD COLUMN description VARCHAR(255) NULL AFTER currency;

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
