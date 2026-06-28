import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  Activity,
  AlertTriangle,
  Archive,
  CheckCircle2,
  ChevronRight,
  CircleDot,
  Clock3,
  FileText,
  Filter,
  GitBranch,
  History,
  Layers3,
  ListChecks,
  RefreshCw,
  Search,
  ShieldAlert,
  Target,
} from "lucide-react";
import { api } from "../../lib/api";

const FINDING_TYPES = ["finding", "vulnerability", "conflict"];
const ASSET_TYPES = ["asset"];
const ACTION_TYPES = ["action"];

const TABS = [
  { id: "overview", label: "Overview", icon: Activity },
  { id: "findings", label: "Findings", icon: ShieldAlert },
  { id: "assets", label: "Assets", icon: Layers3 },
  { id: "actions", label: "Actions", icon: ListChecks },
  { id: "versions", label: "Versions", icon: History },
];

const TYPE_LABELS = {
  finding: "Finding",
  vulnerability: "Vulnerability",
  conflict: "Conflict",
  asset: "Asset",
  action: "Action",
};

const getVersionNumber = (version) => version?.versionNumber ?? version?.version_number ?? null;
const getCreatedAt = (item) => item?.createdAt || item?.created_at || item?.runCreatedAt || item?.run_created_at || null;
const toDateMs = (value) => {
  const ms = value ? new Date(value).getTime() : 0;
  return Number.isFinite(ms) ? ms : 0;
};
const formatDate = (value) => {
  if (!value) return "Not recorded";
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
};
const titleCase = (value) =>
  String(value || "unknown")
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
const percent = (value) => {
  if (value === null || value === undefined) return "n/a";
  const number = Number(value);
  return Number.isFinite(number) ? `${Math.round(number * 100)}%` : "n/a";
};
const getContentValue = (artifact, keys) => {
  const sources = [artifact?.content, artifact?.metadata, artifact];
  for (const source of sources) {
    if (!source || typeof source !== "object") continue;
    for (const key of keys) {
      if (source[key] !== undefined && source[key] !== null && source[key] !== "") return source[key];
    }
  }
  return null;
};
const getSeverity = (artifact) => titleCase(getContentValue(artifact, ["severity", "risk", "impact"]) || "unknown");
const getPriority = (artifact) => titleCase(getContentValue(artifact, ["priority", "urgency"]) || "unranked");
const getExposure = (artifact) => titleCase(getContentValue(artifact, ["exposure", "exposureLevel", "internetExposure"]) || "unknown");
const includesSource = (artifact, sourceId) => {
  if (!sourceId) return true;
  const sourceIds = [
    artifact.firstSeenSourceId,
    artifact.first_seen_source_id,
    ...(Array.isArray(artifact.content?.sourceIds) ? artifact.content.sourceIds : []),
    ...(Array.isArray(artifact.metadata?.sourceIds) ? artifact.metadata.sourceIds : []),
  ].filter(Boolean);
  return sourceIds.includes(sourceId);
};

function StatCard({ label, value, hint, icon: Icon }) {
  return (
    <div className="rounded-lg border border-line bg-surface p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-5">{label}</span>
        <Icon className="h-4 w-4 text-blue-200" />
      </div>
      <div className="text-[28px] font-semibold leading-none text-ink-text">{value}</div>
      <div className="mt-2 text-[12px] text-ink-4">{hint}</div>
    </div>
  );
}

