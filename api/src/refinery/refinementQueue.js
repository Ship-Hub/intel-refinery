const db = require("../config/db");
const { v4: uuidv4 } = require("uuid");
const { logger } = require("../logging/logger");
const { processProject } = require("../processing/pipeline");
const { appendRunEvent } = require("./runEvents");

let timer = null;
let active = false;
let stopping = false;

const POLL_INTERVAL_MS = Number(process.env.REFINERY_QUEUE_POLL_MS || 3000);

const claimNextRun = async () => {
  const [runs] = await db.promise().query(
    `SELECT rr.id, rr.project_id AS projectId, rr.trigger,
            p.intent, rp.profile_key AS profileKey
     FROM refinery_runs rr
     JOIN projects p ON p.id = rr.project_id
     LEFT JOIN refinery_profiles rp ON rp.id = p.refinery_profile_id
     WHERE rr.status = 'queued'
     ORDER BY rr.created_at ASC
     LIMIT 1`
  );
  const run = runs[0];
  if (!run) return null;

  const [result] = await db.promise().query(
    `UPDATE refinery_runs
     SET status = 'running', started_at = COALESCE(started_at, NOW())
     WHERE id = ? AND status = 'queued'`,
    [run.id]
  );

  return result.affectedRows === 1 ? run : null;
};

const processNext = async () => {
  if (active || stopping) return;
  active = true;
  try {
    const run = await claimNextRun();
    if (!run) return;

    await appendRunEvent({
      runId: run.id,
      projectId: run.projectId,
      eventType: "run_started",
      message: "Refinement worker claimed the run.",
    }).catch(() => {});

    await processProject(run.projectId, {
      trigger: run.trigger || "api",
      runId: run.id,
      profileKey: run.profileKey,
      intent: run.intent,
    });
  } catch (err) {
    logger.error({ event: "refinement_queue_error", error: err.message });
  } finally {
    active = false;
  }
};

const enqueueRun = async ({ projectId, trigger = "api" }) => {
  const runId = uuidv4();
  await db.promise().query(
    `INSERT INTO refinery_runs (id, project_id, trigger, status)
     VALUES (?, ?, ?, 'queued')`,
    [runId, projectId, trigger]
  );

  const [runs] = await db.promise().query(
    `SELECT id, project_id AS projectId, trigger, status, created_at AS createdAt
     FROM refinery_runs
     WHERE id = ?
     LIMIT 1`,
    [runId]
  );
  const run = runs[0];

  await appendRunEvent({
    runId,
    projectId,
    eventType: "run_queued",
    message: "Refinement run queued.",
  }).catch(() => {});

  setImmediate(processNext);
  return run || { id: runId, projectId, trigger, status: "queued" };
};

const startRefinementWorker = () => {
  if (timer) return;
  stopping = false;
  timer = setInterval(processNext, POLL_INTERVAL_MS);
  setImmediate(processNext);
  logger.info({ event: "refinement_worker_started", pollIntervalMs: POLL_INTERVAL_MS });
};

const stopRefinementWorker = () => {
  stopping = true;
  if (timer) clearInterval(timer);
  timer = null;
};

module.exports = {
  enqueueRun,
  startRefinementWorker,
  stopRefinementWorker,
  processNext,
};
