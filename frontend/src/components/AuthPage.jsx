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
    <div className="min-h-screen bg-void text-white">
      <header className="border-b border-neon/15 bg-void/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-5 sm:px-6 lg:px-8">
          <a href="/">
            <Logo />
          </a>
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
      <main className="section-shell pt-10">
        <div className="mx-auto mb-6 max-w-xl">
          <div className="font-mono text-sm uppercase tracking-[0.18em] text-glow">
            {mode === "signup"
              ? "Create account"
              : "Welcome back"}
          </div>
          <h1 className="mt-3 font-display text-4xl text-white">
            {mode === "signup"
              ? "Start refining intelligence"
              : "Log in to Intel Refinery"}
          </h1>
          <p className="mt-3 font-body text-base text-chrome">
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
          <div className="mx-auto mt-4 max-w-xl font-body text-base text-red-100">
            {message}
          </div>
        )}
      </main>
    </div>
  );
}
