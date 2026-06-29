import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { api } from "../../lib/api";

const STAGES = [
  "normalize",
  "chunk",
  "observe",
  "connect",
  "understand",
  "reflect",
  "build_model",
  "generate_views",
];

const STAGE_LABELS = {
  ingest: "Reading the saved cyber sources",
  normalize: "Cleaning extracted security evidence",
  chunk: "Splitting sources into traceable evidence packets",
  observe: "AI is identifying findings, assets, and signals",
  connect: "AI is linking findings to assets, controls, and actions",
  understand: "AI is fine-tuning the cyber model",
  reflect: "Checking severity, duplicates, and evidence gaps",
  build_model: "Saving the cyber model version",
  generate_views: "Preparing the Cyber Refinery view",
};

const GRAPH_NODES = [
  { id: "sources", label: "Included\nSources", x: 0.5, y: 0.5, radius: 42, color: [59, 130, 246], isCenter: true, appearAt: 0 },
  { id: "findings", label: "Findings", x: 0.25, y: 0.26, radius: 28, color: [248, 113, 113], appearAt: 1 },
  { id: "assets", label: "Assets", x: 0.74, y: 0.24, radius: 28, color: [96, 165, 250], appearAt: 1 },
  { id: "threats", label: "Threats", x: 0.82, y: 0.58, radius: 26, color: [251, 191, 36], appearAt: 2 },
  { id: "controls", label: "Controls", x: 0.54, y: 0.82, radius: 24, color: [74, 222, 128], appearAt: 2 },
  { id: "actions", label: "Actions", x: 0.22, y: 0.7, radius: 26, color: [168, 85, 247], appearAt: 3 },
];

const GRAPH_LINKS = [
  { from: "sources", to: "findings", appearAt: 1 },
  { from: "sources", to: "assets", appearAt: 1 },
  { from: "findings", to: "assets", appearAt: 2 },
  { from: "threats", to: "assets", appearAt: 3 },
  { from: "controls", to: "findings", appearAt: 4 },
  { from: "actions", to: "findings", appearAt: 5 },
];

const TECHNICAL_MESSAGE_RE =
  /GoogleGenerativeAI|generateContent|429|Too Many Requests|prepayment|api\.|https?:\/\/|Request failed|API|Error fetching|tokens per minute|OPENROUTER|GEMINI|GROQ/i;

const nowTs = () =>
  new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

const cyberBucketForItem = (item = {}, fallback = "findings") => {
  const text = `${item.kind || ""} ${item.label || ""} ${item.detail || ""}`.toLowerCase();
  if (/source|website|document|image|ocr|playwright|cheerio|pdf|csv|json|log export/.test(text)) return "sources";
  if (/asset|host|server|endpoint|device|domain|ip address|account|identity|application|service/.test(text)) return "assets";
  if (/control|policy|mfa|edr|siem|logging|backup|encryption|mitigation|guardrail/.test(text)) return "controls";
  if (/action|remediation|recommendation|patch|rotate|isolate|review|investigate|owner|priority/.test(text)) return "actions";
  if (/threat|actor|malware|phishing|exploit|attack|campaign|ioc|indicator|incident|alert|breach|compromise/.test(text)) return "threats";
  if (/finding|vulnerability|cve|exposure|risk|severity|misconfig|weakness|conflict|gap/.test(text)) return "findings";
  return fallback;
};

const normalizeCyberGraph = (payloadGraph = {}) => {
  const next = {
    sources: [],
    findings: [],
    assets: [],
    threats: [],
    controls: [],
    actions: [],
  };

  for (const [key, items] of Object.entries(payloadGraph || {})) {
    if (!Array.isArray(items)) continue;
    for (const item of items) {
      if (!item?.label) continue;
      const bucket = next[key] ? key : cyberBucketForItem(item, key === "questions" ? "findings" : "findings");
      next[bucket].push(item);
    }
  }

  return next;
};

