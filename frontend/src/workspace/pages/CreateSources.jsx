import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { FileText, Globe2, Plus, Trash2, Type, UploadCloud } from "lucide-react";
import { api } from "../../lib/api";

const MODES = [
  { id: "upload", label: "Files", icon: UploadCloud },
  { id: "url", label: "URLs", icon: Globe2 },
  { id: "text", label: "Text", icon: Type },
];

const makeId = () => crypto.randomUUID();

export default function CreateSources() {
  const [searchParams] = useSearchParams();
  const initialMode = searchParams.get("type") || "upload";
  const existingProjectId = searchParams.get("projectId");
  const navigate = useNavigate();
  const [mode, setMode] = useState(MODES.some((item) => item.id === initialMode) ? initialMode : "upload");
  const [items, setItems] = useState([]);
  const [textInput, setTextInput] = useState("");
  const [urlInput, setUrlInput] = useState("");
  const [projectTitle, setProjectTitle] = useState("Untitled refinery project");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  const counts = useMemo(() => ({
    upload: items.filter((item) => item.kind === "upload").length,
    url: items.filter((item) => item.kind === "url").length,
    text: items.filter((item) => item.kind === "text").length,
  }), [items]);

  const addFiles = (event) => {
    const files = Array.from(event.target.files || []);
    setItems((prev) => [
      ...prev,
      ...files.map((file) => ({
        id: makeId(),
        kind: "upload",
        title: file.name,
        file,
      })),
    ]);
    event.target.value = "";
  };

  const addUrls = () => {
    const urls = urlInput
      .split(/\r?\n/)
      .map((value) => value.trim())
      .filter(Boolean);
    if (urls.length === 0) return;
    setItems((prev) => [
      ...prev,
      ...urls.map((url) => ({
        id: makeId(),
        kind: "url",
        title: url,
        uri: url,
      })),
    ]);
    setUrlInput("");
  };

  const addText = () => {
    const content = textInput.trim();
    if (!content) return;
    setItems((prev) => [
      ...prev,
      {
        id: makeId(),
        kind: "text",
        title: `Pasted text ${prev.filter((item) => item.kind === "text").length + 1}`,
        content,
      },
    ]);
    setTextInput("");
  };

  const removeItem = (id) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const persistItem = async (projectId, item) => {
    if (item.kind === "upload") {
      const formData = new FormData();
      formData.append("source", item.file);
      formData.append("sourceCategory", "other");
      formData.append("title", item.title);
      formData.append("displayName", item.title);
      return api.uploadV1Source(projectId, formData);
    }

    if (item.kind === "url") {
      return api.createV1UrlSource(projectId, {
        sourceType: "url",
        uri: item.uri,
        title: item.title,
        displayName: item.title,
        sourceCategory: "other",
      });
    }

    return api.createV1RawSource(projectId, {
      sourceType: "text",
      content: item.content,
      title: item.title,
      displayName: item.title,
      sourceCategory: "other",
    });
  };

  const handleStart = async () => {
    if (items.length === 0) return;
    setCreating(true);
    setError("");

    try {
      const project = existingProjectId
        ? { id: existingProjectId }
        : await api.createV1Project({
            title: projectTitle.trim() || "Untitled refinery project",
            refineryProfile: "general",
            intent: "general_research",
            mode: "quick",
          });

      for (const item of items) {
        await persistItem(project.id, item);
      }

      const run = await api.startV1Refinement(project.id);
      navigate(`/projects/${project.id}/refine?runId=${encodeURIComponent(run.runId || run.id || "latest")}`);
    } catch (err) {
      setError(err.message || "Could not create project");
      setCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg">
      <div className="mx-auto grid min-h-screen max-w-[1180px] grid-cols-1 gap-8 px-6 py-10 lg:grid-cols-[minmax(0,1fr)_360px]">
        <main className="flex flex-col">
          <button onClick={() => navigate("/create")} className="mb-8 flex w-fit items-center gap-2 text-[13px] text-ink-5 transition-colors hover:text-ink-3">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M9 2.5L5 7l4 4.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
            </svg>
            Back
          </button>

          <div className="mb-8">
            <div className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-cyan">Source collection</div>
            <h1 className="mb-3 text-[32px] font-semibold leading-tight tracking-tight text-ink-text md:text-[38px]">
              {existingProjectId ? "Add more source material." : "Add everything you want refined."}
            </h1>
            <p className="max-w-[68ch] text-[14px] leading-6 text-ink-4">
              Add files, URLs, and pasted text to the same draft. Refinement starts only after the full source set is saved.
            </p>
          </div>

          {!existingProjectId && (
            <label className="mb-6 block max-w-xl">
              <span className="mb-2 block text-[12px] font-semibold uppercase tracking-[0.14em] text-ink-5">Project title</span>
              <input
                value={projectTitle}
                onChange={(event) => setProjectTitle(event.target.value)}
                className="w-full rounded-lg border border-line bg-surface px-4 py-3 text-[14px] text-ink-2 outline-none transition focus:border-cyan/40"
              />
            </label>
          )}

          <div className="mb-5 flex flex-wrap gap-2">
            {MODES.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setMode(id)}
                className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2.5 text-[13px] font-medium transition ${
                  mode === id
                    ? "border-cyan/40 bg-cyan/[0.08] text-cyan"
                    : "border-line bg-surface text-ink-4 hover:border-cyan/25 hover:text-ink-2"
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
                {counts[id] > 0 && <span className="rounded-full bg-rail px-2 py-0.5 text-[11px] text-ink-3">{counts[id]}</span>}
              </button>
            ))}
          </div>

          <section className="rounded-lg border border-line bg-surface p-5">
            {mode === "upload" && (
              <div className="rounded-lg border border-dashed border-line bg-bg p-8 text-center">
                <input
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx,.txt,.csv,.json,.xlsx,.png,.jpg,.jpeg,.webp,.mp3,.wav,.m4a"
                  onChange={addFiles}
                  className="hidden"
                  id="file-upload"
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  <UploadCloud className="mx-auto mb-3 h-8 w-8 text-cyan" />
                  <div className="mb-1 text-[14px] font-medium text-ink-2">Choose files</div>
                  <div className="text-[12px] text-ink-5">PDF, images, text, CSV, JSON, audio and office exports</div>
                </label>
              </div>
            )}

            {mode === "url" && (
              <div className="space-y-3">
                <textarea
                  value={urlInput}
                  onChange={(event) => setUrlInput(event.target.value)}
                  placeholder="https://example.com/article&#10;https://docs.example.com/guide"
                  className="h-[150px] w-full resize-none rounded-lg border border-line bg-bg px-4 py-3 text-[13px] leading-6 text-ink-2 outline-none placeholder:text-ink-5 focus:border-cyan/40"
                />
                <button onClick={addUrls} disabled={!urlInput.trim()} className="inline-flex items-center gap-2 rounded-lg bg-cyan px-4 py-2.5 text-[13px] font-semibold text-[#06222C] transition hover:bg-cyan-bright disabled:cursor-not-allowed disabled:opacity-40">
                  <Plus className="h-4 w-4" />
                  Add URLs to draft
                </button>
              </div>
            )}

            {mode === "text" && (
              <div className="space-y-3">
                <textarea
                  value={textInput}
                  onChange={(event) => setTextInput(event.target.value)}
                  placeholder="Paste notes, transcripts, reports, chats, timelines, or any raw material..."
                  className="h-[220px] w-full resize-none rounded-lg border border-line bg-bg px-4 py-3 text-[13px] leading-6 text-ink-2 outline-none placeholder:text-ink-5 focus:border-cyan/40"
                />
                <button onClick={addText} disabled={!textInput.trim()} className="inline-flex items-center gap-2 rounded-lg bg-cyan px-4 py-2.5 text-[13px] font-semibold text-[#06222C] transition hover:bg-cyan-bright disabled:cursor-not-allowed disabled:opacity-40">
                  <Plus className="h-4 w-4" />
                  Add text to draft
                </button>
              </div>
            )}
          </section>
        </main>

        <aside className="flex min-h-0 flex-col rounded-lg border border-line bg-rail p-4 lg:sticky lg:top-10 lg:max-h-[calc(100vh-80px)]">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <div className="text-[14px] font-semibold text-ink-2">Draft sources</div>
              <div className="mt-1 text-[12px] text-ink-5">{items.length} total sources</div>
            </div>
            <FileText className="h-5 w-5 text-cyan" />
          </div>

          {error && <div className="mb-3 rounded-lg border border-red-400/30 bg-red-400/10 px-3 py-2 text-[12px] text-red-100">{error}</div>}

          <div className="rf-scroll min-h-[220px] flex-1 space-y-2 overflow-y-auto">
            {items.length === 0 ? (
              <div className="rounded-lg border border-line bg-surface px-4 py-8 text-center text-[13px] leading-6 text-ink-5">
                Add any combination of files, URLs, and text before starting refinement.
              </div>
            ) : (
              items.map((item) => (
                <div key={item.id} className="flex items-start gap-3 rounded-lg border border-line bg-surface px-3 py-3">
                  <SourceIcon kind={item.kind} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[13px] font-medium text-ink-2">{item.title}</div>
                    <div className="mt-1 text-[11px] uppercase tracking-[0.12em] text-ink-5">{item.kind === "upload" ? "file" : item.kind}</div>
                  </div>
                  <button onClick={() => removeItem(item.id)} className="rounded p-1 text-ink-5 transition hover:bg-bg hover:text-red-200" aria-label={`Remove ${item.title}`}>
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))
            )}
          </div>

          <button
            onClick={handleStart}
            disabled={creating || items.length === 0}
            className="mt-4 w-full rounded-lg bg-cyan py-3 text-[13px] font-semibold text-[#06222C] transition hover:bg-cyan-bright disabled:cursor-not-allowed disabled:opacity-40"
          >
            {creating ? "Saving sources..." : existingProjectId ? "Save and refine again" : "Start refinement"}
          </button>
        </aside>
      </div>
    </div>
  );
}

function SourceIcon({ kind }) {
  const Icon = kind === "url" ? Globe2 : kind === "text" ? Type : UploadCloud;
  return (
    <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-cyan/20 bg-cyan/[0.06] text-cyan">
      <Icon className="h-4 w-4" />
    </div>
  );
}
