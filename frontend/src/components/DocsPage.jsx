import React, {
  useEffect,
  useMemo,
  useState
} from "react";
import {
  ArrowRight,
  FlaskConical,
  KeyRound
} from "lucide-react";
import HudPanel from "./HudPanel";
import Logo from "./Logo";
import {
  api
} from "../lib/api";
import DeveloperSection from "./DeveloperSection";

export default function DocsPage() {
  const [docs, setDocs] =
    useState(
      null
    );

  useEffect(
    () => {
      api.docs()
        .then(
          setDocs
        );
    },
    []
  );

  return (
    <div className="min-h-screen bg-void text-white">
      <header className="border-b border-neon/15 bg-void/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-5 sm:px-6 lg:px-8">
          <a href="/">
            <Logo />
          </a>
          <a
            href="https://app.intelrefinery.site/signup"
            className="hud-button"
          >
            Create Key
            <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      </header>
      <main>
        <section className="section-shell pb-6">
          <p className="section-kicker">
            API Documentation
          </p>
          <h1 className="mt-4 max-w-5xl font-display text-4xl uppercase text-white sm:text-5xl">
            Intel Refinery Developer Reference
          </h1>
          <p className="mt-5 max-w-4xl font-body text-xl leading-8 text-chrome">
            Production endpoints, authentication rules, workflow guidance, and an in-browser playground for trying requests against your own API key.
          </p>
        </section>
        <Playground docs={docs} />
        <DeveloperSection standalone />
      </main>
    </div>
  );
}

function Playground({
  docs
}) {
  const endpointOptions =
    useMemo(
      () =>
        docs?.endpoints?.filter(
          (endpoint) =>
            endpoint.auth ===
              "api-key" ||
            endpoint.auth ===
              "public"
        ) ||
        [],
      [
        docs
      ]
    );
  const [selectedPath, setSelectedPath] =
    useState(
      "/api/chat"
    );
  const [apiKey, setApiKey] =
    useState(
      ""
    );
  const [body, setBody] =
    useState(
      '{"message":"Summarize this dispute"}'
    );
  const [result, setResult] =
    useState(
      ""
    );
  const [busy, setBusy] =
    useState(
      false
    );
  const selectedEndpoint =
    endpointOptions.find(
      (endpoint) =>
        endpoint.path ===
        selectedPath
    );

  const handleSubmit =
    async (
      event
    ) => {
      event.preventDefault();
      setBusy(
        true
      );
      setResult(
        ""
      );

      try {
        const response =
          await fetch(
            `${import.meta.env.VITE_API_BASE_URL || "http://localhost:5000"}${selectedPath}`,
            {
              method:
                selectedEndpoint?.method ||
                "POST",
              headers: {
                "Content-Type":
                  "application/json",
                ...(selectedEndpoint?.auth ===
                  "api-key"
                  ? {
                      "x-api-key":
                        apiKey
                    }
                  : {})
              },
              ...(selectedEndpoint?.method ===
                "POST" ||
              selectedEndpoint?.method ===
                "PUT"
                ? {
                    body
                  }
                : {})
            }
          );
        const payload =
          await response.json();
        setResult(
          JSON.stringify(
            payload,
            null,
            2
          )
        );
      } catch (error) {
        setResult(
          error.message
        );
      } finally {
        setBusy(
          false
        );
      }
    };

  return (
    <section className="section-shell pt-4">
      <HudPanel>
        <div className="mb-5 flex items-center gap-3">
          <FlaskConical className="h-5 w-5 text-neon" />
          <div className="font-mono text-sm uppercase tracking-[0.18em] text-glow">
            Playground
          </div>
        </div>
        <form
          className="grid gap-4 lg:grid-cols-[1fr_1fr]"
          onSubmit={handleSubmit}
        >
          <div className="space-y-4">
            <label className="block">
              <span className="mb-2 block font-mono text-xs uppercase tracking-[0.16em] text-chrome">
                Endpoint
              </span>
              <select
                value={selectedPath}
                onChange={(event) =>
                  setSelectedPath(
                    event.target.value
                  )
                }
                className="w-full border border-neon/25 bg-black/30 px-4 py-3 font-mono text-sm text-white outline-none focus:border-neon"
              >
                {endpointOptions.map(
                  (endpoint) => (
                    <option
                      key={`${endpoint.method}-${endpoint.path}`}
                      value={
                        endpoint.path
                      }
                    >
                      {endpoint.method}
                      {" "}
                      {endpoint.path}
                    </option>
                  )
                )}
              </select>
            </label>
            {selectedEndpoint?.auth ===
              "api-key" && (
              <label className="block">
                <span className="mb-2 flex items-center gap-2 font-mono text-xs uppercase tracking-[0.16em] text-chrome">
                  <KeyRound className="h-3.5 w-3.5" />
                  API Key
                </span>
                <input
                  value={apiKey}
                  onChange={(event) =>
                    setApiKey(
                      event.target.value
                    )
                  }
                  placeholder="intel_live_..."
                  className="w-full border border-neon/25 bg-black/30 px-4 py-3 font-mono text-sm text-white outline-none focus:border-neon"
                />
              </label>
            )}
            {(selectedEndpoint?.method ===
              "POST" ||
              selectedEndpoint?.method ===
                "PUT") && (
              <label className="block">
                <span className="mb-2 block font-mono text-xs uppercase tracking-[0.16em] text-chrome">
                  JSON body
                </span>
                <textarea
                  value={body}
                  onChange={(event) =>
                    setBody(
                      event.target.value
                    )
                  }
                  rows={8}
                  className="w-full border border-neon/25 bg-black/30 px-4 py-3 font-mono text-sm text-white outline-none focus:border-neon"
                />
              </label>
            )}
            <button
              type="submit"
              className="hud-button"
              disabled={
                busy
              }
            >
              {busy
                ? "Sending"
                : "Send Request"}
            </button>
          </div>
          <div>
            <div className="mb-2 font-mono text-xs uppercase tracking-[0.16em] text-chrome">
              Response
            </div>
            <pre className="min-h-[20rem] overflow-x-auto whitespace-pre-wrap break-words border border-white/10 bg-black/30 p-4 font-mono text-sm leading-6 text-white">
              <code>
                {result ||
                  "Run a request to inspect the JSON response here."}
              </code>
            </pre>
          </div>
        </form>
      </HudPanel>
    </section>
  );
}