const mergeCyberGraphPayload = (current, payloadGraph = {}) => {
  const normalized = normalizeCyberGraph(payloadGraph);
  return Object.entries(normalized).reduce((next, [key, items]) => {
    if (!items.length) return next;
    const existing = next[key] || [];
    const seen = new Set(existing.map((item) => item.label));
    const merged = [...existing];
    for (const item of items) {
      if (!item?.label || seen.has(item.label)) continue;
      seen.add(item.label);
      merged.push(item);
    }
    next[key] = merged.slice(-3);
    return next;
  }, { ...current });
};

const cyberItemsFromPayload = (payload = {}, stage = "findings") => {
  if (payload?.items?.length) return payload.items;
  const graph = normalizeCyberGraph(payload?.graph || {});
  const preferred = {
    ingest: "sources",
    normalize: "sources",
    chunk: "sources",
    observe: "findings",
    connect: "findings",
    understand: "findings",
    reflect: "findings",
    build_model: "findings",
    generate_views: "findings",
  }[stage] || "findings";
  return graph[preferred]?.length
    ? graph[preferred]
    : graph.findings.length
      ? graph.findings
      : graph.assets.length
        ? graph.assets
        : graph.sources;
};

const calmCyberStageMessage = (stage, payload, fallback) => {
  const firstItem = cyberItemsFromPayload(payload, stage)[0];
  const label = firstItem?.label ? ` from ${firstItem.label}` : "";
  const copy = {
    ingest: firstItem?.detail
      ? `Captured readable security evidence${label}.`
      : "Captured readable security evidence from the saved sources.",
    normalize: `Cleaning extracted security evidence${label} so findings stay comparable.`,
    chunk: "Splitting the sources into traceable evidence packets for citation.",
    observe: `AI is identifying findings, assets, vulnerabilities, controls, and visual signals${label}.`,
    connect: "AI is checking which findings affect which assets, and which controls or actions apply.",
    understand: "AI is fine-tuning the cyber model around the strongest source-backed evidence.",
    reflect: "Checking unsupported severity, duplicate findings, missing assets, and evidence gaps.",
    build_model: "Saving a Cyber Refinery model with findings, assets, controls, actions, and source lineage.",
    generate_views: "Preparing the Cyber Refinery views for review and triage.",
  };

  if (!fallback || TECHNICAL_MESSAGE_RE.test(String(fallback))) return copy[stage] || "Cyber refinement is continuing.";
  return fallback;
};

