const express =
  require("express");
const {
  validateRequest
} = require(
  "../../middleware/validateRequest"
);
const {
  requirePlatformAdmin
} = require(
  "../../middleware/platformAdminAuth"
);
const {
  createCheckoutSchema
} = require(
  "../validators/paymentSchemas"
);
const {
  createAdminCheckout,
  getAdminPayments,
  getAdminPaymentAttempts,
  getAdminWebhookEvents
} = require(
  "../controllers/adminPaymentController"
);

const router =
  express.Router();

router.use(
  requirePlatformAdmin
);
router.post(
  "/checkout-sessions",
  validateRequest(
    createCheckoutSchema
  ),
  createAdminCheckout
);
router.get(
  "/",
  getAdminPayments
);
router.get(
  "/attempts",
  getAdminPaymentAttempts
);
router.get(
  "/webhook-events",
  getAdminWebhookEvents
);

module.exports =
  router;
