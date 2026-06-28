const express = require("express");
const { requirePlatformAdmin } = require("../../middleware/platformAdminAuth");
const {
  getPlatformOverview,
  getUsageAnalytics,
  getCostAnalytics,
  getRequestLogsAdmin,
} = require("../controllers/adminAnalyticsController");

const router = express.Router();

router.use(requirePlatformAdmin);

router.get("/overview", getPlatformOverview);
router.get("/usage", getUsageAnalytics);
router.get("/costs", getCostAnalytics);
router.get("/request-logs", getRequestLogsAdmin);

module.exports = router;
