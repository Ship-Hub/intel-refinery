const test =
  require("node:test");
const assert =
  require("node:assert/strict");

process.env.PLATFORM_ADMIN_TOKEN =
  process.env.PLATFORM_ADMIN_TOKEN ||
  "admin-secret";

const {
  createAccountSchema,
  createApiKeySchema,
  grantCreditsSchema,
  createPlanSchema,
  createSubscriptionSchema
} = require(
  "../../src/accounts/validators/accountSchemas"
);
const {
  requestTelegramOtpSchema,
  verifyTelegramOtpSchema
} = require(
  "../../src/auth/validators/telegramOtpSchemas"
);
const {
  generateRawApiKey
} = require(
  "../../src/accounts/services/apiKeyService"
);
const {
  buildApiDocumentation
} = require(
  "../../src/controllers/apiDocumentation"
);

test(
  "account schemas accept core admin payloads",
  () => {
    assert.equal(
      createAccountSchema.safeParse({
        name:
          "Acme",
        slug:
          "acme"
      }).success,
      true
    );
    assert.equal(
      createApiKeySchema.safeParse({
        accountId:
          1,
        label:
          "Production"
      }).success,
      true
    );
    assert.equal(
      grantCreditsSchema.safeParse({
        accountId:
          1,
        amount:
          500
      }).success,
      true
    );
    assert.equal(
      createPlanSchema.safeParse({
        code:
          "starter",
        name:
          "Starter",
        monthlyPriceCents:
          1000,
        monthlyCredits:
          5000
      }).success,
      true
    );
    assert.equal(
      createSubscriptionSchema.safeParse({
        accountId:
          1,
        planId:
          1,
        currentPeriodStart:
          "2026-05-17T00:00:00.000Z",
        currentPeriodEnd:
          "2026-06-17T00:00:00.000Z"
      }).success,
      true
    );
  }
);

test(
  "telegram otp verification accepts only a six digit code",
  () => {
    assert.equal(
      requestTelegramOtpSchema.safeParse({
        telegramUserId:
          "123"
      }).success,
      true
    );
    assert.equal(
      verifyTelegramOtpSchema.safeParse({
        code:
          "123456"
      }).success,
      true
    );
    assert.equal(
      verifyTelegramOtpSchema.safeParse({
        code:
          "12345"
      }).success,
      false
    );
  }
);

test(
  "generated API keys include the Intel Engine live prefix",
  () => {
    assert.match(
      generateRawApiKey(),
      /^intel_live_[a-f0-9]{48}$/
    );
  }
);

test(
  "docs expose phase one account and otp endpoints",
  () => {
    const docs =
      buildApiDocumentation();
    const paths =
      docs.endpoints.map(
        (endpoint) =>
          endpoint.path
      );

    assert.ok(
      paths.includes(
        "/api/admin/accounts"
      )
    );
    assert.ok(
      paths.includes(
        "/auth/telegram/verify-otp"
      )
    );
    assert.ok(
      paths.includes(
        "/auth/google"
      )
    );
    assert.ok(
      paths.includes(
        "/api/admin/payments"
      )
    );
  }
);
