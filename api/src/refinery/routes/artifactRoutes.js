const express = require("express");
const queries = require("../queries");

const router = express.Router();

router.get("/:projectId/artifacts", async (req, res) => {
  try {
    const { type, status, search, limit, offset } = req.query;
    const data = await queries.getArtifacts(req.params.projectId, { type, status, search, limit, offset });
    res.json({ success: true, data });
  } catch (err) {
    req.log.error(err, "Failed to get artifacts");
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get("/:projectId/artifacts/types", async (req, res) => {
  try {
    const data = await queries.getArtifactTypes(req.params.projectId);
    res.json({ success: true, data });
  } catch (err) {
    req.log.error(err, "Failed to get artifact types");
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get("/:projectId/artifacts/:artifactId", async (req, res) => {
  try {
    const data = await queries.getArtifactById(req.params.artifactId);
    if (!data) {
      return res.status(404).json({ success: false, error: "Artifact not found" });
    }
    res.json({ success: true, data });
  } catch (err) {
    req.log.error(err, "Failed to get artifact");
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get("/:projectId/hypotheses", async (req, res) => {
  try {
    const data = await queries.getArtifacts(req.params.projectId, { type: "hypothesis" });
    res.json({ success: true, data });
  } catch (err) {
    req.log.error(err, "Failed to get hypotheses");
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get("/:projectId/questions", async (req, res) => {
  try {
    const data = await queries.getArtifacts(req.params.projectId, { type: "question" });
    res.json({ success: true, data });
  } catch (err) {
    req.log.error(err, "Failed to get questions");
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get("/:projectId/people", async (req, res) => {
  try {
    const data = await queries.getArtifacts(req.params.projectId, { type: "person" });
    res.json({ success: true, data });
  } catch (err) {
    req.log.error(err, "Failed to get people");
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get("/:projectId/events", async (req, res) => {
  try {
    const data = await queries.getArtifacts(req.params.projectId, { type: "event" });
    res.json({ success: true, data });
  } catch (err) {
    req.log.error(err, "Failed to get events");
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get("/:projectId/gaps", async (req, res) => {
  try {
    const data = await queries.getArtifacts(req.params.projectId, { type: "knowledge_gap" });
    res.json({ success: true, data });
  } catch (err) {
    req.log.error(err, "Failed to get gaps");
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get("/:projectId/insights", async (req, res) => {
  try {
    const data = await queries.getArtifacts(req.params.projectId, { type: "insight" });
    res.json({ success: true, data });
  } catch (err) {
    req.log.error(err, "Failed to get insights");
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get("/:projectId/patterns", async (req, res) => {
  try {
    const data = await queries.getArtifacts(req.params.projectId, { type: "pattern" });
    res.json({ success: true, data });
  } catch (err) {
    req.log.error(err, "Failed to get patterns");
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
