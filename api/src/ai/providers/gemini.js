const {
  logger
} = require(
  "../../logging/logger"
);

const env =
  require(
    "../../config/env"
  );

const {
  GoogleGenerativeAI
} = require(
  "@google/generative-ai"
);
const fs =
  require(
    "fs"
  );

const genAI =
  new GoogleGenerativeAI(
    env.GEMINI_API_KEY
  );

const generate =
  async (
    prompt,
    options = {}
  ) => {
    const modelName =
      options.model ||
      env.GEMINI_MODEL;

    try {

      logger.debug({

        event:
          "gemini_request",

        model:
          modelName

      });

      const model =
        genAI.getGenerativeModel({

          model:
            modelName

        });

      const result =
        await model.generateContent(
          prompt
        );

      const response =
        await result.response;

      const text =
        response.text();

      return {

        success: true,

        provider:
          "gemini",

        model:
          modelName,

        content:
          text

      };

    } catch (error) {

      logger.warn({

        event:
          "gemini_provider_error",

        error:
          error.message

      });

      return {

        success: false,

        provider:
          "gemini",

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
      env.GEMINI_MODEL
  }) => {
    try {
      const [
        header,
        base64Data
      ] =
        dataUrl.split(
          ","
        );
      const mimeType =
        header.match(
          /^data:(.*?);base64$/
        )?.[1] ||
        "image/jpeg";
      const geminiModel =
        genAI.getGenerativeModel({
          model
        });
      const result =
        await geminiModel.generateContent([
          prompt,
          {
            inlineData: {
              data:
                base64Data,
              mimeType
            }
          }
        ]);
      const response =
        await result.response;

      return {
        success:
          true,
        provider:
          "gemini",
        model,
        content:
          response.text()
      };
    } catch (error) {
      logger.warn({
        event:
          "gemini_image_provider_error",
        model,
        error:
          error.message
      });

      return {
        success:
          false,
        provider:
          "gemini",
        model,
        error:
          error.message
      };
    }
  };

const generateWithAudio =
  async ({
    prompt,
    filePath,
    mimeType,
    model =
      env.GEMINI_MODEL
  }) => {
    try {
      const geminiModel =
        genAI.getGenerativeModel({
          model
        });
      const result =
        await geminiModel.generateContent([
          prompt,
          {
            inlineData: {
              data:
                fs.readFileSync(
                  filePath
                ).toString(
                  "base64"
                ),
              mimeType:
                mimeType ||
                "audio/ogg"
            }
          }
        ]);
      const response =
        await result.response;

      return {
        success:
          true,
        provider:
          "gemini",
        model,
        content:
          response.text()
      };
    } catch (error) {
      logger.warn({
        event:
          "gemini_audio_provider_error",
        model,
        error:
          error.message
      });

      return {
        success:
          false,
        provider:
          "gemini",
        model,
        error:
          error.message
      };
    }
  };

module.exports = {
  generate,
  generateWithImage,
  generateWithAudio
};
