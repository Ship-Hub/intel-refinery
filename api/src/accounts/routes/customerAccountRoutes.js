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
  createApiKeySchema
} = require(
  "../validators/accountSchemas"
);
const {
  getMyAccount,
  getMyApiKeys,
  createMyApiKey,
  revokeMyApiKey,
  deleteMyApiKey,
  getMyUsage
} = require(
  "../controllers/customerAccountController"
);

const router =
  express.Router();

router.use(
  sessionAuth
);
router.get(
  "/account",
  getMyAccount
);
router.get(
  "/api-keys",
  getMyApiKeys
);
router.post(
  "/api-keys",
  validateRequest(
    createApiKeySchema
      .omit({
        accountId:
          true
      })
  ),
  createMyApiKey
);
router.post(
  "/api-keys/:apiKeyId/revoke",
  revokeMyApiKey
);
router.delete(
  "/api-keys/:apiKeyId",
  deleteMyApiKey
);
router.get(
  "/usage",
  getMyUsage
);

module.exports =
  router;
