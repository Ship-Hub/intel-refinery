require("dotenv").config();
const env = require("../src/config/env");
console.log("GROQ_API_KEY configured:", !!env.GROQ_API_KEY);
console.log("GROQ_MODEL:", env.GROQ_MODEL);

const orchestrator = require("../src/orchestrator");
const prompts = require("../src/tasks/prompts");

(async () => {
  const text =
    'Q4 revenue reached $12.3M, up 22% YoY. The CEO announced a new AI division named RefineryAI. The CTO resigned unexpectedly.';
  const prompt = prompts.EXTRACTION_PROMPT(text);
  console.log("Extracting observations...");
  const result = await orchestrator.execute("extraction", prompt);
  console.log("SUCCESS:", result.success);
  console.log("MODEL:", result.model);
  if (result.success && result.text) {
    console.log("TEXT (first 300):", result.text.substring(0, 300));
    try {
      const parsed = JSON.parse(result.text);
      console.log("Observations:", parsed.observations?.length);
      console.log("Entities:", parsed.entities?.length);
    } catch (e) {
      console.log("Parse error:", e.message);
    }
  } else {
    console.log("Error:", result.error);
  }
})().catch((e) => console.error("Fatal:", e.message));
