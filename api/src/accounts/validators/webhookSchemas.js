const { z } = require("zod");

const createWebhookSchema = z.object({
  name: z.string().min(1).max(255),
  url: z.string().url().max(2048),
  events: z.array(z.string().min(1)).min(1),
  maxRetries: z.number().int().min(0).max(10).optional().default(3),
  retryIntervalSeconds: z.number().int().min(10).max(3600).optional().default(60),
  description: z.string().max(1000).optional().nullable(),
  workspaceId: z.string().uuid().optional().nullable(),
});

const updateWebhookSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  url: z.string().url().max(2048).optional(),
  events: z.array(z.string().min(1)).min(1).optional(),
  isActive: z.boolean().optional(),
  maxRetries: z.number().int().min(0).max(10).optional(),
  retryIntervalSeconds: z.number().int().min(10).max(3600).optional(),
  description: z.string().max(1000).optional().nullable(),
});

module.exports = { createWebhookSchema, updateWebhookSchema };
