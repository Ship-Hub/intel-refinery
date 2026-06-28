const { z } = require("zod");

const createProjectV1Schema = z.object({
  title: z.string().min(1).max(500),
  description: z.string().max(5000).optional().nullable(),
  workspaceId: z.string().uuid().optional().nullable(),
  guidancePrompt: z.string().max(5000).optional().nullable(),
  mode: z.enum(["quick", "deep", "comprehensive"]).optional().default("quick"),
});

const updateProjectV1Schema = z.object({
  title: z.string().min(1).max(500).optional(),
  description: z.string().max(5000).optional().nullable(),
  guidancePrompt: z.string().max(5000).optional().nullable(),
  mode: z.enum(["quick", "deep", "comprehensive"]).optional(),
  status: z.enum(["draft", "active", "archived"]).optional(),
});

const createSourceV1Schema = z.object({
  projectId: z.string().uuid(),
  sourceType: z.enum(["text", "pdf", "image", "url", "audio"]),
  title: z.string().max(500).optional().nullable(),
  uri: z.string().max(1000).optional().nullable(),
  content: z.string().max(100000).optional().nullable(),
});

const createApiKeyV1Schema = z.object({
  label: z.string().min(1).max(255),
  scopes: z.array(z.enum(["read", "write", "admin", "webhooks", "billing"])).optional().default(["read"]),
  dailyCreditLimit: z.number().int().positive().optional().nullable(),
});

const triggerRefineV1Schema = z.object({
  projectId: z.string().uuid(),
  mode: z.enum(["quick", "deep", "comprehensive"]).optional(),
  stages: z.array(z.string()).optional(),
});

module.exports = {
  createProjectV1Schema,
  updateProjectV1Schema,
  createSourceV1Schema,
  createApiKeyV1Schema,
  triggerRefineV1Schema,
};
