const express = require("express");
const { validateRequest } = require("../../middleware/validateRequest");
const { requireScope } = require("../../middleware/apiKeyScope");
const { cursorPagination } = require("../../middleware/pagination");
const { idempotency, idempotencyHandler } = require("../../middleware/idempotency");
const { ssrfProtection, sanitizeInput } = require("../../middleware/security");
const {
  createProjectV1Schema,
  updateProjectV1Schema,
  updateSourceV1Schema,
  createApiKeyV1Schema,
} = require("../validators/v1Schemas");
const {
  getProjects,
  createProjectV1,
  getProject,
  updateProjectV1,
  deleteProjectV1,
  getSources,
  updateSourceV1,
  getCyberReadiness,
  getArtifacts,
  getConnections,
  getUsage,
  getApiKeys,
  createApiKeyV1,
  revokeApiKeyV1,
  triggerRefine,
  getModelStatus,
} = require("../controllers/v1Controller");

const router = express.Router();

router.use(sanitizeInput);

router.get("/projects", cursorPagination(), getProjects);
router.post("/projects", validateRequest(createProjectV1Schema), idempotency, idempotencyHandler, createProjectV1);
router.get("/projects/:projectId", getProject);
router.patch("/projects/:projectId", validateRequest(updateProjectV1Schema), idempotency, idempotencyHandler, updateProjectV1);
router.delete("/projects/:projectId", idempotency, idempotencyHandler, deleteProjectV1);

router.get("/projects/:projectId/sources", cursorPagination(), getSources);
router.patch("/projects/:projectId/sources/:sourceId", validateRequest(updateSourceV1Schema), idempotency, idempotencyHandler, updateSourceV1);
router.get("/projects/:projectId/cyber/readiness", getCyberReadiness);
router.get("/projects/:projectId/artifacts", cursorPagination(), getArtifacts);
router.get("/projects/:projectId/connections", cursorPagination(), getConnections);
router.get("/projects/:projectId/model", getModelStatus);
router.post("/projects/:projectId/refine", idempotency, idempotencyHandler, ssrfProtection, triggerRefine);

router.get("/usage", getUsage);
router.get("/api-keys", getApiKeys);
router.post("/api-keys", requireScope("admin"), validateRequest(createApiKeyV1Schema), createApiKeyV1);
router.post("/api-keys/:apiKeyId/revoke", requireScope("admin"), revokeApiKeyV1);

module.exports = router;
