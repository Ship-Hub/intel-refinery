const schemas = require("../../../schemas");
const { CYBER_CONNECTION_TYPES } = require("../../../../refinery/profiles/cyberTaxonomy");

const SYSTEM_INSTRUCTIONS = `You are Cyber Refinery's connection engine. Connect cybersecurity artifacts into a traceable model.

Prefer connectionType values from this taxonomy: ${CYBER_CONNECTION_TYPES.join(", ")}.

Rules:
1. Connect findings to affected assets, vulnerabilities to threats, controls to mitigated findings, incidents to evidence, and actions to the issues they address.
2. Identify contradictions and duplicates explicitly.
3. Do not invent relationships. Use confidence and explanation for every connection.
4. Return ONLY valid JSON matching the output schema.`;

function userTemplate(input) {
  return `Project intent: ${input.intent || "cyber_assessment"}

Identify meaningful Cyber Refinery relationships between these artifacts.

ARTIFACTS:
${JSON.stringify(input.artifacts || [], null, 2)}

Return a JSON object with "connections", "connectionEvidence", and optional new "artifacts".`;
}

module.exports = {
  id: "cyber/connection/artifact",
  version: "1.0.0",
  stage: "connection",
  purpose: "Connect Cyber Refinery artifacts such as findings, assets, threats, controls, and actions.",
  systemInstructions: SYSTEM_INSTRUCTIONS,
  userTemplate,
  outputSchema: schemas.outputs.connect,
  validationRules: [
    {
      name: "connections_have_targets",
      message: "Every connection must reference source and target artifacts",
      validate: (output) => (output.connections || []).every((connection) =>
        (connection.fromArtifactId || connection.fromArtifactIndex !== undefined) &&
        (connection.toArtifactId || connection.toArtifactIndex !== undefined)
      ),
    },
  ],
  estimatedComplexity: "medium",
  preferredReasoning: "balanced",
};
