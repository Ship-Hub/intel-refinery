# DBeaver Commercial Backend Checklist

## 1. Run the schema script

Open and execute:

`database/manual/2026-05-17_commercial_backend_phase_1_to_3.sql`

## 2. Confirm expected tables exist

```sql
SHOW TABLES;
```

You should see:

```text
accounts
users
account_members
auth_identities
login_otps
plans
subscriptions
payments
credit_ledger
usage_events
user_sessions
payment_providers
payment_attempts
webhook_events
admin_audit_logs
```

## 3. Confirm `api_keys` was upgraded

```sql
SHOW COLUMNS FROM api_keys;
```

You should see these extra columns:

```text
account_id
label
key_prefix
created_by_user_id
revoked_at
daily_credit_limit
```

## 4. Confirm payment providers were seeded

```sql
SELECT code, display_name, is_active
FROM payment_providers
ORDER BY code;
```

Expected rows:

```text
coinbase_commerce | Coinbase Commerce | 1
paystack          | Paystack          | 1
stripe            | Stripe            | 1
```

## 5. Optional: seed initial plans

Open and execute:

`database/manual/2026-05-17_seed_default_plans.sql`

Then verify:

```sql
SELECT code, name, monthly_price_cents, monthly_credits, status
FROM plans
ORDER BY monthly_price_cents;
```

## 6. Sanity-check key relationships

```sql
SHOW CREATE TABLE payment_attempts;
SHOW CREATE TABLE user_sessions;
SHOW CREATE TABLE admin_audit_logs;
```

Confirm that the foreign keys reference:

```text
payments(id)
users(id)
users(id)
```
