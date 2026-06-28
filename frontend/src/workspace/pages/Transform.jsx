import { useParams, useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../../lib/api";
import { getStoredSessionToken } from "../../lib/api";

const FORMATS = [
  { slug: "pdf", label: "PDF", desc: "Formatted document with tables and figures" },
  { slug: "word", label: "Word", desc: "Editable .docx document" },
  { slug: "markdown", label: "Markdown", desc: "Plain text with formatting" },
  { slug: "html", label: "HTML", desc: "Web-ready structured page" },
  { slug: "powerpoint", label: "PowerPoint", desc: "Presentation slides" },
  { slug: "mind-map", label: "Mind Map", desc: "Visual concept hierarchy" },
  { slug: "knowledge-graph", label: "Knowledge Graph", desc: "Node-edge relationship map" },
  { slug: "json", label: "JSON", desc: "Structured data export" },
  { slug: "obsidian", label: "Obsidian", desc: "Vault-ready markdown files" },
  { slug: "notion", label: "Notion", desc: "Importable page format" },
];

export default function Transform() {
  const { id } = useParams();
  const navigate = useNavigate();

  const handleExport = (slug) => {
    const token = getStoredSessionToken();
    const url = `${API_BASE_URL}/api/projects/${id}/export?format=${slug}`;
    const a = document.createElement("a");
    a.href = url;
    if (token) a.href += `&token=${token}`;
    a.target = "_blank";
    a.click();
  };

  return (
    <div className="min-h-screen bg-bg">
      <div className="mx-auto max-w-[720px] px-8 py-16">
        <button onClick={() => navigate(`/projects/${id}/refine`)} className="mb-8 flex items-center gap-2 text-[13px] text-ink-5 hover:text-ink-3 transition-colors">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M9 2.5L5 7l4 4.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
          </svg>
          Back to workspace
        </button>

        <h1 className="font-display text-[38px] font-light tracking-[-0.02em] text-ink-text mb-2">
          Transform
        </h1>
        <p className="text-[14px] text-ink-4 mb-10">
          Export your refined understanding in the format you need.
        </p>

        <div className="grid gap-3 sm:grid-cols-2">
          {FORMATS.map((f) => (
            <button
              key={f.slug}
              onClick={() => handleExport(f.slug)}
              className="flex items-center gap-4 rounded-xl border border-line bg-surface px-5 py-4 text-left hover:bg-elevated hover:border-cyan/20 transition-all"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-cyan/15 bg-cyan/[0.04]">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <rect x="2" y="1.5" width="12" height="13" rx="1.5" stroke="#57D8FF" strokeWidth="1.1" />
                  <path d="M5 5.5h6M5 8h4M5 10.5h5" stroke="#57D8FF" strokeWidth="1" strokeLinecap="round" />
                </svg>
              </div>
              <div className="min-w-0">
                <div className="text-[13px] font-medium text-ink-2">{f.label}</div>
                <div className="text-[11px] text-ink-5 mt-0.5">{f.desc}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