function FilterBar({ filters, setFilters, sources, showSeverity, showStatus, showSource, showSearch }) {
  const update = (key, value) => setFilters((current) => ({ ...current, [key]: value }));
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border border-line bg-bg p-2">
      <Filter className="ml-1 h-4 w-4 text-ink-5" />
      {showSearch && (
        <label className="flex min-w-[220px] flex-1 items-center gap-2 rounded-md border border-line bg-surface px-3 py-2 text-[12px] text-ink-3">
          <Search className="h-3.5 w-3.5 text-ink-5" />
          <input
            value={filters.search || ""}
            onChange={(event) => update("search", event.target.value)}
            placeholder="Search title or summary"
            className="w-full bg-transparent text-ink-2 outline-none placeholder:text-ink-5"
          />
        </label>
      )}
      {showSeverity && (
        <select value={filters.severity || ""} onChange={(event) => update("severity", event.target.value)} className="rounded-md border border-line bg-surface px-3 py-2 text-[12px] text-ink-2 outline-none">
          <option value="">Any severity</option>
          {["Critical", "High", "Medium", "Low", "Unknown"].map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
      )}
      {showStatus && (
        <select value={filters.status || ""} onChange={(event) => update("status", event.target.value)} className="rounded-md border border-line bg-surface px-3 py-2 text-[12px] text-ink-2 outline-none">
          <option value="">Any status</option>
          {["active", "open", "triaged", "resolved", "suppressed", "complete"].map((item) => <option key={item} value={item}>{titleCase(item)}</option>)}
        </select>
      )}
      {showSource && (
        <select value={filters.sourceId || ""} onChange={(event) => update("sourceId", event.target.value)} className="max-w-[240px] rounded-md border border-line bg-surface px-3 py-2 text-[12px] text-ink-2 outline-none">
          <option value="">Any source</option>
          {sources.map((source) => (
            <option key={source.id} value={source.id}>{source.displayName || source.title || source.originalName || source.uri || source.id}</option>
          ))}
        </select>
      )}
    </div>
  );
}

function ArtifactRow({ artifact, selected, onSelect, meta }) {
  const handleKeyDown = (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onSelect(artifact);
    }
  };

  return (
    <button
      onClick={() => onSelect(artifact)}
      onKeyDown={handleKeyDown}
      role="option"
      aria-selected={selected}
      tabIndex={0}
      className={`grid w-full gap-3 rounded-lg border p-4 text-left transition md:grid-cols-[minmax(0,1fr)_170px_auto] md:items-center ${
        selected ? "border-blue-400/45 bg-blue-400/10" : "border-line bg-surface hover:border-blue-400/25 hover:bg-elevated"
      }`}
    >
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-md border border-line bg-bg px-2 py-1 text-[11px] font-medium text-ink-4">{TYPE_LABELS[artifact.artifactType] || titleCase(artifact.artifactType)}</span>
          <span className="rounded-md border border-line bg-bg px-2 py-1 text-[11px] text-ink-5">{titleCase(artifact.status || "active")}</span>
        </div>
        <div className="mt-2 truncate text-[14px] font-semibold text-ink-text">{artifact.title || "Untitled artifact"}</div>
        <p className="mt-1 line-clamp-2 text-[12px] leading-5 text-ink-4">{artifact.summary || "No summary captured for this artifact."}</p>
      </div>
      <div className="grid grid-cols-2 gap-2 text-[11px] text-ink-4 md:grid-cols-1">
        {meta.map(([label, value]) => (
          <span key={label} className="rounded-md border border-line bg-bg px-2 py-1">
            {label}: <span className="text-ink-2">{value}</span>
          </span>
        ))}
      </div>
      <ChevronRight className="hidden h-4 w-4 text-ink-5 md:block" />
    </button>
  );
}

