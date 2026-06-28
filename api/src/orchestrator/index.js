// AI Model Orchestrator — executes AI tasks through configured providers
// All AI operations flow through this module

const { getTaskConfig } = require("./config");
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

const executeTask = async (taskType, input, dbContext = null) => {
  const taskConfig = getTaskConfig(taskType);

  let lastResult = { success: false, error: "No attempts made" };
  const maxAttempts = taskConfig.retries + 1;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const providerName = attempt === 0 ? taskConfig.provider : taskConfig.fallback.provider;
    const model = attempt === 0 ? taskConfig.model : taskConfig.fallback.model;

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
      timeoutMs: taskConfig.timeoutMs
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

    if (attempt > 0 && !isRetryable(lastResult)) {
      break;
    }
  }

  return lastResult;
};

const execute = async (taskType, input, dbContext = null) =>
  executeTask(taskType, input, dbContext);

module.exports = { execute, executeTask };