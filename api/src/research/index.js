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

function toOptionalIndex(value) {
  if (Number.isInteger(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number.parseInt(value, 10);
    return Number.isInteger(parsed) ? parsed : undefined;
  }
  return undefined;
}

function normalizeConnection(connection, input = {}) {
  const artifacts = input.artifacts || [];
  const artifactIdByTitle = new Map(
    artifacts
      .filter((artifact) => artifact?.id && artifact?.title)
      .map((artifact) => [String(artifact.title).toLowerCase(), artifact.id])
  );
  const fromIndex = toOptionalIndex(connection.fromArtifactIndex ?? connection.from_index ?? connection.sourceArtifactIndex ?? connection.sourceIndex);
  const toIndex = toOptionalIndex(connection.toArtifactIndex ?? connection.to_index ?? connection.targetArtifactIndex ?? connection.targetIndex);
  const fromTitle = connection.fromArtifactTitle || connection.sourceArtifactTitle || connection.sourceTitle || connection.from;
  const toTitle = connection.toArtifactTitle || connection.targetArtifactTitle || connection.targetTitle || connection.to;

  return {
    ...connection,
    connectionType:
      connection.connectionType ||
      connection.connection_type ||
      connection.type ||
      connection.relationship ||
      connection.relation ||
      connection.label ||
      "related_to",
    fromArtifactIndex: fromIndex,
    toArtifactIndex: toIndex,
    fromArtifactId:
      connection.fromArtifactId ||
      connection.from_artifact_id ||
      connection.sourceArtifactId ||
      connection.source_artifact_id ||
      connection.artifactId ||
      (fromIndex !== undefined ? artifacts[fromIndex]?.id : null) ||
      (fromTitle ? artifactIdByTitle.get(String(fromTitle).toLowerCase()) : null),
    toArtifactId:
      connection.toArtifactId ||
      connection.to_artifact_id ||
      connection.targetArtifactId ||
      connection.target_artifact_id ||
      connection.relatedArtifactId ||
      (toIndex !== undefined ? artifacts[toIndex]?.id : null) ||
      (toTitle ? artifactIdByTitle.get(String(toTitle).toLowerCase()) : null),
    confidence: coerceScore(connection.confidence, 0.7),
    strength: coerceScore(connection.strength, 0.5)
  };
}

function normalizeConnections(parsed, input = {}) {
  for (const key of ["connections", "connectionEvidence"]) {
    if (!Array.isArray(parsed[key])) continue;
    parsed[key] = parsed[key].filter((item) => item && typeof item === "object");
  }

  if (Array.isArray(parsed.connections)) {
    parsed.connections = parsed.connections.map((connection) => normalizeConnection(connection, input));
  }
}

function normalizeReflection(parsed, input = {}) {
  const allowedTypes = new Set(["knowledge_gap", "question", "risk", "assumption", "alternative_explanation", "limitation"]);

  if (Array.isArray(parsed.newArtifacts)) {
    parsed.newArtifacts = parsed.newArtifacts.map((artifact) => {
      if (!allowedTypes.has(artifact.artifactType)) {
        artifact.artifactType = artifact.type && allowedTypes.has(artifact.type) ? artifact.type : "question";
      }
      return artifact;
    });
  }

  if (Array.isArray(parsed.statusChanges)) {
    parsed.statusChanges = parsed.statusChanges
      .map((change) => ({
        ...change,
        artifactId: change.artifactId || change.artifact_id || change.targetArtifactId,
        status: change.status || change.recommendedStatus || change.recommended_status,
        reason: change.reason || change.explanation || "Suggested by reflection"
      }))
      .filter((change) => change.artifactId && change.status);
  }

  normalizeConnections(parsed, input);
  if (Array.isArray(parsed.connections)) {
    parsed.connections = parsed.connections.filter((connection) => connection.toArtifactId);
  }
}

function normalizeViewSection(section, index) {
  if (typeof section === "string") {
    return { title: `Section ${index + 1}`, body: section };
  }

  const normalized = typeof section === "object" && section !== null ? { ...section } : {};
  normalized.title = normalized.title || normalized.heading || normalized.name || `Section ${index + 1}`;
  if (!normalized.body && typeof normalized.content === "string") {
    normalized.body = normalized.content;
  }
  if (!normalized.body && Array.isArray(normalized.items)) {
    normalized.body = normalized.items.map((item) => typeof item === "string" ? item : JSON.stringify(item)).join("\n");
  }
  return normalized;
}

function normalizePresentation(parsed) {
  if (Array.isArray(parsed.structure)) {
    parsed.structure = { sections: parsed.structure.map(normalizeViewSection) };
  }

  if (Array.isArray(parsed.content)) {
    parsed.content = { sections: parsed.content.map(normalizeViewSection), metadata: {} };
  }

  if (parsed.structure && Array.isArray(parsed.structure.sections)) {
    parsed.structure.sections = parsed.structure.sections.map(normalizeViewSection);
  }

  if (parsed.content && Array.isArray(parsed.content.sections)) {
    parsed.content.sections = parsed.content.sections.map(normalizeViewSection);
  }
}

function normalizeParsedOutput(protocol, parsed, input = {}) {
  if (!parsed || typeof parsed !== "object") return parsed;
  normalizeArtifactArrays(parsed);
  if (protocol.stage === "connection" || protocol.stage === "understanding") {
    normalizeConnections(parsed, input);
  }
  if (protocol.stage === "reflection") {
    normalizeReflection(parsed, input);
  }
  if (protocol.stage === "presentation") {
    normalizePresentation(parsed);
  }
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
