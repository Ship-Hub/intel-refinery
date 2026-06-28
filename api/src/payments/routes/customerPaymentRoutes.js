const express =
  require("express");
const {
  sessionAuth
} = require(
  "../../middleware/sessionAuth"
);
const {
  validateRequest
} = require(
  "../../middleware/validateRequest"
);
const {
  createCheckoutSchema
} = require(
  "../validators/paymentSchemas"
);
const {
  getMyPayments,
  createMyCheckout
} = require(
  "../controllers/customerPaymentController"
);

const router =
  express.Router();

router.use(
  sessionAuth
);
router.get(
  "/payments",
  getMyPayments
);
router.post(
  "/checkout",
  validateRequest(
    createCheckoutSchema
      .omit({
        accountId:
          true
      })
  ),
  createMyCheckout
);

module.exports =
  router;
