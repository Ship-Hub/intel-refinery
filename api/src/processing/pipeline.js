const { v4: uuidv4 } = require("uuid");
const { NODES, getDownstreamNodes } = require("./graph");
const taskRegistry = require("../tasks/registry");
const { chunkText } = require("../ai/utils/chunkText");
const { cleanText } = require("../ai/utils/cleanText");
const pool = require("../config/db").promise();
const persist = require("../refinery/persistence");
const { appendRunEvent } = require("../refinery/runEvents");

const parseJson = (value, fallback = null) => {
  if (!value) return fallback;
  if (typeof value === "object") return value;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

const toMysqlDateTime = (date = new Date()) =>
  date.toISOString().slice(0, 19).replace("T", " ");

const CRITICAL_NODES = new Set([
  NODES.NORMALIZE,
  NODES.CHUNK,
  NODES.OBSERVE,
  NODES.BUILD_MODEL
]);

const emitRunEvent = async (context, eventType, stage, message, payload = null) => {
  if (!context.runId || !context.projectId) return;
  await appendRunEvent({
    runId: context.runId,
    projectId: context.projectId,
    eventType,
    stage,
    message,
    payload,
  }).catch(() => {});
};

const loadGraphIntoContext = async (context) => {
  const [artifacts] = await pool.query(
    "SELECT * FROM artifacts WHERE project_id = ? AND status = 'active'",
    [context.projectId]
  );
  const [connections] = await pool.query(
    "SELECT * FROM artifact_connections WHERE project_id = ? AND status = 'active'",
    [context.projectId]
  );

  context.artifacts = artifacts.map((artifact) => ({
    ...artifact,
    content: parseJson(artifact.content, artifact.content),
    metadata: parseJson(artifact.metadata, artifact.metadata),
  }));
  context.connections = connections.map((connection) => ({
    ...connection,
    metadata: parseJson(connection.metadata, connection.metadata),
  }));
};

const normalizeEvidence = (evidence, artifactIds = [], sourceChunks = []) => {
  const fallbackChunk = sourceChunks[0] || null;
  const chunkSourceById = new Map(sourceChunks.map((chunk) => [chunk.id, chunk.sourceId]));
  return (
  (evidence || [])
    .map((item) => ({
      ...item,
      sourceId: item.sourceId || item.source_id || item.sourceID || (
        item.chunkId && chunkSourceById.get(item.chunkId)
      ) || fallbackChunk?.sourceId || null,
      chunkId: item.chunkId || item.chunk_id || item.chunkID || fallbackChunk?.id || null,
      artifactId: item.artifactId || (
        item.artifactIndex !== undefined ? artifactIds[item.artifactIndex] : null
      ),
    }))
    .filter((item) => item.artifactId && item.sourceId)
  );
};

const inferredEvidenceForArtifacts = (artifacts, artifactIds = []) =>
  (artifacts || []).flatMap((artifact, index) => {
    const artifactId = artifactIds[index] || artifact.id;
    const content = artifact.content || {};
    const metadata = artifact.metadata || {};
    const sourceIds = [
      artifact.firstSeenSourceId,
      content.sourceId,
      metadata.sourceId,
      ...(Array.isArray(content.sourceIds) ? content.sourceIds : []),
      ...(Array.isArray(metadata.sourceIds) ? metadata.sourceIds : []),
    ].filter(Boolean);

    return [...new Set(sourceIds)].map((sourceId) => ({
      artifactId,
      sourceId,
      quote: content.evidence || content.quote || metadata.evidence || null,
      evidenceType: "supports",
      confidence: artifact.confidence ?? 1,
    }));
  });

const buildFallbackView = (modelData = {}) => {
  const artifactRows = Array.isArray(modelData.artifacts) ? modelData.artifacts : [];
  const connectionRows = Array.isArray(modelData.connections) ? modelData.connections : [];
  const sourceRows = Array.isArray(modelData.sources) ? modelData.sources : [];
  const topArtifacts = artifactRows.slice(0, 12).map((artifact) => ({
    title: artifact.title || "Untitled artifact",
    body: artifact.summary || artifact.artifact_type || "Extracted from source material."
  }));

  const sections = [
    {
      title: "Model Summary",
      body: modelData.summary || `Refinery Model with ${artifactRows.length} artifacts and ${connectionRows.length} connections across ${sourceRows.length} sources.`
    },
    {
      title: "Top Artifacts",
      body: topArtifacts.length
        ? topArtifacts.map((item) => `${item.title}: ${item.body}`).join("\n")
        : "No artifacts were extracted."
    },
    {
      title: "Source Coverage",
      body: `${sourceRows.length} sources and ${modelData.chunkCount || 0} chunks were included in this refinement.`
    }
  ];

  return {
    viewType: "report",
    title: "Refinery Overview",
    structure: { sections: sections.map((section) => ({ title: section.title })) },
    content: {
      sections,
      metadata: {
        generatedAt: new Date().toISOString(),
        artifactCount: artifactRows.length,
        connectionCount: connectionRows.length,
        sourceCount: sourceRows.length,
        confidence: artifactRows.length > 0 ? 0.7 : 0.3
      }
    }
  };
};

const truncateText = (value, maxLength = 700) => {
  const text = typeof value === "string" ? value : JSON.stringify(value || {});
  return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;
};

const compactArtifactForAi = (artifact) => ({
  id: artifact.id,
  title: artifact.title,
  artifactType: artifact.artifact_type || artifact.artifactType,
  summary: truncateText(artifact.summary || artifact.description || "", 500),
  content: truncateText(parseJson(artifact.content, artifact.content || {}), 650),
  confidence: artifact.confidence,
  importance: artifact.importance,
  status: artifact.status,
  firstSeenSourceId: artifact.first_seen_source_id || artifact.firstSeenSourceId,
});

const compactConnectionForAi = (connection) => ({
  id: connection.id,
  fromArtifactId: connection.from_artifact_id || connection.fromArtifactId,
  toArtifactId: connection.to_artifact_id || connection.toArtifactId,
  connectionType: connection.connection_type || connection.connectionType,
  label: connection.label,
  explanation: truncateText(connection.explanation || "", 400),
  confidence: connection.confidence,
  strength: connection.strength,
});

const compactArtifactsForAi = (artifacts = []) =>
  artifacts.slice(0, 60).map(compactArtifactForAi);

const compactConnectionsForAi = (connections = []) =>
  connections.slice(0, 120).map(compactConnectionForAi);

const normalizeConnections = (connections, artifactIds = []) =>
  (connections || [])
    .map((connection) => ({
      ...connection,
      fromArtifactId: connection.fromArtifactId || (
        connection.fromArtifactIndex !== undefined ? artifactIds[connection.fromArtifactIndex] : null
      ),
      toArtifactId: connection.toArtifactId || (
        connection.toArtifactIndex !== undefined ? artifactIds[connection.toArtifactIndex] : null
      ),
    }))
    .filter((connection) => connection.fromArtifactId && connection.toArtifactId);

const normalizeConnectionEvidence = (evidence, connectionIds = []) =>
  (evidence || [])
    .map((item) => {
      const validConnectionIds = new Set(connectionIds);
      const indexedId = item.connectionIndex !== undefined ? connectionIds[item.connectionIndex] : null;
      return {
        ...item,
        connectionId: indexedId || (validConnectionIds.has(item.connectionId) ? item.connectionId : null),
      };
    })
    .filter((item) => item.connectionId);

const normalizeText = (value) =>
  String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9@._\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const artifactBlob = (artifact) =>
  normalizeText([
    artifact.title,
    artifact.summary,
    typeof artifact.content === "string" ? artifact.content : JSON.stringify(artifact.content || {}),
    typeof artifact.metadata === "string" ? artifact.metadata : JSON.stringify(artifact.metadata || {}),
  ].filter(Boolean).join(" "));

const displayType = (artifact) =>
  normalizeText(artifact.artifact_type || artifact.artifactType || "");

const inferPersonName = (artifact) => {
  const title = String(artifact.title || "");
  const match = title.match(/\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3})\b/);
  return match ? match[1] : null;
};

