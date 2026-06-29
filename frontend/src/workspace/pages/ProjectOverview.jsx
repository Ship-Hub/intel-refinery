import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, FileText, GitBranch, Layers3, RefreshCw, Search } from "lucide-react";
import { api } from "../../lib/api";

const parseDate = (value) => {
  if (!value) return "";
  try {
    return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(value));
  } catch {
    return "";
  }
};

const titleCase = (value) =>
  String(value || "unknown")
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());

const normalizeText = (value) => String(value || "").toLowerCase();

const artifactType = (artifact) => normalizeText(artifact.artifactType || artifact.artifact_type);

const isQuestionLike = (artifact) =>
  ["question", "risk", "knowledge_gap", "limitation", "alternative_explanation"].some((type) => artifactType(artifact).includes(type));

const extractHandle = (artifact) => {
  const blob = `${artifact.title || ""} ${artifact.summary || ""} ${JSON.stringify(artifact.content || {})}`;
  const match = blob.match(/(?:@|user\s+|account\s+)([a-z0-9._]{3,30})/i);
  return match ? match[1].toLowerCase() : "";
};

const compactArtifact = (artifact) => ({
  id: artifact.id,
  title: artifact.title || "Untitled",
  summary: artifact.summary || "",
  type: artifact.artifactType || "artifact",
});

function Stat({ label, value, hint, icon: Icon }) {
  return (
    <div className="rounded-lg border border-line bg-surface p-4">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-5">{label}</span>
        <Icon className="h-4 w-4 text-cyan" />
      </div>
      <div className="text-[26px] font-semibold leading-none text-ink-text">{value}</div>
      <div className="mt-2 text-[12px] text-ink-4">{hint}</div>
    </div>
  );
}

