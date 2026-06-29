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

const taskRouting = {
  observe: {
    provider: "openrouter",
    model: getOpenRouterModel("OPENROUTER_OBSERVE_MODEL", "deepseek/deepseek-v4-flash"),
    temperature: 0.2,
    maxTokens: 8192,
    jsonMode: true,
    retries: 1,
    capabilities: ["fast_extraction", "structured_json", "citation"],
    fallback: {
      provider: "groq",
      model: getEnv("GROQ_MODEL", "llama-3.3-70b-versatile")
    }
  },

  connect: {
    provider: "openrouter",
    model: getOpenRouterModel("OPENROUTER_CONNECT_MODEL", "deepseek/deepseek-v4-pro"),
    temperature: 0.1,
    maxTokens: 16384,
    jsonMode: true,
    retries: 1,
    capabilities: ["relationship_detection", "structured_json", "pattern_recognition"],
    fallback: {
      provider: "groq",
      model: getEnv("GROQ_MODEL", "llama-3.3-70b-versatile")
    }
  },

  understand: {
    provider: "openrouter",
    model: getOpenRouterModel("OPENROUTER_UNDERSTAND_MODEL", "deepseek/deepseek-v4-pro"),
    temperature: 0.3,
    maxTokens: 16384,
    jsonMode: true,
    retries: 1,
    capabilities: ["deep_reasoning", "structured_json", "long_context", "synthesis"],
    fallback: {
      provider: "groq",
      model: getEnv("GROQ_MODEL", "llama-3.3-70b-versatile")
    }
  },

  reflect: {
    provider: "openrouter",
    model: getOpenRouterModel("OPENROUTER_REFLECT_MODEL", "deepseek/deepseek-v4-pro"),
    temperature: 0.4,
    maxTokens: 8192,
    jsonMode: true,
    retries: 1,
    capabilities: ["deep_reasoning", "critical_analysis", "structured_json", "long_context"],
    fallback: {
      provider: "groq",
      model: getEnv("GROQ_MODEL", "llama-3.3-70b-versatile")
    }
  },

  generate_view: {
    provider: "openrouter",
    model: getOpenRouterModel("OPENROUTER_VIEW_MODEL", "deepseek/deepseek-v4-flash"),
    temperature: 0.4,
    maxTokens: 16384,
    jsonMode: false,
    retries: 1,
    capabilities: ["long_context", "structured_json", "narrative_generation"],
    fallback: {
      provider: "groq",
      model: getEnv("GROQ_MODEL", "llama-3.3-70b-versatile")
    }
  },

  quality_review: {
    provider: "openrouter",
    model: getOpenRouterModel("OPENROUTER_QUALITY_MODEL", "deepseek/deepseek-v4-flash"),
    temperature: 0.1,
    maxTokens: 4096,
    jsonMode: true,
    retries: 1,
    capabilities: ["structured_json", "critical_analysis"],
    fallback: {
      provider: "groq",
      model: getEnv("GROQ_MODEL", "llama-3.3-70b-versatile")
    }
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
