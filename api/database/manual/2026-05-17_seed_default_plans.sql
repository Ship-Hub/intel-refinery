USE dispute_resolution_ai;

INSERT INTO plans (
  code,
  name,
  monthly_price_cents,
  monthly_credits,
  status
)
VALUES
  ('starter', 'Starter', 1900, 5000, 'active'),
  ('growth', 'Growth', 4900, 15000, 'active'),
  ('business', 'Business', 12900, 50000, 'active')
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  monthly_price_cents = VALUES(monthly_price_cents),
  monthly_credits = VALUES(monthly_credits),
  status = VALUES(status);
