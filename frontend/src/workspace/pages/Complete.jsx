import { useParams, useNavigate } from "react-router-dom";

export default function Complete() {
  const { id } = useParams();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center relative overflow-hidden">
      <button
        onClick={() => navigate("/")}
        className="absolute left-5 top-5 z-20 rounded-lg border border-line bg-surface px-4 py-2.5 text-[13px] font-medium text-ink-3 transition hover:border-cyan/30 hover:text-ink-2"
      >
        Home
      </button>
      {/* Radial glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-[radial-gradient(circle,rgba(87,216,255,0.08)_0%,transparent_70%)]" />
      </div>

      <div className="relative z-10 text-center max-w-[480px] px-6 animate-completeIn">
        <h1 className="mb-3 text-[36px] font-semibold leading-tight tracking-tight text-ink-text md:text-[50px] md:font-light md:tracking-[-0.025em]">
          Understanding Complete.
        </h1>
        <p className="text-[14px] text-ink-4 mb-10">
          Refinery has analyzed your sources and built a structured knowledge model.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={() => navigate(`/projects/${id}/overview`)}
            className="rounded-lg border border-line bg-surface px-6 py-3 text-[13px] font-medium text-ink-2 hover:bg-elevated transition-colors"
          >
            View model
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
