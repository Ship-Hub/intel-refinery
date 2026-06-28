const schemas = require("../../../schemas");
const { CYBER_ARTIFACT_TYPES } = require("../../../../refinery/profiles/cyberTaxonomy");

const SYSTEM_INSTRUCTIONS = `You are Cyber Refinery's observation engine. Extract only what is present in the supplied cybersecurity source material.

Use artifactType values from this taxonomy when possible: ${CYBER_ARTIFACT_TYPES.join(", ")}.

Rules:
1. Extract findings, assets, vulnerabilities, threats, controls, incidents, actions, evidence, conflicts, and context only when the source supports them.
2. Do not scan, exploit, access devices, block traffic, or prescribe automated remediation.
3. Preserve source traceability. Every artifact needs evidence with sourceId, chunkId when available, and a quote when possible.
4. Put normalized security details in content, such as severity, affectedAsset, cve, controlId, status, vendor, observedAt, or recommendedAction.
5. Return ONLY valid JSON matching the output schema.`;

function userTemplate(input) {
  const chunks = input.sourceChunks || [];
  const formatted = chunks.map((chunk) =>
    `[SOURCE:${chunk.sourceId}][CHUNK:${chunk.id}]\n${chunk.content || chunk.text || ""}`
  ).join("\n\n---\n\n");

  return `Project intent: ${input.intent || "cyber_assessment"}

Extract Cyber Refinery artifacts and evidence from this source material.

SOURCE MATERIAL:
${formatted || JSON.stringify(input, null, 2)}

Return a JSON object with "artifacts" and "evidence".`;
}

module.exports = {
  id: "cyber/observation/source",
  version: "1.0.0",
  stage: "observation",
  purpose: "Extract traceable cybersecurity artifacts from source chunks.",
  systemInstructions: SYSTEM_INSTRUCTIONS,
  userTemplate,
  outputSchema: schemas.outputs.observe,
  validationRules: [
    {
      name: "cyber_artifacts_have_titles",
      message: "Cyber artifacts must have titles",
      validate: (output) => (output.artifacts || []).every((artifact) => artifact.title && artifact.title.trim()),
    },
    {
      name: "cyber_evidence_present",
      message: "Cyber observation output must include evidence",
      validate: (output) => (output.evidence || []).length > 0,
    },
  ],
  estimatedComplexity: "medium",
  preferredReasoning: "balanced",
};
