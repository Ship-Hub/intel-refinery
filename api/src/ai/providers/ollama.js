const ollama =
  require("ollama");

const env =
  require(
    "../../config/env"
  );

const {
  logger
} = require(
  "../../logging/logger"
);

const generate =
  async (
    prompt
  ) => {

    const modelName =
      env.OLLAMA_MODEL;

    try {

      const response =
        await ollama.chat({

          model:
            modelName,

          messages: [

            {
              role: "user",
              content: prompt
            }

          ]

        });

      return {

        success: true,

        provider:
          "ollama",

        model:
          modelName,

        content:
          response.message.content

      };

    } catch (error) {

      logger.warn({

        event:
          "ollama_provider_error",

        error:
          error.message

      });

      return {

        success: false,

        provider:
          "ollama",

        model:
          modelName,

        error:
          error.message

      };

    }

};

module.exports = {
  generate
};