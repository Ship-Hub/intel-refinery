const {
  childFromRequest,

  logger
} = require(
  "../logging/logger"
);

const requestTimer =
  (
    req,
    res,
    next
  ) => {

    const start =
      Date.now();

    req.log =
      childFromRequest(
        req
      );

    res.on(
      "finish",
      () => {

        const duration =
          Date.now() - start;

        req.log.info({

          event:
            "http_request_complete",

          method:
            req.method,

          path:
            req.originalUrl,

          status:
            res.statusCode,

          durationMs:
            duration

        });

      }
    );

    next();

  };

module.exports = {
  requestTimer
};