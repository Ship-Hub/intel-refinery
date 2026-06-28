const {
  successResponse,
  errorResponse
} = require(
  "../../middleware/apiResponse"
);
const {
  getPrimaryAccountForUser
} = require(
  "../services/membershipService"
);
const {
  getAccountOverviewById
} = require(
  "../services/accountService"
);
const {
  createApiKey,
  listApiKeys,
  revokeApiKey,
  deleteApiKey
} = require(
  "../services/apiKeyService"
);
const {
  listUsageEvents
} = require(
  "../services/usageService"
);

const requireCustomerAccount =
  async (
    req
  ) => {
    const membership =
      await getPrimaryAccountForUser(
        req.userSession.userId
      );

    if (!membership) {
      throw new Error(
        "Account not found"
      );
    }

    return membership;
  };

const revokeMyApiKey =
  async (
    req,
    res
  ) => {
    try {
      const membership =
        await requireCustomerAccount(
          req
        );
      const revoked =
        await revokeApiKey({
          apiKeyId:
            req.params.apiKeyId,
          accountId:
            membership.id
        });

      if (
        !revoked
      ) {
        return errorResponse(
          res,
          404,
          "API key not found",
          {
            requestId:
              req.requestId
          }
        );
      }

      return successResponse(
        res,
        {
          revoked:
            true
        },
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

const deleteMyApiKey =
  async (
    req,
    res
  ) => {
    try {
      const membership =
        await requireCustomerAccount(
          req
        );
      const deleted =
        await deleteApiKey({
          apiKeyId:
            req.params.apiKeyId,
          accountId:
            membership.id
        });

      if (
        !deleted
      ) {
        return errorResponse(
          res,
          404,
          "API key not found",
          {
            requestId:
              req.requestId
          }
        );
      }

      return successResponse(
        res,
        {
          deleted:
            true
        },
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

const getMyAccount =
  async (
    req,
    res
  ) => {
    try {
      const membership =
        await requireCustomerAccount(
          req
        );

      return successResponse(
        res,
        {
          ...await getAccountOverviewById(
            membership.id
          ),
          role:
            membership.role
        },
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

const getMyApiKeys =
  async (
    req,
    res
  ) => {
    try {
      const membership =
        await requireCustomerAccount(
          req
        );
      return successResponse(
        res,
        await listApiKeys(
          membership.id
        ),
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

const createMyApiKey =
  async (
    req,
    res
  ) => {
    try {
      const membership =
        await requireCustomerAccount(
          req
        );
      return successResponse(
        res,
        await createApiKey({
          ...req.validatedBody,
          accountId:
            membership.id,
          createdByUserId:
            req.userSession.userId
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

const getMyUsage =
  async (
    req,
    res
  ) => {
    try {
      const membership =
        await requireCustomerAccount(
          req
        );
      return successResponse(
        res,
        await listUsageEvents({
          accountId:
            membership.id,
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

module.exports = {
  getMyAccount,
  getMyApiKeys,
  createMyApiKey,
  revokeMyApiKey,
  deleteMyApiKey,
  getMyUsage,
  requireCustomerAccount
};
