// Combined auth middleware — accepts API key OR session token
// Used for refinery routes to work from both console (session) and API clients (x-api-key)

const { verifyApiKey } = require("./apiKeyAuth");
const { verifySessionToken } = require("./sessionAuth");
const { logger } = require("../logging/logger");

const combinedAuth = async (req, res, next) => {
  // Check API key first
  const apiKey = req.headers["x-api-key"];
  if (apiKey) {
    try {
      const result = await verifyApiKey(req);
      if (result.authorized) {
        req.account = result.account;
        req.apiKey = result.apiKey;
        return next();
      }
    } catch (err) {
      // API key failed, try session
    }
  }

  // Check session token
  const authHeader = req.headers.authorization || "";
  const sessionToken = authHeader.startsWith("Bearer ")
    ? authHeader.slice(7)
    : null;

  if (sessionToken) {
    try {
      const result = await verifySessionToken(req, sessionToken);
      if (result.authorized) {
        req.account = result.account;
        req.user = result.user;
        return next();
      }
    } catch (err) {
      // Session failed
    }
  }

  return res.status(401).json({
    success: false,
    error: "API key or session token required"
  });
};

module.exports = { combinedAuth };