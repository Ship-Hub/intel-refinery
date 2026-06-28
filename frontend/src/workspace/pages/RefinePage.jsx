import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import RefinementWorkspace from "../components/workspace/RefinementWorkspace";
import { useRefinement } from "../hooks/useRefinement";
import { api } from "../../lib/api";

export default function RefinePage() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const requestedRunId = searchParams.get("runId");
  const navigate = useNavigate();
  const [runId, setRunId] = useState(requestedRunId || null);
  const [project, setProject] = useState(null);
  const [error, setError] = useState("");
  const { progress, status, log, graph, focus, discovery, error: runError } = useRefinement(id, runId || "latest");
  const completedRef = useRef(false);
  const startedRef = useRef(false);

  useEffect(() => {
    if (!id || startedRef.current) return;
    startedRef.current = true;

    let cancelled = false;
    const runPromise = requestedRunId
      ? Promise.resolve({ id: requestedRunId, runId: requestedRunId })
      : api.startV1Refinement(id);

    Promise.all([api.getV1Project(id).catch(() => null), runPromise])
      .then(([projectData, run]) => {
        if (cancelled) return;
        if (projectData) setProject(projectData);
        setRunId(run.runId || run.id || "latest");
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || "Could not start refinement");
      });

    return () => {
      cancelled = true;
    };
  }, [id, requestedRunId]);

  useEffect(() => {
    if (status === "complete" && !completedRef.current) {
      completedRef.current = true;
      setTimeout(() => navigate(`/projects/${id}/complete`), 1200);
    }
  }, [status, id, navigate]);

  return (
    <div className="h-screen bg-bg">
      {(error || runError) && (
        <div className="fixed left-1/2 top-4 z-50 -translate-x-1/2 rounded-lg border border-red-400/25 bg-red-400/10 px-4 py-3 text-[13px] text-red-100">
          {error || runError}
        </div>
      )}
      <RefinementWorkspace
        project={{ name: project?.title || "Project" }}
        progress={progress}
        status={status}
        log={log}
        graph={graph}
        focus={focus}
        discovery={discovery}
        onPause={() => {}}
        onBack={() => navigate("/")}
      />
      {(status === "complete" || status === "failed") && (
        <div className="fixed bottom-5 right-5 z-50 flex flex-wrap gap-2 rounded-lg border border-line bg-elevated p-3 shadow-2xl">
          <button
            onClick={() => navigate("/")}
            className="rounded-md border border-line px-3 py-2 text-[12px] text-ink-3 transition hover:border-cyan/30 hover:text-ink-2"
          >
            Home
          </button>
          <button
            onClick={() => navigate(`/projects/${id}/overview`)}
            className="rounded-md bg-cyan px-3 py-2 text-[12px] font-semibold text-[#06222C] transition hover:bg-cyan-bright"
          >
            View model
          </button>
        </div>
      )}
    </div>
  );
}
