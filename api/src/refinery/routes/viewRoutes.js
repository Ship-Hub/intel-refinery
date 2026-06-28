const express = require("express");
const queries = require("../queries");

const router = express.Router();

router.get("/:projectId/views", async (req, res) => {
  try {
    const data = await queries.getViews(req.params.projectId);
    res.json({ success: true, data });
  } catch (err) {
    req.log.error(err, "Failed to get views");
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get("/:projectId/views/:viewId", async (req, res) => {
  try {
    const data = await queries.getViewById(req.params.viewId);
    if (!data) {
      return res.status(404).json({ success: false, error: "View not found" });
    }
    res.json({ success: true, data });
  } catch (err) {
    req.log.error(err, "Failed to get view");
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
