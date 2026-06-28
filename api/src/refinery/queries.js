const pool = require("../config/db").promise();

const parseRow = (row) => ({
  ...row,
  ...(row.content && typeof row.content === "string" ? { content: JSON.parse(row.content) } : {}),
  ...(row.metadata && typeof row.metadata === "string" ? { metadata: JSON.parse(row.metadata) } : {}),
  ...(row.model_data && typeof row.model_data === "string" ? { model_data: JSON.parse(row.model_data) } : {}),
  ...(row.structure && typeof row.structure === "string" ? { structure: JSON.parse(row.structure) } : {})
});

const queries = {
  // ── Artifacts ──────────────────────────────────────────────────────────────

  getArtifacts: async (projectId, filters = {}) => {
    let query = "SELECT * FROM artifacts WHERE project_id = ?";
    const params = [projectId];

    if (filters.type) {
      query += " AND artifact_type = ?";
      params.push(filters.type);
    }
    if (filters.status) {
      query += " AND status = ?";
      params.push(filters.status);
    }
    if (filters.search) {
      query += " AND (title LIKE ? OR summary LIKE ?)";
      params.push(`%${filters.search}%`, `%${filters.search}%`);
    }

    query += " ORDER BY importance DESC, confidence DESC";

    if (filters.limit) {
      query += " LIMIT ?";
      params.push(parseInt(filters.limit, 10));
    }
    if (filters.offset) {
      query += " OFFSET ?";
      params.push(parseInt(filters.offset, 10));
    }

    const [rows] = await pool.query(query, params);
    return rows.map(parseRow);
  },

  getArtifactById: async (artifactId) => {
    const [rows] = await pool.query("SELECT * FROM artifacts WHERE id = ?", [artifactId]);
    if (rows.length === 0) return null;

    const artifact = parseRow(rows[0]);

    const [evidence] = await pool.query(
      `SELECT ae.*, s.original_name AS source_name
       FROM artifact_evidence ae
       LEFT JOIN sources s ON s.id = ae.source_id
       WHERE ae.artifact_id = ?
       ORDER BY ae.created_at`,
      [artifactId]
    );
    artifact.evidence = evidence;

    const [connections] = await pool.query(
      `SELECT ac.*, a_from.title AS from_title, a_to.title AS to_title
       FROM artifact_connections ac
       LEFT JOIN artifacts a_from ON a_from.id = ac.from_artifact_id
       LEFT JOIN artifacts a_to ON a_to.id = ac.to_artifact_id
       WHERE ac.from_artifact_id = ? OR ac.to_artifact_id = ?
       ORDER BY ac.connection_type`,
      [artifactId, artifactId]
    );
    artifact.connections = connections;

    return artifact;
  },

  getArtifactTypes: async (projectId) => {
    const [rows] = await pool.query(
      "SELECT DISTINCT artifact_type, COUNT(*) AS count FROM artifacts WHERE project_id = ? AND artifact_type IS NOT NULL GROUP BY artifact_type ORDER BY count DESC",
      [projectId]
    );
    return rows;
  },

  // ── Connections ────────────────────────────────────────────────────────────

  getConnections: async (projectId, filters = {}) => {
    let query = `SELECT ac.*, a_from.title AS from_title, a_to.title AS to_title
                 FROM artifact_connections ac
                 LEFT JOIN artifacts a_from ON a_from.id = ac.from_artifact_id
                 LEFT JOIN artifacts a_to ON a_to.id = ac.to_artifact_id
                 WHERE ac.project_id = ?`;
    const params = [projectId];

    if (filters.type) {
      query += " AND ac.connection_type = ?";
      params.push(filters.type);
    }
    if (filters.status) {
      query += " AND ac.status = ?";
      params.push(filters.status);
    }
    if (filters.fromArtifactId) {
      query += " AND ac.from_artifact_id = ?";
      params.push(filters.fromArtifactId);
    }
    if (filters.toArtifactId) {
      query += " AND ac.to_artifact_id = ?";
      params.push(filters.toArtifactId);
    }

    query += " ORDER BY ac.confidence DESC, ac.created_at DESC";

    if (filters.limit) {
      query += " LIMIT ?";
      params.push(parseInt(filters.limit, 10));
    }

    const [rows] = await pool.query(query, params);
    return rows.map(parseRow);
  },

  getConnectionById: async (connectionId) => {
    const [rows] = await pool.query(
      `SELECT ac.*, a_from.title AS from_title, a_to.title AS to_title
       FROM artifact_connections ac
       LEFT JOIN artifacts a_from ON a_from.id = ac.from_artifact_id
       LEFT JOIN artifacts a_to ON a_to.id = ac.to_artifact_id
       WHERE ac.id = ?`,
      [connectionId]
    );
    if (rows.length === 0) return null;

    const connection = parseRow(rows[0]);

    const [evidence] = await pool.query(
      `SELECT ce.*, s.original_name AS source_name
       FROM connection_evidence ce
       LEFT JOIN sources s ON s.id = ce.source_id
       WHERE ce.connection_id = ?`,
      [connectionId]
    );
    connection.evidence = evidence;

    return connection;
  },

  getConnectionTypes: async (projectId) => {
    const [rows] = await pool.query(
      "SELECT DISTINCT connection_type, COUNT(*) AS count FROM artifact_connections WHERE project_id = ? GROUP BY connection_type ORDER BY count DESC",
      [projectId]
    );
    return rows;
  },

  // ── Model Versions ─────────────────────────────────────────────────────────

  getModelVersions: async (projectId) => {
    const [rows] = await pool.query(
      `SELECT rmv.id, rmv.project_id, rmv.run_id, rmv.version_number, rmv.status, rmv.summary, rmv.created_at,
              rr.trigger, rr.duration_ms, rr.total_estimated_cost
       FROM refinery_model_versions rmv
       LEFT JOIN refinery_runs rr ON rr.id = rmv.run_id
       WHERE rmv.project_id = ?
       ORDER BY rmv.version_number DESC`,
      [projectId]
    );
    return rows;
  },

  getModelVersionById: async (versionId) => {
    const [rows] = await pool.query(
      `SELECT rmv.*, rr.trigger, rr.duration_ms, rr.total_estimated_cost, rr.stages_completed, rr.models_used
       FROM refinery_model_versions rmv
       LEFT JOIN refinery_runs rr ON rr.id = rmv.run_id
       WHERE rmv.id = ?`,
      [versionId]
    );
    if (rows.length === 0) return null;
    return parseRow(rows[0]);
  },

  getLatestModelVersion: async (projectId) => {
    const [rows] = await pool.query(
      `SELECT rmv.*, rr.trigger, rr.duration_ms, rr.total_estimated_cost
       FROM refinery_model_versions rmv
       LEFT JOIN refinery_runs rr ON rr.id = rmv.run_id
       WHERE rmv.project_id = ? AND rmv.status = 'active'
       ORDER BY rmv.version_number DESC LIMIT 1`,
      [projectId]
    );
    if (rows.length === 0) return null;
    return parseRow(rows[0]);
  },

  // ── Views ──────────────────────────────────────────────────────────────────

  getViews: async (projectId) => {
    const [rows] = await pool.query(
      `SELECT v.id, v.project_id, v.model_version_id, v.view_type, v.title, v.status, v.created_at, v.updated_at,
              rmv.version_number
       FROM views v
       LEFT JOIN refinery_model_versions rmv ON rmv.id = v.model_version_id
       WHERE v.project_id = ?
       ORDER BY v.created_at DESC`,
      [projectId]
    );
    return rows;
  },

  getViewById: async (viewId) => {
    const [rows] = await pool.query(
      `SELECT v.*, rmv.version_number
       FROM views v
       LEFT JOIN refinery_model_versions rmv ON rmv.id = v.model_version_id
       WHERE v.id = ?`,
      [viewId]
    );
    if (rows.length === 0) return null;
    return parseRow(rows[0]);
  },

  // ── Runs ───────────────────────────────────────────────────────────────────

  getRuns: async (projectId) => {
    const [rows] = await pool.query(
      `SELECT rr.*, rmv.version_number AS created_model_version
       FROM refinery_runs rr
       LEFT JOIN refinery_model_versions rmv ON rmv.run_id = rr.id
       WHERE rr.project_id = ?
       ORDER BY rr.created_at DESC`,
      [projectId]
    );
    return rows;
  },

  getRunById: async (runId) => {
    const [rows] = await pool.query(
      `SELECT rr.*, rmv.version_number AS created_model_version
       FROM refinery_runs rr
       LEFT JOIN refinery_model_versions rmv ON rmv.run_id = rr.id
       WHERE rr.id = ?`,
      [runId]
    );
    if (rows.length === 0) return null;
    return parseRow(rows[0]);
  },

  // ── Model Overview (aggregated counts for dashboard) ──────────────────────

  getModelOverview: async (projectId) => {
    const [artifactCounts] = await pool.query(
      `SELECT artifact_type, COUNT(*) AS count, AVG(confidence) AS avg_confidence
       FROM artifacts WHERE project_id = ? AND status = 'active'
       GROUP BY artifact_type ORDER BY count DESC`,
      [projectId]
    );

    const [connectionCounts] = await pool.query(
      `SELECT connection_type, COUNT(*) AS count
       FROM artifact_connections WHERE project_id = ? AND status = 'active'
       GROUP BY connection_type ORDER BY count DESC`,
      [projectId]
    );

    const [totalSources] = await pool.query(
      "SELECT COUNT(*) AS count FROM sources WHERE project_id = ?",
      [projectId]
    );

    const [totalChunks] = await pool.query(
      "SELECT COUNT(*) AS count FROM source_chunks WHERE project_id = ?",
      [projectId]
    );

    const [totalArtifacts] = await pool.query(
      "SELECT COUNT(*) AS count FROM artifacts WHERE project_id = ? AND status = 'active'",
      [projectId]
    );

    const [totalConnections] = await pool.query(
      "SELECT COUNT(*) AS count FROM artifact_connections WHERE project_id = ? AND status = 'active'",
      [projectId]
    );

    const latestVersion = await queries.getLatestModelVersion(projectId);

    return {
      projectId,
      totalSources: totalSources[0].count,
      totalChunks: totalChunks[0].count,
      totalArtifacts: totalArtifacts[0].count,
      totalConnections: totalConnections[0].count,
      artifactTypeBreakdown: artifactCounts,
      connectionTypeBreakdown: connectionCounts,
      latestModelVersion: latestVersion ? {
        id: latestVersion.id,
        versionNumber: latestVersion.version_number,
        summary: latestVersion.summary,
        createdAt: latestVersion.created_at
      } : null
    };
  }
};

module.exports = queries;
