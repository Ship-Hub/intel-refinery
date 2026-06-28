import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../lib/api";

const INTENTS = [
  { value: "cyber_assessment", label: "Cyber assessment", note: "Broad posture review across reports, exports, notes, and advisories." },
  { value: "vulnerability_review", label: "Vulnerability review", note: "Prioritize scanner exports, advisories, asset inventories, and analyst context." },
  { value: "incident_review", label: "Incident review", note: "Connect logs, screenshots, timelines, affected assets, and response notes." },
  { value: "control_review", label: "Control review", note: "Map policies, control evidence, exceptions, and improvement actions." },
  { value: "threat_research", label: "Threat research", note: "Correlate threat intel, advisories, IOCs, incidents, and exposed assets." },
];

export default function CreateCyberProject() {
  const navigate = useNavigate();
  const [title, setTitle] = useState("Cyber Posture Review");
  const [description, setDescription] = useState("");
  const [intent, setIntent] = useState("cyber_assessment");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    setCreating(true);
    setError("");
    try {
      const project = await api.createV1Project({
        title,
        description: description || null,
        refineryProfile: "cyber",
        intent,
        mode: "deep",
        status: "collecting_sources",
      });
      navigate(`/cyber/projects/${project.id}/workspace`);
    } catch (err) {
      setError(err.message || "Could not create project");
      setCreating(false);
    }
  };

  return (
    <div className="min-h-screen overflow-y-auto bg-bg px-5 py-8 text-ink-2 md:px-10">
      <div className="mx-auto max-w-[980px]">
        <button
          onClick={() => navigate("/projects")}
          className="mb-8 flex items-center gap-2 text-[13px] text-ink-4 transition-colors hover:text-ink-2"
        >
          <span aria-hidden="true">&larr;</span>
          Projects
        </button>

        <div className="mb-8 max-w-[680px]">
          <div className="mb-3 inline-flex rounded-full border border-blue-400/20 bg-blue-400/10 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.16em] text-blue-200">
            Cyber Refinery
          </div>
          <h1 className="font-display text-[42px] font-light leading-none tracking-normal text-ink-text">
            Create a cyber project
          </h1>
          <p className="mt-4 max-w-[62ch] text-[15px] leading-6 text-ink-3">
            Assemble security reports, platform exports, advisories, logs, screenshots, asset data, and analyst notes before refinement.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
          <section className="rounded-lg border border-line bg-surface p-5">
            <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-4">
              Project name
            </label>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              required
              maxLength={500}
              className="mb-5 w-full rounded-lg border border-line bg-bg px-4 py-3 text-[15px] text-ink-text outline-none transition focus:border-blue-400/40"
            />

            <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-4">
              Description
            </label>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              maxLength={5000}
              rows={5}
              placeholder="Scope, business context, known systems, assessment goal..."
              className="w-full resize-none rounded-lg border border-line bg-bg px-4 py-3 text-[14px] leading-6 text-ink-2 outline-none transition placeholder:text-ink-5 focus:border-blue-400/40"
            />
          </section>

          <aside className="rounded-lg border border-line bg-surface p-4">
            <div className="mb-4 text-[12px] font-semibold uppercase tracking-[0.16em] text-ink-4">
              Intent
            </div>
            <div className="grid gap-2">
              {INTENTS.map((item) => (
                <label
                  key={item.value}
                  className={`cursor-pointer rounded-lg border p-3 transition ${
                    intent === item.value
                      ? "border-blue-400/40 bg-blue-400/10"
                      : "border-line bg-bg hover:border-blue-400/20"
                  }`}
                >
                  <input
                    type="radio"
                    name="intent"
                    value={item.value}
                    checked={intent === item.value}
                    onChange={(event) => setIntent(event.target.value)}
                    className="sr-only"
                  />
                  <span className="block text-[13px] font-medium text-ink-2">{item.label}</span>
                  <span className="mt-1 block text-[12px] leading-5 text-ink-4">{item.note}</span>
                </label>
              ))}
            </div>
          </aside>

          {error && (
            <div className="rounded-lg border border-red-400/25 bg-red-400/10 px-4 py-3 text-[13px] text-red-200 lg:col-span-2">
              {error}
            </div>
          )}

          <div className="flex justify-end lg:col-span-2">
            <button
              disabled={creating || !title.trim()}
              className="rounded-lg bg-blue-400 px-5 py-3 text-[13px] font-semibold text-bg transition hover:bg-blue-300 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {creating ? "Creating..." : "Create Cyber Project"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
