const { z } = require("zod");
const {
  REFINERY_PROFILE_KEYS,
  PROJECT_INTENTS,
  PROJECT_LIFECYCLE_STATUSES,
  SOURCE_INCLUSION_STATES,
  CYBER_SOURCE_CATEGORIES,
} = require("../../refinery/profiles/profileConstants");

const profileKeys = Object.values(REFINERY_PROFILE_KEYS);
const projectIntents = Object.values(PROJECT_INTENTS);
const projectStatuses = Object.values(PROJECT_LIFECYCLE_STATUSES);
const sourceInclusionStates = Object.values(SOURCE_INCLUSION_STATES);
const cyberSourceCategories = Object.values(CYBER_SOURCE_CATEGORIES);

const createProjectV1Schema = z.object({
  title: z.string().min(1).max(500),
  description: z.string().max(5000).optional().nullable(),
  workspaceId: z.string().uuid().optional().nullable(),
  guidancePrompt: z.string().max(5000).optional().nullable(),
  mode: z.enum(["quick", "deep", "comprehensive"]).optional().default("quick"),
  refineryProfile: z.enum(profileKeys).optional().default(REFINERY_PROFILE_KEYS.GENERAL),
  intent: z.enum(projectIntents).optional().nullable(),
});

const updateProjectV1Schema = z.object({
  title: z.string().min(1).max(500).optional(),
  description: z.string().max(5000).optional().nullable(),
  guidancePrompt: z.string().max(5000).optional().nullable(),
  mode: z.enum(["quick", "deep", "comprehensive"]).optional(),
  status: z.enum(projectStatuses).optional(),
  refineryProfile: z.enum(profileKeys).optional(),
  intent: z.enum(projectIntents).optional().nullable(),
});

const createSourceV1Schema = z.object({
  sourceType: z.enum(["text", "pdf", "image", "url", "audio"]),
  title: z.string().max(500).optional().nullable(),
  uri: z.string().max(1000).optional().nullable(),
  content: z.string().max(100000).optional().nullable(),
  sourceCategory: z.enum(cyberSourceCategories).optional().nullable(),
  sourcePackageId: z.string().uuid().optional().nullable(),
  displayName: z.string().max(500).optional().nullable(),
  sourceNotes: z.string().max(5000).optional().nullable(),
});

const createSourcePackageV1Schema = z.object({
  name: z.string().min(1).max(255),
  packageType: z.string().max(100).optional().nullable(),
  description: z.string().max(5000).optional().nullable(),
  sourceSystem: z.string().max(255).optional().nullable(),
  metadata: z.record(z.string(), z.any()).optional().nullable(),
});

const updateSourceV1Schema = z.object({
  title: z.string().max(500).optional().nullable(),
  displayName: z.string().max(500).optional().nullable(),
  sourceCategory: z.enum(cyberSourceCategories).optional().nullable(),
  inclusionState: z.enum(sourceInclusionStates).optional(),
  sourceNotes: z.string().max(5000).optional().nullable(),
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
  createSourcePackageV1Schema,
  updateSourceV1Schema,
  createApiKeyV1Schema,
  triggerRefineV1Schema,
};