const extractSocialHandle = (artifact) => {
  const blob = `${artifact.title || ""} ${artifact.summary || ""} ${JSON.stringify(artifact.content || {})}`;
  const match = blob.match(/(?:@|user\s+|account\s+)([a-z0-9._]{3,30})/i);
  return match ? match[1].toLowerCase() : null;
};

const saveInferredConnections = async (projectId, artifacts, options = {}) => {
  if (!Array.isArray(artifacts) || artifacts.length < 2) return;

  const [existingRows] = await pool.query(
    "SELECT from_artifact_id, to_artifact_id, connection_type FROM artifact_connections WHERE project_id = ? AND status = 'active'",
    [projectId]
  );
  const existing = new Set(existingRows.map((row) => `${row.from_artifact_id}:${row.to_artifact_id}:${row.connection_type}`));
  const connections = [];
  const add = (from, to, connectionType, label, explanation, confidence = 0.72, strength = 0.65) => {
    if (!from?.id || !to?.id || from.id === to.id) return;
    const key = `${from.id}:${to.id}:${connectionType}`;
    if (existing.has(key) || connections.some((item) => `${item.fromArtifactId}:${item.toArtifactId}:${item.connectionType}` === key)) return;
    connections.push({
      fromArtifactId: from.id,
      toArtifactId: to.id,
      connectionType,
      label,
      explanation,
      confidence,
      strength,
      metadata: { inferred: true, inferredAt: new Date().toISOString() }
    });
  };

  const people = artifacts.filter((artifact) => {
    const type = displayType(artifact);
    return type.includes("person") || /\bperson profile\b/i.test(artifact.title || "");
  });

  for (const person of people) {
    const personName = inferPersonName(person);
    const personNameText = normalizeText(personName || person.title);
    const personNameTokens = personNameText.split(" ").filter((token) => token.length > 2);
    if (!personNameText) continue;

    for (const artifact of artifacts) {
      if (artifact.id === person.id) continue;
      const type = displayType(artifact);
      const blob = artifactBlob(artifact);
      const sameSource = person.first_seen_source_id && artifact.first_seen_source_id && person.first_seen_source_id === artifact.first_seen_source_id;

      if (type.includes("social media account")) {
        const handle = extractSocialHandle(artifact);
        if (handle) {
          const hasDirectNameEvidence =
            personNameTokens.length > 0 &&
            personNameTokens.every((token) => blob.includes(token));
          add(
            person,
            artifact,
            hasDirectNameEvidence ? "associated_account" : "possible_association",
            hasDirectNameEvidence
              ? `${personName || "Person"} is associated with @${handle}`
              : `@${handle} may relate to ${personName || person.title}`,
            hasDirectNameEvidence
              ? `The social account artifact itself contains the person name ${personName || person.title}, so this is a source-backed account association.`
              : `The handle appears in the same source set, but the extracted account text does not prove ownership. Treat this as a lead to verify, not a fact.`,
            hasDirectNameEvidence ? 0.86 : 0.45,
            hasDirectNameEvidence ? 0.82 : 0.35
          );
        }
      }

      if (
        blob.includes(personNameText) ||
        (sameSource && /summary|skill|education|contact|language|industry|work preference|project/.test(type))
      ) {
        add(
          person,
          artifact,
          "described_by",
          `${artifact.title || "Artifact"} describes ${personName || person.title}`,
          `This artifact either names ${personName || person.title} directly or was extracted from the same source as the person profile.`,
          0.76,
          0.7
        );
      }
    }
  }

  if (connections.length > 0) {
    await persist.saveConnections(projectId, connections, options);
  }
};

