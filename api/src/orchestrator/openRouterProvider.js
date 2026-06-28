// OpenRouter AI provider — OpenAI-compatible API
// Used as the primary provider for all refinery AI tasks

const OpenAI = require("openai");
const { getProviderConfig } = require("./config");

let clientInstance = null;

const getClient = () => {
  if (clientInstance) return clientInstance;

  const config = getProviderConfig("openrouter");

  if (!config.apiKey) {
    return null;
  }

  clientInstance = new OpenAI({
    baseURL: config.baseURL,
    apiKey: config.apiKey,
    defaultHeaders: {
      "HTTP-Referer": config.referer || "https://refinery.local",
      "X-Title": config.title || "Intel Refinery"
    }
  });

  return clientInstance;
};

const createBody = (promptText, options = {}) => {
  const messages = [];

  if (options.systemMessage) {
    messages.push({ role: "system", content: options.systemMessage });
  }

  messages.push({ role: "user", content: promptText });

  const body = {
    model: options.model,
    messages,
    temperature: options.temperature ?? 0.2,
    max_tokens: options.maxTokens ?? 8192
  };

  if (options.jsonMode) {
    body.response_format = { type: "json_object" };
  }

  return body;
};

const generate = async (prompt, options = {}) => {
  const config = getProviderConfig("openrouter");
  const client = getClient();

  if (!client) {
    return {
      success: false,
      provider: "openrouter",
      model: options.model || "unknown",
      error: "OPENROUTER_API_KEY is not set. Set OPENROUTER_API_KEY in .env to enable AI tasks."
    };
  }

  const body = createBody(prompt, options);

  const startTime = Date.now();

  const response = await client.chat.completions.create(body);

  const durationMs = Date.now() - startTime;

  const choice = response.choices && response.choices[0];
  if (!choice) {
    throw new Error("OpenRouter returned no choices");
  }

  const text = choice.message.content || "";

  return {
    success: true,
    provider: "openrouter",
    model: response.model || options.model,
    text,
    raw: response,
    usage: response.usage ? {
      promptTokens: response.usage.prompt_tokens,
      completionTokens: response.usage.completion_tokens,
      totalTokens: response.usage.total_tokens
    } : null,
    durationMs
  };
};

const resetClient = () => {
  clientInstance = null;
};

module.exports = { generate, resetClient };