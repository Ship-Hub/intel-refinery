import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../../lib/api";

const CATEGORIES = [
  { value: "asset_inventory", label: "Asset inventory" },
  { value: "vulnerability_scan", label: "Vulnerability scan" },
  { value: "security_advisory", label: "Security advisory" },
  { value: "incident_report", label: "Incident report" },
  { value: "log_export", label: "Log export" },
  { value: "policy_control", label: "Policy or control" },
  { value: "analyst_notes", label: "Analyst notes" },
  { value: "screenshot", label: "Screenshot" },
  { value: "platform_export", label: "Platform export" },
  { value: "other", label: "Other" },
];

const INCLUSION_STATES = [
  { value: "included", label: "Included" },
  { value: "needs_review", label: "Needs review" },
  { value: "excluded", label: "Excluded" },
  { value: "duplicate", label: "Duplicate" },
  { value: "superseded", label: "Superseded" },
];

const SOURCE_TYPE_OPTIONS = [
  { value: "raw", label: "Paste information" },
  { value: "url", label: "Add URL" },
  { value: "upload", label: "Upload file" },
];

const categoryLabel = (value) => CATEGORIES.find((item) => item.value === value)?.label || "Uncategorized";

function ReadinessPanel({ readiness, loading }) {
  const score = readiness?.score || 0;
  return (
    <aside className="rounded-lg border border-line bg-surface p-5">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <div className="text-[12px] font-semibold uppercase tracking-[0.16em] text-ink-4">Refinement readiness</div>
          <div className="mt-1 text-[13px] text-ink-3">
            {loading ? "Checking coverage..." : readiness?.isReady ? "Ready to refine" : "Needs more source coverage"}
          </div>
        </div>
        <div className="grid h-20 w-20 place-items-center rounded-full border border-blue-400/30 bg-blue-400/10">
          <span className="text-[22px] font-semibold text-blue-200">{score}%</span>
        </div>
      </div>

      <div className="mb-4 h-2 overflow-hidden rounded-full bg-bg">
        <div className="h-full rounded-full bg-blue-400 transition-all" style={{ width: `${score}%` }} />
      </div>

      <dl className="mb-5 grid grid-cols-2 gap-2 text-[12px]">
        {[
          ["Total sources", readiness?.counts?.totalSources ?? 0],
          ["Ready", readiness?.counts?.readySources ?? 0],
          ["Pending", readiness?.counts?.pendingSources ?? 0],
          ["Categories", readiness?.counts?.categories ?? 0],
        ].map(([label, value]) => (
          <div key={label} className="rounded-lg border border-line bg-bg p-3">
            <dt className="text-ink-5">{label}</dt>
            <dd className="mt-1 text-[18px] font-semibold text-ink-2">{value}</dd>
          </div>
        ))}
      </dl>

      {readiness?.blockingIssues?.length > 0 && (
        <div className="mb-4">
          <div className="mb-2 text-[12px] font-medium text-red-200">Blocking</div>
          <ul className="grid gap-2">
            {readiness.blockingIssues.map((issue) => (
              <li key={issue} className="rounded-lg border border-red-400/20 bg-red-400/10 px-3 py-2 text-[12px] leading-5 text-red-100">
                {issue}
              </li>
            ))}
          </ul>
        </div>
      )}

      {readiness?.suggestions?.length > 0 && (
        <div>
          <div className="mb-2 text-[12px] font-medium text-blue-100">Suggestions</div>
          <ul className="grid gap-2">
            {readiness.suggestions.map((suggestion) => (
              <li key={suggestion} className="rounded-lg border border-blue-400/20 bg-blue-400/10 px-3 py-2 text-[12px] leading-5 text-blue-100">
                {suggestion}
              </li>
            ))}
          </ul>
        </div>
      )}
    </aside>
  );
}

