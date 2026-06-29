const test = require("node:test");
const assert = require("node:assert/strict");

const clearModules = () => {
  for (const key of Object.keys(require.cache)) {
    if (
      key.includes("\\src\\orchestrator\\") ||
      key.includes("/src/orchestrator/") ||
      key.includes("\\src\\config\\env") ||
      key.includes("/src/config/env")
    ) {
      delete require.cache[key];
    }
  }
};

const restoreEnv = (previous) => {
  for (const [key, value] of Object.entries(previous)) {
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }
};

test("refinery provider chain skips Groq by default", () => {
  const previous = {
    OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY,
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
    GROQ_API_KEY: process.env.GROQ_API_KEY,
    AI_ENABLE_GROQ_FALLBACK: process.env.AI_ENABLE_GROQ_FALLBACK,
  };

  process.env.OPENROUTER_API_KEY = "test-openrouter";
  process.env.GEMINI_API_KEY = "test-gemini";
  process.env.GROQ_API_KEY = "test-groq";
  process.env.AI_ENABLE_GROQ_FALLBACK = "false";
  clearModules();

  const { getTaskConfig } = require("../../src/orchestrator/config");
  const { buildAttemptChain } = require("../../src/orchestrator");
  const chain = buildAttemptChain(getTaskConfig("understand"));

  assert.deepEqual(
    chain.map((attempt) => attempt.provider),
    ["openrouter", "openrouter", "gemini"]
  );
  assert.equal(chain.some((attempt) => attempt.provider === "groq"), false);

  restoreEnv(previous);
  clearModules();
});

test("refinery provider chain only uses available providers", () => {
  const previous = {
    OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY,
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
    GROQ_API_KEY: process.env.GROQ_API_KEY,
    AI_ENABLE_GROQ_FALLBACK: process.env.AI_ENABLE_GROQ_FALLBACK,
  };

  process.env.OPENROUTER_API_KEY = "test-openrouter";
  delete process.env.GEMINI_API_KEY;
  process.env.GROQ_API_KEY = "test-groq";
  process.env.AI_ENABLE_GROQ_FALLBACK = "false";
  clearModules();

  const { getTaskConfig } = require("../../src/orchestrator/config");
  const { buildAttemptChain } = require("../../src/orchestrator");
  const chain = buildAttemptChain(getTaskConfig("connect"));

  assert.deepEqual(
    chain.map((attempt) => attempt.provider),
    ["openrouter", "openrouter"]
  );

  restoreEnv(previous);
  clearModules();
});

test("context limit errors are recognized as provider-routing failures", () => {
  clearModules();
  const { isContextLimitError } = require("../../src/orchestrator");

  assert.equal(
    isContextLimitError({
      success: false,
      error: "413 Request too large for model on tokens per minute",
    }),
    true
  );
  assert.equal(
    isContextLimitError({
      success: false,
      error: "401 Invalid API key",
    }),
    false
  );
});
