const db = require("../../config/db");
const { getPlanById } = require("./planService");

const getEffectiveEntitlement = async (accountId, feature) => {
  const [rows] = await db.promise().query(
    `SELECT limit_value, overage_allowed, overage_cost_per_unit_cents
     FROM entitlements
     WHERE account_id = ? AND feature = ?
       AND effective_from <= NOW()
       AND (effective_until IS NULL OR effective_until > NOW())
     ORDER BY effective_from DESC
     LIMIT 1`,
    [accountId, feature]
  );
  return rows[0] || null;
};

const getPlanLimits = async (accountId) => {
  const [rows] = await db.promise().query(
    `SELECT p.max_projects, p.max_sources_per_project, p.max_workspaces,
            p.max_api_keys, p.max_webhooks, p.max_team_members,
            p.retention_days, p.rate_limit_per_key, p.rate_limit_window_ms,
            p.monthly_credits, p.entitlements, p.features, p.rate_limits,
            p.webhook_signing_enabled, p.custom_domains_allowed, p.priority_support
     FROM subscriptions s
     JOIN plans p ON p.id = s.plan_id
     WHERE s.account_id = ? AND s.status IN ('active', 'trialing')
     ORDER BY s.created_at DESC
     LIMIT 1`,
    [accountId]
  );
  return rows[0] || null;
};

const checkQuota = async (accountId, feature, requiredCount = 1) => {
  const planLimits = await getPlanLimits(accountId);
  if (!planLimits) {
    return { allowed: false, reason: "No active subscription" };
  }
  const entitlement = await getEffectiveEntitlement(accountId, feature);
  const limit = entitlement ? entitlement.limit_value : getDefaultLimit(feature, planLimits);
  if (limit === -1) {
    return { allowed: true, limit, used: 0 };
  }
  const used = await countUsed(accountId, feature);
  const remaining = Math.max(0, limit - used);
  if (used + requiredCount > limit) {
    return {
      allowed: false,
      reason: `Quota exceeded for ${feature}: ${used} used of ${limit}`,
      limit,
      used,
      remaining
    };
  }
  return { allowed: true, limit, used, remaining };
};

const getDefaultLimit = (feature, planLimits) => {
  const featureMap = {
    projects: planLimits.max_projects,
    sources_per_project: planLimits.max_sources_per_project,
    workspaces: planLimits.max_workspaces,
    api_keys: planLimits.max_api_keys,
    webhooks: planLimits.max_webhooks,
    team_members: planLimits.max_team_members,
  };
  return featureMap[feature] !== undefined ? featureMap[feature] : -1;
};

const countUsed = async (accountId, feature) => {
  const queries = {
    projects: `SELECT COUNT(*) AS cnt FROM projects WHERE account_id = ? AND status != 'archived'`,
    api_keys: `SELECT COUNT(*) AS cnt FROM api_keys WHERE account_id = ? AND revoked_at IS NULL`,
    webhooks: `SELECT COUNT(*) AS cnt FROM webhook_endpoints WHERE account_id = ? AND is_active = 1`,
    workspaces: `SELECT COUNT(*) AS cnt FROM workspaces WHERE account_id = ? AND status = 'active'`,
  };
  const sql = queries[feature];
  if (!sql) return 0;
  const [rows] = await db.promise().query(sql, [accountId]);
  return rows[0].cnt;
};

const checkFeatureEnabled = async (accountId, feature) => {
  const planLimits = await getPlanLimits(accountId);
  if (!planLimits) return false;
  const features = typeof planLimits.features === "string" ? JSON.parse(planLimits.features) : planLimits.features;
  return features && features[feature] === true;
};

module.exports = {
  getEffectiveEntitlement,
  getPlanLimits,
  checkQuota,
  checkFeatureEnabled,
  countUsed,
};
