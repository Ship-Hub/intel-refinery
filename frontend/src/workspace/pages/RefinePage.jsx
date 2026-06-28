import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useRef } from "react";
import RefinementWorkspace from "../components/workspace/RefinementWorkspace";
import { useRefinement } from "../hooks/useRefinement";

export default function RefinePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { progress, status, log, graph, focus, discovery } = useRefinement(id);
  const completedRef = useRef(false);

  useEffect(() => {
    if (status === "complete" && !completedRef.current) {
      completedRef.current = true;
      setTimeout(() => navigate(`/projects/${id}/complete`), 1200);
    }
  }, [status, id, navigate]);

  return (
    <RefinementWorkspace
      project={{ name: "Project" }}
      progress={progress}
      status={status}
      log={log}
      graph={graph}
      focus={focus}
      discovery={discovery}
      onPause={() => {}}
      onBack={() => navigate("/")}
    />
  );
}
