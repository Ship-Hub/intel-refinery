const schemas = require("../../schemas");

const SYSTEM_INSTRUCTIONS = `You are a reflection engine. Your job is to challenge a knowledge graph, identify its weaknesses, and suggest improvements.

Follow the Reflection Protocol:

1. Review the artifacts and their connections critically.
2. Identify weak assumptions — artifacts with low confidence or contradictory connections.
3. Identify missing evidence — what information would strengthen or weaken key claims.
4. Identify gaps in understanding — what is not known that should be.
5. Generate questions that, if answered, would improve the model.
6. Suggest alternative explanations where the current understanding may be wrong.
7. Recommend status changes — which artifacts should be weakened, rejected, merged, or archived.
8. Do NOT generate presentation content. Reflection exists to improve the model, not to generate output for users.

Return ONLY valid JSON matching the output schema.`;

function userTemplate(input) {
  return `Critically review and challenge the following knowledge graph.

EXISTING ARTIFACTS:
${JSON.stringify(input.artifacts || [], null, 2)}

EXISTING CONNECTIONS:
${JSON.stringify(input.connections || [], null, 2)}

Return a JSON object with "newArtifacts" (gaps, questions, risks, alternatives), "connections", and "statusChanges".`;
}

module.exports = {
  id: "reflection/model",
  version: "1.0.0",
  stage: "reflection",
  purpose: "Challenge the current understanding by identifying weaknesses, gaps, alternative explanations, and opportunities for improvement.",
  compatibleCapabilities: ["deep_reasoning", "critical_analysis", "structured_json", "long_context"],
  systemInstructions: SYSTEM_INSTRUCTIONS,
  userTemplate,
  outputSchema: schemas.outputs.reflect,
  validationRules: [
    {
      name: "status_changes_have_reason",
      message: "Status change suggestions must include a reason",
      validate: (output) => (output.statusChanges || []).every((s) => s.reason && s.reason.trim().length > 0)
    },
    {
      name: "new_artifacts_have_types",
      message: "Reflection artifacts should use specific types: knowledge_gap, question, risk, assumption, alternative_explanation, limitation",
      validate: (output) => (output.newArtifacts || []).every((a) =>
        a.artifactType && ["knowledge_gap", "question", "risk", "assumption", "alternative_explanation", "limitation"].includes(a.artifactType)
      )
    },
    {
      name: "connections_target_existing",
      message: "Reflection connections should use toArtifactId to reference existing artifacts",
      validate: (output) => (output.connections || []).every((c) => c.toArtifactId)
    }
  ],
  successCriteria: [
    "Weak assumptions are identified with reasoning",
    "Missing evidence is specifically described",
    "Questions are actionable and answerable",
    "Alternative explanations are plausible",
    "Status changes are justified",
    "Output validates against schema"
  ],
  retryStrategy: {
    maxRetries: 1,
    backoffMs: 2000,
    onValidationFailure: "retry_with_fewer_constraints"
  },
  estimatedComplexity: "high",
  preferredReasoning: "deep",
  metadata: {
    author: "system",
    description: "Challenges the knowledge graph to identify weaknesses and improvements",
    tags: ["reflection", "critique", "gap-analysis", "quality"]
  }
};
