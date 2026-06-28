const schemas = require("../../schemas");

const SYSTEM_INSTRUCTIONS = `You are an understanding engine. Your job is to deepen, refine, and synthesize knowledge from a collection of artifacts and their connections.

Follow the Understanding Protocol:

1. Review the existing artifacts and their connections.
2. Create synthesis artifacts — hypotheses, insights, themes, organizing concepts that emerge from the whole.
3. Identify duplicate artifacts and suggest merges.
4. Refine existing artifacts — adjust confidence based on corroborating or contradicting connections.
5. Find new connections that were missed in earlier passes.
6. Hypotheses should be testable propositions, not conclusions.
7. Insights should be non-obvious syntheses.
8. Every hypothesis must be connected via 'supports' or 'contradicts' to relevant evidence artifacts.

Return ONLY valid JSON matching the output schema.`;

function userTemplate(input) {
  return `Deepen the understanding of this project by synthesizing, refining, and connecting the following artifacts.

EXISTING ARTIFACTS:
${JSON.stringify(input.artifacts || [], null, 2)}

EXISTING CONNECTIONS:
${JSON.stringify(input.connections || [], null, 2)}

Return a JSON object with "newArtifacts", "connections", "mergeSuggestions", and "refinements".`;
}

module.exports = {
  id: "understanding/model",
  version: "1.0.0",
  stage: "understanding",
  purpose: "Transform observations into structured understanding by synthesizing hypotheses, insights, and refining the knowledge graph.",
  compatibleCapabilities: ["deep_reasoning", "structured_json", "long_context", "synthesis"],
  systemInstructions: SYSTEM_INSTRUCTIONS,
  userTemplate,
  outputSchema: schemas.outputs.understand,
  validationRules: [
    {
      name: "merge_suggestions_refer_existing",
      message: "Merge suggestions must reference existing artifact IDs",
      validate: (output) => (output.mergeSuggestions || []).every((m) =>
        m.keepArtifactId && m.discardArtifactId && m.reason
      )
    },
    {
      name: "refinements_have_updates",
      message: "Refinements must include at least one update field",
      validate: (output) => (output.refinements || []).every((r) =>
        r.artifactId && r.updates && Object.keys(r.updates).length > 0
      )
    },
    {
      name: "new_connections_refer_targets",
      message: "New connections must specify from/to either by index or ID",
      validate: (output) => (output.connections || []).every((c) =>
        (c.fromArtifactId || c.fromArtifactIndex !== undefined) &&
        (c.toArtifactId || c.toArtifactIndex !== undefined) &&
        c.connectionType
      )
    }
  ],
  successCriteria: [
    "Hypotheses are clearly stated and testable",
    "Insights are non-obvious and synthesized from the whole graph",
    "Duplicate artifacts are flagged for merge",
    "Confidence adjustments are justified by connections",
    "Output validates against schema"
  ],
  retryStrategy: {
    maxRetries: 1,
    backoffMs: 3000,
    onValidationFailure: "retry_with_simplified_instructions"
  },
  estimatedComplexity: "high",
  preferredReasoning: "deep",
  metadata: {
    author: "system",
    description: "Deepens understanding through synthesis, hypothesis generation, and refinement",
    tags: ["synthesis", "hypothesis", "refinement", "understanding"]
  }
};
