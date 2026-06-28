const rateLimit =
  require(
    "express-rate-limit"
  );

const parsePositiveInteger =
  (
    value,
    fallback
  ) => {
    const parsed =
      Number.parseInt(
        value,
        10
      );

    return Number.isFinite(parsed) && parsed > 0
      ? parsed
      : fallback;
  };

const apiRateLimiter =
  rateLimit({

    windowMs:
      parsePositiveInteger(
        process.env.API_RATE_LIMIT_WINDOW_MS,
        15 * 60 * 1000
      ),

    max:
      parsePositiveInteger(
        process.env.API_RATE_LIMIT_MAX,
        1000
      ),

    standardHeaders:
      true,

    legacyHeaders:
      false,

    skip:
      (req) =>
        req.method === "OPTIONS",

    message: {

      success: false,

      data: null,

      error:
        "Too many requests"

    }

  });

module.exports = {
  apiRateLimiter
};