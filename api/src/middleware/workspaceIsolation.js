const db = require("../config/db");

const enforceWorkspaceAccess = (resourceType) => {
  return async (req, res, next) => {
    const accountId = req.account?.id;
    if (!accountId) {
      return res.status(401).json({ success: false, error: "Authentication required" });
    }
    const workspaceId = req.params.workspaceId || req.query.workspace_id || req.body?.workspace_id;
    if (!workspaceId) {
      return next();
    }
    try {
      const [rows] = await db.promise().query(
        "SELECT id FROM workspaces WHERE id = ? AND account_id = ? AND status = 'active' LIMIT 1",
        [workspaceId, accountId]
      );
      if (rows.length === 0) {
        return res.status(403).json({ success: false, error: "Access denied to this workspace" });
      }
      req.workspace = { id: workspaceId };
      next();
    } catch (err) {
      req.log?.warn?.({ event: "workspace_check_error", error: err.message });
      next();
    }
  };
};

const scopeProjectToWorkspace = async (projectId, accountId, workspaceId) => {
  if (!workspaceId) return true;
  const [rows] = await db.promise().query(
    "SELECT id FROM projects WHERE id = ? AND account_id = ? AND workspace_id = ? LIMIT 1",
    [projectId, accountId, workspaceId]
  );
  return rows.length > 0;
};

const scopeSourceToProject = async (sourceId, projectId, accountId) => {
  const [rows] = await db.promise().query(
    `SELECT s.id FROM sources s
     JOIN projects p ON p.id = s.project_id
     WHERE s.id = ? AND s.project_id = ? AND p.account_id = ? LIMIT 1`,
    [sourceId, projectId, accountId]
  );
  return rows.length > 0;
};

module.exports = { enforceWorkspaceAccess, scopeProjectToWorkspace, scopeSourceToProject };
