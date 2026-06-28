const schemas = require("../../schemas");

const SYSTEM_INSTRUCTIONS = `You are a relationship discovery engine. Your job is to find meaningful connections between artifacts in a knowledge graph.

Follow the Connection Protocol:

1. Review all artifacts and identify genuine relationships between them.
2. For each relationship, determine the appropriate connectionType: supports, contradicts, related_to, mentions, causes, contains, belongs_to, derived_from, same_as, compared_with, precedes, follows, influenced_by, strengthens, weakens, extends, or any other relevant type.
3. Do NOT create trivial connections. Only connect artifacts that genuinely relate.
4. For contradictions, clearly explain what conflicts.
5. For 'same_as' connections, explain why they appear to be the same thing.
6. If patterns or insights emerge from the connections, return them as new artifacts.
7. Every connection should have an explanation and confidence score.

Return ONLY valid JSON matching the output schema.`;

function userTemplate(input) {
  return `Identify meaningful relationships between the following artifacts.

ARTIFACTS:
${JSON.stringify(input.artifacts || [], null, 2)}

Return a JSON object with "connections" (array), "connectionEvidence" (array), and optional "artifacts" (array of newly discovered artifacts).`;
}

module.exports = {
  id: "connection/artifact",
  version: "1.0.0",
  stage: "connection",
  purpose: "Discover and establish meaningful relationships between artifacts in the knowledge graph.",
  compatibleCapabilities: ["relationship_detection", "structured_json", "pattern_recognition"],
  systemInstructions: SYSTEM_INSTRUCTIONS,
  userTemplate,
  outputSchema: schemas.outputs.connect,
  validationRules: [
    {
      name: "connections_have_type",
      message: "Every connection must have a non-empty connectionType",
      validate: (output) => (output.connections || []).every((c) => c.connectionType && c.connectionType.trim().length > 0)
    },
    {
      name: "connections_have_targets",
      message: "Every connection must reference source and target artifacts",
      validate: (output) => (output.connections || []).every((c) =>
        (c.fromArtifactId || c.fromArtifactIndex !== undefined) &&
        (c.toArtifactId || c.toArtifactIndex !== undefined)
      )
    },
    {
      name: "new_artifacts_valid",
      message: "New artifacts discovered through connections must have titles",
      validate: (output) => (output.artifacts || []).every((a) => a.title && a.title.trim().length > 0)
    }
  ],
  successCriteria: [
    "Genuine relationships are identified (not forced)",
    "Contradictions are clearly explained",
    "Duplicates are flagged with same_as",
    "Patterns are extracted as new artifacts",
    "Output validates against schema"
  ],
  retryStrategy: {
    maxRetries: 1,
    backoffMs: 2000,
    onValidationFailure: "retry_with_relaxed_requirements"
  },
  estimatedComplexity: "medium",
  preferredReasoning: "balanced",
  metadata: {
    author: "system",
    description: "Discovers connections between artifacts in a project",
    tags: ["relationship", "connection", "graph-analysis"]
  }
};
