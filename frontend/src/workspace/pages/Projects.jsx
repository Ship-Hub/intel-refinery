import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../lib/api";

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api.projects()
      .then(setProjects)
      .catch(() => setProjects([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-bg">
      <div className="mx-auto max-w-[960px] px-8 py-16">
        <h1 className="font-display text-[38px] font-light tracking-[-0.02em] text-ink-text mb-8">
          Projects
        </h1>

        {loading ? (
          <div className="text-[13px] text-ink-5">Loading...</div>
        ) : projects.length === 0 ? (
          <div className="rounded-xl border border-line bg-surface p-12 text-center">
            <div className="text-[15px] text-ink-3 mb-2">No projects yet</div>
            <div className="text-[13px] text-ink-5">Create your first project to get started.</div>
          </div>
        ) : (
          <div className="grid gap-3">
            {projects.map((p) => (
              <button
                key={p.id}
                onClick={() => navigate(`/projects/${p.id}/refine`)}
                className="flex items-center justify-between rounded-xl border border-line bg-surface px-5 py-4 text-left hover:bg-elevated transition-colors"
              >
                <div>
                  <div className="text-[14px] font-medium text-ink-2">{p.name}</div>
                  <div className="text-[12px] text-ink-5 mt-0.5">
                    {p.sourceCount ?? 0} sources &middot; {p.status || "draft"}
                  </div>
                </div>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M5 3l4.5 4-4.5 4" stroke="#5A6472" strokeWidth="1.2" strokeLinecap="round" />
                </svg>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