const runNode = async (nodeId, context) => {
  const { projectId } = context;

  switch (nodeId) {

    case NODES.NORMALIZE:
      return normalizeSources(context);

    case NODES.CHUNK:
      return chunkSources(context);

    case NODES.OBSERVE:
      return runAiTask("observe", projectId, context, async (result) => {
        const artifacts = result.output?.artifacts || [];
        const ids = await persist.saveArtifacts(projectId, artifacts, { taskId: context.currentTaskId });
        context.lastArtifactIds = ids;
        context.artifactIdsByIndex = ids;

        const evidence = [
          ...normalizeEvidence(result.output?.evidence || [], ids, context.sourceChunks || []),
          ...inferredEvidenceForArtifacts(artifacts, ids),
        ];
        await persist.saveEvidence(projectId, evidence);
        await loadGraphIntoContext(context);
        await saveInferredConnections(projectId, context.artifacts || [], { taskId: context.currentTaskId });
        await loadGraphIntoContext(context);
      });

    case NODES.CONNECT:
      return runAiTask("connect", projectId, context, async (result) => {
        const artifactIds = (context.artifacts || []).map((artifact) => artifact.id);
        const connections = normalizeConnections(result.output?.connections || [], artifactIds);
        const connIds = await persist.saveConnections(projectId, connections, { taskId: context.currentTaskId });
        context.lastConnectionIds = connIds;

        const connEvidence = normalizeConnectionEvidence(result.output?.connectionEvidence || [], connIds);
        await persist.saveConnectionEvidence(projectId, connEvidence);

        const newArtifacts = result.output?.artifacts || [];
        const newIds = await persist.saveArtifacts(projectId, newArtifacts, { taskId: context.currentTaskId });
        await persist.saveEvidence(projectId, inferredEvidenceForArtifacts(newArtifacts, newIds));
        await loadGraphIntoContext(context);
        await saveInferredConnections(projectId, context.artifacts || [], { taskId: context.currentTaskId });
        await loadGraphIntoContext(context);
      });

    case NODES.UNDERSTAND:
      return runAiTask("understand", projectId, context, async (result) => {
        const newArtifacts = result.output?.newArtifacts || [];
        const newIds = await persist.saveArtifacts(projectId, newArtifacts, { taskId: context.currentTaskId });
        await persist.saveEvidence(projectId, inferredEvidenceForArtifacts(newArtifacts, newIds));

        const artifactIds = [...(context.artifacts || []).map((artifact) => artifact.id), ...newIds];
        const connections = normalizeConnections(result.output?.connections || [], artifactIds);
        await persist.saveConnections(projectId, connections, { taskId: context.currentTaskId });

        const merges = result.output?.mergeSuggestions || [];
        for (const m of merges) {
          if (m.discardArtifactId) {
            await persist.updateArtifact(m.discardArtifactId, { status: "merged", metadata: { mergedInto: m.keepArtifactId } });
          }
        }

        const updates = result.output?.refinements || [];
        for (const u of updates) {
          await persist.updateArtifact(u.artifactId, u.updates);
        }
        await loadGraphIntoContext(context);
      });

    case NODES.REFLECT:
      return runAiTask("reflect", projectId, context, async (result) => {
        const newArtifacts = result.output?.newArtifacts || [];
        const newIds = await persist.saveArtifacts(projectId, newArtifacts, { taskId: context.currentTaskId });
        await persist.saveEvidence(projectId, inferredEvidenceForArtifacts(newArtifacts, newIds));

        const artifactIds = [...(context.artifacts || []).map((artifact) => artifact.id), ...newIds];
        const connections = normalizeConnections(result.output?.connections || [], artifactIds);
        await persist.saveConnections(projectId, connections, { taskId: context.currentTaskId });

        const statusChanges = result.output?.statusChanges || [];
        for (const sc of statusChanges) {
          await persist.updateArtifact(sc.artifactId, { status: sc.status });
        }
        await loadGraphIntoContext(context);
      });

    case NODES.BUILD_MODEL:
      return buildModelVersion(context);

    case NODES.GENERATE_VIEWS:
      return runAiTask("generate_view", projectId, context, async (result) => {
        const modelVersionId = context.refineryModelVersionId;
        const viewData = result.output;
        if (viewData) {
          const viewId = await persist.saveView(projectId, modelVersionId, viewData, { taskId: context.currentTaskId });
          context.viewId = viewId;
        }
      });

    default:
      return { success: true, output: null };
  }
};