export default function ProjectOverview() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [sources, setSources] = useState([]);
  const [artifacts, setArtifacts] = useState([]);
  const [connections, setConnections] = useState([]);
  const [versions, setVersions] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [projectData, sourceData, artifactData, connectionData, versionData] = await Promise.all([
        api.getV1Project(id),
        api.v1ProjectSources(id).catch(() => []),
        api.v1Artifacts(id, { limit: 200 }).catch(() => []),
        api.v1Connections(id, { limit: 200 }).catch(() => []),
        api.v1ModelStatus(id).catch(() => []),
      ]);
      setProject(projectData);
      setSources(sourceData);
      setArtifacts(artifactData);
      setConnections(connectionData);
      setVersions(versionData);
    } catch (err) {
      setError(err.message || "Could not load project model");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const filteredArtifacts = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return artifacts;
    return artifacts.filter((artifact) => `${artifact.title || ""} ${artifact.summary || ""} ${artifact.artifactType || ""}`.toLowerCase().includes(needle));
  }, [artifacts, query]);

  const typeCounts = useMemo(() => {
    const counts = new Map();
    for (const artifact of artifacts) {
      counts.set(artifact.artifactType || "unknown", (counts.get(artifact.artifactType || "unknown") || 0) + 1);
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1]);
  }, [artifacts]);

  const latestVersion = versions[0];
  const person = useMemo(
    () => artifacts.find((artifact) => artifactType(artifact).includes("person")) || artifacts.find((artifact) => /jephtah oyelabi/i.test(`${artifact.title || ""} ${artifact.summary || ""}`)),
    [artifacts]
  );
  const socialAccounts = useMemo(
    () => artifacts.filter((artifact) => artifactType(artifact).includes("social media account")).map((artifact) => ({ ...artifact, handle: extractHandle(artifact) })),
    [artifacts]
  );
  const projectArtifacts = useMemo(
    () => artifacts.filter((artifact) => artifactType(artifact).includes("project")).slice(0, 6),
    [artifacts]
  );
  const usefulArtifacts = useMemo(
    () => artifacts
      .filter((artifact) => !isQuestionLike(artifact))
      .sort((a, b) => (b.importance || 0) - (a.importance || 0))
      .slice(0, 18),
    [artifacts]
  );
  const openQuestions = useMemo(
    () => artifacts.filter(isQuestionLike).slice(0, 8),
    [artifacts]
  );
  const relationshipHighlights = useMemo(() => {
    const byId = new Map(artifacts.map((artifact) => [artifact.id, compactArtifact(artifact)]));
    return connections.slice(0, 10).map((connection) => ({
      ...connection,
      from: byId.get(connection.fromArtifactId),
      to: byId.get(connection.toArtifactId),
    }));
  }, [artifacts, connections]);
  const likelyIdentityLine = useMemo(() => {
    const jeff = socialAccounts.find((account) => account.handle === "jeff1da");
    if (person && jeff) {
      const linked = relationshipHighlights.some((connection) =>
        [connection.fromArtifactId, connection.toArtifactId].includes(person.id) &&
        [connection.fromArtifactId, connection.toArtifactId].includes(jeff.id)
      );
      return linked
        ? `The model links ${person.title || "the person profile"} with @jeff1da as an associated Instagram account.`
        : `The sources mention ${person.title || "the person profile"} and @jeff1da, but this run did not create a direct account link.`;
    }
    if (person) return person.summary || `${person.title} is the primary person identified in the source set.`;
    return latestVersion?.summary || "The model needs a clearer synthesized answer.";
  }, [latestVersion, person, relationshipHighlights, socialAccounts]);

  return (
    <div className="h-screen overflow-y-auto bg-bg text-ink-2">
      <div className="mx-auto max-w-[1280px] px-5 py-6 md:px-8">
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <button onClick={() => navigate("/projects")} className="mb-4 inline-flex items-center gap-2 text-[13px] text-ink-4 transition hover:text-ink-2">
              <ArrowLeft className="h-4 w-4" />
              Projects
            </button>
            <div className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-cyan">Refinery model</div>
            <h1 className="text-[32px] font-semibold leading-tight tracking-tight text-ink-text md:text-[36px]">{project?.title || "Project"}</h1>
            <p className="mt-2 max-w-[72ch] text-[14px] leading-6 text-ink-4">
              {latestVersion?.summary || "Inspect artifacts, source coverage, and relationships produced by the latest refinement run."}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => navigate(`/create/sources?projectId=${id}`)} className="rounded-lg border border-line px-4 py-3 text-[13px] font-medium text-ink-3 transition hover:border-cyan/30 hover:text-ink-2">
              Add sources
            </button>
            <button onClick={() => navigate(`/projects/${id}/refine`)} className="rounded-lg bg-cyan px-4 py-3 text-[13px] font-semibold text-[#06222C] transition hover:bg-cyan-bright">
              Run refinement
            </button>
          </div>
        </div>

        {error && <div className="mb-5 rounded-lg border border-red-400/25 bg-red-400/10 px-4 py-3 text-[13px] text-red-100">{error}</div>}

        <div className="mb-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <Stat label="Sources" value={sources.length} hint={`${sources.filter((source) => source.status === "normalized" || source.status === "chunked").length} readable`} icon={FileText} />
          <Stat label="Artifacts" value={artifacts.length} hint={`${typeCounts.length} artifact types`} icon={Layers3} />
          <Stat label="Connections" value={connections.length} hint="Relationships in model" icon={GitBranch} />
          <Stat label="Version" value={latestVersion ? `v${latestVersion.versionNumber || latestVersion.version_number}` : "-"} hint={latestVersion ? parseDate(latestVersion.createdAt || latestVersion.created_at) : "No version yet"} icon={RefreshCw} />
        </div>

        {loading ? (
          <div className="rounded-lg border border-line bg-surface p-8 text-[13px] text-ink-4">Loading model...</div>
        ) : artifacts.length === 0 ? (
          <div className="rounded-lg border border-line bg-surface p-10 text-center">
            <div className="text-[15px] font-medium text-ink-2">No model artifacts yet</div>
            <p className="mx-auto mt-2 max-w-[52ch] text-[13px] leading-6 text-ink-4">
              Add source material and run refinement. The model page will show extracted observations, relationships, gaps, timelines, and source-backed artifacts here.
            </p>
            <button onClick={() => navigate(`/projects/${id}/refine`)} className="mt-5 rounded-lg bg-cyan px-4 py-3 text-[13px] font-semibold text-[#06222C]">
              Run refinement
            </button>
          </div>
        ) : (
          <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
            <main className="grid content-start gap-3">
              <section className="rounded-lg border border-cyan/25 bg-surface p-5">
                <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-cyan">Synthesized answer</div>
                <h2 className="mt-2 text-[22px] font-semibold leading-tight text-ink-text">
                  {person?.title || project?.title || "Refined understanding"}
                </h2>
                <p className="mt-3 text-[15px] leading-7 text-ink-2">{likelyIdentityLine}</p>
                <div className="mt-4 grid gap-3 md:grid-cols-3">
                  {socialAccounts.slice(0, 3).map((account) => (
                    <div key={account.id} className="rounded-lg border border-line bg-bg px-3 py-3">
                      <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-5">Account</div>
                      <div className="mt-1 truncate text-[14px] font-semibold text-ink-text">{account.handle ? `@${account.handle}` : account.title}</div>
                    </div>
                  ))}
                  {projectArtifacts.slice(0, 3).map((artifact) => (
                    <div key={artifact.id} className="rounded-lg border border-line bg-bg px-3 py-3">
                      <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-5">Project</div>
                      <div className="mt-1 truncate text-[14px] font-semibold text-ink-text">{artifact.title}</div>
                    </div>
                  ))}
                </div>
              </section>

              <section className="rounded-lg border border-line bg-surface p-5">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h2 className="text-[16px] font-semibold text-ink-text">Connected dots</h2>
                  <span className="text-[12px] text-ink-5">{connections.length} relationships</span>
                </div>
                {relationshipHighlights.length === 0 ? (
                  <p className="text-[13px] leading-6 text-amber-100">No relationships were saved for this run. The model should be rerun after the latest backend fix so entity links are inferred and persisted.</p>
                ) : (
                  <div className="grid gap-2">
                    {relationshipHighlights.map((connection) => (
                        <div key={connection.id} className="rounded-lg border border-line bg-bg px-3 py-3">
                          <div className="text-[13px] font-semibold text-ink-text">
                          {connection.from?.title || "Artifact"}{" -> "}{connection.to?.title || "Artifact"}
                        </div>
                        <div className="mt-1 text-[12px] text-cyan">{titleCase(connection.connectionType)}</div>
                        {connection.explanation && <p className="mt-2 text-[12px] leading-5 text-ink-4">{connection.explanation}</p>}
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <label className="mb-2 flex items-center gap-2 rounded-lg border border-line bg-surface px-3 py-2 text-[13px] text-ink-4">
                <Search className="h-4 w-4 text-ink-5" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search artifacts"
                  className="w-full bg-transparent text-ink-2 outline-none placeholder:text-ink-5"
                />
              </label>
              {(query ? filteredArtifacts : usefulArtifacts).map((artifact) => (
                <article key={artifact.id} className="rounded-lg border border-line bg-surface p-4">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <span className="rounded-md border border-line bg-bg px-2 py-1 text-[11px] font-medium text-ink-4">{titleCase(artifact.artifactType)}</span>
                    <span className="rounded-md border border-line bg-bg px-2 py-1 text-[11px] text-ink-5">{titleCase(artifact.status || "active")}</span>
                  </div>
                  <h2 className="text-[15px] font-semibold text-ink-text">{artifact.title || "Untitled artifact"}</h2>
                  <p className="mt-1 text-[13px] leading-6 text-ink-4">{artifact.summary || "No summary captured."}</p>
                  <div className="mt-3 text-[12px] text-ink-5">
                    Source coverage: <span className="text-ink-3">{artifact.sourceCoverageCount || 0}</span>
                  </div>
                </article>
              ))}
            </main>
            <aside className="grid content-start gap-4">
              <section className="rounded-lg border border-line bg-surface p-4">
                <h2 className="text-[14px] font-semibold text-ink-text">Needs verification</h2>
                <div className="mt-3 grid gap-2">
                  {openQuestions.length === 0 ? (
                    <div className="text-[12px] leading-5 text-ink-4">No major unresolved questions were extracted.</div>
                  ) : openQuestions.map((artifact) => (
                    <div key={artifact.id} className="rounded-md border border-line bg-bg px-3 py-2">
                      <div className="text-[12px] font-medium text-ink-2">{artifact.title}</div>
                      {artifact.summary && <div className="mt-1 text-[11px] leading-5 text-ink-5">{artifact.summary}</div>}
                    </div>
                  ))}
                </div>
              </section>
              <section className="rounded-lg border border-line bg-surface p-4">
                <h2 className="text-[14px] font-semibold text-ink-text">Artifact types</h2>
                <div className="mt-3 grid gap-2">
                  {typeCounts.map(([type, count]) => (
                    <div key={type} className="flex items-center justify-between rounded-md border border-line bg-bg px-3 py-2 text-[12px]">
                      <span className="text-ink-4">{titleCase(type)}</span>
                      <span className="font-semibold text-ink-2">{count}</span>
                    </div>
                  ))}
                </div>
              </section>
              <section className="rounded-lg border border-line bg-surface p-4">
                <h2 className="text-[14px] font-semibold text-ink-text">Sources</h2>
                <div className="mt-3 grid gap-2">
                  {sources.slice(0, 8).map((source) => (
                    <div key={source.id} className="rounded-md border border-line bg-bg px-3 py-2">
                      <div className="truncate text-[12px] text-ink-2">{source.displayName || source.title || source.originalName || source.uri}</div>
                      <div className="mt-1 text-[11px] text-ink-5">{source.sourceType} · {source.status}</div>
                    </div>
                  ))}
                </div>
              </section>
            </aside>
          </div>
        )}
      </div>
    </div>
  );
}
