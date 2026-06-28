const test = require("node:test");
const assert = require("node:assert/strict");
const { createCheckoutSchema } = require("../../src/payments/validators/paymentSchemas");
const {
  getProvider,
  listProviderCodes
} = require("../../src/payments/providers");

test("payment checkout schema accepts provider codes and registry validates support", () => {
  assert.equal(
    createCheckoutSchema.safeParse({
      accountId: 1,
      provider: "stripe",
      paymentType: "topup",
      amountCents: 1000,
      creditsToGrant: 2000,
      successUrl:
        "https://example.com/success",
      cancelUrl:
        "https://example.com/cancel"
    }).success,
    true
  );

  assert.equal(
    createCheckoutSchema.safeParse({
      accountId: 1,
      provider: "moonpay",
      paymentType: "topup",
      amountCents: 1000,
      successUrl:
        "https://example.com/success",
      cancelUrl:
        "https://example.com/cancel"
    }).success,
    true
  );
});

test("payment provider registry exposes configured providers", () => {
  assert.ok(getProvider("stripe"));
  assert.ok(getProvider("paystack"));
  assert.ok(getProvider("coinbase_commerce"));
  assert.deepEqual(
    listProviderCodes(),
    [
      "stripe",
      "paystack",
      "coinbase_commerce"
    ]
  );
});
