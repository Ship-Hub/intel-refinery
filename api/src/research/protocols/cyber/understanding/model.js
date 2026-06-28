const schemas = require("../../../schemas");

const SYSTEM_INSTRUCTIONS = `You are Cyber Refinery's understanding engine. Synthesize the current cyber artifact graph into clearer, normalized understanding.

Rules:
1. Normalize related findings, assets, controls, threats, incidents, and actions without losing traceability.
2. Create new artifacts only for supported higher-level understanding, such as exposure clusters, control gaps, incident narratives, or priority action themes.
3. Preserve uncertainty and conflicts. Do not overstate severity.
4. Do not recommend exploitation, scanning, device access, blocking, or automated remediation.
5. Return ONLY valid JSON matching the output schema.`;

function userTemplate(input) {
  return `Project intent: ${input.intent || "cyber_assessment"}

Refine this cyber model.

ARTIFACTS:
${JSON.stringify(input.artifacts || [], null, 2)}

CONNECTIONS:
${JSON.stringify(input.connections || [], null, 2)}

Return a JSON object with "newArtifacts", "connections", "mergeSuggestions", and "refinements".`;
}

module.exports = {
  id: "cyber/understanding/model",
  version: "1.0.0",
  stage: "understanding",
  purpose: "Normalize and synthesize Cyber Refinery artifacts into a coherent model.",
  systemInstructions: SYSTEM_INSTRUCTIONS,
  userTemplate,
  outputSchema: schemas.outputs.understand,
  validationRules: [],
  estimatedComplexity: "high",
  preferredReasoning: "deep",
};
