const crypto = require("crypto");
const fs = require("fs/promises");
const db = require("../../config/db");
const { successResponse, errorResponse } = require("../../middleware/apiResponse");
const { createApiKey: createApiKeyService, listApiKeys, revokeApiKey } = require("../services/apiKeyService");
const { getPlanLimits } = require("../services/entitlementService");
const { buildPaginatedResponse, encodeCursor } = require("../../middleware/pagination");
const { requireProfileByKey } = require("../../refinery/profiles/profileService");
const { REFINERY_PROFILE_KEYS } = require("../../refinery/profiles/profileConstants");
const { calculateCyberReadiness } = require("../../refinery/readiness/cyberReadinessService");
const ingestionRegistry = require("../../ingestion/registry");
const { generateFileHash } = require("../../security/generateFileHash");
const { validateUpload } = require("../../security/validateUpload");
const { processProject } = require("../../processing/pipeline");
const persist = require("../../refinery/persistence");

const getAccountId = (req) => req.account?.id || req.apiKey?.account_id;

const verifyProjectOwner = async (projectId, accountId) => {
  const [rows] = await db.promise().query(
    "SELECT id FROM projects WHERE id = ? AND account_id = ? LIMIT 1",
    [projectId, accountId]
  );
  return rows[0] || null;
};

const normalizeSourceResponse = (source) => ({
  id: source.id,
  projectId: source.project_id || source.projectId,
  sourceType: source.source_type || source.sourceType,
  sourceCategory: source.source_category || source.sourceCategory || null,
  inclusionState: source.inclusion_state || source.inclusionState || "included",
  sourcePackageId: source.source_package_id || source.sourcePackageId || null,
  originalName: source.original_name || source.originalName || null,
  displayName: source.display_name || source.displayName || null,
  title: source.title || null,
  uri: source.uri || null,
  status: source.status,
  sourceNotes: source.source_notes || source.sourceNotes || null,
  createdAt: source.created_at || source.createdAt || null,
  updatedAt: source.updated_at || source.updatedAt || null,
});

const inferSourceTypeFromFile = (file) => {
  const mimeType = file.mimetype || "";
  if (mimeType === "application/pdf") return "pdf";
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("text/") || mimeType === "text/markdown" || mimeType === "application/json") return "text";
  if (mimeType.startsWith("audio/")) return "audio";
  return "text";
};

