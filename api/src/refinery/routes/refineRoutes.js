const express = require("express");
const { processProject, reprocessFromNode } = require("../../processing/pipeline");
const pool = require("../../config/db").promise();

const router = express.Router();

router.post("/:projectId/refine", async (req, res) => {
  try {
    const accountId = req.account?.id || req.apiKey?.account_id;
    const [projects] = await pool.query(
      "SELECT id FROM projects WHERE id = ? AND account_id = ?",
      [req.params.projectId, accountId]
    );
    if (projects.length === 0) {
      return res.status(404).json({ success: false, error: "Project not found" });
    }

    const result = await processProject(req.params.projectId, { trigger: "manual" });

    res.json({
      success: result.errors.filter((e) => !e.includes("SKIPPED")).length === 0,
      data: {
        projectId: req.params.projectId,
        runId: result.runId,
        completedNodes: result.completedNodes,
        failedNodes: result.failedNodes,
        errors: result.errors,
        startedAt: result.startedAt,
        finishedAt: result.finishedAt
      }
    });
  } catch (err) {
    req.log.error(err, "Failed to start refinement");
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post("/:projectId/reflection", async (req, res) => {
  try {
    const accountId = req.account?.id || req.apiKey?.account_id;
    const [projects] = await pool.query(
      "SELECT id FROM projects WHERE id = ? AND account_id = ?",
      [req.params.projectId, accountId]
    );
    if (projects.length === 0) {
      return res.status(404).json({ success: false, error: "Project not found" });
    }

    const result = await reprocessFromNode(req.params.projectId, "reflect");

    res.json({
      success: result.errors.filter((e) => !e.includes("SKIPPED")).length === 0,
      data: {
        projectId: req.params.projectId,
        runId: result.runId,
        completedNodes: result.completedNodes,
        errors: result.errors,
        finishedAt: result.finishedAt
      }
    });
  } catch (err) {
    req.log.error(err, "Failed to run reflection");
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get("/:projectId/status", async (req, res) => {
  try {
    const accountId = req.account?.id || req.apiKey?.account_id;
    const [rows] = await pool.query(
      "SELECT id, title, status, source_count, updated_at FROM projects WHERE id = ? AND account_id = ?",
      [req.params.projectId, accountId]
    );
    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: "Project not found" });
    }

    // Get latest run status
    const [runs] = await pool.query(
      "SELECT id, status, stages_completed, stages_failed, error_message, created_at, completed_at FROM refinery_runs WHERE project_id = ? ORDER BY created_at DESC LIMIT 1",
      [req.params.projectId]
    );

    res.json({
      success: true,
      data: {
        project: rows[0],
        latestRun: runs[0] || null
      }
    });
  } catch (err) {
    req.log.error(err, "Failed to get status");
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