function DetailPanel({ artifact, detail, loading, sources }) {
  const source = sources.find((item) => item.id === (detail?.firstSeenSourceId || artifact?.firstSeenSourceId));
  const evidence = detail?.evidence || [];
  const connections = detail?.connections || [];
  const active = detail || artifact;

  if (!active) {
    return (
      <aside className="rounded-lg border border-line bg-surface p-5">
        <div className="text-[13px] text-ink-4">Select an item to inspect lineage, evidence, and linked model artifacts.</div>
      </aside>
    );
  }

  return (
    <aside className="rounded-lg border border-line bg-surface p-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-blue-200">{TYPE_LABELS[active.artifactType] || titleCase(active.artifactType)}</div>
          <h3 className="mt-2 text-[18px] font-semibold leading-tight text-ink-text">{active.title || "Untitled artifact"}</h3>
        </div>
        {loading && <RefreshCw className="h-4 w-4 animate-spin text-ink-5" />}
      </div>
      <p className="mb-4 text-[13px] leading-6 text-ink-3">{active.summary || "No summary captured."}</p>
      <dl className="mb-5 grid grid-cols-2 gap-2 text-[12px]">
        {[
          ["Confidence", percent(active.confidence)],
          ["Importance", percent(active.importance)],
          ["Status", titleCase(active.status || "active")],
          ["Sources", active.sourceCoverageCount || evidence.length || 0],
        ].map(([label, value]) => (
          <div key={label} className="rounded-lg border border-line bg-bg p-3">
            <dt className="text-ink-5">{label}</dt>
            <dd className="mt-1 font-medium text-ink-2">{value}</dd>
          </div>
        ))}
      </dl>
      <div className="grid gap-4">
        <section>
          <div className="mb-2 flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.14em] text-ink-4">
            <FileText className="h-3.5 w-3.5" /> Source lineage
          </div>
          <div className="rounded-lg border border-line bg-bg p-3 text-[12px] leading-5 text-ink-3">
            {source?.displayName || source?.title || source?.originalName || active.firstSeenSourceName || "No first source recorded"}
          </div>
        </section>
        <section>
          <div className="mb-2 flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.14em] text-ink-4">
            <Archive className="h-3.5 w-3.5" /> Evidence
          </div>
          {evidence.length === 0 ? (
            <div className="rounded-lg border border-line bg-bg p-3 text-[12px] text-ink-5">No evidence rows returned for this artifact yet.</div>
          ) : (
            <div className="grid gap-2">
              {evidence.slice(0, 4).map((item) => (
                <div key={item.id} className="rounded-lg border border-line bg-bg p-3 text-[12px] leading-5 text-ink-3">
                  <div className="mb-1 font-medium text-ink-2">{item.sourceName || "Source evidence"}</div>
                  {item.quote || "Evidence row has no quote text."}
                </div>
              ))}
            </div>
          )}
        </section>
        <section>
          <div className="mb-2 flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.14em] text-ink-4">
            <GitBranch className="h-3.5 w-3.5" /> Linked artifacts
          </div>
          {connections.length === 0 ? (
            <div className="rounded-lg border border-line bg-bg p-3 text-[12px] text-ink-5">No linked artifacts returned yet.</div>
          ) : (
            <div className="grid gap-2">
              {connections.slice(0, 5).map((item) => (
                <div key={item.id} className="rounded-lg border border-line bg-bg p-3 text-[12px] text-ink-3">
                  <div className="font-medium text-ink-2">{item.label || titleCase(item.connectionType)}</div>
                  <div className="mt-1 text-ink-5">{item.fromTitle} to {item.toTitle}</div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </aside>
  );
}

function Explorer({ title, description, artifacts, allArtifacts, sources, connections, filters, setFilters, selectedArtifact, onSelect, detail, detailLoading, mode }) {
  const rows = useMemo(() => {
    const search = (filters.search || "").toLowerCase();
    return artifacts.filter((artifact) => {
      const status = filters.status ? String(artifact.status || "").toLowerCase() === filters.status.toLowerCase() : true;
      const severity = filters.severity ? getSeverity(artifact).toLowerCase() === filters.severity.toLowerCase() : true;
      const source = includesSource(artifact, filters.sourceId);
      const text = `${artifact.title || ""} ${artifact.summary || ""}`.toLowerCase();
      return status && severity && source && (!search || text.includes(search));
    });
  }, [artifacts, filters]);

  const relatedCount = (artifact, types = []) => {
    const linkedIds = connections
      .filter((connection) => connection.fromArtifactId === artifact.id || connection.toArtifactId === artifact.id)
      .map((connection) => connection.fromArtifactId === artifact.id ? connection.toArtifactId : connection.fromArtifactId);
    if (types.length === 0) return linkedIds.length;
    return linkedIds.filter((linkedId) => allArtifacts.some((item) => item.id === linkedId && types.includes(item.artifactType))).length;
  };

  const metaFor = (artifact) => {
    if (mode === "asset") return [["Exposure", getExposure(artifact)], ["Linked findings", relatedCount(artifact, FINDING_TYPES)]];
    if (mode === "action") return [["Priority", getPriority(artifact)], ["Linked issues", relatedCount(artifact, FINDING_TYPES)]];
    return [["Severity", getSeverity(artifact)], ["Confidence", percent(artifact.confidence)]];
  };

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
      <main className="grid content-start gap-4">
        <div className="rounded-lg border border-line bg-surface p-5">
          <h2 className="text-[18px] font-semibold text-ink-text">{title}</h2>
          <p className="mt-1 text-[13px] leading-6 text-ink-4">{description}</p>
          <div className="mt-4">
            <FilterBar
              filters={filters}
              setFilters={setFilters}
              sources={sources}
              showSeverity={mode === "finding"}
              showStatus
              showSource
              showSearch
            />
          </div>
        </div>
        {rows.length === 0 ? (
          <div className="rounded-lg border border-line bg-surface p-10 text-center">
            <div className="text-[13px] text-ink-4">
              {filters.search || filters.severity || filters.status || filters.sourceId
                ? "No artifacts match the current filters. Try adjusting your search criteria."
                : `No ${title.toLowerCase()} have been identified yet. Run refinement to analyze your sources.`}
            </div>
            {(filters.search || filters.severity || filters.status || filters.sourceId) && (
              <button
                onClick={() => setFilters({})}
                className="mt-3 text-[12px] text-blue-200 hover:text-blue-100"
              >
                Clear all filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid gap-3">
            {rows.map((artifact) => (
              <ArtifactRow
                key={artifact.id}
                artifact={artifact}
                selected={selectedArtifact?.id === artifact.id}
                onSelect={onSelect}
                meta={metaFor(artifact)}
              />
            ))}
          </div>
        )}
      </main>
      <DetailPanel artifact={selectedArtifact} detail={detail} loading={detailLoading} sources={sources} />
    </div>
  );
}

export default function CyberProjectOverview() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tab, setTab] = useState("overview");
  const [project, setProject] = useState(null);
  const [sources, setSources] = useState([]);
  const [run, setRun] = useState(null);
  const [modelVersions, setModelVersions] = useState([]);
  const [artifacts, setArtifacts] = useState([]);
  const [connections, setConnections] = useState([]);
  const [selectedArtifact, setSelectedArtifact] = useState(null);
  const [artifactDetail, setArtifactDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [filters, setFilters] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [projectData, sourceData, runData, modelData, connectionData] = await Promise.all([
        api.getV1Project(id),
        api.v1ProjectSources(id),
        api.v1RunStatus(id).catch(() => null),
        api.v1ModelStatus(id).catch(() => []),
        api.v1Connections(id, { limit: 100 }).catch(() => []),
      ]);
      const artifactGroups = await Promise.all(
        [...FINDING_TYPES, ...ASSET_TYPES, ...ACTION_TYPES].map((type) =>
          api.v1Artifacts(id, { type, limit: 100 }).catch(() => [])
        )
      );
      setProject(projectData);
      setSources(sourceData);
      setRun(runData);
      setModelVersions(modelData);
      setConnections(connectionData);
      setArtifacts(artifactGroups.flat());
      setSelectedArtifact((current) => current || artifactGroups.flat()[0] || null);
    } catch (err) {
      setError(err.message || "Could not load Cyber model");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setFilters({});
  }, [tab]);

  useEffect(() => {
    if (!selectedArtifact?.id) {
      setArtifactDetail(null);
      return;
    }
    setDetailLoading(true);
    api.getV1Artifact(id, selectedArtifact.id)
      .then(setArtifactDetail)
      .catch(() => setArtifactDetail(null))
      .finally(() => setDetailLoading(false));
  }, [id, selectedArtifact]);

  const latestVersion = modelVersions[0] || null;
  const latestVersionDate = getCreatedAt(latestVersion);
  const newestSourceDate = sources.reduce((latest, source) => Math.max(latest, toDateMs(source.updatedAt || source.createdAt)), 0);
  const hasNewSources = newestSourceDate > toDateMs(latestVersionDate);
  const findings = artifacts.filter((artifact) => FINDING_TYPES.includes(artifact.artifactType));
  const assets = artifacts.filter((artifact) => ASSET_TYPES.includes(artifact.artifactType));
  const actions = artifacts.filter((artifact) => ACTION_TYPES.includes(artifact.artifactType));
  const activeRun = run?.status === "running" || run?.status === "queued";
  const completedRun = run?.status === "completed";
  const stats = [
    { label: "Model Version", value: latestVersion ? `v${getVersionNumber(latestVersion)}` : "-", hint: latestVersion ? formatDate(latestVersionDate) : "No version yet", icon: CircleDot },
    { label: "Sources", value: sources.length, hint: `${sources.filter((source) => source.inclusionState !== "excluded").length} included`, icon: FileText },
    { label: "Run Status", value: titleCase(run?.status || project?.status || "draft"), hint: run?.completedAt ? formatDate(run.completedAt) : "Latest run", icon: activeRun ? RefreshCw : CheckCircle2 },
    { label: "Artifacts", value: artifacts.length, hint: `${connections.length} links loaded`, icon: GitBranch },
  ];

  const topFindings = findings.slice().sort((a, b) => (b.importance || 0) - (a.importance || 0)).slice(0, 5);
  const topAssets = assets.slice().sort((a, b) => (b.sourceCoverageCount || 0) - (a.sourceCoverageCount || 0)).slice(0, 5);
  const topActions = actions.slice().sort((a, b) => (b.importance || 0) - (a.importance || 0)).slice(0, 5);
  const linkedCount = (artifact, candidateTypes = []) => {
    const linkedIds = connections
      .filter((connection) => connection.fromArtifactId === artifact.id || connection.toArtifactId === artifact.id)
      .map((connection) => connection.fromArtifactId === artifact.id ? connection.toArtifactId : connection.fromArtifactId);
    if (candidateTypes.length === 0) return linkedIds.length;
    return linkedIds.filter((linkedId) => artifacts.some((item) => item.id === linkedId && candidateTypes.includes(item.artifactType))).length;
  };

  const selectArtifact = (artifact) => {
    setSelectedArtifact(artifact);
    setArtifactDetail(null);
  };

  return (
    <div className="h-screen overflow-y-auto bg-bg text-ink-2">
      <div className="mx-auto max-w-[1480px] px-5 py-6 md:px-8">
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <button onClick={() => navigate("/projects")} className="mb-4 text-[13px] text-ink-4 transition hover:text-ink-2">
              &larr; Projects
            </button>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-blue-400/20 bg-blue-400/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-blue-200">Cyber Model</span>
              <span className="rounded-full border border-line px-3 py-1 text-[11px] text-ink-4">{project?.status || "draft"}</span>
            </div>
            <h1 className="mt-3 font-display text-[36px] font-light leading-tight tracking-normal text-ink-text">{project?.title || "Cyber project"}</h1>
            <p className="mt-2 max-w-[72ch] text-[14px] leading-6 text-ink-3">{project?.description || "Inspect the refined Cyber model, source lineage, and action surface produced by refinement."}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link to={`/cyber/projects/${id}/workspace`} className="rounded-lg border border-line px-4 py-3 text-[13px] text-ink-3 transition hover:border-blue-400/30 hover:text-blue-100">
              Manage Sources
            </Link>
            <button onClick={() => navigate(`/cyber/projects/${id}/refine`)} className="rounded-lg bg-blue-400 px-4 py-3 text-[13px] font-semibold text-bg transition hover:bg-blue-300">
              Run Refinement
            </button>
          </div>
        </div>

        {error && <div className="mb-5 rounded-lg border border-red-400/25 bg-red-400/10 px-4 py-3 text-[13px] text-red-100">{error}</div>}
        {hasNewSources && (
          <div className="mb-5 flex flex-col gap-3 rounded-lg border border-yellow-300/25 bg-yellow-300/10 px-4 py-3 text-[13px] text-yellow-100 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-2"><AlertTriangle className="h-4 w-4" /> New or updated sources exist after the latest model version.</div>
            <button onClick={() => navigate(`/cyber/projects/${id}/refine`)} className="rounded-md border border-yellow-200/30 px-3 py-2 text-[12px] font-medium">Refine again</button>
          </div>
        )}

        <div className="mb-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => <StatCard key={stat.label} {...stat} />)}
        </div>

        <div className="mb-5 flex flex-wrap gap-2 rounded-lg border border-line bg-surface p-2" role="tablist">
          {TABS.map(({ id: tabId, label, icon: Icon }) => (
            <button
              key={tabId}
              onClick={() => setTab(tabId)}
              role="tab"
              aria-selected={tab === tabId}
              aria-controls={`panel-${tabId}`}
              tabIndex={tab === tabId ? 0 : -1}
              onKeyDown={(e) => {
                const tabs = TABS.map((t) => t.id);
                const currentIndex = tabs.indexOf(tab);
                if (e.key === "ArrowRight") {
                  e.preventDefault();
                  setTab(tabs[(currentIndex + 1) % tabs.length]);
                } else if (e.key === "ArrowLeft") {
                  e.preventDefault();
                  setTab(tabs[(currentIndex - 1 + tabs.length) % tabs.length]);
                }
              }}
              className={`inline-flex items-center gap-2 rounded-md px-3 py-2 text-[12px] font-medium transition ${
                tab === tabId ? "bg-blue-400 text-bg" : "text-ink-4 hover:bg-bg hover:text-ink-2"
              }`}
            >
              <Icon className="h-4 w-4" /> {label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="grid gap-4" role="tabpanel" id="panel-loading" aria-label="Loading content">
            <div className="rounded-lg border border-line bg-surface p-5">
              <div className="h-6 w-48 animate-pulse rounded bg-bg" />
              <div className="mt-3 h-4 w-96 animate-pulse rounded bg-bg" />
              <div className="mt-4 flex gap-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-10 w-32 animate-pulse rounded-md bg-bg" />
                ))}
              </div>
            </div>
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-lg border border-line bg-surface p-4">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 animate-pulse rounded bg-bg" />
                  <div className="flex-1">
                    <div className="h-5 w-64 animate-pulse rounded bg-bg" />
                    <div className="mt-2 h-4 w-96 animate-pulse rounded bg-bg" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : tab === "overview" ? (
          <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px]" role="tabpanel" id="panel-overview" aria-label="Overview panel">
            <main className="grid gap-5">
              <section className="rounded-lg border border-line bg-surface p-5">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-[18px] font-semibold text-ink-text">Refined model overview</h2>
                    <p className="mt-1 text-[13px] text-ink-4">Top findings, assets, and actions from the latest Cyber refinement.</p>
                  </div>
                  {completedRun && <span className="rounded-full border border-green-300/25 bg-green-300/10 px-3 py-1 text-[11px] text-green-100">Run complete</span>}
                </div>
                <div className="grid gap-4 lg:grid-cols-3">
                  {[
                    ["Top Findings", topFindings, ShieldAlert, (item) => getSeverity(item)],
                    ["Top Assets", topAssets, Target, (item) => `${getExposure(item)} exposure · ${linkedCount(item, FINDING_TYPES)} findings`],
                    ["Top Actions", topActions, ListChecks, (item) => `${getPriority(item)} · ${linkedCount(item, FINDING_TYPES)} linked issues`],
                  ].map(([label, rows, Icon, chip]) => (
                    <div key={label} className="rounded-lg border border-line bg-bg p-4">
                      <div className="mb-3 flex items-center gap-2 text-[13px] font-semibold text-ink-text"><Icon className="h-4 w-4 text-blue-200" /> {label}</div>
                      {rows.length === 0 ? (
                        <div className="text-[12px] text-ink-5">No artifacts yet.</div>
                      ) : (
                        <div className="grid gap-2">
                          {rows.map((item) => (
                            <button key={item.id} onClick={() => selectArtifact(item)} className="rounded-md border border-line bg-surface p-3 text-left transition hover:border-blue-400/30">
                              <div className="truncate text-[13px] font-medium text-ink-2">{item.title}</div>
                              <div className="mt-1 text-[11px] text-ink-5">{chip(item)} · {percent(item.confidence)}</div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </section>
              <section className="rounded-lg border border-line bg-surface p-5">
                <div className="mb-4 flex items-center gap-2 text-[14px] font-semibold text-ink-text"><Clock3 className="h-4 w-4 text-blue-200" /> Artifact counts</div>
                <div className="grid gap-2 md:grid-cols-3 lg:grid-cols-6">
                  {["finding", "vulnerability", "conflict", "asset", "action"].map((type) => (
                    <div key={type} className="rounded-lg border border-line bg-bg p-3">
                      <div className="text-[11px] uppercase tracking-[0.14em] text-ink-5">{TYPE_LABELS[type]}</div>
                      <div className="mt-2 text-[24px] font-semibold text-ink-text">{artifacts.filter((item) => item.artifactType === type).length}</div>
                    </div>
                  ))}
                </div>
              </section>
            </main>
            <DetailPanel artifact={selectedArtifact} detail={artifactDetail} loading={detailLoading} sources={sources} />
          </div>
        ) : tab === "findings" ? (
          <div role="tabpanel" id="panel-findings" aria-label="Findings panel">
            <Explorer title="Findings explorer" description="Review findings, vulnerabilities, and conflicts with severity, status, source, and project context filters." artifacts={findings} allArtifacts={artifacts} sources={sources} connections={connections} filters={filters} setFilters={setFilters} selectedArtifact={selectedArtifact} onSelect={selectArtifact} detail={artifactDetail} detailLoading={detailLoading} mode="finding" />
          </div>
        ) : tab === "assets" ? (
          <div role="tabpanel" id="panel-assets" aria-label="Assets panel">
            <Explorer title="Assets explorer" description="Inspect assets with exposure, related signals, finding counts, and traceability back to source material." artifacts={assets} allArtifacts={artifacts} sources={sources} connections={connections} filters={filters} setFilters={setFilters} selectedArtifact={selectedArtifact} onSelect={selectArtifact} detail={artifactDetail} detailLoading={detailLoading} mode="asset" />
          </div>
        ) : tab === "actions" ? (
          <div role="tabpanel" id="panel-actions" aria-label="Actions panel">
            <Explorer title="Actions explorer" description="Prioritize recommended actions by urgency, linked findings/assets, status, and supporting evidence." artifacts={actions} allArtifacts={artifacts} sources={sources} connections={connections} filters={filters} setFilters={setFilters} selectedArtifact={selectedArtifact} onSelect={selectArtifact} detail={artifactDetail} detailLoading={detailLoading} mode="action" />
          </div>
        ) : (
          <div role="tabpanel" id="panel-versions" aria-label="Versions panel">
            <section className="rounded-lg border border-line bg-surface p-5">
            <h2 className="text-[18px] font-semibold text-ink-text">Versions and model history</h2>
            <p className="mt-1 text-[13px] text-ink-4">Each refinement run can produce a frozen model version for comparison and audit.</p>
            <div className="mt-5 grid gap-3">
              {modelVersions.length === 0 ? (
                <div className="rounded-lg border border-line bg-bg p-8 text-center text-[13px] text-ink-4">No model versions have been produced yet.</div>
              ) : modelVersions.map((version) => (
                <div key={version.versionId || version.id} className="grid gap-3 rounded-lg border border-line bg-bg p-4 md:grid-cols-[auto_minmax(0,1fr)_220px] md:items-center">
                  <div className="grid h-12 w-12 place-items-center rounded-lg border border-blue-400/25 bg-blue-400/10 text-[14px] font-semibold text-blue-100">v{getVersionNumber(version)}</div>
                  <div className="min-w-0">
                    <div className="text-[14px] font-semibold text-ink-text">{version.summary || `Model version ${getVersionNumber(version)}`}</div>
                    <div className="mt-1 text-[12px] text-ink-5">Run {version.runId || version.run_id || "unknown"} · {titleCase(version.status || "active")}</div>
                  </div>
                  <div className="flex flex-wrap gap-2 text-[11px] text-ink-4">
                    <span className="rounded-md border border-line bg-surface px-2 py-1">{formatDate(getCreatedAt(version))}</span>
                    <span className="rounded-md border border-line bg-surface px-2 py-1">{version.durationMs || version.duration_ms || 0} ms</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
          </div>
        )}
      </div>
    </div>
  );
}
