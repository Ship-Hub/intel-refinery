const {
  childFromRequest,

  logger
} = require(
  "../logging/logger"
);

const env =
  require(
    "../config/env"
  );

const errorHandler =
  (
    error,
    req,
    res,

    next
  ) => {

    const log =
      req?.requestId
        ? childFromRequest(
          req
        )
        : logger;

    const payload = {

      event:
        "unhandled_route_error",

      error:
        error.message

    };

    if (
      env.NODE_ENV !==
      "production"
    ) {

      payload.stack =
        error.stack;

    }

    log.warn(
      payload
    );

    return res.status(500)
      .json({

        success: false,

        data: null,

        error:
          "Internal server error",

        meta: {

          requestId:
            req.requestId

        }

      });

};

module.exports = {
  errorHandler
};
