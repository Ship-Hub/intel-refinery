# Payment Provider Smoke Tests

These commands create real sandbox/test checkout sessions through the provider APIs without writing local `payments` or `credit_ledger` rows.

Use test credentials only.

## Environment

```bash
PAYMENT_SMOKE_AMOUNT_CENTS=100
PAYMENT_SMOKE_CURRENCY=USD
PAYMENT_SMOKE_EMAIL=buyer@example.com
PAYMENT_SMOKE_SUCCESS_URL=https://example.com/payments/success
PAYMENT_SMOKE_CANCEL_URL=https://example.com/payments/cancel
```

Provider-specific secrets are also required:

```bash
STRIPE_SECRET_KEY=
PAYSTACK_SECRET_KEY=
COINBASE_COMMERCE_API_KEY=
```

## Commands

```bash
npm run smoke:payments
npm run smoke:payments:stripe
npm run smoke:payments:paystack
npm run smoke:payments:coinbase
```

Successful output includes the provider reference and hosted checkout URL. Missing configuration fails before any network request is made.
