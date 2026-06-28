const pino =
  require("pino");

const env =
  require(
    "../config/env"
  );

const level =
  env.LOG_LEVEL;

const logger =
  pino({

    level,

    base: {

      service:
        "intel-refinery-api"

    },

    timestamp:
      pino.stdTimeFunctions.isoTime,

    redact: {

      paths: [

        "req.headers.authorization",

        "req.headers['x-api-key']",

        "headers['x-api-key']",

        "headers.x-api-key",

        "xApiKey",

        "apiKey",

        "password",

        "req.body.password",

        "GEMINI_API_KEY",

        "GROQ_API_KEY"

      ],

      remove: true

    }

  });

const childFromRequest =
  (
    req
  ) => {

    return logger.child({

      requestId:
        req?.requestId

    });

};

const logAiProviderAttempt =
  (
    meta
  ) => {

    logger.info({

      event:
        "ai_provider_attempt",

      ...meta

    });

  };

const logAiProviderResult =
  (
    meta
  ) => {

    const levelName =
      meta.success
        ? "info"
        : "warn";

    logger[levelName]({

      event:
        "ai_provider_result",

      ...meta

    });

  };

const logWorkerEvent =
  (
    meta
  ) => {

    logger.info({

      event:
        "worker_lifecycle",

      ...meta

    });

  };

module.exports = {

  logger,

  childFromRequest,

  logAiProviderAttempt,

  logAiProviderResult,

  logWorkerEvent

};
