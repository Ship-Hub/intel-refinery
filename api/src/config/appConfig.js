const env =
  require("./env");

const appConfig = {

  server: {
    port: env.PORT
  },

  nodeEnv: env.NODE_ENV,

  uploads: {
    maxFileSize: 50 * 1024 * 1024, // 50MB for refinery uploads
    acceptedMimeTypes: [
      "image/png", "image/jpeg", "image/jpg", "image/webp",
      "application/pdf",
      "text/plain", "text/markdown", "text/csv",
      "audio/ogg", "audio/mpeg", "audio/mp4", "audio/x-m4a", "audio/wav", "audio/webm"
    ]
  },

  ai: {
    primaryProvider: env.AI_PROVIDER,
    fallbackProvider: env.AI_FALLBACK_PROVIDER || null,
    maxProviderAttempts: Math.min(Math.max(1, env.AI_MAX_PROVIDER_ATTEMPTS), 3),
    providerTimeoutMs: env.AI_PROVIDER_TIMEOUT_MS,
    model: env.GEMINI_MODEL,
    geminiFallbackModel: env.GEMINI_FALLBACK_MODEL || null,
    groqModel: env.GROQ_MODEL,
    ollamaModel: env.OLLAMA_MODEL,
    openrouterApiKey: env.OPENROUTER_API_KEY,
    openrouterTimeoutMs: env.OPENROUTER_TIMEOUT_MS || 120000,
    openrouterModel: env.OPENROUTER_OBSERVE_MODEL,

    maxInputLength: 15000,
    maxChunkSize: 8000,
    maxChunksPerTask: 25
  },

  refinery: {
    chunkSizeChars: 2000,
    maxSourcesPerProject: 100,
    maxFileSizePerSource: 50 * 1024 * 1024,
    worker: {
      pollIntervalMs: 5000,
      jobTimeoutMinutes: 15,
      maxRetries: 3,
      retryBaseDelayMinutes: 1
    }
  },

  workers: {
    pollInterval: 5000,
    jobTimeoutMinutes: 15,
    maxRetries: 3,
    retryBaseDelayMinutes: 1
  }

};

module.exports = appConfig;