const runAiTask = async (taskType, projectId, context, onSuccess) => {
  const handler = taskRegistry.get(taskType);
  if (!handler) {
    return { success: false, error: `Unknown task: ${taskType}`, output: null };
  }

  const hasAiProvider = process.env.OPENROUTER_API_KEY || process.env.GEMINI_API_KEY || process.env.GROQ_API_KEY;
  if (!hasAiProvider) {
    return { success: false, error: `${taskType}: SKIPPED (no AI provider configured)`, output: null };
  }

  const taskInput = buildTaskInput(taskType, context);
  const startTime = Date.now();
  const result = await handler(taskInput);
  const durationMs = Date.now() - startTime;

  if (result.success && onSuccess) {
    try {
      await onSuccess(result);
    } catch (err) {
      console.error(`Persist error for ${taskType}:`, err.message);
      return { success: false, error: err.message, output: result.output };
    }
  }

  return { ...result, taskType, durationMs };
};

const buildTaskInput = (taskType, context) => {
  const { projectId, sources, sourceChunks } = context;

  switch (taskType) {
    case "observe":
      return {
        projectId,
        sourceChunks: sourceChunks || [],
        profileKey: context.profileKey,
        intent: context.intent
      };

    case "connect":
      return {
        projectId,
        artifacts: compactArtifactsForAi(context.artifacts || []),
        profileKey: context.profileKey,
        intent: context.intent
      };

    case "understand":
      return {
        projectId,
        artifacts: compactArtifactsForAi(context.artifacts || []),
        connections: compactConnectionsForAi(context.connections || []),
        profileKey: context.profileKey,
        intent: context.intent
      };

    case "reflect":
      return {
        projectId,
        artifacts: compactArtifactsForAi(context.artifacts || []),
        connections: compactConnectionsForAi(context.connections || []),
        modelVersionId: context.refineryModelVersionId,
        profileKey: context.profileKey,
        intent: context.intent
      };

    case "generate_view":
      return {
        projectId,
        modelVersionId: context.refineryModelVersionId,
        artifacts: compactArtifactsForAi(context.artifacts || []),
        connections: compactConnectionsForAi(context.connections || []),
        modelVersion: context.refineryModel,
        profileKey: context.profileKey,
        intent: context.intent
      };

    default:
      return { projectId };
  }
};

