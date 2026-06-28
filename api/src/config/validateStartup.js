const db =
  require("./db");

const env =
  require("./env");

const appConfig =
  require("./appConfig");

const {
  logger
} = require(
  "../logging/logger"
);

const validateProviderEnv =
  () => {

    if (
      env.OPENROUTER_API_KEY
    ) {
      logger.info({
        event:
          "provider_config",
        provider:
          "openrouter",
        status:
          "configured"
      });
    }

    const chain =
      [

        appConfig.ai.primaryProvider,

        appConfig.ai.fallbackProvider

      ].filter(Boolean);

    const needsGemini =
      chain.some(
        (name) => name === "gemini"
      );

    const needsGroq =
      chain.some(
        (name) => name === "groq"
      );

    const needsOpenRouter =
      chain.some(
        (name) => name === "openrouter"
      );

    if (
      needsOpenRouter &&
      !env.OPENROUTER_API_KEY
    ) {

      logger.warn({
        event:
          "provider_config_warning",
        message:
          "OPENROUTER_API_KEY is not set but OpenRouter is configured as a provider"
      });

    }

    if (
      needsGemini &&
      !env.GEMINI_API_KEY
    ) {

      logger.warn({
        event:
          "provider_config_warning",
        message:
          "GEMINI_API_KEY is not set but Gemini is configured as a provider"
      });

    }

    if (
      needsGroq &&
      !env.GROQ_API_KEY
    ) {

      logger.warn({
        event:
          "provider_config_warning",
        message:
          "GROQ_API_KEY is not set but Groq is configured as a provider"
      });

    }

    // OpenRouter is the recommended primary — warn if missing
    if (
      !env.OPENROUTER_API_KEY
    ) {

      logger.warn({
        event:
          "provider_config_warning",
        message:
          "OPENROUTER_API_KEY is not set. AI tasks will fall back to legacy providers."
      });

    }

  };

const validateDatabaseConnection =
  async () => {

    let connection;

    logger.info({

      event:
        "mysql_connecting",

      host:
        env.DB_HOST,

      port:
        env.DB_PORT,

      database:
        env.DB_NAME

    });

    try {

      connection =
        await db.promise()
          .getConnection();

      await connection.query(
        "SELECT 1 AS ok"
      );

      logger.info({

        event:
          "mysql_pool_connected",

        host:
          env.DB_HOST,

        port:
          env.DB_PORT,

        database:
          env.DB_NAME

      });

    } catch (error) {

      throw new Error(
        `MySQL connection failed (${env.DB_HOST}:${env.DB_PORT}/${env.DB_NAME}): ${error.message}. Ensure MySQL is running and credentials in .env are correct.`
      );

    } finally {

      if (connection) {

        connection.release();

      }

    }

  };

const validateStartup =
  async () => {

    validateProviderEnv();

    await validateDatabaseConnection();

    logger.info({

      event:
        "startup_validation_ok",

      nodeEnv:
        env.NODE_ENV

    });

  };

module.exports = {
  validateStartup
};
