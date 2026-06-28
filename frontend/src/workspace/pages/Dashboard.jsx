import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../../lib/api";
import { useWorkspaceAuth } from "../auth/WorkspaceAuth";

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

export default function Dashboard() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { user } =
    useWorkspaceAuth();
  const displayName =
    user?.displayName ||
    user?.email ||
    "there";

  useEffect(() => {
    api.v1Projects()
      .then(setProjects)
      .catch(() => setProjects([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-bg">
      <div className="mx-auto max-w-[960px] px-8 py-16">
        <h1 className="mb-2 text-[36px] font-semibold leading-tight tracking-tight text-ink-text md:text-[54px] md:font-light md:tracking-[-0.025em]">
          {getGreeting()}, {displayName}.
        </h1>
        <p className="text-[15px] text-ink-4 mb-12">
          What would you like to refine today?
        </p>

        <div className="flex items-center gap-4 mb-10">
          <Link
            to="/create"
            className="flex items-center gap-2 rounded-lg bg-cyan px-5 py-2.5 text-[13px] font-medium text-[#06222C] hover:bg-cyan-bright transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M7 2.5v9M2.5 7h9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
            New Project
          </Link>
        </div>

        {loading ? (
          <div className="text-[13px] text-ink-5">Loading projects...</div>
        ) : projects.length === 0 ? (
          <div className="rounded-xl border border-line bg-surface p-12 text-center">
            <div className="text-[15px] text-ink-3 mb-2">No projects yet</div>
            <div className="text-[13px] text-ink-5">Create your first project to start refining information into understanding.</div>
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
                  <div className="text-[14px] font-medium text-ink-2">{p.title || p.name || "Untitled project"}</div>
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
