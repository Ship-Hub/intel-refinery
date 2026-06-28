const { v4: uuidv4 } = require("uuid");
const pool = require("../config/db").promise();

const persist = {
  // ── Source Chunks ──────────────────────────────────────────────────────────

  saveChunks: async (projectId, chunks) => {
    if (!chunks || chunks.length === 0) return;

    const values = chunks.map((c) => [
      c.id || uuidv4(),
      c.sourceId,
      projectId,
      c.index || 0,
      c.content || c.text || "",
      c.tokenCount || 0,
      JSON.stringify(c.metadata || {}),
      c.embedding ? JSON.stringify(c.embedding) : null
    ]);

    await pool.query(
      `INSERT INTO source_chunks (id, source_id, project_id, chunk_index, content, token_count, metadata, embedding)
       VALUES ?`,
      [values]
    );
  },

  // ── Artifacts ──────────────────────────────────────────────────────────────

  saveArtifacts: async (projectId, artifacts, options = {}) => {
    if (!artifacts || artifacts.length === 0) return [];

    const ids = [];
    for (const a of artifacts) {
      const id = a.id || uuidv4();
      ids.push(id);
      await pool.query(
        `INSERT INTO artifacts (id, project_id, artifact_type, title, summary, content, confidence, importance, status, source_coverage_count, first_seen_source_id, created_by_task_id, metadata)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           artifact_type = COALESCE(?, artifact_type),
           title = COALESCE(?, title),
           summary = COALESCE(?, summary),
           content = COALESCE(?, content),
           confidence = COALESCE(?, confidence),
           importance = COALESCE(?, importance),
           status = COALESCE(?, status),
           source_coverage_count = source_coverage_count + 1,
           updated_at = CURRENT_TIMESTAMP`,
        [
          id, projectId,
          a.artifactType || a.artifact_type || null,
          a.title || "Untitled",
          a.summary || null,
          a.content ? JSON.stringify(a.content) : null,
          a.confidence ?? 1.0,
          a.importance ?? 0.5,
          a.status || "active",
          a.sourceCoverageCount || 1,
          a.firstSeenSourceId || null,
          options.taskId || null,
          a.metadata ? JSON.stringify(a.metadata) : null,
          a.artifactType || null,
          a.title || null,
          a.summary || null,
          a.content ? JSON.stringify(a.content) : null,
          a.confidence ?? null,
          a.importance ?? null,
          a.status || null
        ]
      );
    }
    return ids;
  },

  updateArtifact: async (artifactId, updates) => {
    const fields = [];
    const params = [];

    if (updates.artifactType !== undefined) { fields.push("artifact_type = ?"); params.push(updates.artifactType); }
    if (updates.title !== undefined) { fields.push("title = ?"); params.push(updates.title); }
    if (updates.summary !== undefined) { fields.push("summary = ?"); params.push(updates.summary); }
    if (updates.content !== undefined) { fields.push("content = ?"); params.push(JSON.stringify(updates.content)); }
    if (updates.confidence !== undefined) { fields.push("confidence = ?"); params.push(updates.confidence); }
    if (updates.importance !== undefined) { fields.push("importance = ?"); params.push(updates.importance); }
    if (updates.status !== undefined) { fields.push("status = ?"); params.push(updates.status); }
    if (updates.metadata !== undefined) { fields.push("metadata = ?"); params.push(JSON.stringify(updates.metadata)); }

    if (fields.length === 0) return;

    params.push(artifactId);
    await pool.query(
      `UPDATE artifacts SET ${fields.join(", ")}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      params
    );
  },

  // ── Artifact Evidence ──────────────────────────────────────────────────────

  saveEvidence: async (projectId, evidenceList) => {
    if (!evidenceList || evidenceList.length === 0) return;

    for (const e of evidenceList) {
      await pool.query(
        `INSERT INTO artifact_evidence (id, project_id, artifact_id, source_id, chunk_id, quote, evidence_type, confidence, metadata)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          uuidv4(),
          projectId,
          e.artifactId,
          e.sourceId,
          e.chunkId || null,
          e.quote || null,
          e.evidenceType || "supports",
          e.confidence ?? 1.0,
          e.metadata ? JSON.stringify(e.metadata) : null
        ]
      );
    }
  },

  // ── Artifact Connections ───────────────────────────────────────────────────

  saveConnections: async (projectId, connections, options = {}) => {
    if (!connections || connections.length === 0) return [];

    const ids = [];
    for (const c of connections) {
      const id = c.id || uuidv4();
      ids.push(id);
      await pool.query(
        `INSERT INTO artifact_connections (id, project_id, from_artifact_id, to_artifact_id, connection_type, label, explanation, confidence, strength, status, created_by_task_id, metadata)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           connection_type = VALUES(connection_type),
           label = COALESCE(?, label),
           explanation = COALESCE(?, explanation),
           confidence = COALESCE(?, confidence),
           strength = COALESCE(?, strength),
           status = COALESCE(?, status),
           updated_at = CURRENT_TIMESTAMP`,
        [
          id, projectId,
          c.fromArtifactId || c.from_artifact_id,
          c.toArtifactId || c.to_artifact_id,
          c.connectionType || c.connection_type || "related_to",
          c.label || null,
          c.explanation || null,
          c.confidence ?? 1.0,
          c.strength ?? 0.5,
          c.status || "active",
          options.taskId || null,
          c.metadata ? JSON.stringify(c.metadata) : null,
          c.label || null,
          c.explanation || null,
          c.confidence ?? null,
          c.strength ?? null,
          c.status || null
        ]
      );
    }
    return ids;
  },

  // ── Connection Evidence (explainability) ──────────────────────────────────

  saveConnectionEvidence: async (projectId, evidenceList) => {
    if (!evidenceList || evidenceList.length === 0) return;

    for (const e of evidenceList) {
      await pool.query(
        `INSERT INTO connection_evidence (id, project_id, connection_id, source_id, chunk_id, artifact_id, quote, explanation, metadata)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          uuidv4(),
          projectId,
          e.connectionId,
          e.sourceId || null,
          e.chunkId || null,
          e.artifactId || null,
          e.quote || null,
          e.explanation || null,
          e.metadata ? JSON.stringify(e.metadata) : null
        ]
      );
    }
  },

  // ── Refinery Runs ──────────────────────────────────────────────────────────

  createRun: async (projectId, trigger, status = "running") => {
    const id = uuidv4();
    await pool.query(
      `INSERT INTO refinery_runs (id, project_id, \`trigger\`, status, started_at)
       VALUES (?, ?, ?, ?, CASE WHEN ? = 'running' THEN NOW() ELSE NULL END)`,
      [id, projectId, trigger, status, status]
    );
    return id;
  },

  updateRun: async (runId, updates) => {
    const fields = [];
    const params = [];

    if (updates.status) { fields.push("status = ?"); params.push(updates.status); }
    if (updates.stagesCompleted) { fields.push("stages_completed = ?"); params.push(JSON.stringify(updates.stagesCompleted)); }
    if (updates.stagesFailed) { fields.push("stages_failed = ?"); params.push(JSON.stringify(updates.stagesFailed)); }
    if (updates.modelsUsed) { fields.push("models_used = ?"); params.push(JSON.stringify(updates.modelsUsed)); }
    if (updates.totalCost !== undefined) { fields.push("total_estimated_cost = ?"); params.push(updates.totalCost); }
    if (updates.durationMs !== undefined) { fields.push("duration_ms = ?"); params.push(updates.durationMs); }
    if (updates.completedAt) { fields.push("completed_at = ?"); params.push(updates.completedAt); }
    if (updates.errorMessage) { fields.push("error_message = ?"); params.push(updates.errorMessage); }

    if (fields.length === 0) return;

    params.push(runId);
    await pool.query(`UPDATE refinery_runs SET ${fields.join(", ")} WHERE id = ?`, params);
  },

  completeRun: async (runId, result) => {
    await pool.query(
      `UPDATE refinery_runs SET status = ?, stages_completed = ?, stages_failed = ?, models_used = ?, total_estimated_cost = ?, duration_ms = ?, completed_at = NOW() WHERE id = ?`,
      [
        result.success ? "completed" : "failed",
        JSON.stringify(result.completedNodes || []),
        JSON.stringify(result.failedNodes || []),
        JSON.stringify(result.modelsUsed || []),
        result.totalCost || 0,
        result.durationMs || 0,
        runId
      ]
    );
  },

  // ── Model Versions ─────────────────────────────────────────────────────────

  buildModelVersion: async (projectId, runId, modelData) => {
    const id = uuidv4();

    const [versions] = await pool.query(
      "SELECT MAX(version_number) AS max_version FROM refinery_model_versions WHERE project_id = ?",
      [projectId]
    );
    const version = (versions[0]?.max_version || 0) + 1;

    await pool.query(
      `INSERT INTO refinery_model_versions (id, project_id, run_id, version_number, status, summary, model_data)
       VALUES (?, ?, ?, ?, 'active', ?, ?)`,
      [
        id, projectId, runId, version,
        modelData.summary || `Version ${version}`,
        JSON.stringify(modelData)
      ]
    );

    return { id, version };
  },

  // ── Views ──────────────────────────────────────────────────────────────────

  saveView: async (projectId, modelVersionId, viewData, options = {}) => {
    const id = uuidv4();

    await pool.query(
      `INSERT INTO views (id, project_id, model_version_id, view_type, title, structure, content, status, created_by_task_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        projectId,
        modelVersionId,
        viewData.viewType || "report",
        viewData.title || "Untitled View",
        viewData.structure ? JSON.stringify(viewData.structure) : null,
        viewData.content ? JSON.stringify(viewData.content) : null,
        "complete",
        options.taskId || null
      ]
    );

    return id;
  },

  // ── Project Status ─────────────────────────────────────────────────────────

  updateProjectStatus: async (projectId, status) => {
    await pool.query(
      "UPDATE projects SET status = ? WHERE id = ?",
      [status, projectId]
    );
  }
};

module.exports = persist;
