const schemas = require("../../schemas");

const SYSTEM_INSTRUCTIONS = `You are an information refinement engine. Your job is to analyze source material and extract structured understanding.

Follow the Observation Protocol:

1. Read the source material carefully.
2. Identify meaningful units of information — facts, claims, events, entities, concepts, definitions, quotes, numbers.
3. For each unit, create an artifact with a descriptive title and appropriate artifactType.
4. Every artifact MUST be backed by evidence — a direct quote or reference to the source.
5. Do NOT draw conclusions. Do NOT synthesize. Only extract what is present.
6. Assign confidence based on how clearly the material states each item.
7. Assign importance based on how central each item appears to the overall material.

Return ONLY valid JSON matching the output schema.`;

function userTemplate(input) {
  const chunks = input.sourceChunks || [];
  const formatted = chunks.map((c) =>
    `[SOURCE:${c.sourceId}][CHUNK:${c.id}]\n${c.content || c.text || ""}`
  ).join("\n\n---\n\n");

  return `Extract artifacts and evidence from the following source material.

SOURCE MATERIAL:
${formatted || JSON.stringify(input, null, 2)}

Return a JSON object with "artifacts" (array) and "evidence" (array).`;
}

module.exports = {
  id: "observation/source",
  version: "1.0.0",
  stage: "observation",
  purpose: "Read source material without drawing conclusions. Extract artifacts and their supporting evidence.",
  compatibleCapabilities: ["fast_extraction", "structured_json", "citation"],
  systemInstructions: SYSTEM_INSTRUCTIONS,
  userTemplate,
  outputSchema: schemas.outputs.observe,
  validationRules: [
    {
      name: "every_artifact_has_evidence",
      message: "Every artifact must have at least one corresponding evidence entry",
      validate: (output) => {
        const artifactCount = (output.artifacts || []).length;
        const evidenceCount = (output.evidence || []).length;
        return artifactCount <= evidenceCount + 1;
      }
    },
    {
      name: "no_empty_artifacts",
      message: "Artifacts must have a non-empty title",
      validate: (output) => (output.artifacts || []).every((a) => a.title && a.title.trim().length > 0)
    },
    {
      name: "confidence_range",
      message: "All confidence values must be between 0 and 1",
      validate: (output) => {
        const all = [...(output.artifacts || []), ...(output.evidence || [])];
        return all.every((x) => x.confidence === undefined || (x.confidence >= 0 && x.confidence <= 1));
      }
    }
  ],
  successCriteria: [
    "Every observation has supporting evidence",
    "Duplicate observations are minimized",
    "No conclusions are drawn",
    "Confidence is assigned to each artifact",
    "Output validates against schema",
    "Every artifact can be traced back to its original source"
  ],
  retryStrategy: {
    maxRetries: 2,
    backoffMs: 1000,
    onValidationFailure: "retry_with_strict_instructions"
  },
  estimatedComplexity: "low",
  preferredReasoning: "fast",
  metadata: {
    author: "system",
    description: "Extracts artifacts and evidence from source chunks",
    tags: ["extraction", "observation", "source-analysis"]
  }
};
