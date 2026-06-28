const test =
  require("node:test");
const assert =
  require("node:assert/strict");

process.env.GEMINI_API_KEY =
  process.env.GEMINI_API_KEY ||
  "test-key";

const {
  isRetryableProviderError
} = require(
  "../../src/ai/providers"
);

test(
  "provider retry detection treats transient failures as retryable",
  () => {
    assert.equal(
      isRetryableProviderError({
        success:
          false,
        error:
          "503 Service Unavailable: high demand"
      }),
      true
    );
    assert.equal(
      isRetryableProviderError({
        success:
          false,
        error:
          "401 Invalid API Key"
      }),
      false
    );
  }
);

test(
  "gemini fallback model can be configured independently",
  () => {
    const appConfig =
      require(
        "../../src/config/appConfig"
      );

    assert.ok(
      "geminiFallbackModel" in
        appConfig.ai
    );
  }
);
