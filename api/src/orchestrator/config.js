const normalizeOpenRouterModel = (model) => {
  const replacements = {
    "anthropic/claude-opus": "deepseek/deepseek-v4-pro",
    "anthropic/claude-sonnet": "deepseek/deepseek-v4-pro"
  };

  return replacements[model] || model;
};

const getEnv = (key, fallback) => process.env[key] || fallback;

const getOpenRouterModel = (key, fallback) =>
  normalizeOpenRouterModel(getEnv(key, fallback));

const openRouterFallbackModel = () =>
  getOpenRouterModel("OPENROUTER_FALLBACK_MODEL", "deepseek/deepseek-v4-flash");

const geminiFallbackModel = () =>
  getEnv("GEMINI_FALLBACK_MODEL", getEnv("GEMINI_MODEL", "gemini-2.5-flash"));

const groqFallbackEnabled = () =>
  String(getEnv("AI_ENABLE_GROQ_FALLBACK", "false")).toLowerCase() === "true";

const fallbackChain = (taskModel, options = {}) => {
  const chain = [];
  const add = (provider, model) => {
    if (!provider || !model) return;
    if (chain.some((item) => item.provider === provider && item.model === model)) return;
    chain.push({ provider, model });
  };

  add("openrouter", options.openrouterModel || openRouterFallbackModel());
  add("gemini", options.geminiModel || geminiFallbackModel());
  if (groqFallbackEnabled()) {
    add("groq", getEnv("GROQ_MODEL", "llama-3.3-70b-versatile"));
  }

  return chain.filter((item) => !(item.provider === "openrouter" && item.model === taskModel));
};

const taskRouting = {
  observe: {
    provider: "openrouter",
    model: getOpenRouterModel("OPENROUTER_OBSERVE_MODEL", "deepseek/deepseek-v4-flash"),
    temperature: 0.2,
    maxTokens: 8192,
    jsonMode: true,
    retries: 1,
    capabilities: ["fast_extraction", "structured_json", "citation"],
    fallbackChain: fallbackChain(getOpenRouterModel("OPENROUTER_OBSERVE_MODEL", "deepseek/deepseek-v4-flash"))
  },

  connect: {
    provider: "openrouter",
    model: getOpenRouterModel("OPENROUTER_CONNECT_MODEL", "deepseek/deepseek-v4-pro"),
    temperature: 0.1,
    maxTokens: 16384,
    jsonMode: true,
    retries: 1,
    capabilities: ["relationship_detection", "structured_json", "pattern_recognition"],
    fallbackChain: fallbackChain(getOpenRouterModel("OPENROUTER_CONNECT_MODEL", "deepseek/deepseek-v4-pro"))
  },

  understand: {
    provider: "openrouter",
    model: getOpenRouterModel("OPENROUTER_UNDERSTAND_MODEL", "deepseek/deepseek-v4-pro"),
    temperature: 0.3,
    maxTokens: 16384,
    jsonMode: true,
    retries: 1,
    capabilities: ["deep_reasoning", "structured_json", "long_context", "synthesis"],
    fallbackChain: fallbackChain(getOpenRouterModel("OPENROUTER_UNDERSTAND_MODEL", "deepseek/deepseek-v4-pro"))
  },

  reflect: {
    provider: "openrouter",
    model: getOpenRouterModel("OPENROUTER_REFLECT_MODEL", "deepseek/deepseek-v4-pro"),
    temperature: 0.4,
    maxTokens: 8192,
    jsonMode: true,
    retries: 1,
    capabilities: ["deep_reasoning", "critical_analysis", "structured_json", "long_context"],
    fallbackChain: fallbackChain(getOpenRouterModel("OPENROUTER_REFLECT_MODEL", "deepseek/deepseek-v4-pro"))
  },

  generate_view: {
    provider: "openrouter",
    model: getOpenRouterModel("OPENROUTER_VIEW_MODEL", "deepseek/deepseek-v4-flash"),
    temperature: 0.4,
    maxTokens: 16384,
    jsonMode: false,
    retries: 1,
    capabilities: ["long_context", "structured_json", "narrative_generation"],
    fallbackChain: fallbackChain(getOpenRouterModel("OPENROUTER_VIEW_MODEL", "deepseek/deepseek-v4-flash"))
  },

  quality_review: {
    provider: "openrouter",
    model: getOpenRouterModel("OPENROUTER_QUALITY_MODEL", "deepseek/deepseek-v4-flash"),
    temperature: 0.1,
    maxTokens: 4096,
    jsonMode: true,
    retries: 1,
    capabilities: ["structured_json", "critical_analysis"],
    fallbackChain: fallbackChain(getOpenRouterModel("OPENROUTER_QUALITY_MODEL", "deepseek/deepseek-v4-flash"))
  }
};

const CAPABILITY_INDEX = {};
for (const [taskType, config] of Object.entries(taskRouting)) {
  if (config.capabilities) {
    for (const cap of config.capabilities) {
      if (!CAPABILITY_INDEX[cap]) CAPABILITY_INDEX[cap] = [];
      CAPABILITY_INDEX[cap].push(taskType);
    }
  }
}

const providerDefaults = {
  openrouter: {
    baseURL: "https://openrouter.ai/api/v1",
    timeoutMs: parseInt(getEnv("OPENROUTER_TIMEOUT_MS", "240000")),
    apiKey: getEnv("OPENROUTER_API_KEY", ""),
    referer: getEnv("OPENROUTER_REFERER", "https://refinery.local"),
    title: getEnv("OPENROUTER_TITLE", "Intel Refinery")
  },
  gemini: {
    timeoutMs: parseInt(getEnv("AI_PROVIDER_TIMEOUT_MS", "120000"))
  },
  groq: {
    timeoutMs: parseInt(getEnv("AI_PROVIDER_TIMEOUT_MS", "120000"))
  },
  ollama: {
    timeoutMs: parseInt(getEnv("AI_PROVIDER_TIMEOUT_MS", "120000"))
  }
};

const getTaskConfig = (taskType) =>
  taskRouting[taskType] || taskRouting.observe;

const getProviderConfig = (providerName) =>
  providerDefaults[providerName] || providerDefaults.openrouter;

function resolveByCapabilities(requiredCapabilities) {
  if (!requiredCapabilities || requiredCapabilities.length === 0) {
    return taskRouting.observe;
  }

  let bestTask = null;
  let bestScore = -1;

  for (const [taskType, config] of Object.entries(taskRouting)) {
    const taskCaps = config.capabilities || [];
    const score = requiredCapabilities.filter((c) => taskCaps.includes(c)).length;
    if (score > bestScore) {
      bestScore = score;
      bestTask = config;
    }
  }

  return bestTask || taskRouting.observe;
}

module.exports = {
  taskRouting,
  providerDefaults,
  getTaskConfig,
  getProviderConfig,
  resolveByCapabilities,
  CAPABILITY_INDEX
};
