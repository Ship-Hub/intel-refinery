const express = require("express");
const queries = require("../queries");

const router = express.Router();

router.get("/:projectId/connections", async (req, res) => {
  try {
    const { type, status, fromArtifactId, toArtifactId, limit } = req.query;
    const data = await queries.getConnections(req.params.projectId, {
      type, status, fromArtifactId, toArtifactId, limit
    });
    res.json({ success: true, data });
  } catch (err) {
    req.log.error(err, "Failed to get connections");
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get("/:projectId/connections/types", async (req, res) => {
  try {
    const data = await queries.getConnectionTypes(req.params.projectId);
    res.json({ success: true, data });
  } catch (err) {
    req.log.error(err, "Failed to get connection types");
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get("/:projectId/connections/:connectionId", async (req, res) => {
  try {
    const data = await queries.getConnectionById(req.params.connectionId);
    if (!data) {
      return res.status(404).json({ success: false, error: "Connection not found" });
    }
    res.json({ success: true, data });
  } catch (err) {
    req.log.error(err, "Failed to get connection");
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
