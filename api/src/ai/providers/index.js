const gemini =
  require("./gemini");

const ollama =
  require("./ollama");

const groq =
  require("./groq");

const appConfig =
  require(
    "../../config/appConfig"
  );

const {
  withTimeout
} = require(
  "../../utils/withTimeout"
);

const {
  logAiProviderAttempt,

  logAiProviderResult
} = require(
  "../../logging/logger"
);

const invokeProvider =
  async (
    name,

    prompt,

    options = {}
  ) => {

    if (
      name === "ollama"
    ) {

      return ollama.generate(
        prompt
      );

    }

    if (
      name === "groq"
    ) {

      return groq.generate(
        prompt
      );

    }

    return gemini.generate(
      prompt,
      {
        model:
          options.model
      }
    );

  };

const runBoundedAttempt =
  async (
    name,

    prompt,

    timeoutMs,

    options = {}
  ) => {

    try {

      const result =
        await withTimeout(

          invokeProvider(
            name,

            prompt,

            options
          ),

          timeoutMs
        );

      return result;

    } catch (error) {

      return {

        success: false,

        provider:
          name,

        model:

          name === "ollama"

            ? appConfig.ai.ollamaModel

            : name === "groq"

              ? appConfig.ai.groqModel

              : options.model ||
                appConfig.ai.model,

        error:
          error.message

      };

    }

  };

const isRetryableProviderError =
  (
    result
  ) =>
    !result.success &&
    /\b(429|500|502|503|504)\b|high demand|temporar|timeout|timed out/i.test(
      result.error ||
        ""
    );

const dedupeChain =
  (
    names
  ) => {

    const out =
      [];

    for (
      const n
      of names
    ) {

      if (
        !out.includes(
          n
        )
      ) {

        out.push(
          n
        );

      }

    }

    return out;

  };

const buildProviderChain =
  (
    options = {}
  ) => {

    if (
      options.provider
    ) {

      return dedupeChain(
        [
          options.provider
        ]
      );

    }

    const chain =
      [

        appConfig.ai.primaryProvider

      ];

    if (
      appConfig.ai.fallbackProvider
    ) {

      chain.push(
        appConfig.ai.fallbackProvider
      );

    }

    return dedupeChain(
      chain
    );

  };

const askAI =
  async (
    prompt,

    options = {}
  ) => {

    const timeoutMs =

      options.timeoutMs ??

      appConfig.ai.providerTimeoutMs;

    const chain =
      buildProviderChain(
        options
      );

    const cap =
      Math.min(

        chain.length,

        appConfig.ai.maxProviderAttempts,

        2
      );

    let lastResult = {

      success: false,

      error:
        "No AI provider attempts"

    };

    for (
      let i = 0;

      i < cap;

      i++
    ) {

      const name =
        chain[i];

      logAiProviderAttempt({

        provider:
          name,

        attempt:
          i + 1,

        attemptCap:
          cap

      });

      lastResult =
        await runBoundedAttempt(

          name,

          prompt,

          timeoutMs,

          {
            model:
              name === "gemini"
                ? appConfig.ai.model
                : undefined
          }
        );

      logAiProviderResult({

        provider:
          lastResult.provider,

        model:
          lastResult.model,

        success:
          lastResult.success,

        error:
          lastResult.error

      });

      if (
        lastResult.success
      ) {

        return lastResult;

      }

      if (
        isRetryableProviderError(
          lastResult
        )
      ) {
        logAiProviderAttempt({
          provider:
            name,
          attempt:
            `${i + 1}.retry`,
          attemptCap:
            cap
        });

        lastResult =
          await runBoundedAttempt(
            name,
            prompt,
            timeoutMs,
            {
              model:
                name === "gemini"
                  ? appConfig.ai.model
                  : undefined
            }
          );

        logAiProviderResult({
          provider:
            lastResult.provider,
          model:
            lastResult.model,
          success:
            lastResult.success,
          error:
            lastResult.error
        });

        if (
          lastResult.success
        ) {
          return lastResult;
        }
      }

      if (
        name === "gemini" &&
        appConfig.ai.geminiFallbackModel &&
        appConfig.ai.geminiFallbackModel !==
          appConfig.ai.model
      ) {
        logAiProviderAttempt({
          provider:
            name,
          model:
            appConfig.ai.geminiFallbackModel,
          attempt:
            `${i + 1}.model_fallback`,
          attemptCap:
            cap
        });

        lastResult =
          await runBoundedAttempt(
            name,
            prompt,
            timeoutMs,
            {
              model:
                appConfig.ai.geminiFallbackModel
            }
          );

        logAiProviderResult({
          provider:
            lastResult.provider,
          model:
            lastResult.model,
          success:
            lastResult.success,
          error:
            lastResult.error
        });

        if (
          lastResult.success
        ) {
          return lastResult;
        }
      }

    }

    return lastResult;

  };

module.exports = {
  askAI,
  isRetryableProviderError
};
