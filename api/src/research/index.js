const registry = require("./registry");
const validators = require("./validators");
const orchestrator = require("../orchestrator");
const { safeJsonParse } = require("../utils/safeJsonParse");

const STAGE_TO_TASK = {
  observation: "observe",
  connection: "connect",
  understanding: "understand",
  reflection: "reflect",
  presentation: "generate_view",
  validation: "quality_review"
};

let initialized = false;

function ensureInit() {
  if (!initialized) {
    registry.init();
    initialized = true;
  }
}

function getProtocol(protocolId, version) {
  ensureInit();
  return registry.get(protocolId, version);
}

function listProtocols() {
  ensureInit();
  return registry.list();
}

async function executeProtocol(protocolId, input, options = {}) {
  ensureInit();

  const protocol = registry.get(protocolId);
  if (!protocol) {
    throw new Error(`Protocol not found: ${protocolId}`);
  }

  // Compile the prompt from protocol template + input
  const prompt = protocol.compile ? protocol.compile(input) : buildDefaultPrompt(protocol, input);

  // Determine task type for orchestration routing
  const taskType = options.taskType || STAGE_TO_TASK[protocol.stage] || protocol.stage;

  // Execute via orchestrator
  const startTime = Date.now();
  const result = await orchestrator.execute(taskType, prompt);
  const durationMs = Date.now() - startTime;

  if (!result.success) {
    return {
      success: false,
      output: null,
      error: result.error,
      protocol: { id: protocolId, version: protocol.version },
      durationMs,
      model: result.model,
      provider: result.provider,
      usage: result.usage
    };
  }

  // Parse the raw text output
  const defaults = options.defaults || getDefaultsForProtocol(protocol);
  const parsed = safeJsonParse(result.text, defaults);

  // Validate against protocol schema
  const validation = validators.validate(protocol, parsed);

  if (!validation.success) {
    return {
      success: false,
      output: parsed,
      error: `Protocol validation failed: ${validation.errors.join("; ")}`,
      validation: validators.buildValidationSummary(protocol, validation, durationMs),
      protocol: { id: protocolId, version: protocol.version },
      durationMs,
      model: result.model,
      provider: result.provider,
      usage: result.usage
    };
  }

  return {
    success: true,
    output: validation.data,
    protocol: { id: protocolId, version: protocol.version },
    validation: validators.buildValidationSummary(protocol, validation, durationMs),
    durationMs,
    model: result.model,
    provider: result.provider,
    usage: result.usage
  };
}

function buildDefaultPrompt(protocol, input) {
  const systemInstructions = protocol.systemInstructions || "";
  const userContent = typeof protocol.userTemplate === "function"
    ? protocol.userTemplate(input)
    : protocol.userTemplate || JSON.stringify(input, null, 2);

  return `${systemInstructions}\n\n${userContent}`;
}

function getDefaultsForProtocol(protocol) {
  const stageDefaults = {
    observation: { artifacts: [], evidence: [] },
    connection: { connections: [], connectionEvidence: [], artifacts: [] },
    understanding: { newArtifacts: [], connections: [], mergeSuggestions: [], refinements: [] },
    reflection: { newArtifacts: [], connections: [], statusChanges: [] },
    presentation: { viewType: "report", title: "Refinery Report", structure: { sections: [] }, content: { sections: [], metadata: {} } }
  };
  return stageDefaults[protocol.stage] || {};
}

module.exports = { executeProtocol, getProtocol, listProtocols };
