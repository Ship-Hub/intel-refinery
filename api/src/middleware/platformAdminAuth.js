const env =
  require(
    "../config/env"
  );
const {
  errorResponse
} = require(
  "./apiResponse"
);
const {
  getSessionFromToken
} = require(
  "../auth/services/sessionService"
);

const requirePlatformAdmin =
  async (
    req,
    res,
    next
  ) => {
    // Option 1: static x-admin-token header (programmatic / CI use)
    if (
      env.PLATFORM_ADMIN_TOKEN &&
      req.headers["x-admin-token"] ===
        env.PLATFORM_ADMIN_TOKEN
    ) {
      return next();
    }

    // Option 2: regular session token where platform_role = 'admin'
    const authHeader =
      req.headers.authorization || "";
    const token =
      authHeader.startsWith("Bearer ")
        ? authHeader.slice(7)
        : null;

    if (token) {
      const session =
        await getSessionFromToken(token);

      if (
        session &&
        session.platformRole === "admin"
      ) {
        req.userSession = session;
        return next();
      }

      return errorResponse(
        res,
        403,
        "Admin access denied",
        { requestId: req.requestId }
      );
    }

    return errorResponse(
      res,
      403,
      "Admin access denied",
      { requestId: req.requestId }
    );
  };

module.exports = {
  requirePlatformAdmin
};
