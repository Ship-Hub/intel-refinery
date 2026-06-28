const {
  successResponse,
  errorResponse
} = require(
  "../../middleware/apiResponse"
);
const {
  revokeUserSession
} = require(
  "../services/sessionService"
);

const getMe =
  async (
    req,
    res
  ) =>
    successResponse(
      res,
      {
        user: {
          id:
            req.userSession.userId,
          email:
            req.userSession.email,
          displayName:
            req.userSession.displayName,
          platformRole:
            req.userSession.platformRole,
          status:
            req.userSession.status
        }
      },
      {
        requestId:
          req.requestId
      }
    );

const logout =
  async (
    req,
    res
  ) => {
    try {
      await revokeUserSession(
        req.userSession.id
      );
      return successResponse(
        res,
        {
          loggedOut:
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

module.exports = {
  getMe,
  logout
};