// ── Infrastructure stages ────────────────────────────────────────────────────

const normalizeSources = (context) => {
  const { sources } = context;
  const normalized = (sources || []).map((s) => ({
    sourceId: s.id,
    text: cleanText(s.text || ""),
    metadata: { ...(s.metadata || {}), normalizedAt: new Date().toISOString() }
  }));

  context.normalized = normalized;
  return { success: true, output: { normalized }, durationMs: 0 };
};

const chunkSources = async (context) => {
  const input = context.normalized || context.sources || [];
  const chunks = [];

  for (const source of input) {
    const text = source.text || "";
    if (!text.trim()) continue;

    const sourceChunks = chunkText(text, 2000);
    for (let i = 0; i < sourceChunks.length; i++) {
      chunks.push({
        id: uuidv4(),
        sourceId: source.sourceId || source.id,
        index: i,
        content: sourceChunks[i],
        tokenCount: Math.ceil(sourceChunks[i].length / 4)
      });
    }
  }

  context.sourceChunks = chunks;

  await persist.saveChunks(context.projectId, chunks);

  return { success: true, output: { chunks }, durationMs: 0 };
};

// ── Model builder ────────────────────────────────────────────────────────────

const buildModelVersion = async (context) => {
  const { projectId, runId } = context;

  const [artifactRows] = await pool.query(
    "SELECT * FROM artifacts WHERE project_id = ? AND status = 'active' ORDER BY importance DESC, confidence DESC",
    [projectId]
  );

  const [connectionRows] = await pool.query(
    "SELECT * FROM artifact_connections WHERE project_id = ? AND status = 'active' ORDER BY confidence DESC",
    [projectId]
  );

  const [sourceRows] = await pool.query(
    "SELECT id, source_type, original_name, title, uri, status FROM sources WHERE project_id = ?",
    [projectId]
  );

  const [chunkRows] = await pool.query(
    "SELECT id, source_id, chunk_index, token_count FROM source_chunks WHERE project_id = ?",
    [projectId]
  );

  const modelData = {
    projectId,
    artifactCount: artifactRows.length,
    connectionCount: connectionRows.length,
    sourceCount: sourceRows.length,
    chunkCount: chunkRows.length,
    summary: `Refinery Model with ${artifactRows.length} artifacts and ${connectionRows.length} connections across ${sourceRows.length} sources.`,
    sources: sourceRows,
    chunks: chunkRows,
    artifacts: artifactRows,
    connections: connectionRows,
    builtAt: new Date().toISOString()
  };

  const { id, version } = await persist.buildModelVersion(projectId, runId, modelData);

  context.refineryModel = modelData;
  context.refineryModelVersionId = id;
  context.refineryModelVersionNumber = version;

  return { success: true, output: { refineryModelVersionId: id, version } };
};

