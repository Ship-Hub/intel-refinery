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
  normalize: "Normalizing saved sources",
  chunk: "Splitting sources into traceable chunks",
  observe: "Extracting facts, claims, entities, and events",
  connect: "Finding relationships and contradictions",
  understand: "Building structured understanding",
  reflect: "Checking weak links and evidence gaps",
  build_model: "Freezing model version",
  generate_views: "Preparing project views",
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

const nowTs = () =>
  new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

export function useRefinement(projectId, runId = "latest") {
  const [run, setRun] = useState(null);
  const [log, setLog] = useState([]);
  const [error, setError] = useState("");
  const seen = useRef(new Set());

  const appendLog = useCallback((stage, tone = "normal", message = null) => {
    const key = `${stage}:${tone}:${message || ""}`;
    if (seen.current.has(key)) return;
    seen.current.add(key);

    setLog((items) => [
      ...items,
      {
        id: `${key}-${Date.now()}`,
        ts: nowTs(),
        text: message || STAGE_LABELS[stage] || stage,
        detail: tone === "failed" ? "Stage failed. Check the run details before trusting output." : null,
        glowing: true,
        discovery: stage === "observe" || stage === "connect" || stage === "understand",
      },
    ]);
  }, []);

  const applyRun = useCallback((nextRun) => {
    setRun(nextRun);
    setError("");

    for (const stage of nextRun?.stagesCompleted || []) appendLog(stage);
    for (const stage of nextRun?.stagesFailed || []) appendLog(stage, "failed");
    if (nextRun?.status === "failed" && nextRun.errorMessage) {
      appendLog("failed", "failed", nextRun.errorMessage);
    }
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
          if (data.eventType === "stage_completed" && data.stage) appendLog(data.stage);
          if (data.eventType === "stage_failed" && data.stage) appendLog(data.stage, "failed", data.message);
          if (data.eventType === "run_failed") appendLog("failed", "failed", data.message);
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
    nodes: GRAPH_NODES.slice(0, visibleNodeCount),
    links: GRAPH_LINKS.filter((link) => visibleNodeIds.has(link.from) && visibleNodeIds.has(link.to)),
  }), [visibleNodeCount, visibleNodeIds]);

  const focus = {
    title: run?.status === "completed" ? "Model ready" : "Refining project",
    status: run?.status || "queued",
    evidence: `${completedCount}/${STAGES.length} stages`,
    connected: (run?.stagesCompleted || []).slice(-3).map((stage) => ({
      label: STAGE_LABELS[stage] || stage,
      color: "#57D8FF",
    })),
    sections: [
      {
        heading: "RUN",
        items: [
          { label: `Run ${run?.id || runId}` },
          ...(run?.errorMessage ? [{ label: run.errorMessage, tone: "muted" }] : []),
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
