USE dispute_resolution_ai;

ALTER TABLE payment_providers
  MODIFY COLUMN code VARCHAR(100) NOT NULL;

ALTER TABLE payment_attempts
  MODIFY COLUMN provider_code VARCHAR(100) NOT NULL;

ALTER TABLE webhook_events
  MODIFY COLUMN provider_code VARCHAR(100) NOT NULL;
