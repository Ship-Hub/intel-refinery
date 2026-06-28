const {
  z
} = require(
  "zod"
);

const createAccountSchema =
  z.object({
    name:
      z.string()
        .min(1)
        .max(255),
    slug:
      z.string()
        .min(2)
        .max(255)
        .regex(
          /^[a-z0-9-]+$/
        )
  });

const createApiKeySchema =
  z.object({
    accountId:
      z.number()
        .int()
        .positive(),
    label:
      z.string()
        .min(1)
        .max(255),
    dailyCreditLimit:
      z.number()
        .int()
        .positive()
        .nullable()
        .optional()
  });

const grantCreditsSchema =
  z.object({
    accountId:
      z.number()
        .int()
        .positive(),
    amount:
      z.number()
        .int()
        .positive(),
    description:
      z.string()
        .max(255)
        .nullable()
        .optional()
  });

const createPlanSchema =
  z.object({
    code:
      z.string()
        .min(2)
        .max(100)
        .regex(
          /^[a-z0-9_-]+$/
        ),
    name:
      z.string()
        .min(1)
        .max(255),
    monthlyPriceCents:
      z.number()
        .int()
        .nonnegative(),
    monthlyCredits:
      z.number()
        .int()
        .nonnegative()
  });

const createSubscriptionSchema =
  z.object({
    accountId:
      z.number()
        .int()
        .positive(),
    planId:
      z.number()
        .int()
        .positive(),
    status:
      z.enum([
        "trialing",
        "active",
        "past_due",
        "canceled"
      ])
        .default(
          "active"
        ),
    currentPeriodStart:
      z.string()
        .datetime(),
    currentPeriodEnd:
      z.string()
        .datetime(),
    provider:
      z.string()
        .max(100)
        .nullable()
        .optional(),
    providerSubscriptionId:
      z.string()
        .max(255)
        .nullable()
        .optional()
  });

module.exports = {
  createAccountSchema,
  createApiKeySchema,
  grantCreditsSchema,
  createPlanSchema,
  createSubscriptionSchema
};
