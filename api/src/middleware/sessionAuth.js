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

const sessionAuth =
  async (
    req,
    res,
    next
  ) => {
    const authHeader =
      req.headers.authorization ||
      "";
    const token =
      authHeader.startsWith(
        "Bearer "
      )
        ? authHeader.slice(
            7
          )
        : req.headers[
            "x-session-token"
          ];

    if (
      !token
    ) {
      return errorResponse(
        res,
        401,
        "Session token required",
        {
          requestId:
            req.requestId
        }
      );
    }

    const session =
      await getSessionFromToken(
        token
      );

    if (
      !session
    ) {
      return errorResponse(
        res,
        401,
        "Invalid or expired session",
        {
          requestId:
            req.requestId
        }
      );
    }

    req.userSession =
      session;
    return next();
  };

module.exports = {
  sessionAuth
};
