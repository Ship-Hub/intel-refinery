const { z } = require("zod");

const createCheckoutSchema = z.object({
  accountId: z.number().int().positive(),
  provider: z.string().trim().min(1).max(100),
  paymentType: z.enum(["subscription", "topup"]),
  amountCents: z.number().int().positive(),
  currency: z.string().length(3).default("USD"),
  creditsToGrant: z.number().int().nonnegative().default(0),
  description: z.string().trim().min(1).max(255).optional(),
  email: z.string().email().optional(),
  successUrl: z.string().url(),
  cancelUrl: z.string().url()
});

module.exports = { createCheckoutSchema };
