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
  listPayments
} = require(
  "../services/paymentService"
);
const {
  requireCustomerAccount
} = require(
  "../../accounts/controllers/customerAccountController"
);

const getMyPayments =
  async (
    req,
    res
  ) => {
    try {
      const account =
        await requireCustomerAccount(
          req
        );
      return successResponse(
        res,
        await listPayments({
          accountId:
            account.id,
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
        404,
        error.message,
        {
          requestId:
            req.requestId
        }
      );
    }
  };

const createMyCheckout =
  async (
    req,
    res
  ) => {
    try {
      const account =
        await requireCustomerAccount(
          req
        );
      return successResponse(
        res,
        await createCheckout({
          ...req.validatedBody,
          accountId:
            account.id
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
  getMyPayments,
  createMyCheckout
};
