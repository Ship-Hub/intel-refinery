import React, {
  useEffect,
  useMemo,
  useState
} from "react";
import {
  BookOpenText,
  Braces,
  KeyRound,
  Workflow
} from "lucide-react";
import HudPanel from "./HudPanel";
import {
  api
} from "../lib/api";
import {
  developerSignals
} from "../data/siteData";

const quickStarts =
  [
    {
      title:
        "Authenticate",
      language:
        "bash",
      code:
        `curl -X POST "$API_BASE/api/chat" \\
  -H "x-api-key: intel_live_your_key" \\
  -H "Content-Type: application/json" \\
  -d '{"message":"Summarize this dispute"}'`
    },
    {
      title:
        "Ingest a conversation",
      language:
        "bash",
      code:
        `curl -X POST "$API_BASE/api/conversations/ingest" \\
  -H "x-api-key: intel_live_your_key" \\
  -H "Content-Type: application/json" \\
  -d '{
    "platform": "custom_crm",
    "conversationId": "ticket-123",
    "messages": [{
      "messageId": "1",
      "text": "Customer says the refund has not arrived.",
      "timestamp": "2026-05-16T10:00:00Z",
      "participant": { "username": "agent_42", "displayName": "Agent 42" }
    }]
  }'`
    },
    {
      title:
        "Analyze media",
      language:
        "bash",
      code:
        `curl -X POST "$API_BASE/api/media/image" \\
  -H "x-api-key: intel_live_your_key" \\
  -F "image=@screenshot.png"`
    }
  ];

const endpointGroups =
  [
    {
      label:
        "Public & Auth",
      match:
        (path) =>
          path ===
            "/" ||
          path.startsWith(
            "/health"
          ) ||
          path.startsWith(
            "/docs"
          ) ||
          path.startsWith(
            "/auth"
          )
    },
    {
      label:
        "Dashboard",
      match:
        (path) =>
          path.startsWith(
            "/dashboard"
          )
    },
    {
      label:
        "Conversation Intelligence",
      match:
        (path) =>
          path.startsWith(
            "/api/conversations"
          ) ||
          path ===
            "/api/chat"
    },
    {
      label:
        "Media & Evidence",
      match:
        (path) =>
          path.startsWith(
            "/api/media"
          ) ||
          path.startsWith(
            "/api/ocr"
          ) ||
          path.startsWith(
            "/api/evidence"
          ) ||
          path.startsWith(
            "/uploads"
          )
    },
    {
      label:
        "Signals & Operations",
      match:
        (path) =>
          path.startsWith(
            "/api/url"
          ) ||
          path.startsWith(
            "/api/entities"
          ) ||
          path.startsWith(
            "/api/moderator-audits"
          ) ||
          path.startsWith(
            "/api/conversation-settings"
          )
    },
    {
      label:
        "Billing & Webhooks",
      match:
        (path) =>
          path.startsWith(
            "/webhooks"
          ) ||
          path.startsWith(
            "/api/payments"
          )
    },
    {
      label:
        "Admin",
      match:
        (path) =>
          path.startsWith(
            "/api/admin"
          )
    }
  ];