// ── Full pipeline execution ─────────────────────────────────────────────────

const processProject = async (projectId, options = {}) => {
  const status = {
    projectId,
    runId: null,
    startedAt: new Date().toISOString(),
    completedNodes: [],
    failedNodes: [],
    currentNode: null,
    context: { projectId },
    errors: [],
    modelsUsed: [],
    totalCost: 0
  };

  await persist.updateProjectStatus(projectId, "processing");

  // Create or reuse run
  status.runId = options.runId || await persist.createRun(projectId, options.trigger || "manual");
  status.context.runId = status.runId;
  status.context.trigger = options.trigger || "manual";
  status.context.profileKey = options.profileKey || null;
  status.context.intent = options.intent || null;

  await emitRunEvent(status.context, "run_processing", null, "Refinement pipeline started.");

  // Load sources
  try {
    const [sourceRows] = await pool.query(
      `SELECT id, source_type, source_category, inclusion_state, extracted_text, raw_text, metadata
       FROM sources
       WHERE project_id = ?
         AND status IN ('normalized', 'pending', 'chunked')
         AND COALESCE(inclusion_state, 'included') = 'included'`,
      [projectId]
    );

    status.context.sources = sourceRows.map((r) => ({
      id: r.id,
      text: r.extracted_text || r.raw_text || "",
      metadata: {
        ...(typeof r.metadata === "string" ? JSON.parse(r.metadata) : (r.metadata || {})),
        sourceType: r.source_type,
        sourceCategory: r.source_category,
      }
    }));

    if (status.context.sources.length === 0) {
      status.errors.push("No sources with extracted text found");
      await persist.updateRun(status.runId, { status: "failed", errorMessage: "No sources with extracted text found" });
      await emitRunEvent(status.context, "run_failed", null, "No sources with extracted text found");
      await persist.updateProjectStatus(projectId, "failed");
      return status;
    }
  } catch (err) {
    status.errors.push(`Failed to load sources: ${err.message}`);
    await persist.updateRun(status.runId, { status: "failed", errorMessage: err.message });
    await emitRunEvent(status.context, "run_failed", null, err.message);
    await persist.updateProjectStatus(projectId, "failed");
    return status;
  }

  const stages = [
    NODES.NORMALIZE,
    NODES.CHUNK,
    NODES.OBSERVE,
    NODES.CONNECT,
    NODES.UNDERSTAND,
    NODES.REFLECT,
    NODES.BUILD_MODEL,
    NODES.GENERATE_VIEWS
  ];

  for (const nodeId of stages) {
    status.currentNode = nodeId;
    await emitRunEvent(status.context, "stage_started", nodeId, `${nodeId} started`);

    try {
      const result = await runNode(nodeId, status.context);

      if (!result.success) {
        status.errors.push(`${nodeId}: ${result.error}`);
        status.failedNodes.push(nodeId);
        await persist.updateRun(status.runId, {
          stagesCompleted: status.completedNodes,
          stagesFailed: status.failedNodes,
          errorMessage: status.errors.join("; ")
        });
        await emitRunEvent(status.context, "stage_failed", nodeId, result.error || `${nodeId} failed`);
        if (CRITICAL_NODES.has(nodeId)) {
          break;
        }
        continue;
      }

      if (result.model) {
        status.modelsUsed.push({ stage: nodeId, model: result.model, provider: result.provider });
      }
      if (result.durationMs) {
        status.totalCost += result.durationMs;
      }

      status.completedNodes.push(nodeId);

      if (result.output) {
        Object.assign(status.context, result.output);
      }

      await persist.updateRun(status.runId, {
        stagesCompleted: status.completedNodes,
        stagesFailed: status.failedNodes,
        modelsUsed: status.modelsUsed,
        totalCost: status.totalCost
      });
      await emitRunEvent(status.context, "stage_completed", nodeId, `${nodeId} completed`, result.output || null);
    } catch (err) {
      status.errors.push(`${nodeId}: ${err.message}`);
      status.failedNodes.push(nodeId);
      await persist.updateRun(status.runId, {
        stagesCompleted: status.completedNodes,
        stagesFailed: status.failedNodes,
        errorMessage: status.errors.join("; ")
      });
      await emitRunEvent(status.context, "stage_failed", nodeId, err.message);
      if (CRITICAL_NODES.has(nodeId)) {
        break;
      }
    }
  }

  if (status.context.refineryModelVersionId && !status.context.viewId) {
    try {
      const fallbackView = buildFallbackView(status.context.refineryModel);
      const viewId = await persist.saveView(
        projectId,
        status.context.refineryModelVersionId,
        fallbackView
      );
      status.context.viewId = viewId;
      if (!status.completedNodes.includes(NODES.GENERATE_VIEWS)) {
        status.completedNodes.push(NODES.GENERATE_VIEWS);
      }
      await emitRunEvent(status.context, "stage_completed", NODES.GENERATE_VIEWS, "Fallback view generated", fallbackView);
    } catch (err) {
      status.errors.push(`${NODES.GENERATE_VIEWS}: ${err.message}`);
      if (!status.failedNodes.includes(NODES.GENERATE_VIEWS)) {
        status.failedNodes.push(NODES.GENERATE_VIEWS);
      }
    }
  }

  // Reload artifacts and connections into context for downstream use
  try {
    const [artifacts] = await pool.query(
      "SELECT * FROM artifacts WHERE project_id = ? AND status = 'active'",
      [projectId]
    );
    status.context.artifacts = artifacts;

    const [connections] = await pool.query(
      "SELECT * FROM artifact_connections WHERE project_id = ? AND status = 'active'",
      [projectId]
    );
    status.context.connections = connections;
  } catch (err) {
    // Non-critical
  }

  const hasCriticalErrors =
    status.failedNodes.some((nodeId) => CRITICAL_NODES.has(nodeId)) ||
    !status.context.refineryModelVersionId;
  const nonCriticalErrors = status.errors.filter((e) => !e.includes("SKIPPED"));

  await persist.updateRun(status.runId, {
    status: hasCriticalErrors ? "failed" : "completed",
    stagesCompleted: status.completedNodes,
    stagesFailed: status.failedNodes,
    modelsUsed: status.modelsUsed,
    totalCost: status.totalCost,
    durationMs: Date.now() - new Date(status.startedAt).getTime(),
    completedAt: toMysqlDateTime(),
    ...(hasCriticalErrors ? { errorMessage: status.errors.join("; ") } : {})
  });

  await persist.updateProjectStatus(projectId, hasCriticalErrors ? "failed" : "completed");
  await emitRunEvent(
    status.context,
    hasCriticalErrors ? "run_failed" : "run_completed",
    null,
    hasCriticalErrors
      ? status.errors.join("; ")
      : nonCriticalErrors.length
        ? `Refinement pipeline completed with non-critical warnings: ${nonCriticalErrors.join("; ")}`
        : "Refinement pipeline completed.",
    { modelVersionId: status.context.refineryModelVersionId || null }
  );

  status.finishedAt = new Date().toISOString();
  return status;
};

const reprocessFromNode = async (projectId, fromNodeId) => {
  const downstream = getDownstreamNodes(fromNodeId);
  downstream.unshift(fromNodeId);
  return processProject(projectId, { targetNodes: downstream, trigger: "reprocess" });
};

module.exports = {
  processProject,
  reprocessFromNode,
  runNode,
  NODES
};
