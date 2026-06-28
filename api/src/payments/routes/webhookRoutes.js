const express =
  require("express");
const {
  handleStripeWebhook,
  handlePaystackWebhook,
  handleCoinbaseWebhook
} = require(
  "../controllers/webhookController"
);

const router =
  express.Router();

router.post(
  "/stripe",
  handleStripeWebhook
);
router.post(
  "/paystack",
  handlePaystackWebhook
);
router.post(
  "/coinbase-commerce",
  handleCoinbaseWebhook
);

module.exports =
  router;
