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
  ingest: "Reading the saved sources",
  normalize: "Cleaning extracted source text",
  chunk: "Splitting material into traceable evidence packets",
  observe: "AI is making sense of the extracted text",
  connect: "AI is checking which findings belong together",
  understand: "AI is fine-tuning the working model",
  reflect: "Reviewing weak links and unanswered questions",
  build_model: "Saving the refined model version",
  generate_views: "Preparing project views for inspection",
};

const GRAPH_NODES = [
  { id: "sources", label: "Saved\nSources", x: 0.5, y: 0.5, radius: 42, color: [87, 216, 255], isCenter: true, appearAt: 0 },
  { id: "observations", label: "Observations", x: 0.24, y: 0.28, radius: 29, color: [96, 165, 250], appearAt: 1 },
  { id: "entities", label: "Entities", x: 0.75, y: 0.24, radius: 27, color: [156, 142, 224], appearAt: 1 },
  { id: "events", label: "Events", x: 0.82, y: 0.58, radius: 25, color: [215, 195, 138], appearAt: 2 },
  { id: "connections", label: "Connections", x: 0.54, y: 0.82, radius: 26, color: [92, 214, 176], appearAt: 3 },
  { id: "questions", label: "Gaps &\nQuestions", x: 0.21, y: 0.7, radius: 26, color: [248, 113, 113], appearAt: 4 },
];

const GRAPH_LINKS = [
  { from: "sources", to: "observations", appearAt: 1 },
  { from: "sources", to: "entities", appearAt: 1 },
  { from: "observations", to: "events", appearAt: 2 },
  { from: "entities", to: "connections", appearAt: 3 },
  { from: "connections", to: "questions", appearAt: 4 },
  { from: "events", to: "connections", appearAt: 5 },
];

const NODE_LABELS = {
  sources: "Saved\nSources",
  observations: "Observations",
  entities: "Entities",
  events: "Events",
  connections: "Connections",
  questions: "Gaps &\nQuestions",
};

const nowTs = () =>
  new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

const sanitizeMessage = (message) => {
  const text = String(message || "").trim();
  return text;
};

const isTechnicalMessage = (message) =>
  /GoogleGenerativeAI|generateContent|429|Too Many Requests|prepayment|api\.|https?:\/\/|Request failed|API|stack|Error fetching|tokens per minute|console\.groq\.com|OPENROUTER|GEMINI|GROQ/i.test(
    String(message || "")
  );

const calmStageMessage = (stage, payload, fallback) => {
  const firstItem = payload?.items?.[0];
  const itemLabel = firstItem?.label ? ` from ${firstItem.label}` : "";
  const stageFallbacks = {
    ingest: firstItem?.detail
      ? `Captured readable source text${itemLabel}.`
      : "Captured readable text from the saved sources.",
    normalize: `Cleaning the extracted text${itemLabel} so the evidence is easier to compare.`,
    chunk: "Splitting the material into traceable evidence packets.",
    observe: `AI is making sense of the extracted text${itemLabel}.`,
    connect: "AI is checking which findings belong together.",
    understand: "AI is fine-tuning the working model around the clearest evidence.",
    reflect: "Reviewing the model for weak links, duplicates, and unanswered questions.",
    build_model: "Saving a refined model version with the strongest supported signals.",
    generate_views: "Preparing the project views for inspection.",
  };
  if (!fallback || isTechnicalMessage(fallback)) return stageFallbacks[stage] || "Refinement is continuing.";
  return fallback;
};

