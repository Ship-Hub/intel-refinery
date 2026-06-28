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
  createAccountSchema,
  createApiKeySchema,
  grantCreditsSchema,
  createPlanSchema,
  createSubscriptionSchema
} = require(
  "../validators/accountSchemas"
);
const {
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
} = require(
  "../controllers/adminAccountController"
);

const router =
  express.Router();

router.use(
  requirePlatformAdmin
);
router.get(
  "/accounts",
  getAdminAccounts
);
router.post(
  "/accounts",
  validateRequest(
    createAccountSchema
  ),
  createAdminAccount
);
router.get(
  "/accounts/:accountId",
  getAdminAccountById
);
router.get(
  "/api-keys",
  getAdminApiKeys
);
router.post(
  "/api-keys",
  validateRequest(
    createApiKeySchema
  ),
  createAdminApiKey
);
router.post(
  "/api-keys/:apiKeyId/revoke",
  revokeAdminApiKey
);
router.post(
  "/credits/grants",
  validateRequest(
    grantCreditsSchema
  ),
  grantAdminCredits
);
router.get(
  "/usage",
  getAdminUsage
);
router.get(
  "/plans",
  getAdminPlans
);
router.post(
  "/plans",
  validateRequest(
    createPlanSchema
  ),
  createAdminPlan
);
router.get(
  "/subscriptions",
  getAdminSubscriptions
);
router.post(
  "/subscriptions",
  validateRequest(
    createSubscriptionSchema
  ),
  createAdminSubscription
);
router.get(
  "/audit-logs",
  getAdminAuditLogs
);

module.exports =
  router;
