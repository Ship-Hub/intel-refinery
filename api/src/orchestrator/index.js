// AI Model Orchestrator — executes AI tasks through configured providers
// All AI operations flow through this module

const { getProviderConfig, getTaskConfig } = require("./config");
const env = require("../config/env");
const openRouter = require("./openRouterProvider");
const geminiProvider = require("../ai/providers/gemini");
const groqProvider = require("../ai/providers/groq");
const ollamaProvider = require("../ai/providers/ollama");
const { logAiProviderAttempt, logAiProviderResult } = require("../logging/logger");
const { withTimeout } = require("../utils/withTimeout");

const PROVIDER_RUNNERS = {
  openrouter: async (prompt, opts) => openRouter.generate(prompt, opts),
  gemini: async (prompt, opts) => geminiProvider.generate(prompt, opts),
  groq: async (prompt, opts) => groqProvider.generate(prompt, opts),
  ollama: async (prompt, opts) => ollamaProvider.generate(prompt)
};

const normalizeResult = (result, providerName, options) => {
  if (!result || !result.success) {
    return result;
  }
  return {
    success: true,
    provider: result.provider || providerName,
    model: result.model || options.model || "unknown",
    text: result.text || result.content || "",
    raw: result.raw || result,
    usage: result.usage || null,
    durationMs: result.durationMs || 0
  };
};

const invokeProvider = async (providerName, prompt, options = {}) => {
  const runner = PROVIDER_RUNNERS[providerName];
  if (!runner) {
    return {
      success: false,
      provider: providerName,
      model: options.model || "unknown",
      error: `Unknown provider: ${providerName}`
    };
  }

  const timeoutMs = options.timeoutMs || 120000;

  try {
    const result = await withTimeout(runner(prompt, options), timeoutMs);
    return normalizeResult(result, providerName, options);
  } catch (error) {
    return {
      success: false,
      provider: providerName,
      model: options.model || "unknown",
      error: error.message
    };
  }
};

const isRetryable = (result) =>
  !result.success &&
  /\b(429|500|502|503|504)\b|high demand|temporar|timeout|timed out/i.test(
    result.error || ""
  );

const isContextLimitError = (result) =>
  !result.success &&
  /\b(400|413)\b|request too large|tokens per minute|context length|maximum context|too many tokens|prompt is too long/i.test(
    result.error || ""
  );

const providerAvailable = (providerName) => {
  if (providerName === "openrouter") return Boolean(env.OPENROUTER_API_KEY);
  if (providerName === "gemini") return Boolean(env.GEMINI_API_KEY);
  if (providerName === "groq") return Boolean(env.GROQ_API_KEY);
  if (providerName === "ollama") return true;
  return false;
};

const buildAttemptChain = (taskConfig) => {
  const chain = [
    {
      provider: taskConfig.provider,
      model: taskConfig.model,
    },
    ...(taskConfig.fallbackChain || (taskConfig.fallback ? [taskConfig.fallback] : [])),
  ];

  const seen = new Set();
  return chain.filter((attempt) => {
    if (!attempt?.provider || !attempt?.model) return false;
    const key = `${attempt.provider}:${attempt.model}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return providerAvailable(attempt.provider);
  });
};

const executeTask = async (taskType, input, dbContext = null) => {
  const taskConfig = getTaskConfig(taskType);

  let lastResult = { success: false, error: "No attempts made" };
  const attempts = buildAttemptChain(taskConfig);
  const maxAttempts = attempts.length;

  if (maxAttempts === 0) {
    return {
      success: false,
      provider: taskConfig.provider,
      model: taskConfig.model,
      error: `No configured AI provider is available for ${taskType}. Set OPENROUTER_API_KEY or GEMINI_API_KEY.`
    };
  }

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const providerName = attempts[attempt].provider;
    const model = attempts[attempt].model;

    logAiProviderAttempt({
      taskType,
      provider: providerName,
      model,
      attempt: attempt + 1,
      attemptCap: maxAttempts
    });

    lastResult = await invokeProvider(providerName, input, {
      model,
      temperature: taskConfig.temperature,
      maxTokens: taskConfig.maxTokens,
      jsonMode: taskConfig.jsonMode,
      timeoutMs: taskConfig.timeoutMs || getProviderConfig(providerName).timeoutMs
    });

    logAiProviderResult({
      taskType,
      provider: lastResult.provider,
      model: lastResult.model,
      success: lastResult.success,
      error: lastResult.error
    });

    if (lastResult.success) {
      return lastResult;
    }

    if (providerName === "groq" && isContextLimitError(lastResult)) {
      break;
    }

    if (attempt > 0 && !isRetryable(lastResult) && !isContextLimitError(lastResult)) {
      break;
    }
  }

  return lastResult;
};

const execute = async (taskType, input, dbContext = null) =>
  executeTask(taskType, input, dbContext);

module.exports = { execute, executeTask, buildAttemptChain, isContextLimitError };
