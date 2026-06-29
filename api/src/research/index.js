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
  const parsed = normalizeParsedOutput(protocol, safeJsonParse(result.text, defaults), input);

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

function coerceScore(value, fallback) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.max(0, Math.min(1, value));
  }

  if (typeof value === "string") {
    const trimmed = value.trim().toLowerCase();
    const parsed = Number.parseFloat(trimmed);
    if (Number.isFinite(parsed)) {
      return Math.max(0, Math.min(1, parsed > 1 ? parsed / 100 : parsed));
    }

    const qualitativeScores = {
      very_high: 0.95,
      "very high": 0.95,
      high: 0.85,
      strong: 0.85,
      medium: 0.6,
      moderate: 0.6,
      med: 0.6,
      low: 0.35,
      weak: 0.35,
      very_low: 0.15,
      "very low": 0.15,
      unknown: fallback,
      unclear: fallback
    };

    if (qualitativeScores[trimmed] !== undefined) {
      return qualitativeScores[trimmed];
    }
  }

  return fallback;
}

function normalizeArtifact(artifact, fallbackTitle = "Extracted artifact") {
  const normalized = typeof artifact === "object" && artifact !== null
    ? { ...artifact }
    : {
        title: fallbackTitle,
        summary: String(artifact || ""),
        content: { text: String(artifact || "") }
      };

  if (!normalized.title || typeof normalized.title !== "string") {
    normalized.title = normalized.summary || fallbackTitle;
  }

  if (typeof normalized.content === "string") {
    normalized.content = { text: normalized.content };
  } else if (Array.isArray(normalized.content)) {
    normalized.content = { items: normalized.content };
  } else if (normalized.content == null) {
    normalized.content = undefined;
  } else if (typeof normalized.content !== "object") {
    normalized.content = { value: normalized.content };
  }

  normalized.confidence = coerceScore(normalized.confidence, 1);
  normalized.importance = coerceScore(normalized.importance, 0.5);

  return normalized;
}

function normalizeArtifactArrays(parsed) {
  if (Array.isArray(parsed.artifacts)) {
    parsed.artifacts = parsed.artifacts.map((artifact, index) =>
      normalizeArtifact(artifact, `Extracted artifact ${index + 1}`)
    );
  }

  if (Array.isArray(parsed.newArtifacts)) {
    parsed.newArtifacts = parsed.newArtifacts.map((artifact, index) =>
      normalizeArtifact(artifact, `Discovered artifact ${index + 1}`)
    );
  }
}

function normalizeParsedOutput(protocol, parsed, input = {}) {
  if (!parsed || typeof parsed !== "object") return parsed;
  normalizeArtifactArrays(parsed);
  if (protocol.stage !== "observation") return parsed;

  const chunks = input.sourceChunks || [];
  const fallbackChunk = chunks[0] || null;
  const sourceByChunk = new Map(chunks.map((chunk) => [chunk.id, chunk.sourceId]));

  parsed.artifacts = (parsed.artifacts || []).map((artifact) => ({
    ...artifact,
    confidence: coerceScore(artifact.confidence, 1),
    importance: coerceScore(artifact.importance, 0.5),
    firstSeenSourceId:
      artifact.firstSeenSourceId ||
      artifact.first_seen_source_id ||
      artifact.sourceId ||
      artifact.source_id ||
      fallbackChunk?.sourceId,
  }));

  parsed.evidence = (parsed.evidence || []).map((item, index) => {
    const chunkId = item.chunkId || item.chunk_id || item.chunkID || fallbackChunk?.id;
    return {
      ...item,
      artifactIndex: item.artifactIndex ?? item.artifact_index ?? index,
      confidence: coerceScore(item.confidence, 1),
      quote: item.quote == null ? undefined : item.quote,
      sourceId:
        item.sourceId ||
        item.source_id ||
        item.sourceID ||
        (chunkId ? sourceByChunk.get(chunkId) : null) ||
        fallbackChunk?.sourceId,
      chunkId,
    };
  });

  const coveredArtifactIndexes = new Set(
    parsed.evidence
      .map((item) => item.artifactIndex)
      .filter((index) => Number.isInteger(index))
  );

  parsed.artifacts.forEach((artifact, index) => {
    if (coveredArtifactIndexes.has(index)) return;

    const chunkId = fallbackChunk?.id || null;
    const sourceId =
      artifact.firstSeenSourceId ||
      artifact.sourceId ||
      artifact.source_id ||
      (chunkId ? sourceByChunk.get(chunkId) : null) ||
      fallbackChunk?.sourceId;

    if (!sourceId) return;

    parsed.evidence.push({
      artifactIndex: index,
      sourceId,
      chunkId,
      evidenceType: "supports",
      confidence: artifact.confidence ?? 1
    });
  });

  return parsed;
}

module.exports = { executeProtocol, getProtocol, listProtocols };
