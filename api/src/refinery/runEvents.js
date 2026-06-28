const { v4: uuidv4 } = require("uuid");
const db = require("../config/db");

const parsePayload = (value) => {
  if (!value || typeof value === "object") return value;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

const appendRunEvent = async ({
  runId,
  projectId,
  eventType,
  stage = null,
  message = null,
  payload = null,
}) => {
  if (!runId || !projectId || !eventType) return null;

  const event = {
    id: uuidv4(),
    runId,
    projectId,
    eventType,
    stage,
    message,
    payload,
    createdAt: new Date().toISOString(),
  };

  await db.promise().query(
    `INSERT INTO refinery_run_events (id, run_id, project_id, event_type, stage, message, payload)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      event.id,
      runId,
      projectId,
      eventType,
      stage,
      message,
      payload ? JSON.stringify(payload) : null,
    ]
  );

  return event;
};

const listRunEvents = async (runId, { afterId = null, limit = 100 } = {}) => {
  const params = [runId];
  let where = "WHERE run_id = ?";
  if (afterId) {
    where += " AND created_at > (SELECT created_at FROM refinery_run_events WHERE id = ? LIMIT 1)";
    params.push(afterId);
  }
  params.push(limit);

  const [rows] = await db.promise().query(
    `SELECT id, run_id AS runId, project_id AS projectId, event_type AS eventType,
            stage, message, payload, created_at AS createdAt
     FROM refinery_run_events
     ${where}
     ORDER BY created_at ASC, id ASC
     LIMIT ?`,
    params
  );

  return rows.map((row) => ({
    ...row,
    payload: parsePayload(row.payload),
  }));
};

module.exports = {
  appendRunEvent,
  listRunEvents,
};