export default function DeveloperSection({
  standalone =
    false
}) {
  const [docs, setDocs] =
    useState(
      null
    );
  const [error, setError] =
    useState(
      ""
    );

  useEffect(
    () => {
      api.docs()
        .then(
          setDocs
        )
        .catch(
          (requestError) =>
            setError(
              requestError.message
            )
        );
    },
    []
  );

  const groupedEndpoints =
    useMemo(
      () => {
        if (
          !docs?.endpoints
        ) {
          return [];
        }

        return endpointGroups.map(
          (group) => ({
            ...group,
            endpoints:
              docs.endpoints.filter(
                (endpoint) =>
                  group.match(
                    endpoint.path
                  )
              )
          })
        )
          .filter(
            (group) =>
              group.endpoints.length >
              0
          );
      },
      [
        docs
      ]
    );

  return (
    <section
      id="developer-api"
      className="section-shell"
    >
      <div className="border-y border-neon/15 py-8">
        <p className="section-kicker">
          Developer API
        </p>
        <h2 className="mt-4 max-w-4xl font-display text-3xl uppercase text-white sm:text-4xl">
          Build Against Intel Refinery
        </h2>
        <p className="mt-4 max-w-4xl font-body text-xl leading-8 text-chrome">
          Use REST endpoints for conversation intelligence, media analysis, customer-support auditing, dashboard operations, and billing flows. API traffic uses account-owned keys; dashboard traffic uses opaque user sessions.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          {developerSignals.map(
            (signal) => (
              <span
                key={signal}
                className="signal-pill"
              >
                {signal}
              </span>
            )
          )}
        </div>
      </div>

      {!standalone && (
        <div className="mt-8">
          <HudPanel className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="font-mono text-sm uppercase tracking-[0.18em] text-glow">
                Full reference
              </div>
              <p className="mt-3 max-w-3xl font-body text-xl leading-8 text-chrome">
                Browse every mounted endpoint, authentication rule, workflow, limit, and sample request on the dedicated docs page.
              </p>
            </div>
            <a
              href="/docs"
              className="hud-button shrink-0"
            >
              Open Docs
            </a>
          </HudPanel>
        </div>
      )}

      {standalone && (
        <>
      <div className="mt-8 grid gap-5 lg:grid-cols-3">
        <InfoPanel
          icon={
            KeyRound
          }
          title="Authentication"
        >
          <p>
            Product endpoints under <code>/api</code> require <code>x-api-key</code>. Dashboard endpoints use a bearer session token returned by Google or Telegram login. Admin endpoints require both <code>x-api-key</code> and <code>x-admin-token</code>.
          </p>
        </InfoPanel>
        <InfoPanel
          icon={
            Workflow
          }
          title="Core workflow"
        >
          <p>
            Ingest messages, queue an analysis session, then poll for results. Use image and audio endpoints when the conversation includes multimodal evidence.
          </p>
        </InfoPanel>
        <InfoPanel
          icon={
            Braces
          }
          title="Response style"
        >
          <p>
            JSON responses use a consistent envelope: <code>success</code>, <code>data</code>, <code>error</code>, and <code>meta</code>. Async analysis returns session identifiers for later polling.
          </p>
        </InfoPanel>
      </div>

      <div className="mt-8 grid gap-5 xl:grid-cols-3">
        {quickStarts.map(
          (example) => (
            <HudPanel
              key={example.title}
            >
              <div className="mb-4 font-mono text-sm uppercase tracking-[0.18em] text-glow">
                {example.title}
              </div>
              <pre className="overflow-x-auto whitespace-pre-wrap break-words border border-white/10 bg-black/30 p-4 font-mono text-sm leading-6 text-white">
                <code>
                  {example.code}
                </code>
              </pre>
            </HudPanel>
          )
        )}
      </div>

      {docs && (
        <>
          <div className="mt-8 grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
            <HudPanel>
              <div className="mb-4 flex items-center gap-3">
                <BookOpenText className="h-5 w-5 text-neon" />
                <div className="font-mono text-sm uppercase tracking-[0.18em] text-glow">
                  Workflows
                </div>
              </div>
              <DocList
                items={[
                  ...docs.workflows.conversationAnalysis,
                  ...docs.workflows.media
                ]}
              />
            </HudPanel>
            <HudPanel>
              <div className="font-mono text-sm uppercase tracking-[0.18em] text-glow">
                Limits
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {Object.entries(
                  docs.limits
                ).map(
                  ([
                    key,
                    value
                  ]) => (
                    <div
                      key={key}
                      className="border border-white/10 bg-white/[0.02] p-4"
                    >
                      <div className="font-mono text-xs uppercase tracking-[0.16em] text-chrome">
                        {formatLabel(
                          key
                        )}
                      </div>
                      <div className="mt-2 font-body text-lg text-white">
                        {String(
                          value
                        )}
                      </div>
                    </div>
                  )
                )}
              </div>
            </HudPanel>
          </div>

          <div className="mt-8 space-y-5">
            {groupedEndpoints.map(
              (group) => (
                <HudPanel
                  key={group.label}
                >
                  <div className="mb-5 font-mono text-sm uppercase tracking-[0.18em] text-glow">
                    {group.label}
                  </div>
                  <div className="space-y-3">
                    {group.endpoints.map(
                      (endpoint) => (
                        <EndpointRow
                          key={`${endpoint.method}-${endpoint.path}`}
                          endpoint={
                            endpoint
                          }
                        />
                      )
                    )}
                  </div>
                </HudPanel>
              )
            )}
          </div>
        </>
      )}

      {error && (
        <HudPanel className="mt-8">
          <div className="font-body text-lg text-red-100">
            Live API docs could not be loaded: {error}
          </div>
        </HudPanel>
      )}
        </>
      )}
    </section>
  );
}

function InfoPanel({
  icon: Icon,
  title,
  children
}) {
  return (
    <HudPanel>
      <div className="mb-4 flex items-center gap-3">
        <Icon className="h-5 w-5 text-neon" />
        <div className="font-mono text-sm uppercase tracking-[0.18em] text-glow">
          {title}
        </div>
      </div>
      <div className="font-body text-lg leading-7 text-chrome">
        {children}
      </div>
    </HudPanel>
  );
}

function EndpointRow({
  endpoint
}) {
  return (
    <div className="grid gap-3 border border-white/10 bg-white/[0.02] p-4 lg:grid-cols-[5rem_1fr_9rem_1.3fr]">
      <div className="font-mono text-sm uppercase text-neon">
        {endpoint.method}
      </div>
      <div className="break-all font-mono text-sm text-white">
        {endpoint.path}
      </div>
      <div className="font-mono text-xs uppercase tracking-[0.14em] text-chrome">
        {endpoint.auth}
      </div>
      <div className="font-body text-lg leading-7 text-chrome">
        {endpoint.description}
      </div>
    </div>
  );
}

function DocList({
  items
}) {
  return (
    <div className="space-y-3">
      {items.map(
        (item) => (
          <div
            key={item}
            className="border border-white/10 bg-white/[0.02] p-4 font-body text-lg leading-7 text-chrome"
          >
            {item}
          </div>
        )
      )}
    </div>
  );
}

function formatLabel(
  value
) {
  return value.replace(
    /([A-Z])/g,
    " $1"
  );
}
