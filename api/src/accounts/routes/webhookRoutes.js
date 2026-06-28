const express = require("express");
const { validateRequest } = require("../../middleware/validateRequest");
const { createWebhookSchema, updateWebhookSchema } = require("../validators/webhookSchemas");
const {
  getWebhooks,
  getWebhook,
  createWebhook,
  updateWebhookById,
  deleteWebhook,
  getWebhookDeliveries,
} = require("../controllers/webhookController");

const router = express.Router();

router.get("/", getWebhooks);
router.get("/:webhookId", getWebhook);
router.post("/", validateRequest(createWebhookSchema), createWebhook);
router.put("/:webhookId", validateRequest(updateWebhookSchema), updateWebhookById);
router.delete("/:webhookId", deleteWebhook);
router.get("/:webhookId/deliveries", getWebhookDeliveries);

module.exports = router;
