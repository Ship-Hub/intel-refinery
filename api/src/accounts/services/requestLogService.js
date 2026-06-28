const crypto = require("crypto");
const db = require("../../config/db");

const logRequest = async ({ accountId, apiKeyId, method, path, statusCode, durationMs, ipAddress, userAgent, idempotencyKey }) => {
  const id = crypto.randomUUID();
  await db.promise().query(
    `INSERT INTO request_logs (id, account_id, api_key_id, method, path, status_code, duration_ms, ip_address, user_agent, idempotency_key)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, accountId || null, apiKeyId || null, method, path, statusCode || null, durationMs || null, ipAddress || null, userAgent || null, idempotencyKey || null]
  );
  return id;
};

const getRequestLogs = async ({ accountId, limit = 100, offset = 0, startDate, endDate } = {}) => {
  const where = [];
  const params = [];
  if (accountId) {
    where.push("account_id = ?");
    params.push(accountId);
  }
  if (startDate) {
    where.push("created_at >= ?");
    params.push(startDate);
  }
  if (endDate) {
    where.push("created_at <= ?");
    params.push(endDate);
  }
  params.push(limit, offset);
  const [rows] = await db.promise().query(
    `SELECT id, account_id AS accountId, api_key_id AS apiKeyId, method, path,
            status_code AS statusCode, duration_ms AS durationMs,
            ip_address AS ipAddress, user_agent AS userAgent,
            idempotency_key AS idempotencyKey, created_at AS createdAt
     FROM request_logs
     ${where.length ? "WHERE " + where.join(" AND ") : ""}
     ORDER BY created_at DESC
     LIMIT ? OFFSET ?`,
    params
  );
  return rows;
};

module.exports = {
  logRequest,
  getRequestLogs,
};