function SourceRow({ source, onUpdate }) {
  const [saving, setSaving] = useState(false);

  const update = async (patch) => {
    setSaving(true);
    try {
      await onUpdate(source.id, patch);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid gap-3 rounded-lg border border-line bg-bg p-3 md:grid-cols-[minmax(0,1fr)_180px_150px_auto] md:items-center">
      <div className="min-w-0">
        <input
          defaultValue={source.displayName || source.title || source.originalName || source.uri || "Untitled source"}
          onBlur={(event) => {
            const value = event.target.value.trim();
            if (value && value !== source.displayName) update({ displayName: value });
          }}
          className="w-full rounded-md border border-transparent bg-transparent px-1 py-1 text-[13px] font-medium text-ink-2 outline-none transition focus:border-blue-400/30 focus:bg-surface"
        />
        <div className="mt-1 flex flex-wrap gap-2 text-[11px] text-ink-5">
          <span>{source.sourceType || "source"}</span>
          <span>{source.status || "pending"}</span>
          {source.uri && <span className="max-w-[260px] truncate">{source.uri}</span>}
        </div>
      </div>

      <select
        value={source.sourceCategory || "other"}
        disabled={saving}
        onChange={(event) => update({ sourceCategory: event.target.value })}
        className="rounded-lg border border-line bg-surface px-3 py-2 text-[12px] text-ink-2 outline-none focus:border-blue-400/40"
      >
        {CATEGORIES.map((category) => (
          <option key={category.value} value={category.value}>{category.label}</option>
        ))}
      </select>

      <select
        value={source.inclusionState || "included"}
        disabled={saving}
        onChange={(event) => update({ inclusionState: event.target.value })}
        className="rounded-lg border border-line bg-surface px-3 py-2 text-[12px] text-ink-2 outline-none focus:border-blue-400/40"
      >
        {INCLUSION_STATES.map((state) => (
          <option key={state.value} value={state.value}>{state.label}</option>
        ))}
      </select>

      <span className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${
        source.status === "failed"
          ? "bg-red-400/10 text-red-200"
          : source.status === "normalized" || source.status === "chunked"
            ? "bg-ok/10 text-green-200"
            : "bg-gold/10 text-yellow-100"
      }`}>
        {saving ? "Saving" : source.status || "pending"}
      </span>
    </div>
  );
}

export default function CyberProjectWorkspace() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [sources, setSources] = useState([]);
  const [packages, setPackages] = useState([]);
  const [readiness, setReadiness] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshingReadiness, setRefreshingReadiness] = useState(false);
  const [sourceMode, setSourceMode] = useState("raw");
  const [packageName, setPackageName] = useState("");
  const [selectedPackageId, setSelectedPackageId] = useState("");
  const [sourceCategory, setSourceCategory] = useState("analyst_notes");
  const [sourceTitle, setSourceTitle] = useState("");
  const [sourceText, setSourceText] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [sourceFile, setSourceFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [startingRun, setStartingRun] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [projectData, sourceData, packageData] = await Promise.all([
        api.getV1Project(id),
        api.v1ProjectSources(id),
        api.v1SourcePackages(id),
      ]);
      setProject(projectData);
      setSources(sourceData);
      setPackages(packageData);
      if ((projectData.profileKey || projectData.refineryProfile) === "cyber") {
        setRefreshingReadiness(true);
        const readinessData = await api.cyberReadiness(id);
        setReadiness(readinessData);
      }
    } catch (err) {
      setError(err.message || "Could not load project");
    } finally {
      setLoading(false);
      setRefreshingReadiness(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const groupedSources = useMemo(() => {
    return sources.reduce((groups, source) => {
      const key = source.sourceCategory || "other";
      groups[key] = groups[key] || [];
      groups[key].push(source);
      return groups;
    }, {});
  }, [sources]);

  const reloadReadiness = async () => {
    setRefreshingReadiness(true);
    try {
      const readinessData = await api.cyberReadiness(id);
      setReadiness(readinessData);
    } finally {
      setRefreshingReadiness(false);
    }
  };

  const handleCreatePackage = async () => {
    if (!packageName.trim()) return;
    const created = await api.createV1SourcePackage(id, {
      name: packageName.trim(),
      packageType: "manual_ingestion",
      sourceSystem: "workspace",
    });
    setPackages((items) => [created, ...items]);
    setSelectedPackageId(created.id);
    setPackageName("");
  };

  const handleAddSource = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const shared = {
        sourceCategory,
        sourcePackageId: selectedPackageId || null,
        title: sourceTitle || null,
        displayName: sourceTitle || null,
      };
      let created;
      if (sourceMode === "raw") {
        created = await api.createV1RawSource(id, {
          sourceType: "text",
          content: sourceText,
          ...shared,
        });
        setSourceText("");
      } else if (sourceMode === "url") {
        created = await api.createV1UrlSource(id, {
          sourceType: "url",
          uri: sourceUrl,
          ...shared,
        });
        setSourceUrl("");
      } else if (sourceFile) {
        const formData = new FormData();
        formData.append("source", sourceFile);
        formData.append("sourceCategory", sourceCategory);
        if (selectedPackageId) formData.append("sourcePackageId", selectedPackageId);
        if (sourceTitle) {
          formData.append("title", sourceTitle);
          formData.append("displayName", sourceTitle);
        }
        created = await api.uploadV1Source(id, formData);
        setSourceFile(null);
      }
      if (created) {
        setSources((items) => [created, ...items]);
        setSourceTitle("");
        await reloadReadiness();
      }
    } catch (err) {
      setError(err.message || "Could not add source");
    } finally {
      setSubmitting(false);
    }
  };

  const updateSource = async (sourceId, patch) => {
    const updated = await api.updateV1Source(id, sourceId, patch);
    setSources((items) => items.map((source) => source.id === sourceId ? { ...source, ...updated } : source));
    await reloadReadiness();
  };

  const startRefinement = async () => {
    setStartingRun(true);
    setError("");
    try {
      const run = await api.startV1Refinement(id);
      navigate(`/cyber/projects/${id}/refine?runId=${run.runId || run.id}`);
    } catch (err) {
      setError(err.message || "Could not start refinement");
      setStartingRun(false);
    }
  };

  const canSubmit =
    sourceMode === "raw"
      ? sourceText.trim()
      : sourceMode === "url"
        ? sourceUrl.trim()
        : sourceFile;

  return (
    <div className="h-screen overflow-y-auto bg-bg text-ink-2">
      <div className="mx-auto max-w-[1480px] px-5 py-6 md:px-8">
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <button
              onClick={() => navigate("/projects")}
              className="mb-4 text-[13px] text-ink-4 transition hover:text-ink-2"
            >
              &larr; Projects
            </button>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-blue-400/20 bg-blue-400/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-blue-200">
                Cyber Refinery
              </span>
              <span className="rounded-full border border-line px-3 py-1 text-[11px] text-ink-4">
                {project?.status || "draft"}
              </span>
            </div>
            <h1 className="mt-3 font-display text-[36px] font-light leading-tight tracking-normal text-ink-text">
              {project?.title || "Cyber project"}
            </h1>
            <p className="mt-2 max-w-[72ch] text-[14px] leading-6 text-ink-3">
              {project?.description || "Add source material, classify it, and use readiness to decide when the model has enough signal to refine."}
            </p>
          </div>
          <button
            disabled={!readiness?.isReady || startingRun}
            onClick={startRefinement}
            className="rounded-lg bg-blue-400 px-5 py-3 text-[13px] font-semibold text-bg transition hover:bg-blue-300 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {startingRun ? "Starting..." : "Start Refinement"}
          </button>
        </div>

        {error && (
          <div className="mb-5 rounded-lg border border-red-400/25 bg-red-400/10 px-4 py-3 text-[13px] text-red-100">
            {error}
          </div>
        )}

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
          <main className="grid gap-5">
            <section className="rounded-lg border border-line bg-surface p-5">
              <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-[16px] font-semibold text-ink-text">Add information</h2>
                  <p className="mt-1 text-[13px] text-ink-4">Create a package, then add notes, URLs, or files into the draft workspace.</p>
                </div>
                <div className="flex rounded-lg border border-line bg-bg p-1">
                  {SOURCE_TYPE_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setSourceMode(option.value)}
                      className={`rounded-md px-3 py-2 text-[12px] transition ${
                        sourceMode === option.value ? "bg-blue-400 text-bg" : "text-ink-4 hover:text-ink-2"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-4 grid gap-3 md:grid-cols-[minmax(0,1fr)_auto]">
                <input
                  value={packageName}
                  onChange={(event) => setPackageName(event.target.value)}
                  placeholder="New package name, for example June Tenable export"
                  className="rounded-lg border border-line bg-bg px-4 py-3 text-[13px] text-ink-2 outline-none placeholder:text-ink-5 focus:border-blue-400/40"
                />
                <button
                  type="button"
                  onClick={handleCreatePackage}
                  className="rounded-lg border border-blue-400/30 px-4 py-3 text-[13px] font-medium text-blue-100 transition hover:bg-blue-400/10"
                >
                  Create package
                </button>
              </div>

              <form onSubmit={handleAddSource} className="grid gap-3">
                <div className="grid gap-3 md:grid-cols-3">
                  <input
                    value={sourceTitle}
                    onChange={(event) => setSourceTitle(event.target.value)}
                    placeholder="Source title"
                    className="rounded-lg border border-line bg-bg px-4 py-3 text-[13px] text-ink-2 outline-none placeholder:text-ink-5 focus:border-blue-400/40"
                  />
                  <select
                    value={sourceCategory}
                    onChange={(event) => setSourceCategory(event.target.value)}
                    className="rounded-lg border border-line bg-bg px-4 py-3 text-[13px] text-ink-2 outline-none focus:border-blue-400/40"
                  >
                    {CATEGORIES.map((category) => (
                      <option key={category.value} value={category.value}>{category.label}</option>
                    ))}
                  </select>
                  <select
                    value={selectedPackageId}
                    onChange={(event) => setSelectedPackageId(event.target.value)}
                    className="rounded-lg border border-line bg-bg px-4 py-3 text-[13px] text-ink-2 outline-none focus:border-blue-400/40"
                  >
                    <option value="">No package</option>
                    {packages.map((pkg) => (
                      <option key={pkg.id} value={pkg.id}>{pkg.name}</option>
                    ))}
                  </select>
                </div>

                {sourceMode === "raw" && (
                  <textarea
                    value={sourceText}
                    onChange={(event) => setSourceText(event.target.value)}
                    rows={5}
                    placeholder="Paste analyst notes, ticket excerpts, policies, timelines, or findings..."
                    className="resize-none rounded-lg border border-line bg-bg px-4 py-3 text-[13px] leading-6 text-ink-2 outline-none placeholder:text-ink-5 focus:border-blue-400/40"
                  />
                )}
                {sourceMode === "url" && (
                  <input
                    value={sourceUrl}
                    onChange={(event) => setSourceUrl(event.target.value)}
                    placeholder="https://vendor.example/advisory/CVE-..."
                    className="rounded-lg border border-line bg-bg px-4 py-3 text-[13px] text-ink-2 outline-none placeholder:text-ink-5 focus:border-blue-400/40"
                  />
                )}
                {sourceMode === "upload" && (
                  <label className="flex cursor-pointer items-center justify-between gap-4 rounded-lg border border-dashed border-blue-400/25 bg-blue-400/5 px-4 py-5 text-[13px] text-ink-3">
                    <span>{sourceFile ? sourceFile.name : "Choose a PDF, image, text, CSV, or audio file"}</span>
                    <input
                      type="file"
                      className="sr-only"
                      onChange={(event) => setSourceFile(event.target.files?.[0] || null)}
                    />
                    <span className="rounded-md border border-blue-400/30 px-3 py-2 text-blue-100">Browse</span>
                  </label>
                )}

                <div className="flex justify-end">
                  <button
                    disabled={submitting || !canSubmit}
                    className="rounded-lg bg-blue-400 px-5 py-3 text-[13px] font-semibold text-bg transition hover:bg-blue-300 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {submitting ? "Adding..." : "Add Source"}
                  </button>
                </div>
              </form>
            </section>

            <section className="rounded-lg border border-line bg-surface p-5">
              <div className="mb-4 flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-[16px] font-semibold text-ink-text">Sources by category</h2>
                  <p className="mt-1 text-[13px] text-ink-4">{sources.length} sources in this draft workspace</p>
                </div>
                <button onClick={load} className="rounded-lg border border-line px-3 py-2 text-[12px] text-ink-3 transition hover:border-blue-400/30 hover:text-blue-100">
                  Refresh
                </button>
              </div>

              {loading ? (
                <div className="text-[13px] text-ink-4">Loading sources...</div>
              ) : sources.length === 0 ? (
                <div className="rounded-lg border border-line bg-bg p-8 text-center">
                  <div className="text-[14px] font-medium text-ink-2">Add your first source</div>
                  <div className="mt-1 text-[13px] text-ink-4">Readiness improves as you add varied, included source categories.</div>
                </div>
              ) : (
                <div className="grid gap-4">
                  {Object.entries(groupedSources).map(([category, rows]) => (
                    <div key={category} className="grid gap-2">
                      <div className="flex items-center justify-between rounded-lg bg-bg px-3 py-2">
                        <div className="text-[12px] font-semibold uppercase tracking-[0.14em] text-ink-3">
                          {categoryLabel(category)}
                        </div>
                        <div className="text-[12px] text-ink-5">{rows.length}</div>
                      </div>
                      {rows.map((source) => (
                        <SourceRow key={source.id} source={source} onUpdate={updateSource} />
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </section>
          </main>

          <div className="grid content-start gap-5">
            <ReadinessPanel readiness={readiness} loading={refreshingReadiness || loading} />
            <section className="rounded-lg border border-line bg-surface p-5">
              <div className="mb-3 text-[12px] font-semibold uppercase tracking-[0.16em] text-ink-4">Source packages</div>
              {packages.length === 0 ? (
                <p className="text-[13px] leading-6 text-ink-4">Packages group imports like scanner exports, incident bundles, or advisory sets.</p>
              ) : (
                <div className="grid gap-2">
                  {packages.map((pkg) => (
                    <button
                      key={pkg.id}
                      onClick={() => setSelectedPackageId(pkg.id)}
                      className={`rounded-lg border px-3 py-2 text-left text-[13px] transition ${
                        selectedPackageId === pkg.id ? "border-blue-400/40 bg-blue-400/10 text-blue-100" : "border-line bg-bg text-ink-3"
                      }`}
                    >
                      {pkg.name}
                    </button>
                  ))}
                </div>
              )}
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
