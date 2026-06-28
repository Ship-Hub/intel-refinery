import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../lib/api";

export default function Projects({ profileFilter = null }) {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api.v1Projects()
      .then((items) => setProjects(profileFilter ? items.filter((item) => item.profileKey === profileFilter) : items))
      .catch(() => setProjects([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-bg">
      <div className="mx-auto max-w-[960px] px-8 py-16">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-[32px] font-semibold tracking-tight text-ink-text md:text-[38px]">
              {profileFilter === "cyber" ? "Cyber projects" : "Projects"}
            </h1>
            <p className="mt-2 text-[14px] text-ink-4">
              {profileFilter === "cyber" ? "Cyber Refinery workspaces and model surfaces." : "General and Cyber Refinery workspaces."}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => navigate("/create")}
              className="rounded-lg border border-line px-4 py-2.5 text-[13px] text-ink-3 transition hover:border-cyan/25 hover:text-cyan"
            >
              General Project
            </button>
            <button
              onClick={() => navigate("/cyber/projects/new")}
              className="rounded-lg bg-blue-400 px-4 py-2.5 text-[13px] font-semibold text-bg transition hover:bg-blue-300"
            >
              Cyber Project
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-[13px] text-ink-5">Loading...</div>
        ) : projects.length === 0 ? (
          <div className="rounded-xl border border-line bg-surface p-12 text-center">
            <div className="mb-2 text-[15px] text-ink-3">No projects yet</div>
            <div className="text-[13px] text-ink-5">
              {profileFilter === "cyber" ? "Create a Cyber project to start modeling findings, assets, and actions." : "Create your first project to get started."}
            </div>
          </div>
        ) : (
          <div className="grid gap-3">
            {projects.map((p) => (
              <button
                key={p.id}
                onClick={() => navigate(p.profileKey === "cyber" ? `/cyber/projects/${p.id}/overview` : `/projects/${p.id}/refine`)}
                className="flex items-center justify-between rounded-xl border border-line bg-surface px-5 py-4 text-left hover:bg-elevated transition-colors"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="text-[14px] font-medium text-ink-2">{p.title || p.name}</div>
                    {p.profileKey === "cyber" && (
                      <span className="rounded-full border border-blue-400/25 bg-blue-400/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-blue-200">
                        Cyber
                      </span>
                    )}
                  </div>
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
