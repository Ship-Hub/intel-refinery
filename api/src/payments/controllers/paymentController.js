const {
  successResponse,
  errorResponse
} = require(
  "../../middleware/apiResponse"
);
const {
  createCheckout: createCheckoutSession
} = require(
  "../services/checkoutService"
);

const createCheckout = async (req, res) => {
  try {
    return successResponse(
      res,
      await createCheckoutSession(
        req.validatedBody
      ),
      { requestId: req.requestId }
    );
  } catch (error) {
    return errorResponse(
      res,
      500,
      error.message,
      {
        requestId:
          req.requestId
      }
    );
  }
};

module.exports = { createCheckout };
