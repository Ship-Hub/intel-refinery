const {
  successResponse,
  errorResponse
} = require(
  "../../middleware/apiResponse"
);
const {
  createCheckout
} = require(
  "../services/checkoutService"
);
const {
  listPayments,
  listPaymentAttempts
} = require(
  "../services/paymentService"
);
const {
  listWebhookEvents
} = require(
  "../services/webhookService"
);

const createAdminCheckout =
  async (
    req,
    res
  ) => {
    try {
      return successResponse(
        res,
        await createCheckout(
          req.validatedBody
        ),
        {
          requestId:
            req.requestId
        }
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

const getAdminPayments =
  async (
    req,
    res
  ) => {
    try {
      return successResponse(
        res,
        await listPayments({
          accountId:
            req.query.accountId,
          status:
            req.query.status,
          limit:
            req.query.limit
              ? Number(
                  req.query.limit
                )
              : 100
        }),
        {
          requestId:
            req.requestId
        }
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

const getAdminPaymentAttempts =
  async (
    req,
    res
  ) => {
    try {
      return successResponse(
        res,
        await listPaymentAttempts({
          paymentId:
            req.query.paymentId,
          providerCode:
            req.query.providerCode,
          status:
            req.query.status,
          limit:
            req.query.limit
              ? Number(
                  req.query.limit
                )
              : 100
        }),
        {
          requestId:
            req.requestId
        }
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

const getAdminWebhookEvents =
  async (
    req,
    res
  ) => {
    try {
      return successResponse(
        res,
        await listWebhookEvents({
          providerCode:
            req.query.providerCode,
          limit:
            req.query.limit
              ? Number(
                  req.query.limit
                )
              : 100
        }),
        {
          requestId:
            req.requestId
        }
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

module.exports = {
  createAdminCheckout,
  getAdminPayments,
  getAdminPaymentAttempts,
  getAdminWebhookEvents
};
