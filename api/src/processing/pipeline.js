const { v4: uuidv4 } = require("uuid");
const { NODES, getDownstreamNodes } = require("./graph");
const taskRegistry = require("../tasks/registry");
const { chunkText } = require("../ai/utils/chunkText");
const { cleanText } = require("../ai/utils/cleanText");
const pool = require("../config/db").promise();
const persist = require("../refinery/persistence");

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

        const evidence = result.output?.evidence || [];
        await persist.saveEvidence(projectId, evidence);
      });

    case NODES.CONNECT:
      return runAiTask("connect", projectId, context, async (result) => {
        // First pass: create connections referencing artifacts by placeholder IDs
        const connections = result.output?.connections || [];
        const connIds = await persist.saveConnections(projectId, connections, { taskId: context.currentTaskId });
        context.lastConnectionIds = connIds;

        const connEvidence = result.output?.connectionEvidence || [];
        await persist.saveConnectionEvidence(projectId, connEvidence);

        const newArtifacts = result.output?.artifacts || [];
        await persist.saveArtifacts(projectId, newArtifacts, { taskId: context.currentTaskId });
      });

    case NODES.UNDERSTAND:
      return runAiTask("understand", projectId, context, async (result) => {
        const newArtifacts = result.output?.newArtifacts || [];
        await persist.saveArtifacts(projectId, newArtifacts, { taskId: context.currentTaskId });

        const connections = result.output?.connections || [];
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
      });

    case NODES.REFLECT:
      return runAiTask("reflect", projectId, context, async (result) => {
        const newArtifacts = result.output?.newArtifacts || [];
        await persist.saveArtifacts(projectId, newArtifacts, { taskId: context.currentTaskId });

        const connections = result.output?.connections || [];
        await persist.saveConnections(projectId, connections, { taskId: context.currentTaskId });

        const statusChanges = result.output?.statusChanges || [];
        for (const sc of statusChanges) {
          await persist.updateArtifact(sc.artifactId, { status: sc.status });
        }
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
        artifacts: context.artifacts || [],
        profileKey: context.profileKey,
        intent: context.intent
      };

    case "understand":
      return {
        projectId,
        artifacts: context.artifacts || [],
        connections: context.connections || [],
        profileKey: context.profileKey,
        intent: context.intent
      };

    case "reflect":
      return {
        projectId,
        artifacts: context.artifacts || [],
        connections: context.connections || [],
        modelVersionId: context.refineryModelVersionId,
        profileKey: context.profileKey,
        intent: context.intent
      };

    case "generate_view":
      return {
        projectId,
        modelVersionId: context.refineryModelVersionId,
        artifacts: context.artifacts || [],
        connections: context.connections || [],
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
      await persist.updateProjectStatus(projectId, "failed");
      return status;
    }
  } catch (err) {
    status.errors.push(`Failed to load sources: ${err.message}`);
    await persist.updateRun(status.runId, { status: "failed", errorMessage: err.message });
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
    } catch (err) {
      status.errors.push(`${nodeId}: ${err.message}`);
      status.failedNodes.push(nodeId);
      await persist.updateRun(status.runId, {
        stagesCompleted: status.completedNodes,
        stagesFailed: status.failedNodes,
        errorMessage: status.errors.join("; ")
      });
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

  const hasErrors = status.errors.filter((e) => !e.includes("SKIPPED")).length > 0;

  await persist.updateRun(status.runId, {
    status: hasErrors ? "failed" : "completed",
    stagesCompleted: status.completedNodes,
    stagesFailed: status.failedNodes,
    modelsUsed: status.modelsUsed,
    totalCost: status.totalCost,
    durationMs: Date.now() - new Date(status.startedAt).getTime(),
    completedAt: new Date().toISOString(),
    ...(hasErrors ? { errorMessage: status.errors.join("; ") } : {})
  });

  await persist.updateProjectStatus(projectId, hasErrors ? "failed" : "completed");

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
