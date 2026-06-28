import { useEffect, useState } from "react";
import AuthPanel from "./AuthPanel";
import Logo from "./Logo";

const getDefaultRedirect = () => {
  if (window.location.hostname.startsWith("app.") || window.location.search.includes("app=1")) {
    return "/";
  }

  if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
    return "/?app=1";
  }

  return "https://app.intelrefinery.site/";
};

const getSafeRedirect = () => {
  const params =
    new URLSearchParams(
      window.location.search
    );
  const redirect =
    params.get("redirect");

  if (!redirect) {
    return getDefaultRedirect();
  }

  try {
    const url =
      new URL(
        redirect,
        window.location.origin
      );
    const allowedOrigins =
      new Set([
        window.location.origin,
        "https://app.intelrefinery.site"
      ]);

    if (!allowedOrigins.has(url.origin)) {
      return getDefaultRedirect();
    }

    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return getDefaultRedirect();
  }
};

export default function AuthPage({
  mode = "login"
}) {
  const [message, setMessage] =
    useState("");

  useEffect(
    () => {
      const params =
        new URLSearchParams(
          window.location.search
        );
      const error =
        params.get("error");
      if (error) {
        setMessage(
          error
        );
      }
    },
    []
  );

  return (
    <div className="min-h-screen bg-bg text-ink-2">
      <header className="border-b border-line bg-rail">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-5 sm:px-6 lg:px-8">
          <Logo />
          <a
            href={mode === "signup" ? "/login" : "/signup"}
            className="hud-button-secondary"
          >
            {mode === "signup"
              ? "Login"
              : "Sign Up"}
          </a>
        </div>
      </header>
      <main className="section-shell pt-12">
        <div className="mx-auto mb-6 max-w-xl">
          <div className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan">
            {mode === "signup"
              ? "Create account"
              : "Welcome back"}
          </div>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-ink-text">
            {mode === "signup"
              ? "Start refining intelligence"
              : "Log in to Intel Refinery"}
          </h1>
          <p className="mt-3 max-w-[64ch] text-sm leading-6 text-ink-4">
            Use Telegram OTP, Google, GitHub, or GitLab. Social sign-in opens in a small secure window and returns here automatically.
          </p>
        </div>
        <AuthPanel
          onAuthenticated={() =>
            window.location.assign(
              getSafeRedirect()
            )
          }
        />
        {message && (
          <div className="mx-auto mt-4 max-w-xl rounded-lg border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-100">
            {message}
          </div>
        )}
      </main>
    </div>
  );
}
