const express = require("express");
const { validateRequest } = require("../../middleware/validateRequest");
const {
  createCheckoutSchema
} = require(
  "../validators/paymentSchemas"
);
const {
  createCheckout
} = require(
  "../controllers/paymentController"
);

const router = express.Router();

router.post("/checkout", validateRequest(createCheckoutSchema), createCheckout);

module.exports = router;