const mergeGraphPayload = (current, payloadGraph = {}) => {
  if (!payloadGraph || typeof payloadGraph !== "object") return current;
  return Object.entries(payloadGraph).reduce((next, [key, items]) => {
    if (!Array.isArray(items)) return next;
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

export function useRefinement(projectId, runId = "latest") {
  const [run, setRun] = useState(null);
  const [log, setLog] = useState([]);
  const [graphItems, setGraphItems] = useState({});
  const [latestFocus, setLatestFocus] = useState(null);
  const [error, setError] = useState("");
  const seen = useRef(new Set());

  const appendLog = useCallback((stage, tone = "normal", message = null, payload = null) => {
    if (tone === "failed") return;
    const cleanMessage = calmStageMessage(stage, payload, sanitizeMessage(message));
    const key = `${stage}:${tone}:${cleanMessage || ""}`;
    if (seen.current.has(key)) return;
    seen.current.add(key);

    if (payload?.graph) {
      setGraphItems((current) => mergeGraphPayload(current, payload.graph));
    }
    if (payload?.focus || payload?.items?.length) {
      setLatestFocus({
        ...(payload.focus || {}),
        items: payload.items || [],
        counts: payload.counts || null,
        stage,
      });
    }

    setLog((items) => [
      ...items,
      {
        id: `${key}-${Date.now()}`,
        ts: nowTs(),
        text: cleanMessage || STAGE_LABELS[stage] || stage,
        detail: null,
        items: payload?.items || [],
        glowing: true,
        discovery: Boolean(payload?.items?.length) || stage === "observe" || stage === "connect" || stage === "understand",
      },
    ]);
  }, []);

  const applyRun = useCallback((nextRun) => {
    setRun(nextRun);
    setError("");

    for (const stage of nextRun?.stagesCompleted || []) appendLog(stage);
  }, [appendLog]);

  useEffect(() => {
    if (!projectId || !runId) return undefined;

    let cancelled = false;
    const controller = new AbortController();
    let timer = null;

    const poll = async () => {
      try {
        const nextRun = await api.v1RunStatus(projectId, runId);
        if (!cancelled) applyRun(nextRun);
      } catch (err) {
        if (!cancelled) setError(err.message || "Could not load run status");
      }
    };

    api.streamV1Run(projectId, runId, {
      signal: controller.signal,
      onEvent: (event, data) => {
        if (cancelled) return;
        if (event === "status" || event === "done") applyRun(data);
        if (event === "run-event") {
          if (data.eventType === "sources_loaded") appendLog("ingest", "normal", data.message, data.payload);
          if (data.eventType === "stage_started" && data.stage) appendLog(data.stage, "normal", data.message, data.payload);
          if (data.eventType === "stage_completed" && data.stage) appendLog(data.stage, "normal", data.message, data.payload);
        }
      },
    }).catch((err) => {
      if (cancelled || err.name === "AbortError") return;
      setError("Live stream unavailable. Falling back to polling.");
      poll();
      timer = window.setInterval(poll, 2500);
    });

    return () => {
      cancelled = true;
      controller.abort();
      if (timer) window.clearInterval(timer);
    };
  }, [appendLog, applyRun, projectId, runId]);

  const completedCount = run?.stagesCompleted?.length || 0;
  const visibleNodeCount = Math.max(1, Math.min(GRAPH_NODES.length, Math.ceil((completedCount / STAGES.length) * GRAPH_NODES.length)));
  const visibleNodeIds = useMemo(
    () => new Set(GRAPH_NODES.slice(0, visibleNodeCount).map((node) => node.id)),
    [visibleNodeCount]
  );

  const graph = useMemo(() => ({
    nodes: GRAPH_NODES.slice(0, visibleNodeCount).map((node) => ({
      ...node,
      label: NODE_LABELS[node.id] || node.label,
      items: graphItems[node.id] || [],
    })),
    links: GRAPH_LINKS.filter((link) => visibleNodeIds.has(link.from) && visibleNodeIds.has(link.to)),
  }), [graphItems, visibleNodeCount, visibleNodeIds]);

  const focus = {
    title: run?.status === "completed" ? "Model ready" : latestFocus?.title || "Refining project",
    status: latestFocus?.status || run?.status || "queued",
    evidence: latestFocus?.evidence || `${completedCount}/${STAGES.length} stages`,
    connected: (latestFocus?.items?.length ? latestFocus.items : (run?.stagesCompleted || []).slice(-3).map((stage) => ({
      label: STAGE_LABELS[stage] || stage,
      color: "#57D8FF",
    }))).slice(0, 3).map((item) => ({
      label: item.label || item,
      detail: item.detail || null,
      color: "#57D8FF",
    })),
    sections: [
      ...(latestFocus?.counts ? [{
        heading: "MODEL SIGNALS",
        items: [
          { label: `${latestFocus.counts.sources || 0} sources in play` },
          { label: `${latestFocus.counts.artifacts || 0} artifacts extracted` },
          { label: `${latestFocus.counts.connections || 0} relationships found` },
        ],
      }] : []),
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
    progress: run?.progress ?? 0,
    status: run?.status === "completed" ? "complete" : run?.status === "failed" ? "failed" : "refining",
    log,
    graph,
    focus,
    discovery: [...log].reverse().find((entry) => entry.discovery) || null,
  };
}
