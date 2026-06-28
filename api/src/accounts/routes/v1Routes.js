const express = require("express");
const crypto = require("crypto");
const path = require("path");
const multer = require("multer");
const { validateRequest } = require("../../middleware/validateRequest");
const { requireScope } = require("../../middleware/apiKeyScope");
const { cursorPagination } = require("../../middleware/pagination");
const { idempotency, idempotencyHandler } = require("../../middleware/idempotency");
const { ssrfProtection, sanitizeInput } = require("../../middleware/security");
const appConfig = require("../../config/appConfig");
const { ensureDirectory } = require("../../storage/ensureDirectory");
const {
  createProjectV1Schema,
  updateProjectV1Schema,
  updateSourceV1Schema,
  createSourceV1Schema,
  createSourcePackageV1Schema,
  createApiKeyV1Schema,
} = require("../validators/v1Schemas");
const {
  getProjects,
  createProjectV1,
  getProject,
  updateProjectV1,
  deleteProjectV1,
  getSources,
  createRawSourceV1,
  createUrlSourceV1,
  uploadSourceV1,
  listSourcePackagesV1,
  createSourcePackageV1,
  updateSourceV1,
  getCyberReadiness,
  getArtifacts,
  getConnections,
  getUsage,
  getApiKeys,
  createApiKeyV1,
  revokeApiKeyV1,
  triggerRefine,
  getRunStatus,
  getModelStatus,
} = require("../controllers/v1Controller");

const router = express.Router();
const uploadsDir = path.resolve(__dirname, "../../../uploads/sources");
const sourceUpload = multer({
  storage: multer.diskStorage({
    destination: async (req, file, cb) => {
      try {
        await ensureDirectory(uploadsDir);
        cb(null, uploadsDir);
      } catch (err) {
        cb(err);
      }
    },
    filename: (req, file, cb) => {
      cb(null, `${crypto.randomUUID()}${path.extname(file.originalname)}`);
    },
  }),
  limits: { fileSize: appConfig.uploads.maxFileSize },
});

router.use(sanitizeInput);

router.get("/projects", cursorPagination(), getProjects);
router.post("/projects", validateRequest(createProjectV1Schema), idempotency, idempotencyHandler, createProjectV1);
router.get("/projects/:projectId", getProject);
router.patch("/projects/:projectId", validateRequest(updateProjectV1Schema), idempotency, idempotencyHandler, updateProjectV1);
router.delete("/projects/:projectId", idempotency, idempotencyHandler, deleteProjectV1);

router.get("/projects/:projectId/sources", cursorPagination(), getSources);
router.post("/projects/:projectId/sources/raw", requireScope("write"), validateRequest(createSourceV1Schema), idempotency, idempotencyHandler, createRawSourceV1);
router.post("/projects/:projectId/sources/url", requireScope("write"), validateRequest(createSourceV1Schema), idempotency, idempotencyHandler, ssrfProtection, createUrlSourceV1);
router.post("/projects/:projectId/sources/upload", requireScope("write"), sourceUpload.single("source"), uploadSourceV1);
router.patch("/projects/:projectId/sources/:sourceId", validateRequest(updateSourceV1Schema), idempotency, idempotencyHandler, updateSourceV1);
router.get("/projects/:projectId/source-packages", listSourcePackagesV1);
router.post("/projects/:projectId/source-packages", requireScope("write"), validateRequest(createSourcePackageV1Schema), idempotency, idempotencyHandler, createSourcePackageV1);
router.get("/projects/:projectId/cyber/readiness", getCyberReadiness);
router.get("/projects/:projectId/artifacts", cursorPagination(), getArtifacts);
router.get("/projects/:projectId/connections", cursorPagination(), getConnections);
router.get("/projects/:projectId/model", getModelStatus);
router.post("/projects/:projectId/refine", idempotency, idempotencyHandler, ssrfProtection, triggerRefine);
router.get("/projects/:projectId/runs/latest", getRunStatus);
router.get("/projects/:projectId/runs/:runId", getRunStatus);

router.get("/usage", getUsage);
router.get("/api-keys", getApiKeys);
router.post("/api-keys", requireScope("admin"), validateRequest(createApiKeyV1Schema), createApiKeyV1);
router.post("/api-keys/:apiKeyId/revoke", requireScope("admin"), revokeApiKeyV1);

module.exports = router;
