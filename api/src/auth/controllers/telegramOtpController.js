const {
  successResponse,
  errorResponse
} = require(
  "../../middleware/apiResponse"
);
const {
  createTelegramOtp,
  verifyTelegramOtp
} = require(
  "../services/telegramOtpService"
);
const {
  createOrGetTelegramUser
} = require(
  "../../accounts/services/userIdentityService"
);
const {
  createUserSession
} = require(
  "../services/sessionService"
);

const requestTelegramOtp =
  async (
    req,
    res
  ) => {
    try {
      return successResponse(
        res,
        await createTelegramOtp(
          req.validatedBody
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

const verifyOtp =
  async (
    req,
    res
  ) => {
    try {
      const result =
        await verifyTelegramOtp(
          req.validatedBody
        );

      if (
        !result.valid
      ) {
        return errorResponse(
          res,
          401,
          "Invalid or expired OTP",
          {
            requestId:
              req.requestId
          }
        );
      }

      const identity =
        await createOrGetTelegramUser({
          telegramUserId:
            result.telegramUserId,
          displayName:
            result.metadata.displayName,
          username:
            result.metadata.username
        });
      const session =
        await createUserSession({
          userId:
            identity.user.id
        });

      return successResponse(
        res,
        {
          ...result,
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
  requestTelegramOtp,
  verifyOtp
};
