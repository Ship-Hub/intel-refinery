import { useNavigate } from "react-router-dom";

const METHODS = [
  {
    id: "upload",
    title: "Upload Files",
    desc: "PDFs, images, audio, documents, spreadsheets",
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M10 3v10M6 9l4 4 4-4" stroke="#57D8FF" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M3 13v2a2 2 0 002 2h10a2 2 0 002-2v-2" stroke="#57D8FF" strokeWidth="1.3" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: "url",
    title: "Add URLs",
    desc: "Web pages, articles, documentation sites",
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <circle cx="10" cy="10" r="7" stroke="#57D8FF" strokeWidth="1.3" />
        <path d="M3 10h14M10 3a11 11 0 010 14M10 3a11 11 0 000 14" stroke="#57D8FF" strokeWidth="1.3" />
      </svg>
    ),
  },
  {
    id: "text",
    title: "Paste Text",
    desc: "Raw text, notes, transcripts, chat logs",
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <rect x="3" y="3" width="14" height="14" rx="2" stroke="#57D8FF" strokeWidth="1.3" />
        <path d="M7 7h6M7 10h4M7 13h5" stroke="#57D8FF" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
    ),
  },
];

export default function CreateMethod() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center">
      <div className="w-full max-w-[520px] px-6">
        <button onClick={() => navigate("/")} className="mb-8 flex items-center gap-2 text-[13px] text-ink-5 hover:text-ink-3 transition-colors">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M9 2.5L5 7l4 4.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
          </svg>
          Back
        </button>

        <h1 className="font-display text-[38px] font-light tracking-[-0.02em] text-ink-text mb-2">
          Create a project
        </h1>
        <p className="text-[14px] text-ink-4 mb-8">
          Choose how you'd like to add your sources.
        </p>

        <div className="flex flex-col gap-3">
          {METHODS.map((m) => (
            <button
              key={m.id}
              onClick={() => navigate(`/create/sources?type=${m.id}`)}
              className="flex items-center gap-4 rounded-xl border border-line bg-surface px-5 py-5 text-left hover:bg-elevated hover:border-cyan/20 transition-all"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-cyan/20 bg-cyan/[0.06]">
                {m.icon}
              </div>
              <div>
                <div className="text-[14px] font-medium text-ink-2">{m.title}</div>
                <div className="text-[12px] text-ink-5 mt-0.5">{m.desc}</div>
              </div>
              <svg className="ml-auto shrink-0" width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M5 3l4.5 4-4.5 4" stroke="#5A6472" strokeWidth="1.2" strokeLinecap="round" />
              </svg>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