const parseJsonField = (value, fallback) => {
  if (Array.isArray(value) || (value && typeof value === "object")) return value;
  if (!value) return fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

const buildRunStatusResponse = (run, project = null) => {
  if (!run) return null;
  const completed = parseJsonField(run.stages_completed || run.stagesCompleted, []);
  const failed = parseJsonField(run.stages_failed || run.stagesFailed, []);
  const totalStages = 8;
  const isTerminal = run.status === "completed" || run.status === "failed";
  const progress = isTerminal
    ? 100
    : Math.min(95, Math.round(((completed.length + failed.length) / totalStages) * 100));

  return {
    id: run.id,
    projectId: run.project_id || run.projectId || project?.id || null,
    trigger: run.trigger,
    status: run.status,
    progress,
    stagesCompleted: completed,
    stagesFailed: failed,
    errorMessage: run.error_message || run.errorMessage || null,
    durationMs: run.duration_ms || run.durationMs || null,
    startedAt: run.started_at || run.startedAt || null,
    completedAt: run.completed_at || run.completedAt || null,
    createdAt: run.created_at || run.createdAt || null,
    project: project ? {
      id: project.id,
      status: project.status,
      profileKey: project.profileKey,
      intent: project.intent,
    } : null,
  };
};

const getProjects = async (req, res) => {
  try {
    const accountId = req.account.id;
    const { cursor, limit } = req.pagination || { cursor: null, limit: 50 };
    let whereSql = "WHERE projects.account_id = ?";
    const params = [accountId];
    if (cursor) {
      try {
        const decoded = Buffer.from(cursor, "base64url").toString("utf8");
        const { v, id } = JSON.parse(decoded);
        whereSql += " AND (projects.created_at < ? OR (projects.created_at = ? AND projects.id < ?))";
        params.push(v, v, id);
      } catch { /* ignore invalid cursor */ }
    }
    params.push(limit + 1);
    const [rows] = await db.promise().query(
      `SELECT projects.id, projects.workspace_id AS workspaceId, projects.title, projects.description,
              projects.guidance_prompt AS guidancePrompt, projects.mode, projects.status, projects.intent,
              projects.source_count AS sourceCount,
              rp.profile_key AS profileKey, rp.name AS profileName,
              projects.created_at AS createdAt, projects.updated_at AS updatedAt
       FROM projects
       LEFT JOIN refinery_profiles rp ON rp.id = projects.refinery_profile_id
       ${whereSql}
       ORDER BY projects.created_at DESC, projects.id DESC
       LIMIT ?`,
      params
    );
    const result = buildPaginatedResponse(rows, limit, (last) => encodeCursor(last.createdAt, last.id));
    return successResponse(res, result.items, { requestId: req.requestId, nextCursor: result.nextCursor, hasMore: result.hasMore });
  } catch (err) {
    return errorResponse(res, 500, err.message, { requestId: req.requestId });
  }
};

const createProjectV1 = async (req, res) => {
  try {
    const accountId = req.account.id;
    const id = crypto.randomUUID();
    const { title, description, workspaceId, guidancePrompt, mode, refineryProfile, intent } = req.validatedBody;
    const profile = await requireProfileByKey(refineryProfile || REFINERY_PROFILE_KEYS.GENERAL);
    await db.promise().query(
      `INSERT INTO projects (id, workspace_id, account_id, refinery_profile_id, intent, title, description, guidance_prompt, mode, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'draft')`,
      [id, workspaceId || null, accountId, profile.id, intent || null, title, description || null, guidancePrompt || null, mode || "quick"]
    );
    const [rows] = await db.promise().query(
      `SELECT projects.id, projects.workspace_id AS workspaceId, projects.account_id AS accountId,
              projects.title, projects.description, projects.guidance_prompt AS guidancePrompt,
              projects.mode, projects.status, projects.intent,
              rp.profile_key AS profileKey, rp.name AS profileName,
              projects.created_at AS createdAt
       FROM projects
       LEFT JOIN refinery_profiles rp ON rp.id = projects.refinery_profile_id
       WHERE projects.id = ? LIMIT 1`,
      [id]
    );
    return successResponse(res, rows[0], { requestId: req.requestId });
  } catch (err) {
    return errorResponse(res, 500, err.message, { requestId: req.requestId });
  }
};

const getProject = async (req, res) => {
  try {
    const [rows] = await db.promise().query(
      `SELECT projects.id, projects.workspace_id AS workspaceId, projects.account_id AS accountId,
              projects.title, projects.description, projects.guidance_prompt AS guidancePrompt,
              projects.mode, projects.status, projects.intent, projects.source_count AS sourceCount,
              rp.profile_key AS profileKey, rp.name AS profileName,
              projects.created_at AS createdAt, projects.updated_at AS updatedAt
       FROM projects
       LEFT JOIN refinery_profiles rp ON rp.id = projects.refinery_profile_id
       WHERE projects.id = ? AND projects.account_id = ? LIMIT 1`,
      [req.params.projectId, req.account.id]
    );
    if (!rows[0]) return errorResponse(res, 404, "Project not found", { requestId: req.requestId });
    return successResponse(res, rows[0], { requestId: req.requestId });
  } catch (err) {
    return errorResponse(res, 500, err.message, { requestId: req.requestId });
  }
};

const updateProjectV1 = async (req, res) => {
  try {
    const existing = await db.promise().query(
      "SELECT id FROM projects WHERE id = ? AND account_id = ? LIMIT 1",
      [req.params.projectId, req.account.id]
    );
    if (!existing[0][0]) return errorResponse(res, 404, "Project not found", { requestId: req.requestId });
    const fields = [];
    const values = [];
    if (req.validatedBody.title !== undefined) { fields.push("title = ?"); values.push(req.validatedBody.title); }
    if (req.validatedBody.description !== undefined) { fields.push("description = ?"); values.push(req.validatedBody.description); }
    if (req.validatedBody.guidancePrompt !== undefined) { fields.push("guidance_prompt = ?"); values.push(req.validatedBody.guidancePrompt); }
    if (req.validatedBody.mode !== undefined) { fields.push("mode = ?"); values.push(req.validatedBody.mode); }
    if (req.validatedBody.status !== undefined) { fields.push("status = ?"); values.push(req.validatedBody.status); }
    if (req.validatedBody.intent !== undefined) { fields.push("intent = ?"); values.push(req.validatedBody.intent); }
    if (req.validatedBody.refineryProfile !== undefined) {
      const profile = await requireProfileByKey(req.validatedBody.refineryProfile);
      fields.push("refinery_profile_id = ?");
      values.push(profile.id);
    }
    if (fields.length > 0) {
      values.push(req.params.projectId, req.account.id);
      await db.promise().query(
        `UPDATE projects SET ${fields.join(", ")} WHERE id = ? AND account_id = ?`,
        values
      );
    }
    const [rows] = await db.promise().query(
      `SELECT projects.id, projects.workspace_id AS workspaceId, projects.title, projects.description,
              projects.guidance_prompt AS guidancePrompt, projects.mode, projects.status,
              projects.intent, projects.source_count AS sourceCount,
              rp.profile_key AS profileKey, rp.name AS profileName,
              projects.created_at AS createdAt, projects.updated_at AS updatedAt
       FROM projects
       LEFT JOIN refinery_profiles rp ON rp.id = projects.refinery_profile_id
       WHERE projects.id = ? LIMIT 1`,
      [req.params.projectId]
    );
    return successResponse(res, rows[0], { requestId: req.requestId });
  } catch (err) {
    return errorResponse(res, 500, err.message, { requestId: req.requestId });
  }
};

const deleteProjectV1 = async (req, res) => {
  try {
    const [result] = await db.promise().query(
      "DELETE FROM projects WHERE id = ? AND account_id = ?",
      [req.params.projectId, req.account.id]
    );
    if (result.affectedRows === 0) return errorResponse(res, 404, "Project not found", { requestId: req.requestId });
    return successResponse(res, { deleted: true }, { requestId: req.requestId });
  } catch (err) {
    return errorResponse(res, 500, err.message, { requestId: req.requestId });
  }
};

const getSources = async (req, res) => {
  try {
    const { cursor, limit } = req.pagination || { cursor: null, limit: 50 };
    let whereSql = "WHERE s.project_id = ? AND p.account_id = ?";
    const params = [req.params.projectId, req.account.id];
    if (cursor) {
      try {
        const decoded = Buffer.from(cursor, "base64url").toString("utf8");
        const { v, id } = JSON.parse(decoded);
        whereSql += " AND (s.created_at < ? OR (s.created_at = ? AND s.id < ?))";
        params.push(v, v, id);
      } catch { /* ignore */ }
    }
    params.push(limit + 1);
    const [rows] = await db.promise().query(
      `SELECT s.id, s.project_id AS projectId, s.source_type AS sourceType, s.original_name AS originalName,
              s.source_category AS sourceCategory, s.inclusion_state AS inclusionState,
              s.display_name AS displayName, s.source_notes AS sourceNotes,
              s.source_package_id AS sourcePackageId, s.title, s.uri, s.status, s.created_at AS createdAt
       FROM sources s
       JOIN projects p ON p.id = s.project_id
       ${whereSql}
       ORDER BY s.created_at DESC, s.id DESC
       LIMIT ?`,
      params
    );
    const result = buildPaginatedResponse(rows, limit, (last) => encodeCursor(last.createdAt, last.id));
    return successResponse(res, result.items, { requestId: req.requestId, nextCursor: result.nextCursor, hasMore: result.hasMore });
  } catch (err) {
    return errorResponse(res, 500, err.message, { requestId: req.requestId });
  }
};

const listSourcePackagesV1 = async (req, res) => {
  try {
    const accountId = getAccountId(req);
    const project = await verifyProjectOwner(req.params.projectId, accountId);
    if (!project) return errorResponse(res, 404, "Project not found", { requestId: req.requestId });

    const [rows] = await db.promise().query(
      `SELECT id, project_id AS projectId, name, package_type AS packageType,
              description, source_system AS sourceSystem, metadata,
              created_at AS createdAt, updated_at AS updatedAt
       FROM source_packages
       WHERE project_id = ?
       ORDER BY created_at DESC, id DESC`,
      [req.params.projectId]
    );

    return successResponse(res, rows, { requestId: req.requestId });
  } catch (err) {
    return errorResponse(res, 500, err.message, { requestId: req.requestId });
  }
};

const createSourcePackageV1 = async (req, res) => {
  try {
    const accountId = getAccountId(req);
    const project = await verifyProjectOwner(req.params.projectId, accountId);
    if (!project) return errorResponse(res, 404, "Project not found", { requestId: req.requestId });

    const id = crypto.randomUUID();
    const { name, packageType, description, sourceSystem, metadata } = req.validatedBody;
    await db.promise().query(
      `INSERT INTO source_packages (id, project_id, name, package_type, description, source_system, metadata)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        req.params.projectId,
        name,
        packageType || null,
        description || null,
        sourceSystem || null,
        metadata ? JSON.stringify(metadata) : null,
      ]
    );

    const [rows] = await db.promise().query(
      `SELECT id, project_id AS projectId, name, package_type AS packageType,
              description, source_system AS sourceSystem, metadata,
              created_at AS createdAt, updated_at AS updatedAt
       FROM source_packages
       WHERE id = ? LIMIT 1`,
      [id]
    );
    return successResponse(res, rows[0], { requestId: req.requestId });
  } catch (err) {
    return errorResponse(res, 500, err.message, { requestId: req.requestId });
  }
};

const createRawSourceV1 = async (req, res) => {
  try {
    const accountId = getAccountId(req);
    const project = await verifyProjectOwner(req.params.projectId, accountId);
    if (!project) return errorResponse(res, 404, "Project not found", { requestId: req.requestId });

    const { title, content, sourceCategory, sourcePackageId, displayName, sourceNotes } = req.validatedBody;
    if (!content) return errorResponse(res, 400, "content is required", { requestId: req.requestId });

    const sourceId = crypto.randomUUID();
    const adapter = ingestionRegistry.get("text");
    let metadata = {};
    if (adapter?.processRaw) {
      const result = await adapter.processRaw(content);
      metadata = result.metadata || {};
    }

    await db.promise().query(
      `INSERT INTO sources (
         id, project_id, source_package_id, source_type, source_category,
         title, display_name, raw_text, extracted_text, metadata,
         status, inclusion_state, source_notes
       )
       VALUES (?, ?, ?, 'raw_text', ?, ?, ?, ?, ?, ?, 'normalized', 'included', ?)`,
      [
        sourceId,
        req.params.projectId,
        sourcePackageId || null,
        sourceCategory || "analyst_notes",
        title || displayName || "Pasted Information",
        displayName || title || "Pasted Information",
        content,
        content,
        JSON.stringify(metadata),
        sourceNotes || null,
      ]
    );

    await db.promise().query("UPDATE projects SET source_count = source_count + 1 WHERE id = ?", [req.params.projectId]);
    const [rows] = await db.promise().query("SELECT * FROM sources WHERE id = ? LIMIT 1", [sourceId]);
    return successResponse(res, normalizeSourceResponse(rows[0]), { requestId: req.requestId });
  } catch (err) {
    return errorResponse(res, 500, err.message, { requestId: req.requestId });
  }
};

const createUrlSourceV1 = async (req, res) => {
  try {
    const accountId = getAccountId(req);
    const project = await verifyProjectOwner(req.params.projectId, accountId);
    if (!project) return errorResponse(res, 404, "Project not found", { requestId: req.requestId });

    const { title, uri, sourceCategory, sourcePackageId, displayName, sourceNotes } = req.validatedBody;
    if (!uri) return errorResponse(res, 400, "uri is required", { requestId: req.requestId });

    const sourceId = crypto.randomUUID();
    const adapter = ingestionRegistry.get("url");
    let extractedText = "";
    let metadata = { url: uri };
    if (adapter?.processUrl) {
      const result = await adapter.processUrl(uri);
      extractedText = result.text || "";
      metadata = { ...metadata, ...(result.metadata || {}) };
    }

    await db.promise().query(
      `INSERT INTO sources (
         id, project_id, source_package_id, source_type, source_category,
         title, display_name, uri, extracted_text, metadata,
         status, inclusion_state, source_notes
       )
       VALUES (?, ?, ?, 'url', ?, ?, ?, ?, ?, ?, ?, 'included', ?)`,
      [
        sourceId,
        req.params.projectId,
        sourcePackageId || null,
        sourceCategory || "security_advisory",
        title || metadata.title || uri,
        displayName || title || metadata.title || uri,
        uri,
        extractedText,
        JSON.stringify(metadata),
        extractedText ? "normalized" : "pending",
        sourceNotes || null,
      ]
    );

    await db.promise().query("UPDATE projects SET source_count = source_count + 1 WHERE id = ?", [req.params.projectId]);
    const [rows] = await db.promise().query("SELECT * FROM sources WHERE id = ? LIMIT 1", [sourceId]);
    return successResponse(res, normalizeSourceResponse(rows[0]), { requestId: req.requestId });
  } catch (err) {
    return errorResponse(res, 500, err.message, { requestId: req.requestId });
  }
};

const uploadSourceV1 = async (req, res) => {
  try {
    const accountId = getAccountId(req);
    const project = await verifyProjectOwner(req.params.projectId, accountId);
    if (!project) return errorResponse(res, 404, "Project not found", { requestId: req.requestId });
    if (!req.file) return errorResponse(res, 400, "No source file uploaded", { requestId: req.requestId });

    const validation = validateUpload(req.file);
    if (!validation.success) {
      await fs.unlink(req.file.path).catch(() => {});
      return errorResponse(res, 400, validation.error, { requestId: req.requestId, acceptedFileTypes: validation.acceptedFileTypes });
    }

    const sourceId = crypto.randomUUID();
    const sourceType = inferSourceTypeFromFile(req.file);
    const adapter = ingestionRegistry.get(sourceType);
    const fileHash = await generateFileHash(req.file.path);
    let extractedText = "";
    let metadata = { originalMimeType: req.file.mimetype };

    if (adapter?.processFile) {
      try {
        const result = await adapter.processFile(req.file.path, req.file.originalname);
        extractedText = result.text || "";
        metadata = { ...metadata, ...(result.metadata || {}) };
      } catch (err) {
        metadata.ingestionError = err.message;
      }
    }

    await db.promise().query(
      `INSERT INTO sources (
         id, project_id, source_package_id, source_type, source_category,
         original_name, title, display_name, uri, extracted_text, metadata,
         content_hash, status, inclusion_state, source_notes
       )
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'included', ?)`,
      [
        sourceId,
        req.params.projectId,
        req.body.sourcePackageId || null,
        sourceType,
        req.body.sourceCategory || "other",
        req.file.originalname,
        req.body.title || req.file.originalname,
        req.body.displayName || req.body.title || req.file.originalname,
        req.file.path,
        extractedText,
        JSON.stringify(metadata),
        fileHash,
        extractedText ? "normalized" : "pending",
        req.body.sourceNotes || null,
      ]
    );

    await db.promise().query("UPDATE projects SET source_count = source_count + 1 WHERE id = ?", [req.params.projectId]);
    const [rows] = await db.promise().query("SELECT * FROM sources WHERE id = ? LIMIT 1", [sourceId]);
    return successResponse(res, normalizeSourceResponse(rows[0]), { requestId: req.requestId });
  } catch (err) {
    if (req.file?.path) await fs.unlink(req.file.path).catch(() => {});
    return errorResponse(res, 500, err.message, { requestId: req.requestId });
  }
};

const updateSourceV1 = async (req, res) => {
  try {
    const [existing] = await db.promise().query(
      `SELECT s.id
       FROM sources s
       JOIN projects p ON p.id = s.project_id
       WHERE s.id = ? AND s.project_id = ? AND p.account_id = ?
       LIMIT 1`,
      [req.params.sourceId, req.params.projectId, req.account.id]
    );
    if (!existing[0]) return errorResponse(res, 404, "Source not found", { requestId: req.requestId });

    const fields = [];
    const values = [];
    if (req.validatedBody.title !== undefined) { fields.push("title = ?"); values.push(req.validatedBody.title); }
    if (req.validatedBody.displayName !== undefined) { fields.push("display_name = ?"); values.push(req.validatedBody.displayName); }
    if (req.validatedBody.sourceCategory !== undefined) { fields.push("source_category = ?"); values.push(req.validatedBody.sourceCategory); }
    if (req.validatedBody.inclusionState !== undefined) { fields.push("inclusion_state = ?"); values.push(req.validatedBody.inclusionState); }
    if (req.validatedBody.sourceNotes !== undefined) { fields.push("source_notes = ?"); values.push(req.validatedBody.sourceNotes); }

    if (fields.length > 0) {
      values.push(req.params.sourceId);
      await db.promise().query(`UPDATE sources SET ${fields.join(", ")} WHERE id = ?`, values);
    }

    const [rows] = await db.promise().query(
      `SELECT id, project_id AS projectId, source_type AS sourceType, source_category AS sourceCategory,
              inclusion_state AS inclusionState, display_name AS displayName, source_notes AS sourceNotes,
              title, uri, status, created_at AS createdAt, updated_at AS updatedAt
       FROM sources
       WHERE id = ? LIMIT 1`,
      [req.params.sourceId]
    );
    return successResponse(res, rows[0], { requestId: req.requestId });
  } catch (err) {
    return errorResponse(res, 500, err.message, { requestId: req.requestId });
  }
};

const getCyberReadiness = async (req, res) => {
  try {
    const [projectRows] = await db.promise().query(
      `SELECT p.id, p.intent, p.status, rp.profile_key AS profileKey
       FROM projects p
       LEFT JOIN refinery_profiles rp ON rp.id = p.refinery_profile_id
       WHERE p.id = ? AND p.account_id = ?
       LIMIT 1`,
      [req.params.projectId, req.account.id]
    );
    const project = projectRows[0];
    if (!project) return errorResponse(res, 404, "Project not found", { requestId: req.requestId });
    if (project.profileKey !== REFINERY_PROFILE_KEYS.CYBER) {
      return errorResponse(res, 409, "Cyber readiness is only available for Cyber Refinery projects", { requestId: req.requestId });
    }

    const [sources] = await db.promise().query(
      `SELECT id, source_type AS sourceType, source_category AS sourceCategory,
              inclusion_state AS inclusionState, title, uri, status,
              raw_text AS rawText, extracted_text AS extractedText
       FROM sources
       WHERE project_id = ?`,
      [req.params.projectId]
    );

    return successResponse(res, calculateCyberReadiness({ project, sources }), { requestId: req.requestId });
  } catch (err) {
    return errorResponse(res, 500, err.message, { requestId: req.requestId });
  }
};

const getArtifacts = async (req, res) => {
  try {
    const { cursor, limit } = req.pagination || { cursor: null, limit: 50 };
    let whereSql = "WHERE a.project_id = ? AND p.account_id = ?";
    const params = [req.params.projectId, req.account.id];
    if (req.query.type) { whereSql += " AND a.artifact_type = ?"; params.push(req.query.type); }
    if (req.query.status) { whereSql += " AND a.status = ?"; params.push(req.query.status); }
    if (req.query.search) { whereSql += " AND (a.title LIKE ? OR a.summary LIKE ?)"; params.push(`%${req.query.search}%`, `%${req.query.search}%`); }
    if (cursor) {
      try {
        const decoded = Buffer.from(cursor, "base64url").toString("utf8");
        const { v, id } = JSON.parse(decoded);
        whereSql += " AND (a.created_at < ? OR (a.created_at = ? AND a.id < ?))";
        params.push(v, v, id);
      } catch { /* ignore */ }
    }
    params.push(limit + 1);
    const [rows] = await db.promise().query(
      `SELECT a.id, a.project_id AS projectId, a.artifact_type AS artifactType, a.title,
              a.summary, a.confidence, a.importance, a.status, a.created_at AS createdAt
       FROM artifacts a
       JOIN projects p ON p.id = a.project_id
       ${whereSql}
       ORDER BY a.created_at DESC, a.id DESC
       LIMIT ?`,
      params
    );
    const result = buildPaginatedResponse(rows, limit, (last) => encodeCursor(last.createdAt, last.id));
    return successResponse(res, result.items, { requestId: req.requestId, nextCursor: result.nextCursor, hasMore: result.hasMore });
  } catch (err) {
    return errorResponse(res, 500, err.message, { requestId: req.requestId });
  }
};

const getConnections = async (req, res) => {
  try {
    const { cursor, limit } = req.pagination || { cursor: null, limit: 50 };
    let whereSql = "WHERE c.project_id = ? AND p.account_id = ?";
    const params = [req.params.projectId, req.account.id];
    if (req.query.type) { whereSql += " AND c.connection_type = ?"; params.push(req.query.type); }
    if (cursor) {
      try {
        const decoded = Buffer.from(cursor, "base64url").toString("utf8");
        const { v, id } = JSON.parse(decoded);
        whereSql += " AND (c.created_at < ? OR (c.created_at = ? AND c.id < ?))";
        params.push(v, v, id);
      } catch { /* ignore */ }
    }
    params.push(limit + 1);
    const [rows] = await db.promise().query(
      `SELECT c.id, c.project_id AS projectId, c.from_artifact_id AS fromArtifactId,
              c.to_artifact_id AS toArtifactId, c.connection_type AS connectionType,
              c.label, c.confidence, c.strength, c.status, c.created_at AS createdAt
       FROM artifact_connections c
       JOIN projects p ON p.id = c.project_id
       ${whereSql}
       ORDER BY c.created_at DESC, c.id DESC
       LIMIT ?`,
      params
    );
    const result = buildPaginatedResponse(rows, limit, (last) => encodeCursor(last.createdAt, last.id));
    return successResponse(res, result.items, { requestId: req.requestId, nextCursor: result.nextCursor, hasMore: result.hasMore });
  } catch (err) {
    return errorResponse(res, 500, err.message, { requestId: req.requestId });
  }
};

const getUsage = async (req, res) => {
  try {
    const accountId = req.account.id;
    const [rows] = await db.promise().query(
      `SELECT
         COALESCE(SUM(credits_charged), 0) AS totalCredits,
         COALESCE(SUM(input_tokens), 0) AS totalInputTokens,
         COALESCE(SUM(output_tokens), 0) AS totalOutputTokens,
         COUNT(*) AS totalRequests,
         MAX(created_at) AS lastUsage
       FROM usage_events
       WHERE account_id = ?
         AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)`,
      [accountId]
    );
    const planLimits = await getPlanLimits(accountId);
    const [usageByFeature] = await db.promise().query(
      `SELECT feature_type AS featureType, SUM(credits_charged) AS credits, COUNT(*) AS count
       FROM usage_events WHERE account_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
       GROUP BY feature_type ORDER BY credits DESC`,
      [accountId]
    );
    return successResponse(res, {
      summary: rows[0],
      plan: planLimits ? { monthlyCredits: planLimits.monthly_credits } : null,
      byFeature: usageByFeature,
    }, { requestId: req.requestId });
  } catch (err) {
    return errorResponse(res, 500, err.message, { requestId: req.requestId });
  }
};

const getApiKeys = async (req, res) => {
  try {
    const keys = await listApiKeys(req.account.id);
    return successResponse(res, keys.map(k => ({
      id: k.id,
      label: k.label,
      keyPrefix: k.keyPrefix,
      isActive: k.isActive,
      lastUsedAt: k.lastUsedAt,
      createdAt: k.createdAt,
      revokedAt: k.revokedAt,
      requestsCount: k.requestsCount,
      dailyCreditLimit: k.dailyCreditLimit,
    })), { requestId: req.requestId });
  } catch (err) {
    return errorResponse(res, 500, err.message, { requestId: req.requestId });
  }
};

const createApiKeyV1 = async (req, res) => {
  try {
    const key = await createApiKeyService({
      accountId: req.account.id,
      label: req.validatedBody.label,
      dailyCreditLimit: req.validatedBody.dailyCreditLimit || null,
      createdByUserId: req.user?.id || null,
    });
    if (req.validatedBody.scopes && req.validatedBody.scopes.length > 0) {
      for (const scope of req.validatedBody.scopes) {
        await db.promise().query(
          "INSERT IGNORE INTO api_key_scopes (id, api_key_id, scope) VALUES (UUID(), ?, ?)",
          [key.id, scope]
        );
      }
    }
    return successResponse(res, { id: key.id, rawKey: key.rawKey, label: key.label, scopes: req.validatedBody.scopes }, { requestId: req.requestId });
  } catch (err) {
    return errorResponse(res, 500, err.message, { requestId: req.requestId });
  }
};

const revokeApiKeyV1 = async (req, res) => {
  try {
    const revoked = await revokeApiKey({ apiKeyId: req.params.apiKeyId, accountId: req.account.id });
    if (!revoked) return errorResponse(res, 404, "API key not found", { requestId: req.requestId });
    return successResponse(res, { revoked: true }, { requestId: req.requestId });
  } catch (err) {
    return errorResponse(res, 500, err.message, { requestId: req.requestId });
  }
};

const triggerRefine = async (req, res) => {
  try {
    const [projects] = await db.promise().query(
      `SELECT p.id, p.status, p.intent, rp.profile_key AS profileKey
       FROM projects p
       LEFT JOIN refinery_profiles rp ON rp.id = p.refinery_profile_id
       WHERE p.id = ? AND p.account_id = ?
       LIMIT 1`,
      [req.params.projectId, req.account.id]
    );
    const project = projects[0];
    if (!project) return errorResponse(res, 404, "Project not found", { requestId: req.requestId });

    const [activeRuns] = await db.promise().query(
      `SELECT id, status, stages_completed, stages_failed, error_message, started_at, created_at
       FROM refinery_runs
       WHERE project_id = ? AND status = 'running'
       ORDER BY created_at DESC
       LIMIT 1`,
      [req.params.projectId]
    );
    if (activeRuns[0]) {
      return successResponse(res, buildRunStatusResponse(activeRuns[0], project), { requestId: req.requestId });
    }

    const runId = await persist.createRun(req.params.projectId, "api");
    setImmediate(async () => {
      try {
        await processProject(req.params.projectId, {
          trigger: "api",
          runId,
          profileKey: project.profileKey,
          intent: project.intent,
        });
      } catch (err) {
        await persist.updateRun(runId, {
          status: "failed",
          errorMessage: err.message,
          completedAt: new Date().toISOString(),
        }).catch(() => {});
        await persist.updateProjectStatus(req.params.projectId, "failed").catch(() => {});
      }
    });

    return successResponse(res, {
      id: runId,
      runId,
      projectId: req.params.projectId,
      status: "running",
      progress: 0,
      stagesCompleted: [],
      stagesFailed: [],
      message: "Refinement pipeline started",
    }, { requestId: req.requestId });
  } catch (err) {
    return errorResponse(res, 500, err.message, { requestId: req.requestId });
  }
};

const getRunStatus = async (req, res) => {
  try {
    const [projects] = await db.promise().query(
      `SELECT p.id, p.status, p.intent, rp.profile_key AS profileKey
       FROM projects p
       LEFT JOIN refinery_profiles rp ON rp.id = p.refinery_profile_id
       WHERE p.id = ? AND p.account_id = ?
       LIMIT 1`,
      [req.params.projectId, req.account.id]
    );
    const project = projects[0];
    if (!project) return errorResponse(res, 404, "Project not found", { requestId: req.requestId });

    const params = [req.params.projectId];
    let where = "WHERE project_id = ?";
    if (req.params.runId && req.params.runId !== "latest") {
      where += " AND id = ?";
      params.push(req.params.runId);
    }

    const [runs] = await db.promise().query(
      `SELECT id, project_id, trigger, status, stages_completed, stages_failed,
              error_message, duration_ms, started_at, completed_at, created_at
       FROM refinery_runs
       ${where}
       ORDER BY created_at DESC
       LIMIT 1`,
      params
    );
    if (!runs[0]) return errorResponse(res, 404, "Run not found", { requestId: req.requestId });

    return successResponse(res, buildRunStatusResponse(runs[0], project), { requestId: req.requestId });
  } catch (err) {
    return errorResponse(res, 500, err.message, { requestId: req.requestId });
  }
};

const getModelStatus = async (req, res) => {
  try {
    const [rows] = await db.promise().query(
      `SELECT rmv.id AS versionId, rmv.version_number AS versionNumber, rmv.status,
              rmv.summary, rmv.created_at AS createdAt,
              rr.id AS runId, rr.status AS runStatus, rr.stages_completed AS stagesCompleted,
              rr.duration_ms AS durationMs, rr.created_at AS runCreatedAt
       FROM refinery_model_versions rmv
       LEFT JOIN refinery_runs rr ON rr.id = rmv.run_id
       JOIN projects p ON p.id = rmv.project_id
       WHERE rmv.project_id = ? AND p.account_id = ?
       ORDER BY rmv.created_at DESC
       LIMIT 5`,
      [req.params.projectId, req.account.id]
    );
    return successResponse(res, rows, { requestId: req.requestId });
  } catch (err) {
    return errorResponse(res, 500, err.message, { requestId: req.requestId });
  }
};

module.exports = {
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
};
