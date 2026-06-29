const schemas = require("../../schemas");

const SYSTEM_INSTRUCTIONS = `You are a presentation engine. Your job is to render a structured Refinery Model into human-readable formats.

Follow the Presentation Protocol:

1. Review the Refinery Model: artifacts, connections, and evidence.
2. Write for a smart 15-year-old. Use short sentences, familiar words, and concrete labels.
3. Start with the answer, not database counts. Say who or what this is about, what the sources suggest, what is connected, and what is still uncertain.
4. Choose an appropriate viewType based on the content: report, executive_brief, study_guide, timeline, knowledge_graph, mind_map, markdown_overview.
5. Organize the content naturally by theme, chronology, hierarchy, or any structure that fits.
6. Include sections named "Short answer", "What we found", "How the dots connect", "What is uncertain", and "Source notes" when the source material supports them.
7. Every claim in the output MUST be supported by the artifacts/evidence in the model. Do NOT invent.
8. Do not include raw internal artifacts like CAPTCHA blocks, empty artifact warnings, or connection-direction diagnostics in the main answer. Put them under uncertainty only if they matter.
9. The structure defines the skeleton; the content fills it in with prose.
10. Include metadata about the model (artifact count, source count, confidence).
11. Do NOT modify or suggest modifications to the model. Presentation only renders.

Return ONLY valid JSON matching the output schema.`;

function userTemplate(input) {
  const modelData = input.modelVersion || input;
  return `Generate a presentation view from the following Refinery Model.

REFINERY MODEL:
${JSON.stringify(modelData, null, 2)}

Return a JSON object with "viewType", "title", "structure" (with sections), and "content" (with section bodies and metadata).

The first section body must be a concise plain-English answer. Avoid "Refinery Model with..." as user-facing prose.`;
}

module.exports = {
  id: "presentation/view",
  version: "1.0.0",
  stage: "presentation",
  purpose: "Transform the Refinery Model into user-facing representations without modifying the underlying understanding.",
  compatibleCapabilities: ["long_context", "structured_json", "narrative_generation"],
  systemInstructions: SYSTEM_INSTRUCTIONS,
  userTemplate,
  outputSchema: schemas.outputs.generateView,
  validationRules: [
    {
      name: "has_content",
      message: "View must have at least one section with content",
      validate: (output) => {
        const sections = output.content?.sections || output.structure?.sections || [];
        return sections.length > 0;
      }
    },
    {
      name: "has_title",
      message: "View must have a non-empty title",
      validate: (output) => output.title && output.title.trim().length > 0
    },
    {
      name: "view_type_recognized",
      message: "viewType should be one of the recognized types",
      validate: (output) =>
        ["report", "executive_brief", "study_guide", "timeline", "knowledge_graph", "mind_map", "markdown_overview"].includes(output.viewType)
    }
  ],
  successCriteria: [
    "Content is organized logically for the chosen viewType",
    "Every claim is supported by the model",
    "No model modifications are suggested",
    "Metadata is accurate",
    "Output validates against schema"
  ],
  retryStrategy: {
    maxRetries: 2,
    backoffMs: 1000,
    onValidationFailure: "retry_with_default_view"
  },
  estimatedComplexity: "medium",
  preferredReasoning: "balanced",
  metadata: {
    author: "system",
    description: "Generates human-readable presentation views from the Refinery Model",
    tags: ["presentation", "report", "view", "rendering"]
  }
};
