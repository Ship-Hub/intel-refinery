const db = require("../config/db");

const requireScope = (...requiredScopes) => {
  return async (req, res, next) => {
    const apiKeyId = req.apiKey?.id || req.apiClient?.id;
    if (!apiKeyId) {
      return next();
    }
    try {
      const [rows] = await db.promise().query(
        "SELECT scope FROM api_key_scopes WHERE api_key_id = ?",
        [apiKeyId]
      );
      const grantedScopes = rows.map(r => r.scope);
      const hasAll = requiredScopes.every(s => grantedScopes.includes(s));
      if (!hasAll) {
        return res.status(403).json({
          success: false,
          error: `Required scopes: ${requiredScopes.join(", ")}. Key has: ${grantedScopes.join(", ") || "none"}`
        });
      }
      next();
    } catch (err) {
      req.log?.warn?.({ event: "scope_check_error", error: err.message });
      next();
    }
  };
};

module.exports = { requireScope };
