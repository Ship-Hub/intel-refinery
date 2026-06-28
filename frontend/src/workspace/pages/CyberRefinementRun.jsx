import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import RefinementWorkspace from "../components/workspace/RefinementWorkspace";
import { useCyberRefinementRun } from "../hooks/useCyberRefinementRun";

export default function CyberRefinementRun() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const runId = searchParams.get("runId") || "latest";
  const navigate = useNavigate();
  const { progress, status, log, graph, focus, discovery, error } = useCyberRefinementRun(id, runId);

  return (
    <div className="h-screen bg-bg">
      {error && (
        <div className="fixed left-1/2 top-4 z-50 -translate-x-1/2 rounded-lg border border-red-400/25 bg-red-400/10 px-4 py-3 text-[13px] text-red-100">
          {error}
        </div>
      )}
      <RefinementWorkspace
        project={{ name: "Cyber Refinery Run" }}
        progress={progress}
        status={status}
        log={log}
        graph={graph}
        focus={focus}
        discovery={discovery}
        onPause={() => {}}
        onBack={() => navigate(`/cyber/projects/${id}/workspace`)}
      />
      {(status === "complete" || status === "failed") && (
        <div className="fixed bottom-5 right-5 z-50 flex gap-2 rounded-lg border border-line bg-elevated p-3 shadow-2xl">
          <button
            onClick={() => navigate("/")}
            className="rounded-md border border-line px-3 py-2 text-[12px] text-ink-3 transition hover:border-blue-400/30 hover:text-blue-100"
          >
            Home
          </button>
          <button
            onClick={() => navigate(`/cyber/projects/${id}/workspace`)}
            className="rounded-md border border-line px-3 py-2 text-[12px] text-ink-3 transition hover:border-blue-400/30 hover:text-blue-100"
          >
            Back to workspace
          </button>
          <button
            onClick={() => navigate(`/cyber/projects/${id}/overview`)}
            className="rounded-md bg-blue-400 px-3 py-2 text-[12px] font-semibold text-bg transition hover:bg-blue-300"
          >
            View project
          </button>
        </div>
      )}
    </div>
  );
}
