const {
  successResponse,
  errorResponse
} = require(
  "../../middleware/apiResponse"
);
const {
  verifyGoogleIdToken
} = require(
  "../services/googleAuthService"
);
const {
  createOrGetGoogleUser
} = require(
  "../../accounts/services/userIdentityService"
);
const {
  createUserSession
} = require(
  "../services/sessionService"
);

const googleSignIn =
  async (
    req,
    res
  ) => {
    try {
      const profile =
        await verifyGoogleIdToken(
          req.validatedBody.idToken
        );
      const identity =
        await createOrGetGoogleUser(
          profile
        );
      const session =
        await createUserSession({
          userId:
            identity.user.id
        });

      return successResponse(
        res,
        {
          ...identity,
          session
        },
        {
          requestId:
            req.requestId
        }
      );
    } catch (error) {
      return errorResponse(
        res,
        401,
        error.message,
        {
          requestId:
            req.requestId
        }
      );
    }
  };

module.exports = {
  googleSignIn
};
