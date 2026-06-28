import React, {
  useEffect,
  useRef,
  useState
} from "react";
import {
  ArrowRight,
  KeyRound,
  Send
} from "lucide-react";
import {
  api,
  API_BASE_URL,
  storeSessionToken
} from "../lib/api";
import HudPanel from "./HudPanel";

// ── Social sign-in button ────────────────────────────────────────────────────
function OAuthButton({
  href,
  logo,
  label,
  bgClass
}) {
  return (
    <a
      href={href}
      className={`flex w-full items-center justify-center gap-3 border border-white/10 px-4 py-3 font-mono text-sm uppercase tracking-[0.15em] text-white transition hover:border-neon/50 hover:bg-white/5 ${bgClass ?? ""}`}
    >
      {logo}
      <span>{label}</span>
    </a>
  );
}

// Simple inline SVG logos so we don't need an icon library
const GitHubLogo = () => (
  <svg
    viewBox="0 0 24 24"
    className="h-5 w-5 fill-current"
    aria-hidden="true"
  >
    <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.385-1.335-1.755-1.335-1.755-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
  </svg>
);

const GitLabLogo = () => (
  <svg
    viewBox="0 0 24 24"
    className="h-5 w-5 fill-current"
    aria-hidden="true"
  >
    <path d="M22.65 14.39L12 22.13 1.35 14.39a.84.84 0 01-.3-.94l1.22-3.78 2.44-7.51A.42.42 0 014.82 2a.43.43 0 01.58 0 .42.42 0 01.11.18l2.44 7.49h8.1l2.44-7.49a.42.42 0 01.11-.18.43.43 0 01.58 0 .42.42 0 01.11.18l2.44 7.51L23 13.45a.84.84 0 01-.35.94z" />
  </svg>
);

// ── Main component ───────────────────────────────────────────────────────────
export default function AuthPanel({
  onAuthenticated
}) {
  const [code, setCode] =
    useState("");
  const [status, setStatus] =
    useState("");
  const [busy, setBusy] =
    useState(false);
  const googleButtonRef =
    useRef(null);

  // Google Sign In
  useEffect(
    () => {
      const clientId =
        import.meta.env
          .VITE_GOOGLE_CLIENT_ID;

      if (!clientId) {
        return undefined;
      }

      let canceled = false;

      const initializeGoogle =
        () => {
          if (
            canceled ||
            !window.google ||
            !googleButtonRef.current
          ) {
            return;
          }

          window.google.accounts.id.initialize(
            {
              client_id:
                clientId,
              callback:
                async (
                  response
                ) => {
                  setBusy(true);
                  setStatus("");
                  try {
                    const result =
                      await api.googleSignIn(
                        response.credential
                      );
                    storeSessionToken(
                      result.session.token
                    );
                    onAuthenticated();
                  } catch (
                    error
                  ) {
                    setStatus(
                      error.message
                    );
                  } finally {
                    setBusy(false);
                  }
                }
            }
          );

          googleButtonRef.current.innerHTML =
            "";
          window.google.accounts.id.renderButton(
            googleButtonRef.current,
            {
              theme:
                "filled_black",
              size:
                "large",
              shape:
                "rectangular",
              width:
                420,
              text:
                "signin_with"
            }
          );
        };

      if (window.google) {
        initializeGoogle();
      } else {
        const intervalId =
          window.setInterval(
            () => {
              if (window.google) {
                window.clearInterval(
                  intervalId
                );
                initializeGoogle();
              }
            },
            100
          );

        return () => {
          canceled = true;
          window.clearInterval(
            intervalId
          );
        };
      }

      return () => {
        canceled = true;
      };
    },
    [onAuthenticated]
  );

  const handleSubmit =
    async (event) => {
      event.preventDefault();
      setBusy(true);
      setStatus("");

      try {
        const result =
          await api.verifyTelegramOtp(
            code
          );
        storeSessionToken(
          result.session.token
        );
        onAuthenticated();
      } catch (error) {
        setStatus(error.message);
      } finally {
        setBusy(false);
      }
    };

  return (
    <HudPanel className="mx-auto max-w-xl">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <KeyRound className="h-5 w-5 text-neon" />
        <div className="font-mono text-base uppercase tracking-[0.2em] text-glow">
          Console Sign In
        </div>
      </div>

      {/* ── Telegram OTP ─────────────────────────────────────── */}
      <div className="mb-2 rounded border border-neon/10 bg-neon/5 px-4 py-3">
        <div className="mb-1 flex items-center gap-2">
          <Send className="h-4 w-4 text-neon" />
          <span className="font-mono text-xs uppercase tracking-[0.18em] text-neon">
            Get your OTP via Telegram
          </span>
        </div>
        <p className="font-body text-sm text-chrome">
          Message{" "}
          <a
            href="https://t.me/dispute_analyzer_bot"
            target="_blank"
            rel="noreferrer"
            className="text-neon underline-offset-2 hover:underline"
          >
            @dispute_analyzer_bot
          </a>{" "}
          on Telegram and send the{" "}
          <span className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-xs text-white">
            /otp
          </span>{" "}
          command to receive your 6-digit code.
        </p>
      </div>

      <form
        className="space-y-4"
        onSubmit={handleSubmit}
      >
        <label className="block">
          <span className="mb-2 block font-mono text-sm uppercase tracking-[0.18em] text-chrome">
            Telegram OTP
          </span>
          <input
            value={code}
            onChange={(event) =>
              setCode(
                event.target.value
              )
            }
            inputMode="numeric"
            maxLength={6}
            placeholder="Enter 6-digit code"
            className="w-full border border-neon/25 bg-black/30 px-4 py-3 font-mono text-lg tracking-[0.3em] text-white outline-none transition focus:border-neon"
          />
        </label>

        {status && (
          <div className="border border-red-400/30 bg-red-400/10 px-4 py-3 font-body text-base text-red-100">
            {status}
          </div>
        )}

        <button
          type="submit"
          className="hud-button w-full"
          disabled={
            busy ||
            code.length !== 6
          }
        >
          {busy
            ? "Verifying…"
            : "Enter Console"}
          <ArrowRight className="h-4 w-4" />
        </button>
      </form>

      {/* ── Divider ──────────────────────────────────────────── */}
      <div className="my-5 flex items-center gap-3">
        <div className="h-px flex-1 bg-white/10" />
        <div className="font-mono text-xs uppercase tracking-[0.18em] text-chrome">
          Or sign in with
        </div>
        <div className="h-px flex-1 bg-white/10" />
      </div>

      {/* ── Social buttons ───────────────────────────────────── */}
      <div className="space-y-3">
        {/* Google — rendered by the GIS SDK */}
        <div
          ref={googleButtonRef}
          className="flex min-h-11 justify-center"
        />

        {/* GitHub */}
        <OAuthButton
          href={`${API_BASE_URL}/auth/github`}
          logo={<GitHubLogo />}
          label="Continue with GitHub"
        />

        {/* GitLab */}
        <OAuthButton
          href={`${API_BASE_URL}/auth/gitlab`}
          logo={<GitLabLogo />}
          label="Continue with GitLab"
        />
      </div>
    </HudPanel>
  );
}
