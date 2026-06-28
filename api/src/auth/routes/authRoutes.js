const express =
  require("express");
const {
  validateRequest
} = require(
  "../../middleware/validateRequest"
);
const {
  requestTelegramOtpSchema,
  verifyTelegramOtpSchema
} = require(
  "../validators/telegramOtpSchemas"
);
const {
  requestTelegramOtp,
  verifyOtp
} = require(
  "../controllers/telegramOtpController"
);
const {
  requirePlatformAdmin
} = require(
  "../../middleware/platformAdminAuth"
);
const {
  sessionAuth
} = require(
  "../../middleware/sessionAuth"
);
const {
  googleAuthSchema
} = require(
  "../validators/authSchemas"
);
const {
  googleSignIn
} = require(
  "../controllers/googleAuthController"
);
const {
  getMe,
  logout
} = require(
  "../controllers/sessionController"
);
const {
  githubRedirect,
  githubCallback
} = require(
  "../controllers/githubAuthController"
);
const {
  gitlabRedirect,
  gitlabCallback
} = require(
  "../controllers/gitlabAuthController"
);

const router =
  express.Router();

router.post(
  "/google",
  validateRequest(
    googleAuthSchema
  ),
  googleSignIn
);
router.get(
  "/me",
  sessionAuth,
  getMe
);
router.post(
  "/logout",
  sessionAuth,
  logout
);
router.post(
  "/telegram/request-otp",
  requirePlatformAdmin,
  validateRequest(
    requestTelegramOtpSchema
  ),
  requestTelegramOtp
);
router.post(
  "/telegram/verify-otp",
  validateRequest(
    verifyTelegramOtpSchema
  ),
  verifyOtp
);

// GitHub OAuth
router.get(
  "/github",
  githubRedirect
);
router.get(
  "/github/callback",
  githubCallback
);

// GitLab OAuth
router.get(
  "/gitlab",
  gitlabRedirect
);
router.get(
  "/gitlab/callback",
  gitlabCallback
);

module.exports =
  router;
