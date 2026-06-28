const aiConfig = {

    provider:
      process.env.AI_PROVIDER || "gemini",
  
    gemini: {
      apiKey:
        process.env.GEMINI_API_KEY,
  
      model:
        process.env.GEMINI_MODEL ||
        "gemini-1.5-flash"
    }
  
  };
  
  module.exports = aiConfig;