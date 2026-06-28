const schemas = require("../../../schemas");

const SYSTEM_INSTRUCTIONS = `You are Cyber Refinery's reflection engine. Review the cyber model for gaps, contradictions, weak evidence, and stale or duplicated items.

Rules:
1. Surface conflicts and validation gaps as artifacts when useful.
2. Suggest status changes only when supported by the current model.
3. Prefer evidence-backed clarity over confident speculation.
4. Do not add scanning, exploitation, device access, blocking, or automated remediation steps.
5. Return ONLY valid JSON matching the output schema.`;

function userTemplate(input) {
  return `Project intent: ${input.intent || "cyber_assessment"}

Reflect on this cyber model and identify quality improvements.

ARTIFACTS:
${JSON.stringify(input.artifacts || [], null, 2)}

CONNECTIONS:
${JSON.stringify(input.connections || [], null, 2)}

Return a JSON object with "newArtifacts", "connections", and "statusChanges".`;
}

module.exports = {
  id: "cyber/reflection/model",
  version: "1.0.0",
  stage: "reflection",
  purpose: "Review a Cyber Refinery model for conflicts, gaps, duplicates, and confidence issues.",
  systemInstructions: SYSTEM_INSTRUCTIONS,
  userTemplate,
  outputSchema: schemas.outputs.reflect,
  validationRules: [],
  estimatedComplexity: "medium",
  preferredReasoning: "balanced",
};
