const { v4: uuidv4 } = require("uuid");
const { NODES, getDownstreamNodes } = require("./graph");
const taskRegistry = require("../tasks/registry");
const { chunkText } = require("../ai/utils/chunkText");
const { cleanText } = require("../ai/utils/cleanText");
const pool = require("../config/db").promise();
const persist = require("../refinery/persistence");
const { appendRunEvent } = require("../refinery/runEvents");
const { REFINERY_PROFILE_KEYS } = require("../refinery/profiles/profileConstants");

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
    body: artifact.summary || artifact.artifact_type || "Found in the source material."
  }));
  const summary = modelData.plainEnglishSummary || modelData.summary || buildPlainModelSummary(artifactRows, connectionRows, sourceRows);

  const sections = [
    {
      title: "Short answer",
      body: summary
    },
    {
      title: "What we found",
      body: topArtifacts.length
        ? topArtifacts.map((item) => `${item.title}: ${item.body}`).join("\n")
        : "No artifacts were extracted."
    },
    {
      title: "Source notes",
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

const clampText = (value, maxLength = 96) => {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  if (!text) return "";
  return text.length > maxLength ? `${text.slice(0, maxLength - 3)}...` : text;
};

const humanizeStageError = (message = "") => {
  const text = String(message || "");
  if (/Table .*doesn't exist/i.test(text)) {
    return "The refinery kept the extracted source material safe while this workspace catches up.";
  }
  if (/no sources with extracted text/i.test(text)) {
    return "The refinery needs readable source text before it can build a model.";
  }
  return "The refinery preserved the source work and paused this pass for a quieter retry.";
};

const sourceLabel = (source = {}) => {
  const metadata = parseJson(source.metadata, source.metadata || {});
  const raw =
    source.originalName ||
    source.original_name ||
    source.title ||
    metadata.originalName ||
    metadata.fileName ||
    metadata.title ||
    source.uri ||
    metadata.uri ||
    metadata.url ||
    source.sourceId ||
    source.id;
  try {
    if (/^https?:\/\//i.test(raw)) {
      const url = new URL(raw);
      return clampText(`${url.hostname}${url.pathname === "/" ? "" : url.pathname}`, 72);
    }
  } catch { /* ignore invalid URL */ }
  return clampText(raw, 72);
};

const sourcePreview = (source = {}, maxLength = 140) =>
  clampText(source.text || source.extracted_text || source.raw_text || "", maxLength);

const sourceTextLength = (source = {}) =>
  String(source.text || source.extracted_text || source.raw_text || "").length;

const sourceExtractionMethod = (source = {}) =>
  clampText(
    source.metadata?.extractionMethod ||
      source.metadata?.parser ||
      source.metadata?.sourceType ||
      source.sourceType ||
      source.source_type ||
      "stored text",
    48
  );

const sourceKind = (source = {}) => {
  const type = String(source.sourceType || source.source_type || source.metadata?.sourceType || "").toLowerCase();
  const category = String(source.sourceCategory || source.source_category || source.metadata?.sourceCategory || "").toLowerCase();
  const method = String(source.metadata?.extractionMethod || "").toLowerCase();
  if (type === "url" || category === "web" || /playwright|cheerio/.test(method)) return "website";
  if (type === "image" || category === "image" || /ocr/.test(method)) return "source image";
  if (type === "pdf" || category === "document") return "document";
  if (type === "audio" || category === "audio") return "audio source";
  return "source";
};

const sourceLoadItem = (source = {}) => ({
  label: sourceLabel(source),
  detail: `${sourceKind(source)} text captured, ${sourceTextLength(source).toLocaleString()} chars`,
  kind: "source",
  preview: sourcePreview(source),
});

const sourcePhrase = (source = {}) => {
  const label = sourceLabel(source);
  const kind = sourceKind(source);
  if (!label) return `one ${kind}`;
  return `${kind} ${label}`;
};

const leadSourcePhrase = (sources = []) =>
  sources.length ? sourcePhrase(sources[0]) : "the source set";

const stageStartedMessage = (context = {}, stage) => {
  const sources = context.sources || [];
  const lead = leadSourcePhrase(sources);
  const isCyber = context.profileKey === REFINERY_PROFILE_KEYS.CYBER;
  if (isCyber) {
    const cyberMessages = {
      [NODES.NORMALIZE]: `Cleaning extracted security evidence from ${lead} so findings stay comparable.`,
      [NODES.CHUNK]: "Splitting cyber source material into traceable evidence packets.",
      [NODES.OBSERVE]: `AI is reading ${lead} for findings, assets, vulnerabilities, controls, and visual signals.`,
      [NODES.CONNECT]: "AI is linking findings to affected assets, relevant controls, threats, and recommended actions.",
      [NODES.UNDERSTAND]: "AI is fine-tuning the cyber model around the strongest source-backed risk signals.",
      [NODES.REFLECT]: "Checking severity, duplicates, unsupported claims, missing assets, and evidence gaps.",
      [NODES.BUILD_MODEL]: "Packing findings, assets, controls, actions, and source lineage into a saved cyber model.",
      [NODES.GENERATE_VIEWS]: "Preparing Cyber Refinery views for review and triage.",
    };
    return cyberMessages[stage] || "Cyber refinement is moving to the next step.";
  }
  const messages = {
    [NODES.NORMALIZE]: `Cleaning the extracted text from ${lead} so the evidence is easier to compare.`,
    [NODES.CHUNK]: `Splitting the source material into traceable evidence packets.`,
    [NODES.OBSERVE]: `AI is making sense of the extracted text from ${lead}.`,
    [NODES.CONNECT]: `AI is checking whether the strongest findings point to each other.`,
    [NODES.UNDERSTAND]: `AI is fine-tuning the model around the clearest source-backed signals.`,
    [NODES.REFLECT]: `Reviewing the model for thin evidence, duplicates, and unanswered questions.`,
    [NODES.BUILD_MODEL]: `Packing the refined evidence into a saved model version.`,
    [NODES.GENERATE_VIEWS]: `Preparing the workspace views so the findings are easy to inspect.`,
  };
  return messages[stage] || "Refinement is moving to the next step.";
};

const artifactType = (artifact = {}) =>
  String(artifact.artifact_type || artifact.artifactType || artifact.type || "artifact")
    .replace(/_/g, " ")
    .trim();

const artifactLabel = (artifact = {}) =>
  clampText(artifact.title || artifact.name || artifact.summary || artifactType(artifact), 86);

const artifactDetail = (artifact = {}) =>
  clampText(artifact.summary || artifact.description || artifactType(artifact), 140);

const byScore = (a, b) =>
  Number(b.importance || 0) + Number(b.confidence || 0) - (Number(a.importance || 0) + Number(a.confidence || 0));

const topArtifacts = (artifacts = [], matcher = null, limit = 3) =>
  artifacts
    .filter((artifact) => !matcher || matcher(artifact))
    .sort(byScore)
    .slice(0, limit)
    .map((artifact) => ({
      label: artifactLabel(artifact),
      detail: artifactDetail(artifact),
      kind: artifactType(artifact),
    }));

const connectionLabel = (connection = {}, artifactsById = new Map()) => {
  const from = artifactsById.get(connection.from_artifact_id || connection.fromArtifactId);
  const to = artifactsById.get(connection.to_artifact_id || connection.toArtifactId);
  return clampText(connection.label || `${artifactLabel(from)} -> ${artifactLabel(to)}`, 96);
};

const connectionDetail = (connection = {}) =>
  clampText(connection.explanation || connection.connection_type || connection.connectionType || "Evidence-backed relationship", 150);

const cyberBucketForArtifact = (artifact = {}) => {
  const blob = `${artifactType(artifact)} ${artifact.title || ""} ${artifact.summary || ""} ${JSON.stringify(artifact.content || {})}`.toLowerCase();
  if (/asset|host|server|endpoint|domain|ip address|account|identity|service|application|device/.test(blob)) return "assets";
  if (/control|policy|guardrail|mfa|edr|siem|logging|backup|encryption|mitigation/.test(blob)) return "controls";
  if (/action|remediation|recommendation|next step|patch|rotate|isolate|review|investigate|owner/.test(blob)) return "actions";
  if (/threat|actor|malware|phishing|exploit|attack|campaign|ioc|indicator|c2|command and control/.test(blob)) return "threats";
  if (/incident|outage|breach|alert|event|timeline|detection|compromise|investigation/.test(blob)) return "threats";
  if (/finding|vulnerability|cve|exposure|risk|severity|misconfig|weakness|conflict|gap/.test(blob)) return "findings";
  return "findings";
};

const cyberGraphFromArtifacts = (sourceItems = [], artifacts = [], connections = [], artifactsById = new Map()) => {
  const graph = {
    sources: sourceItems,
    findings: [],
    assets: [],
    threats: [],
    controls: [],
    actions: [],
  };

  for (const artifact of [...artifacts].sort(byScore)) {
    const bucket = cyberBucketForArtifact(artifact);
    if (!graph[bucket] || graph[bucket].length >= 3) continue;
    graph[bucket].push({
      label: artifactLabel(artifact),
      detail: artifactDetail(artifact),
      kind: artifactType(artifact),
    });
  }

  const connectionItems = connections
    .sort((a, b) => Number(b.confidence || 0) - Number(a.confidence || 0))
    .slice(0, 3)
    .map((connection) => ({
      label: connectionLabel(connection, artifactsById),
      detail: connectionDetail(connection),
      kind: connection.connection_type || connection.connectionType || "connection",
    }));

  if (connectionItems.length) {
    graph.findings = [...connectionItems, ...graph.findings].slice(0, 3);
  }

  return graph;
};

const stageSnapshot = (context = {}, stage, result = {}) => {
  const sources = context.sources || [];
  const artifacts = context.artifacts || [];
  const connections = context.connections || [];
  const artifactsById = new Map(artifacts.map((artifact) => [artifact.id, artifact]));
  const sourceItems = sources.slice(0, 3).map(sourceLoadItem);
  const entityItems = topArtifacts(artifacts, (artifact) => {
    const type = artifactType(artifact).toLowerCase();
    return /person|account|organization|project|entity|asset/.test(type);
  });
  const observationItems = topArtifacts(artifacts, (artifact) => {
    const type = artifactType(artifact).toLowerCase();
    return !/question|gap|risk/.test(type);
  });
  const questionItems = topArtifacts(artifacts, (artifact) => {
    const type = artifactType(artifact).toLowerCase();
    return /question|gap|risk|conflict|contradiction/.test(type);
  });
  const connectionItems = connections
    .sort((a, b) => Number(b.confidence || 0) - Number(a.confidence || 0))
    .slice(0, 3)
    .map((connection) => ({
      label: connectionLabel(connection, artifactsById),
      detail: connectionDetail(connection),
      kind: connection.connection_type || connection.connectionType || "connection",
    }));

  const isCyber = context.profileKey === REFINERY_PROFILE_KEYS.CYBER;
  const graph = isCyber ? cyberGraphFromArtifacts(sourceItems, artifacts, connections, artifactsById) : {
    sources: sourceItems,
    observations: observationItems,
    entities: entityItems,
    connections: connectionItems,
    questions: questionItems,
  };

  const counts = {
    sources: sources.length,
    chunks: (context.sourceChunks || result.output?.chunks || []).length,
    artifacts: artifacts.length,
    connections: connections.length,
  };

  const firstEntity = entityItems[0] || graph.assets?.[0] || graph.threats?.[0];
  const firstObservation = observationItems[0] || graph.findings?.[0];
  const firstConnection = connectionItems[0];
  const messages = {
    [NODES.NORMALIZE]: sourceItems.length
      ? `Prepared ${sources.length} source${sources.length === 1 ? "" : "s"} for refinement: ${sourceItems.map((item) => item.label).join(", ")}.`
      : `Prepared ${sources.length} source${sources.length === 1 ? "" : "s"} for refinement.`,
    [NODES.CHUNK]: `Split the material into ${counts.chunks} traceable evidence packet${counts.chunks === 1 ? "" : "s"} so every claim can point back to a source.`,
    [NODES.OBSERVE]: isCyber && firstObservation
      ? `AI pulled out a security finding: ${firstObservation.label}. ${firstObservation.detail}`
      : firstEntity
      ? `AI pulled out a useful ${firstEntity.kind}: ${firstEntity.label}. ${firstEntity.detail}`
      : firstObservation
        ? `AI found an early source-backed signal: ${firstObservation.label}. ${firstObservation.detail}`
        : `AI finished a careful first read of ${leadSourcePhrase(sources)}.`,
    [NODES.CONNECT]: firstConnection
      ? `AI connected two pieces of evidence: ${firstConnection.label}. ${firstConnection.detail}`
      : isCyber
        ? "AI checked which findings affect assets, which controls reduce risk, and which actions need owners."
        : "AI checked for relationships and kept only the links that had enough support.",
    [NODES.UNDERSTAND]: firstObservation
      ? `AI fine-tuned the working model around ${firstObservation.label}.`
      : "AI organized the extracted evidence into a clearer working model.",
    [NODES.REFLECT]: questionItems[0]
      ? `AI marked a question for verification: ${questionItems[0].label}.`
      : isCyber
        ? "AI checked for duplicate findings, unsupported severity, missing assets, and unresolved evidence gaps."
        : "AI checked the model for weak links, duplicates, and missing evidence.",
    [NODES.BUILD_MODEL]: `Saved a model with ${counts.artifacts} artifact${counts.artifacts === 1 ? "" : "s"} and ${counts.connections} connection${counts.connections === 1 ? "" : "s"}.`,
    [NODES.GENERATE_VIEWS]: "Prepared the explorable project view from the refined model.",
  };

  return {
    message: messages[stage] || `${stage} completed`,
    payload: {
      counts,
      graph,
      items: isCyber
        ? graph.findings.length ? graph.findings : graph.assets.length ? graph.assets : graph.threats.length ? graph.threats : graph.controls.length ? graph.controls : graph.actions.length ? graph.actions : graph.sources
        : graph.connections.length ? graph.connections : graph.entities.length ? graph.entities : graph.observations.length ? graph.observations : graph.sources,
      focus: {
        title: stage === NODES.BUILD_MODEL || stage === NODES.GENERATE_VIEWS ? "Model taking shape" : "Working evidence",
        status: messages[stage] || `${stage} completed`,
        evidence: `${counts.artifacts} artifacts, ${counts.connections} links`,
      },
    },
  };
};

const buildPlainModelSummary = (artifactRows = [], connectionRows = [], sourceRows = []) => {
  const artifacts = artifactRows.map((artifact) => ({
    ...artifact,
    content: parseJson(artifact.content, artifact.content || {}),
    metadata: parseJson(artifact.metadata, artifact.metadata || {}),
  }));
  const person = artifacts.find((artifact) => {
    const type = artifactType(artifact).toLowerCase();
    return type.includes("person") && !/instagram user|@\w/i.test(artifact.title || "");
  });
  const projects = artifacts
    .filter((artifact) => artifactType(artifact).toLowerCase().includes("project"))
    .slice(0, 4)
    .map((artifact) => artifact.title)
    .filter(Boolean);
  const accounts = artifacts
    .filter((artifact) => /instagram|social media account|@\w/i.test(`${artifact.artifact_type || ""} ${artifact.title || ""} ${artifact.summary || ""}`))
    .slice(0, 4)
    .map((artifact) => {
      const handle = extractSocialHandle(artifact);
      return handle ? `@${handle}` : artifact.title;
    })
    .filter(Boolean);
  const gaps = artifacts
    .filter((artifact) => /question|gap|risk|alternative|limitation/i.test(artifact.artifact_type || ""))
    .slice(0, 2)
    .map((artifact) => artifact.title)
    .filter(Boolean);

  const lines = [];
  if (person) {
    lines.push(`${person.title} is the main person identified in this source set.`);
  } else {
    lines.push(`This model organizes ${sourceRows.length} source${sourceRows.length === 1 ? "" : "s"} into ${artifactRows.length} key item${artifactRows.length === 1 ? "" : "s"}.`);
  }
  if (projects.length) {
    lines.push(`The sources connect ${person?.title || "the subject"} with ${projects.join(", ")}.`);
  }
  if (accounts.length) {
    lines.push(`The social accounts mentioned include ${accounts.join(", ")}. Treat account ownership as verified only when the source text includes direct name evidence.`);
  }
  if (connectionRows.length) {
    lines.push(`${connectionRows.length} relationship${connectionRows.length === 1 ? "" : "s"} were saved between extracted items.`);
  }
  if (gaps.length) {
    lines.push(`Needs checking: ${gaps.join("; ")}.`);
  }
  return lines.join(" ");
};

const truncateText = (value, maxLength = 700) => {
  const text = typeof value === "string" ? value : JSON.stringify(value || {});
  return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;
};

const compactArtifactForAi = (artifact) => ({
  id: artifact.id,
  title: artifact.title,
  artifactType: artifact.artifact_type || artifact.artifactType,
  summary: truncateText(artifact.summary || artifact.description || "", 260),
  content: truncateText(parseJson(artifact.content, artifact.content || {}), 360),
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
  artifacts.slice(0, 36).map(compactArtifactForAi);

const compactConnectionsForAi = (connections = []) =>
  connections.slice(0, 72).map(compactConnectionForAi);

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
    .filter((connection) => {
      const validIds = new Set(artifactIds);
      return (
        connection.fromArtifactId &&
        connection.toArtifactId &&
        connection.fromArtifactId !== connection.toArtifactId &&
        validIds.has(connection.fromArtifactId) &&
        validIds.has(connection.toArtifactId)
      );
    });

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
  if (/instagram user|@\w/i.test(title)) return null;
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

  const isSocialAccountArtifact = (artifact) => {
    const type = displayType(artifact);
    const title = String(artifact.title || "");
    const blob = artifactBlob(artifact);
    return type.includes("social media account") || /instagram user|@\w{3,30}/i.test(title) || /instagram\.com|profile username|profile handle/.test(blob);
  };

  const people = artifacts.filter((artifact) => {
    const type = displayType(artifact);
    return !isSocialAccountArtifact(artifact) && (type.includes("person") || /\bperson profile\b/i.test(artifact.title || ""));
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

      if (isSocialAccountArtifact(artifact)) {
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
        (sameSource && /summary|skill|education|contact|language|industry|work preference|project|experience/.test(type) && !isSocialAccountArtifact(artifact))
      ) {
        add(
          artifact,
          person,
          "supports_profile",
          `${artifact.title || "Artifact"} supports the profile of ${personName || person.title}`,
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
        const newArtifacts = result.output?.artifacts || [];
        const newIds = await persist.saveArtifacts(projectId, newArtifacts, { taskId: context.currentTaskId });
        await persist.saveEvidence(projectId, inferredEvidenceForArtifacts(newArtifacts, newIds));
        const artifactIds = [...(context.artifacts || []).map((artifact) => artifact.id), ...newIds];
        const connections = normalizeConnections(result.output?.connections || [], artifactIds);
        const connIds = await persist.saveConnections(projectId, connections, { taskId: context.currentTaskId });
        context.lastConnectionIds = connIds;

        const connEvidence = normalizeConnectionEvidence(result.output?.connectionEvidence || [], connIds);
        await persist.saveConnectionEvidence(projectId, connEvidence);
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

  const plainSummary = buildPlainModelSummary(artifactRows, connectionRows, sourceRows);
  const modelData = {
    projectId,
    artifactCount: artifactRows.length,
    connectionCount: connectionRows.length,
    sourceCount: sourceRows.length,
    chunkCount: chunkRows.length,
    summary: plainSummary,
    plainEnglishSummary: plainSummary,
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

  if (!status.context.profileKey || !status.context.intent) {
    const [projectProfiles] = await pool.query(
      `SELECT p.intent, rp.profile_key AS profileKey
       FROM projects p
       LEFT JOIN refinery_profiles rp ON rp.id = p.refinery_profile_id
       WHERE p.id = ?
       LIMIT 1`,
      [projectId]
    ).catch(() => [[]]);
    status.context.profileKey = status.context.profileKey || projectProfiles[0]?.profileKey || null;
    status.context.intent = status.context.intent || projectProfiles[0]?.intent || null;
  }

  await emitRunEvent(status.context, "run_processing", null, "Refinement started. The refinery is getting the saved sources ready.");

  // Load sources
  try {
    const [sourceRows] = await pool.query(
      `SELECT id, source_type, source_category, inclusion_state, original_name, title, uri, extracted_text, raw_text, metadata
       FROM sources
       WHERE project_id = ?
         AND status IN ('normalized', 'pending', 'chunked')
         AND COALESCE(inclusion_state, 'included') = 'included'`,
      [projectId]
    );

    status.context.sources = sourceRows.map((r) => ({
      id: r.id,
      originalName: r.original_name,
      title: r.title,
      uri: r.uri,
      sourceType: r.source_type,
      sourceCategory: r.source_category,
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

    const sourceItems = status.context.sources.map(sourceLoadItem);
    const totalChars = status.context.sources.reduce((sum, source) => sum + sourceTextLength(source), 0);
    await emitRunEvent(
      status.context,
      "sources_loaded",
      NODES.INGEST,
      `Loaded ${status.context.sources.length} included source${status.context.sources.length === 1 ? "" : "s"} with ${totalChars.toLocaleString()} extracted character${totalChars === 1 ? "" : "s"}.`,
      {
        counts: {
          sources: status.context.sources.length,
          extractedCharacters: totalChars,
        },
        graph: {
          sources: sourceItems.slice(0, 6),
          observations: [],
          entities: [],
          connections: [],
          questions: [],
        },
        items: sourceItems.slice(0, 6),
        focus: {
          title: "Source extraction",
          status: sourceItems.length
            ? `Captured readable text from ${sourcePhrase(status.context.sources[0])}.`
            : "Sources were loaded for refinement.",
          evidence: `${status.context.sources.length} sources, ${totalChars.toLocaleString()} chars`,
        },
      }
    );
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
    await emitRunEvent(status.context, "stage_started", nodeId, stageStartedMessage(status.context, nodeId));

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
        await emitRunEvent(status.context, "stage_failed", nodeId, humanizeStageError(result.error || `${nodeId} failed`));
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
      const event = stageSnapshot(status.context, nodeId, result);
      await emitRunEvent(status.context, "stage_completed", nodeId, event.message, event.payload);
    } catch (err) {
      status.errors.push(`${nodeId}: ${err.message}`);
      status.failedNodes.push(nodeId);
      await persist.updateRun(status.runId, {
        stagesCompleted: status.completedNodes,
        stagesFailed: status.failedNodes,
        errorMessage: status.errors.join("; ")
      });
      await emitRunEvent(status.context, "stage_failed", nodeId, humanizeStageError(err.message));
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
      await emitRunEvent(
        status.context,
        "stage_completed",
        NODES.GENERATE_VIEWS,
        "Prepared the explorable project view from the refined model.",
        {
          ...stageSnapshot(status.context, NODES.GENERATE_VIEWS, { output: fallbackView }).payload,
          fallback: true,
        }
      );
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
      ? "Refinement paused after preserving the extracted source work."
      : nonCriticalErrors.length
        ? "Refinement completed and preserved a few items for later review."
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
