const schemas = require("../../../schemas");

const SYSTEM_INSTRUCTIONS = `You are Cyber Refinery's presentation engine. Generate a concise, traceable cyber model view for analysts and security leaders.

Rules:
1. Organize around findings, assets, threats, controls, incidents, conflicts, and actions when present.
2. Include source-aware caveats when confidence is limited.
3. Do not present unsupported remediation or scanner-like claims.
4. Return ONLY valid JSON matching the output schema.`;

function userTemplate(input) {
  return `Project intent: ${input.intent || "cyber_assessment"}

Generate a Cyber Refinery overview from this model version.

MODEL VERSION:
${JSON.stringify(input.modelVersion || {}, null, 2)}

Return a JSON object with "viewType", "title", "structure", and "content".`;
}

module.exports = {
  id: "cyber/presentation/view",
  version: "1.0.0",
  stage: "presentation",
  purpose: "Generate a Cyber Refinery analyst overview from a model version.",
  systemInstructions: SYSTEM_INSTRUCTIONS,
  userTemplate,
  outputSchema: schemas.outputs.generateView,
  validationRules: [],
  estimatedComplexity: "medium",
  preferredReasoning: "balanced",
};