export function useCyberRefinementRun(projectId, runId) {
  const [run, setRun] = useState(null);
  const [log, setLog] = useState([]);
  const [graphItems, setGraphItems] = useState({});
  const [latestFocus, setLatestFocus] = useState(null);
  const seenStages = useRef(new Set());
  const seenLogs = useRef(new Set());
  const [error, setError] = useState("");

  const appendLog = useCallback((stage, tone = "normal", message = null, payload = null) => {
    if (tone === "failed") return;

    const cleanMessage = calmCyberStageMessage(stage, payload, message);
    const key = `${stage}:${cleanMessage}`;
    if (seenLogs.current.has(key)) return;
    seenLogs.current.add(key);

    if (payload?.graph) {
      setGraphItems((current) => mergeCyberGraphPayload(current, payload.graph));
    }

    const items = cyberItemsFromPayload(payload, stage);
    if (payload?.focus || items.length) {
      setLatestFocus({
        ...(payload?.focus || {}),
        items,
        counts: payload?.counts || null,
        stage,
      });
    }

    setLog((entries) => [
      ...entries,
      {
        id: `${key}-${Date.now()}`,
        ts: nowTs(),
        text: cleanMessage || STAGE_LABELS[stage] || stage,
        detail: null,
        items,
        glowing: true,
        discovery: Boolean(items.length) || stage === "observe" || stage === "connect" || stage === "understand",
      },
    ]);
  }, []);

  const applyRun = useCallback((nextRun) => {
    setRun(nextRun);
    setError("");

    for (const stage of nextRun?.stagesCompleted || []) {
      if (!seenStages.current.has(stage)) {
        seenStages.current.add(stage);
        appendLog(stage);
      }
    }
  }, [appendLog]);

  useEffect(() => {
    if (!projectId || !runId) return undefined;
    let cancelled = false;
    const controller = new AbortController();

    const poll = async () => {
      try {
        const nextRun = await api.v1RunStatus(projectId, runId);
        if (cancelled) return;
        applyRun(nextRun);
      } catch (err) {
        if (!cancelled) setError(err.message || "Could not load run status");
      }
    };

    let timer = null;
    api.streamV1Run(projectId, runId, {
      signal: controller.signal,
      onEvent: (event, data) => {
        if (cancelled) return;
        if (event === "status" || event === "done") {
          applyRun(data);
        }
        if (event === "run-event") {
          if (data.eventType === "sources_loaded") {
            appendLog("ingest", "normal", data.message, data.payload);
          }
          if (data.eventType === "stage_started" && data.stage && !seenStages.current.has(`${data.stage}:started`)) {
            seenStages.current.add(`${data.stage}:started`);
            appendLog(data.stage, "normal", data.message, data.payload);
          }
          if (data.eventType === "stage_completed" && data.stage && !seenStages.current.has(data.stage)) {
            seenStages.current.add(data.stage);
            appendLog(data.stage, "normal", data.message, data.payload);
          }
        }
      },
    }).catch((err) => {
      if (cancelled || err.name === "AbortError") return;
      setError(err.message || "Run stream unavailable; polling status");
      poll();
      timer = window.setInterval(poll, 2500);
    });

    return () => {
      cancelled = true;
      controller.abort();
      if (timer) window.clearInterval(timer);
    };
  }, [appendLog, applyRun, projectId, runId]);

  const progress = run?.progress ?? 0;
  const completedCount = run?.stagesCompleted?.length || 0;
  const visibleNodeCount = Math.max(1, Math.min(GRAPH_NODES.length, Math.ceil((completedCount / STAGES.length) * GRAPH_NODES.length)));
  const visibleNodeIds = useMemo(
    () => new Set(GRAPH_NODES.slice(0, visibleNodeCount).map((node) => node.id)),
    [visibleNodeCount]
  );

  const graph = useMemo(() => ({
    nodes: GRAPH_NODES.slice(0, visibleNodeCount).map((node) => ({
      ...node,
      items: graphItems[node.id] || [],
    })),
    links: GRAPH_LINKS.filter((link) => visibleNodeIds.has(link.from) && visibleNodeIds.has(link.to)),
  }), [graphItems, visibleNodeCount, visibleNodeIds]);

  const focusItems = latestFocus?.items?.length
    ? latestFocus.items
    : (run?.stagesCompleted || []).slice(-3).map((stage) => ({
      label: STAGE_LABELS[stage] || stage,
      color: "#3B82F6",
    }));

  const focus = {
    title: run?.status === "completed" ? "Cyber model ready" : latestFocus?.title || "Cyber refinement",
    status: latestFocus?.status || run?.status || "queued",
    evidence: latestFocus?.evidence || `${completedCount}/${STAGES.length} stages`,
    connected: focusItems.slice(0, 3).map((item) => ({
      label: item.label || item,
      detail: item.detail || null,
      color: "#60A5FA",
    })),
    sections: [
      ...(latestFocus?.counts ? [{
        heading: "CYBER SIGNALS",
        items: [
          { label: `${latestFocus.counts.sources || 0} sources in play` },
          { label: `${latestFocus.counts.artifacts || 0} security artifacts extracted` },
          { label: `${latestFocus.counts.connections || 0} evidence links found` },
        ],
      }] : []),
      {
        heading: "SECURITY MODEL",
        items: [
          { label: `${graphItems.findings?.length || 0} findings tracked` },
          { label: `${graphItems.assets?.length || 0} assets observed` },
          { label: `${graphItems.controls?.length || 0} controls mapped` },
          { label: `${graphItems.actions?.length || 0} actions queued` },
        ],
      },
      {
        heading: "RUN",
        items: [
          { label: `Run ${run?.id || runId}` },
        ],
      },
    ],
  };

  return {
    run,
    error,
    progress,
    status: run?.status === "completed" ? "complete" : run?.status === "failed" ? "failed" : "refining",
    log,
    graph,
    focus,
    discovery: [...log].reverse().find((entry) => entry.discovery) || null,
  };
}
