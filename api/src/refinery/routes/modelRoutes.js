const express = require("express");
const queries = require("../queries");

const router = express.Router();

router.get("/:projectId/model", async (req, res) => {
  try {
    const data = await queries.getModelOverview(req.params.projectId);
    res.json({ success: true, data });
  } catch (err) {
    req.log.error(err, "Failed to get model overview");
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get("/:projectId/versions", async (req, res) => {
  try {
    const data = await queries.getModelVersions(req.params.projectId);
    res.json({ success: true, data });
  } catch (err) {
    req.log.error(err, "Failed to get model versions");
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get("/:projectId/versions/latest", async (req, res) => {
  try {
    const data = await queries.getLatestModelVersion(req.params.projectId);
    if (!data) {
      return res.status(404).json({ success: false, error: "No model version found" });
    }
    res.json({ success: true, data });
  } catch (err) {
    req.log.error(err, "Failed to get latest model version");
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get("/:projectId/versions/:versionId", async (req, res) => {
  try {
    const data = await queries.getModelVersionById(req.params.versionId);
    if (!data) {
      return res.status(404).json({ success: false, error: "Model version not found" });
    }
    res.json({ success: true, data });
  } catch (err) {
    req.log.error(err, "Failed to get model version");
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get("/:projectId/runs", async (req, res) => {
  try {
    const data = await queries.getRuns(req.params.projectId);
    res.json({ success: true, data });
  } catch (err) {
    req.log.error(err, "Failed to get runs");
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get("/:projectId/runs/:runId", async (req, res) => {
  try {
    const data = await queries.getRunById(req.params.runId);
    if (!data) {
      return res.status(404).json({ success: false, error: "Run not found" });
    }
    res.json({ success: true, data });
  } catch (err) {
    req.log.error(err, "Failed to get run");
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
