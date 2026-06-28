const db = require("../../config/db");
const { successResponse, errorResponse } = require("../../middleware/apiResponse");
const { getRequestLogs } = require("../services/requestLogService");
const { listAdminAuditLogs } = require("../services/adminAuditService");

const getPlatformOverview = async (req, res) => {
  try {
    const [accounts] = await db.promise().query(
      "SELECT COUNT(*) AS total, SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) AS active FROM accounts"
    );
    const [projects] = await db.promise().query(
      "SELECT COUNT(*) AS total, SUM(CASE WHEN status != 'archived' THEN 1 ELSE 0 END) AS active FROM projects"
    );
    const [usage] = await db.promise().query(
      `SELECT COALESCE(SUM(credits_charged), 0) AS totalCredits,
              COALESCE(SUM(input_tokens), 0) AS totalInputTokens,
              COALESCE(SUM(output_tokens), 0) AS totalOutputTokens
       FROM usage_events WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)`
    );
    const [subscriptions] = await db.promise().query(
      `SELECT p.name AS planName, COUNT(*) AS count
       FROM subscriptions s JOIN plans p ON p.id = s.plan_id
       WHERE s.status = 'active' GROUP BY p.name`
    );
    const [recentErrors] = await db.promise().query(
      `SELECT COUNT(*) AS count FROM refinery_runs WHERE status = 'failed' AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)`
    );
    return successResponse(res, {
      accounts: accounts[0],
      projects: projects[0],
      usage30d: usage[0],
      activeSubscriptions: subscriptions,
      recentRunErrors7d: recentErrors[0].count,
    }, { requestId: req.requestId });
  } catch (err) {
    return errorResponse(res, 500, err.message, { requestId: req.requestId });
  }
};

const getUsageAnalytics = async (req, res) => {
  try {
    const days = parseInt(req.query.days, 10) || 30;
    const [dailyUsage] = await db.promise().query(
      `SELECT DATE(created_at) AS date, SUM(credits_charged) AS credits,
              SUM(input_tokens) AS inputTokens, SUM(output_tokens) AS outputTokens,
              COUNT(*) AS requests
       FROM usage_events
       WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
       GROUP BY DATE(created_at)
       ORDER BY date ASC`,
      [days]
    );
    const [byFeature] = await db.promise().query(
      `SELECT feature_type AS feature, SUM(credits_charged) AS credits, COUNT(*) AS count
       FROM usage_events WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
       GROUP BY feature_type ORDER BY credits DESC`,
      [days]
    );
    const [byAccount] = await db.promise().query(
      `SELECT ue.account_id AS accountId, a.name AS accountName, SUM(ue.credits_charged) AS credits
       FROM usage_events ue JOIN accounts a ON a.id = ue.account_id
       WHERE ue.created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
       GROUP BY ue.account_id ORDER BY credits DESC LIMIT 20`,
      [days]
    );
    return successResponse(res, { daily: dailyUsage, byFeature, topAccounts: byAccount }, { requestId: req.requestId });
  } catch (err) {
    return errorResponse(res, 500, err.message, { requestId: req.requestId });
  }
};

const getCostAnalytics = async (req, res) => {
  try {
    const days = parseInt(req.query.days, 10) || 30;
    const [byModel] = await db.promise().query(
      `SELECT provider, model, SUM(input_tokens) AS inputTokens,
              SUM(output_tokens) AS outputTokens, COUNT(*) AS requests
       FROM usage_events
       WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY) AND provider IS NOT NULL
       GROUP BY provider, model
       ORDER BY requests DESC`,
      [days]
    );
    const [byProvider] = await db.promise().query(
      `SELECT provider, SUM(input_tokens) AS inputTokens,
              SUM(output_tokens) AS outputTokens, COUNT(*) AS requests
       FROM usage_events
       WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY) AND provider IS NOT NULL
       GROUP BY provider
       ORDER BY requests DESC`,
      [days]
    );
    return successResponse(res, { byModel, byProvider }, { requestId: req.requestId });
  } catch (err) {
    return errorResponse(res, 500, err.message, { requestId: req.requestId });
  }
};

const getRequestLogsAdmin = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 100;
    const offset = parseInt(req.query.offset, 10) || 0;
    const logs = await getRequestLogs({ accountId: req.query.accountId, limit, offset });
    return successResponse(res, logs, { requestId: req.requestId });
  } catch (err) {
    return errorResponse(res, 500, err.message, { requestId: req.requestId });
  }
};

const getAdminAuditLogs = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 100;
    const logs = await listAdminAuditLogs({ limit });
    return successResponse(res, logs, { requestId: req.requestId });
  } catch (err) {
    return errorResponse(res, 500, err.message, { requestId: req.requestId });
  }
};

module.exports = {
  getPlatformOverview,
  getUsageAnalytics,
  getCostAnalytics,
  getRequestLogsAdmin,
  getAdminAuditLogs,
};
