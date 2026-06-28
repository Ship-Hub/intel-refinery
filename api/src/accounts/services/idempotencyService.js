const crypto = require("crypto");
const db = require("../../config/db");

const getIdempotentResponse = async (idempotencyKey) => {
  const [rows] = await db.promise().query(
    `SELECT response_status_code AS statusCode, response_body AS body
     FROM idempotency_keys WHERE idempotency_key = ?`,
    [idempotencyKey]
  );
  return rows[0] || null;
};

const storeIdempotentResponse = async ({ idempotencyKey, accountId, method, path, statusCode, body }) => {
  const id = crypto.randomUUID();
  await db.promise().query(
    `INSERT INTO idempotency_keys (id, idempotency_key, account_id, request_method, request_path, response_status_code, response_body)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [id, idempotencyKey, accountId || null, method, path, statusCode, JSON.stringify(body)]
  );
  return id;
};

const cleanupExpiredKeys = async (expiryHours = 24) => {
  const [result] = await db.promise().query(
    "DELETE FROM idempotency_keys WHERE created_at < DATE_SUB(NOW(), INTERVAL ? HOUR)",
    [expiryHours]
  );
  return result.affectedRows;
};

module.exports = {
  getIdempotentResponse,
  storeIdempotentResponse,
  cleanupExpiredKeys,
};
