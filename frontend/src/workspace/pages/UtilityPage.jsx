import { Link } from "react-router-dom";
import { ArrowRight, Plus } from "lucide-react";

const COPY = {
  sources: {
    title: "Sources",
    eyebrow: "Library",
    body: "Source library management is coming into this workspace. Today, add files, URLs, and text directly to a project before refinement.",
    action: "Add sources",
    to: "/create/sources",
  },
  trash: {
    title: "Trash",
    eyebrow: "Recovery",
    body: "Deleted project recovery will live here. Nothing has been moved into this area yet.",
    action: "View projects",
    to: "/projects",
  },
  integrations: {
    title: "Integrations",
    eyebrow: "Connections",
    body: "Provider setup for GitHub, GitLab, Google, Telegram, and model vendors is managed through production environment configuration.",
    action: "Go home",
    to: "/",
  },
  settings: {
    title: "Settings",
    eyebrow: "Account",
    body: "Workspace preferences and account controls are being consolidated here. Authentication and sign out are already active in the sidebar.",
    action: "Go home",
    to: "/",
  },
  billing: {
    title: "Billing",
    eyebrow: "Plan",
    body: "Usage and billing controls are not enabled for this workspace yet.",
    action: "Go home",
    to: "/",
  },
};

export default function UtilityPage({ type }) {
  const page = COPY[type] || COPY.settings;

  return (
    <div className="min-h-screen bg-base px-6 py-8 text-ink-2 md:px-10">
      <div className="mx-auto flex max-w-3xl flex-col gap-8">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-cyan">
            {page.eyebrow}
          </div>
          <h1 className="mt-3 font-display text-[36px] leading-tight text-ink-1 md:text-[48px]">
            {page.title}
          </h1>
          <p className="mt-4 max-w-2xl text-[15px] leading-7 text-ink-3">
            {page.body}
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            to={page.to}
            className="inline-flex h-11 items-center gap-2 rounded-lg border border-cyan/30 bg-cyan/10 px-4 text-[13px] font-semibold text-cyan transition hover:bg-cyan/15"
          >
            {page.to === "/create/sources" ? <Plus className="h-4 w-4" /> : <ArrowRight className="h-4 w-4" />}
            {page.action}
          </Link>
          <Link
            to="/projects"
            className="inline-flex h-11 items-center rounded-lg border border-line px-4 text-[13px] font-semibold text-ink-3 transition hover:bg-surface hover:text-ink-2"
          >
            View all projects
          </Link>
        </div>
      </div>
    </div>
  );
}
