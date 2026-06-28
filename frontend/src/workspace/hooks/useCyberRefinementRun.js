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
  normalize: "Normalizing source text",
  chunk: "Chunking included sources",
  observe: "Extracting cyber artifacts",
  connect: "Connecting findings, assets, controls, and actions",
  understand: "Building cyber model understanding",
  reflect: "Reviewing conflicts and evidence gaps",
  build_model: "Freezing model version",
  generate_views: "Generating Cyber Refinery view",
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

const nowTs = () => {
  const date = new Date();
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
};

export function useCyberRefinementRun(projectId, runId) {
  const [run, setRun] = useState(null);
  const [log, setLog] = useState([]);
  const seenStages = useRef(new Set());
  const [error, setError] = useState("");

  const appendLog = useCallback((stage, tone = "normal") => {
    setLog((items) => [
      ...items,
      {
        id: `${stage}-${Date.now()}`,
        ts: nowTs(),
        text: STAGE_LABELS[stage] || stage,
        detail: tone === "failed" ? "Stage reported a failure. Check run status for details." : null,
        glowing: true,
        discovery: stage === "observe" || stage === "connect",
      },
    ]);
  }, []);

  const applyRun = useCallback((nextRun) => {
    setRun(nextRun);
    setError("");

    for (const stage of nextRun.stagesCompleted || []) {
      if (!seenStages.current.has(stage)) {
        seenStages.current.add(stage);
        appendLog(stage);
      }
    }
    for (const stage of nextRun.stagesFailed || []) {
      if (!seenStages.current.has(`${stage}:failed`)) {
        seenStages.current.add(`${stage}:failed`);
        appendLog(stage, "failed");
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
        if (event === "run-event" && data.stage) {
          if (data.eventType === "stage_completed" && !seenStages.current.has(data.stage)) {
            seenStages.current.add(data.stage);
            appendLog(data.stage);
          }
          if (data.eventType === "stage_failed" && !seenStages.current.has(`${data.stage}:failed`)) {
            seenStages.current.add(`${data.stage}:failed`);
            appendLog(data.stage, "failed");
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

  const graph = useMemo(() => ({
    nodes: GRAPH_NODES.slice(0, visibleNodeCount),
    links: GRAPH_LINKS.filter((link) => {
      const visible = new Set(GRAPH_NODES.slice(0, visibleNodeCount).map((node) => node.id));
      return visible.has(link.from) && visible.has(link.to);
    }),
  }), [visibleNodeCount]);

  const focus = {
    title: run?.status === "completed" ? "Cyber model ready" : "Cyber refinement",
    status: run?.status || "queued",
    evidence: `${completedCount}/${STAGES.length} stages`,
    connected: (run?.stagesCompleted || []).slice(-3).map((stage) => ({ label: STAGE_LABELS[stage] || stage, color: "#3B82F6" })),
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
    progress,
    status: run?.status === "completed" ? "complete" : run?.status === "failed" ? "failed" : "refining",
    log,
    graph,
    focus,
    discovery: [...log].reverse().find((entry) => entry.discovery) || null,
  };
}
