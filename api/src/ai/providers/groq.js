const OpenAI =
  require("openai");
const fs =
  require("fs");

const env =
  require(
    "../../config/env"
  );

const {
  logger
} = require(
  "../../logging/logger"
);

let client =
  null;

const getClient =
  () => {
    if (
      !env.GROQ_API_KEY
    ) {
      throw new Error(
        "Groq is not configured"
      );
    }

    if (
      !client
    ) {
      client =
        new OpenAI({
          apiKey:
            env.GROQ_API_KEY,
          baseURL:
            "https://api.groq.com/openai/v1"
        });
    }

    return client;
  };

const generate =
  async (
    prompt,
    options = {}
  ) => {

    const modelName =
      options.model ||
      env.GROQ_MODEL;

    try {

      logger.debug({

        event:
          "groq_request",

        model:
          modelName

      });

      const body = {
        model: modelName,
        messages: [{ role: "user", content: prompt }]
      };

      if (options.temperature != null) {
        body.temperature = options.temperature;
      }
      if (options.maxTokens) {
        body.max_tokens = options.maxTokens;
      }
      if (options.jsonMode) {
        body.response_format = { type: "json_object" };
      }

      const response =
        await getClient().chat.completions.create(body);

      const text =
        response.choices?.[0]
          ?.message?.content || "";

      return {

        success: true,

        provider:
          "groq",

        model:
          modelName,

        content:
          text

      };

    } catch (error) {

      logger.warn({

        event:
          "groq_provider_error",

        error:
          error.message

      });

      return {

        success: false,

        provider:
          "groq",

        model:
          modelName,

        error:
          error.message

      };

    }

  };

const generateWithImage =
  async ({
    prompt,
    dataUrl,
    model =
      "meta-llama/llama-4-scout-17b-16e-instruct"
  }) => {
    try {
      const response =
        await getClient().chat.completions.create({
          model,
          messages: [
            {
              role:
                "user",
              content: [
                {
                  type:
                    "text",
                  text:
                    prompt
                },
                {
                  type:
                    "image_url",
                  image_url: {
                    url:
                      dataUrl
                  }
                }
              ]
            }
          ],
          response_format: {
            type:
              "json_object"
          }
        });

      return {
        success: true,
        provider:
          "groq",
        model,
        content:
          response.choices?.[0]
            ?.message?.content || ""
      };
    } catch (error) {
      return {
        success: false,
        provider:
          "groq",
        model,
        error:
          error.message
      };
    }
  };

const transcribeAudio =
  async (
    filePath,
    filename
  ) => {
    try {
      const file =
        fs.createReadStream(
          filePath
        );

      if (
        filename
      ) {
        file.path =
          filename;
      }

      const transcription =
        await getClient().audio.transcriptions.create({
          file,
          model:
            "whisper-large-v3-turbo",
          response_format:
            "json"
        });

      return {
        success: true,
        provider:
          "groq",
        model:
          "whisper-large-v3-turbo",
        text:
          transcription.text || ""
      };
    } catch (error) {
      return {
        success: false,
        provider:
          "groq",
        model:
          "whisper-large-v3-turbo",
        error:
          error.message
      };
    }
  };

module.exports = {
  generate,
  generateWithImage,
  transcribeAudio
};
