import { useParams, useNavigate } from "react-router-dom";

export default function Complete() {
  const { id } = useParams();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center relative overflow-hidden">
      {/* Radial glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-[radial-gradient(circle,rgba(87,216,255,0.08)_0%,transparent_70%)]" />
      </div>

      <div className="relative z-10 text-center max-w-[480px] px-6 animate-completeIn">
        <h1 className="font-display text-[50px] font-light tracking-[-0.025em] text-ink-text mb-3">
          Understanding Complete.
        </h1>
        <p className="text-[14px] text-ink-4 mb-10">
          Refinery has analyzed your sources and built a structured knowledge model.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={() => navigate(`/projects/${id}/refine`)}
            className="rounded-lg border border-line bg-surface px-6 py-3 text-[13px] font-medium text-ink-2 hover:bg-elevated transition-colors"
          >
            Explore Understanding
          </button>
          <button
            onClick={() => navigate(`/projects/${id}/transform`)}
            className="rounded-lg bg-cyan px-6 py-3 text-[13px] font-medium text-[#06222C] hover:bg-cyan-bright transition-colors"
          >
            Transform
            <span className="ml-1.5 inline-block translate-y-[-1px]">↗</span>
          </button>
        </div>
      </div>
    </div>
  );
}
