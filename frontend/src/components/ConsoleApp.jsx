import React, {
  useEffect,
  useState
} from "react";
import {
  Check,
  Copy,
  CreditCard,
  KeyRound,
  LogOut,
  Trash2,
  UserRound,
  Waves,
  XCircle
} from "lucide-react";
import {
  api,
  clearSessionToken,
  getStoredSessionToken,
  storeSessionToken
} from "../lib/api";
import AuthPanel from "./AuthPanel";
import HudPanel from "./HudPanel";
import Logo from "./Logo";

const tabs =
  [
    {
      id:
        "overview",
      label:
        "Overview",
      icon:
        UserRound
    },
    {
      id:
        "keys",
      label:
        "API Keys",
      icon:
        KeyRound
    },
    {
      id:
        "usage",
      label:
        "Usage",
      icon:
        Waves
    },
    {
      id:
        "billing",
      label:
        "Billing",
      icon:
        CreditCard
    }
  ];

export default function ConsoleApp() {
  const [authenticated, setAuthenticated] =
    useState(
      Boolean(
        getStoredSessionToken()
      )
    );
  const [activeTab, setActiveTab] =
    useState(
      "overview"
    );
  const [loading, setLoading] =
    useState(
      false
    );
  const [error, setError] =
    useState(
      ""
    );
  const [data, setData] =
    useState({
      me:
        null,
      account:
        null,
      keys:
        [],
      usage:
        [],
      payments:
        []
    });
  const [revealedApiKey, setRevealedApiKey] =
    useState(
      null
    );

  // Handle OAuth redirect-back: /console?token=sess_xxx  OR  /console?error=...
  useEffect(
    () => {
      const params =
        new URLSearchParams(
          window.location.search
        );
      const oauthToken =
        params.get("token");
      const oauthError =
        params.get("error");

      if (oauthToken) {
        storeSessionToken(
          oauthToken
        );
        // Strip query string so the URL looks clean
        window.history.replaceState(
          {},
          "",
          window.location.pathname
        );
        setAuthenticated(true);
      } else if (oauthError) {
        setError(
          `Sign-in failed: ${decodeURIComponent(oauthError)}`
        );
        window.history.replaceState(
          {},
          "",
          window.location.pathname
        );
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const refresh =
    async () => {
      setLoading(
        true
      );
      setError(
        ""
      );

      try {
        const [
          me,
          account,
          keys,
          usage,
          payments
        ] =
          await Promise.all([
            api.me(),
            api.account(),
            api.apiKeys(),
            api.usage(),
            api.payments()
          ]);
        setData({
          me,
          account,
          keys,
          usage,
          payments
        });
      } catch (requestError) {
        clearSessionToken();
        setAuthenticated(
          false
        );
        setError(
          requestError.message
        );
      } finally {
        setLoading(
          false
        );
      }
    };

  useEffect(
    () => {
      if (
        authenticated
      ) {
        refresh();
      }
    },
    [
      authenticated
    ]
  );

  const handleLogout =
    async () => {
      try {
        await api.logout();
      } catch {
        // Local token clearing still ends the session from this client.
      }
      clearSessionToken();
      setAuthenticated(
        false
      );
    };

  if (
    !authenticated
  ) {
    return (
      <ConsoleShell>
        <div className="section-shell pt-10">
          <AuthPanel
            onAuthenticated={() =>
              setAuthenticated(
                true
              )
            }
          />
          {error && (
            <div className="mx-auto mt-4 max-w-xl font-body text-base text-red-100">
              {error}
            </div>
          )}
        </div>
      </ConsoleShell>
    );
  }

  return (
    <ConsoleShell
      onLogout={handleLogout}
    >
      <div className="section-shell grid gap-5 lg:grid-cols-[15rem_1fr]">
        <aside className="space-y-2">
          {tabs.map(
            ({
              id,
              label,
              icon: Icon
            }) => (
              <button
                key={id}
                type="button"
                className={`flex w-full items-center gap-3 border px-4 py-3 font-mono text-sm uppercase tracking-[0.16em] transition ${
                  activeTab ===
                  id
                    ? "border-neon bg-neon/15 text-white"
                    : "border-white/10 bg-white/[0.02] text-chrome hover:border-neon/40 hover:text-white"
                }`}
                onClick={() =>
                  setActiveTab(
                    id
                  )
                }
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            )
          )}
        </aside>
        <div className="space-y-5">
          {loading && (
            <HudPanel>
              <div className="font-mono text-sm uppercase tracking-[0.18em] text-glow">
                Loading account data
              </div>
            </HudPanel>
          )}
          {!loading &&
            activeTab ===
              "overview" && (
              <Overview
                data={data}
              />
            )}
          {!loading &&
            activeTab ===
              "keys" && (
              <ApiKeys
                keys={data.keys}
                onCreated={
                  refresh
                }
                revealedApiKey={
                  revealedApiKey
                }
                onReveal={
                  setRevealedApiKey
                }
              />
            )}
          {!loading &&
            activeTab ===
              "usage" && (
              <Usage
                usage={data.usage}
              />
            )}
          {!loading &&
            activeTab ===
              "billing" && (
              <Billing
                payments={
                  data.payments
                }
              />
            )}
        </div>
      </div>
    </ConsoleShell>
  );
}

function ConsoleShell({
  children,
  onLogout
}) {
  return (
    <div className="min-h-screen bg-void text-white">
      <header className="border-b border-neon/15 bg-void/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-5 sm:px-6 lg:px-8">
          <Logo />
          {onLogout && (
            <button
              type="button"
              className="hud-button-secondary"
              onClick={
                onLogout
              }
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          )}
        </div>
      </header>
      {children}
    </div>
  );
}

function Overview({
  data
}) {
  return (
    <>
      <HudPanel>
        <div className="font-mono text-sm uppercase tracking-[0.18em] text-glow">
          Account
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <Metric
            label="Organization"
            value={
              data.account?.name ||
              "-"
            }
          />
          <Metric
            label="Credits"
            value={
              data.account?.creditBalance ??
              0
            }
          />
          <Metric
            label="Role"
            value={
              data.account?.role ||
              "-"
            }
          />
        </div>
      </HudPanel>
      <HudPanel>
        <div className="font-mono text-sm uppercase tracking-[0.18em] text-glow">
          Signed In
        </div>
        <div className="mt-4 font-body text-lg text-chrome">
          {data.me?.user?.displayName}
          {data.me?.user?.email
            ? ` / ${data.me.user.email}`
            : ""}
        </div>
      </HudPanel>
    </>
  );
}

function ApiKeys({
  keys,
  onCreated,
  revealedApiKey,
  onReveal
}) {
  const [label, setLabel] =
    useState("");
  const [error, setError] =
    useState("");
  const [copied, setCopied] =
    useState(
      false
    );
  const [pendingKeyId, setPendingKeyId] =
    useState(
      null
    );

  const handleCreate =
    async (
      event
    ) => {
      event.preventDefault();
      setError(
        ""
      );

      try {
        const created =
          await api.createApiKey(
            label
          );
        onReveal(
          created
        );
        setCopied(
          false
        );
        setLabel(
          ""
        );
        await onCreated();
      } catch (requestError) {
        setError(
          requestError.message
        );
      }
    };

  const handleCopy =
    async () => {
      if (
        !revealedApiKey
      ) {
        return;
      }

      await navigator.clipboard.writeText(
        revealedApiKey.rawKey
      );
      setCopied(
      true
    );
  };

  const handleRevoke =
    async (
      apiKeyId
    ) => {
      setPendingKeyId(
        apiKeyId
      );
      setError(
        ""
      );

      try {
        await api.revokeApiKey(
          apiKeyId
        );
        await onCreated();
      } catch (requestError) {
        setError(
          requestError.message
        );
      } finally {
        setPendingKeyId(
          null
        );
      }
    };

  const handleDelete =
    async (
      key
    ) => {
      const confirmed =
        window.confirm(
          `Delete API key "${key.label}" permanently?`
        );

      if (
        !confirmed
      ) {
        return;
      }

      setPendingKeyId(
        key.id
      );
      setError(
        ""
      );

      try {
        await api.deleteApiKey(
          key.id
        );
        await onCreated();
      } catch (requestError) {
        setError(
          requestError.message
        );
      } finally {
        setPendingKeyId(
          null
        );
      }
    };

  return (
    <>
      <HudPanel>
        <div className="font-mono text-sm uppercase tracking-[0.18em] text-glow">
          Create API Key
        </div>
        <form
          className="mt-4 flex flex-col gap-3 sm:flex-row"
          onSubmit={handleCreate}
        >
          <input
            value={label}
            onChange={(event) =>
              setLabel(
                event.target.value
              )
            }
            placeholder="Production"
            className="min-w-0 flex-1 border border-neon/25 bg-black/30 px-4 py-3 font-body text-lg text-white outline-none focus:border-neon"
          />
          <button
            type="submit"
            className="hud-button"
            disabled={
              !label.trim()
            }
          >
            Generate
          </button>
        </form>
        {error && (
          <div className="mt-4 font-body text-base text-red-100">
            {error}
          </div>
        )}
        {revealedApiKey && (
          <div className="mt-4 border border-neon/20 bg-white/[0.02] p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="font-mono text-sm uppercase tracking-[0.16em] text-glow">
                  Raw key shown once
                </div>
                <div className="mt-2 break-all font-mono text-sm text-white">
                  {revealedApiKey.rawKey}
                </div>
              </div>
              <button
                type="button"
                className="hud-button-secondary shrink-0"
                onClick={handleCopy}
              >
                {copied
                  ? (
                    <>
                      <Check className="h-4 w-4" />
                      Copied
                    </>
                  )
                  : (
                    <>
                      <Copy className="h-4 w-4" />
                      Copy key
                    </>
                  )}
              </button>
            </div>
            <div className="mt-3 font-body text-base text-chrome">
              Save this key now. For security, only its prefix will be shown later.
            </div>
          </div>
        )}
      </HudPanel>
      <HudPanel>
        <div className="font-mono text-sm uppercase tracking-[0.18em] text-glow">
          Active Keys
        </div>
        <div className="mt-4 space-y-3">
          {keys.length ===
          0 ? (
            <EmptyState text="No API keys yet." />
          ) : (
            keys.map(
              (key) => (
                <div
                  key={key.id}
                  className="grid gap-3 border border-white/10 bg-white/[0.02] p-4 md:grid-cols-[1fr_1fr_0.8fr_0.8fr_auto]"
                >
                  <div>
                    {key.label}
                  </div>
                  <div className="font-mono text-chrome">
                    {key.keyPrefix}
                  </div>
                  <div className="text-chrome">
                    {key.requestsCount}
                    {" "}
                    requests
                  </div>
                  <div className="text-chrome">
                    {key.isActive
                      ? "Active"
                      : "Revoked"}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      className="hud-button-secondary px-3 py-2"
                      disabled={
                        !key.isActive ||
                        pendingKeyId ===
                          key.id
                      }
                      onClick={() =>
                        handleRevoke(
                          key.id
                        )
                      }
                    >
                      <XCircle className="h-4 w-4" />
                      Revoke
                    </button>
                    <button
                      type="button"
                      className="hud-button-secondary px-3 py-2"
                      disabled={
                        pendingKeyId ===
                        key.id
                      }
                      onClick={() =>
                        handleDelete(
                          key
                        )
                      }
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </button>
                  </div>
                </div>
              )
            )
          )}
        </div>
      </HudPanel>
    </>
  );
}

function Usage({
  usage
}) {
  return (
    <HudPanel>
      <div className="font-mono text-sm uppercase tracking-[0.18em] text-glow">
        Recent Usage
      </div>
      <div className="mt-4 space-y-3">
        {usage.length ===
        0 ? (
          <EmptyState text="No usage recorded yet." />
        ) : (
          usage.map(
            (event) => (
              <div
                key={event.id}
                className="grid gap-2 border border-white/10 bg-white/[0.02] p-4 md:grid-cols-4"
              >
                <div>
                  {event.featureType}
                </div>
                <div className="text-chrome">
                  {event.creditsCharged}
                  {" "}
                  credits
                </div>
                <div className="text-chrome">
                  {event.provider ||
                    "-"}
                </div>
                <div className="text-chrome">
                  {event.model ||
                    "-"}
                </div>
              </div>
            )
          )
        )}
      </div>
    </HudPanel>
  );
}

function Billing({
  payments
}) {
  return (
    <HudPanel>
      <div className="font-mono text-sm uppercase tracking-[0.18em] text-glow">
        Payments
      </div>
      <div className="mt-4 space-y-3">
        {payments.length ===
        0 ? (
          <EmptyState text="No payments yet." />
        ) : (
          payments.map(
            (payment) => (
              <div
                key={payment.id}
                className="grid gap-2 border border-white/10 bg-white/[0.02] p-4 md:grid-cols-4"
              >
                <div>
                  {payment.provider}
                </div>
                <div className="text-chrome">
                  {payment.currency}
                  {" "}
                  {(
                    payment.amountCents /
                    100
                  ).toFixed(
                    2
                  )}
                </div>
                <div className="text-chrome">
                  {payment.creditsToGrant}
                  {" "}
                  credits
                </div>
                <div className="text-chrome">
                  {payment.status}
                </div>
              </div>
            )
          )
        )}
      </div>
    </HudPanel>
  );
}

function Metric({
  label,
  value
}) {
  return (
    <div className="border border-white/10 bg-white/[0.02] p-4">
      <div className="font-mono text-xs uppercase tracking-[0.18em] text-chrome">
        {label}
      </div>
      <div className="mt-2 font-display text-2xl text-white">
        {value}
      </div>
    </div>
  );
}

function EmptyState({
  text
}) {
  return (
    <div className="border border-dashed border-white/15 p-4 font-body text-base text-chrome">
      {text}
    </div>
  );
}
