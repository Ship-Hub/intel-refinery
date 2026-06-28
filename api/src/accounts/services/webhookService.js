const crypto = require("crypto");
const db = require("../../config/db");
const axios = require("axios");
const { logger } = require("../../logging/logger");

const generateWebhookSecret = () => crypto.randomBytes(32).toString("hex");

const createEndpoint = async ({ accountId, workspaceId, name, url, events, maxRetries, retryIntervalSeconds, description, createdBy }) => {
  const id = crypto.randomUUID();
  const secret = generateWebhookSecret();
  await db.promise().query(
    `INSERT INTO webhook_endpoints (id, account_id, workspace_id, name, url, secret, events, max_retries, retry_interval_seconds, description, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, accountId, workspaceId || null, name, url, secret, JSON.stringify(events), maxRetries || 3, retryIntervalSeconds || 60, description || null, createdBy || null]
  );
  return getEndpointById(id);
};

const getEndpointById = async (id) => {
  const [rows] = await db.promise().query(
    `SELECT id, account_id AS accountId, workspace_id AS workspaceId, name, url, secret,
            events, is_active AS isActive, max_retries AS maxRetries,
            retry_interval_seconds AS retryIntervalSeconds, description,
            created_by AS createdBy, created_at AS createdAt, updated_at AS updatedAt
     FROM webhook_endpoints WHERE id = ?`,
    [id]
  );
  return rows[0] || null;
};

const listEndpoints = async (accountId) => {
  const [rows] = await db.promise().query(
    `SELECT id, account_id AS accountId, workspace_id AS workspaceId, name, url,
            events, is_active AS isActive, max_retries AS maxRetries,
            retry_interval_seconds AS retryIntervalSeconds, description,
            created_at AS createdAt, updated_at AS updatedAt
     FROM webhook_endpoints WHERE account_id = ? ORDER BY created_at DESC`,
    [accountId]
  );
  return rows;
};

const updateEndpoint = async (id, accountId, updates) => {
  const fields = [];
  const values = [];
  const allowed = ["name", "url", "events", "is_active", "max_retries", "retry_interval_seconds", "description"];
  for (const key of allowed) {
    if (updates[key] !== undefined) {
      const col = key.replace(/([A-Z])/g, "_$1").toLowerCase();
      fields.push(`${col} = ?`);
      values.push(key === "events" ? JSON.stringify(updates[key]) : updates[key]);
    }
  }
  if (fields.length === 0) return getEndpointById(id);
  values.push(id, accountId);
  await db.promise().query(
    `UPDATE webhook_endpoints SET ${fields.join(", ")} WHERE id = ? AND account_id = ?`,
    values
  );
  return getEndpointById(id);
};

const deleteEndpoint = async (id, accountId) => {
  const [result] = await db.promise().query(
    "DELETE FROM webhook_endpoints WHERE id = ? AND account_id = ?",
    [id, accountId]
  );
  return result.affectedRows > 0;
};

const signalEvent = async (event, payload, accountId, workspaceId, projectId) => {
  const [endpoints] = await db.promise().query(
    `SELECT id, url, secret, max_retries, retry_interval_seconds
     FROM webhook_endpoints
     WHERE account_id = ? AND is_active = 1
       AND JSON_CONTAINS(events, ?)
       ${workspaceId ? "AND (workspace_id = ? OR workspace_id IS NULL)" : ""}`,
    workspaceId
      ? [accountId, JSON.stringify(event), workspaceId]
      : [accountId, JSON.stringify(event)]
  );
  for (const ep of endpoints) {
    await queueDelivery(ep.id, event, payload, ep.max_retries, ep.retry_interval_seconds);
  }
};

const queueDelivery = async (endpointId, event, payload, maxRetries, retryIntervalSeconds) => {
  const id = crypto.randomUUID();
  await db.promise().query(
    `INSERT INTO webhook_deliveries (id, webhook_endpoint_id, event, payload, max_retries)
     VALUES (?, ?, ?, ?, ?)`,
    [id, endpointId, event, JSON.stringify(payload), maxRetries || 3]
  );
  setImmediate(() => attemptDelivery(id, endpointId, retryIntervalSeconds));
};

const attemptDelivery = async (deliveryId, endpointId, retryIntervalSeconds) => {
  try {
    const [deliveries] = await db.promise().query(
      "SELECT * FROM webhook_deliveries WHERE id = ? AND status IN ('pending','delivering') LIMIT 1",
      [deliveryId]
    );
    if (deliveries.length === 0) return;
    const delivery = deliveries[0];
    const [endpoints] = await db.promise().query(
      "SELECT url, secret FROM webhook_endpoints WHERE id = ? AND is_active = 1 LIMIT 1",
      [endpointId]
    );
    if (endpoints.length === 0) {
      await markDeliveryFailed(deliveryId, "Endpoint inactive or not found");
      return;
    }
    const ep = endpoints[0];
    const timestamp = Math.floor(Date.now() / 1000);
    const payload = typeof delivery.payload === "string" ? JSON.parse(delivery.payload) : delivery.payload;
    const body = JSON.stringify({ event: delivery.event, payload, timestamp, deliveryId });
    const signature = crypto
      .createHmac("sha256", ep.secret)
      .update(body)
      .digest("hex");

    await db.promise().query(
      "UPDATE webhook_deliveries SET status = 'delivering', attempt_count = attempt_count + 1 WHERE id = ?",
      [deliveryId]
    );
    const response = await axios.post(ep.url, body, {
      headers: {
        "Content-Type": "application/json",
        "X-Webhook-Signature": signature,
        "X-Webhook-Timestamp": String(timestamp),
        "X-Webhook-Delivery-Id": deliveryId,
        "User-Agent": "intel-refinery-webhook/1.0",
      },
      timeout: 10000,
    });
    await db.promise().query(
      `UPDATE webhook_deliveries SET status = 'delivered', response_status_code = ?, response_body = ?, delivered_at = NOW(), completed_at = NOW()
       WHERE id = ?`,
      [response.status, String(response.data || "").slice(0, 5000), deliveryId]
    );
  } catch (err) {
    await scheduleRetry(deliveryId, endpointId, retryIntervalSeconds, err.message);
  }
};

const scheduleRetry = async (deliveryId, endpointId, retryIntervalSeconds, errorMessage) => {
  const [deliveries] = await db.promise().query(
    "SELECT attempt_count, max_retries FROM webhook_deliveries WHERE id = ? LIMIT 1",
    [deliveryId]
  );
  if (deliveries.length === 0) return;
  const d = deliveries[0];
  if (d.attempt_count >= d.max_retries) {
    await db.promise().query(
      "UPDATE webhook_deliveries SET status = 'permanently_failed', error_message = ?, completed_at = NOW() WHERE id = ?",
      [errorMessage, deliveryId]
    );
    logger.warn({ event: "webhook_permanently_failed", deliveryId, endpointId, error: errorMessage });
    return;
  }
  const nextAttempt = new Date(Date.now() + (retryIntervalSeconds || 60) * 1000);
  await db.promise().query(
    "UPDATE webhook_deliveries SET status = 'failed', error_message = ?, next_attempt_at = ? WHERE id = ?",
    [errorMessage, nextAttempt, deliveryId]
  );
};

const markDeliveryFailed = async (deliveryId, errorMessage) => {
  await db.promise().query(
    "UPDATE webhook_deliveries SET status = 'permanently_failed', error_message = ?, completed_at = NOW() WHERE id = ?",
    [errorMessage, deliveryId]
  );
};

const listDeliveries = async (endpointId, { limit = 50, offset = 0, status } = {}) => {
  const where = ["webhook_endpoint_id = ?"];
  const params = [endpointId];
  if (status) {
    where.push("status = ?");
    params.push(status);
  }
  params.push(limit, offset);
  const [rows] = await db.promise().query(
    `SELECT id, webhook_endpoint_id AS endpointId, event, status, attempt_count AS attemptCount,
            max_retries AS maxRetries, next_attempt_at AS nextAttemptAt,
            delivered_at AS deliveredAt, response_status_code AS responseStatusCode,
            response_body AS responseBody, error_message AS errorMessage,
            completed_at AS completedAt, created_at AS createdAt
     FROM webhook_deliveries
     WHERE ${where.join(" AND ")}
     ORDER BY created_at DESC
     LIMIT ? OFFSET ?`,
    params
  );
  return rows;
};

const listPendingDeliveries = async (batchSize = 10) => {
  const [rows] = await db.promise().query(
    `SELECT wd.id AS deliveryId, wd.webhook_endpoint_id AS endpointId, wd.retry_interval_seconds AS retryIntervalSeconds
     FROM webhook_deliveries wd
     JOIN webhook_endpoints we ON we.id = wd.webhook_endpoint_id AND we.is_active = 1
     WHERE wd.status = 'failed' AND wd.next_attempt_at <= NOW()
     ORDER BY wd.next_attempt_at ASC
     LIMIT ?`,
    [batchSize]
  );
  return rows;
};

module.exports = {
  createEndpoint,
  getEndpointById,
  listEndpoints,
  updateEndpoint,
  deleteEndpoint,
  signalEvent,
  queueDelivery,
  listDeliveries,
  listPendingDeliveries,
  generateWebhookSecret,
};
