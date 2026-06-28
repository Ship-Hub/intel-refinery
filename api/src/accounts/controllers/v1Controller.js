const crypto = require("crypto");
const db = require("../../config/db");
const { successResponse, errorResponse } = require("../../middleware/apiResponse");
const { createProject, getProjectById } = require("../../projects/routes/projectRoutes");
const { createApiKey: createApiKeyService, listApiKeys, revokeApiKey } = require("../services/apiKeyService");
const { getPlanLimits } = require("../services/entitlementService");
const { recordUsageEvent } = require("../services/usageService");
const { buildPaginatedResponse, encodeCursor } = require("../../middleware/pagination");

const getProjects = async (req, res) => {
  try {
    const accountId = req.account.id;
    const { cursor, limit } = req.pagination || { cursor: null, limit: 50 };
    let whereSql = "WHERE account_id = ?";
    const params = [accountId];
    if (cursor) {
      try {
        const decoded = Buffer.from(cursor, "base64url").toString("utf8");
        const { v, id } = JSON.parse(decoded);
        whereSql += " AND (created_at < ? OR (created_at = ? AND id < ?))";
        params.push(v, v, id);
      } catch { /* ignore invalid cursor */ }
    }
    params.push(limit + 1);
    const [rows] = await db.promise().query(
      `SELECT id, workspace_id AS workspaceId, title, description, guidance_prompt AS guidancePrompt,
              mode, status, source_count AS sourceCount, created_at AS createdAt, updated_at AS updatedAt
       FROM projects ${whereSql}
       ORDER BY created_at DESC, id DESC
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
    const { title, description, workspaceId, guidancePrompt, mode } = req.validatedBody;
    await db.promise().query(
      `INSERT INTO projects (id, workspace_id, account_id, title, description, guidance_prompt, mode, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'draft')`,
      [id, workspaceId || null, accountId, title, description || null, guidancePrompt || null, mode || "quick"]
    );
    const [rows] = await db.promise().query(
      `SELECT id, workspace_id AS workspaceId, account_id AS accountId, title, description,
              guidance_prompt AS guidancePrompt, mode, status, created_at AS createdAt
       FROM projects WHERE id = ? LIMIT 1`,
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
      `SELECT id, workspace_id AS workspaceId, account_id AS accountId, title, description,
              guidance_prompt AS guidancePrompt, mode, status, source_count AS sourceCount,
              created_at AS createdAt, updated_at AS updatedAt
       FROM projects WHERE id = ? AND account_id = ? LIMIT 1`,
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
    if (fields.length > 0) {
      values.push(req.params.projectId, req.account.id);
      await db.promise().query(
        `UPDATE projects SET ${fields.join(", ")} WHERE id = ? AND account_id = ?`,
        values
      );
    }
    const [rows] = await db.promise().query(
      `SELECT id, workspace_id AS workspaceId, title, description, guidance_prompt AS guidancePrompt,
              mode, status, source_count AS sourceCount, created_at AS createdAt, updated_at AS updatedAt
       FROM projects WHERE id = ? LIMIT 1`,
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
              s.title, s.uri, s.status, s.created_at AS createdAt
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
    const [project] = await db.promise().query(
      "SELECT id FROM projects WHERE id = ? AND account_id = ? LIMIT 1",
      [req.params.projectId, req.account.id]
    );
    if (!project[0]) return errorResponse(res, 404, "Project not found", { requestId: req.requestId });
    const runId = crypto.randomUUID();
    await db.promise().query(
      `INSERT INTO refinery_runs (id, project_id, trigger, status, stages_completed, started_at, created_at)
       VALUES (?, ?, 'api', 'running', '[]', NOW(), NOW())`,
      [runId, req.params.projectId]
    );
    return successResponse(res, {
      runId,
      projectId: req.params.projectId,
      status: "running",
      message: "Refinement pipeline triggered",
    }, { requestId: req.requestId });
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
  getArtifacts,
  getConnections,
  getUsage,
  getApiKeys,
  createApiKeyV1,
  revokeApiKeyV1,
  triggerRefine,
  getModelStatus,
};
