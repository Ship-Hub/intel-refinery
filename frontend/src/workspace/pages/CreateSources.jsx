import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { api } from "../../lib/api";

export default function CreateSources() {
  const [searchParams] = useSearchParams();
  const type = searchParams.get("type") || "upload";
  const navigate = useNavigate();
  const [sources, setSources] = useState([]);
  const [textInput, setTextInput] = useState("");
  const [urlInput, setUrlInput] = useState("");
  const [creating, setCreating] = useState(false);

  const handleFiles = (e) => {
    const files = Array.from(e.target.files || []);
    setSources((prev) => [...prev, ...files.map((f) => ({ name: f.name, size: f.size, type: f.type }))]);
  };

  const handleCreate = async () => {
    setCreating(true);
    try {
      const project = await api.createProject({ name: "New Project" });
      navigate(`/projects/${project.id}/refine`);
    } catch {
      setCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center">
      <div className="w-full max-w-[520px] px-6">
        <button onClick={() => navigate("/create")} className="mb-8 flex items-center gap-2 text-[13px] text-ink-5 hover:text-ink-3 transition-colors">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M9 2.5L5 7l4 4.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
          </svg>
          Back
        </button>

        <h1 className="font-display text-[38px] font-light tracking-[-0.02em] text-ink-text mb-2">
          {type === "upload" ? "Upload files" : type === "url" ? "Add URLs" : "Paste text"}
        </h1>
        <p className="text-[14px] text-ink-4 mb-8">
          {type === "upload"
            ? "Drop your files here or click to browse."
            : type === "url"
            ? "Enter the URLs you'd like to analyze."
            : "Paste the text you'd like to refine."}
        </p>

        {type === "upload" && (
          <div className="rounded-xl border-2 border-dashed border-line bg-surface p-8 text-center mb-6">
            <input
              type="file"
              multiple
              accept=".pdf,.doc,.docx,.txt,.csv,.xlsx,.png,.jpg,.jpeg,.mp3,.wav,.m4a"
              onChange={handleFiles}
              className="hidden"
              id="file-upload"
            />
            <label htmlFor="file-upload" className="cursor-pointer">
              <div className="text-[13px] text-ink-3 mb-1">Click to browse or drag files here</div>
              <div className="text-[11px] text-ink-5">PDF, DOC, TXT, CSV, XLSX, PNG, JPG, MP3, WAV</div>
            </label>
          </div>
        )}

        {type === "url" && (
          <div className="mb-6">
            <textarea
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="https://example.com/article&#10;https://docs.example.com/guide"
              className="w-full h-[140px] rounded-xl border border-line bg-surface px-4 py-3 text-[13px] text-ink-2 placeholder:text-ink-5 resize-none focus:outline-none focus:border-cyan/30"
            />
          </div>
        )}

        {type === "text" && (
          <div className="mb-6">
            <textarea
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Paste your text content here..."
              className="w-full h-[200px] rounded-xl border border-line bg-surface px-4 py-3 text-[13px] text-ink-2 placeholder:text-ink-5 resize-none focus:outline-none focus:border-cyan/30"
            />
          </div>
        )}

        {sources.length > 0 && (
          <div className="mb-6 space-y-2">
            {sources.map((s, i) => (
              <div key={i} className="flex items-center gap-3 rounded-lg border border-line bg-surface px-4 py-2.5">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <rect x="2" y="1" width="10" height="12" rx="1.5" stroke="#57D8FF" strokeWidth="1.1" />
                  <path d="M5 5h4M5 7.5h3" stroke="#57D8FF" strokeWidth="1" strokeLinecap="round" />
                </svg>
                <span className="text-[12px] text-ink-2 flex-1 truncate">{s.name}</span>
                <span className="text-[11px] text-ink-5">{(s.size / 1024).toFixed(0)} KB</span>
              </div>
            ))}
          </div>
        )}

        <button
          onClick={handleCreate}
          disabled={creating || (type === "upload" && sources.length === 0) || (type === "url" && !urlInput.trim()) || (type === "text" && !textInput.trim())}
          className="w-full rounded-lg bg-cyan py-3 text-[13px] font-medium text-[#06222C] hover:bg-cyan-bright transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {creating ? "Creating project..." : "Start Refining"}
        </button>
      </div>
    </div>
  );
}
