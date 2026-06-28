const {
  successResponse,
  errorResponse
} = require(
  "../../middleware/apiResponse"
);
const {
  createAccount,
  getAccountOverviewById,
  listAccounts
} = require(
  "../services/accountService"
);
const {
  createApiKey,
  listApiKeys,
  revokeApiKey
} = require(
  "../services/apiKeyService"
);
const {
  addLedgerEntry
} = require(
  "../services/creditLedgerService"
);
const {
  listUsageEvents
} = require(
  "../services/usageService"
);
const {
  createPlan,
  listPlans
} = require(
  "../services/planService"
);
const {
  createSubscription,
  listSubscriptions
} = require(
  "../services/subscriptionService"
);
const {
  recordAdminAudit,
  listAdminAuditLogs
} = require(
  "../services/adminAuditService"
);

const createAdminAccount =
  async (
    req,
    res
  ) => {
    try {
      const account =
        await createAccount(
          req.validatedBody
        );
      await recordAdminAudit({
        action:
          "account.create",
        targetType:
          "account",
        targetId:
          String(
            account.id
          )
      });

      return successResponse(
        res,
        account,
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

const getAdminAccountById =
  async (
    req,
    res
  ) => {
    try {
      const account =
        await getAccountOverviewById(
          req.params.accountId
        );

      if (!account) {
        return errorResponse(
          res,
          404,
          "Account not found",
          {
            requestId:
              req.requestId
          }
        );
      }

      return successResponse(
        res,
        account,
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

const getAdminAccounts =
  async (
    req,
    res
  ) => {
    try {
      return successResponse(
        res,
        await listAccounts(),
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

const createAdminApiKey =
  async (
    req,
    res
  ) => {
    try {
      const apiKey =
        await createApiKey(
          req.validatedBody
        );
      await recordAdminAudit({
        action:
          "api_key.create",
        targetType:
          "api_key",
        targetId:
          String(
            apiKey.id
          )
      });

      return successResponse(
        res,
        apiKey,
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

const getAdminApiKeys =
  async (
    req,
    res
  ) => {
    try {
      return successResponse(
        res,
        await listApiKeys(
          req.query.accountId
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

const revokeAdminApiKey =
  async (
    req,
    res
  ) => {
    try {
      await revokeApiKey(
        {
          apiKeyId:
            req.params.apiKeyId
        }
      );
      await recordAdminAudit({
        action:
          "api_key.revoke",
        targetType:
          "api_key",
        targetId:
          String(
            req.params.apiKeyId
          )
      });

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

const grantAdminCredits =
  async (
    req,
    res
  ) => {
    try {
      const ledgerEntry =
        await addLedgerEntry({
          accountId:
            req.validatedBody.accountId,
          amount:
            req.validatedBody.amount,
          entryType:
            "grant",
          description:
            req.validatedBody.description ||
            "Manual admin credit grant"
        });
      await recordAdminAudit({
        action:
          "credits.grant",
        targetType:
          "account",
        targetId:
          String(
            req.validatedBody.accountId
          ),
        metadata: {
          amount:
            req.validatedBody.amount
        }
      });

      return successResponse(
        res,
        ledgerEntry,
        {
          requestId:
            req.requestId
        }
      );
    } catch (error) {
      return errorResponse(
        res,
        error.message ===
          "Insufficient credits"
          ? 400
          : 500,
        error.message,
        {
          requestId:
            req.requestId
        }
      );
    }
  };

const createAdminPlan =
  async (
    req,
    res
  ) => {
    try {
      const plan =
        await createPlan(
          req.validatedBody
        );
      await recordAdminAudit({
        action:
          "plan.create",
        targetType:
          "plan",
        targetId:
          String(
            plan.id
          )
      });

      return successResponse(
        res,
        plan,
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

const getAdminPlans =
  async (
    req,
    res
  ) => {
    try {
      return successResponse(
        res,
        await listPlans(),
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

const createAdminSubscription =
  async (
    req,
    res
  ) => {
    try {
      const subscription =
        await createSubscription(
          req.validatedBody
        );
      await recordAdminAudit({
        action:
          "subscription.create",
        targetType:
          "subscription",
        targetId:
          String(
            subscription.id
          )
      });

      return successResponse(
        res,
        subscription,
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

const getAdminSubscriptions =
  async (
    req,
    res
  ) => {
    try {
      return successResponse(
        res,
        await listSubscriptions(
          req.query.accountId ||
            null
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

const getAdminAuditLogs =
  async (
    req,
    res
  ) => {
    try {
      return successResponse(
        res,
        await listAdminAuditLogs({
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

const getAdminUsage =
  async (
    req,
    res
  ) => {
    try {
      return successResponse(
        res,
        await listUsageEvents({
          accountId:
            req.query.accountId,
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
  createAdminAccount,
  getAdminAccounts,
  getAdminAccountById,
  createAdminApiKey,
  getAdminApiKeys,
  revokeAdminApiKey,
  grantAdminCredits,
  getAdminUsage,
  createAdminPlan,
  getAdminPlans,
  createAdminSubscription,
  getAdminSubscriptions,
  getAdminAuditLogs
};
